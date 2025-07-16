import { useEffect, useRef, forwardRef, useImperativeHandle, useState, useCallback } from 'react';
import WaveSurfer from 'wavesurfer.js';
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
  ({ audioUrl, onReady, onProgress, className = '' }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const wavesurferRef = useRef<WaveSurfer | null>(null);
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
      wavesurfer: wavesurferRef.current,
      play: () => wavesurferRef.current?.play(),
      pause: () => wavesurferRef.current?.pause(),
      seekTo: (progress: number) => wavesurferRef.current?.seekTo(progress),
    }));

    const setupAudioAnalyser = useCallback(async () => {
      const howl = getCurrentHowl();
      if (!howl) {
        console.log('❌ No Howl instance available');
        return false;
      }

      // Check if we're already connected to this Howl instance
      if (connectedHowlRef.current === howl && analyserRef.current && sourceNodeRef.current) {
        console.log('✅ Already connected to current Howl instance');
        return true;
      }

      console.log('🎵 Setting up audio analyser...');

      try {
        // Auto-create AudioContext if not exists
        if (!audioContextRef.current) {
          try {
            audioContextRef.current = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
            console.log('🔊 Auto-created AudioContext');
          } catch (error) {
            console.log('⚠️ Failed to auto-create AudioContext:', error);
            return false;
          }
        }

        if (audioContextRef.current.state === 'suspended') {
          await audioContextRef.current.resume();
          console.log('▶️ Resumed AudioContext');
        }

        // Clean up previous connections more thoroughly
        if (sourceNodeRef.current) {
          try {
            sourceNodeRef.current.disconnect();
            console.log('🧹 Disconnected previous source');
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
            console.log('🧹 Cleared connection marker and source node from previous audio node');
          }
        }

        if (!analyserRef.current) {
          analyserRef.current = audioContextRef.current.createAnalyser();
          analyserRef.current.fftSize = 512;
          analyserRef.current.smoothingTimeConstant = 0.8;

          const bufferLength = analyserRef.current.frequencyBinCount;
          dataArrayRef.current = new Uint8Array(bufferLength);
          console.log('📊 Analyser configured with', bufferLength, 'frequency bins');
        }

        // Try to get Howler's internal audio node
        const howlNode = (howl as Howl & { _sounds?: Array<{ _node?: HTMLAudioElement & { audioSourceNode?: MediaElementAudioSourceNode | null } }> })._sounds?.[0]?._node;
        if (howlNode) {
          console.log('🎯 Found Howler audio node');
          try {
            // Only reuse connection if it's the SAME Howl instance
            if (connectedHowlRef.current === howl && howlNode.getAttribute && howlNode.getAttribute('data-connected') === 'true') {
              console.log('✅ Same Howl instance, reusing existing connection');
              return true;
            } else {
              // New track - need fresh connection
              if (howlNode.getAttribute && howlNode.getAttribute('data-connected') === 'true') {
                console.log('🔄 Different track but node marked connected, clearing and reconnecting');
                howlNode.removeAttribute('data-connected');
              }
              
              // Clear any existing source node reference for this audio element
              if (howlNode.audioSourceNode) {
                console.log('🧹 Clearing existing source node reference for new connection');
                howlNode.audioSourceNode = null;
              }
              
              // Attempt connection but don't fail if it doesn't work
              try {
                // Check if this audio element already has a source node
                if (howlNode.audioSourceNode) {
                  console.log('⚠️ Audio element already has source node, reusing it');
                  sourceNodeRef.current = howlNode.audioSourceNode;
                } else {
                  try {
                    sourceNodeRef.current = audioContextRef.current.createMediaElementSource(howlNode);
                    howlNode.audioSourceNode = sourceNodeRef.current;
                    console.log('🎵 Created new MediaElementSource');
                  } catch (sourceError) {
                    console.log('⚠️ Failed to create MediaElementSource:', sourceError);
                    return false;
                  }
                }

                // Always connect for visualization, but don't interfere with original audio
                try {
                  // Connect source to analyser for visualization data
                  sourceNodeRef.current.connect(analyserRef.current);
                  
                  // Also connect to destination to ensure audio continues to play
                  sourceNodeRef.current.connect(audioContextRef.current.destination);
                  
                  console.log('✅ Connected audio source to both analyser and destination');
                } catch (connectionError) {
                  console.log('⚠️ Connection failed:', connectionError);
                  // If connection fails, audio should still work through Howler's normal routing
                }

                if (howlNode.setAttribute) {
                  howlNode.setAttribute('data-connected', 'true');
                }

                connectedHowlRef.current = howl;
                console.log('✅ Connected to Howler audio node with gain routing');
                return true;
              } catch (connectionError) {
                console.log('⚠️ Connection failed but continuing with fallback:', connectionError);
                // Even if connection fails, we can still show fallback visualizer
                connectedHowlRef.current = howl;
                return false;
              }
            }
          } catch (nodeError) {
            console.log('⚠️ Howler node access failed:', nodeError);
          }
        }

        console.log('❌ Could not connect to audio source, using fallback visualizer');
        return false;
      } catch (error) {
        console.error('❌ Audio analyser setup failed:', error);
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
      if (!containerRef.current) return;

      wavesurferRef.current = WaveSurfer.create({
        container: containerRef.current,
        waveColor: 'rgba(147, 51, 234, 0.4)',
        progressColor: 'transparent',
        cursorColor: 'transparent',
        barWidth: 2,
        barRadius: 1,
        barGap: 1,
        height: 80,
        normalize: true,
        interact: false,
      });

      const ws = wavesurferRef.current;

      ws.on('ready', async () => {
        setIsReady(true);
        await setupAudioAnalyser();
        onReady?.();
      });

      ws.on('audioprocess', () => {
        if (ws.getDuration() > 0) {
          onProgress?.(ws.getCurrentTime() / ws.getDuration());
        }
      });

      ws.on('seeking', () => {
        if (ws.getDuration() > 0) {
          onProgress?.(ws.getCurrentTime() / ws.getDuration());
        }
      });

      return () => {
        if (isCleaningUpRef.current) return; // Prevent multiple cleanup calls
        isCleaningUpRef.current = true;
        
        console.log('🧹 Starting component cleanup');
        
        if (animationFrameRef.current !== null) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
        
        if (sourceNodeRef.current) {
          try {
            sourceNodeRef.current.disconnect();
            console.log('🧹 Cleanup: Disconnected source node');
          } catch {
            // Ignore disconnection errors
          }
          sourceNodeRef.current = null;
        }
        
        if (wavesurferRef.current) {
          try {
            wavesurferRef.current.destroy();
            console.log('🧹 Cleanup: Destroyed wavesurfer');
          } catch {
            // Ignore errors
          }
          wavesurferRef.current = null;
        }
        
        // Only close AudioContext if it exists and isn't already closed
        if (audioContextRef.current) {
          try {
            if (audioContextRef.current.state !== 'closed') {
              audioContextRef.current.close();
              console.log('🧹 Cleanup: Closed AudioContext');
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
    }, [onReady, onProgress]);

    useEffect(() => {
      if (audioUrl && wavesurferRef.current) {
        wavesurferRef.current.load(audioUrl);
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


    return (
      <div className={`waveform-container ${className}`}>
        <div ref={containerRef} className="w-full hidden opacity-0 absolute pointer-events-none" />
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