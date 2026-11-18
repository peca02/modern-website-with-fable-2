"use client";

import { useRef, type PointerEvent } from "react";
import { gsap } from "@/lib/gsap";
import { useTicker } from "@/hooks/useTicker";
import { part } from "@/lib/content";
import { store } from "@/lib/store";

const focusRate = 0.12;

// A plain list in the flow. While the chapter is pinned each row moves to the
// height of its droplet in the scene. Rows and droplets share one focus: hover
// or tap a row and its droplet swells; point at a droplet and its row answers.
export function PartList() {
  const list = useRef<HTMLUListElement>(null);
  const offsets = useRef([0, 0, 0, 0]);
  const focus = useRef([0, 0, 0, 0]);
  const resting = useRef(true);

  useTicker(() => {
    const root = list.current;
    if (!root) return;
    const frame = root.offsetParent;
    const { droplets } = store.anchors;
    const apart = droplets[2] > 0;
    if (!apart && store.partFocus >= 0) store.partFocus = -1;
    const following = store.story > 2.7 && store.story < 4.3 && root.closest("[data-pinned]") !== null;
    if (!frame || (!following && !apart && resting.current)) return;

    const top = following ? frame.getBoundingClientRect().top : 0;
    const ease = Math.min(focusRate * gsap.ticker.deltaRatio(60), 1);
    let moving = false;
    for (let index = 0; index < root.children.length; index += 1) {
      const item = root.children[index];
      if (!(item instanceof HTMLElement)) continue;
      const present = following && droplets[index * 3 + 2] > 0;
      const target = present ? droplets[index * 3 + 1] - top - (item.offsetTop + item.offsetHeight / 2) : 0;
      let next = offsets.current[index] + (target - offsets.current[index]) * 0.14;
      if (Math.abs(target - next) < 0.05) next = target;
      offsets.current[index] = next;
      item.style.transform = `translate3d(0, ${next.toFixed(1)}px, 0)`;

      const goal = apart && store.partFocus === index ? 1 : 0;
      let level = focus.current[index] + (goal - focus.current[index]) * (store.reducedMotion ? 1 : ease);
      if (Math.abs(goal - level) < 0.002) level = goal;
      focus.current[index] = level;
      item.style.setProperty("--focus", level.toFixed(3));
      if (next !== 0 || level !== 0) moving = true;
    }
    resting.current = !moving;
  });

  // A touch fires enter and leave around every tap, so only a mouse or pen hovers; a tap focuses until the next one.
  const enter = (index: number) => (event: PointerEvent) => {
    if (event.pointerType !== "touch") store.partFocus = index;
  };
  const leave = (index: number) => (event: PointerEvent) => {
    if (event.pointerType !== "touch" && store.partFocus === index) store.partFocus = -1;
  };
  const tap = (index: number) => () => {
    store.partFocus = index;
  };

  return (
    <ul
      ref={list}
      className="col-span-3 flex flex-col gap-6 pr-8 md:col-span-6 wide:col-span-3 wide:col-start-6 wide:text-right"
    >
      {part.items.map((item, index) => (
        <li
          key={item.name}
          className="flex flex-col gap-1"
          onPointerEnter={enter(index)}
          onPointerLeave={leave(index)}
          onClick={tap(index)}
        >
          <h3 className="type-title focus-mix">{item.name}</h3>
          <p className="text-graphite">{item.line}</p>
        </li>
      ))}
    </ul>
  );
}
