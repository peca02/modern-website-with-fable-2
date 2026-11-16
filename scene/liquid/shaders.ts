import { liquidGlslConstants } from "@/scene/liquid/model";

export type LiquidShaderOptions = {
  steps: number;
  selfReflection: boolean;
  floorReflection: boolean;
  shadowSteps: number;
};

export const liquidVertexShader = /* glsl */ `
varying vec3 vWorld;

void main() {
  vec4 world = modelMatrix * vec4(position, 1.0);
  vWorld = world.xyz;
  gl_Position = projectionMatrix * viewMatrix * world;
}
`;

const fragmentBody = /* glsl */ `
uniform mat4 projectionMatrix;
uniform vec4 uBlobs[MAX_BLOBS];
uniform int uBlobCount;
uniform vec2 uExtent;
uniform float uSquash;
uniform float uBlend;
uniform float uCeiling;
uniform float uSpike;
uniform float uOrbSpike;
uniform float uShadow;
uniform vec4 uSlab;
uniform vec4 uSlabSize;
uniform float uSwell;
uniform float uSwellTime;
uniform float uPixelAngle;
uniform sampler2D uWordmark;
uniform float uWordmarkOn;
uniform vec3 uField;
uniform vec3 uPage;

varying vec3 vWorld;

// Reflectance at normal incidence. Real ferrofluid sits near 0.04; a little
// more keeps the studio readable in the body without turning it to chrome.
const float F0 = 0.075;
const float EXPOSURE = 1.9;
const vec3 UP = vec3(0.0, 1.0, 0.0);
const vec3 KEY_DIR = normalize(vec3(-0.22, 1.0, 0.3));

float smin(float a, float b, float k) {
  float h = max(k - abs(a - b), 0.0) / k;
  return min(a, b) - h * h * k * 0.25;
}

// Distance to a cone with its tip at the origin, opening along +y of q.
float sdCone(vec2 q, float slope) {
  vec2 c = normalize(vec2(slope, 1.0));
  float d = length(q - c * max(dot(q, c), 0.0));
  return q.x * c.y - q.y * c.x < 0.0 ? -d : d;
}

// Hexagonal lattice of cones standing on the mound (blob 0). Each cell holds
// one cone; its height follows the local field, which falls off from the centre.
const vec2 HEX = vec2(1.0, 1.7320508);

float sdSpikes(vec3 p) {
  vec2 g = p.xz / LATTICE;
  vec2 a = mod(g, HEX) - HEX * 0.5;
  vec2 b = mod(g - HEX * 0.5, HEX) - HEX * 0.5;
  vec2 c = (g - (dot(a, a) < dot(b, b) ? a : b)) * LATTICE;
  float local = uSpike * exp(-dot(c, c) / (ENVELOPE * ENVELOPE));
  float rise = SPIKE_HEIGHT * smoothstep(CRITICAL, 1.0, local);
  if (rise < 0.002) return 1e4;
  vec4 mound = uBlobs[0];
  vec2 o = c - mound.xz;
  float base = uSquash * (mound.y + sqrt(max(mound.w * mound.w - dot(o, o), 0.0)));
  return sdCone(vec2(length(p.xz - c), base + rise - p.y), SPIKE_SLOPE) - TIP_ROUND;
}

// Radial spikes on blob 0 along the 32 axes of an icosahedron and its dual.
// The set is mirror-symmetric in every axis, so seven directions cover it.
const vec3 ORB_AXES[7] = vec3[7](
  vec3(0.0, 0.5257311, 0.8506508),
  vec3(0.5257311, 0.8506508, 0.0),
  vec3(0.8506508, 0.0, 0.5257311),
  vec3(0.5773503),
  vec3(0.0, 0.3568221, 0.9341724),
  vec3(0.3568221, 0.9341724, 0.0),
  vec3(0.9341724, 0.0, 0.3568221)
);

float sdOrbSpikes(vec3 p) {
  vec4 orb = uBlobs[0];
  vec3 v = abs(p - vec3(orb.x, orb.y * uSquash, orb.z));
  vec3 axis = ORB_AXES[0];
  float along = dot(v, axis);
  for (int i = 1; i < 7; i++) {
    float candidate = dot(v, ORB_AXES[i]);
    if (candidate > along) {
      along = candidate;
      axis = ORB_AXES[i];
    }
  }
  return sdCone(vec2(length(v - axis * along), orb.w + uOrbSpike - along), 0.2) - TIP_ROUND;
}

float sdSlab(vec3 p) {
  vec3 v = p - uSlab.xyz;
  float c = cos(SLAB_YAW);
  float s = sin(SLAB_YAW);
  v.xz = vec2(c * v.x - s * v.z, s * v.x + c * v.z);
  vec3 e = abs(v) - uSlabSize.xyz + uSlabSize.w;
  float d = length(max(e, 0.0)) + min(max(e.x, max(e.y, e.z)), 0.0) - uSlabSize.w;
  // A dead-flat face mirrors a single direction and reads as grey card.
  // A shallow pillow and the body's swell spread the studio across it.
  vec2 face = v.xy / uSlabSize.xy;
  float pillow = (1.0 - face.x * face.x) * (1.0 - face.y * face.y);
  float ripple = sin(v.x * 4.2 + uSwellTime * 0.9) * sin(v.y * 3.6 - uSwellTime * 0.7);
  d -= (SLAB_PILLOW + ripple * uSwell) * pillow;
  // While the slab is absent it sits out of reach of the smooth minimum.
  return d + (1.0 - uSlab.w) * 2.0;
}

float sdLiquid(vec3 p) {
  vec3 q = vec3(p.x, p.y / uSquash, p.z);
  float d = 1e4;
  for (int i = 0; i < MAX_BLOBS; i++) {
    if (i >= uBlobCount) break;
    vec4 blob = uBlobs[i];
    d = smin(d, length(q - blob.xyz) - blob.w, uBlend);
  }
  // A slow swell far below the size of the body: it barely moves the
  // silhouette, but reflections magnify it, and that is what reads as liquid.
  float swell = sin(q.x * 4.2 + uSwellTime * 0.9) * sin(q.z * 3.6 - uSwellTime * 0.7) + 0.6 * sin(q.y * 5.0 + q.x * 2.0 + uSwellTime * 1.1);
  d = (d + swell * uSwell) * uSquash;
  if (uSpike > 0.001) d = smin(d, sdSpikes(p), 0.2);
  if (uOrbSpike > 0.001) d = smin(d, sdOrbSpikes(p), 0.1);
  if (uSlab.w > 0.001) d = smin(d, sdSlab(p), 0.3);
  return max(d, p.y - uCeiling);
}

vec3 liquidNormal(vec3 p) {
  const vec2 e = vec2(1.0, -1.0) * 0.0015;
  return normalize(
    e.xyy * sdLiquid(p + e.xyy) +
    e.yyx * sdLiquid(p + e.yyx) +
    e.yxy * sdLiquid(p + e.yxy) +
    e.xxx * sdLiquid(p + e.xxx)
  );
}

float panel(vec3 ro, vec3 rd, vec3 centre, vec3 ux, vec3 uy, vec2 halfSize, float soft, out vec2 uv) {
  uv = vec2(0.0);
  vec3 n = cross(ux, uy);
  float facing = dot(rd, n);
  if (abs(facing) < 1e-4) return 0.0;
  float t = dot(centre - ro, n) / facing;
  if (t <= 0.0) return 0.0;
  vec3 q = ro + rd * t - centre;
  vec2 local = vec2(dot(q, ux), dot(q, uy));
  uv = local / halfSize * 0.5 + 0.5;
  vec2 edge = abs(local) - halfSize;
  float d = length(max(edge, 0.0)) + min(max(edge.x, edge.y), 0.0);
  return 1.0 - smoothstep(-soft, soft, d);
}

// A dark room with one lit wall behind the camera: it shows as a soft band
// around the body's equator, while the silhouette keeps reflecting darkness.
vec3 backdrop(vec3 rd) {
  float front = smoothstep(-0.35, 0.85, rd.z);
  float band = exp(-abs(rd.y) * 2.6);
  return vec3(0.012) + vec3(0.2) * front * band;
}

// The floor as the liquid sees it: page-colored, lit in front of the
// subject, dark where the body presses on it, and fading into the room.
vec3 floorRadiance(vec3 p, vec3 rd, float travel) {
  float d = sdLiquid(p);
  float contact = mix(0.04, 1.0, smoothstep(0.0, 1.4, d));
  float front = smoothstep(-2.5, 2.5, p.z);
  vec3 lit = uPage * 0.24 * contact * mix(0.25, 1.0, front);
  vec3 horizon = backdrop(normalize(vec3(rd.x, 0.0, rd.z)));
  return mix(horizon, lit, exp(-travel * 0.09));
}

// Analytic studio: soft boxes, one field-colored strip, and the wordmark as
// a light behind the camera.
vec3 studio(vec3 ro, vec3 rd) {
  vec3 col;
  if (rd.y < 0.0) {
    float travel = -ro.y / rd.y;
    col = floorRadiance(ro + rd * travel, rd, travel);
  } else {
    col = backdrop(rd);
  }

  vec2 uv;
  float key = panel(ro, rd, vec3(-1.4, 6.5, 0.6), vec3(1.0, 0.0, 0.0), vec3(0.0, 0.0, 1.0), vec2(3.3, 2.1), 0.45, uv);
  // Brighter toward one end, like a real soft box seen off-axis.
  col += key * mix(8.0, 17.0, smoothstep(0.0, 1.0, uv.x * 0.7 + uv.y * 0.3));

  float strip = panel(ro, rd, vec3(-6.5, 2.7, -1.2), vec3(0.0, 0.0, 1.0), UP, vec2(0.42, 2.7), 0.12, uv);
  col += strip * 11.0;

  float field = panel(ro, rd, vec3(6.0, 1.45, 0.8), vec3(0.0, 0.0, 1.0), UP, vec2(3.4, 0.075), 0.03, uv);
  col += field * uField * 15.0;

  float mark = panel(ro, rd, vec3(0.5, 4.3, 7.0), vec3(1.0, 0.0, 0.0), normalize(vec3(0.0, 1.0, -0.45)), vec2(4.4, 1.45), 0.02, uv);
  col += mark * uWordmarkOn * texture2D(uWordmark, uv).r * 9.0;

  return col;
}

float fresnel(vec3 n, vec3 rd) {
  float nv = clamp(dot(n, -rd), 0.0, 1.0);
  return F0 + (1.0 - F0) * pow(1.0 - nv, 5.0);
}

vec3 shade(vec3 p, vec3 rd, bool allowSelf) {
  vec3 n = liquidNormal(p);
  vec3 r = reflect(rd, n);
  vec3 origin = p + n * 0.02;
  vec3 env = vec3(0.0);
  bool blocked = false;

#ifdef SELF_REFLECTION
  if (allowSelf) {
    float t = 0.02;
    for (int i = 0; i < 20; i++) {
      vec3 q = origin + r * t;
      float d = sdLiquid(q);
      if (d < 0.004) {
        vec3 n2 = liquidNormal(q);
        env = fresnel(n2, r) * studio(q + n2 * 0.02, reflect(r, n2));
        blocked = true;
        break;
      }
      t += d;
      if (t > 3.0 || q.y < 0.0) break;
    }
  }
#endif

  if (!blocked) env = studio(origin, r);
  return fresnel(n, rd) * env;
}

// Compress by the brightest channel so the field strip keeps its hue.
vec3 display(vec3 c) {
  float m = max(max(c.r, c.g), c.b);
  if (m > 0.0) c *= (1.0 - exp(-m * EXPOSURE)) / m;
  return pow(c, vec3(1.0 / 2.2));
}

float contactShadow(vec3 p) {
  float d = sdLiquid(p);
  float occlusion = clamp(exp(-d * uShadow), 0.0, 1.0);

  float lit = 1.0;
  float t = 0.06;
  for (int i = 0; i < SHADOW_STEPS; i++) {
    float h = sdLiquid(p + KEY_DIR * t);
    lit = min(lit, 5.0 * h / t);
    t += clamp(h, 0.05, 0.45);
    if (lit < 0.001 || t > 4.0) break;
  }
  lit = clamp(lit, 0.0, 1.0);
  float thrown = 1.0 - lit * lit * (3.0 - 2.0 * lit);

  return 1.0 - (1.0 - 0.7 * occlusion) * (1.0 - 0.2 * thrown);
}

float depthAt(vec3 p) {
  vec4 clip = projectionMatrix * viewMatrix * vec4(p, 1.0);
  return clip.z / clip.w * 0.5 + 0.5;
}

void main() {
  vec3 ro = cameraPosition;
  vec3 rd = normalize(vWorld - ro);

  vec3 boxMax = vec3(uExtent.x, BOX_HEIGHT, uExtent.y);
  vec3 inv = 1.0 / rd;
  vec3 t0 = (vec3(-uExtent.x, 0.0, -uExtent.y) - ro) * inv;
  vec3 t1 = (boxMax - ro) * inv;
  vec3 tLow = min(t0, t1);
  vec3 tHigh = max(t0, t1);
  float tNear = max(max(tLow.x, tLow.y), max(tLow.z, 0.0));
  float tFar = min(min(tHigh.x, tHigh.y), tHigh.z);
  if (tFar <= tNear) discard;

  // The lattice is only a bound between cells, so spiked bodies step shorter.
  float stride = uSpike + uOrbSpike > 0.001 ? 0.8 : 1.0;
  float t = tNear;
  float coverage = 0.0;
  float nearest = 1e4;
  float tNearest = t;
  for (int i = 0; i < STEPS; i++) {
    float d = sdLiquid(ro + rd * t);
    float ratio = d / t;
    if (ratio < nearest) {
      nearest = ratio;
      tNearest = t;
    }
    if (d < 0.0004 * t) {
      coverage = 1.0;
      tNearest = t;
      break;
    }
    t += d * stride;
    if (t > tFar) break;
  }
  // Rays that graze the body within a pixel get partial coverage: this is the
  // only anti-aliasing a raymarched silhouette has.
  if (coverage < 1.0) coverage = clamp(1.0 - nearest / uPixelAngle, 0.0, 1.0);

  vec4 result = vec4(0.0);
  float depthT = tFar;

  if (rd.y < 0.0) {
    float tFloor = -ro.y / rd.y;
    vec3 pf = ro + rd * tFloor;
    vec2 span = abs(pf.xz) / uExtent;
    float fade = 1.0 - smoothstep(0.6, 1.0, max(span.x, span.y));
    if (fade > 0.0) {
      float shadow = contactShadow(pf);
      vec4 ground = vec4(0.0, 0.0, 0.0, shadow);

#ifdef FLOOR_REFLECTION
      vec3 rr = vec3(rd.x, -rd.y, rd.z);
      float tr = 0.02;
      for (int i = 0; i < 28; i++) {
        vec3 q = pf + rr * tr;
        float d = sdLiquid(q);
        if (d < 0.003) {
          float gloss = (0.06 + 0.6 * pow(1.0 - clamp(-rd.y, 0.0, 1.0), 4.0)) * exp(-q.y * 3.2);
          ground = vec4(display(shade(q, rr, false)) * gloss, gloss) + ground * (1.0 - gloss);
          break;
        }
        tr += d;
        if (tr > 4.0 || q.y > BOX_HEIGHT) break;
      }
#endif

      result = ground * fade;
      depthT = tFloor;
    }
  }

  if (coverage > 0.0) {
    vec3 col = display(shade(ro + rd * tNearest, rd, true));
    result = vec4(col * coverage, coverage) + result * (1.0 - coverage);
    depthT = tNearest;
  }

  if (result.a < 0.004) discard;
  gl_FragColor = result;
  gl_FragDepth = depthAt(ro + rd * depthT);
}
`;

export function buildLiquidFragmentShader(options: LiquidShaderOptions) {
  return [
    `#define STEPS ${options.steps}`,
    `#define SHADOW_STEPS ${options.shadowSteps}`,
    options.selfReflection ? "#define SELF_REFLECTION" : "",
    options.floorReflection ? "#define FLOOR_REFLECTION" : "",
    liquidGlslConstants(),
    fragmentBody,
  ].join("\n");
}
