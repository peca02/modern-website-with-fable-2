# CLAUDE.md

Single-page showcase site: a scroll-driven 3D story for a fictional ferrofluid
(magnetic liquid metal) brand. Frontend only, no backend, no database.
Deployment target: Vercel.

- Full brief: `PROMPT.md` (read it in the first session; later sessions read it
  only when a rule here or in the docs is not enough).
- Look, motion and copy rules: `docs/ART_DIRECTION.md`.
- Current state and next step: `docs/SESSION_SUMMARY.md`.

## Brief map

`PROMPT.md` is long. Read only the lines for the phase at hand, once.

| Phase | Lines | Content |
| --- | --- | --- |
| 2 scene | 467–479, 534–578 | scene pattern, liquid, particles, light scene |
| 3 chapters | 322–346, 481–494, 520–526, 580–584, 705–718 | look and seed facts, GSAP pattern, readability, chapters, quality bar |
| 4 preloader, cursor, sound, fallbacks | 496–518, 586–600 | sound, resilience patterns, interaction, reduced motion and fallbacks |
| 5 verification and delivery | 670–739 | checklist, quality bar, final deliverables |

## Language

- Everything written to the owner (plan, announcements, questions, reports): Serbian.
- Everything that goes into the repository (code, comments, docs, commit
  messages, PR text) and all site copy: English.

## Stack

Exact versions are written here as soon as the trial install confirms them.
Keep this table current; never write "latest".

| Package | Version |
| --- | --- |
| Node / npm | 22.23.4 / 10.9.9 |
| next / eslint-config-next | 16.4.6 |
| react / react-dom | 19.3.1 |
| typescript | 6.0.3 (7.x breaks typescript-eslint) |
| tailwindcss / @tailwindcss/turbopack | 4.3.5 |
| three / @types/three | 0.187.0 |
| @react-three/fiber | 9.8.2 |
| @react-three/drei | 10.7.9 |
| postprocessing / @react-three/postprocessing | not installed; 6.39.6 / 3.2.2 verified compatible, add only if a frame needs it |
| gsap / @gsap/react | 3.15.1 / 2.1.2 |
| react-icons | 5.7.0 |
| eslint / eslint-plugin-react-hooks | 9.39.5 (10.x breaks eslint-config-next) / 7.1.1 |
| babel-plugin-react-compiler | 1.0.0 (`reactCompiler: true`) |
| @types/react / @types/react-dom / @types/node | 19.3.0 / 19.3.0 / 22.20.5 |
| playwright (dev only) | 1.63.0 (must match the preinstalled Chromium) |

Renderer: WebGL 2 + GLSL. No WebGPU, no TSL. The canvas is transparent over the
CSS page color; there are no WebGL post passes (grain is a DOM overlay).
Tailwind runs through the `@tailwindcss/turbopack` loader (see `next.config.ts`).

## Working mode and budget

The owner is on a small 5-hour usage limit. Saving tokens matters more than speed.

1. Start in the main thread. Everything connected (foundation, tokens, scene,
   integration, fixes, polish) stays there.
2. A task appears? Use an agent only if it is all three: large (hours, many
   files), isolated (owns files nobody else touches), and describable in a
   short brief. Otherwise it stays in the main thread.
3. Agents run strictly one at a time: announce it to the owner in one sentence
   (which task, why not the main thread), launch it without waiting for
   approval, wait, review, commit, push. Never two at once, never in a batch,
   never parallel.
4. Write what should have gone differently into the next agent's brief.
5. Interrupted agent: little work left → the main thread finishes it; a lot
   left → relaunch it.
6. Reviews: the main thread does the first pass. A reviewer agent is only for
   "fresh eyes", one at a time.
7. Commit and push after every step that works. The session can stop at any moment.
8. Keep context small: read a file once and only the part needed; tail logs;
   one chapter and one width per screenshot run.
9. End of every phase, or earlier if the session is getting large: update
   `docs/SESSION_SUMMARY.md` (done, verified, remaining, open questions, file
   paths, branch name), commit, push, tell the owner it is a good moment for a
   new session and give the one line to paste into it, with the branch name.
   Never wait for autocompact.
10. A new session starts by reading this file, `docs/SESSION_SUMMARY.md` and
    `docs/ART_DIRECTION.md` — not the codebase. Then: `git fetch origin`; if
    the newest `claude/...` branch has commits this branch lacks, merge it;
    `npm ci` if `node_modules` is missing. Open only the code files the next
    step changes.
11. After a limit reset or a long pause, continue exactly one thing.
12. Keep this file, `docs/ART_DIRECTION.md` and `docs/SESSION_SUMMARY.md` short.
13. Never depend on Ultracode or ask the owner to enable it.

## Architecture

- Two layers that never mix. The DOM layer holds all real content as
  server-rendered semantic HTML, readable without JavaScript, WebGL or
  animation. The WebGL layer is one fixed, decorative (`aria-hidden`)
  `<Canvas>` behind the DOM with one continuous scene.
