"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Mesh } from "three";
import { palette } from "@/lib/palette";
import { store } from "@/lib/store";

// Phase 1 stand-in that proves the store → scene path. Phase 2 replaces it with the raymarched liquid.
export function PlaceholderDrop() {
  const mesh = useRef<Mesh>(null);

  useFrame((state, delta) => {
    const drop = mesh.current;
    if (!drop) return;
    const portrait = state.viewport.aspect < 1;
    const side = Math.floor(store.story) % 2 === 0 ? 1 : -1;
    const targetX = (portrait ? 0 : state.viewport.width * 0.22 * side) + (store.pointer.active ? store.pointer.x * 0.3 : 0);
    const targetY = (portrait ? -state.viewport.height * 0.2 : -0.3) + (store.pointer.active ? store.pointer.y * 0.3 : 0);
    const ease = 1 - Math.exp(-delta * 4);
    drop.position.x += (targetX - drop.position.x) * ease;
    drop.position.y += (targetY - drop.position.y) * ease;
    const stretch = 1 + Math.min(Math.abs(store.scroll.velocity), 2) * 0.15;
    drop.scale.set(1 / Math.sqrt(stretch), stretch, 1 / Math.sqrt(stretch));
  });

  return (
    <mesh ref={mesh}>
      <sphereGeometry args={[1, 64, 48]} />
      <meshBasicMaterial color={palette.ink} />
    </mesh>
  );
}
