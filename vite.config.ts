import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { RUNGS } from './src/content/ladder'

/**
 * Injection step: the whole ladder is written into index.html inside <noscript>.
 * The DOM app needs JavaScript; the script must not. One content source, two
 * renderers — and tools/check-content.mjs asserts the built output contains it.
 */
function noscriptLadder(): Plugin {
  const rows = RUNGS.map(
    (r) => `        <li class="ns-rung">
          <p class="ns-time">${r.arrow} ago</p>
          <h3 class="ns-name">${r.name}</h3>
          <p class="ns-fact">${r.fact}</p>
          <p class="ns-body">${r.explanation}</p>
          <p class="ns-source">${r.source}</p>
        </li>`,
  ).join('\n')
  return {
    name: 'orbital:noscript-ladder',
    transformIndexHtml: {
      order: 'pre',
      handler(html: string) {
        return html.replace(
          '<!--NOSCRIPT_LADDER-->',
          `<noscript id="ladder-static">
      <p class="ns-lede">ORBITAL — nothing you see is happening now. Eight rungs, from a laser bounced off the Moon to the oldest light in the universe. Each rung is a delay between something happening and you finding out. Distances here are compressed so they can be seen. The numbers are not.</p>
      <ol class="ns-list">
${rows}
      </ol>
      <p class="ns-source">Sources are listed with every rung. Built without photographs, textures or tracking.</p>
    </noscript>`,
        )
      },
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), noscriptLadder()],
  build: {
    target: 'es2022',
    cssCodeSplit: false,
    reportCompressedSize: false,
  },
})
