/**
 * Redesign PHASE 8 -- seeds the Page Builder pages that make the last built-in inner-page content
 * editable: the FAQ page's header (`__header__faq`) and the three legal pages (`privacy`, `terms`,
 * `cookies`). Content is the exact current built-in text (i18n strings + src/lib/legal-content.ts).
 *
 * CREATE-ONLY: a page whose slug already exists is skipped untouched, so re-running never
 * overwrites an editor's changes. Each new page is published (first revision) so the public route
 * switches to it immediately. Uses whatever DATABASE_URL is set.
 *
 * Run: npx tsx scripts/seed-phase8-pages.ts [--dry-run]
 */
import { prisma } from "../src/lib/prisma";
import { defaultSectionSettings } from "../src/lib/page-builder/types";
import { PAGE_HEADER_SLUGS } from "../src/lib/page-builder/page-headers";
import { COOKIE_CONTENT, LEGAL_UPDATED, PRIVACY_CONTENT, TERMS_CONTENT, type LegalSection } from "../src/lib/legal-content";
import en from "../messages/en.json";
import ar from "../messages/ar.json";

const dryRun = process.argv.includes("--dry-run");

const introSettings = () =>
  defaultSectionSettings({ background: "paper", desktop: { paddingY: "xl", marginY: "none", align: "left", columns: "1", headingSize: "2xl", bodySize: "md", visible: true } }) as object;
const bodySettings = () =>
  defaultSectionSettings({ background: "paper", desktop: { paddingY: "md", marginY: "none", align: "left", columns: "1", headingSize: "lg", bodySize: "md", visible: true } }) as object;

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function legalHtml(sections: LegalSection[]): string {
  return sections.map((s) => `<h2>${escapeHtml(s.heading)}</h2><p>${escapeHtml(s.body)}</p>`).join("");
}

interface SectionSeed {
  type: string;
  dataEn: object;
  dataAr: object;
  settings: object;
}
interface PageSeed {
  slug: string;
  titleEn: string;
  titleAr: string;
  sections: SectionSeed[];
}

const PAGES: PageSeed[] = [
  {
    slug: PAGE_HEADER_SLUGS.faq,
    titleEn: en.faq.title,
    titleAr: ar.faq.title,
    sections: [
      {
        type: "PAGE_INTRO",
        dataEn: { eyebrow: en.faq.eyebrow, title: en.faq.title, description: "" },
        dataAr: { eyebrow: ar.faq.eyebrow, title: ar.faq.title, description: "" },
        settings: introSettings(),
      },
    ],
  },
  ...(
    [
      ["privacy", "privacyTitle", PRIVACY_CONTENT],
      ["terms", "termsTitle", TERMS_CONTENT],
      ["cookies", "cookieTitle", COOKIE_CONTENT],
    ] as const
  ).map(([slug, key, content]) => ({
    slug,
    titleEn: en.legal[key],
    titleAr: ar.legal[key],
    sections: [
      {
        type: "PAGE_INTRO",
        dataEn: { eyebrow: "", title: en.legal[key], description: `${en.legal.updated}: ${LEGAL_UPDATED}` },
        dataAr: { eyebrow: "", title: ar.legal[key], description: `${ar.legal.updated}: ${LEGAL_UPDATED}` },
        settings: introSettings(),
      },
      {
        type: "RICH_TEXT",
        dataEn: { html: legalHtml(content.en) },
        dataAr: { html: legalHtml(content.ar) },
        settings: bodySettings(),
      },
    ],
  })),
];

async function main() {
  for (const seed of PAGES) {
    const existing = await prisma.page.findUnique({ where: { slug: seed.slug }, select: { id: true } });
    if (existing) {
      console.log(`skip  ${seed.slug} (already exists)`);
      continue;
    }
    if (dryRun) {
      console.log(`would create + publish ${seed.slug} (${seed.sections.length} sections)`);
      continue;
    }
    await prisma.$transaction(async (tx) => {
      const page = await tx.page.create({ data: { slug: seed.slug, titleEn: seed.titleEn, titleAr: seed.titleAr, status: "DRAFT" } });
      const created = [];
      for (const [order, s] of seed.sections.entries()) {
        created.push(await tx.pageSection.create({ data: { pageId: page.id, type: s.type, order, dataEn: s.dataEn, dataAr: s.dataAr, settings: s.settings, isVisible: true } }));
      }
      const snapshot = { sections: created.map((s) => ({ id: s.id, type: s.type, order: s.order, dataEn: s.dataEn, dataAr: s.dataAr, settings: s.settings, isVisible: s.isVisible })) };
      await tx.pageRevision.create({ data: { pageId: page.id, isPublished: true, note: "PHASE 8: initial seed (verbatim from the built-in content)", snapshot: snapshot as object } });
      await tx.page.update({ where: { id: page.id }, data: { status: "PUBLISHED", publishedAt: new Date() } });
    });
    console.log(`created + published ${seed.slug}`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
