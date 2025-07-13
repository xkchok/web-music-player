import React, { useCallback } from 'react';
import { motion } from 'framer-motion';
import { Upload } from 'lucide-react';
import { parseBlob } from 'music-metadata';
import { useAudio } from '../contexts/AudioContext';
import type { Track } from '../types';

export function FileUpload() {
  const { addToPlaylist, playTrack, currentTrack } = useAudio();

  const handleFileUpload = useCallback(async (files: FileList) => {
    const audioFiles = Array.from(files).filter(file => 
      file.type.startsWith('audio/')
    );

    const tracks: Track[] = await Promise.all(
      audioFiles.map(async (file) => {
        const url = URL.createObjectURL(file);
        const extension = file.name.split('.').pop()?.toLowerCase();
        const format = extension && ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac'].includes(extension) ? extension : 'mp3';
        
        let title = file.name.replace(/\.[^/.]+$/, '');
        let artist = 'Unknown Artist';
        let albumArt: string | undefined;

        try {
          const metadata = await parseBlob(file);
          
          if (metadata.common.title) {
            title = metadata.common.title;
          }
          
          if (metadata.common.artist || metadata.common.albumartist) {
            artist = metadata.common.artist || metadata.common.albumartist || 'Unknown Artist';
          }

          if (metadata.common.picture && metadata.common.picture.length > 0) {
            const picture = metadata.common.picture[0];
            const blob = new Blob([picture.data], { type: picture.format });
            albumArt = URL.createObjectURL(blob);
          }
        } catch (error) {
          console.log('Could not read metadata for', file.name, ':', error);
        }
        
        return {
          id: `${Date.now()}-${Math.random()}`,
          title,
          artist,
          duration: 0,
          url,
          file,
          format,
          albumArt,
        };
      })
    );

    addToPlaylist(tracks);
    
    // Only start playing if no track is currently playing
    if (tracks.length > 0 && !currentTrack) {
      playTrack(tracks[0]);
    }
  }, [addToPlaylist, playTrack, currentTrack]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files);
    }
  }, [handleFileUpload]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      handleFileUpload(files);
    }
  }, [handleFileUpload]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative"
    >
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onDragEnter={(e) => e.preventDefault()}
        className="border-2 border-dashed border-white/30 rounded-xl p-8 text-center glass hover:border-white/50 transition-colors cursor-pointer group"
      >
        <input
          type="file"
          multiple
          accept="audio/*"
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        
        <div className="flex flex-col items-center space-y-4">
          <div className="p-4 rounded-full bg-gradient-to-r from-primary-500/20 to-accent-500/20 group-hover:from-primary-500/30 group-hover:to-accent-500/30 transition-colors">
            <Upload className="w-8 h-8 text-white" />
          </div>
          
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Upload Your Music
            </h3>
            <p className="text-white/60">
              Drag and drop audio files here or click to browse
            </p>
            <p className="text-white/40 text-sm mt-2">
              Supports MP3, WAV, OGG, M4A
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}