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
/** Blocks whose title can be the page's H1 (hero types, the products catalog, and the quote block when it opens a page). */
const TITLE_SECTION_TYPES = new Set(["HERO", "G7_HERO", "G7_QUOTE", "PRODUCTS_CATALOG"]);

/** Blocks that always own the page's H1 themselves -- when present, no title section is promoted. */
function ownsPageH1(section: SectionRow, locale: string): boolean {
  if (section.type === "PRODUCT_DETAILS") return true;
  if (section.type !== "PAGE_INTRO" && section.type !== "HEADING") return false;
  const data = (locale === "ar" ? section.dataAr : section.dataEn) as { headingLevel?: string; level?: string } | null;
  const level = data?.headingLevel ?? data?.level ?? (section.type === "PAGE_INTRO" ? "h1" : undefined);
  return level === "h1";
}

export async function SectionRenderer({ sections, locale, context }: { sections: SectionRow[]; locale: string; context?: PageRenderContext }) {
  const visible = sections.filter((s) => s.isVisible);
  // Exactly one H1 per page: the first title section gets it, later hero/quote sections render H2.
  const titleSectionId = visible.some((s) => ownsPageH1(s, locale)) ? null : visible.find((s) => TITLE_SECTION_TYPES.has(s.type))?.id ?? null;
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
          <Render
            data={data}
            locale={locale}
            interactive
            settings={settings}
            {...(TITLE_SECTION_TYPES.has(section.type) ? { pageHeading: section.id === titleSectionId ? ("h1" as const) : ("h2" as const) } : {})}
            {...(block.usesContext ? { context: context ?? {} } : {})}
          />
        </SectionShell>
      );
    })
  );

  return <>{rendered}</>;
}
