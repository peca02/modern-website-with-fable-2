// The shot list. Everything the scene does over the scroll is keyed here, in
// story units (chapter index + progress inside the chapter), and sampled once
// per frame by the Director. This file must not import three.

import { beats } from "@/lib/beats";

export type Segment = { from: number; to: number; mix: number };

type Keyed = { readonly at: number };

const ease = (t: number) => t * t * (3 - 2 * t);

/** Finds the pair of keys around `at`; the mix between them is eased so every key is a rest. */
export function locate(keys: readonly Keyed[], at: number, out: Segment) {
  let index = 0;
  while (index < keys.length - 2 && at >= keys[index + 1].at) index += 1;
  const from = keys[index];
  const to = keys[Math.min(index + 1, keys.length - 1)];
  const span = to.at - from.at;
  out.from = index;
  out.to = Math.min(index + 1, keys.length - 1);
  out.mix = span > 0 ? ease(Math.min(Math.max((at - from.at) / span, 0), 1)) : 0;
}

type NumberKey = readonly [at: number, value: number];

export function sample(keys: readonly NumberKey[], at: number) {
  let index = 0;
  while (index < keys.length - 2 && at >= keys[index + 1][0]) index += 1;
  const [fromAt, fromValue] = keys[index];
  const [toAt, toValue] = keys[Math.min(index + 1, keys.length - 1)];
  if (toAt <= fromAt) return fromValue;
  return fromValue + (toValue - fromValue) * ease(Math.min(Math.max((at - fromAt) / (toAt - fromAt), 0), 1));
}

export type Shot = {
  /** height the camera looks at */
  targetY: number;
  /** degrees above the horizon */
  elevation: number;
  /** world units the subject spans; sizes it against the viewport */
  span: number;
  /** lens shift as a fraction of the viewport, on wide and on portrait screens */
  wideX: number;
  wideY: number;
  tallX: number;
  tallY: number;
  /** share of the viewport height the span takes on portrait screens that are not narrow */
  tallFill: number;
};

const shots = {
  still: { targetY: 0.7, elevation: 11, span: 2, wideX: 0.2, wideY: 0.15, tallX: 0, tallY: 0.2, tallFill: 0.46 },
  reach: { targetY: 1.05, elevation: 8, span: 3.9, wideX: -0.31, wideY: 0.1, tallX: 0, tallY: -0.12, tallFill: 0.46 },
  crownProfile: { targetY: 0.5, elevation: 12, span: 3.1, wideX: 0.24, wideY: 0.06, tallX: 0, tallY: -0.16, tallFill: 0.46 },
  crownTop: { targetY: 0.3, elevation: 60, span: 3.3, wideX: 0.24, wideY: 0.02, tallX: 0, tallY: -0.16, tallFill: 0.46 },
  part: { targetY: 0.2, elevation: 66, span: 2.7, wideX: 0.28, wideY: 0, tallX: 0.37, tallY: 0.14, tallFill: 0.33 },
  hold: { targetY: 1.1, elevation: 7, span: 3.1, wideX: 0, wideY: 0.07, tallX: 0, tallY: 0.06, tallFill: 0.46 },
  settle: { targetY: 0.4, elevation: 15, span: 3.7, wideX: 0, wideY: 0.3, tallX: 0, tallY: 0.3, tallFill: 0.3 },
} satisfies Record<string, Shot>;

const shotKeys: readonly (Keyed & { shot: Shot })[] = [
  { at: 0, shot: shots.still },
  { at: 0.3, shot: shots.still },
  { at: 1, shot: shots.reach },
  { at: 1.45, shot: shots.reach },
  { at: 2, shot: shots.crownProfile },
  { at: 2.28, shot: shots.crownProfile },
  { at: 2.5, shot: shots.crownTop },
  { at: beats.fieldFall, shot: shots.crownTop },
  { at: 3, shot: shots.part },
  { at: 3.55, shot: shots.part },
  { at: 4, shot: shots.hold },
  { at: 4.7, shot: shots.hold },
  { at: 4.95, shot: shots.settle },
];

export const poseIds = ["rest", "reach", "crown", "part", "bridge", "slab", "orb", "pool"] as const;
export type PoseId = (typeof poseIds)[number];

const [toSlab, toOrb] = beats.formSwitch;

const poseKeys: readonly (Keyed & { pose: PoseId })[] = [
  { at: 0, pose: "rest" },
  { at: 0.3, pose: "rest" },
  { at: 0.95, pose: "reach" },
  { at: 1.45, pose: "reach" },
  { at: 2, pose: "crown" },
  { at: 2.66, pose: "crown" },
  { at: 3, pose: "part" },
  { at: 3.6, pose: "part" },
  { at: 4, pose: "bridge" },
  { at: toSlab - 0.04, pose: "bridge" },
  { at: toSlab + 0.04, pose: "slab" },
  { at: toOrb - 0.04, pose: "slab" },
  { at: toOrb + 0.04, pose: "orb" },
  { at: 4.7, pose: "orb" },
  { at: 4.95, pose: "pool" },
];

// Indices match the `targetFor` switch in the grain simulation shader.
export const grainShapes = { dust: 0, fieldLines: 1, lattice: 2, rings: 3, halo: 4, frame: 5, shell: 6 } as const;

