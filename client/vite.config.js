import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // generateSW: plugin writes the SW; no hand-crafted file needed
      strategies: 'generateSW',

      // autoUpdate: silently installs new SW when a new version is detected
      registerType: 'autoUpdate',

      // Point to our manifest.json in /public (manifest: false = don't inject one)
      manifest: false,

      // Pre-cache the app shell
      includeAssets: ['favicon.svg', 'pwa-192.png', 'pwa-512.png'],

      workbox: {
        // Glob patterns for precaching (relative to dist/)
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],

        // ── Runtime caching strategies ──────────────────────────────────────

        runtimeCaching: [
          // Cloudinary images: stale-while-revalidate with 30-day expiry
          {
            urlPattern: /^https:\/\/res\.cloudinary\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'dermasis-cloudinary-images',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },

          // Google Fonts stylesheets: stale-while-revalidate
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'dermasis-google-fonts-stylesheets',
              expiration: { maxAgeSeconds: 60 * 60 * 24 * 365 }, // 1 year
            },
          },

          // Google Fonts files: cache-first with 1-year expiry
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'dermasis-google-fonts-webfonts',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },

          // API calls: network-first with 5s timeout, cache fallback
          {
            urlPattern: /\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'dermasis-api',
              networkTimeoutSeconds: 5,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24, // 24 hours
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],

        // Offline fallback: serve cached index.html for unmatched navigations
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],

        // Skip waiting so new SW activates immediately after install
        skipWaiting: true,
        clientsClaim: true,
      },

      // Dev mode: keep SW active during `npm run dev` so you can test offline
      devOptions: {
        enabled: true,
        type: 'module',
      },
    }),
  ],

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
