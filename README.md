# Audio Player - React + TypeScript

A modern, feature-rich audio player built with React 19, TypeScript, and Vite, featuring real-time waveform visualization and advanced audio processing capabilities.

## ✨ Features

### 🎵 **Audio Playback**
- High-quality audio playback using Howler.js
- Support for multiple audio formats (MP3, WAV, FLAC, OGG, etc.)
- Automatic format detection and fallback
- Gapless playback with smooth transitions

### 📊 **Real-time Visualization**
- Live frequency analysis with 256-bin FFT
- Custom canvas-based waveform visualization
- Real-time audio bars with gradient coloring
- Handles silent sections without flickering
- Fallback visualization when audio analyser is unavailable

### 🎛️ **Player Controls**
- Play/pause, previous/next track navigation
- Volume control with visual feedback
- Seek functionality with precise positioning
- Track progress indication
- Keyboard shortcuts support

### 📝 **Metadata Support**
- Automatic metadata extraction using music-metadata
- Album art display with blur backdrop
- Track title, artist, and album information
- Duration and format detection

### 📋 **Playlist Management**
- Drag-and-drop playlist reordering
- Search functionality across tracks
- Add/remove tracks dynamically
- Persistent playlist state
- Visual feedback for current track

### 🎨 **Modern UI/UX**
- Glassmorphism design with backdrop blur
- Smooth animations using Framer Motion
- Responsive layout with mobile-first approach
- Custom scrollbars and interactive elements
- Dark theme with purple/blue gradients

## 🛠️ **Technical Stack**

### **Core Technologies**
- **React 19** - Latest React with concurrent features
- **TypeScript** - Type-safe development
- **Vite** - Lightning-fast build tool
- **SCSS** - Modern CSS with variables and mixins

### **Audio Processing**
- **Howler.js** - Cross-browser audio library
- **Web Audio API** - Real-time frequency analysis and visualization
- **music-metadata** - Audio file metadata parsing
- **Canvas API** - Custom waveform rendering

### **UI & Animation**
- **Framer Motion** - Smooth animations and transitions
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Beautiful SVG icons
- **@dnd-kit** - Drag and drop functionality

### **Development Tools**
- **ESLint** - Code linting and formatting
- **Sass** - CSS preprocessing with modern syntax
- **PostCSS** - CSS post-processing
- **TypeScript ESLint** - Type-aware linting

## 🚀 **Performance Optimizations**

- **Efficient state management** with useReducer pattern
- **Memoization** for expensive calculations
- **RAF-based** smooth animations
- **Debounced search** for better performance

## 📦 **Installation**

```bash
# Clone the repository
git clone https://github.com/xkchok/web-music-player.git
cd web-music-player

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🔧 **Development Commands**

```bash
# Development
npm run dev          # Start dev server with hot reload

# Building
npm run build        # TypeScript compilation + Vite build
npm run preview      # Preview production build locally

# Code Quality
npm run lint         # Run ESLint for code quality checks
```

## 🏗️ **Architecture**

### **State Management**
- **AudioContext** - Central audio state management using useReducer
- **Context Pattern** - Global state accessible throughout the app
- **Immutable Updates** - Predictable state changes

### **Component Structure**
```
src/
├── components/
│   ├── Waveform.tsx      # Audio visualization component
│   ├── PlayerControls.tsx # Playback controls
│   ├── TrackInfo.tsx     # Track metadata display
│   ├── FileUpload.tsx    # Drag-and-drop file upload
│   └── Playlist.tsx      # Playlist management
├── contexts/
│   └── AudioContext.tsx  # Global audio state
├── types/
│   └── index.ts          # TypeScript type definitions
└── styles/
    ├── _variables.scss   # SCSS variables
    ├── _mixins.scss      # Reusable mixins
    ├── _components.scss  # Component styles
    └── _legacy.scss      # Legacy styles
```

### **Audio Engine**
- **Single Global Instance** - One Howler.js instance per track
- **Web Audio Integration** - Real-time frequency analysis
- **Automatic Cleanup** - Proper resource management
- **Error Handling** - Graceful fallbacks for audio issues

## 🎯 **Key Features Implementation**

### **Waveform Visualization**
- Real-time frequency analysis using Web Audio API
- Custom canvas-based 96-bar visualization with gradient coloring
- Handles silent sections without placeholder flickering
- Smooth animation loop with RAF optimization
- No dependencies on heavy visualization libraries

### **File Upload**
- Drag-and-drop interface with visual feedback
- Multiple file selection support
- Automatic metadata extraction
- Object URL creation for local playback

### **Playlist Management**
- Drag-and-drop reordering with @dnd-kit
- Real-time search filtering
- Visual feedback for current track
- Persistent state management

## 🔒 **Browser Compatibility**

- **Chrome/Edge** - Full support with all features
- **Firefox** - Full support with Web Audio API
- **Safari** - Full support with webkit prefixes
- **Mobile browsers** - Responsive design with touch support

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 **License**

This project is licensed under the MIT License - see the LICENSE file for details.