# PROMPT.md — build the whole site from this one brief

You are Claude Code, running in the cloud on this GitHub repository. Your job is
to design and build a complete, award-level website on your own, from this file
alone. The repository contains only this file, `CLAUDE.md` and the skills in
`.claude/skills/`. There is no other brief, no design file, no previous code.

Read this file completely once, then follow it. `CLAUDE.md` holds the short
rules that apply in every session; this file holds the details. If the two ever
seem to disagree, the hard rules in section 3 win, and you fix the wording in
`CLAUDE.md`.

How this file is organized:

- Sections 1–3: language, mission, **hard rules** (not negotiable).
- Section 4: the one-glance decision flow.
- Section 5: the phase before code — **the only point where you wait for the owner**.
- Sections 6–7: the concept (what is fixed, what you decide) and the previous
  site you must not repeat.
- Sections 8–10: stack, the **default recipe** (deviate only with a reason in
  the plan), and **suggestions** (free to change).
- Sections 11–15: phases, session protocol, verification, quality bar, final
  deliverables.

Three strengths of statement are used and they are kept apart on purpose:

- **HARD RULE** — must hold. Never trade it away.
- **DEFAULT** — a recipe that worked before. Use it unless you give a reason in the plan.
- **SUGGESTION** — a starting idea. Replace it freely if you have something better.

---

## 1. Language (HARD RULE)

- Everything you write **to the owner** is in **Serbian**: the plan,
  announcements, questions, progress notes, the final report.
- Everything that goes **into the repository** is in **English**: code,
  comments, docs, commit messages, the pull request text, and all site copy.

---

## 2. Mission

Build a brutally modern, beautiful frontend website: scroll animation and 3D,
no database, not a web app. It is a showpiece that proves the owner can build
powerful, non-template sites at the level of Awwwards winners. It should look
like it cost several thousand dollars, and it must be interactive.

After the plan is approved you work to the end without questions.

---

## 3. Hard rules

### 3.1 Working conditions

- **H1.** The owner is on a Pro plan with the most expensive model. The 5-hour
  usage limit is small. **Saving tokens matters more than speed.**
- **H2.** Autocompact is set to 400k tokens. **Never wait for it.** Close the
  session earlier with a summary (3.3).
- **H3.** The session can stop at any moment (limit, container reclaim, the
  owner closing the app). **Commit and push after every step that works.**
  Never leave more than one step of uncommitted work.
- **H4.** Do not use Ultracode, do not depend on it, and never ask the owner to
  enable it or any other special mode.
- **H5.** The owner may be away from the computer. After plan approval, stop
  only for a manual step you truly cannot do yourself, and say exactly what the
  owner must do.

### 3.2 How work is divided

- **H6.** The main thread is the default. Everything connected is done there:
  foundation, design tokens, the 3D scene, integration, fixes, polish.
- **H7.** An agent is allowed only for a task that meets **all three** conditions:
  1. it is **large**: hours of work and many files;
  2. it is **isolated**: it owns files nobody else touches;
  3. it can be **described in a short brief**, without reading half the project.
- **H8.** Agents run **strictly one at a time**: launch one, wait until it
  finishes, review the result, commit and push, and only then consider the
  next. Never two at once. Never a batch.
- **H9.** **No parallel agents, ever.** They cost about the same tokens as
  sequential agents but can burn the whole limit in minutes, and every agent
  interrupted mid-task pays for its whole context again when resumed.
- **H10.** Before launching an agent, tell the owner in **one sentence** which
  task it gets and why the main thread is not doing it — then launch
  immediately. Do not wait for confirmation.
- **H11.** If something should have gone differently with the previous agent,
  write that into the next agent's brief.
- **H12.** If an agent is interrupted with little work left, the main thread
  finishes it. Relaunch an agent only if a lot of work is left.
- **H13.** Reviews follow the same rule: the main thread does the first pass. A
  reviewer agent is used only when "fresh eyes" are needed, one at a time.

An agent brief contains: the goal, the files it owns, the files it may read
(always `CLAUDE.md` and `docs/ART_DIRECTION.md`), what it must not touch, the
definition of done (lint and typecheck pass), and that it must not commit. You
review and commit.

### 3.3 Protecting the limit

