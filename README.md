# Tarn

A single-page, scroll-driven 3D story for a fictional studio that formulates
magnetic liquid (ferrofluid) and builds the fields that shape it. One body of
mirror-black liquid rests, reaches, stands up in a crown of spikes, parts into
droplets, holds three designed forms and settles again while the page scrolls
through six chapters.

Tarn is not a real company. The site is a concept piece: frontend only, no
backend, no database, no asset files.

## How it is built

- **Two layers.** All content is server-rendered semantic HTML that reads
  without JavaScript, WebGL or animation. Behind it sits one fixed, decorative
  WebGL 2 canvas with one continuous scene.
- **One shared object** (`lib/store.ts`) connects them: GSAP writes the scroll
  state, the scene reads it every frame. Nothing re-renders on scroll.
- **Procedural 3D.** The liquid is a raymarched signed distance field (GLSL),
  lit by an analytic studio; the grains around it are GPU particles. The
  wordmark in the reflections is drawn to a canvas texture.
- **Motion** is GSAP (ScrollTrigger, ScrollSmoother, SplitText).
  `prefers-reduced-motion` removes pins and smooth scrolling.
- **Sound** is synthesized with the Web Audio API and is off until switched on.
- **Fallbacks.** Without WebGL 2, after a lost context or without scripts, a
  drawn drop replaces the scene and the content stays complete.

Next.js (App Router, static), React, TypeScript, Tailwind CSS, three.js with
React Three Fiber. Exact versions are in `package.json` and `CLAUDE.md`.

## Run

Node 22 or newer.

```bash
npm ci
```

```bash
npm run dev
```

Production build:

```bash
npm run build
```

```bash
npm run start
```

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | development server |
| `npm run build` / `npm run start` | production build and server |
| `npm run lint` | ESLint, including the React Compiler rules |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run shots -- <chapter> <width>` | screenshot of one chapter at one width into `shots/` (needs a running server; options are listed at the top of `scripts/shots.mjs`) |
| `npm run flow` | pass/fail walk through the preloader, keyboard path, field input, sound toggle, refresh, fallbacks, reduced motion and the page without JavaScript |

Both verification scripts drive headless Chromium through Playwright. The
frame rate they print comes from a software renderer and says nothing about
real devices.

## Structure

```
app/          route, tokens (globals.css), metadata, social image, icon
components/   DOM components; chapters are server components
scene/        everything that imports three (client only, loaded dynamically)
lib/          store, content, GSAP setup, quality tiers, load clock, audio
hooks/        shared hooks
scripts/      verification scripts
docs/         art direction and the working summary
```

All copy lives in `lib/content.ts`, including the author credit, which is a
placeholder to fill in. Colors are tokens in `app/globals.css`, mirrored for
the WebGL layer in `lib/palette.ts`.
