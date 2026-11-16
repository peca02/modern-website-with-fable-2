import { Chapter } from "@/components/Chapter";
import { ChapterHeading } from "@/components/ChapterHeading";
import { PartList } from "@/components/PartList";
import { beats } from "@/lib/beats";
import { part } from "@/lib/content";

export function Part() {
  return (
    <Chapter id={part.id} pin={beats.pins.part} className="content-start gap-y-10 wide:content-center">
      <div className="col-span-full flex flex-col gap-6 md:col-span-8 wide:col-span-5">
        <ChapterHeading id={part.id}>{part.heading}</ChapterHeading>
        <p data-reveal className="max-w-prose text-graphite">
          {part.body}
        </p>
      </div>
      <PartList />
    </Chapter>
  );
}
