"use client";

import { useRef } from "react";
import { useTicker } from "@/hooks/useTicker";
import { preloader } from "@/lib/content";
import { duration, gsap, useGSAP } from "@/lib/gsap";
import { finishLoading, loadClock, markLoaded, releaseLoad } from "@/lib/loadClock";
import { store } from "@/lib/store";

const follow = 3.2;
const timeoutSeconds = 9;

export function Preloader() {
  const readout = useRef<HTMLSpanElement>(null);
  const shown = useRef(-1);
  const lastTick = useRef(0);

  useGSAP(() => {
    void document.fonts.ready.then(() => markLoaded("fonts"));
    // Wall clock on purpose: GSAP's own time slows down when frames are slow.
    const timeout = window.setTimeout(finishLoading, timeoutSeconds * 1000);
    return () => window.clearTimeout(timeout);
  });

  useTicker(() => {
    if (loadClock.released) return;
    const now = performance.now();
    const step = Math.min((now - (lastTick.current || now)) / 1000, 0.5);
    lastTick.current = now;
    loadClock.mass = store.reducedMotion
      ? loadClock.progress
      : loadClock.mass + (loadClock.progress - loadClock.mass) * (1 - Math.exp(-step * follow));

    // Opened mid-page: the drop is not the subject there, so nothing is centred.
    const elsewhere = store.story > 0.3 || store.reducedMotion;
    if (elsewhere) loadClock.settle = 1;

    const full = loadClock.progress === 1 && loadClock.mass > 0.985;
    if (full) loadClock.mass = 1;

    const percent = Math.round(loadClock.mass * 100);
    if (percent !== shown.current && readout.current) {
      shown.current = percent;
      readout.current.textContent = String(percent);
    }

    if (!full) return;
    releaseLoad();
    // Expo-out: the drop clears the text column before the lines have risen.
    if (!elsewhere) gsap.to(loadClock, { settle: 1, duration: duration.slow });
  });

  return (
    <p
      role="status"
      className="type-micro pointer-events-none fixed inset-x-0 bottom-12 z-30 hidden justify-center gap-2 transition-all duration-500 ease-settle scripting:flex in-data-loaded:invisible in-data-loaded:opacity-0"
    >
      <span>{preloader.label}</span>
      <span aria-hidden className="tabular-nums">
        <span ref={readout}>0</span>
        {preloader.unit}
      </span>
    </p>
  );
}
