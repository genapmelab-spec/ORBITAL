// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

/**
 * Static output only. Nothing on this project talks to a server: the model is
 * computed in the browser, so the whole site is prerendered HTML plus one lazy
 * JavaScript bundle (docs/TECHNICAL.md).
 */
export default defineConfig({
  output: 'static',
  compressHTML: true,
  build: {
    inlineStylesheets: 'auto',
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
