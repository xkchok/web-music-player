import { useRef } from 'react';
import { motion } from 'framer-motion';
import { AudioProvider, useAudio } from './contexts/AudioContext';
import { Waveform } from './components/Waveform';
import { PlayerControls } from './components/PlayerControls';
import { TrackInfo } from './components/TrackInfo';
import { FileUpload } from './components/FileUpload';
import { Playlist } from './components/Playlist';
import type { WaveformRef } from './types';

function AudioPlayer() {
  const { currentTrack } = useAudio();
  const waveformRef = useRef<WaveformRef>(null);

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-400 via-accent-400 to-primary-400 bg-clip-text text-transparent mb-2">
            Audio Player
          </h1>
          <p className="text-white/60">Experience your music with stunning visualizations</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="glass rounded-xl p-6 relative overflow-hidden"
              style={{
                backgroundImage: currentTrack?.albumArt ? `url(${currentTrack.albumArt})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
              }}
            >
              {currentTrack?.albumArt && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-xl" />
              )}
              <div className="relative z-10">
                <TrackInfo />
                
                {currentTrack && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mt-6"
                  >
                    <Waveform
                      ref={waveformRef}
                      audioUrl={currentTrack.url}
                      className="mb-6"
                    />
                  </motion.div>
                )}
                
                <PlayerControls />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <FileUpload />
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Playlist />
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <AudioProvider>
      <AudioPlayer />
    </AudioProvider>
  );
}

export default App;