- **H14.** Keep context small. Read a file once, and only the part you need.
  Find things with search instead of opening files. Do not re-read a file you
  just wrote. Show yourself the tail of a build log, not the whole log.
- **H15.** Screenshots: one chapter and one width per run. Look only at the
  images you need for the decision at hand.
- **H16.** At the end of every phase write `docs/SESSION_SUMMARY.md` (what was
  done, what was verified, what remains, open questions, with file paths and
  the branch name), commit, push, and tell the owner this is a good moment for
  a new session.
- **H17.** If the session becomes large before a phase ends, summarize it into
  the same file or propose a new session. If you can see context usage, treat
  roughly 200k tokens as the ceiling; if you cannot, use the signs: many files
  read, long debugging, many screenshots viewed.
- **H18.** A new session starts by reading `CLAUDE.md`,
  `docs/SESSION_SUMMARY.md` and `docs/ART_DIRECTION.md` — not the whole
  codebase and not this file again unless needed.
- **H19.** Files read by every session and every agent (`CLAUDE.md`,
  `docs/ART_DIRECTION.md`, `docs/SESSION_SUMMARY.md`) stay short.
  `SESSION_SUMMARY.md` is rewritten, not appended to.
- **H20.** After a limit reset or a long pause, continue **exactly one thing**:
  check `git status` and `git log`, finish the single interrupted step, commit,
  push. Only then return to the plan. Do not start an agent until that step is
  closed.

### 3.4 Technology

- **H21.** Next.js (App Router), React, TypeScript strict, Tailwind CSS 4.
  Stable releases only (no canary, beta, rc or alpha) unless the plan gives a
  reason.
- **H22.** ESLint with the React Compiler rules. No `any`. No disabled rules,
  no `@ts-ignore`, no type assertions to silence errors.
- **H23.** Three.js through React Three Fiber, with Drei for ready-made helpers.
  Write your own components and shaders wherever a unique look or more control
  is needed.
- **H24.** All 3D is procedural: own geometry, GLSL shaders, GPU particles.
  **No GLTF/GLB models. No downloaded images, sounds or other asset files** —
  this includes HDRI environment maps and Drei presets that fetch files from a
  CDN. The OG image and the icons are generated in code
  (`app/opengraph-image.tsx`, `app/icon.tsx`).
- **H25.** Renderer: WebGL with GLSL, unless the stable R3F release fully
  supports WebGPU and the whole stack is compatible. You verify this and
  explain the decision in the plan. **Never mix WebGL-only and WebGPU-only
  solutions.**
- **H26.** GSAP for all animation, with ScrollTrigger, ScrollSmoother and
  SplitText, through `@gsap/react`. **No Lenis. No Motion (Framer Motion).**
  Native CSS only for simple hover/focus transitions.
- **H27.** Sound is synthesized with the Web Audio API and is off until the
  user clicks to enable it. No audio files.
- **H28.** Icons only from `react-icons`. Fonts only through `next/font`. No
  external stylesheets.
- **H29.** Playwright is a development tool only (checking look and flow). It
  never ships in the site bundle.
- **H30.** Before writing complex functionality from scratch, check whether an
  existing library already solves it.
- **H31.** Package versions are established by a real trial install and checked
  for mutual compatibility. Never from memory. No `--force`, no
  `--legacy-peer-deps`.

### 3.5 Concept

- **H32.** The theme is fixed in section 6 (ferrofluid / liquid metal, light
  tone). It must not be about perfume and must not be about fusion or
  stellarators.
- **H33.** The new site differs from the previous one (section 7) in niche,
  story, central object, accent color, visual signature and copy voice.

### 3.6 Honesty

- **H34.** Verification is part of the work (section 13).
- **H35.** Never claim that something works if it cannot be verified in the
  cloud: real frame rate, real phones, audio output, Safari. List it as
  unverified.
- **H36.** Important steps are never skipped silently. If a step needs the
  owner (a skill, a permission, an environment setting), say so with exact
  instructions **before** starting.

---

## 4. Decision flow at a glance

1. **Start in the main thread.**
2. **A task appeared?** Check: large + isolated + briefly describable?
   - No → it stays in the main thread.
   - Yes → announce the agent in one sentence, launch one, review, commit and push.
