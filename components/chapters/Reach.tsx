import { Chapter } from "@/components/Chapter";
import { ChapterHeading } from "@/components/ChapterHeading";
import { reach } from "@/lib/content";

export function Reach() {
  return (
    <Chapter id={reach.id} className="content-end wide:content-center">
      <div className="col-span-full flex flex-col gap-6 md:col-span-9 wide:col-span-5 wide:col-start-8">
        <ChapterHeading id={reach.id}>{reach.heading}</ChapterHeading>
        {reach.body.map((paragraph) => (
          <p key={paragraph} data-reveal className="max-w-prose text-graphite">
            {paragraph}
          </p>
        ))}
      </div>
    </Chapter>
  );
}
