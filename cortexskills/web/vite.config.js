import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The web tier talks to the API through /api; in development Vite forwards it to the server on port 4000.
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, proxy: { '/api': { target: process.env.API_URL || 'http://localhost:4000', changeOrigin: true } } },
  build: { chunkSizeWarningLimit: 2500 },
});