const grainKeys: readonly (Keyed & { shape: number })[] = [
  { at: 0, shape: grainShapes.dust },
  { at: 0.4, shape: grainShapes.dust },
  { at: 0.95, shape: grainShapes.fieldLines },
  { at: 1.5, shape: grainShapes.fieldLines },
  { at: 2, shape: grainShapes.lattice },
  { at: beats.fieldFall, shape: grainShapes.lattice },
  { at: 3.05, shape: grainShapes.rings },
  { at: 3.6, shape: grainShapes.rings },
  { at: 4, shape: grainShapes.halo },
  { at: toSlab - 0.04, shape: grainShapes.halo },
  { at: toSlab + 0.04, shape: grainShapes.frame },
  { at: toOrb - 0.04, shape: grainShapes.frame },
  { at: toOrb + 0.04, shape: grainShapes.shell },
  { at: 4.7, shape: grainShapes.shell },
  { at: 4.95, shape: grainShapes.dust },
];

const tracks = {
  /** how far the cusp has travelled toward the magnet */
  reach: [[0.4, 0.2], [1, 0.88], [1.45, 1]],
  /** field over the lattice; the crown stands above the critical value */
  field: [[2, 0], [2.3, 1], [beats.fieldFall, 1], [2.85, 0]],
  /** one puddle (0) to four droplets (1) and back */
  split: [[3, 0], [3.15, 1], [3.55, 1], [3.8, 0]],
  /** share of the grains that are present; the hero frame has none */
  grains: [[0.25, 0], [0.9, 0.7], [4.7, 0.7], [4.95, 0.1]],
} satisfies Record<string, readonly NumberKey[]>;

// Without pins a chapter is one screen long, so the scroll track would show
// each state only while its text is already leaving. Each chapter instead
// plays its own stretch of the story over the first part of its scroll and
// travels to the next chapter's stretch in the rest.
const unpinnedStretches: readonly (readonly [from: number, to: number])[] = [
  [0, 0.2],
  [1.1, 1.45],
  [2.4, 2.6],
  [3.2, 3.55],
  [4.1, 4.66],
  [5, 5],
];
const unpinnedShare = 0.45;

export function unpinnedStory(chapter: number, progress: number) {
  const [from, to] = unpinnedStretches[Math.min(chapter, unpinnedStretches.length - 1)];
  const next = unpinnedStretches[Math.min(chapter + 1, unpinnedStretches.length - 1)][0];
  if (progress < unpinnedShare) return from + (to - from) * (progress / unpinnedShare);
  return to + (next - to) * ((progress - unpinnedShare) / (1 - unpinnedShare));
}

const shotSegment: Segment = { from: 0, to: 0, mix: 0 };
const poseSegment: Segment = { from: 0, to: 0, mix: 0 };
const grainSegment: Segment = { from: 0, to: 0, mix: 0 };

/** Sampled state of the shot list for the current frame. */
export const direction = {
  shot: { ...shots.still },
  poseFrom: "rest" as PoseId,
  poseTo: "rest" as PoseId,
  poseMix: 0,
  reach: 0,
  field: 0,
  split: 0,
  grainFrom: 0,
  grainTo: 0,
  grainMix: 0,
  grainWeight: 0,
  /** 0–1 per Part droplet, eased toward `store.partFocus` */
  focus: new Float32Array(4),
};

const shotFields = ["targetY", "elevation", "span", "wideX", "wideY", "tallX", "tallY", "tallFill"] as const;

/** `field` is the field instrument's value, or -1 while it is untouched and the scroll drives the field. */
export function direct(story: number, field: number) {
  locate(shotKeys, story, shotSegment);
  const fromShot = shotKeys[shotSegment.from].shot;
  const toShot = shotKeys[shotSegment.to].shot;
  for (const key of shotFields) {
    direction.shot[key] = fromShot[key] + (toShot[key] - fromShot[key]) * shotSegment.mix;
  }

  locate(poseKeys, story, poseSegment);
  direction.poseFrom = poseKeys[poseSegment.from].pose;
  direction.poseTo = poseKeys[poseSegment.to].pose;
  direction.poseMix = poseSegment.mix;

  locate(grainKeys, story, grainSegment);
  direction.grainFrom = grainKeys[grainSegment.from].shape;
  direction.grainTo = grainKeys[grainSegment.to].shape;
  direction.grainMix = grainSegment.mix;

  direction.reach = sample(tracks.reach, story);
  const scrolledField = sample(tracks.field, story);
  const held = field >= 0 && story > 1.9 && story < 3;
  // A held value still lets go with the scroll once the chapter starts to leave.
  direction.field = held ? field * (story < beats.fieldFall ? 1 : scrolledField) : scrolledField;
  direction.split = sample(tracks.split, story);
  direction.grainWeight = sample(tracks.grains, story);
}

const focusRate = 5;

/** Eases each droplet's focus toward the focused row; nothing is focused while the droplets are not apart. */
export function easeFocus(focused: number, delta: number, still: boolean) {
  const ease = still ? 1 : 1 - Math.exp(-delta * focusRate);
  for (let index = 0; index < direction.focus.length; index += 1) {
    const goal = index === focused && direction.split > 0.5 ? 1 : 0;
    direction.focus[index] += (goal - direction.focus[index]) * ease;
  }
}