3. **The main session is too large?** Write `docs/SESSION_SUMMARY.md` and
   propose a new session.
4. **The limit ran out?** After the reset, continue only one thing.

---

## 5. Phase 0 — before any code (the only wait point)

Do these in order, cheaply. Write nothing to the project until the plan is
approved, except fixing a missing skill (5.2).

### 5.1 Environment check

- Node and npm versions; repository state (`git status`, branches, remote);
  network (npm registry reachable; `fonts.googleapis.com` reachable, because
  `next/font/google` downloads fonts at build time).
- Chromium is already installed in the cloud container — use it. **Do not run
  `playwright install`.** Find the preinstalled Playwright version
  (`node -e "console.log(require('playwright/package.json').version)"`) and pin
  the project's `playwright` devDependency to **exactly that version**, so it
  matches the installed browser build. Note: a bare ESM `import 'playwright'`
  does not see globally installed packages, which is why the project needs its
  own pinned copy.
- Observed in this repository's cloud environment on 2026-11-16 (verify again,
  it may have changed): Node 22.23.4, npm 10.9.9, Playwright 1.63.0 with
  Chromium under `/opt/pw-browsers`, npm registry and Google Fonts reachable.
- If a font host is blocked, the fallback is a Fontsource npm package loaded
  through `next/font/local`. Say so in the plan.

### 5.2 Skills check

- The official GSAP skills are committed in `.claude/skills/` (`gsap-core`,
  `gsap-timeline`, `gsap-scrolltrigger`, `gsap-plugins`, `gsap-react`,
  `gsap-performance`, `gsap-utils`), together with `frontend-design`.
- Confirm they appear in your available skills. If they are in the folder but
  not listed, read the needed `SKILL.md` directly when you write GSAP code.
- If the folder is missing: clone `https://github.com/greensock/gsap-skills`,
  copy its `skills/gsap-*` folders into `.claude/skills/`, commit and push.
- Only if that is impossible, tell the owner the exact manual step: in a local
  clone run `npx skills add https://github.com/greensock/gsap-skills`, choose
  Claude Code and project scope, commit the `.claude/skills` folder and push.
- Use the GSAP skills whenever you write GSAP code. Use `frontend-design` when
  you write the art direction. Where a skill's general advice conflicts with
  this brief, this brief wins.

### 5.3 Versions by trial install

- Find the current stable version of every package (`npm view <pkg> version`,
  dist-tags) and install them together in a scratch directory outside the
  repository. Check peer dependency warnings. Run a minimal build.
- Packages to settle: next, react, react-dom, typescript, tailwindcss (v4) and
  its PostCSS plugin, eslint, eslint-config-next, eslint-plugin-react-hooks
  (the release that ships the React Compiler rules), three, @types/three if
  needed, @react-three/fiber, @react-three/drei, the post-processing
  package(s), gsap, @gsap/react, react-icons, playwright.
- Decide whether to enable the React Compiler itself in `next.config`, in
  addition to its lint rules (recommended if it is stable in the installed
  Next.js).
- The repository is not empty, and `create-next-app` may refuse a non-empty
  folder. Scaffold in a scratch directory and move the files in, or set the
  project up by hand.

### 5.4 WebGL or WebGPU

Check, then decide and explain in the plan:

- Does the **stable** R3F release fully support the WebGPU renderer?
- Do the Drei helpers you plan to use work with it?
- What is the post-processing path (the common post-processing library is
  WebGL-only)?
- How would GPGPU particles work (compute vs. ping-pong render targets)?
- Can it be verified in headless Chromium in the cloud?
- What happens on Safari and on phones?

The expected answer is WebGL 2 with GLSL. Choose WebGPU only if every point
passes. Never mix the two.

### 5.5 The plan (in Serbian, one message)

1. **Brand and niche** — name, what the fictional company does, the one-line story.
2. **Art direction** — palette with hex values, typefaces and their roles,
   visual signature, motion language, copy voice with three sample lines.
3. **Chapter list** — name, purpose, state of the 3D subject, framing, what the
   text does.
4. **Signature moments** — the three to five moments people will remember.
5. **Exact package versions** from the trial install.
6. **WebGL or WebGPU**, with the reasoning.
7. **Division of work** — for each large piece: main thread or agent, and why.
   Expect most of it in the main thread.
