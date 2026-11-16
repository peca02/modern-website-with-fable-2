"use client";

import { useRef } from "react";
import { useTicker } from "@/hooks/useTicker";
import { beats } from "@/lib/beats";
import { hold } from "@/lib/content";
import { duration, gsap } from "@/lib/gsap";
import { store } from "@/lib/store";

const formAt = (story: number) => beats.formSwitch.filter((at) => story >= at).length;

// A plain list in the flow. While the chapter is pinned the three captions
// share one place and trade it as the liquid changes form, rising and
// sinking behind the list's edge like a level.
export function HoldForms() {
  const list = useRef<HTMLUListElement>(null);
  const shown = useRef(-1);

  useTicker(() => {
    const root = list.current;
    if (!root || !root.closest("[data-pinned]")) return;
    const current = formAt(store.story);
    const previous = shown.current;
    if (current === previous) return;
    shown.current = current;

    const items = Array.from(root.children);
    if (previous < 0) {
      items.forEach((item, index) => gsap.set(item, { yPercent: index === current ? 0 : 100, opacity: index === current ? 1 : 0 }));
      return;
    }
    const direction = current > previous ? 1 : -1;
    items.forEach((item, index) => {
      if (index === current) {
        gsap.fromTo(
          item,
          { yPercent: 100 * direction, opacity: 1 },
          { yPercent: 0, duration: duration.base, overwrite: true },
        );
      } else {
        gsap.to(item, { yPercent: -100 * direction, opacity: 0, duration: duration.quick, overwrite: true });
      }
    });
  });

  return (
    <ul ref={list} className="grid gap-6 overflow-clip in-data-pinned:gap-0">
      {hold.forms.map((form) => (
        <li key={form.name} className="flex flex-col gap-1 in-data-pinned:col-start-1 in-data-pinned:row-start-1">
          <h3 className="type-title">{form.name}</h3>
          <p className="text-graphite">{form.line}</p>
        </li>
      ))}
    </ul>
  );
}
