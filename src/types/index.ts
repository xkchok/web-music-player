export interface Track {
  id: string;
  title: string;
  artist: string;
  duration: number;
  url: string;
  file?: File;
  format?: string;
  albumArt?: string;
}

export type RepeatMode = 'none' | 'one' | 'all';

export interface AudioState {
  isPlaying: boolean;
  currentTrack: Track | null;
  currentTime: number;
  duration: number;
  volume: number;
  isLoading: boolean;
  playlist: Track[];
  currentIndex: number;
  isShuffled: boolean;
  repeatMode: RepeatMode;
  shuffledIndices: number[];
}

export interface WaveformRef {
  // WaveformRef is now just a placeholder - methods not needed
}