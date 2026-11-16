"use client";

import type { ReactNode } from "react";
import { duration, gsap, motionQueries, ScrollSmoother, ScrollTrigger, SplitText, useGSAP } from "@/lib/gsap";
import { chapterTriggerId } from "@/lib/jump";
import { whenReleased } from "@/lib/loadClock";
import { store } from "@/lib/store";

export function SmoothScroll({ children }: { children: ReactNode }) {
  useGSAP(() => {
    const mm = gsap.matchMedia();

    mm.add(motionQueries, (context) => {
      const reduced = Boolean(context.conditions?.reduced);
      store.reducedMotion = reduced;
      document.documentElement.dataset.motion = reduced ? "reduced" : "full";

      const pinned = reduced ? [] : gsap.utils.toArray<HTMLElement>("[data-pin]");
      let alive = true;

      if (!reduced) {
        ScrollSmoother.create({
          wrapper: "#smooth-wrapper",
          content: "#smooth-content",
          smooth: 1.1,
        });

        // The attribute turns a chapter's flow layout into a one-screen frame
        // (`in-data-pinned:` utilities); the frame inside it is what stays put.
        pinned.forEach((chapter) => {
          chapter.dataset.pinned = "";
          ScrollTrigger.create({
            trigger: chapter.firstElementChild,
            pin: true,
            start: "top top",
            end: () => `+=${Number(chapter.dataset.pin) * window.innerHeight}`,
          });
        });

        // Lines rise out of a mask like a liquid level. Splitting waits for
        // the fonts so the line breaks are the real ones, and for the
        // preloader so the first screen rises as the drop takes its place.
        void Promise.all([document.fonts.ready, whenReleased()]).then(() => {
          if (!alive) return;
          context.add(() => {
            gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((element) => {
              SplitText.create(element, {
                type: "lines",
                mask: "lines",
                autoSplit: true,
                onSplit: (split) =>
                  gsap.from(split.lines, {
                    yPercent: 105,
                    duration: duration.slow,
                    stagger: 0.08,
                    scrollTrigger: { trigger: element, start: "top 88%", once: true },
                  }),
              });
            });
          });
        });
      }

      // Created after the pins, so every chapter is measured with its pin distance included.
      const page = ScrollTrigger.create({ start: 0, end: "max" });
      const chapterTriggers = gsap.utils.toArray<HTMLElement>("[data-chapter]").map((element) =>
        ScrollTrigger.create({
          id: chapterTriggerId(element.dataset.chapter ?? ""),
          trigger: element,
          start: "top top",
          end: "bottom top",
        }),
      );

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

      return () => {
        alive = false;
        gsap.ticker.remove(readScroll);
        pinned.forEach((chapter) => delete chapter.dataset.pinned);
      };
    });
  });

  return (
    <div id="smooth-wrapper" data-await-load="" className="relative z-10">
      <div id="smooth-content">{children}</div>
    </div>
  );
}
