import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages hosts under /<repo-name>/, set VITE_BASE_PATH in CI secrets
  // For local dev and other platforms, defaults to '/'
  base: process.env['VITE_BASE_PATH'] ?? '/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
