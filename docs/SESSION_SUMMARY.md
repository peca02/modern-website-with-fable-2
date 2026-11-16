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
| 3 | Chapters as semantic HTML with real copy, keyboard nav, then motion (pins, SplitText after fonts load) | **next** |
| 4 | Preloader (`lib/loadClock.ts`), droplet cursor and goo layer, sound, grain overlay, SVG fallback | |
| 5 | Phone and reduced motion, full verification, OG image, icons, README, pull request, final report | |

## What exists

- `app/globals.css`: tokens (`@theme`, default palette off), `type-*` classes,
  `page-grid` (4 / 12 columns), `text-shadow-halo`, focus ring.
- `app/layout.tsx`: fonts (Archivo with `wdth`, Instrument Sans), metadata.
  Canvas and pointer input sit outside the ScrollSmoother wrapper.
- `app/page.tsx`: placeholder sections with `data-chapter` (replace in phase 3).
- `lib/store.ts`: `scroll`, `story` (chapter index + progress), `pointer`
  (NDC, velocity, down, active), `field`, `viewport`, `anchors`,
  `reducedMotion`, `quality`.
- `components/SmoothScroll.tsx`: ScrollSmoother (full motion only), chapter
  ScrollTriggers, a ticker that writes scroll state to the store.
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
- Hero at 1024 is unchanged after 2b (screenshot). Looked at, 1024 wide:
  reach +0.3, crown +0.5 (profile) and +0.8 (top), part +0.45, hold +0.1 /
  +0.4 / +0.65 (bridge, slab, orb), settle; crown +0.5 at 375 `--touch`.
  Grains are hidden by the liquid where they pass behind it.
- Cost, relative only: this session's container had 4 cores and ran the 2a
  commit at 2 fps (it measured 16 before), 2b at 1–2 fps at 1024x768. No
  usable frame-rate number came out of it.
- Not verified: real GPU frame rate, real phones, Safari, the half-float
  path, `store.anchors` against pixels (check when the first label uses
  them), reduced motion images, widths other than 1024 and one phone frame.

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
- Open: the H1 is the wordmark "Tarn" for now; decide in phase 3 whether the
  H1 should carry the story line. Type scale and letter-spacing are first guesses.

## Next step (phase 3)

Read `PROMPT.md` lines 322–346, 481–494, 520–526, 580–584, 705–718 once (65
lines); the rest of the brief for this phase is in `docs/ART_DIRECTION.md`
(chapters table, signature moments 3 and 4, framing rules, voice, quality
bar). Phase 3 is large: commit after every step and hand over after step 2
if the session has grown.

1. Content: write all copy into `lib/content.ts` (it holds one draft line
   per chapter now). Each chapter needs a heading and running text; Crown
   needs the field instrument label and three spike labels; Part needs the
   list of what Tarn makes (fluids, fields, vessels, commissions) with a line
   each; Settle carries the closing line and the credit. Only the seed facts
   in the art direction may be stated as facts.
2. Structure: replace `app/page.tsx` with chapter server components, a fixed
   navigation outside the smoother (jump to any chapter by keyboard, active
   item in `field`), a footer. Decide the H1 question (see Notes). Check the
   page with JavaScript off and by keyboard before adding motion.
3. Motion: pins for Crown, Part and Hold through `data-pinned` and the
   `in-data-pinned:` variant; SplitText line-mask reveals after
   `document.fonts.ready`; a reduced-motion variant with no pins.
4. Wiring: the field `<input type="range">` writes `store.field` (the scene
   takes the stronger of it and the scroll track, only in Crown); spike
   labels and Part rows read `store.anchors` on the GSAP ticker and write
   transforms through refs. Verify the anchors against a screenshot.
5. Retime `scene/direction.ts` against the real layout and check text against
   the subject at every chapter (375, 768, 1440).

What the timing depends on:

- `store.story` comes from the `[data-chapter]` triggers in
  `components/SmoothScroll.tsx` (top at top → bottom at top). For a pinned
  chapter keep `data-chapter` on an outer element whose height includes the
  pin distance, so its progress spans the whole pin.
- The last chapter never scrolls out, so `story` ends near 5.0: every key of
  Settle must be reached by 4.95, and the pool forms while Settle scrolls in.
- A flow chapter's state is reached as its top arrives (key at the chapter
  index); what develops inside a chapter runs on the tracks after it.
- Where the subject sits now, wide / portrait: Still lower right / lower
  half; Reach left / upper middle; Crown centre-right / middle; Part a column
  of four droplets at the right; Hold centre; Settle along the bottom. Text
  takes the other side; move the shot (`wideX/Y`, `tallX/Y`), not the text
  over the liquid.

Known rough spots to judge again once the layout is real: the slab face is a
flat grey mirror with a thick `field` band on top; Reach field lines must
stay grainy and not read as drawn hairlines; portrait framing of Crown sits
mid-screen, not top; low tiers show blocky reflections between spikes; with
the placeholder sections every chapter is one viewport, so the Hold forms
pass too fast and states run ahead of their headings.
