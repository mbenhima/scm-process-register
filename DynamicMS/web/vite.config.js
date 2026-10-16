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
  // Runtime build (customer and editor images): minified JavaScript and CSS, no source maps, no
  // licence comments or debugger statements; React and the router in their own long-cached chunk,
  // other libraries split naturally so that heavy ones (BPMN editor) load only when used.
  esbuild: process.env.RUNTIME_BUILD ? { legalComments: 'none', drop: ['debugger'], pure: ['console.debug', 'console.log'] } : undefined,
  build: process.env.RUNTIME_BUILD ? {
    outDir: process.env.RUNTIME_OUT || 'dist', emptyOutDir: true, target: 'es2020', minify: 'esbuild', cssMinify: true, sourcemap: false,
    reportCompressedSize: false, chunkSizeWarningLimit: 2500,
    rollupOptions: { output: {
      manualChunks: (id) => (/node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler|@remix-run)[\\/]/.test(id) ? 'react' : undefined),
      entryFileNames: 'assets/app-[hash].js', chunkFileNames: 'assets/[hash].js', assetFileNames: 'assets/[hash][extname]',
    } },
  } : { outDir: 'dist', chunkSizeWarningLimit: 1500 },
});
