import { Chapter } from "@/components/Chapter";
import { ChapterHeading } from "@/components/ChapterHeading";
import { ChapterLink } from "@/components/ChapterLink";
import { settle } from "@/lib/content";

export function Settle() {
  return (
    <Chapter id={settle.id} className="content-start gap-y-6">
      <ChapterHeading id={settle.id} className="col-span-full">
        {settle.heading}
      </ChapterHeading>
      <p data-reveal className="type-lead col-span-full text-graphite md:col-span-7 wide:col-span-5">
        {settle.body}
      </p>
      <p className="col-span-full">
        <ChapterLink
          id="still"
          className="type-micro inline-block rounded-full bg-ink px-5 py-3 text-chalk transition-colors duration-200 ease-settle hover:bg-field"
        >
          {settle.restart}
        </ChapterLink>
      </p>
    </Chapter>
  );
}
