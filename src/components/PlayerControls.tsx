import { motion } from 'framer-motion';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX 
} from 'lucide-react';
import { useAudio } from '../contexts/AudioContext';
import { formatTime } from '../utils/formatTime';

export function PlayerControls() {
  const { 
    isPlaying, 
    currentTrack, 
    currentTime,
    duration,
    volume, 
    setVolume, 
    pause, 
    resume, 
    nextTrack, 
    previousTrack,
    seekTo 
  } = useAudio();

  const isMuted = volume === 0;
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const togglePlay = () => {
    if (isPlaying) {
      pause();
    } else {
      resume();
    }
  };

  const toggleMute = () => {
    if (isMuted) {
      setVolume(0.8);
    } else {
      setVolume(0);
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!currentTrack || duration === 0) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const progressPercentage = clickX / rect.width;
    const newTime = progressPercentage * duration;
    
    seekTo(newTime);
  };

  return (
    <div className="space-y-4">
      {/* Progress Bar */}
      {currentTrack && (
        <div className="px-4">
          <div 
            className="relative h-2 bg-white/20 rounded-full cursor-pointer group"
            onClick={handleProgressClick}
          >
            <div 
              className="absolute h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full transition-all duration-200 group-hover:h-3 group-hover:-mt-0.5"
              style={{ width: `${progress}%` }}
            />
            <div 
              className="absolute w-3 h-3 bg-white rounded-full shadow-lg transform -translate-x-1/2 -translate-y-1/2 top-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              style={{ left: `${progress}%` }}
            />
          </div>
          
          <div className="flex justify-between text-sm text-white/60 mt-2">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center justify-center space-x-4 p-4">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={previousTrack}
          className="p-3 rounded-full glass hover:bg-white/20 transition-colors"
          disabled={!currentTrack}
        >
          <SkipBack className="w-5 h-5 text-white" />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={togglePlay}
          className="p-4 rounded-full bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-600 hover:to-accent-600 transition-all shadow-lg"
          disabled={!currentTrack}
        >
          {isPlaying ? (
            <Pause className="w-6 h-6 text-white" />
          ) : (
            <Play className="w-6 h-6 text-white ml-1" />
          )}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={nextTrack}
          className="p-3 rounded-full glass hover:bg-white/20 transition-colors"
          disabled={!currentTrack}
        >
          <SkipForward className="w-5 h-5 text-white" />
        </motion.button>

        <div className="flex items-center space-x-2 ml-8">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleMute}
            className="p-2 rounded-full glass hover:bg-white/20 transition-colors"
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-white" />
            ) : (
              <Volume2 className="w-4 h-4 text-white" />
            )}
          </motion.button>

          <div className="relative w-24">
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right, 
                  rgb(147 51 234 / 0.8) 0%, 
                  rgb(147 51 234 / 0.8) ${volume * 100}%, 
                  rgb(255 255 255 / 0.2) ${volume * 100}%, 
                  rgb(255 255 255 / 0.2) 100%)`
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}