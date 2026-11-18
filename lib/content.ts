export const site = {
  name: "Tarn",
  title: "Tarn — magnetic liquid, shaped by a field",
  description:
    "Tarn is a fictional materials studio that formulates magnetic liquid and builds the fields that shape it.",
  story: "A liquid with no shape of its own, and the unseen force that gives it one.",
} as const;

export const credit = {
  label: "Design & build",
  name: "Your Name",
  href: "#",
} as const;

export const chapterIds = ["still", "reach", "crown", "part", "hold", "settle"] as const;
export type ChapterId = (typeof chapterIds)[number];

export const navigation = {
  label: "Chapters",
  items: [
    { id: "still", name: "Still" },
    { id: "reach", name: "Reach" },
    { id: "crown", name: "Crown" },
    { id: "part", name: "Part" },
    { id: "hold", name: "Hold" },
    { id: "settle", name: "Settle" },
  ],
} as const satisfies { label: string; items: readonly { id: ChapterId; name: string }[] };

export const preloader = {
  label: "Gathering",
  unit: "%",
} as const;

export const sound = {
  label: "Sound",
} as const;

export const still = {
  id: "still",
  headingSuffix: "magnetic liquid, shaped by a field",
  lead: "Left alone, it pools and holds the room in its surface.",
  body: "Tarn is a studio for magnetic liquid. We formulate the fluid, and we build the fields that give it a shape.",
  hint: "Come closer. It leans your way.",
} as const;

export const reach = {
  id: "reach",
  heading: "It reaches for what it cannot see.",
  body: [
    "Ferrofluid is a suspension of magnetic particles, each around ten nanometres across, in a carrier liquid. It was developed at NASA in 1963 by Steve Papell.",
    "Bring a field close and the surface gathers itself and leans toward it, while the loose grains around it draw out the lines of the field.",
  ],
} as const;

export const crown = {
  id: "crown",
  heading: "It stands up.",
  body: "Past a critical field strength the flat surface gives way and rises in a regular, roughly hexagonal pattern of spikes. This is the normal-field instability, also called the Rosensweig instability.",
  instrument: {
    label: "Field strength",
    hint: "Drag to raise or lower the field.",
    below: "Below the critical field",
    above: "Above the critical field",
  },
  labelsHeading: "What the crown shows",
  labels: ["Past the critical field", "Roughly hexagonal", "Still one surface"],
} as const;

export const part = {
  id: "part",
  heading: "It parts, and every bead is whole.",
  body: "Pulled from several sides, one body becomes four. What Tarn makes divides the same way.",
  items: [
    { name: "Fluids", line: "Particle and carrier, mixed for how the surface moves." },
    { name: "Fields", line: "Magnets and coils that decide where it stands." },
    { name: "Vessels", line: "Glass and steel made to show a surface, not to hide it." },
    { name: "Commissions", line: "Single pieces for rooms, stages and instruments." },
  ],
} as const;

export const hold = {
  id: "hold",
  heading: "Shapes no liquid should hold.",
  body: "Give the field a design and the liquid keeps it for as long as the field stays on.",
  forms: [
    { name: "Bridge", line: "A column held between two poles, drawn narrow at the waist." },
    { name: "Slab", line: "A flat block with an edge you could measure." },
    { name: "Urchin", line: "A sphere that carries its crown all the way round." },
  ],
} as const;

export const settle = {
  id: "settle",
  heading: "Take the field away and it lets go of every shape.",
  body: "What stays is the liquid, level and black, with the room in its surface again.",
  restart: "Return to the still surface",
} as const;

export const footer = {
  note: "Tarn is a fictional studio. This site is a concept piece.",
} as const;
