// Film grain as one static SVG over everything: the canvas has no post passes.
export function GrainOverlay() {
  return (
    <svg aria-hidden className="pointer-events-none fixed inset-0 z-40 size-full opacity-10">
      <filter id="grain">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
        <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1.4 -0.35" />
      </filter>
      <rect width="100%" height="100%" filter="url(#grain)" />
    </svg>
  );
}
