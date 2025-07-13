# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production (TypeScript compilation + Vite build)
- `npm run lint` - Run ESLint for code quality checks
- `npm run preview` - Preview production build locally

## Architecture Overview

This is a React + TypeScript audio player application built with Vite, featuring waveform visualizations and playlist management.

### Core Technologies
- **React 19** with TypeScript for UI
- **Howler.js** for audio playback engine
- **WaveSurfer.js** for waveform visualization
- **Framer Motion** for animations
- **Tailwind CSS** with custom design system
- **music-metadata** for audio file parsing

### Key Architecture Patterns

**Context-Based State Management**: Audio state is managed through `AudioContext` using React's useReducer pattern. All audio operations (play, pause, seek, volume, playlist management) flow through this central context.

**Component Structure**:
- `AudioProvider` wraps the entire app and manages global audio state
- `Waveform` component integrates WaveSurfer.js with the audio context
- `PlayerControls`, `TrackInfo`, `FileUpload`, and `Playlist` are UI components that consume audio context
- Components use ref forwarding for Waveform integration

**Audio Engine**: Uses Howler.js as the primary audio engine with automatic format detection. The context maintains a single global `currentHowl` instance for playback control.

**File Handling**: Supports drag-and-drop file upload with metadata extraction using music-metadata library. Files are converted to object URLs for playback.

### Styling System
- Custom Tailwind config with primary (blue) and accent (purple) color palettes
- Uses `.glass` class for glassmorphism effects
- Responsive grid layout with mobile-first approach
- Framer Motion for page transitions and component animations

### TypeScript Integration
- Strict TypeScript configuration with separate configs for app and node
- Custom types defined in `src/types/index.ts` for Track, AudioState, and WaveformRef interfaces
- ESLint configured with TypeScript-specific rules and React hooks validation