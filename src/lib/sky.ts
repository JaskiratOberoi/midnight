/**
 * Shared, mutable sky state. GSAP tweens these numbers directly and the
 * Starfield canvas reads them every frame, so no React re-render is involved.
 */
export const sky = {
  /** 0 = stars invisible, 1 = full brightness */
  dim: 0,
  /** 0 = still, 1 = full hyperspace streak (used for the "enter the night" transition) */
  warp: 0,
  /** pointer position, normalised -1..1 */
  px: 0,
  py: 0,
  /** how much of the current music energy to feed into twinkle */
  pulse: 0,
};

export const reducedMotion = (): boolean =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
