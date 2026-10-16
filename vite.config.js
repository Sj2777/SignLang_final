import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: null,
      manifest: false,
      includeAssets: [
        'favicon.svg',
        'manifest.webmanifest',
        'hero_sign_language.jpg',
        'icons/icon-192.png',
        'icons/icon-512.png',
      ],
      workbox: {
        globPatterns: [
          '**/*.{js,css,html,ico,png,svg,jpg,jpeg,json,webmanifest,woff,woff2}',
        ],
        globIgnores: [
          'models/isl_alphabet_model.json',
        ],
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [
          /^\/api(?:\/|$)/,
          /^\/(?:health|predict|ws)(?:\/|$)/,
        ],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/(?:[^/]+\.)?supabase\.co(?:\/|$)/i,
            handler: 'NetworkOnly',
          },
          {
            urlPattern: /\/(?:models\/(?:isl_alphabet_model\.json|hand_landmarker\.task)|mediapipe\/wasm\/vision_wasm_.*\.(?:js|wasm))$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'handspeak-offline-model-assets',
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
})
