"use client";

import type { ReactNode } from "react";
import { gsap, motionQueries, ScrollSmoother, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { store } from "@/lib/store";

export function SmoothScroll({ children }: { children: ReactNode }) {
  useGSAP(() => {
    const mm = gsap.matchMedia();

    mm.add(motionQueries, (context) => {
      const reduced = Boolean(context.conditions?.reduced);
      store.reducedMotion = reduced;
      document.documentElement.dataset.motion = reduced ? "reduced" : "full";

      if (!reduced) {
        ScrollSmoother.create({
          wrapper: "#smooth-wrapper",
          content: "#smooth-content",
          smooth: 1.1,
        });
      }

      const page = ScrollTrigger.create({ start: 0, end: "max" });
      const chapterTriggers = gsap.utils
        .toArray<HTMLElement>("[data-chapter]")
        .map((element) => ScrollTrigger.create({ trigger: element, start: "top top", end: "bottom top" }));

      let lastScroll = page.scroll();
      const readScroll = (_time: number, deltaMs: number) => {
        const scroll = page.scroll();
        const viewportHeight = window.innerHeight || 1;
        const instant = (scroll - lastScroll) / viewportHeight / Math.max(deltaMs / 1000, 0.001);
        lastScroll = scroll;
        store.scroll.velocity += (instant - store.scroll.velocity) * 0.2;
        store.scroll.progress = page.progress;

        let story = 0;
        chapterTriggers.forEach((trigger, index) => {
          if (trigger.progress > 0) story = index + trigger.progress;
        });
        store.story = story;
      };
      gsap.ticker.add(readScroll);

      return () => gsap.ticker.remove(readScroll);
    });
  });

  return (
    <div id="smooth-wrapper" className="relative z-10">
      <div id="smooth-content">{children}</div>
    </div>
  );
}
