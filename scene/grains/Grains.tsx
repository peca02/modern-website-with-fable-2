"use client";

import { useEffect, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { qualitySettings, type QualityTier } from "@/lib/quality";
import { store } from "@/lib/store";
import { direction } from "@/scene/direction";
import { GrainSimulation, type GrainFrame } from "@/scene/grains/GrainSimulation";

const frame: GrainFrame = {
  time: 0,
  delta: 0,
  shapeFrom: 0,
  shapeTo: 0,
  mix: 0,
  field: 0,
  split: 0,
  weight: 0,
  scale: 1,
  still: false,
};

// Secondary matter: fine dark grains that gather along the field. Drawn as
// opaque discs before the liquid, which tests its own depth against them.
export function Grains({ tier }: { tier: QualityTier }) {
  const renderer = useThree((state) => state.gl);
  const [simulation] = useState(
    // Float targets where the browser can render to them, half-float otherwise.
    () => new GrainSimulation(qualitySettings[tier].particleTextureSize, renderer.extensions.has("EXT_color_buffer_float")),
  );

  useEffect(() => () => simulation.dispose(), [simulation]);

  useFrame(({ camera, clock, gl, size, viewport }, delta) => {
    frame.time = clock.elapsedTime;
    // The pull toward the target is an exponential, so a long frame is safe.
    frame.delta = Math.min(delta, 1);
    frame.shapeFrom = direction.grainFrom;
    frame.shapeTo = direction.grainTo;
    frame.mix = direction.grainMix;
    frame.field = direction.field;
    frame.split = direction.split;
    frame.weight = direction.grainWeight;
    frame.still = store.reducedMotion;
    if ("fov" in camera) {
      frame.scale = (size.height * viewport.dpr) / (2 * Math.tan((camera.fov * Math.PI) / 360));
    }
    simulation.update(gl, frame);
  });

  return <primitive object={simulation.points} />;
}
