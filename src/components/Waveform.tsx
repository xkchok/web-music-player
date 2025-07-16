import { useEffect, useRef, forwardRef, useImperativeHandle, useState, useCallback } from 'react';
import { Howl } from 'howler';
import { useAudio } from '../contexts/AudioContext';
import type { WaveformRef } from '../types';

interface WaveformProps {
  audioUrl?: string;
  onReady?: () => void;
  onProgress?: (progress: number) => void;
  className?: string;
}

export const Waveform = forwardRef<WaveformRef, WaveformProps>(
  ({ audioUrl, onReady, className = '' }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameRef = useRef<number | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const dataArrayRef = useRef<Uint8Array | null>(null);
    const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
    const connectedHowlRef = useRef<Howl | null>(null);
    const { isPlaying, getCurrentHowl } = useAudio();
    const [isReady, setIsReady] = useState(false);
    const isCleaningUpRef = useRef(false);

    useImperativeHandle(ref, () => ({
      // WaveformRef interface no longer needs WaveSurfer methods
    }));

    const setupAudioAnalyser = useCallback(async () => {
      const howl = getCurrentHowl();
      if (!howl) {
        console.log('❌ No Howl instance available');
        return false;
      }


      // Check if we're already connected to this Howl instance with a working MediaElementSource
      if (connectedHowlRef.current === howl && analyserRef.current && sourceNodeRef.current) {
        return true;
      }

      try {
        // Auto-create AudioContext if not exists
        if (!audioContextRef.current) {
          try {
            audioContextRef.current = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
          } catch (error) {
            return false;
          }
        }

        if (audioContextRef.current.state === 'suspended') {
          await audioContextRef.current.resume();
        }

        // Clean up previous connections more thoroughly
        if (sourceNodeRef.current) {
          try {
            sourceNodeRef.current.disconnect();
          } catch {
            // Ignore disconnection errors
          }
          sourceNodeRef.current = null;
        }
        
        // Clear connection markers from previous audio nodes
        if (connectedHowlRef.current && connectedHowlRef.current !== howl) {
          const prevHowlNode = (connectedHowlRef.current as Howl & { _sounds?: Array<{ _node?: HTMLAudioElement & { audioSourceNode?: MediaElementAudioSourceNode | null } }> })._sounds?.[0]?._node;
          if (prevHowlNode) {
            if (prevHowlNode.removeAttribute) {
              prevHowlNode.removeAttribute('data-connected');
            }
            // Clear the source node reference
            prevHowlNode.audioSourceNode = null;
          }
        }

        if (!analyserRef.current) {
          analyserRef.current = audioContextRef.current.createAnalyser();
          analyserRef.current.fftSize = 512;
          analyserRef.current.smoothingTimeConstant = 0.8;

          const bufferLength = analyserRef.current.frequencyBinCount;
          dataArrayRef.current = new Uint8Array(bufferLength);
        }

        // Try to get Howler's internal audio node
        const howlNode = (howl as Howl & { _sounds?: Array<{ _node?: HTMLAudioElement & { audioSourceNode?: MediaElementAudioSourceNode | null } }> })._sounds?.[0]?._node;
        if (howlNode) {
          try {
            // Only reuse connection if it's the SAME Howl instance AND we have a source node
            if (connectedHowlRef.current === howl && howlNode.getAttribute && howlNode.getAttribute('data-connected') === 'true' && sourceNodeRef.current) {
              return true;
            } else {
              // New track - need fresh connection
              if (howlNode.getAttribute && howlNode.getAttribute('data-connected') === 'true') {
                howlNode.removeAttribute('data-connected');
              }
              
              // Clear any existing source node reference for this audio element
              if (howlNode.audioSourceNode) {
                howlNode.audioSourceNode = null;
              }
              
              // Create MediaElementSource when audio is ready
              if (howlNode.readyState >= 2) { // HAVE_CURRENT_DATA or higher
                try {
                  // Check if this audio element already has a source node
                  if (howlNode.audioSourceNode) {
                    sourceNodeRef.current = howlNode.audioSourceNode;
                  } else {
                    try {
                      sourceNodeRef.current = audioContextRef.current.createMediaElementSource(howlNode);
                      howlNode.audioSourceNode = sourceNodeRef.current;
                    } catch (sourceError) {
                      return false;
                    }
                  }

                  // Connect to both analyser and destination to maintain audio output
                  try {
                    // Connect source to analyser for visualization data
                    sourceNodeRef.current.connect(analyserRef.current);
                    
                    // MUST connect to destination because createMediaElementSource disconnects default routing
                    sourceNodeRef.current.connect(audioContextRef.current.destination);
                  } catch (connectionError) {
                    // If connection fails, audio should still work through Howler's normal routing
                  }
                } catch (connectionError) {
                  // Even if connection fails, we can still show fallback visualizer
                  connectedHowlRef.current = howl;
                  return false;
                }
              } else {
                // Don't create MediaElementSource if audio isn't ready
                connectedHowlRef.current = howl;
                return false;
              }

              if (howlNode.setAttribute) {
                howlNode.setAttribute('data-connected', 'true');
              }

              connectedHowlRef.current = howl;
              return true;
            }
          } catch (nodeError) {
            // Howler node access failed
          }
        }

        return false;
      } catch (error) {
        return false;
      }
    }, [getCurrentHowl]);

    const isPlayingRef = useRef(isPlaying);
    isPlayingRef.current = isPlaying;

    const drawFrequencyBars = useCallback(() => {
      if (!canvasRef.current) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Create a dark background with subtle gradient
      const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      bgGradient.addColorStop(0, 'rgba(0, 0, 0, 0.2)');
      bgGradient.addColorStop(1, 'rgba(0, 0, 0, 0.4)');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const hasRealAudioData = analyserRef.current && dataArrayRef.current && sourceNodeRef.current;
      
      // Try to get real frequency data
      if (hasRealAudioData) {
        analyserRef.current!.getByteFrequencyData(dataArrayRef.current!);

        const barCount = 96; // More bars for smoother look
        const barSpacing = 2;
        const barWidth = (canvas.width - (barCount - 1) * barSpacing) / barCount;
        const dataStep = Math.floor(dataArrayRef.current!.length / barCount);

        // Always draw real frequency data when connected (even during silent parts)
        for (let i = 0; i < barCount; i++) {
          const dataIndex = i * dataStep;
          const normalizedValue = dataArrayRef.current![dataIndex] / 255;
          const barHeight = normalizedValue * canvas.height * 0.85;
          const x = i * (barWidth + barSpacing);

          // Create a more sophisticated gradient
          const gradient = ctx.createLinearGradient(0, canvas.height - barHeight, 0, canvas.height);

          // Vary colors based on frequency position and amplitude
          const hue = 280 + (i / barCount) * 80; // Purple to pink spectrum
          const saturation = 70 + normalizedValue * 30; // More saturated with higher amplitude
          const lightness = 45 + normalizedValue * 25; // Brighter with higher amplitude

          gradient.addColorStop(0, `hsla(${hue}, ${saturation}%, ${lightness + 20}%, 0.9)`);
          gradient.addColorStop(0.6, `hsla(${hue}, ${saturation}%, ${lightness}%, 0.8)`);
          gradient.addColorStop(1, `hsla(${hue}, ${saturation}%, ${lightness - 10}%, 0.6)`);

          ctx.fillStyle = gradient;

          // Draw rounded bars
          ctx.beginPath();
          const radius = barWidth / 2;
          ctx.roundRect(x, canvas.height - barHeight, barWidth, barHeight, radius);
          ctx.fill();

          // Add glow effect for higher frequencies
          if (normalizedValue > 0.5) {
            ctx.shadowColor = `hsla(${hue}, ${saturation}%, ${lightness}%, 0.6)`;
            ctx.shadowBlur = 10;
            ctx.fill();
            ctx.shadowBlur = 0;
          }
        }
      } else {
        // Fallback visualization when not connected to audio analyser
        const barCount = 96;
        const barSpacing = 2;
        const barWidth = (canvas.width - (barCount - 1) * barSpacing) / barCount;
        const time = Date.now() * 0.003; // Slow animation
        
        for (let i = 0; i < barCount; i++) {
          // Create a wave-like pattern
          const wave = Math.sin(time + i * 0.3) * 0.5 + 0.5;
          const barHeight = wave * canvas.height * 0.4; // Medium height bars for fallback
          const x = i * (barWidth + barSpacing);

          const hue = 280 + (i / barCount) * 80; // Purple to pink spectrum
          const gradient = ctx.createLinearGradient(0, canvas.height - barHeight, 0, canvas.height);
          gradient.addColorStop(0, `hsla(${hue}, 60%, 50%, 0.7)`);
          gradient.addColorStop(1, `hsla(${hue}, 60%, 30%, 0.5)`);

          ctx.fillStyle = gradient;
          ctx.beginPath();
          const radius = barWidth / 2;
          ctx.roundRect(x, canvas.height - barHeight, barWidth, barHeight, radius);
          ctx.fill();
        }
      }

      // Continue animation loop if playing, regardless of connection state
      if (isPlayingRef.current) {
        animationFrameRef.current = requestAnimationFrame(drawFrequencyBars);
      } else {
        // Clear the animation frame ref when not playing
        animationFrameRef.current = null;
      }
    }, []);

    useEffect(() => {
      
      // Reset cleanup flag for new mount
      isCleaningUpRef.current = false;
      
      // Simple ready state - just set ready immediately since we don't need WaveSurfer
      setIsReady(true);
      setupAudioAnalyser();
      onReady?.();

      return () => {
        if (isCleaningUpRef.current) {
          return;
        }
        isCleaningUpRef.current = true;
        
        if (animationFrameRef.current !== null) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
        
        if (sourceNodeRef.current) {
          try {
            sourceNodeRef.current.disconnect();
          } catch {
            // Ignore disconnection errors
          }
          sourceNodeRef.current = null;
        }
        
        // Only close AudioContext if it exists and isn't already closed
        if (audioContextRef.current) {
          try {
            if (audioContextRef.current.state !== 'closed') {
              audioContextRef.current.close();
            } else {
              console.log('ℹ️ AudioContext already closed, skipping');
            }
          } catch (error) {
            console.log('⚠️ Failed to close AudioContext:', error);
          }
          audioContextRef.current = null;
        }
        
        connectedHowlRef.current = null;
      };
    }, []);

    useEffect(() => {
      if (audioUrl) {
        // Reset connection state for new track
        connectedHowlRef.current = null;
      }
    }, [audioUrl]);

    useEffect(() => {
      if (isPlaying && isReady) {
        // Only start if not already running
        if (animationFrameRef.current === null) {
          drawFrequencyBars();
        }
      } else {
        if (animationFrameRef.current !== null) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
      }
    }, [isPlaying, isReady, drawFrequencyBars]);

    // Restart animation when audio connection changes while playing
    useEffect(() => {
      if (isPlaying && isReady && !animationFrameRef.current) {
        drawFrequencyBars();
      }
    }, [isPlaying, isReady, drawFrequencyBars]);

    // Try to connect to audio source when playback starts
    useEffect(() => {
      if (isPlaying && isReady) {
        // Try to setup audio analyser again when playing starts
        setupAudioAnalyser();
      }
    }, [isPlaying, isReady]);


    return (
      <div className={`waveform-container ${className}`}>
        {isReady && (
          <div className="relative">
            <canvas
              ref={canvasRef}
              width={800}
              height={120}
              className="w-full h-20 rounded-xl border border-white/5 transition-all duration-300 shadow-2xl"
              style={{
                imageRendering: 'auto',
                background: 'linear-gradient(135deg, rgba(0,0,0,0.3) 0%, rgba(20,20,30,0.4) 100%)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1), 0 8px 32px rgba(0,0,0,0.3)'
              }}
            />
          </div>
        )}
      </div>
    );
  }
);

Waveform.displayName = 'Waveform';