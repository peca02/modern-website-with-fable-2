"use client";

import { useRef, useState } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { store } from "@/lib/store";

type Shape = { left: number; top: number; width: number; height: number };

const finePointer = "(hover: hover) and (pointer: fine)";
const interactive = "a, button, input";
const follow = 14;
const size = { rest: 1, over: 2.6, pressed: 0.7 };

// A drop of the liquid trails the pointer (the native cursor stays). Inside
// the band at the top it shares a goo filter with copies of the fixed
// controls, so it joins them with a meniscus.
export function DropletCursor() {
  const [shapes, setShapes] = useState<Shape[]>([]);
  const plain = useRef<HTMLDivElement>(null);
  const merged = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add(finePointer, () => {
      const drops = [plain.current, merged.current];
      const sources = gsap.utils.toArray<HTMLElement>("[data-goo]");
      const measure = () =>
        setShapes(
          sources.map((source) => {
            const { left, top, width, height } = source.getBoundingClientRect();
            return { left, top, width, height };
          }),
        );
      const observer = new ResizeObserver(measure);
      sources.forEach((source) => observer.observe(source));
      window.addEventListener("resize", measure, { passive: true });

      let over = false;
      const hover = (event: PointerEvent) => {
        over = event.target instanceof Element && event.target.closest(interactive) !== null;
      };
      document.addEventListener("pointerover", hover, { passive: true });

      let x = 0;
      let y = 0;
      let scale = 0;
      let placed = false;
      const move = () => {
        const { pointer, viewport } = store;
        const goalX = (pointer.x * 0.5 + 0.5) * viewport.width;
        const goalY = (0.5 - pointer.y * 0.5) * viewport.height;
        const step = Math.min(gsap.ticker.deltaRatio() / 60, 0.1);
        const ease = store.reducedMotion || !placed ? 1 : 1 - Math.exp(-step * follow);
        const dx = (goalX - x) * ease;
        const dy = (goalY - y) * ease;
        if (pointer.active) {
          x += dx;
          y += dy;
          placed = true;
        }
        const goalScale = !pointer.active ? 0 : pointer.down ? size.pressed : over ? size.over : size.rest;
        scale += (goalScale - scale) * (1 - Math.exp(-step * follow));
        // It stretches along its path and thins across it, keeping its volume.
        const stretch = store.reducedMotion ? 0 : Math.min(Math.hypot(dx, dy) / step / 1600, 0.9);
        gsap.set(drops, {
          x,
          y,
          rotation: `${Math.atan2(dy, dx)}rad`,
          scaleX: scale * (1 + stretch),
          scaleY: scale / (1 + stretch * 0.6),
        });
      };
      gsap.ticker.add(move);

      return () => {
        observer.disconnect();
        window.removeEventListener("resize", measure);
        document.removeEventListener("pointerover", hover);
        gsap.ticker.remove(move);
        gsap.set(drops, { scale: 0 });
      };
    });
  });

  const drop = "absolute top-0 left-0 -mt-2 -ml-2 size-4 scale-0 rounded-full bg-ink";

  return (
    <div aria-hidden data-await-load="" className="pointer-events-none fixed inset-0 z-15 hidden fine:block">
      <svg className="absolute size-0">
        <filter id="goo">
          <feGaussianBlur in="SourceGraphic" stdDeviation="7" />
          <feColorMatrix values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 24 -10" />
        </filter>
      </svg>
      <div className="goo absolute inset-x-0 top-0 h-40 overflow-hidden">
        {shapes.map((shape, index) => (
          <div key={index} className="absolute rounded-full bg-ink" style={shape} />
        ))}
        <div ref={merged} className={drop} />
      </div>
      <div ref={plain} className={drop} />
    </div>
  );
}
