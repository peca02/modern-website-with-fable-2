# Art direction — TARN

Fictional materials studio that formulates magnetic liquid and builds the
fields that shape it. Story: *a liquid with no shape of its own, and the unseen
force that gives it one.*

## Palette (tokens in `app/globals.css`, mirrored in `lib/palette.ts`)

| Token | Hex | Role |
| --- | --- | --- |
| `page` | `#edeff1` | page background (cool porcelain) |
| `chalk` | `#f7f8f9` | raised surfaces, halo behind text |
| `mineral` | `#d3d8de` | quiet solid shapes |
| `graphite` | `#4a4f57` | secondary text |
| `ink` | `#000000` | text, solid DOM shapes, the liquid |
| `field` | `#2433ff` | the only accent (ultramarine) |

Accent is rare: the light strip inside the liquid's reflections, focus rings,
the field instrument, the active nav item. Never orange, red, amber or cream.

## Type (`next/font/google`)

- **Archivo** (variable `wght` 100–900, `wdth` 62–125) — everything with
  presence. Wide + black for display; condensed + medium for readouts and
  small labels. Its axes may be animated in one place: letters gain mass with
  field strength.
- **Instrument Sans** — running text only.
- No monospace, no serif, no all-caps tracked eyebrows. Sentence case.

Composite classes: `type-hero`, `type-display`, `type-title`, `type-body`,
`type-lead`, `type-micro`. Sizes are fluid tokens.

## Signature

Mass and gloss. One body of mirror-black liquid reflecting a soft studio and
the wordmark. In the DOM: heavy wide type, solid black shapes, meniscus joins
(SVG goo filter on a small fixed layer: nav, buttons, droplet cursor). No
threads, streaks, hairlines, cards or gradients.

## Motion language (`lib/gsap.ts`)

Viscous. Arrivals settle without overshoot (`settle`, expo-out family);
durations 0.4 / 0.8 / 1.4 s. One overshoot ease (`tension`) is reserved for
merges. Text rises out of a line mask like a liquid level; no fade-and-slide.
One bold motion per screen.

## Voice

Calm, tactile, plainly descriptive; medium-long sentences with verbs of matter
(pool, bead, crown, reach, settle, part, hold). Numbers are rare. No weaving
vocabulary, no hype, no invented product facts.

- Left alone, it pools and holds the room in its surface.
- Bring a field close and the surface gathers itself, leans, and then stands up in a crown.
- Take the field away and it lets go of every shape it was given.

Facts the copy may state: ferrofluid is a suspension of magnetic nanoparticles
(around 10 nm) in a carrier liquid; it was developed at NASA in 1963 by Steve
Papell; the spikes are the normal-field (Rosensweig) instability, appearing
above a critical field strength in a regular, roughly hexagonal pattern. Add
no other physical facts, and never present Tarn's invented products as real.

## Quality bar

- A jury should stop scrolling at every frame. If a screenshot would not make
  them, fix the frame before moving on.
- The liquid answers the pointer within the first seconds.
- Not allowed: an eyebrow label over every heading, numbered markers where
  there is no sequence, one accented word per headline, identical rounded
  cards, the same reveal on every section, arrows appended to links.
- Nothing may recall the owner's previous site (dark page, orange accent,
  glowing threads and streaks, hairline serif, weaving vocabulary; chapters
  named Winding, Ignition, Inside, Yield).

## Chapters

Total scroll length: about nine to ten viewport heights.

| # | Name | Liquid state | Scroll | Framing wide / portrait |
| --- | --- | --- | --- | --- |
| 1 | Still | resting drop, mirrors studio + wordmark, leans to pointer | flow | drop lower right / lower half |
| 2 | Reach | stretches a cusp toward the magnet; grains gather on field lines | flow | subject left / top |
| 3 | Crown | hex lattice of spikes rises past the critical field | pinned | subject centre-right / top; profile → top view |
| 4 | Part | splits into 4 droplets aligned with list rows, merges again | pinned | droplets beside rows |
| 5 | Hold | holds three designed forms: capillary bridge, slab with an edge, spiked sphere | pinned | subject centre |
| 6 | Settle | field gone; wide calm pool | flow | pool along the bottom, text above |

## Signature moments

1. Preloader: real loading progress is the mass of a growing drop, which
   becomes the hero subject without a cut.
2. The wordmark is drawn to a canvas texture and placed as a light in the
   studio, so it reads in the liquid's reflection.
3. Crown: spikes rise with scroll, DOM labels follow real spike tips, and a
   real `<input type="range">` drives the field (and pitch when sound is on).
   Headline letters gain mass with the field.
4. Part: droplets line up with the rows of a DOM list (what Tarn makes:
   fluids, fields, vessels, commissions) and answer hover and focus.
5. A droplet cursor that stretches with speed and merges with buttons.

## Framing rules

- Dark text never overlaps the black subject unless the moment is designed.
  The camera shifts the subject sideways on wide screens and upward on
  portrait ones; text takes the other side.
- The chalk halo behind text is a safety net, not the method.

## Scene decisions

- Liquid: raymarched SDF (smooth-min metaballs, hex lattice of cones for
  spikes). Displaced mesh only if the SDF fails on look or cost at the lowest tier.
- Environment: analytic studio in GLSL (soft boxes, horizon gradient, one
  `field` strip, wordmark canvas texture). No Drei `Environment`.
- Transparent canvas; contact shadow is alpha. No post-processing passes.
- Particles: GPGPU dark round grains, normal blending, depth-tested against
  the liquid's `gl_FragDepth`.
