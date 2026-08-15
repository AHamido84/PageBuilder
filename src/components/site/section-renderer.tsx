import { getBlock } from "@/lib/page-builder/registry";
import { SectionShell } from "@/lib/page-builder/section-shell";
import type { BuilderSection } from "@/lib/page-builder/types";

export interface SectionRow {
  id: string;
  type: string;
  dataEn: unknown;
  dataAr: unknown;
  settings: unknown;
  isVisible: boolean;
}

/**
 * Registry-driven public renderer -- every section's markup comes from
 * BLOCK_REGISTRY, not a hardcoded switch. Sections with an unknown/removed
 * type render nothing (with a server warning) instead of crashing the page.
 * Async because a block may declare `resolveData` (e.g. Hero resolving
 * Media ids to real URLs) that needs a Prisma round-trip before its
 * otherwise-sync Render ever mounts.
 */
export async function SectionRenderer({ sections, locale }: { sections: SectionRow[]; locale: string }) {
  const visible = sections.filter((s) => s.isVisible);

  const rendered = await Promise.all(
    visible.map(async (section) => {
      const block = getBlock(section.type);
      if (!block) {
        console.warn(`[page-builder] unknown section type "${section.type}" on rendered page, skipping`);
        return null;
      }
      const rawData = locale === "ar" ? section.dataAr : section.dataEn;
      const parsed = block.dataSchema.safeParse(rawData);
      if (!parsed.success) {
        console.warn(`[page-builder] section ${section.id} (${section.type}) failed schema validation at render time, skipping`);
        return null;
      }
      const data = block.resolveData ? await block.resolveData(parsed.data, locale) : parsed.data;
      const settings = (section.settings ?? {}) as BuilderSection["settings"];
      // Rendered as JSX, not called as a function -- block.Render may be a
      // plain client component (most blocks) or an async Server Component
      // (the commerce blocks doing live Prisma queries); only JSX rendering
      // respects that boundary correctly for both.
      const Render = block.Render;
      return (
        <SectionShell key={section.id} settings={settings}>
          <Render data={data} locale={locale} interactive settings={settings} />
        </SectionShell>
      );
    })
  );

  return <>{rendered}</>;
}
