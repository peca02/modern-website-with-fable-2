"use client";

import { useRef } from "react";
import { useTicker } from "@/hooks/useTicker";
import { crown } from "@/lib/content";
import { store } from "@/lib/store";

const gap = 6;

// A plain list in the flow. While the chapter is pinned each label rides on a
// spike tip, read from the anchors the scene projects every frame.
export function SpikeLabels() {
  const list = useRef<HTMLUListElement>(null);
  const opacity = useRef([0, 0, 0]);

  useTicker(() => {
    const root = list.current;
    if (!root || store.story < 1.8 || store.story > 3.2) return;
    const frame = root.offsetParent;
    if (!frame || !root.closest("[data-pinned]")) return;

    const origin = frame.getBoundingClientRect();
    const { spikes } = store.anchors;
    const placed: { x: number; y: number; half: number }[] = [];
    // Lowest tip first: it keeps its place and the labels above it step up
    // until no two pills share the same spot.
    const order = [0, 1, 2].sort((a, b) => spikes[b * 3 + 1] - spikes[a * 3 + 1]);
    for (const index of order) {
      const item = root.children[index];
      if (!(item instanceof HTMLElement)) continue;
      const present = spikes[index * 3 + 2];
      const next = opacity.current[index] + (present - opacity.current[index]) * 0.12;
      opacity.current[index] = next;
      item.style.opacity = next.toFixed(3);
      if (!present) continue;
      const x = spikes[index * 3] - origin.left;
      let y = spikes[index * 3 + 1] - origin.top;
      const half = item.offsetWidth / 2;
      const clearance = item.offsetHeight + gap;
      for (const other of placed) {
        if (Math.abs(x - other.x) < half + other.half + gap && y > other.y - clearance) y = other.y - clearance;
      }
      placed.push({ x, y, half });
      item.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -160%)`;
    }
  });

  return (
    <ul
      ref={list}
      aria-label={crown.labelsHeading}
      className="col-span-full mt-6 flex flex-wrap gap-2 in-data-pinned:pointer-events-none in-data-pinned:mt-0"
    >
      {crown.labels.map((label) => (
        <li
          key={label}
          className="type-micro rounded-full bg-ink px-3 py-1 whitespace-nowrap text-chalk in-data-pinned:absolute in-data-pinned:top-0 in-data-pinned:left-0 in-data-pinned:opacity-0"
        >
          {label}
        </li>
      ))}
    </ul>
  );
}
