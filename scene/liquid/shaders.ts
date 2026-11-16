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
uniform float uSquash;
uniform float uBlend;
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

float sdLiquid(vec3 p) {
  vec3 q = vec3(p.x, p.y / uSquash, p.z);
  float d = 1e4;
  for (int i = 0; i < MAX_BLOBS; i++) {
    if (i >= uBlobCount) break;
    vec4 blob = uBlobs[i];
    d = smin(d, length(q - blob.xyz) - blob.w, uBlend);
  }
  return d * uSquash;
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
  col += key * 15.0;

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
  float occlusion = clamp(exp(-d * 3.6), 0.0, 1.0);

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

  vec3 inv = 1.0 / rd;
  vec3 t0 = (BOX_MIN - ro) * inv;
  vec3 t1 = (BOX_MAX - ro) * inv;
  vec3 tLow = min(t0, t1);
  vec3 tHigh = max(t0, t1);
  float tNear = max(max(tLow.x, tLow.y), max(tLow.z, 0.0));
  float tFar = min(min(tHigh.x, tHigh.y), tHigh.z);
  if (tFar <= tNear) discard;

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
    t += d;
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
    vec2 span = abs(pf.xz) / BOX_MAX.xz;
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
        if (tr > 4.0 || q.y > BOX_MAX.y) break;
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
