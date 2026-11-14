import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Builds into ../the-nebula so GitHub Pages (served from main) publishes it at
// https://cheymae.github.io/self-projects/the-nebula/
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: '../the-nebula',
    emptyOutDir: true,
    chunkSizeWarningLimit: 2000,
  },
})
