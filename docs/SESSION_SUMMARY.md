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
| 2a | Raymarched SDF liquid, shading, analytic studio, hero state, pointer | **next** |
| 2b | All liquid states, Director (keyframe tracks), GPGPU particles, shared CPU/GPU model for DOM labels | |
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
  lowering the tier; sets `html[data-scene=ready]`.
- `scene/PlaceholderDrop.tsx`: a flat black sphere, only a wiring test. Delete in 2a.
- `lib/quality.ts` (4 tiers: DPR, raymarch steps, particle texture size,
  self-reflection), `lib/gsap.ts` (plugins, `settle` / `tension` eases,
  durations, motion queries), `lib/palette.ts`, `lib/content.ts` (draft lines).
- `scripts/shots.mjs`: screenshots, one chapter and one width per run.

## How to verify

```
npm run lint && npm run typecheck && npx next build | tail -8
npx next start -p 3000 &
npm run shots -- <chapter-id> <375|768|1024|1440|1920> [--reduced]
```

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
- Only the hero at 1440 was looked at. Phone widths were not reviewed.

## Notes

- Owner feedback: the placeholder frame looked crude ("a circle drawn in
  Paint"). The look of the liquid is the main risk and the main expectation.
  In 2a judge the liquid by screenshot and iterate on gloss, reflections and
  weight before building anything on top of it.
- ScrollSmoother makes `#smooth-wrapper` fixed: `scrollIntoView` does not
  work. Jump with `window.scrollTo` or `ScrollSmoother.get()?.scrollTo()`.
- Changes from the approved plan, already told to the owner: no monospace
  (condensed Archivo for small labels), `ink` is pure `#000000`.
- Open: the H1 is the wordmark "Tarn" for now; decide in phase 3 whether the
  H1 should carry the story line. Type scale and letter-spacing are first guesses.
- Not done yet: seam check by pixel sampling (once the liquid draws a shadow).

## Next step (phase 2a)

Read `PROMPT.md` lines 467–479 and 534–578 first. Then create `scene/liquid/`:

1. A shared model module (blob centres, radii, lattice constants, field
   parameters) that generates GLSL constants and exposes the same maths to the CPU.
2. A raymarch material on a full-screen or proxy quad: smooth-min body,
   four-tap normals, `gl_FragDepth`, premultiplied alpha, steps from the tier.
3. Analytic studio environment: soft boxes, horizon gradient, one `field`
   strip, the wordmark as a canvas texture light. Fresnel, self-reflection on
   tiers 2–3, contact shadow and a faint floor reflection as alpha.
4. The resting drop leaning toward `store.pointer`, framed lower right on wide
   screens and in the lower half on portrait.
5. Screenshot still at 1440 and 375, iterate on the look, then check cost at
   tier 0. Fall back to a displaced mesh only if the SDF fails there.
