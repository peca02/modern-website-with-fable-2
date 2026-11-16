import { Chapter } from "@/components/Chapter";
import { site, still } from "@/lib/content";

export function Still() {
  return (
    <Chapter id={still.id} className="content-start gap-y-6">
      <h1 id={`${still.id}-heading`} tabIndex={-1} className="type-hero col-span-full outline-none">
        {site.name}
        <span className="sr-only">: {still.headingSuffix}</span>
      </h1>
      <div className="col-span-full flex flex-col gap-6 md:col-span-7 wide:col-span-5">
        <p data-reveal className="type-lead">
          {still.lead}
        </p>
        <p data-reveal className="max-w-prose text-graphite">
          {still.body}
        </p>
        <p className="type-micro">{still.hint}</p>
      </div>
    </Chapter>
  );
}
