/**
 * Phase 7 "Full Dynamic Inner Page System" -- seeds the 4 reserved header/intro Pages
 * (PAGE_HEADER_SLUGS in src/lib/page-builder/page-headers.ts) that the Products, Brands, Blog,
 * and Solutions-index routes now render above their existing hardcoded grid/filter/pagination
 * logic (see loadPageHeaderSections()). Each page gets exactly one PAGE_INTRO section whose
 * eyebrow/title/description are copied VERBATIM from the current messages/en.json + ar.json
 * strings those routes already render today -- this is a zero-content-change, zero-visual-change
 * conversion from static i18n text to an admin-editable Page Builder section, not new copy.
 *
 * Idempotent (upsert-and-replace-sections, same pattern as seed-solutions.ts/seed-contact-page.ts)
 * -- safe to re-run.
 *
 * Run: npx tsx scripts/seed-page-headers.ts
 */
import { prisma } from "../src/lib/prisma";
import { defaultSectionSettings } from "../src/lib/page-builder/types";
import { PAGE_HEADER_SLUGS } from "../src/lib/page-builder/page-headers";

interface HeaderSeed {
  key: keyof typeof PAGE_HEADER_SLUGS;
  en: { eyebrow: string; title: string; description?: string };
  ar: { eyebrow: string; title: string; description?: string };
}

const HEADERS: HeaderSeed[] = [
  {
    key: "products",
    en: { eyebrow: "Catalog", title: "Products" },
    ar: { eyebrow: "الكتالوج", title: "المنتجات" },
  },
  {
    key: "brands",
    en: { eyebrow: "Sourcing", title: "Brands we distribute" },
    ar: { eyebrow: "التوريد", title: "العلامات التجارية التي نوزّعها" },
  },
  {
    key: "blog",
    en: { eyebrow: "Insights", title: "Blog" },
    ar: { eyebrow: "رؤى", title: "المدونة" },
  },
  {
    key: "solutionsIndex",
    en: { eyebrow: "Solutions", title: "Built around your industry", description: "Hotels, restaurants, catering, hospitals, wholesale, retail, and foodservice operators each order differently. Choose your industry to see how we work with it." },
    ar: { eyebrow: "الحلول", title: "مبني حول قطاعك", description: "الفنادق والمطاعم وشركات التموين والمستشفيات وتجار الجملة والتجزئة ومشغلو قطاع الأغذية، لكل منهم طريقة طلب مختلفة. اختر قطاعك لترى كيف نعمل معه." },
  },
];

async function main() {
  for (const header of HEADERS) {
    const slug = PAGE_HEADER_SLUGS[header.key];

    const page = await prisma.page.upsert({
      where: { slug },
      update: {},
      create: { slug, status: "DRAFT" },
    });

    await prisma.pageSection.deleteMany({ where: { pageId: page.id } });
    await prisma.pageSection.create({
      data: {
        pageId: page.id,
        type: "PAGE_INTRO",
        order: 0,
        dataEn: { eyebrow: header.en.eyebrow, title: header.en.title, description: header.en.description ?? "" },
        dataAr: { eyebrow: header.ar.eyebrow, title: header.ar.title, description: header.ar.description ?? "" },
        settings: defaultSectionSettings({ background: "paper", desktop: { paddingY: "xl", marginY: "none", align: "left", columns: "1", headingSize: "2xl", bodySize: "md", visible: true } }) as object,
        isVisible: true,
      },
    });

    const freshSections = await prisma.pageSection.findMany({ where: { pageId: page.id }, orderBy: { order: "asc" } });
    const snapshotSections = freshSections.map((s) => ({ id: s.id, type: s.type, order: s.order, dataEn: s.dataEn, dataAr: s.dataAr, settings: s.settings, isVisible: s.isVisible }));

    await prisma.$transaction(async (tx) => {
      await tx.pageRevision.updateMany({ where: { pageId: page.id, isPublished: true }, data: { isPublished: false } });
      await tx.pageRevision.create({
        data: { pageId: page.id, isPublished: true, note: "Phase 7: initial page-header seed (verbatim from existing i18n strings)", snapshot: { sections: snapshotSections } as object },
      });
      await tx.page.update({ where: { id: page.id }, data: { status: "PUBLISHED", publishedAt: new Date() } });
    });

    console.log(`Seeded header "${slug}", published.`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
