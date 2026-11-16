"use client";

import { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
import { lowerTier, pickInitialTier, qualitySettings, type QualityTier } from "@/lib/quality";
import { store } from "@/lib/store";
import { Director } from "@/scene/Director";
import { Liquid } from "@/scene/liquid/Liquid";

function initialTier(): QualityTier {
  const tier = pickInitialTier();
  store.quality = tier;
  return tier;
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
      onCreated={() => {
        document.documentElement.dataset.scene = "ready";
      }}
    >
      <PerformanceMonitor onDecline={decline} />
      <Director />
      <Liquid tier={tier} />
    </Canvas>
  );
}
