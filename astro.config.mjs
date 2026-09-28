// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// Static single page. Tailwind v4 runs as a Vite plugin (no postcss config needed).
export default defineConfig({
  output: 'static',
  site: 'https://orbital.example',
  compressHTML: true,
  build: {
    assets: 'assets',
    inlineStylesheets: 'auto',
  },
  vite: {
    plugins: [tailwindcss()],
    build: {
      // three + gsap live in one deliberately lazy chunk (fetched after first
      // paint), so the default 500 kB warning is expected noise here.
      chunkSizeWarningLimit: 700,
    },
  },
});
