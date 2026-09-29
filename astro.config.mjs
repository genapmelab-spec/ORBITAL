// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// Static output only — no SSR, no backend (Orbital Docs/AGENTS.md).
export default defineConfig({
  site: 'https://orbital.example',
  output: 'static',
  compressHTML: true,
  build: {
    assets: 'assets',
  },
  vite: {
    plugins: [tailwindcss()],
    build: {
      chunkSizeWarningLimit: 700,
    },
  },
});
