// Real loading progress. Each phase reports once; the preloader eases `mass`
// toward `progress`, and the scene draws the hero drop with that mass.
const weights = {
  code: 0.3,
  context: 0.1,
  shaders: 0.25,
  frame: 0.2,
  fonts: 0.15,
} as const;

export type LoadPhase = keyof typeof weights;

const pending = new Set<LoadPhase>(["code", "context", "shaders", "frame", "fonts"]);
let release: () => void = () => {};
const released = new Promise<void>((resolve) => {
  release = resolve;
});

export const loadClock = {
  /** 0–1, sum of the phases that have finished */
  progress: 0,
  /** 0–1, eased progress: what the screen shows */
  mass: 0,
  /** 0 while the drop is centred as the preloader, 1 in the chapter's own framing */
  settle: 0,
  released: false,
};

export function markLoaded(phase: LoadPhase) {
  if (!pending.delete(phase)) return;
  loadClock.progress = pending.size === 0 ? 1 : Math.min(loadClock.progress + weights[phase], 1);
}

/** Gives up on whatever has not reported: a timeout or a scene that cannot start. */
export function finishLoading() {
  pending.clear();
  loadClock.progress = 1;
}

export function releaseLoad() {
  if (loadClock.released) return;
  loadClock.released = true;
  document.documentElement.dataset.loaded = "";
  release();
}

export function whenReleased() {
  return released;
}