8. **Sessions** — how the work splits into sessions, if needed.
9. **Difference from the previous site** — a table against section 7: niche,
   story, central object, accent color, visual signature, copy voice.
10. **Deviations** from the default recipe (section 9), each with a reason.
11. **Manual steps** needed from the owner, if any, with exact instructions.

Then **stop and wait** for the owner's confirmation. This is the only wait.

### 5.6 Right after approval

- Write the exact versions into the table in `CLAUDE.md` and fill in the renderer line.
- Write `docs/ART_DIRECTION.md` (short: palette, type, signature, motion
  language, voice, chapter table, framing rules).
- Write the first `docs/SESSION_SUMMARY.md` with the phase list.
- Commit and push. From here on, work to the end without questions.

---

## 6. The concept

### 6.1 Fixed by the owner (HARD RULE)

- **Niche:** ferrofluid — magnetic liquid metal. A fictional materials brand
  or studio built around it.
- **Central 3D subject:** one body of glossy black magnetic liquid with several
  clearly different states (for example: resting mirror-calm drop or pool →
  reaching toward a field → a crown of spikes → splitting into droplets and
  merging again → holding a designed form).
- **Interaction:** the pointer is the magnet. The liquid responds to it. On
  touch devices, touch and drag do the same.
- **Tone:** light. A bright, paper-like page with a dark subject and one strong
  cold accent. This is the opposite of the previous site on purpose.
- **Copy language:** English. The brand is fictional; do not present invented
  product claims as facts about real products.
- **Author credit:** a discreet "Design & build" line in the footer. The name
  and link are a single entry in `lib/content.ts` with a neutral placeholder
  (`Your Name`, `#`). Never put the owner's real name or email in the
  repository; the owner fills it in.

### 6.2 You decide in the plan

Brand name, what the company makes, the story line, exact palette, typefaces,
chapter names and count, signature moments, the voice.

Do a quick sanity check that the brand name is not an obvious, well-known
existing brand in materials, audio or tech. You cannot check trademarks; say
that.

### 6.3 Direction for the look (SUGGESTION, within the fixed tone)

- **Page:** a neutral or cool off-white (porcelain, chalk, pale mineral grey).
  Avoid the generic "warm cream background + terracotta accent + serif
  display" look.
- **Subject:** true glossy black that mirrors a studio of soft lights. Weight,
  surface tension, reflection.
- **Accent:** one vivid cold color (for example ultramarine, electric cobalt,
  cold violet or a teal). Not orange, not red, not amber, and not a pale
  ice-blue. Use it sparingly; a strong place for it is inside the liquid's
  reflections.
- **Visual signature:** mass and gloss. Solid black liquid shapes, meniscus
  curves where shapes join, reflections. In the DOM: heavy type with real
  weight, solid shapes, rounded liquid joins between elements. Not threads,
  not glowing streaks, not hairlines as the leading motif.
- **Type:** a display face with mass (a heavy, wide or condensed grotesque, or
  something stranger that fits) and a quiet text face. Not a hairline serif.
- **Voice:** calm, tactile, plainly descriptive. Sentences that say what the
  liquid does, with verbs of matter (pool, bead, crown, reach, settle). No
  weaving vocabulary. Numbers may appear but are not the rhythm of the text.
- **Seed facts** you may build on: ferrofluid is a suspension of magnetic
  nanoparticles (around 10 nm) in a carrier liquid; it was developed at NASA in
  1963 by Steve Papell; its spikes are the normal-field (Rosensweig)
  instability, appearing above a critical field strength in a regular,
  roughly hexagonal pattern. Do not add facts you are not sure of.

### 6.4 Signature moment ideas (SUGGESTION)

- A preloader where real loading progress is the mass of a forming drop, which
  then becomes the hero subject without a cut.
- The liquid mirrors the wordmark: the brand name is drawn to a canvas texture
  and placed as a light in the procedural environment, so it appears in the
  reflections.
- The spike crown rising with scroll, with DOM labels that follow real spike
  tips.
- The drop splitting into droplets that line up with a list in the DOM, then
  merging again.
