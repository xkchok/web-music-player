import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { Howl } from 'howler';
import type { Track, AudioState, RepeatMode } from '../types';

interface AudioContextType extends AudioState {
  playTrack: (track: Track) => void;
  pause: () => void;
  resume: () => void;
  nextTrack: () => void;
  previousTrack: () => void;
  setVolume: (volume: number) => void;
  seekTo: (time: number) => void;
  addToPlaylist: (tracks: Track[]) => void;
  removeFromPlaylist: (trackId: string) => void;
  getCurrentHowl: () => Howl | null;
  toggleShuffle: () => void;
  setRepeatMode: (mode: RepeatMode) => void;
}

type AudioAction =
  | { type: 'SET_PLAYING'; payload: boolean }
  | { type: 'SET_CURRENT_TRACK'; payload: Track | null }
  | { type: 'SET_CURRENT_TIME'; payload: number }
  | { type: 'SET_DURATION'; payload: number }
  | { type: 'SET_VOLUME'; payload: number }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_PLAYLIST'; payload: Track[] }
  | { type: 'ADD_TO_PLAYLIST'; payload: Track[] }
  | { type: 'REMOVE_FROM_PLAYLIST'; payload: string }
  | { type: 'SET_CURRENT_INDEX'; payload: number }
  | { type: 'TOGGLE_SHUFFLE' }
  | { type: 'SET_REPEAT_MODE'; payload: RepeatMode }
  | { type: 'SET_SHUFFLED_INDICES'; payload: number[] };

const initialState: AudioState = {
  isPlaying: false,
  currentTrack: null,
  currentTime: 0,
  duration: 0,
  volume: 0.8,
  isLoading: false,
  playlist: [],
  currentIndex: -1,
  isShuffled: false,
  repeatMode: 'none',
  shuffledIndices: [],
};

