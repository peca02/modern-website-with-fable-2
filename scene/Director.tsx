"use client";

import { useFrame } from "@react-three/fiber";
import { MathUtils, PerspectiveCamera } from "three";

const target = { x: 0, y: 0.7, z: 0 };
const elevation = MathUtils.degToRad(11);
/** world units the subject spans; used to size it against the viewport */
const subjectWidth = 2;

// Owns the camera. For now it holds the hero frame; the keyframe tracks for
// the other chapters are added on top of this.
export function Director() {
  useFrame(({ camera, size }) => {
    if (!(camera instanceof PerspectiveCamera)) return;
    const aspect = size.width / size.height;
    const wide = MathUtils.smoothstep(aspect, 0.75, 1.3);

    // Wide screens size the subject against the height, narrow ones against the width.
    const visibleHeight = Math.max(subjectWidth / 0.46, subjectWidth / (0.62 * aspect));
    const distance = visibleHeight / (2 * Math.tan(MathUtils.degToRad(camera.fov) / 2));
    camera.position.set(
      target.x,
      target.y + Math.sin(elevation) * distance,
      target.z + Math.cos(elevation) * distance,
    );
    camera.lookAt(target.x, target.y, target.z);

    // Lens shift instead of turning the camera: the subject moves off-centre
    // without the stretch an off-axis sphere gets under perspective.
    const shiftX = 0.2 * wide;
    const shiftY = MathUtils.lerp(0.2, 0.15, wide);
    camera.setViewOffset(size.width, size.height, -shiftX * size.width, -shiftY * size.height, size.width, size.height);
  });

  return null;
}