- One accessible instrument: a real `<input type="range">` (keyboard operable)
  for field strength that drives the liquid and, when sound is on, the pitch.
- A cursor that is a small black droplet, stretching with speed and merging
  with buttons.
- A footer where the liquid settles back into a calm pool.

---

## 7. The previous site — what the new one must not repeat (HARD RULE)

Technology and patterns may stay the same. Concept and look must be completely
different.

**The fusion site (SKEIN):**

- Niche: fusion, specifically the stellarator (a twisted magnetic ring that
  holds plasma).
- Brand: SKEIN ("a ball of yarn"), the fictional company Skein Fusion Systems.
- Voice: the vocabulary of weaving applied to plasma physics (thread, wind,
  tension, loom, tie in); short dry sentences; concrete numbers.
- Story: a star held by a thread; the hottest and the coldest thing a metre apart.
- Visual signature: everything is made of thin glowing threads. In 3D,
  particles as streaks of light; in the DOM, hairline rules and a hairline serif.
- Palette: near-black background (`#050506`), bone-colored text (`#ede8df`),
  one accent orange-red "plasma" (`#ff5a1f`) up to white-hot, and a secondary
  cold blue "cryo" (`#9cc4d4`) only for cold parts.
- Central object: a twisted ring of plasma patterned along field lines,
  surrounded by hairline cages of the machine.
- Chapters were called Winding, Ignition, Inside, Yield.

**The perfume site:** the perfume theme is forbidden entirely.

**Required differences:**

| Aspect | Previous (SKEIN) | New site |
| --- | --- | --- |
| Niche | Fusion / stellarator | Ferrofluid / liquid metal |
| Story | A star held by a thread | Yours — about a liquid shaped by an unseen force |
| Central object | Twisted plasma ring in hairline cages | One body of glossy black liquid |
| Base tone | Near-black | Light |
| Accent | Orange-red plasma | One cold color; no orange, red or amber |
| Visual signature | Thin glowing threads, streaks, hairline serif | Mass, gloss, reflection, meniscus; no threads, no glowing streaks, no hairline serif as the main motif |
| Voice | Weaving vocabulary, short dry sentences, numbers | Different vocabulary and rhythm |
| Chapter names | Winding, Ignition, Inside, Yield | None of these |

The plan must show this table filled in with your actual choices.

---

## 8. Stack details

- **Post-processing** is selective: only where it truly improves the frame.
  The previous site used bloom, chromatic aberration, grain, vignette and tone
  mapping. On a light scene, bloom is rarely right except for small specular
  glints. Post-processing switches off on weak devices.
- **GPU particles** serve backgrounds, interactive effects and shape change
  (morphing). Use Drei helpers for simple effects and your own system where
  control or performance is needed. (On the previous site only
  `PerformanceMonitor` came from Drei; the rest was hand-written for look and
  control.)
- **Drei** is welcome wherever it does the job. `Environment` with
  `Lightformer` children renders a procedural environment and is allowed;
  environment presets and HDRI files are not (H24).
- `next/dynamic` with `ssr: false` must be called from a client component, not
  from a server component.
- Metadata: static `metadata` export, with `metadataBase` taken from the
  deployment URL environment variable when present.

---

## 9. Default recipe — architecture and patterns

This recipe worked on the previous site. Take it as the starting point. You
may deviate only with a reason given in the plan.

### 9.1 Two layers that never mix

- The **DOM layer** carries all real content (headings, text, navigation). The
  server renders it as plain semantic HTML, so it is readable without
  JavaScript, WebGL or animation.
- The **WebGL layer** is one fixed canvas behind the DOM, purely decorative
  (`aria-hidden`), with one continuous 3D scene that changes as the user scrolls.
- The layers are connected by **one shared object** (`lib/store.ts`). GSAP
  writes the scroll position into it; the scene reads it every frame. **No
  per-frame React state and no re-renders on scroll. This is the most
  important pattern.**

### 9.2 Next.js and React

- One route, everything statically prerendered. Chapters are server
  components; client components are small and add only motion and interaction.
- Everything that touches `three` loads through `next/dynamic` with
  `ssr: false`, so 3D code is not in the initial bundle and the text shows at once.

### 9.3 Tailwind and design tokens

