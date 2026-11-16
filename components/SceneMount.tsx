"use client";

import dynamic from "next/dynamic";
import { markLoaded } from "@/lib/loadClock";

const Scene = dynamic(
  () =>
    import("@/scene/Scene").then((module) => {
      markLoaded("code");
      return module.Scene;
    }),
  { ssr: false },
);

export function SceneMount() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0">
      <Scene />
    </div>
  );
}
