import type { QualityTier } from "@/lib/quality";

// The only bridge between the DOM layer and the WebGL layer. GSAP and input
// handlers write here; the scene reads it every frame. Never put this in React state.
export const store = {
  scroll: {
    /** 0–1 over the whole page */
    progress: 0,
    /** viewport heights per second, signed */
    velocity: 0,
  },
  /** chapter index + progress inside it, e.g. 2.4 = 40% through the third chapter */
  story: 0,
  pointer: {
    /** normalized device coordinates, -1..1, y up */
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    down: false,
    /** false until the first pointer event, and after the pointer leaves */
    active: false,
  },
  /** 0–1, written by the field instrument */
  field: 0,
  viewport: { width: 1, height: 1 },
  reducedMotion: false,
  quality: 2 as QualityTier,
};
