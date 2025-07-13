import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { Howl } from 'howler';
import type { Track, AudioState } from '../types';

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
  | { type: 'SET_CURRENT_INDEX'; payload: number };

const initialState: AudioState = {
  isPlaying: false,
  currentTrack: null,
  currentTime: 0,
  duration: 0,
  volume: 0.8,
  isLoading: false,
  playlist: [],
  currentIndex: -1,
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
    default:
      return state;
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
        // Use current state for auto-advance to next track
        const currentIndex = state.playlist.findIndex(t => t.id === track.id);
        const nextIndex = currentIndex + 1;
        if (nextIndex < state.playlist.length) {
          playTrack(state.playlist[nextIndex]);
        }
      },
      onstop: () => {
        dispatch({ type: 'SET_PLAYING', payload: false });
      },
    });

    currentHowl.volume(state.volume);
    currentHowl.play();
  }, [state.playlist, state.volume]);

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
    const nextIndex = state.currentIndex + 1;
    if (nextIndex < state.playlist.length) {
      playTrack(state.playlist[nextIndex]);
    }
  }, [state.currentIndex, state.playlist, playTrack]);

  const previousTrack = useCallback(() => {
    const prevIndex = state.currentIndex - 1;
    if (prevIndex >= 0) {
      playTrack(state.playlist[prevIndex]);
    }
  }, [state.currentIndex, state.playlist, playTrack]);

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

  React.useEffect(() => {
    const updateTime = () => {
      if (currentHowl && state.isPlaying) {
        const currentTime = typeof currentHowl.seek() === 'number' ? currentHowl.seek() : 0;
        dispatch({ type: 'SET_CURRENT_TIME', payload: currentTime });
      }
    };

    const interval = setInterval(updateTime, 100);
    return () => clearInterval(interval);
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