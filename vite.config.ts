import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'howler', 'framer-motion']
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // React and core libraries
          if (id.includes('react') || id.includes('react-dom')) {
            return 'react-vendor';
          }
          
          // Audio processing libraries
          if (id.includes('howler')) {
            return 'audio-libs';
          }
          
          // Metadata parsing (large library)
          if (id.includes('music-metadata')) {
            return 'metadata-parser';
          }
          
          // UI and animation libraries  
          if (id.includes('framer-motion') || id.includes('lucide-react')) {
            return 'ui-libs';
          }
          
          // Drag and drop functionality
          if (id.includes('@dnd-kit')) {
            return 'dnd-libs';
          }
          
          // Split large node_modules into vendor chunk
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    },
    // Increase chunk size warning limit to 1MB
    chunkSizeWarningLimit: 1000
  }
})