function audioReducer(state: AudioState, action: AudioAction): AudioState {
  switch (action.type) {
    case 'SET_PLAYING':
      return { ...state, isPlaying: action.payload };
    case 'SET_CURRENT_TRACK':
      return { ...state, currentTrack: action.payload };
    case 'SET_CURRENT_TIME':
      return { ...state, currentTime: action.payload };
    case 'SET_DURATION':
      return { ...state, duration: action.payload };
    case 'SET_VOLUME':
      return { ...state, volume: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_PLAYLIST':
      return { ...state, playlist: action.payload };
    case 'ADD_TO_PLAYLIST':
      return { ...state, playlist: [...state.playlist, ...action.payload] };
    case 'REMOVE_FROM_PLAYLIST':
      return {
        ...state,
        playlist: state.playlist.filter(track => track.id !== action.payload),
      };
    case 'SET_CURRENT_INDEX':
      return { ...state, currentIndex: action.payload };
    case 'TOGGLE_SHUFFLE':
      return { 
        ...state, 
        isShuffled: !state.isShuffled,
        shuffledIndices: !state.isShuffled 
          ? generateShuffledIndices(state.playlist.length, state.currentIndex)
          : []
      };
    case 'SET_REPEAT_MODE':
      return { ...state, repeatMode: action.payload };
    case 'SET_SHUFFLED_INDICES':
      return { ...state, shuffledIndices: action.payload };
    default:
      return state;
  }
}

function generateShuffledIndices(playlistLength: number, currentIndex: number): number[] {
  const indices = Array.from({ length: playlistLength }, (_, i) => i);
  // Remove current track from shuffle
  if (currentIndex >= 0) {
    indices.splice(currentIndex, 1);
  }
  
  // Fisher-Yates shuffle
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  
  return indices;
}

function getNextTrackIndex(
  currentIndex: number, 
  playlistLength: number, 
  isShuffled: boolean, 
  shuffledIndices: number[], 
  repeatMode: RepeatMode
): number {
  if (playlistLength === 0) return -1;
  
  if (isShuffled && shuffledIndices.length > 0) {
    const currentShuffleIndex = shuffledIndices.findIndex(idx => idx === currentIndex);
    const nextShuffleIndex = currentShuffleIndex + 1;
    
    if (nextShuffleIndex < shuffledIndices.length) {
      return shuffledIndices[nextShuffleIndex];
    } else if (repeatMode === 'all') {
      return shuffledIndices[0];
    }
    return -1;
  } else {
    const nextIndex = currentIndex + 1;
    if (nextIndex < playlistLength) {
      return nextIndex;
    } else if (repeatMode === 'all') {
      return 0;
    }
    return -1;
  }
}

function getPreviousTrackIndex(
  currentIndex: number, 
  playlistLength: number, 
  isShuffled: boolean, 
  shuffledIndices: number[]
): number {
  if (playlistLength === 0) return -1;
  
  if (isShuffled && shuffledIndices.length > 0) {
    const currentShuffleIndex = shuffledIndices.findIndex(idx => idx === currentIndex);
    const prevShuffleIndex = currentShuffleIndex - 1;
    
    if (prevShuffleIndex >= 0) {
      return shuffledIndices[prevShuffleIndex];
    } else {
      return shuffledIndices[shuffledIndices.length - 1];
    }
  } else {
    const prevIndex = currentIndex - 1;
    if (prevIndex >= 0) {
      return prevIndex;
    } else {
      return playlistLength - 1;
    }
  }
}

const AudioContext = createContext<AudioContextType | null>(null);

let currentHowl: Howl | null = null;

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(audioReducer, initialState);

  const playTrack = useCallback((track: Track) => {
    if (currentHowl) {
      currentHowl.unload();
    }

    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_CURRENT_TRACK', payload: track });

    const trackIndex = state.playlist.findIndex(t => t.id === track.id);
    dispatch({ type: 'SET_CURRENT_INDEX', payload: trackIndex });

    currentHowl = new Howl({
      src: [track.url],
      html5: true,
      format: track.format ? [track.format] : undefined,
      onload: () => {
        dispatch({ type: 'SET_DURATION', payload: currentHowl?.duration() || 0 });
        dispatch({ type: 'SET_LOADING', payload: false });
      },
      onplay: () => {
        dispatch({ type: 'SET_PLAYING', payload: true });
      },
      onpause: () => {
        dispatch({ type: 'SET_PLAYING', payload: false });
      },
      onend: () => {
        dispatch({ type: 'SET_PLAYING', payload: false });
        // Handle auto-advance based on repeat mode
        const currentIndex = state.playlist.findIndex(t => t.id === track.id);
        
        if (state.repeatMode === 'one') {
          // Repeat current track
          playTrack(track);
        } else {
          // Get next track index based on shuffle mode
          const nextIndex = getNextTrackIndex(currentIndex, state.playlist.length, state.isShuffled, state.shuffledIndices, state.repeatMode);
          if (nextIndex !== -1) {
            playTrack(state.playlist[nextIndex]);
          }
        }
      },
      onstop: () => {
        dispatch({ type: 'SET_PLAYING', payload: false });
      },
    });

    currentHowl.volume(state.volume);
    currentHowl.play();
  }, [state.playlist, state.volume, state.isShuffled, state.repeatMode, state.shuffledIndices]);

  const pause = useCallback(() => {
    if (currentHowl) {
      currentHowl.pause();
    }
  }, []);

  const resume = useCallback(() => {
    if (currentHowl) {
      currentHowl.play();
    }
  }, []);

  const nextTrack = useCallback(() => {
    const nextIndex = getNextTrackIndex(
      state.currentIndex, 
      state.playlist.length, 
      state.isShuffled, 
      state.shuffledIndices, 
      state.repeatMode
    );
    if (nextIndex !== -1) {
      playTrack(state.playlist[nextIndex]);
    }
  }, [state.currentIndex, state.playlist, state.isShuffled, state.shuffledIndices, state.repeatMode, playTrack]);

  const previousTrack = useCallback(() => {
    const prevIndex = getPreviousTrackIndex(
      state.currentIndex, 
      state.playlist.length, 
      state.isShuffled, 
      state.shuffledIndices
    );
    if (prevIndex !== -1) {
      playTrack(state.playlist[prevIndex]);
    }
  }, [state.currentIndex, state.playlist, state.isShuffled, state.shuffledIndices, playTrack]);

  const setVolume = useCallback((volume: number) => {
    dispatch({ type: 'SET_VOLUME', payload: volume });
    if (currentHowl) {
      currentHowl.volume(volume);
    }
  }, []);

  const seekTo = useCallback((time: number) => {
    if (currentHowl) {
      currentHowl.seek(time);
      dispatch({ type: 'SET_CURRENT_TIME', payload: time });
    }
  }, []);

  const addToPlaylist = useCallback((tracks: Track[]) => {
    dispatch({ type: 'ADD_TO_PLAYLIST', payload: tracks });
  }, []);

  const removeFromPlaylist = useCallback((trackId: string) => {
    dispatch({ type: 'REMOVE_FROM_PLAYLIST', payload: trackId });
  }, []);

  const getCurrentHowl = useCallback(() => {
    return currentHowl;
  }, []);

  const toggleShuffle = useCallback(() => {
    dispatch({ type: 'TOGGLE_SHUFFLE' });
  }, []);

  const setRepeatMode = useCallback((mode: RepeatMode) => {
    dispatch({ type: 'SET_REPEAT_MODE', payload: mode });
  }, []);

  React.useEffect(() => {
    let animationFrame: number;
    let lastUpdateTime = 0;
    
    const updateTime = (timestamp: number) => {
      if (currentHowl && state.isPlaying) {
        // Throttle updates to ~4 times per second (250ms) instead of 10 times
        if (timestamp - lastUpdateTime >= 250) {
          const currentTime = typeof currentHowl.seek() === 'number' ? currentHowl.seek() : 0;
          dispatch({ type: 'SET_CURRENT_TIME', payload: currentTime });
          lastUpdateTime = timestamp;
        }
        animationFrame = requestAnimationFrame(updateTime);
      }
    };

    if (state.isPlaying) {
      animationFrame = requestAnimationFrame(updateTime);
    }
    
    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [state.isPlaying]);

  const value: AudioContextType = {
    ...state,
    playTrack,
    pause,
    resume,
    nextTrack,
    previousTrack,
    setVolume,
    seekTo,
    addToPlaylist,
    removeFromPlaylist,
    getCurrentHowl,
    toggleShuffle,
    setRepeatMode,
  };

  return (
    <AudioContext.Provider value={value}>
      {children}
    </AudioContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
};