import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: './',   // works on GitHub Pages under /<repo>/
  plugins: [preact(), VitePWA({
    registerType: 'autoUpdate',
    includeAssets: ['icon-192.png', 'icon-512.png'],
    manifest: {
      name: 'Menu — planificateur de repas', short_name: 'Menu', lang: 'fr', description: 'Planifier ses repas, faire ses courses, savoir ce qu’on a à la maison.',
      start_url: './', scope: './', display: 'standalone', id: './',
      share_target: { action: './?share=1', method: 'GET', params: { title: 'title', text: 'text', url: 'url' } },
      background_color: '#faf6f0', theme_color: '#c8553d', orientation: 'any',
      icons: [{ src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
              { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
              { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }],
    },
    workbox: { globPatterns: ['**/*.{js,css,html,png,svg}'] },
  })],
  test: { include: ['tests/**/*.test.ts'] },
} as any);
