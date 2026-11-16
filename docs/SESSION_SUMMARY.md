# Session summary

Branch: `claude/ecstatic-rubin-69cwed` (all work so far). Rewritten each session.

Line for the owner to paste into the next session: "Pročitaj CLAUDE.md,
docs/SESSION_SUMMARY.md i docs/ART_DIRECTION.md i nastavi. Prethodni rad je na
grani `claude/ecstatic-rubin-69cwed`."

## Phases (one session each, merge two if a phase turns out small)

| Phase | Work | State |
| --- | --- | --- |
| 0 | Environment, versions, renderer, plan | done, approved |
| 1 | Art direction, scaffold, tokens, store, GSAP scroll, canvas, quality tiers | done |
| 2a | Raymarched SDF liquid, shading, analytic studio, hero state, pointer | done |
| 2b | All liquid states, Director (keyframe tracks), GPGPU particles, CPU model wired to DOM labels | done |
| 3 | Chapters as semantic HTML with real copy, keyboard nav, then motion (pins, SplitText after fonts load) | done except the polish list below |
| 4 | Preloader (`lib/loadClock.ts`), droplet cursor and goo layer, sound, grain overlay, SVG fallback | **next** |
| 5 | Phone and reduced motion, full verification, OG image, icons, README, pull request, final report | |

## What exists

- `app/globals.css`: tokens (`@theme`, default palette off), `type-*` classes,
  `page-grid` (4 / 12 columns), `text-shadow-halo`, focus ring, the `wide:`
  variant (landscape aspect: text takes a side column), `type-mass`,
  `field-range`.
- `app/layout.tsx`: fonts (Archivo with `wdth`, Instrument Sans), metadata.
  Canvas and pointer input sit outside the ScrollSmoother wrapper.
- `app/page.tsx`: six chapter server components in `<main>`, then `SiteFooter`
  (a solid `ink` bar that closes the page under the pool).
- `components/Chapter.tsx` (section with `data-chapter`, optional `data-pin`,
  and the frame that gets pinned), `ChapterHeading.tsx`, `chapters/*.tsx`.
- `components/ChapterNav.tsx` (fixed black pill, active item in `field`),
  `ChapterLink.tsx` + `lib/jump.ts` (smooth jump, focus to the heading).
- Scene-linked client components, all on the GSAP ticker through
  `hooks/useTicker.ts`: `FieldInstrument.tsx` (range input; `store.field` is
  -1 until touched, then overrides the scroll track until the chapter is
  left; writes `--field` for the `type-mass` heading), `SpikeLabels.tsx`,
  `PartList.tsx` (rows move to droplet heights), `HoldForms.tsx`.
- `lib/beats.ts`: numbers both layers share (critical field, field fall,
  Hold form switches, pin lengths: crown 1.5, part 1, hold 2 viewports).
- `lib/store.ts`: `scroll`, `story` (chapter index + progress), `pointer`
  (NDC, velocity, down, active), `field`, `viewport`, `anchors`,
  `reducedMotion`, `quality`.
- `components/SmoothScroll.tsx`: ScrollSmoother, pins (`[data-pin]` gets
  `data-pinned`), SplitText line reveals on `[data-reveal]` after fonts load
  (all three full motion only), chapter ScrollTriggers with ids
  (`chapter-<id>`), a ticker that writes scroll state to the store.
- `components/PointerInput.tsx`, `components/SceneMount.tsx` (`next/dynamic`, `ssr: false`).
- `scene/Scene.tsx`: Canvas (transparent, tier-based DPR), `PerformanceMonitor`
  lowering the tier; sets `html[data-scene=ready]`. Mounts `Director`,
  `Grains`, `Liquid`, in that order (the order matters).
- `scene/direction.ts` (no three import): the shot list. Keys in story units
  for camera shots, liquid poses and grain shapes, plus number tracks
  (`reach`, `field`, `split`, grain weight). `direct()` samples them into
  `direction`. All timing lives here.
- `scene/Director.tsx`: calls `direct(store.story, store.field)` and sets the
  camera (elevation, span, lens shift for wide and portrait).
- `scene/liquid/model.ts` (no three import): constants, the pose layout (a
  flat `Float32Array`: 8 blobs, squash, blend, ceiling, spike field, slab,
  orb spikes, proxy extent, shadow falloff), `spikeTip()` and `blobCentre()`
  for the CPU, generated GLSL constants.
- `scene/liquid/poses.ts`: one writer per pose (rest with pointer lean, reach,
  crown, part, bridge, slab, orb, pool). `Liquid.tsx` writes the two poses
  around the current key and lerps them; hidden blobs have radius -1.
- `scene/liquid/shaders.ts`: raymarch in a proxy box (back faces, extent from
  the pose), smooth-min blobs, hex lattice of cones (`sdSpikes`), radial
  spikes on blob 0 (`sdOrbSpikes`), rounded slab, flat ceiling cut, four-tap
  normals, silhouette coverage, `gl_FragDepth`, premultiplied alpha. Analytic
  studio, contact shadow and floor reflection as in 2a.
- `scene/liquid/LiquidMaterial.ts`, `wordmark.ts`, `Liquid.tsx` (mesh,
  pointer ray, swell, and `store.anchors`: three labelled spike tips and four
  droplet centres projected to CSS pixels, third value 1 when present).
- `scene/grains/`: GPGPU grains. `GrainSimulation.ts` (ping-pong targets,
  float with half-float fallback, points drawn as opaque discs before the
  liquid), `shaders.ts` (target formula per shape: dust, dipole field lines,
  lattice heaps, droplet rings, halo, frame, shell; curl turbulence).