- All colors, font sizes and animation curves are CSS variables in
  `app/globals.css` (`@theme`). The default Tailwind palette is switched off
  (`--color-*: initial`), so a component cannot use a color outside the palette.
- Composite type classes (for example `type-hero`, `type-display`,
  `type-micro`) set font, size, line height and letter-spacing at once.
- Fluid sizes with `clamp()`, no separate sizes per breakpoint.
- One page grid: 4 columns on phones, 12 from tablet up.
- A soft halo behind text that sits over the scene. On the previous (dark)
  site this was a soft dark shadow behind light text over a bright scene. On
  this light site it is the reverse: a soft page-colored halo behind dark text.
  It is a safety net; framing does the real work (9.8).

### 9.4 The 3D scene

- One `<Canvas>`.
- GPGPU particles: positions live in a texture that a shader updates every
  frame; each particle follows a target shape computed by a formula, with
  curl-noise turbulence.
- The same mathematical model on CPU and GPU, generated from the same
  constants, so DOM labels can follow 3D points.
- Direction: one component (`Director`) computes the camera and every scene
  parameter from the scroll position through keyframe tracks, like a shot list
  in a film.
- Shader uniforms are written through refs or class instances, because the
  React Compiler lint forbids mutating memoized values.

### 9.5 GSAP

- `lib/gsap.ts` registers the plugins once and defines the motion language
  (the same curves and durations everywhere).
- ScrollSmoother gives smooth scroll; fixed elements (canvas, navigation,
  cursor) sit outside its wrapper.
- ScrollTrigger pins chapters and writes progress into the store.
- SplitText reveals text line by line, only after the fonts have loaded.
- `gsap.matchMedia()` provides a separate variant for
  `prefers-reduced-motion` (no pins, no smooth scroll).
- A chapter is an ordinary vertical flow in HTML. A client component sets
  `data-pinned` when motion is allowed, and the Tailwind variant
  `in-data-pinned:` then turns the flow into a pinned scene. (Check the exact
  variant syntax against the installed Tailwind version.)

### 9.6 Sound

- An ambient layer that follows the chapter, the scroll speed and the state of
  the scene, plus short UI sounds. The sound toggle is a real button.

### 9.7 Patterns that make the difference

- **Adaptive quality:** four tiers (`lib/quality.ts`) chosen by device and
  lowered if the frame rate drops. A phone gets the same site with fewer
  particles and without expensive effects.
- **Preloader tied to real loading:** `lib/loadClock.ts` tracks phases (scene
  code, context, shaders, fonts), and the scene draws its first frame as part
  of the same progress.
- **Resilience:** an SVG replacement when there is no WebGL or the context is
  lost, and a timeout after which the preloader releases itself.
- **Framing by screen shape:** the camera moves the subject to the side on a
  wide screen and upward on a portrait one, so the text always has its own space.
- **Content in one place:** all copy in `lib/content.ts`; colors in one
  palette file for the scene and in `app/globals.css` for the DOM, kept in
  sync; look rules in `docs/ART_DIRECTION.md`.
- **Verification through scripts:** `scripts/shots.mjs` takes screenshots per
  chapter and width; `scripts/flow.mjs` walks the preloader, the keyboard and
  the interactions.

### 9.8 Readability on a light page (HARD RULE in effect, method is DEFAULT)

Text over the scene must stay readable at every scroll position. Here the text
is dark and the subject is black, so they must not overlap unless a moment is
designed for it. Plan the framing of the scene and the placement of text
together from the start, not afterwards. Check it in screenshots at every
width.

---

## 10. Suggestions for this subject

Free to change. They exist to save you exploration.

### 10.1 The liquid

Two candidate techniques:

- **A. Raymarched signed distance field.** A fragment shader on a proxy volume:
  metaballs joined by a smooth minimum for the body and droplets; spikes as a
  hexagonal lattice of cones along the field direction, with height driven by
  field strength and distance to the magnet. Normals from four-tap central
  differences. Write depth so particles composite correctly. Splitting and
  merging come for free. Cost is controlled by step count and render scale.
- **B. Displaced mesh.** A dense sphere or plane displaced in the vertex shader
  with analytic or finite-difference normals. Cheaper and crisp, but splitting
  into droplets needs extra bodies.

