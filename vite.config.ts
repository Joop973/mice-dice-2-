/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  // Relative base keeps the build portable for Capacitor (file://) and static hosts.
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/favicon.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        id: './',
        name: 'Dice Mice',
        short_name: 'DiceMice',
        description: 'Ein eigenständiges Würfelspiel mit Mäuse-Thema.',
        lang: 'de',
        categories: ['games'],
        theme_color: '#f4c542',
        background_color: '#1c1410',
        display: 'standalone',
        orientation: 'portrait',
        // Getrennte „any"- und „maskable"-Icons (Best Practice): das maskable
        // Icon hat eine Sicherheitszone fürs kreisförmige Zuschneiden, das
        // „any"-Icon nutzt die volle Fläche.
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          {
            src: 'icons/icon-192-maskable.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: 'icons/icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
          { src: 'icons/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
        ],
      },
      workbox: {
        // Offline-Spielbarkeit des Solo-Modus: alle Build-Assets cachen (inkl.
        // des lazy geladenen three.js-Chunks für den 3D-Würfel).
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        // SPA: jede Navigation offline auf die App-Shell zurückführen.
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
        clientsClaim: true,
      },
    }),
  ],
  test: {
    globals: true,
    environment: 'node',
    // Nur Unit/Component-Tests; Playwright-E2E (e2e/*.spec.ts) laufen getrennt.
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
});
