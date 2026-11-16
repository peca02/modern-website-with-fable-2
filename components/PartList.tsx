"use client";

import { useRef } from "react";
import { useTicker } from "@/hooks/useTicker";
import { part } from "@/lib/content";
import { store } from "@/lib/store";

// A plain list in the flow. While the chapter is pinned each row moves to the
// height of its droplet in the scene.
export function PartList() {
  const list = useRef<HTMLUListElement>(null);
  const offsets = useRef([0, 0, 0, 0]);
  const resting = useRef(true);

  useTicker(() => {
    const root = list.current;
    if (!root) return;
    const frame = root.offsetParent;
    const following = store.story > 2.7 && store.story < 4.3 && root.closest("[data-pinned]") !== null;
    if (!frame || (!following && resting.current)) return;

    const top = following ? frame.getBoundingClientRect().top : 0;
    const { droplets } = store.anchors;
    let moving = false;
    for (let index = 0; index < root.children.length; index += 1) {
      const item = root.children[index];
      if (!(item instanceof HTMLElement)) continue;
      const present = following && droplets[index * 3 + 2] > 0;
      const target = present ? droplets[index * 3 + 1] - top - (item.offsetTop + item.offsetHeight / 2) : 0;
      let next = offsets.current[index] + (target - offsets.current[index]) * 0.14;
      if (Math.abs(target - next) < 0.05) next = target;
      if (next !== 0) moving = true;
      offsets.current[index] = next;
      item.style.transform = `translate3d(0, ${next.toFixed(1)}px, 0)`;
    }
    resting.current = !moving;
  });

  return (
    <ul
      ref={list}
      className="col-span-3 flex flex-col gap-6 pr-8 md:col-span-6 wide:col-span-3 wide:col-start-6 wide:text-right"
    >
      {part.items.map((item) => (
        <li key={item.name} className="flex flex-col gap-1">
          <h3 className="type-title">{item.name}</h3>
          <p className="text-graphite">{item.line}</p>
        </li>
      ))}
    </ul>
  );
}
