"use client";

import { useEffect, useRef } from "react";
import { extend, useFrame, type ThreeElement } from "@react-three/fiber";
import { Vector3, type CanvasTexture } from "three";
import { site } from "@/lib/content";
import type { QualityTier } from "@/lib/quality";
import { store } from "@/lib/store";
import { LiquidMaterial } from "@/scene/liquid/LiquidMaterial";
import { liquid, liquidModel } from "@/scene/liquid/model";
import { RestingDrop, type PullTarget } from "@/scene/liquid/restingDrop";
import { createWordmarkTexture } from "@/scene/liquid/wordmark";

declare module "@react-three/fiber" {
  interface ThreeElements {
    liquidMaterial: ThreeElement<typeof LiquidMaterial>;
  }
}

extend({ LiquidMaterial });

const { halfWidth, height, halfDepth } = liquidModel.bounds;
const restingDrop = new RestingDrop();
const pointerRay = new Vector3();
const pull: PullTarget = { x: 0, y: 0 };

export function Liquid({ tier }: { tier: QualityTier }) {
  const material = useRef<LiquidMaterial>(null);
  const wordmark = useRef<CanvasTexture>(null);

  useEffect(() => {
    let cancelled = false;
    createWordmarkTexture(site.name).then((texture) => {
      if (cancelled) texture?.dispose();
      else wordmark.current = texture;
    });
    return () => {
      cancelled = true;
      wordmark.current?.dispose();
      wordmark.current = null;
    };
  }, []);

  useFrame(({ camera, clock, size, viewport }, delta) => {
    const target = material.current;
    if (!target) return;

    let pullTarget: PullTarget | null = null;
    if (store.pointer.active && !store.reducedMotion) {
      // Where the pointer ray crosses the vertical plane through the drop.
      pointerRay.set(store.pointer.x, store.pointer.y, 0.5).unproject(camera).sub(camera.position);
      if (pointerRay.z < 0) {
        const t = -camera.position.z / pointerRay.z;
        pull.x = camera.position.x + pointerRay.x * t;
        pull.y = camera.position.y + pointerRay.y * t;
        pullTarget = pull;
      }
    }
    restingDrop.update(liquid, Math.min(delta, 0.1), clock.elapsedTime, pullTarget, store.reducedMotion);

    target.syncState(liquid);
    target.setWordmark(wordmark.current);
    if ("fov" in camera) {
      target.setPixelAngle((2 * Math.tan((camera.fov * Math.PI) / 360)) / (size.height * viewport.dpr));
    }
  });

  return (
    <mesh position={[0, height / 2, 0]} frustumCulled={false}>
      <boxGeometry args={[halfWidth * 2, height, halfDepth * 2]} />
      <liquidMaterial key={tier} ref={material} args={[tier]} />
    </mesh>
  );
}
