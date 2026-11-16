"use client";

import { useRef } from "react";
import { useTicker } from "@/hooks/useTicker";
import { crown } from "@/lib/content";
import { store } from "@/lib/store";

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
    for (let index = 0; index < root.children.length; index += 1) {
      const item = root.children[index];
      if (!(item instanceof HTMLElement)) continue;
      const present = spikes[index * 3 + 2];
      const next = opacity.current[index] + (present - opacity.current[index]) * 0.12;
      opacity.current[index] = next;
      item.style.opacity = next.toFixed(3);
      if (present) {
        const x = spikes[index * 3] - origin.left;
        const y = spikes[index * 3 + 1] - origin.top;
        item.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -160%)`;
      }
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
