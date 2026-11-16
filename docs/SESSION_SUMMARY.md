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
| 4 | Preloader (`lib/loadClock.ts`), droplet cursor and goo layer, sound, grain overlay, SVG fallback | done |
| 5a | Visual pass: every chapter at five widths, phone, reduced motion; fix the frames | done except the widths listed under "Next step" |
| 5b | Rest of the widths, remaining checks, OG image, icons, README, pull request, final report | **next** |

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
- `lib/loadClock.ts`: load phases (code, context, shaders, frame, fonts),
  `progress`, eased `mass`, `settle` (0 = drop centred as the preloader, 1 =
  the chapter's framing). `components/Preloader.tsx` eases the mass, shows
  the readout, releases (sets `html[data-loaded]`: `complete` or
  `without <phases>`) and gives up after 9 s of wall-clock time. Content with
  `data-await-load` is hidden until then, only under `(scripting: enabled)`.
  The rest pose scales with the mass; the Director multiplies the lens shift
  by `settle`. Reveals are split after fonts and release, then
  `ScrollTrigger.refresh()`.
- `components/DropletCursor.tsx`: trailing drop (fine pointers; the native
  cursor stays), the `#goo` filter, and a 160px band at the top where the
  drop and copies of every `[data-goo]` element (nav pill, sound toggle)
  share the filter. The neck between pill and toggle is that filter.
- `lib/audio.ts` + `components/SoundToggle.tsx`: drone on `store.fieldLevel`,
  pad per chapter, noise wash on scroll speed, two UI ticks. The context is
  created on the first click, suspended when off or hidden. The toggle sits
  right of the pill; on phones it is fixed bottom right.
- `components/GrainOverlay.tsx` (static SVG noise), `SceneFallback.tsx` (SVG
  drop, hidden by the `scene-live:` variant unless `html[data-scene=fallback]`;
  `scene/Scene.tsx` sets that without WebGL 2 or on `webglcontextlost`).
- `components/SmoothScroll.tsx` also restores the scroll position itself on
  reload (session storage, after the pins exist) and tells ScrollSmoother not
  to re-centre headings focused by a jump (`onFocusIn`).
- `scripts/shots.mjs`: screenshots, one chapter and one width per run; prints
  fps (relative: CPU rendering) and the canvas size. `scripts/flow.mjs`
  (`npm run flow [-- --shots]`): 21 pass/fail checks at 800x600 — preloader,
  keyboard path, field input, sound toggle, refresh mid-page, no WebGL.

## How to verify

```
npm run lint && npm run typecheck && npx next build | tail -8
npx next start -p 3000 &
npm run shots -- <chapter-id> <375|768|1024|1440|1920> [--reduced] [--pointer=0.5,0.45] [--touch] [--offset=0.5]
npm run flow [-- --shots]
```

Before every rebuild stop the old server with `pkill -f "next start"; pkill
-f next-server`: a server left running keeps port 3000 and answers the new
build's files with 500, so the preloader never releases. `npm run flow`
takes several minutes here; run it once per change, not per iteration.

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
- Phase 4: `npm run flow` passes 21 of 21 (preloader hides content and
  releases as `complete`; Tab, Enter, exact landing, focus, active item;
  the range input moves `--field`; no `AudioContext` before the click, one
  running after, suspended when off; reload at the bottom reopens at the
  same pixel in Settle; without WebGL the drawing shows and content is
  released). Looked at: the preloader frames and the hero at 1024, the nav
  with the drop merging at 800 (2x), the hero at 375 `--touch`, the fallback.
- Phase 5a, looked at: all six chapters at 1024 `--reduced` and at 375
  `--touch`; crown, part, hold (slab) at 1440; part and reach at 768.
  Fixed: without pins each chapter now shows its own scene state
  (`unpinnedStory` in `scene/direction.ts`: crown stands, part is split, hold
  runs its three forms inside one screen); spike labels step apart instead of
  overlapping; the slab's faces bow slightly so the `field` strip bends
  across them; two Part lines were shortened so phone rows are two lines.
- Seam: hero at 1024, 16px block means in the scene region. No step between
  canvas and page; the shadow fades smoothly but does run off the right and
  bottom edges of the viewport there. Other chapters were not sampled.
- `npm run flow`: 21 of 21 after these changes.
- Not verified in phase 4: how any of the sound actually sounds (no audio
  output here), a real `webglcontextlost` (only the no-WebGL path ran), the
  cursor's stretch in motion, real load times (here the release comes about
  9 s after first paint because shaders compile on the CPU), the chapters
  other than Still since the grain and the cursor layer were added.
