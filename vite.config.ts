import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom', 'react-helmet-async'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-animations': ['framer-motion', 'gsap', 'lenis', 'motion'],
          'vendor-utils': ['clsx', 'tailwind-merge', 'lucide-react', 'masonic'],
          'vendor-charts': ['recharts'],
          'vendor-font': ['opentype.js', 'wawoff2'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
    minify: 'esbuild',
  },
})