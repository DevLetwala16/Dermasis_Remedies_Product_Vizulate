import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: 'generateSW',
      registerType: 'autoUpdate',

      // Use our own manifest.json from /public
      manifest: false,

      includeAssets: ['favicon.svg', 'pwa-192.png', 'pwa-512.png'],

      workbox: {
        // Pre-cache only the compiled app shell (JS, CSS, HTML, local assets)
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],

        runtimeCaching: [
          // ── Google Fonts CSS ──────────────────────────────────────────────
          // StaleWhileRevalidate: always returns a response (cached or fresh)
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-stylesheets',
              expiration: { maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },

          // ── Google Fonts Files ────────────────────────────────────────────
          // CacheFirst: font files never change once fetched
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365,
                purgeOnQuotaError: true,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },

          // ── Backend API (same-origin /api/* calls) ────────────────────────
          // NetworkFirst: always tries live data first; falls back to cache
          // when the Render.com server is cold-starting or unreachable.
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'dermasis-api-cache',
              networkTimeoutSeconds: 20,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24,
                purgeOnQuotaError: true,
              },
              cacheableResponse: { statuses: [200] },
            },
          },

          // ── External API (Render.com absolute URL) ────────────────────────
          {
            urlPattern: /^https:\/\/dermasis-remedies-product-vizulate\.onrender\.com\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'dermasis-api-cache',
              networkTimeoutSeconds: 20,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24,
                purgeOnQuotaError: true,
              },
              cacheableResponse: { statuses: [200] },
            },
          },

          // NOTE: Cloudinary images are intentionally NOT intercepted here.
          // The SW lets all res.cloudinary.com requests pass directly to the
          // network so the browser fetches them from the CDN without any
          // Service Worker interference. This guarantees images always load
          // when the device is online.
        ],

        // Serve cached index.html for unmatched same-origin navigations only
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],

        skipWaiting: true,
        clientsClaim: true,
      },

      devOptions: {
        enabled: false, // disable SW in dev to avoid caching issues during development
      },
    }),
  ],

  build: {
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/')) {
            return 'vendor-react';
          }
          if (id.includes('node_modules/lucide-react')) {
            return 'vendor-icons';
          }
          if (id.includes('node_modules/axios')) {
            return 'vendor-axios';
          }
        },
      },
    },
    target: 'es2020',
    chunkSizeWarningLimit: 500,
  },
})
