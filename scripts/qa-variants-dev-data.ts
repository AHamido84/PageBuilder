/**
 * DEV/PREVIEW ONLY -- disposable QA data for the variant products feature. The dev database only has
 * demo products, so this mirrors production's two Absher products (same slugs, SKUs, names and
 * public image URLs) for scripts/migrate-variants.ts and the Playwright flows to run against.
 *
 *   npx tsx scripts/qa-variants-dev-data.ts            # create (idempotent)
 *   npx tsx scripts/qa-variants-dev-data.ts --cleanup  # delete everything this script, the merge and
 *                                                      # the e2e admin flow created
 *
 * Refuses to run against the production database host.
 */
import { PrismaClient } from "@prisma/client";

const PROD_HOST = "ep-quiet-band";
const TAG = "qa-variants";
const prisma = new PrismaClient();

const PRODUCTS = [
  {
    slug: "absher-frensh-fries-7mm",
    sku: "AB-01",
    nameAr: "بطاطس أبشر 7 مللي",
    nameEn: "Absher Frensh Fries  7 mm",
    image: "https://xnk8kqsw22fxpvb2.public.blob.vercel-storage.com/uploads/2026/10/bf0e55f1-da1f-45a3-8f55-fe93029e7c5b.jpg",
  },
  {
    slug: "absher-frensh-fries-10mm",
    sku: "AB-02",
    nameAr: "بطاطس أبشر 10 مللي",
    nameEn: "Absher Frensh Fries  10 mm",
    image: "https://xnk8kqsw22fxpvb2.public.blob.vercel-storage.com/uploads/2026/10/3313645d-1010-49d8-a050-e8977e9beba7.jpg",
  },
];
/** Created by the merge script / the e2e admin flow -- removed by --cleanup too. */
const DERIVED_SLUGS = ["absher-french-fries", "e2e-frozen-beef"];

async function main() {
  const url = process.env.DATABASE_URL ?? "";
  if (url.includes(PROD_HOST)) throw new Error("Refusing to run: DATABASE_URL points at the production database.");

  if (process.argv.includes("--cleanup")) {
    const slugs = [...PRODUCTS.map((p) => p.slug), ...DERIVED_SLUGS];
    const ids = (await prisma.product.findMany({ where: { OR: [{ slug: { in: slugs } }, { slug: { startsWith: "e2e-frozen-beef" } }] }, select: { id: true } })).map((p) => p.id);
    const leads = await prisma.lead.deleteMany({ where: { productId: { in: ids }, email: "" } });
    const products = await prisma.product.deleteMany({ where: { id: { in: ids } } });
    const redirects = await prisma.redirect.deleteMany({ where: { fromPath: { in: PRODUCTS.map((p) => `/products/${p.slug}`) } } });
    const media = await prisma.media.deleteMany({ where: { tags: { has: TAG } } });
    const optionTypes = await prisma.optionType.deleteMany({ where: { key: { startsWith: "e2e-" }, productOptions: { none: {} } } });
    console.log(`Deleted: products=${products.count} leads=${leads.count} redirects=${redirects.count} media=${media.count} optionTypes=${optionTypes.count}`);
    return;
  }

  // A frozen-potatoes-like category: reuse the first active category (dev has demo categories only).
  const category = await prisma.category.findFirst({ where: { isActive: true }, orderBy: { order: "asc" } });
  if (!category) throw new Error("No category in this database.");

  for (const p of PRODUCTS) {
    const existing = await prisma.product.findUnique({ where: { slug: p.slug } });
    if (existing) {
      console.log(`exists: ${p.slug}`);
      continue;
    }
    const media = await prisma.media.create({
      data: { fileName: `${p.slug}.jpg`, originalName: `${p.slug}.jpg`, mimeType: "image/jpeg", type: "IMAGE", sizeBytes: 0, url: p.image, tags: [TAG] },
    });
    await prisma.product.create({
      data: {
        sku: p.sku,
        slug: p.slug,
        temperatureClass: "FROZEN",
        isPublished: true,
        categoryId: category.id,
        mainImageId: media.id,
        images: { connect: [{ id: media.id }] },
        translations: { create: [{ locale: "AR", name: p.nameAr }, { locale: "EN", name: p.nameEn }] },
      },
    });
    console.log(`created: ${p.slug} (${p.sku}) in category ${category.slug}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
