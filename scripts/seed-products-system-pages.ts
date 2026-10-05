/**
 * Creates the two system pages of feat/products-page-builder (src/lib/page-builder/system-pages.ts):
 *   «المنتجات / Products»          slug "products"            -> /[locale]/products
 *   «قالب صفحة المنتج»             slug "__template__product" -> every /[locale]/products/[slug]
 * Seeded to look exactly like today's built-in pages (the catalog block's defaults reproduce the
 * /products header and grid; the template = product details + the homepage's quote form, with this
 * product preselected + related products), published, and marked isSystem. Nothing shows on the
 * site until the switch is on (Admin -> Settings -> «صفحات المنتجات»).
 *
 *   npx tsx scripts/seed-products-system-pages.ts            # dry run
 *   npx tsx scripts/seed-products-system-pages.ts --apply    # create/publish (keeps existing sections)
 *   ... --apply --force                                      # replace existing sections too
 *
 * Needs migration 20261005120000_products_page_builder.
 */
import { PrismaClient, type Prisma } from "@prisma/client";
import { getBlock } from "../src/lib/page-builder/registry";
import { HOMEPAGE_SLUG } from "../src/lib/page-builder/homepage";
import { PRODUCT_TEMPLATE_SLUG, PRODUCTS_PAGE_SLUG } from "../src/lib/page-builder/system-pages";
import en from "../messages/en.json";
import ar from "../messages/ar.json";

const prisma = new PrismaClient();
const apply = process.argv.includes("--apply");
const force = process.argv.includes("--force");

interface Seed {
  type: string;
  dataEn: unknown;
  dataAr: unknown;
  settings?: unknown;
}

function fromDefaults(type: string, patch: { en?: object; ar?: object } = {}): Seed {
  const block = getBlock(type);
  if (!block) throw new Error(`Unknown block ${type}`);
  return {
    type,
    dataEn: { ...structuredClone(block.defaultData.en), ...patch.en },
    dataAr: { ...structuredClone(block.defaultData.ar), ...patch.ar },
    settings: { en: structuredClone(block.defaultSettings), ar: structuredClone(block.defaultSettings) },
  };
}

async function homepageQuote(): Promise<Seed> {
  const home = await prisma.page.findUnique({ where: { slug: HOMEPAGE_SLUG }, select: { id: true } });
  const rev = home ? await prisma.pageRevision.findFirst({ where: { pageId: home.id, isPublished: true }, select: { snapshot: true } }) : null;
  const sections = (rev?.snapshot as { sections?: { type: string; dataEn: unknown; dataAr: unknown; settings: unknown; isVisible: boolean }[] } | null)?.sections ?? [];
  const quote = sections.find((s) => s.type === "G7_QUOTE" && s.isVisible);
  if (quote) return { type: "G7_QUOTE", dataEn: quote.dataEn, dataAr: quote.dataAr, settings: quote.settings };
  console.log("  (no published homepage quote form -- using the block defaults)");
  return fromDefaults("G7_QUOTE");
}

async function seedPage(slug: string, titles: { titleEn: string; titleAr: string }, seeds: Seed[]) {
  for (const s of seeds) {
    const block = getBlock(s.type)!;
    for (const d of [s.dataEn, s.dataAr]) if (!block.dataSchema.safeParse(d).success) throw new Error(`${slug}: ${s.type} seed data does not validate`);
  }
  const existing = await prisma.page.findUnique({ where: { slug }, select: { id: true, status: true, _count: { select: { sections: true } } } });
  const keep = existing && existing._count.sections > 0 && !force;
  console.log(`${slug}: ${existing ? `exists (${existing.status}, ${existing._count.sections} sections)` : "new"} -> ${keep ? "mark system, keep sections" : `${seeds.map((s) => s.type).join(" + ")}, publish`}`);
  if (!apply) return;

  const page = await prisma.page.upsert({ where: { slug }, update: { isSystem: true }, create: { slug, status: "DRAFT", isSystem: true, ...titles }, select: { id: true } });
  if (keep) return;
  await prisma.$transaction(
    async (tx) => {
      await tx.pageSection.deleteMany({ where: { pageId: page.id } });
      await tx.pageSection.createMany({
        data: seeds.map((s, order) => ({
          pageId: page.id,
          type: s.type,
          order,
          dataEn: s.dataEn as Prisma.InputJsonValue,
          dataAr: s.dataAr as Prisma.InputJsonValue,
          settings: (s.settings ?? {}) as Prisma.InputJsonValue,
          isVisible: true,
        })),
      });
      const fresh = await tx.pageSection.findMany({ where: { pageId: page.id }, orderBy: { order: "asc" } });
      const snapshot = fresh.map((s) => ({ id: s.id, type: s.type, order: s.order, dataEn: s.dataEn, dataAr: s.dataAr, settings: s.settings, isVisible: s.isVisible }));
      await tx.pageRevision.updateMany({ where: { pageId: page.id, isPublished: true }, data: { isPublished: false } });
      await tx.pageRevision.create({ data: { pageId: page.id, isPublished: true, note: "System page seed (matches the built-in page)", snapshot: { sections: snapshot } as unknown as Prisma.InputJsonValue } });
      await tx.page.update({ where: { id: page.id }, data: { status: "PUBLISHED", publishedAt: new Date(), ...titles } });
    },
    { timeout: 20000 }
  );
}

async function main() {
  console.log(apply ? "APPLY" : "DRY RUN (use --apply)");

  // /products: exactly today's header (the products.eyebrow/title translations) + grid.
  await seedPage(PRODUCTS_PAGE_SLUG, { titleEn: en.products.title, titleAr: ar.products.title }, [
    fromDefaults("PRODUCTS_CATALOG", { en: { eyebrow: en.products.eyebrow, title: en.products.title }, ar: { eyebrow: ar.products.eyebrow, title: ar.products.title } }),
  ]);

  // Product pages: details (fixed) + the quote form (product preselected) + related products.
  await seedPage(PRODUCT_TEMPLATE_SLUG, { titleEn: "Product page template", titleAr: "قالب صفحة المنتج" }, [fromDefaults("PRODUCT_DETAILS"), await homepageQuote(), fromDefaults("PRODUCT_RELATED")]);

  if (!apply) console.log("\nNothing written.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
