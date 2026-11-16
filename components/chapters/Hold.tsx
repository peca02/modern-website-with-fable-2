import { Chapter } from "@/components/Chapter";
import { ChapterHeading } from "@/components/ChapterHeading";
import { HoldForms } from "@/components/HoldForms";
import { beats } from "@/lib/beats";
import { hold } from "@/lib/content";

export function Hold() {
  return (
    <Chapter id={hold.id} pin={beats.pins.hold} className="content-between gap-y-10">
      <ChapterHeading id={hold.id} className="col-span-full wide:col-span-10">
        {hold.heading}
      </ChapterHeading>
      <div className="col-span-full flex flex-col gap-6 md:col-span-6 wide:col-span-3">
        <p data-reveal className="text-graphite">
          {hold.body}
        </p>
        <HoldForms />
      </div>
    </Chapter>
  );
}
