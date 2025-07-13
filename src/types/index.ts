import type WaveSurfer from 'wavesurfer.js';

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

export interface AudioState {
  isPlaying: boolean;
  currentTrack: Track | null;
  currentTime: number;
  duration: number;
  volume: number;
  isLoading: boolean;
  playlist: Track[];
  currentIndex: number;
}

export interface WaveformRef {
  wavesurfer: WaveSurfer | null;
  play: () => void;
  pause: () => void;
  seekTo: (progress: number) => void;
}