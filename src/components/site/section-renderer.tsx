import { getBlock } from "@/lib/page-builder/registry";
import { SectionShell } from "@/lib/page-builder/section-shell";
import { normalizeLocaleSettings, type PageRenderContext } from "@/lib/page-builder/types";
import { parseWithRich, stripRich } from "@/lib/text-style/block-rich";
import { areTextStylesEnabled } from "@/lib/text-style/flag";

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
export async function SectionRenderer({ sections, locale, context }: { sections: SectionRow[]; locale: string; context?: PageRenderContext }) {
  const visible = sections.filter((s) => s.isVisible);
  // Text styling off -> every `__rich` map is dropped, so blocks render their plain strings exactly as before.
  const textStyles = await areTextStylesEnabled();

  const rendered = await Promise.all(
    visible.map(async (section) => {
      const block = getBlock(section.type);
      if (!block) {
        console.warn(`[page-builder] unknown section type "${section.type}" on rendered page, skipping`);
        return null;
      }
      const rawData = locale === "ar" ? section.dataAr : section.dataEn;
      const parsed = parseWithRich(block.dataSchema, textStyles ? rawData : stripRich(rawData));
      if (!parsed.success) {
        console.warn(`[page-builder] section ${section.id} (${section.type}) failed schema validation at render time, skipping`);
        return null;
      }
      const data = block.resolveData ? await block.resolveData(parsed.data, locale) : parsed.data;
      if (block.hiddenWhen?.(data, context ?? {})) return null;
      // Each locale renders its own independent style settings (alignment, padding, background,
      // animation, ...) -- never the other locale's, and never a shared blob. See
      // normalizeLocaleSettings in types.ts for why this also safely reads pre-fix rows.
      const settings = normalizeLocaleSettings(section.settings)[locale === "ar" ? "ar" : "en"];
      // Rendered as JSX, not called as a function -- block.Render may be a
      // plain client component (most blocks) or an async Server Component
      // (the commerce blocks doing live Prisma queries); only JSX rendering
      // respects that boundary correctly for both.
      const Render = block.Render;
      return (
        <SectionShell key={section.id} settings={settings} bleed={block.bleedsWhen?.(data) ?? false}>
          <Render data={data} locale={locale} interactive settings={settings} {...(block.usesContext ? { context: context ?? {} } : {})} />
        </SectionShell>
      );
    })
  );

  return <>{rendered}</>;
}
