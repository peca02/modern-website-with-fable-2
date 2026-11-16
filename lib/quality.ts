export type QualityTier = 0 | 1 | 2 | 3;

export type QualitySettings = {
  maxDpr: number;
  raymarchSteps: number;
  /** side of the square GPGPU texture; particle count is its square */
  particleTextureSize: number;
  selfReflection: boolean;
};

export const qualitySettings: Record<QualityTier, QualitySettings> = {
  0: { maxDpr: 1.5, raymarchSteps: 40, particleTextureSize: 64, selfReflection: false },
  1: { maxDpr: 1.5, raymarchSteps: 56, particleTextureSize: 128, selfReflection: false },
  2: { maxDpr: 1.75, raymarchSteps: 72, particleTextureSize: 192, selfReflection: true },
  3: { maxDpr: 2, raymarchSteps: 96, particleTextureSize: 256, selfReflection: true },
};

export function pickInitialTier(): QualityTier {
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const cores = navigator.hardwareConcurrency ?? 4;
  const smallScreen = Math.min(window.innerWidth, window.innerHeight) < 500;
  if (coarse && (smallScreen || cores <= 4)) return 0;
  if (coarse || cores <= 4) return 1;
  if (cores >= 12 && window.innerWidth >= 1600) return 3;
  return 2;
}

export function lowerTier(tier: QualityTier): QualityTier {
  if (tier === 3) return 2;
  if (tier === 2) return 1;
  return 0;
}
