import type { ReactNode } from "react";
import type { ChapterId } from "@/lib/content";

type ChapterHeadingProps = { id: ChapterId; reveal?: boolean; className?: string; children: ReactNode };

// Focus lands here after a jump from the navigation, hence the tabIndex.
export function ChapterHeading({ id, reveal = true, className = "", children }: ChapterHeadingProps) {
  return (
    <h2
      id={`${id}-heading`}
      tabIndex={-1}
      data-reveal={reveal ? "" : undefined}
      className={`type-display outline-none ${className}`}
    >
      {children}
    </h2>
  );
}
