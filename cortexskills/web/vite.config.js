import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The web tier talks to the API through /api; in development Vite forwards it to the server on port 4000.
// Production build: modern target, no source maps, one chunk per screen (App.jsx; the BPMN modeller goes with its screen) and
// long-lived library chunks (React, icons) so a new release re-downloads only what changed; then tools/precompress.mjs writes
// the Brotli and gzip copies the server sends as they are.
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, proxy: { '/api': { target: process.env.API_URL || 'http://localhost:4000', changeOrigin: true } } },
  build: {
    target: 'es2022', sourcemap: false, cssCodeSplit: true, reportCompressedSize: false, chunkSizeWarningLimit: 1200,
    rollupOptions: { output: { manualChunks(id) {
      if (!id.includes('node_modules')) return undefined;
      if (/[\\/](react|react-dom|react-router|react-router-dom|scheduler|@remix-run)[\\/]/.test(id)) return 'vendor-react';
      if (id.includes('lucide-react')) return 'vendor-icons';
      return undefined;
    } } },
  },
});
