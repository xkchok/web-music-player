import React from 'react';
import { motion } from 'framer-motion';
import { useAudio } from '../contexts/AudioContext';

export const TrackInfo = React.memo(function TrackInfo() {
  const { currentTrack, isLoading } = useAudio();

  if (!currentTrack) {
    return (
      <div className="text-center text-white/60 p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-lg"
        >
          Select a track to start playing
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center text-white p-6"
    >
      <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
        {currentTrack.title}
      </h2>
      <p className="text-white/70 mb-4">{currentTrack.artist}</p>
      
      {isLoading && (
        <div className="flex items-center justify-center space-x-2">
          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      )}
    </motion.div>
  );
});