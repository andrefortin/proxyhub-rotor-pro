import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [], // [react()],
  resolve: {
    alias: {
      '@': new URL('./src', import.meta.url).pathname,
    },
  },
  optimizeDeps: {
    // cSpell:ignore supercluster
    include: ['react', 'react-dom', 'react-leaflet', 'leaflet', '@react-google-maps/api', 'supercluster'],
  },
  server: {
    port: 5173,
    host: '0.0.0.0',
    open: true,
  },
  build: {
    rollupOptions: {
      input: './index.html',
    },
  },
})