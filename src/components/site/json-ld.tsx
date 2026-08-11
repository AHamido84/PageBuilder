import { jsonLdScript } from "@/lib/seo/structured-data";

/** Renders one or more JSON-LD blocks. `data` may be a single schema object or an array. */
export function JsonLd({ data }: { data: unknown | unknown[] }) {
  const items = Array.isArray(data) ? data : [data];
  return (
    <>
      {items.map((item, index) => (
        <script key={index} type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(item) }} />
      ))}
    </>
  );
}
