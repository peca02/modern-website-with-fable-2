"use client";

import { useFrame } from "@react-three/fiber";
import { MathUtils, PerspectiveCamera } from "three";
import { loadClock } from "@/lib/loadClock";
import { store } from "@/lib/store";
import { direct, direction, easeFocus } from "@/scene/direction";

let hoveredDroplet = -1;

// The droplet under the pointer, from the anchors the liquid projected last frame.
function dropletUnderPointer() {
  const { droplets } = store.anchors;
  const { pointer, viewport } = store;
  if (!pointer.active || droplets[2] === 0 || droplets[5] === 0) return -1;
  const x = (pointer.x * 0.5 + 0.5) * viewport.width;
  const y = (0.5 - pointer.y * 0.5) * viewport.height;
  // Half the distance between neighbours: the hit areas touch but never overlap.
  const reach = 0.5 * Math.hypot(droplets[3] - droplets[0], droplets[4] - droplets[1]);
  for (let index = 0; index < 4; index += 1) {
    if (droplets[index * 3 + 2] === 0) continue;
    if (Math.hypot(x - droplets[index * 3], y - droplets[index * 3 + 1]) < reach) return index;
  }
  return -1;
}

// Samples the shot list for the current scroll position and owns the camera.
// Mounted first, so the liquid and the grains read a fresh `direction`.
export function Director() {
  useFrame(({ camera, size }, delta) => {
    direct(store.story, store.field);
    store.fieldLevel = direction.field;

    // Write only on change, so a row the list has focused is not cleared every frame.
    const droplet = dropletUnderPointer();
    if (droplet !== hoveredDroplet) {
      if (droplet >= 0) store.partFocus = droplet;
      else if (store.partFocus === hoveredDroplet) store.partFocus = -1;
      hoveredDroplet = droplet;
    }
    easeFocus(store.partFocus, Math.min(delta, 0.1), store.reducedMotion);

    if (!(camera instanceof PerspectiveCamera)) return;

    const { shot } = direction;
    const aspect = size.width / size.height;
    const wide = MathUtils.smoothstep(aspect, 0.75, 1.3);

    // Wide screens size the subject against the height, narrow ones against the width.
    const fill = MathUtils.lerp(shot.tallFill, 0.46, wide);
    const visibleHeight = Math.max(shot.span / fill, shot.span / (shot.narrowFill * aspect));
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
