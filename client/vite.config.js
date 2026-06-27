import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Split CSS into per-chunk files so unused CSS is not downloaded
    cssCodeSplit: true,
    // Enable code splitting for better cacheability and reduced initial load
    rollupOptions: {
      output: {
        manualChunks(id) {
          // React runtime — most stable, longest cache lifetime
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/')) {
            return 'vendor-react';
          }
          // Icon library — separate so product code changes don't bust icon cache
          if (id.includes('node_modules/lucide-react')) {
            return 'vendor-icons';
          }
          // Axios — HTTP client, rarely changes
          if (id.includes('node_modules/axios')) {
            return 'vendor-axios';
          }
        },
      },
    },
    // Target modern browsers for smaller output (no legacy polyfills)
    target: 'es2020',
    // Reduce chunk size warnings threshold
    chunkSizeWarningLimit: 500,
    // Vite 8 uses oxc as the default minifier (faster than esbuild)
    // No explicit minify option needed — oxc is used automatically
  },
})

