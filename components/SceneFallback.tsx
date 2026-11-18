import { site } from "@/lib/content";
import { drop } from "@/lib/drop";

// The resting drop as a drawing, for when the scene cannot run: no scripts,
// no WebGL 2, or a lost context.
export function SceneFallback() {
  return (
    <div
      aria-hidden
      data-scene-fallback=""
      className="pointer-events-none fixed inset-x-0 bottom-0 z-0 flex justify-center p-4 wide:justify-end wide:p-12 scene-live:hidden"
    >
      <svg viewBox={drop.viewBox} className="w-4/5 max-w-xl wide:w-2/5">
        <ellipse {...drop.shadow} className="fill-mineral" />
        <path d={drop.body} className="fill-ink" />
        <path d={drop.softBox} className="fill-chalk" />
        <path d={drop.strip} className="fill-none stroke-chalk" strokeWidth="9" strokeLinecap="round" />
        <path d={drop.fieldStrip} className="fill-none stroke-field" strokeWidth="4" strokeLinecap="round" />
        <text x="200" y="168" textAnchor="middle" className="type-title fill-chalk">
          {site.name}
        </text>
      </svg>
    </div>
  );
}
