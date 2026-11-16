import { Chapter } from "@/components/Chapter";
import { ChapterHeading } from "@/components/ChapterHeading";
import { FieldInstrument } from "@/components/FieldInstrument";
import { SpikeLabels } from "@/components/SpikeLabels";
import { beats } from "@/lib/beats";
import { crown } from "@/lib/content";

export function Crown() {
  return (
    <Chapter id={crown.id} pin={beats.pins.crown} className="content-end wide:content-center">
      <div className="col-span-full flex flex-col gap-6 md:col-span-8 wide:col-span-5">
        <ChapterHeading id={crown.id} reveal={false} className="type-mass">
          {crown.heading}
        </ChapterHeading>
        <p data-reveal className="max-w-prose text-graphite">
          {crown.body}
        </p>
        <FieldInstrument />
      </div>
      <SpikeLabels />
    </Chapter>
  );
}
