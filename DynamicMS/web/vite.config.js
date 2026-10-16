import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: { __EDITION__: JSON.stringify(process.env.BUILD_EDITION || 'dev') },
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
  // A runtime build keeps the code unminified (the application chunks are obfuscated afterwards)
  // and separates third-party libraries into vendor chunks.
  build: process.env.RUNTIME_BUILD ? {
    outDir: process.env.RUNTIME_OUT || 'dist', emptyOutDir: true, minify: false, sourcemap: false, chunkSizeWarningLimit: 6000,
    rollupOptions: { output: { manualChunks: (id) => (id.includes('node_modules') ? 'vendor' : undefined), entryFileNames: 'assets/app-[hash].js', chunkFileNames: 'assets/[name]-[hash].js' } },
  } : { outDir: 'dist', chunkSizeWarningLimit: 1500 },
});
