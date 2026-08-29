import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    // In dev mode the frontend runs on Vite's own port (HMR etc.) while the
    // backend runs separately on 4000 (see /server) — proxy /api so the same
    // relative fetch('/api/state') calls in AppStateContext work in both dev
    // and the production build, where the backend serves everything itself.
    proxy: {
      '/api': 'http://localhost:4000',
    },
  },
})