- `lib/quality.ts` (4 tiers: DPR, raymarch steps, particle texture size,
  self-reflection), `lib/gsap.ts` (plugins, `settle` / `tension` eases,
  durations, motion queries), `lib/palette.ts`, `lib/content.ts` (draft lines).
- `scripts/shots.mjs`: screenshots, one chapter and one width per run; prints
  fps (relative: CPU rendering) and the canvas size.

## How to verify

```
npm run lint && npm run typecheck && npx next build | tail -8
npx next start -p 3000 &
npm run shots -- <chapter-id> <375|768|1024|1440|1920> [--reduced] [--pointer=0.5,0.45] [--touch] [--offset=0.5]
```

`next dev -p 3000` is faster while iterating on a shader. `--offset` scrolls
that many viewport heights past the chapter top; `--pointer` parks the mouse
at viewport fractions; `--touch` emulates a 3x phone (tier 0). A shot can
take a minute on a slow container: iterate at 1024 or 375, few shots per run.
Output goes to git-ignored `shots/`; the script prints console errors, the
motion mode and whether WebGL 2 exists. Chapter ids: still, reach, crown,
part, hold, settle.

## Verified (headless Chromium, SwiftShader)

- lint, typecheck, build pass; `/` is static; no console errors; one H1.
- WebGL 2 context created; float and half-float render targets available; a
  shader writing `gl_FragDepth` compiles. WebGPU has no adapter here.
- ScrollSmoother active in full motion, absent with reduced motion
  (`html[data-motion]`); `story` and the pointer reach the scene.
- Tailwind's `in-data-pinned:` variant compiles in 4.3.5 (for phase 3 pins).
- Phase 3, looked at: every chapter at 1024 with the real layout (still,
  reach, crown +0.6, part +0.6, hold +1.2, settle) and still, reach, crown,
  part, hold at 375 `--touch`; crown at 1024 `--reduced` (plain flow, static
  labels, no pins).
- `store.anchors` match pixels: spike labels sit on spike tips, Part rows sit
  beside their droplets (1024 and 375).
- Keyboard: Tab reaches the nav first; Enter on a chapter scrolls there,
  moves focus to its heading and sets the active item; Tab continues into
  the page. Heading order is h1, h2, h3 with no skips. Both motion modes.
- Not verified: real GPU frame rate, real phones, Safari, the half-float
  path, 768 / 1440 / 1920 widths, the page with JavaScript off (the HTML is
  server-rendered; not opened in a browser without scripts), dragging the
  field input by hand, a screen reader.

## Notes

- The owner saw the 2a hero screenshots and approved the look of the liquid
  (shape, gloss, wordmark in the reflection). Keep it as the reference: new
  states must not change the hero frame or the studio without a reason.
- GLSL reserved words bit once (`cast`); `sign` is a builtin. Check new names.
- Tier DPR caps were raised (1.5 / 1.5 / 1.75 / 2): DPR 1 looked soft on a
  3x phone and the raymarch is cheap at that size.
- ScrollSmoother makes `#smooth-wrapper` fixed: `scrollIntoView` does not
  work. Jump with `window.scrollTo` or `ScrollSmoother.get()?.scrollTo()`.
- Changes from the approved plan, already told to the owner: no monospace
  (condensed Archivo for small labels), `ink` is pure `#000000`.
- `AGENTS.md` (written by `next dev`): Next 16 differs from older versions.
  Before using a Next API not already used in the repo, read its guide in
  `node_modules/next/dist/docs/`.
- The proxy volume follows the pose (`extentX/Z`); wide poses set their own.
- The H1 is the wordmark plus a visually hidden ": magnetic liquid, shaped
  by a field". `--text-display` was lowered to 6vw so sentence headings fit
  a side column.
- A pinned chapter is pinned for `pin / (pin + 1)` of its story unit and
  scrolls out in the rest; the next state forms during that exit.

## Left over from phase 3 (do when the frame is next touched, or in phase 5)

- Reach at 1024: sparse grains of the field lines still cross the left edge
  of the text column. Hold's slab is still a flat grey face with a thick
  `field` band. Crown labels overlap each other in the profile view.
- Reduced motion: chapters are short without pins, so scene states run ahead
  of the text and the lattice grains reach the next chapter's text.
- Phone Part was reframed (`tallX 0.37`, rows `pr-8`) after the last
  screenshot; look at it again. Part rows do not answer hover or focus yet
  (signature moment 4): add `store.partFocus` and swell that droplet.
- Reveals split after fonts load, so first-screen text shows, then rises;
  the preloader has to cover that. Settle's heading is four lines at 1024.

## Next step (phase 4)

Read `PROMPT.md` lines 496–518 and 586–600 once. Then, one commit each:

1. Preloader: `lib/loadClock.ts` collects real progress (fonts, scene chunk,
   shader compile, first frame); the drop's mass follows it and becomes the
   hero subject without a cut; first-screen reveals start when it ends.
2. Goo layer and droplet cursor: one small fixed SVG-filtered layer for the
   nav pill, buttons and the cursor (fine pointers only, never hides the
   native cursor for keyboard users).
3. Sound: Web Audio synthesis, off until a real toggle button is pressed;
   field strength drives pitch in Crown. The toggle needs room in the nav
   (the pill is 320px wide at 375).
4. Grain as a DOM overlay; a static SVG fallback when WebGL 2 is missing
   (`html[data-scene]` never becomes `ready`).
