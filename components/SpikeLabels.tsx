"use client";

import { useRef } from "react";
import { useTicker } from "@/hooks/useTicker";
import { crown } from "@/lib/content";
import { store } from "@/lib/store";

const gap = 8;
const lift = 32;
const edge = 12;

// A plain list in the flow. While the chapter is pinned the labels line up
// above the crown, each joined to its own spike tip by a short solid lead, so
// no pill sits on a neighbouring spike.
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
    let top = Infinity;
    for (let index = 0; index < 3; index += 1) {
      if (spikes[index * 3 + 2]) top = Math.min(top, spikes[index * 3 + 1] - origin.top);
    }
    const row = top - lift;
    const items: { item: HTMLElement; lead: HTMLElement; x: number; tip: number; width: number; left: number }[] = [];
    for (let index = 0; index < 3; index += 1) {
      const item = root.children[index];
      const lead = item?.firstElementChild;
      if (!(item instanceof HTMLElement) || !(lead instanceof HTMLElement)) continue;
      const present = spikes[index * 3 + 2];
      const next = opacity.current[index] + (present - opacity.current[index]) * 0.12;
      opacity.current[index] = next;
      item.style.opacity = next.toFixed(3);
      if (!present) continue;
      const x = spikes[index * 3] - origin.left;
      const width = item.offsetWidth;
      items.push({ item, lead, x, tip: spikes[index * 3 + 1] - origin.top, width, left: x - width / 2 });
    }
    items.sort((a, b) => a.x - b.x);

    // Each pill may slide sideways as long as its lead still meets it, and
    // stays on screen. Push right, then left, until neighbours keep a gap.
    const minLeft = edge - origin.left;
    const maxRight = window.innerWidth - edge - origin.left;
    const low = (entry: (typeof items)[number]) => Math.max(entry.x - entry.width + edge, minLeft);
    const high = (entry: (typeof items)[number]) => Math.min(entry.x - edge, maxRight - entry.width);
    for (let pass = 0; pass < 3; pass += 1) {
      for (let index = 1; index < items.length; index += 1) {
        const before = items[index - 1];
        items[index].left = Math.min(Math.max(items[index].left, before.left + before.width + gap), high(items[index]));
      }
      for (let index = items.length - 2; index >= 0; index -= 1) {
        const after = items[index + 1];
        items[index].left = Math.max(Math.min(items[index].left, after.left - gap - items[index].width), low(items[index]));
      }
    }

    // Tips too close for one row: the label that still collides goes a row up.
    let right = -Infinity;
    let raised = 0;
    for (const { item, lead, x, tip, width, left } of items) {
      let bottom = row;
      if (left < right + gap) {
        raised += 1;
        bottom = row - raised * (item.offsetHeight + gap);
      } else {
        right = left + width;
      }
      item.style.transform = `translate3d(${left.toFixed(1)}px, ${bottom.toFixed(1)}px, 0) translateY(-100%)`;
      lead.style.transform = `translate3d(${(x - left).toFixed(1)}px, 0, 0) translateX(-50%)`;
      lead.style.height = `${Math.max(0, tip - bottom).toFixed(1)}px`;
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
          <span
            aria-hidden="true"
            className="absolute top-full left-0 hidden w-1 rounded-b-full bg-ink in-data-pinned:block"
          />
          {label}
        </li>
      ))}
    </ul>
  );
}
