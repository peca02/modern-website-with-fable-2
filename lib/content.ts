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

export const chapters = [
  { id: "still", name: "Still", line: "Left alone, it pools and holds the room in its surface." },
  { id: "reach", name: "Reach", line: "Bring a field close and the surface gathers itself and leans." },
  { id: "crown", name: "Crown", line: "Past a certain strength it stands up in a crown." },
  { id: "part", name: "Part", line: "Pulled from several sides, it parts into beads, each one whole." },
  { id: "hold", name: "Hold", line: "Given a shaped field, it holds an edge that no liquid should." },
  { id: "settle", name: "Settle", line: "Take the field away and it lets go of every shape it was given." },
] as const;

export type ChapterId = (typeof chapters)[number]["id"];
