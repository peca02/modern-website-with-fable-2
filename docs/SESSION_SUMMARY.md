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
  (NDC, velocity, down, active), `field`, `viewport`, `reducedMotion`, `quality`.
- `components/SmoothScroll.tsx`: ScrollSmoother (full motion only), chapter
  ScrollTriggers, a ticker that writes scroll state to the store.
- `components/PointerInput.tsx`, `components/SceneMount.tsx` (`next/dynamic`, `ssr: false`).
- `scene/Scene.tsx`: Canvas (transparent, tier-based DPR), `PerformanceMonitor`
  lowering the tier; sets `html[data-scene=ready]`. Mounts `Director` and `Liquid`.
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

`next dev -p 3000` is faster while iterating on a shader. `--offset` scrolls that many viewport heights past the chapter top. `--pointer` parks
the mouse at viewport fractions; `--touch` emulates a 3x phone (tier 0).
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
- The proxy volume follows the pose (`extentX/Z`); wide poses set their own.
- Open: the H1 is the wordmark "Tarn" for now; decide in phase 3 whether the
  H1 should carry the story line. Type scale and letter-spacing are first guesses.

## Next step (phase 3)

Read `PROMPT.md` lines 322–346, 481–494, 520–526, 580–584, 705–718 once.
Replace `app/page.tsx` with real chapters (server components, copy in
`lib/content.ts`), keyboard navigation, then motion. Pinned chapters (Crown,
Part, Hold) get their length from the pin, so `store.story` keeps meaning
"chapter index + progress"; retime the keys in `scene/direction.ts` against
the real layout (with the placeholder sections each chapter is one viewport
and the Hold forms pass too fast). Wire the field `<input type="range">` to
`store.field`, spike labels and list rows to `store.anchors`.

Known rough spots to judge again once the layout is real: the slab face is a
flat grey mirror with a thick `field` band on top; Reach field lines must
stay grainy and not read as drawn hairlines; portrait framing of Crown sits
mid-screen, not top; low tiers show blocky reflections between spikes.
