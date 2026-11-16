"use client";

import { useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
import { markLoaded } from "@/lib/loadClock";
import { lowerTier, pickInitialTier, qualitySettings, type QualityTier } from "@/lib/quality";
import { store } from "@/lib/store";
import { Director } from "@/scene/Director";
import { Grains } from "@/scene/grains/Grains";
import { Liquid } from "@/scene/liquid/Liquid";

function initialTier(): QualityTier {
  const tier = pickInitialTier();
  store.quality = tier;
  return tier;
}

// Runs after the scene's own frame callbacks, so by its second call a whole frame has been drawn.
function FirstFrame() {
  const frames = useRef(0);
  useFrame(() => {
    frames.current += 1;
    if (frames.current === 2) markLoaded("frame");
  });
  return null;
}

export function Scene() {
  const [tier, setTier] = useState(initialTier);
  const settings = qualitySettings[tier];

  const decline = () => {
    const next = lowerTier(tier);
    store.quality = next;
    setTier(next);
  };

  return (
    <Canvas
      dpr={[1, settings.maxDpr]}
      gl={{ alpha: true, antialias: tier >= 2, powerPreference: "high-performance" }}
      camera={{ fov: 30, position: [0, 0, 8], near: 0.1, far: 50 }}
      onCreated={({ gl, scene, camera }) => {
        markLoaded("context");
        gl.compile(scene, camera);
        markLoaded("shaders");
        document.documentElement.dataset.scene = "ready";
      }}
    >
      <PerformanceMonitor onDecline={decline} />
      <FirstFrame />
      <Director />
      <Grains key={tier} tier={tier} />
      <Liquid tier={tier} />
    </Canvas>
  );
}
