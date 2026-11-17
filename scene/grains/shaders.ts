import { liquidGlslConstants } from "@/scene/liquid/model";

export const simulationVertexShader = /* glsl */ `
void main() {
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

// Positions live in a texture. Every grain has a target given by a formula
// for the current shape, and is carried toward it through a curl field.
export const simulationFragmentShader = /* glsl */ `
${liquidGlslConstants()}
uniform sampler2D uPositions;
uniform float uSize;
uniform float uTime;
uniform float uDelta;
uniform float uReset;
uniform float uTurbulence;
uniform int uShapeFrom;
uniform int uShapeTo;
uniform float uMix;
uniform float uField;
uniform float uSplit;
uniform vec4 uFocus;

const float TAU = 6.2831853;
const float FLOOR = 0.012;
const vec2 HEX = vec2(1.0, 1.7320508);

vec4 hash4(vec2 p) {
  vec4 q = fract(p.xyxy * vec4(0.1031, 0.1030, 0.0973, 0.1099));
  q += dot(q, q.wzxy + 33.33);
  return fract((q.xxyz + q.yzzw) * q.zywx);
}

vec2 hexCentre(vec2 p) {
  vec2 g = p / LATTICE;
  vec2 a = mod(g, HEX) - HEX * 0.5;
  vec2 b = mod(g - HEX * 0.5, HEX) - HEX * 0.5;
  return (g - (dot(a, a) < dot(b, b) ? a : b)) * LATTICE;
}

vec3 targetFor(int shape, vec4 h) {
  if (shape == 1) {
    // Lines of a dipole at the magnet, its axis through the liquid.
    vec3 axis = normalize(vec3(0.0, 0.5, 0.0) - MAGNET);
    vec3 side = normalize(cross(axis, vec3(0.0, 0.0, 1.0)));
    vec3 across = cross(axis, side);
    // A few dozen discrete lines, grains strung along them like filings.
    float shell = floor(h.x * 4.0);
    float phi = TAU * (floor(h.z * 8.0) + 0.5 * mod(shell, 2.0)) / 8.0;
    float theta = mix(0.2, 0.8, fract(h.y + uTime * 0.01)) * 3.14159265;
    float r = (1.2 + 0.6 * shell) * sin(theta) * sin(theta) + 0.07 * (h.w - 0.5);
    vec3 p = MAGNET + axis * r * cos(theta) + (side * cos(phi) + across * sin(phi)) * r * sin(theta);
    return vec3(p.x, max(p.y, FLOOR), p.z);
  }
  if (shape == 2) {
    // Small heaps on the lattice around the mound; they stand up with the field.
    float r = 1.65 + 1.25 * sqrt(h.x);
    float angle = TAU * h.y;
    vec2 cell = hexCentre(vec2(cos(angle), sin(angle)) * r);
    float jitter = TAU * h.w * 7.0;
    float spread = 0.045 * sqrt(h.z) * (1.0 - 0.6 * uField);
    float rise = h.z * 0.26 * uField * exp(-dot(cell, cell) / 9.0);
    return vec3(cell.x + cos(jitter) * spread, FLOOR + rise, cell.y + sin(jitter) * spread);
  }
  if (shape == 3) {
    // A ring on the floor around each droplet.
    float droplet = floor(h.x * 4.0);
    // The ring of the focused droplet draws in close and turns faster.
    float focus = dot(uFocus, vec4(equal(vec4(droplet), vec4(0.0, 1.0, 2.0, 3.0))));
    float angle = TAU * h.z + uTime * (0.2 + 0.25 * focus);
    float r = mix(0.74 + 0.14 * h.y * h.y, 0.66 + 0.04 * h.y, focus);
    return vec3(cos(angle) * r, FLOOR, (droplet - 1.5) * DROPLET_PITCH * uSplit + sin(angle) * r);
  }
  if (shape == 4) {
    // One tilted halo around the waist of the bridge.
    float angle = TAU * h.x + uTime * 0.15;
    float r = 1.46 + 0.14 * (h.y - 0.5) * (h.y - 0.5) * 4.0;
    float x = cos(angle) * r;
    return vec3(x * 0.955, 1.1 + x * 0.296 + 0.035 * (h.z - 0.5), sin(angle) * r);
  }
  if (shape == 5) {
    // A square drawn on the floor around the slab, turned with it.
    float along = fract(h.x * 4.0) * 2.0 - 1.0;
    float edge = floor(h.x * 4.0);
    vec2 local = edge < 1.0 ? vec2(along, 1.0) : edge < 2.0 ? vec2(1.0, -along) : edge < 3.0 ? vec2(-along, -1.0) : vec2(-1.0, along);
    local = local * 1.7 + (h.yz - 0.5) * 0.04;
    float c = cos(SLAB_YAW);
    float s = sin(SLAB_YAW);
    return vec3(c * local.x + s * local.y, FLOOR, -s * local.x + c * local.y);
  }
  if (shape == 6) {
    // A shell around the spiked sphere.
    float z = 1.0 - 2.0 * h.x;
    float angle = TAU * h.y + uTime * 0.08;
    float ring = sqrt(max(1.0 - z * z, 0.0));
    return vec3(0.0, 1.22, 0.0) + 1.4 * vec3(cos(angle) * ring, z, sin(angle) * ring);
  }
  // Dust scattered on the floor.
  float r = 1.5 + 3.2 * sqrt(h.x);
  float angle = TAU * h.y;
  return vec3(cos(angle) * r * 1.3, FLOOR, sin(angle) * r * 0.8);
}

// Curl of a sinusoidal potential: divergence-free, so grains swirl without bunching.
vec3 curl(vec3 p) {
  return vec3(
    -1.3 * sin(1.3 * p.y) - cos(p.z),
    -1.3 * sin(1.3 * p.z) - cos(p.x),
    -1.3 * sin(1.3 * p.x) - cos(p.y)
  );
}

void main() {
  vec4 h = hash4(gl_FragCoord.xy);
  // Grains leave for the next shape one after another, not all at once.
  float amount = smoothstep(h.z * 0.5, h.z * 0.5 + 0.5, uMix);
  vec3 goal = mix(targetFor(uShapeFrom, h), targetFor(uShapeTo, h), amount);
  if (uReset > 0.5) {
    gl_FragColor = vec4(goal, 1.0);
    return;
  }
  vec3 p = texture2D(uPositions, gl_FragCoord.xy / uSize).xyz;
  float rate = 1.2 + 2.6 * h.w;
  p += (goal - p) * (1.0 - exp(-uDelta * rate));
  p += curl(p * 1.7 + uTime * 0.07) * uTurbulence * min(uDelta, 0.05);
  p.y = max(p.y, FLOOR * 0.8);
  gl_FragColor = vec4(p, 1.0);
}
`;

export const grainVertexShader = /* glsl */ `
uniform sampler2D uPositions;
uniform float uScale;
uniform float uWeight;

void main() {
  vec3 p = texture2D(uPositions, position.xy).xyz;
  float seed = fract(sin(dot(position.xy, vec2(12.9898, 78.233))) * 43758.5453);
  vec4 mv = viewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  float present = clamp((uWeight - seed * 0.9) * 10.0, 0.0, 1.0);
  float radius = 0.0045 + 0.005 * fract(seed * 7.31);
  gl_PointSize = present * max(2.0 * radius * uScale / -mv.z, 1.2);
}
`;

export const grainFragmentShader = /* glsl */ `
uniform vec3 uInk;

void main() {
  vec2 d = gl_PointCoord - 0.5;
  if (dot(d, d) > 0.25) discard;
  gl_FragColor = vec4(uInk, 1.0);
}
`;
