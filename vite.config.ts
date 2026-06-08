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
  build: {
    rollupOptions: {
      output: {
        // Дробим крупные vendor-зависимости в отдельные чанки: меньше главный
        // бандл (был >1 МБ → warning), лучше кэширование между деплоями.
        manualChunks(id: string) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('@supabase')) return 'supabase';
          if (id.includes('@telegram-apps')) return 'telegram';
          if (id.includes('@tanstack')) return 'query';
          if (
            id.includes('lucide-react') ||
            id.includes('react-markdown') ||
            id.includes('react-virtuoso') ||
            id.includes('react-hook-form') ||
            id.includes('zod')
          ) {
            return 'ui-vendor';
          }
          if (
            id.includes('react-router') ||
            id.includes('node_modules/react-dom') ||
            id.includes('node_modules/react/') ||
            id.includes('node_modules/scheduler')
          ) {
            return 'react-vendor';
          }
          return undefined;
        },
      },
    },
  },
})
