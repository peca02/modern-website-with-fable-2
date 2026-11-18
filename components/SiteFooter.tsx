import { credit, footer } from "@/lib/content";

export function SiteFooter() {
  return (
    <footer className="type-micro relative flex flex-wrap justify-between gap-x-6 gap-y-1 bg-ink px-4 py-5 text-chalk md:px-8">
      <p>{footer.note}</p>
      <p>
        {credit.label}:{" "}
        <a href={credit.href} className="underline underline-offset-4 hover:text-mineral">
          {credit.name}
        </a>
      </p>
    </footer>
  );
}
