import type { ReactNode } from "react";
import type { ChapterId } from "@/lib/content";

type ChapterProps = {
  id: ChapterId;
  /** viewport heights the chapter stays pinned for when motion is allowed */
  pin?: number;
  className?: string;
  children: ReactNode;
};

// The section spans the whole chapter, pin distance included, so its scroll
// progress covers the pinned sequence. The frame inside is what gets pinned.
export function Chapter({ id, pin, className = "", children }: ChapterProps) {
  return (
    <section id={id} data-chapter={id} data-pin={pin} aria-labelledby={`${id}-heading`}>
      <div className={`page-grid relative min-h-svh pt-24 pb-16 in-data-pinned:h-svh ${className}`}>{children}</div>
    </section>
  );
}
