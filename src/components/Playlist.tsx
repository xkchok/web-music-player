import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Music, Search } from 'lucide-react';
import { useAudio } from '../contexts/AudioContext';
import { formatTime } from '../utils/formatTime';

// Utility function to highlight search matches
function HighlightText({ text, searchQuery }: { text: string; searchQuery: string }) {
  if (!searchQuery.trim()) {
    return <>{text}</>;
  }

  const query = searchQuery.trim();
  const regex = new RegExp(`(${query})`, 'gi');
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, index) => 
        regex.test(part) ? (
          <span key={index} className="bg-primary-400/30 text-primary-200 rounded px-1">
            {part}
          </span>
        ) : (
          part
        )
      )}
    </>
  );
}

export const Playlist = React.memo(function Playlist() {
  const { 
    playlist, 
    currentTrack, 
    playTrack, 
    removeFromPlaylist,
    isPlaying 
  } = useAudio();

  const [searchQuery, setSearchQuery] = useState('');

  // Filter tracks based on search query
  const filteredTracks = useMemo(() => {
    if (!searchQuery.trim()) {
      return playlist;
    }

    const query = searchQuery.toLowerCase().trim();
    
    return playlist.filter(track => {
      // Always show current track regardless of search
      if (currentTrack && track.id === currentTrack.id) {
        return true;
      }

      // Search in title, artist, and filename
      const title = track.title.toLowerCase();
      const artist = track.artist.toLowerCase();
      const filename = track.file?.name?.toLowerCase() || '';
      
      return title.includes(query) || 
             artist.includes(query) || 
             filename.includes(query);
    });
  }, [playlist, searchQuery, currentTrack]);

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
      
      {/* Search Input */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
        <input
          type="text"
          placeholder="Search your music..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-10 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-colors"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-white/10 rounded transition-colors"
          >
            <X className="w-3 h-3 text-white/60" />
          </button>
        )}
      </div>

      {/* Search Results Counter */}
      {searchQuery && (
        <div className="text-xs text-white/50 mb-2">
          {filteredTracks.length === 0 ? (
            'No tracks found'
          ) : (
            `${filteredTracks.length} of ${playlist.length} tracks`
          )}
        </div>
      )}
      
      {/* Empty Search State */}
      {searchQuery && filteredTracks.length === 0 ? (
        <div className="text-center py-8">
          <Search className="w-8 h-8 text-white/30 mx-auto mb-2" />
          <p className="text-white/50">No tracks match "{searchQuery}"</p>
          <p className="text-white/30 text-sm mt-1">Try a different search term</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
        <AnimatePresence>
          {filteredTracks.map((track, index) => {
            const isCurrentTrack = currentTrack?.id === track.id;
            
            return (
              <motion.div
                key={track.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05 }}
                className={`playlist-item flex items-center p-3 rounded-lg transition-colors cursor-pointer group ${
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
                    <HighlightText text={track.title} searchQuery={searchQuery} />
                  </p>
                  <p className="text-white/60 text-sm truncate">
                    <HighlightText text={track.artist} searchQuery={searchQuery} />
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
      )}
    </div>
  );
});