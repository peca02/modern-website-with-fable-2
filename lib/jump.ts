import { ScrollSmoother, ScrollTrigger } from "@/lib/gsap";
import type { ChapterId } from "@/lib/content";

export const chapterTriggerId = (id: string) => `chapter-${id}`;

/**
 * Scrolls to the top of a chapter and moves focus to its heading. Returns
 * false when the scroll triggers do not exist yet, so the caller can let the
 * native anchor jump happen.
 */
export function jumpToChapter(id: ChapterId) {
  const trigger = ScrollTrigger.getById(chapterTriggerId(id));
  if (!trigger) return false;

  // ScrollSmoother fixes its wrapper, so native anchor jumps and
  // scrollIntoView do nothing while it runs.
  const smoother = ScrollSmoother.get();
  if (smoother) smoother.scrollTo(trigger.start, true);
  else window.scrollTo(0, trigger.start);

  document.getElementById(`${id}-heading`)?.focus({ preventScroll: true });
  window.history.replaceState(null, "", `#${id}`);
  return true;
}
