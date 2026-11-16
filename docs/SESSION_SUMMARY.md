# Session summary

Branch: `claude/ecstatic-rubin-69cwed` (all work so far). Rewritten each session.

## Phases

| Phase | Work | State |
| --- | --- | --- |
| 0 | Environment, versions, renderer, plan | done, approved |
| 1 | Art direction, scaffold, tokens, store, GSAP scroll, canvas, quality tiers | done |
| 2a | Raymarched SDF liquid, shading, analytic studio, hero state, pointer | **next** |
| 2b | All liquid states, Director (keyframe tracks), GPGPU particles, shared CPU/GPU model | |
| 3 | Chapters as semantic HTML with real copy, nav, then motion | |
| 4 | Preloader, droplet cursor, sound, fallbacks | |
| 5 | Phone + reduced motion, full verification, OG image, icons, README, PR, report | |

## Done in phase 1

- `app/globals.css`: tokens (`@theme`, default palette off), `type-*` classes,
  `page-grid` (4 / 12 columns), `text-shadow-halo`, focus ring.
- `app/layout.tsx`: fonts (Archivo with `wdth`, Instrument Sans), metadata.
  Canvas and pointer input sit outside the ScrollSmoother wrapper.
- `app/page.tsx`: placeholder sections with `data-chapter` (replace in phase 3).
- `lib/store.ts`: `scroll`, `story` (chapter index + progress), `pointer`,
  `field`, `viewport`, `reducedMotion`, `quality`.
- `components/SmoothScroll.tsx`: ScrollSmoother (full motion only), chapter
  ScrollTriggers, a ticker that writes scroll state to the store.
- `components/PointerInput.tsx`, `components/SceneMount.tsx` (`next/dynamic`, `ssr: false`).
- `scene/Scene.tsx`: Canvas (transparent, tier-based DPR), `PerformanceMonitor`
  lowering the tier; sets `html[data-scene=ready]`. `scene/PlaceholderDrop.tsx`
  is a stand-in to delete in phase 2a.
- `lib/quality.ts` (4 tiers), `lib/gsap.ts` (plugins, `settle` / `tension`
  eases, durations, motion queries), `lib/palette.ts`, `lib/content.ts`.
- `scripts/shots.mjs`: `npm run shots -- <chapter> <width> [--reduced]`
  against `next start` on port 3000; output in git-ignored `shots/`.

## Verified (headless Chromium, SwiftShader)

- lint, typecheck, build pass; `/` is static.
- WebGL 2 context created; no console errors; one H1.
- ScrollSmoother active in full motion, absent with reduced motion
  (`html[data-motion]`); `story` drives the placeholder.

## Notes for the next session

- ScrollSmoother makes `#smooth-wrapper` fixed: `scrollIntoView` does not
  work. Jump with `window.scrollTo` or `ScrollSmoother.get()?.scrollTo()`.
- Changes from the approved plan after the `frontend-design` pass: no
  monospace (condensed Archivo for small labels), `ink` is pure `#000000`.
- Hero letter-spacing and type scale are first guesses; tune in phase 3.
- Not yet done: nav, real copy, pins, preloader hook (`lib/loadClock.ts`),
  seam check by pixel sampling (do it once the liquid draws a shadow).

## Next step (phase 2a)

Create `scene/liquid/`: a shared model module (blob centres, radii, lattice
constants) that generates GLSL constants; a full-screen (or proxy) raymarch
material writing `gl_FragDepth` and premultiplied alpha; analytic studio
environment with the wordmark canvas texture; contact shadow; the resting drop
leaning toward `store.pointer`. Check cost at tier 0 before adding states.
