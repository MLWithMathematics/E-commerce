import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Dev proxy — only used when running `npm run dev` locally
    // In production on Vercel, VITE_API_URL env variable is used instead
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    // Warn if any chunk is over 1MB
    chunkSizeWarningLimit: 1000,
  },
})