Reason it through in the plan and prototype one. Prototype the second only if
the first fails on look or on cost at the lowest tier. Record the decision in
`docs/ART_DIRECTION.md`.

Shading: a mirror-black surface with Fresnel, reflecting a **procedural
studio** — either an analytic environment function in GLSL (soft boxes, a
horizon gradient, one accent strip) or Drei `Environment` with `Lightformer`s.
A soft contact shadow under the liquid gives it weight.

Shared model: keep blob centres, radii, lattice constants and field
parameters in one module, and generate the GLSL constants from it, so the CPU
can compute the same spike tips and droplet centres for DOM labels (projected
with the camera and written to transforms through refs).

### 10.2 Particles

Use the GPGPU system for secondary matter: fine dark grains or a mist of
micro-droplets that gather along the field, hint at the lattice before the
spikes rise, and morph into designed shapes in at least one chapter. Draw them
as round grains, not stretched streaks. On a light page use normal blending
with dark grains, not additive glow. Small alpha-tested discs avoid sorting
problems. Check float render target support and fall back to half-float.

### 10.3 The light scene

- The page color in the canvas must match the DOM background exactly. Either
  keep the canvas transparent over the CSS background, or make sure the clear
  color after tone mapping equals the token. Check for a visible seam by
  sampling pixels in a screenshot.
- Post-processing with a transparent canvas can be awkward; decide early.
- Grain can be a cheap DOM/SVG overlay instead of a post pass.

### 10.4 Chapters

Five or six chapters are enough. Tie each chapter to one state of the liquid.
Pin only the chapters that need a scrubbed sequence. Keep total scroll length
reasonable. Navigation lets the user jump to any chapter by keyboard.

### 10.5 Interaction and sound

- Pointer position and velocity go into the store; the scene reads them.
- Press and hold may strengthen the field. Scroll speed may agitate the surface.
- Ambient sound: a low tone tied to field strength; soft liquid and metallic
  UI ticks. Create the `AudioContext` only on the user's click; ramp gains;
  suspend when the tab is hidden.

### 10.6 Reduced motion and fallbacks

- Reduced motion: native scroll, no pins, no text choreography; the scene is
  calm and changes state by chapter without camera travel.
- No WebGL or lost context: a static SVG of the subject built from tokens.
- Preloader: releases itself after a timeout (around 8–10 seconds) no matter what.
- Refresh mid-page: the store initializes from the real scroll position and
  the scene opens in the right state.

### 10.7 Likely agent candidates

Probably few. Possible ones, if they pass the three conditions in H7: the
sound engine (its own folder), and a final "fresh eyes" review. The scene, the
Director, the chapters and the integration belong to the main thread.

---

## 11. Phases

The order of work, and the basis for splitting into sessions. Each phase ends
with lint, typecheck and build passing, a commit, a push, and an updated
`docs/SESSION_SUMMARY.md` (H16).

| Phase | Work |
| --- | --- |
| 0 | Environment, skills, versions, renderer decision, plan. **Wait for approval.** |
| 1 | Art direction and motion language written down before code. Then the foundation: project scaffold, tokens, store, GSAP setup and scroll, canvas, quality tiers. |
| 2 | The scene and the camera direction, with placeholder DOM. |
| 3 | Chapters as semantic HTML with real copy, then motion on top. |
| 4 | Preloader, cursor, sound, fallbacks. |
| 5 | Phone and reduced-motion adaptation, full verification, polish, OG image and icons, README, pull request, final report. |

The reasoning behind the order: pick a niche that gives one strong central 3D
subject with several states (done — section 6); write art direction and motion
language before code; lay the foundation; build the scene and camera with
temporary DOM; add chapters as semantic HTML and then motion over them; only
then preloader, cursor and sound; finally adapt to phones and reduced motion
and verify everything.

A reasonable split (SUGGESTION): session 1 = phases 0–1, session 2 = phase 2,
session 3 = phase 3, session 4 = phases 4–5. Split further if a session grows.

---

## 12. Session protocol

### 12.1 Start of every session

1. `git fetch origin`. Work on the branch this session was told to develop on.
   Cloud sessions may start on a new branch cut from `main`, so earlier work
   may sit on another `claude/...` branch. Find the most recently updated work
   branch; if your branch does not contain its commits, merge it in before
   anything else.
