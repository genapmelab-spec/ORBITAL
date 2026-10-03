export {};

declare global {
  interface Window {
    /** Written by the pre-paint probe in src/layouts/Base.astro. */
    __ORBITAL__?: {
      webgl: boolean;
      reducedMotion: boolean;
    };
  }
}
