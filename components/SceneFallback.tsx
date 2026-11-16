import { site } from "@/lib/content";

// The resting drop as a drawing, for when the scene cannot run: no scripts,
// no WebGL 2, or a lost context.
export function SceneFallback() {
  return (
    <div
      aria-hidden
      data-scene-fallback=""
      className="pointer-events-none fixed inset-x-0 bottom-0 z-0 flex justify-center p-4 wide:justify-end wide:p-12 scene-live:hidden"
    >
      <svg viewBox="0 0 400 300" className="w-4/5 max-w-xl wide:w-2/5">
        <ellipse cx="210" cy="262" rx="186" ry="26" className="fill-mineral" />
        <path
          d="M200 28c98 0 172 62 172 136 0 62-70 98-172 98S28 226 28 164C28 90 102 28 200 28z"
          className="fill-ink"
        />
        <path d="M128 82c44-18 100-20 146-8l-10 44c-36-8-78-6-112 6z" className="fill-chalk" />
        <path d="M70 118c-12 18-18 38-18 58" className="fill-none stroke-chalk" strokeWidth="9" strokeLinecap="round" />
        <path d="M296 176c22-6 42-18 58-34" className="fill-none stroke-field" strokeWidth="4" strokeLinecap="round" />
        <text x="200" y="168" textAnchor="middle" className="type-title fill-chalk">
          {site.name}
        </text>
      </svg>
    </div>
  );
}
