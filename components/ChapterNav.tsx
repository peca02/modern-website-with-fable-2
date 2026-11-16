"use client";

import { useRef } from "react";
import { ChapterLink } from "@/components/ChapterLink";
import { useTicker } from "@/hooks/useTicker";
import { navigation } from "@/lib/content";
import { ScrollTrigger } from "@/lib/gsap";
import { chapterTriggerId } from "@/lib/jump";

export function ChapterNav() {
  const list = useRef<HTMLUListElement>(null);
  const active = useRef(-1);

  useTicker(() => {
    // A chapter becomes current once its top has passed the middle of the viewport.
    let current = 0;
    navigation.items.forEach((item, index) => {
      const trigger = ScrollTrigger.getById(chapterTriggerId(item.id));
      if (trigger && trigger.scroll() + window.innerHeight * 0.5 >= trigger.start) current = index;
    });
    if (current === active.current) return;
    active.current = current;
    list.current?.querySelectorAll("a").forEach((link, index) => {
      if (index === current) link.setAttribute("aria-current", "true");
      else link.removeAttribute("aria-current");
    });
  });

  return (
    <nav
      aria-label={navigation.label}
      className="pointer-events-none fixed inset-x-4 top-4 z-20 flex justify-center md:inset-x-8 md:top-6 md:justify-end"
    >
      <ul ref={list} className="pointer-events-auto flex gap-1 rounded-full bg-ink p-1">
        {navigation.items.map((item) => (
          <li key={item.id}>
            <ChapterLink
              id={item.id}
              className="type-micro block rounded-full px-2.5 py-2.5 text-chalk transition-colors duration-200 ease-settle hover:text-mineral aria-[current]:bg-field aria-[current]:hover:text-chalk md:px-4"
            >
              {item.name}
            </ChapterLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
