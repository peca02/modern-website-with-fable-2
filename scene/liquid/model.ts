// Shared liquid model: one set of constants and one live pose, read by the
// shader (as generated GLSL constants and uniforms) and by the CPU (for DOM
// labels that follow 3D points). This file must not import three.

import { beats } from "@/lib/beats";

const maxBlobs = 8;

export const liquidModel = {
  maxBlobs,
  /** tallest the proxy volume of the raymarch gets; the floor (y = 0) is its bottom face */
  height: 3,
  /** half width and half depth of the proxy volume for compact bodies */
  extent: 3.6,
  rest: {
    radius: 1,
    /** height of the blob centre above the floor, before squash */
    lift: 0.6,
    /** vertical scale of the whole body: gravity flattening a sessile drop */
    squash: 0.8,
    /** smooth-min radius joining blobs */
    blend: 0.5,
  },
  lean: {
    radius: 0.7,
    /** furthest the leaning lobe travels from the centre */
    reach: 0.96,
    /** pointer distance at which the pull has halved */
    range: 3.4,
    /** follow rate in 1/s; low values read as viscous */
    follow: 2.6,
  },
  /** where the unseen magnet sits in the Reach chapter */
  magnet: { x: 1.75, y: 2.5, z: 0 },
  /** hexagonal lattice of spikes, centred on the world origin */
  crown: {
    spacing: 0.33,
    /** radius at which the local field has dropped to 1/e */
    envelope: 1.08,
    /** local field below which no spike stands */
    critical: beats.criticalField,
    height: 0.72,
    /** tangent of the cone half-angle */
    slope: 0.3,
    tipRound: 0.016,
  },
  /** yaw of the slab in Hold, so one edge faces the camera */
  slabYaw: 0.62,
  /** vertical pitch of the four droplets in Part, along z */
  dropletPitch: 1.3,
  ceilingOff: 10,
  /** lattice cells (column, row) whose spike tips carry DOM labels */
  labelledSpikes: [
    [0, 0],
    [-2, 0],
    [1, 2],
  ],
} as const;

/** Layout of a pose buffer. Poses are lerped component by component. */
export const poseLayout = {
  blobs: 0,
  squash: maxBlobs * 4,
  blend: maxBlobs * 4 + 1,
  /** everything above this height is cut flat */
  ceiling: maxBlobs * 4 + 2,
  /** field strength over the lattice, 0–1 */
  spike: maxBlobs * 4 + 3,
  /** centre xyz and presence 0–1 */
  slab: maxBlobs * 4 + 4,
  /** half extents xyz and edge radius */
  slabSize: maxBlobs * 4 + 8,
  /** height of the radial spikes on blob 0 */
  orbSpike: maxBlobs * 4 + 12,
  /** half width and half depth of the proxy volume the raymarch runs in */
  extentX: maxBlobs * 4 + 13,
  extentZ: maxBlobs * 4 + 14,
  /** falloff of the contact shadow; low wide bodies need a tighter one */
  shadow: maxBlobs * 4 + 15,
  size: maxBlobs * 4 + 16,
} as const;

export type Pose = Float32Array;

export function createPose(): Pose {
  return resetPose(new Float32Array(poseLayout.size));
}

/** One resting sphere; unused blobs hide inside it with a negative radius. */
export function resetPose(pose: Pose): Pose {
  const { rest } = liquidModel;
  pose.fill(0);
  for (let index = 0; index < maxBlobs; index += 1) setBlob(pose, index, 0, rest.lift, 0, -1);
  pose[poseLayout.squash] = rest.squash;
  pose[poseLayout.blend] = rest.blend;
  pose[poseLayout.ceiling] = liquidModel.ceilingOff;
  pose[poseLayout.extentX] = liquidModel.extent;
  pose[poseLayout.extentZ] = liquidModel.extent;
  pose[poseLayout.shadow] = 3.6;
  return pose;
}

export function setBlob(pose: Pose, index: number, x: number, y: number, z: number, radius: number) {
  const offset = index * 4;
  pose[offset] = x;
  pose[offset + 1] = y;
  pose[offset + 2] = z;
  pose[offset + 3] = radius;
}

/** Blobs the shader has to visit: everything up to the last one that is not hidden. */
export function activeBlobs(pose: Pose) {
  let count = maxBlobs;
  while (count > 1 && pose[count * 4 - 1] <= -0.99) count -= 1;
  return count;
}

export function mixPoses(out: Pose, from: Pose, to: Pose, amount: number) {
  for (let index = 0; index < poseLayout.size; index += 1) {
    out[index] = from[index] + (to[index] - from[index]) * amount;
  }
}

const livePose = createPose();

export const liquid = {
  pose: livePose,
  /** view of the blob part of the pose, uploaded as a vec4 array */
  blobs: livePose.subarray(0, maxBlobs * 4),
  /** amplitude and phase of the slow surface swell */
  swell: 0,
  swellTime: 0,
};

export type LiquidState = typeof liquid;

const smoothstep = (low: number, high: number, value: number) => {
  const t = Math.min(Math.max((value - low) / (high - low), 0), 1);
  return t * t * (3 - 2 * t);
};

const hexRow = Math.sqrt(3) / 2;

export type Point3 = { x: number; y: number; z: number };

/**
 * Tip of the spike in lattice cell (column, row); same maths as `sdSpikes` in
 * the fragment shader. Returns false when no spike stands in that cell.
 */
export function spikeTip(pose: Pose, column: number, row: number, out: Point3) {
  const { crown } = liquidModel;
  const x = (column + (row % 2 === 0 ? 0 : 0.5)) * crown.spacing;
  const z = row * hexRow * crown.spacing;
  const local = pose[poseLayout.spike] * Math.exp(-(x * x + z * z) / crown.envelope ** 2);
  const rise = crown.height * smoothstep(crown.critical, 1, local);
  const dx = x - pose[0];
  const dz = z - pose[2];
  const base = pose[poseLayout.squash] * (pose[1] + Math.sqrt(Math.max(pose[3] ** 2 - dx * dx - dz * dz, 0)));
  out.x = x;
  out.y = base + rise - crown.tipRound;
  out.z = z;
  return rise > 0.002;
}

/** Centre of a blob in world space (the squash applied). */
export function blobCentre(pose: Pose, index: number, out: Point3) {
  out.x = pose[index * 4];
  out.y = pose[index * 4 + 1] * pose[poseLayout.squash];
  out.z = pose[index * 4 + 2];
}

const glslFloat = (value: number) => (Number.isInteger(value) ? value.toFixed(1) : String(value));

export function liquidGlslConstants() {
  const { crown, magnet } = liquidModel;
  return [
    `#define MAX_BLOBS ${maxBlobs}`,
    `const float BOX_HEIGHT = ${glslFloat(liquidModel.height)};`,
    `const float LATTICE = ${glslFloat(crown.spacing)};`,
    `const float ENVELOPE = ${glslFloat(crown.envelope)};`,
    `const float CRITICAL = ${glslFloat(crown.critical)};`,
    `const float SPIKE_HEIGHT = ${glslFloat(crown.height)};`,
    `const float SPIKE_SLOPE = ${glslFloat(crown.slope)};`,
    `const float TIP_ROUND = ${glslFloat(crown.tipRound)};`,
    `const float SLAB_YAW = ${glslFloat(liquidModel.slabYaw)};`,
    `const float DROPLET_PITCH = ${glslFloat(liquidModel.dropletPitch)};`,
    `const vec3 MAGNET = vec3(${glslFloat(magnet.x)}, ${glslFloat(magnet.y)}, ${glslFloat(magnet.z)});`,
  ].join("\n");
}
