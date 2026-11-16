import { chapters, site } from "@/lib/content";

// Placeholder DOM for phases 1–2; phase 3 replaces it with the real chapters.
export default function Page() {
  return (
    <main>
      {chapters.map((chapter, index) => (
        <section
          key={chapter.id}
          id={chapter.id}
          data-chapter={chapter.id}
          className="page-grid min-h-svh content-start gap-y-6 py-24"
        >
          {index === 0 ? (
            <h1 className="type-hero col-span-full">{site.name}</h1>
          ) : (
            <h2 className="type-display col-span-full">{chapter.name}</h2>
          )}
          <p className="type-lead col-span-full text-graphite text-shadow-halo md:col-span-5">
            {chapter.line}
          </p>
        </section>
      ))}
    </main>
  );
}
