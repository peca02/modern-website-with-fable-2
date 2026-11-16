"use client";

import { useFrame } from "@react-three/fiber";
import { MathUtils, PerspectiveCamera } from "three";
import { loadClock } from "@/lib/loadClock";
import { store } from "@/lib/store";
import { direct, direction } from "@/scene/direction";

// Samples the shot list for the current scroll position and owns the camera.
// Mounted first, so the liquid and the grains read a fresh `direction`.
export function Director() {
  useFrame(({ camera, size }) => {
    direct(store.story, store.field);
    store.fieldLevel = direction.field;
    if (!(camera instanceof PerspectiveCamera)) return;

    const { shot } = direction;
    const aspect = size.width / size.height;
    const wide = MathUtils.smoothstep(aspect, 0.75, 1.3);

    // Wide screens size the subject against the height, narrow ones against the width.
    const fill = MathUtils.lerp(shot.tallFill, 0.46, wide);
    const visibleHeight = Math.max(shot.span / fill, shot.span / (0.62 * aspect));
    const distance = visibleHeight / (2 * Math.tan(MathUtils.degToRad(camera.fov) / 2));
    const elevation = MathUtils.degToRad(shot.elevation);
    camera.position.set(0, shot.targetY + Math.sin(elevation) * distance, Math.cos(elevation) * distance);
    camera.lookAt(0, shot.targetY, 0);
    // Projections made later this frame (pointer ray, DOM anchors) need the new pose now.
    camera.updateMatrixWorld();

    // Lens shift instead of turning the camera: the subject moves off-centre
    // without the stretch an off-axis sphere gets under perspective.
    // As the preloader the drop sits in the middle; it glides to its place on release.
    const shiftX = MathUtils.lerp(shot.tallX, shot.wideX, wide) * loadClock.settle;
    const shiftY = MathUtils.lerp(shot.tallY, shot.wideY, wide) * loadClock.settle;
    camera.setViewOffset(size.width, size.height, -shiftX * size.width, -shiftY * size.height, size.width, size.height);
  });

  return null;
}
