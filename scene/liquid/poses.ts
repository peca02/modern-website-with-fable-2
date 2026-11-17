import type { PoseId } from "@/scene/direction";
import { liquidModel, poseLayout, resetPose, setBlob, type Pose } from "@/scene/liquid/model";

export type PullTarget = { x: number; y: number };

export type PoseInput = {
  time: number;
  /** no idle drift */
  still: boolean;
  reach: number;
  field: number;
  split: number;
  /** 0–1, how much of the resting drop has gathered (the preloader) */
  mass: number;
  /** 0–1 per Part droplet: the focused one swells and lifts */
  focus: Float32Array;
};

const { rest, lean, magnet, press } = liquidModel;

// The resting drop leans toward the pointer: a second lobe hides inside it and
// travels, so the body leans without ever losing its single mass.
export class Lean {
  x = 0;
  y = 0;

  update(delta: number, time: number, target: PullTarget | null, still: boolean) {
    let goalX = still ? 0 : Math.sin(time * 0.31) * 0.06;
    let goalY = still ? 0 : Math.cos(time * 0.23) * 0.04;
    if (target) {
      const dx = target.x;
      const dy = Math.max(target.y, 0.1) - rest.lift * rest.squash;
      const distance = Math.hypot(dx, dy);
      const pull = lean.reach / (1 + (distance / lean.range) ** 2);
      const scale = distance > pull ? pull / distance : 1;
      goalX = dx * scale;
      goalY = dy * scale;
    }
    const ease = still ? 1 : 1 - Math.exp(-delta * lean.follow);
    this.x += (goalX - this.x) * ease;
    this.y += (goalY - this.y) * ease;
  }
}

// Press and hold: a spring from 0 (rest) to 1 (a small cusp raised toward
// the pointer). It is negative for a moment after a release.
export class Press {
  amount = 0;
  x = 0;
  y = 1;
  private velocity = 0;

  update(delta: number, held: boolean, target: PullTarget | null, still: boolean) {
    if (still) {
      this.amount = 0;
      this.velocity = 0;
      return;
    }
    if (held && target) {
      const follow = 1 - Math.exp(-delta * lean.follow);
      this.x += (target.x - this.x) * follow;
      this.y += (target.y - this.y) * follow;
    }
    const goal = held ? 1 : 0;
    const [stiffness, damping] = held ? press.gather : press.release;
    // Fixed small steps keep the stiff release stable on slow frames.
    for (let left = delta; left > 0; left -= 1 / 120) {
      const step = Math.min(left, 1 / 120);
      this.velocity += ((goal - this.amount) * stiffness - this.velocity * damping) * step;
      this.amount += this.velocity * step;
    }
  }
}

// A short chain of shrinking blobs from inside the drop toward the pointer,
// pre-squash: hidden at 0, a cusp at 1 (the Reach chain, local and small).
const cusp = [
  [0.9, 0.3],
  [1.15, 0.2],
  [1.38, 0.13],
  [1.58, 0.08],
  [1.74, 0.045],
  [1.86, 0.02],
] as const;

function raiseCusp(pose: Pose, pressing: Press, centreX: number, size: number) {
  const amount = Math.min(Math.max(pressing.amount, 0), 1);
  if (amount < 0.001) return;
  const dx = pressing.x / size - centreX / size;
  const dy = Math.max(pressing.y / (rest.squash * size) - rest.lift, 0.35);
  const length = Math.hypot(dx, dy);
  pose[poseLayout.blend] = rest.blend - 0.3 * amount;
  cusp.forEach(([distance, radius], index) => {
    const travel = (0.5 + (distance - 0.5) * amount) * size;
    setBlob(pose, index + 2, centreX + (dx / length) * travel, rest.lift * size + (dy / length) * travel, 0, radius * size);
  });
}

function restPose(pose: Pose, input: PoseInput, leaning: Lean, pressing: Press) {
  const extension = Math.hypot(leaning.x, leaning.y) / lean.reach;
  const breath = input.still ? 0 : Math.sin(input.time * 0.7) * 0.006;
  // The lobe thins as it travels, which turns the bulge into a shoulder.
  // Volume follows mass, so the radius follows its cube root.
  const size = Math.cbrt(Math.max(input.mass, 0.001));
  const lobeRadius = lean.radius * (1 - 0.18 * extension) * size;
  const lobeY = Math.max((rest.lift + leaning.y / rest.squash) * size, lobeRadius * 0.6);
  // The main mass gives up what the lobe carries away, so the body leans instead of growing.
  setBlob(pose, 0, leaning.x * 0.22 * size, rest.lift * size, 0, rest.radius * (1 + breath - 0.07 * extension) * size);
  setBlob(pose, 1, leaning.x * size, lobeY, 0, lobeRadius);
  pose[poseLayout.squash] = rest.squash * (1 + press.dip * Math.min(pressing.amount, 0));
  raiseCusp(pose, pressing, leaning.x * 0.22 * size, size);
}

