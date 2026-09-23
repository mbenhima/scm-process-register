import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The dev server forwards /api calls to the CortexPLM server (npm run dev in the server folder).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { '/api': { target: process.env.API_URL || 'http://localhost:4000', changeOrigin: true } },
  },
  preview: { port: 5173, proxy: { '/api': { target: process.env.API_URL || 'http://localhost:4000', changeOrigin: true } } },
});
