import { motion, AnimatePresence } from 'framer-motion';
import { X, Music } from 'lucide-react';
import { useAudio } from '../contexts/AudioContext';
import { formatTime } from '../utils/formatTime';

export function Playlist() {
  const { 
    playlist, 
    currentTrack, 
    playTrack, 
    removeFromPlaylist,
    isPlaying 
  } = useAudio();

  if (playlist.length === 0) {
    return (
      <div className="glass rounded-xl p-6 text-center">
        <div className="flex flex-col items-center space-y-4 text-white/60">
          <Music className="w-12 h-12" />
          <p>Your playlist is empty</p>
          <p className="text-sm">Upload some music to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-xl p-6">
      <h3 className="text-xl font-semibold text-white mb-4">Playlist</h3>
      
      <div className="space-y-2 max-h-96 overflow-y-auto">
        <AnimatePresence>
          {playlist.map((track, index) => {
            const isCurrentTrack = currentTrack?.id === track.id;
            
            return (
              <motion.div
                key={track.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05 }}
                className={`flex items-center p-3 rounded-lg transition-colors cursor-pointer group ${
                  isCurrentTrack 
                    ? 'bg-gradient-to-r from-primary-500/20 to-accent-500/20' 
                    : 'hover:bg-white/10'
                }`}
                onClick={() => playTrack(track)}
              >
                <div className="flex-1 min-w-0">
                  <p className={`font-medium truncate ${
                    isCurrentTrack ? 'text-white' : 'text-white/90'
                  }`}>
                    {track.title}
                  </p>
                  <p className="text-white/60 text-sm truncate">
                    {track.artist}
                  </p>
                </div>
                
                <div className="flex items-center space-x-2">
                  {track.duration > 0 && (
                    <span className="text-white/60 text-sm">
                      {formatTime(track.duration)}
                    </span>
                  )}
                  
                  {isCurrentTrack && isPlaying && (
                    <div className="flex space-x-1">
                      <div className="w-1 h-4 bg-primary-400 rounded animate-pulse" />
                      <div className="w-1 h-4 bg-accent-400 rounded animate-pulse" style={{ animationDelay: '0.2s' }} />
                      <div className="w-1 h-4 bg-primary-400 rounded animate-pulse" style={{ animationDelay: '0.4s' }} />
                    </div>
                  )}
                  
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFromPlaylist(track.id);
                    }}
                    className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-500/20 transition-all"
                  >
                    <X className="w-4 h-4 text-red-400" />
                  </motion.button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}