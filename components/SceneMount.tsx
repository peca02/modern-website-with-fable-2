"use client";

import dynamic from "next/dynamic";

const Scene = dynamic(() => import("@/scene/Scene").then((module) => module.Scene), { ssr: false });

export function SceneMount() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0">
      <Scene />
    </div>
  );
}
