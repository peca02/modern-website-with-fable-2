"use client";

import { useEffect } from "react";
import { store } from "@/lib/store";

// A press on these is a click, not a hand held over the liquid.
const controls = "a, button, input, label, select, textarea, summary";

export function PointerInput() {
  useEffect(() => {
    const { pointer, viewport } = store;
    let lastTime = performance.now();

    const resize = () => {
      viewport.width = window.innerWidth;
      viewport.height = window.innerHeight;
    };
    const move = (event: PointerEvent) => {
      const x = (event.clientX / viewport.width) * 2 - 1;
      const y = 1 - (event.clientY / viewport.height) * 2;
      const now = performance.now();
      const dt = Math.max((now - lastTime) / 1000, 0.001);
      if (pointer.active) {
        pointer.vx = (x - pointer.x) / dt;
        pointer.vy = (y - pointer.y) / dt;
      }
      lastTime = now;
      pointer.x = x;
      pointer.y = y;
      pointer.active = true;
    };
    const down = (event: PointerEvent) => {
      move(event);
      pointer.down = true;
      pointer.grab = !(event.target instanceof Element && event.target.closest(controls));
    };
    const up = (event: PointerEvent) => {
      pointer.down = false;
      pointer.grab = false;
      if (event.pointerType !== "mouse") pointer.active = false;
    };
    const leave = () => {
      pointer.active = false;
      pointer.down = false;
      pointer.grab = false;
    };

    // The flow checks read the store; only an automated browser gets it.
    if (navigator.webdriver) Object.assign(window, { tarnStore: store });
    resize();
    const options = { passive: true } as const;
    window.addEventListener("resize", resize, options);
    window.addEventListener("pointermove", move, options);
    window.addEventListener("pointerdown", down, options);
    window.addEventListener("pointerup", up, options);
    window.addEventListener("pointercancel", leave, options);
    document.documentElement.addEventListener("pointerleave", leave, options);
    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", leave);
      document.documentElement.removeEventListener("pointerleave", leave);
    };
  }, []);

  return null;
}
