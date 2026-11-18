"use client";

import Link from "next/link";
import type { MouseEvent, ReactNode } from "react";
import type { ChapterId } from "@/lib/content";
import { jumpToChapter } from "@/lib/jump";

type ChapterLinkProps = { id: ChapterId; className?: string; children: ReactNode };

export function ChapterLink({ id, className, children }: ChapterLinkProps) {
  const jump = (event: MouseEvent<HTMLAnchorElement>) => {
    if (jumpToChapter(id)) event.preventDefault();
  };

  return (
    <Link href={`#${id}`} data-chapter-link={id} className={className} onClick={jump}>
      {children}
    </Link>
  );
}