2. Read `CLAUDE.md`, `docs/SESSION_SUMMARY.md`, `docs/ART_DIRECTION.md`. Nothing else yet.
3. Install dependencies (`npm ci`) if `node_modules` is missing.
4. Continue with the next item in the summary.

### 12.2 During a session

- Small steps. After each one that works: lint, typecheck, commit, push.
- Never push to `main`. All work reaches `main` through the final pull request.
- Push with `git push -u origin <branch>`; on a network error retry a few
  times with increasing waits.

### 12.3 End of a session or phase

- Rewrite `docs/SESSION_SUMMARY.md`: done, verified, remaining, open
  questions, file paths, **the branch name**, and the exact next step.
- Commit, push.
- Tell the owner (in Serbian) that this is a good moment for a new session,
  and give the one line to paste into it, including the branch name. For example:
  "Pročitaj CLAUDE.md, docs/SESSION_SUMMARY.md i docs/ART_DIRECTION.md i
  nastavi. Prethodni rad je na grani `<branch>`."

---

## 13. Verification (HARD RULE: it is part of the work)

Use headless Chromium through the project's pinned Playwright.

- Headless WebGL runs on a software renderer. Launch with the flags it needs
  (for example `--use-angle=swiftshader`, `--enable-unsafe-swiftshader`) and
  confirm a WebGL context is really created before trusting any screenshot.
  Frame rate measured there means nothing.
- Give the scripts something to wait for: an attribute on `<html>` when the
  preloader is done, and a way to jump to a chapter and settle before capture.
- Screenshots go to a git-ignored folder. One chapter and one width per run (H15).

Checklist:

- [ ] Screenshots at **375, 768, 1024, 1440 and 1920** for every chapter.
- [ ] Text readable over the scene at every chapter and width; no overlap of
      dark text and the black subject unless designed.
- [ ] No seam between the canvas and the page background.
- [ ] Keyboard: every control reachable, focus visible, navigation jumps work,
      sound toggle works.
- [ ] `prefers-reduced-motion`: no pins, no smooth scroll, content complete.
- [ ] Refresh in the middle of the page: correct chapter, correct scene state.
- [ ] No WebGL (make `getContext` return null) and lost context
      (`WEBGL_lose_context`): the SVG fallback appears, content complete.
- [ ] JavaScript disabled: all content readable.
- [ ] Preloader completes; the timeout releases it when loading stalls.
- [ ] One H1; heading order without gaps.
- [ ] `npm run lint`, `tsc --noEmit`, `next build` pass; the route is static.
- [ ] No console errors.

Cannot be verified in the cloud — list as **unverified** in the report: real
frame rate, real phones and touch, audio output, Safari and Firefox.

---

## 14. Quality bar

- Priority goes to visual quality, originality, performance and phone
  adaptation — not technology for its own sake.
- The phone gets the same site at a lower quality tier, with its own portrait framing.
- Spend boldness in one place per screen; keep the rest quiet and disciplined.
- Avoid the common tells of a generated page: all-caps eyebrow labels over
  every heading, numbered markers where there is no sequence, one accented
  word in each headline, identical rounded cards, fade-and-slide-up on every
  section.
- Motion has one language: the same eases and durations everywhere, defined once.
- It must feel interactive: the liquid answers the pointer within the first seconds.
- When you look at a screenshot, ask whether a jury would stop scrolling.
  If not, improve the frame before moving on.

---

## 15. Final deliverables

1. A short English `README.md`: what it is, how to run, structure, scripts.
2. A **pull request** from the work branch into `main`, in English: summary,
   how to run, what was verified.
3. A **final report to the owner, in Serbian**:
   - what was done;
   - what was verified, and how;
   - what was not verified and why;
   - what is weaker than you wanted, said plainly;
   - where the owner fills in the author credit (`lib/content.ts`).

Before finishing, check yourself:

- Is every hard rule in section 3 still true of the repository?
- Is the version table in `CLAUDE.md` exact and current?
- Do `CLAUDE.md` and `docs/ART_DIRECTION.md` match what was built?
- Is everything committed and pushed?
