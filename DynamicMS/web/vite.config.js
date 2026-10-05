import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  css: { postcss: { plugins: [] } },
  // Pre-bundle every dependency at start-up: without it the development server discovers
  // dependencies on the first visit, re-optimizes them and reloads, which can leave the first
  // page blank until it is refreshed.
  optimizeDeps: {
    entries: ['index.html', 'src/**/*.jsx'],
    include: ['react', 'react/jsx-runtime', 'react/jsx-dev-runtime', 'react-dom', 'react-dom/client', 'react-router-dom', 'lucide-react', 'bpmn-js/lib/Modeler', 'bpmn-js/lib/NavigatedViewer'],
  },
  server: { port: 5173, proxy: { '/api': { target: 'http://localhost:4000', changeOrigin: true } } },
  preview: { port: 5173, proxy: { '/api': { target: 'http://localhost:4000', changeOrigin: true } } },
  build: { outDir: 'dist', chunkSizeWarningLimit: 1500 },
});
