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
| 2b | All liquid states, Director (keyframe tracks), GPGPU particles, CPU model wired to DOM labels | **next** |
| 3 | Chapters as semantic HTML with real copy, keyboard nav, then motion (pins, SplitText after fonts load) | |
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
- `scene/Director.tsx`: owns the camera. Only the hero frame so far: distance
  from the aspect ratio, subject placed with a lens shift (`setViewOffset`).
- `scene/liquid/model.ts` (no three import): constants, the live `liquid`
  state (blobs as a flat `Float32Array`, squash, blend, swell),
  `distanceToLiquid()` for the CPU, generated GLSL constants.
- `scene/liquid/shaders.ts`: raymarch in a proxy box (back faces), smooth-min
  blobs, four-tap normals, silhouette coverage from the nearest miss,
  `gl_FragDepth`, premultiplied alpha. Analytic studio: dark room with a lit
  front wall, key soft box, side strip, `field` strip, wordmark panel. Contact
  shadow and floor reflection are alpha on the floor plane. Defines per tier:
  `STEPS`, `SHADOW_STEPS`, `SELF_REFLECTION`, `FLOOR_REFLECTION`.
- `scene/liquid/LiquidMaterial.ts` (class, uniforms written through methods),
  `wordmark.ts` (canvas texture from the Archivo variable), `restingDrop.ts`
  (chapter 1 state: main blob plus a lobe that travels toward the pointer),
  `Liquid.tsx` (mesh, pointer ray, swell stirred by pointer speed).
- `lib/quality.ts` (4 tiers: DPR, raymarch steps, particle texture size,
  self-reflection), `lib/gsap.ts` (plugins, `settle` / `tension` eases,
  durations, motion queries), `lib/palette.ts`, `lib/content.ts` (draft lines).
- `scripts/shots.mjs`: screenshots, one chapter and one width per run; prints
  fps (relative: CPU rendering) and the canvas size.

## How to verify

```
npm run lint && npm run typecheck && npx next build | tail -8
npx next start -p 3000 &
npm run shots -- <chapter-id> <375|768|1024|1440|1920> [--reduced] [--pointer=0.5,0.45] [--touch]
```

`next dev -p 3000` is faster while iterating on a shader. `--pointer` parks
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
- Hero looked at by screenshot at 1440 (idle, pointer lean) and 375 (desktop
  tier and `--touch` tier 0, before its DPR cap was raised). Reduced motion
  at 1440 ran without console errors; its image was not looked at. The wordmark reads in the
  reflection; the page color is untouched outside the shadow (pixel sampled).
- Cost, relative only (SwiftShader, CPU): 16 fps at 1440x900, 40 fps at tier
  0 on 375x812. The SDF passed on look and cost; no displaced mesh needed.
- Not verified: real GPU frame rate, real phones, Safari. Self-reflection
  compiles but has never had concave geometry to show; judge it in Crown.

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
- Open: the H1 is the wordmark "Tarn" for now; decide in phase 3 whether the
  H1 should carry the story line. Type scale and letter-spacing are first guesses.

## Next step (phase 2b)

`PROMPT.md` is not needed to start: this file and `docs/ART_DIRECTION.md`
(chapters table, signature moments, scene decisions) carry the brief for 2b.
Open lines 467–479 and 534–578 only if a rule is unclear. 2b is the largest
phase: commit after every state, and hand over after step 2 if the session
has grown. In order, one screenshot-verified step at a time:

1. Director: keyframe tracks over `store.story` for camera, lens shift and a
   state weight per chapter; `restingDrop` becomes one state among several
   that write into `liquid`.
2. Liquid states: Reach (cusp toward a magnet point), Crown (hex lattice of
   cones in the SDF, height from `store.field` and scroll; lattice constants
   in `model.ts` with the same tip positions on the CPU), Part (4 droplets),
   Hold (bridge, slab, spiked sphere), Settle (wide pool, strong squash). The
   model has only spheres; add primitives as states need them.
3. GPGPU particles: dark round grains, float target with half-float
   fallback, depth-tested against the liquid's `gl_FragDepth`.
4. A projection helper for DOM labels (spike tips, droplet centres).

The proxy box bounds are fixed (`liquidModel.bounds`); wide states (pool,
droplets) may need them larger or animated.