// A chain of shrinking blobs toward the magnet: the smooth minimum turns it
// into one cusp. Distances and radii are in pre-squash space.
const chain = [
  [0.5, 0.7],
  [0.95, 0.5],
  [1.36, 0.34],
  [1.72, 0.22],
  [2.02, 0.13],
  [2.26, 0.07],
  [2.44, 0.03],
] as const;

function reachPose(pose: Pose, input: PoseInput) {
  const squash = 0.84;
  const dx = magnet.x;
  const dy = magnet.y / squash - rest.lift;
  const length = Math.hypot(dx, dy);
  const wobble = input.still ? 0 : Math.sin(input.time * 0.9) * 0.012;
  pose[poseLayout.squash] = squash;
  pose[poseLayout.blend] = 0.5 - 0.14 * input.reach;
  setBlob(pose, 0, 0.1 * input.reach, rest.lift - 0.04 * input.reach, 0, rest.radius * (1 - 0.1 * input.reach));
  chain.forEach(([distance, radius], index) => {
    const travel = distance * (input.reach + wobble);
    setBlob(pose, index + 1, (dx / length) * travel, rest.lift + (dy / length) * travel, 0, radius);
  });
}

function crownPose(pose: Pose, input: PoseInput) {
  pose[poseLayout.squash] = 0.46;
  pose[poseLayout.spike] = input.field;
  pose[poseLayout.shadow] = 6.5;
  // The mound sinks as the spikes take its volume.
  setBlob(pose, 0, 0, 0.3 - 0.28 * input.field, 0, 1.42);
}

function partPose(pose: Pose, input: PoseInput) {
  const split = input.split;
  pose[poseLayout.squash] = 0.62;
  pose[poseLayout.shadow] = 7;
  pose[poseLayout.extentX] = 2.6;
  pose[poseLayout.extentZ] = 4.4;
  pose[poseLayout.blend] = 0.5 - 0.22 * split;
  for (let index = 0; index < 4; index += 1) {
    const focus = input.focus[index];
    const radius = (0.86 - 0.36 * split) * (1 + 0.1 * focus);
    setBlob(pose, index, 0, 0.42 - 0.1 * split + 0.16 * focus, (index - 1.5) * liquidModel.dropletPitch * split, radius);
  }
}

function bridgePose(pose: Pose, input: PoseInput) {
  const breath = input.still ? 0 : Math.sin(input.time * 0.8) * 0.012;
  pose[poseLayout.squash] = 1;
  pose[poseLayout.blend] = 0.6;
  pose[poseLayout.ceiling] = 2.18;
  setBlob(pose, 0, 0, 0.22, 0, 0.8);
  setBlob(pose, 1, 0, 2, 0, 0.8);
  setBlob(pose, 2, 0, 1.1, 0, 0.27 + breath);
}

function slabPose(pose: Pose) {
  pose[poseLayout.squash] = 1;
  for (let index = 0; index < liquidModel.maxBlobs; index += 1) setBlob(pose, index, 0, 1, 0, -1);
  pose.set([0, 0.98, 0, 1], poseLayout.slab);
  pose.set([0.92, 0.98, 0.17, 0.045], poseLayout.slabSize);
}

function orbPose(pose: Pose, input: PoseInput) {
  const breath = input.still ? 0 : Math.sin(input.time * 1.1) * 0.03;
  pose[poseLayout.squash] = 1;
  pose[poseLayout.orbSpike] = 0.5 + breath;
  setBlob(pose, 0, 0, 1.22, 0, 0.6);
}

const pool = [
  [-2.7, 0.1, 1.05],
  [-1.5, -0.25, 1.45],
  [0, 0.1, 1.6],
  [1.4, 0.3, 1.4],
  [2.75, -0.05, 1.1],
] as const;

function poolPose(pose: Pose) {
  pose[poseLayout.squash] = 0.17;
  pose[poseLayout.shadow] = 7;
  pose[poseLayout.extentX] = 5.6;
  pose[poseLayout.extentZ] = 4.4;
  pose[poseLayout.blend] = 0.9;
  pool.forEach(([x, z, radius], index) => setBlob(pose, index, x, 0.25, z, radius));
}

export function writePose(id: PoseId, pose: Pose, input: PoseInput, leaning: Lean, pressing: Press) {
  resetPose(pose);
  switch (id) {
    case "rest":
      return restPose(pose, input, leaning, pressing);
    case "reach":
      return reachPose(pose, input);
    case "crown":
      return crownPose(pose, input);
    case "part":
      return partPose(pose, input);
    case "bridge":
      return bridgePose(pose, input);
    case "slab":
      return slabPose(pose);
    case "orb":
      return orbPose(pose, input);
    case "pool":
      return poolPose(pose);
  }
}
