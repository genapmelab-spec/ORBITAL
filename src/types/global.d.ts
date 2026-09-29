/**
 * Payload written by the inline pre-paint capability probe in Base.astro.
 * Feature/perf detection only — no user-agent sniffing (AGENTS.md).
 */
declare global {
  interface Window {
    __ORBITAL__?: {
      webgl: boolean;
      tier: 'high' | 'medium' | 'low';
      reducedMotion: boolean;
    };
  }
}

export {};
