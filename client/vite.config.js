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
          // Cloudinary images: NetworkFirst so the browser ALWAYS gets a live
          // image on the first load (no cache-miss blank response).
          // After the first successful fetch the image is stored and served
          // instantly on subsequent visits / offline.
          {
            urlPattern: /^https:\/\/res\.cloudinary\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'dermasis-cloudinary-images',
              // Give Cloudinary's CDN up to 8 s before falling back to cache
              networkTimeoutSeconds: 8,
              expiration: {
                maxEntries: 150,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
                // Automatically evict oldest entries if storage quota is hit
                purgeOnQuotaError: true,
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
                purgeOnQuotaError: true,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },

          // API calls: NetworkFirst with 15 s timeout (Render.com has cold-start
          // delays up to ~30 s; 15 s balances UX vs. waiting too long)
          {
            urlPattern: /\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'dermasis-api',
              networkTimeoutSeconds: 15,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24, // 24 hours
                purgeOnQuotaError: true,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],

        // Offline fallback: only for same-origin navigations (not external URLs)
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [
          /^\/api\//,
          // Exclude anything that looks like a file extension (images, fonts, etc.)
          /\.[a-z]{2,4}$/i,
        ],
        // Also restrict navigateFallback to same-origin navigations only
        navigateFallbackAllowlist: [/^\/(?!api)/],

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
