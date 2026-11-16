"use client";

import { useEffect, useRef } from "react";
import { extend, useFrame, type ThreeElement } from "@react-three/fiber";
import { Vector3, type Camera, type CanvasTexture, type Mesh } from "three";
import { site } from "@/lib/content";
import type { QualityTier } from "@/lib/quality";
import { store } from "@/lib/store";
import { LiquidMaterial } from "@/scene/liquid/LiquidMaterial";
import { direction } from "@/scene/direction";
import { blobCentre, createPose, liquid, liquidModel, mixPoses, poseLayout, spikeTip, type Point3 } from "@/scene/liquid/model";
import { Lean, writePose, type PoseInput, type PullTarget } from "@/scene/liquid/poses";
import { createWordmarkTexture } from "@/scene/liquid/wordmark";

declare module "@react-three/fiber" {
  interface ThreeElements {
    liquidMaterial: ThreeElement<typeof LiquidMaterial>;
  }
}

extend({ LiquidMaterial });

const lean = new Lean();
const poseFrom = createPose();
const poseTo = createPose();
const poseInput: PoseInput = { time: 0, still: false, reach: 0, field: 0, split: 0 };
const pointerRay = new Vector3();
const anchor = new Vector3();
const point: Point3 = { x: 0, y: 0, z: 0 };
const pull: PullTarget = { x: 0, y: 0 };
const swell = { rest: 0.0035, stirred: 0.011, settle: 0.9 };
let agitation = 0;

function writeAnchor(out: Float32Array, index: number, camera: Camera, width: number, height: number, present: boolean) {
  anchor.set(point.x, point.y, point.z).project(camera);
  out[index * 3] = (anchor.x * 0.5 + 0.5) * width;
  out[index * 3 + 1] = (0.5 - anchor.y * 0.5) * height;
  out[index * 3 + 2] = present && anchor.z < 1 ? 1 : 0;
}

export function Liquid({ tier }: { tier: QualityTier }) {
  const material = useRef<LiquidMaterial>(null);
  const volume = useRef<Mesh>(null);
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
    const resting = direction.poseFrom === "rest" || direction.poseTo === "rest";
    if (resting && store.pointer.active && !store.reducedMotion) {
      // Where the pointer ray crosses the vertical plane through the drop.
      pointerRay.set(store.pointer.x, store.pointer.y, 0.5).unproject(camera).sub(camera.position);
      if (pointerRay.z < 0) {
        const t = -camera.position.z / pointerRay.z;
        pull.x = camera.position.x + pointerRay.x * t;
        pull.y = camera.position.y + pointerRay.y * t;
        pullTarget = pull;
      }
    }
    const step = Math.min(delta, 0.1);
    lean.update(step, clock.elapsedTime, pullTarget, store.reducedMotion);

    poseInput.time = clock.elapsedTime;
    poseInput.still = store.reducedMotion;
    poseInput.reach = direction.reach;
    poseInput.field = direction.field;
    poseInput.split = direction.split;
    writePose(direction.poseFrom, poseFrom, poseInput, lean);
    if (direction.poseTo === direction.poseFrom) {
      liquid.pose.set(poseFrom);
    } else {
      writePose(direction.poseTo, poseTo, poseInput, lean);
      mixPoses(liquid.pose, poseFrom, poseTo, direction.poseMix);
    }

    // A fast pointer stirs the surface; it calms again within a couple of seconds.
    const speed = pullTarget ? Math.min(Math.hypot(store.pointer.vx, store.pointer.vy), 1) : 0;
    agitation = Math.max(speed, agitation * Math.exp(-step * swell.settle));
    liquid.swell = store.reducedMotion ? 0 : swell.rest + (swell.stirred - swell.rest) * agitation;
    liquid.swellTime = clock.elapsedTime;

    liquidModel.labelledSpikes.forEach(([column, row], index) => {
      const standing = spikeTip(liquid.pose, column, row, point);
      writeAnchor(store.anchors.spikes, index, camera, size.width, size.height, standing);
    });
    for (let index = 0; index < 4; index += 1) {
      blobCentre(liquid.pose, index, point);
      writeAnchor(store.anchors.droplets, index, camera, size.width, size.height, direction.split > 0.5);
    }

    volume.current?.scale.set(liquid.pose[poseLayout.extentX] * 2, liquidModel.height, liquid.pose[poseLayout.extentZ] * 2);
    target.syncState(liquid);
    target.setWordmark(wordmark.current);
    if ("fov" in camera) {
      target.setPixelAngle((2 * Math.tan((camera.fov * Math.PI) / 360)) / (size.height * viewport.dpr));
    }
  });

  return (
    <mesh ref={volume} position={[0, liquidModel.height / 2, 0]} frustumCulled={false}>
      <boxGeometry />
      <liquidMaterial key={tier} ref={material} args={[tier]} />
    </mesh>
  );
}