- The layers talk only through the shared mutable object in `lib/store.ts`.
  GSAP writes scroll state into it; the scene reads it every frame.
- No per-frame React state and no re-renders on scroll or pointer move.
- Anything that imports `three` loads through `next/dynamic` with
  `ssr: false`, from inside a client component.
- Shader uniforms are written through refs or class instances. Never mutate a
  memoized value or a hook return value (React Compiler lint forbids it).
- All copy lives in `lib/content.ts`. Colors come only from tokens.
- The author credit stays the placeholder (`Your Name`, `#`) in
  `lib/content.ts`. Never write the owner's real name or email into the
  repository. Never push to `main`; it is reached only by the final pull request.
- One route, statically prerendered. Chapters are server components; client
  components are small and add only motion and interaction.
- 3D is fully procedural: own geometry, GLSL, GPU particles. No GLTF/GLB, no
  downloaded images, audio or other asset files. OG image and icons are
  generated in code.

## Structure

```
/app          routes, globals.css (tokens), opengraph-image.tsx, icon.tsx
/components   DOM components (server by default)
/scene        everything that imports three (client only, dynamically loaded)
/lib          store, content, gsap, quality, loadClock, palette, audio, utils
/hooks        custom hooks
/types        shared types
/scripts      dev-only verification scripts (Playwright)
/docs         ART_DIRECTION.md, SESSION_SUMMARY.md
```

Create folders only when needed. No empty directories.

## Code standards

- TypeScript strict. No `any`, no type assertions used to silence errors, no
  `@ts-ignore`. Fix the root cause.
- ESLint with the React Compiler rules. Never disable a rule.
- Named exports only. Exception: files where Next.js requires a default
  export (`page.tsx`, `layout.tsx`, `opengraph-image.tsx`, `icon.tsx`, …).
- camelCase for variables and functions; PascalCase for components, types, classes.
- No obvious comments. Explain why, only when needed.
- Before writing complex functionality from scratch, check whether an
  installed or well-known library already solves it.
- `npm run lint`, `tsc --noEmit` and `next build` must pass before a phase is
  called done.

## Components

- Server components by default. A client component exists only for motion or
  interaction, and stays small.
- Functional, focused, one main component per file.
- Reuse before creating. Extract repeated UI. Prefer composition and props;
  add variants only for real, predefined options. No duplicate versions.
- No prop drilling: the store or Context instead.

## Styling

- Design tokens are the single source of truth, defined as CSS variables in
  `app/globals.css` (`@theme`). The default Tailwind palette is disabled.
- Semantic Tailwind utilities mapped to tokens for color, shadow, radius,
  easing. Standard utilities for layout and spacing.
- No hex codes in components. No arbitrary Tailwind values unless unavoidable.
  No extra CSS files unless unavoidable.
- Layout spacing: Tailwind scale only (multiples of 4px / 0.25rem; em in
  multiples of 0.25em). Letter-spacing and fluid sizes are tokens, not
  ad-hoc values.
- One page grid: 4 columns on phones, 12 from tablet up.
- Type sizes are fluid (`clamp()`), set through composite classes
  (`type-hero`, `type-display`, `type-micro`, …), not per breakpoint.

## Typography

- Fonts only through `next/font`. No CDN or external CSS.
- Body line height 1.4–1.6; large text 1.1–1.3; line length 50–75 characters.

## Animation and sound

- GSAP for all animation: ScrollTrigger, ScrollSmoother, SplitText, with
  `@gsap/react`. No Lenis, no Motion. Native CSS only for simple hover and
  focus transitions.
- Plugins are registered once in `lib/gsap.ts`, which also defines the motion
  language (shared eases and durations). Use the GSAP skills in
  `.claude/skills/` when writing GSAP code.
- Fixed elements (canvas, navigation, cursor) stay outside the ScrollSmoother wrapper.
- `gsap.matchMedia()` provides a `prefers-reduced-motion` variant: no pins,
  no smooth scroll.
- Sound is synthesized with the Web Audio API and stays off until the user
  turns it on.

## Icons, images, links

- Icons only from `react-icons`.
- No raster assets in the repo. If an image is ever unavoidable, use `next/image`.
- `next/link` for internal navigation.

## Responsive and performance

- Works on phone, tablet and desktop. Phones get the same site at a lower
  quality tier (`lib/quality.ts`) with portrait framing.
- Post-processing is selective and switched off on weak devices.
- Text over the scene stays readable at every scroll position.

## Accessibility

- Full keyboard navigation, visible focus states, screen-reader compatible.
- Semantic HTML first; ARIA only when native semantics are not enough.
- Every interactive control is a real DOM element; the canvas is decoration.

## SEO and metadata

- Next.js Metadata API (static `metadata` export; `generateMetadata` only if
  something is dynamic).
- One H1 per page; heading levels in order, none skipped.

## Honesty

- Never claim something works that could not be verified in the cloud (real
  frame rate, real phones, audio output, Safari). List it as unverified.
- Verification is part of every phase: look at a screenshot of each frame you
  build (`npm run shots`) and improve it before moving on.
