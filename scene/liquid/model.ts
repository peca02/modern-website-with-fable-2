// Shared liquid model: one set of constants and one live state, read by the
// shader (as generated GLSL constants and uniforms) and by the CPU (for DOM
// labels that follow 3D points). This file must not import three.

export const liquidModel = {
  maxBlobs: 8,
  /** proxy volume the raymarch runs in; the floor (y = 0) is its bottom face */
  bounds: { halfWidth: 3.6, height: 2.8, halfDepth: 3.6 },
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
} as const;

export type LiquidState = {
  /** x, y, z, radius per blob; y is in pre-squash space */
  blobs: Float32Array;
  count: number;
  squash: number;
  blend: number;
};

export const liquid: LiquidState = {
  blobs: new Float32Array(liquidModel.maxBlobs * 4),
  count: 0,
  squash: liquidModel.rest.squash,
  blend: liquidModel.rest.blend,
};

export function setBlob(state: LiquidState, index: number, x: number, y: number, z: number, radius: number) {
  const offset = index * 4;
  state.blobs[offset] = x;
  state.blobs[offset + 1] = y;
  state.blobs[offset + 2] = z;
  state.blobs[offset + 3] = radius;
}

function smoothMin(a: number, b: number, k: number) {
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - h * h * k * 0.25;
}

/** Same field as `sdLiquid` in the fragment shader. */
export function distanceToLiquid(state: LiquidState, x: number, y: number, z: number) {
  const stretchedY = y / state.squash;
  let distance = 1e4;
  for (let index = 0; index < state.count; index += 1) {
    const offset = index * 4;
    const blob = Math.hypot(x - state.blobs[offset], stretchedY - state.blobs[offset + 1], z - state.blobs[offset + 2]);
    distance = smoothMin(distance, blob - state.blobs[offset + 3], state.blend);
  }
  return distance * state.squash;
}

const glslFloat = (value: number) => (Number.isInteger(value) ? value.toFixed(1) : String(value));

export function liquidGlslConstants() {
  const { halfWidth, height, halfDepth } = liquidModel.bounds;
  return [
    `#define MAX_BLOBS ${liquidModel.maxBlobs}`,
    `const vec3 BOX_MIN = vec3(${glslFloat(-halfWidth)}, 0.0, ${glslFloat(-halfDepth)});`,
    `const vec3 BOX_MAX = vec3(${glslFloat(halfWidth)}, ${glslFloat(height)}, ${glslFloat(halfDepth)});`,
  ].join("\n");
}