- Not verified: real GPU frame rate, real phones, Safari, the half-float
  path, 1920 at all, 768 and 1440 beyond the frames listed above, the page with JavaScript off (the HTML is
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
- Rules in `@layer base` lose to any utility on the same element. State that
  must hide or show an element is a variant (`scene-live:`, `scripting:`,
  `fine:`, `in-data-loaded:`), not a base rule.
- GSAP time is lag-smoothed: on slow frames it runs slower than the clock.
  Anything that must happen on time (the preloader timeout) uses
  `setTimeout` and `performance.now()`.
- New fixed UI: add `data-await-load` so the preloader hides it, and
  `data-goo` if its shape should join the cursor drop (top 160px only).
- Under automation (`navigator.webdriver`) ScrollSmoother runs with
  `smooth: 0`: at one frame per second the smoothing never arrived and shots
  caught transitions. The shot script waits up to 60 s for the preloader and
  12 s after the jump on wide screens; text reveals can still be caught
  mid-mask there, which is the slow clock, not a bug.
- SDF additions must be bounded: an unclamped product term in `sdSlab` drew
  phantom surfaces far from the slab.
- A pinned chapter is pinned for `pin / (pin + 1)` of its story unit and
  scrolls out in the rest; the next state forms during that exit.

## Left over

- Part at 768x1024: the fourth droplet is cut by the bottom edge and the
  column touches the right edge (portrait framing was tuned at 375x812;
  `shots.part` `tallX` / `tallY` in `scene/direction.ts`, or the Director's
  span for less narrow portraits). The Part heading is small at 768.
- Part at 1440: the "Commissions" heading ends a few pixels from the grain ring.
- Hold's slab face is still an even dark grey (a vertical mirror facing a
  pale room); the bent `field` strip is the only event on it.
- Crown at 1024 `--reduced`: the lattice grains reach the right end of the
  field instrument's readout.
- Settle on a phone: the pool is wider than the screen and reads as a band.
- Press and hold does nothing yet (`store.pointer.down` is only used by the
  cursor); optional in the brief. Scroll speed does stir the surface.
- Chapter change has no sound of its own, only the pad's pitch.
- The fallback drawing is one static drop for every chapter.
- `docs/ART_DIRECTION.md` promises more than exists: the cursor merges only
  with the fixed controls, not with buttons in the page, and Part rows do
  not answer hover or focus (signature moment 4). Build it
  (`store.partFocus`, swell that droplet) or correct the document.
- Settle's heading is four lines at 1024.

## Next step (phase 5b)

Read `PROMPT.md` lines 670–739 once (checklist, quality bar, deliverables).

1. Finish the widths: fix Part at 768, then look at still, crown, hold,
   settle at 768; still, reach, settle at 1440; every chapter at 1920. Wide
   shots take minutes each here (about 1 fps); one per run.
2. Add to `scripts/flow.mjs`: lost context (`WEBGL_lose_context`), a stalled
   load (block the scene chunk; the release must come as `without ...`),
   reduced motion (no pin spacers, no ScrollSmoother, content complete),
   JavaScript disabled (`javaScriptEnabled: false`: content, nav links and
   the drawing show), one H1 and heading order.
3. `app/opengraph-image.tsx` and `app/icon.tsx` generated in code from the
   tokens; check the metadata in the built HTML.
4. `README.md`: what it is, how to run, structure, scripts.
5. Self-check: read `PROMPT.md` lines 53–178 (the hard rules) once and
   compare with the repository; the version table in `CLAUDE.md`; whether
   `CLAUDE.md` and `docs/ART_DIRECTION.md` match what was built.
6. lint, typecheck, build, `npm run flow`; the pull request into `main`
   (summary, how to run, what was verified); the final report in Serbian
   (done, verified and how, not verified and why, what is weaker than
   wanted, where the author credit goes: `lib/content.ts`).
