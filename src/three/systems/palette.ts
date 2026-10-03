/**
 * Mirror of `src/styles/tokens.css` for the 3D layer.
 *
 * The DOM never hard-codes colour; neither should the scene. When a token
 * changes, change it here too — the two files are deliberately the only places
 * colour is written down.
 */
export const PALETTE = {
  void: '#05060b',
  deep: '#0a0d15',
  ink: '#edeff5',
  muted: '#8b93a7',
  ember: '#ff5c2e',
  solar: '#ffc46b',
  ion: '#86d3ff',
} as const;
