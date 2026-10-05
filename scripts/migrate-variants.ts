/**
 * Variant products -- data migration (run AFTER `prisma migrate deploy` of 20261005*_product_variants).
 *
 *   npx tsx scripts/migrate-variants.ts                       # dry run (default): prints the plan, writes nothing
 *   npx tsx scripts/migrate-variants.ts --apply               # merge Absher 7/10 mm into one VARIANT product,
 *                                                             # move leads/menu links, add 301 redirects;
 *                                                             # the OLD products stay published
 *   npx tsx scripts/migrate-variants.ts --apply --unpublish-old   # same, then unpublish (archive) the old products
 *   npx tsx scripts/migrate-variants.ts --revert --log <file> # undo an --apply using the log it wrote
 *
 * Every other product stays SIMPLE and keeps rendering from its own fields (image, weight, packaging,
 * storage) -- the public site reads those as the product's single variant (src/lib/catalog/variants/load.ts),
 * so no rows are copied for them and the admin's existing Media/Specifications tabs stay the one
 * source of truth. The report lists each one as a TODO for real variant data.
 *
 * Uses whatever DATABASE_URL is in the environment -- run it against production only deliberately.
 * Idempotent: a second --apply finds the merged product and only fills in what's missing.
 */
import { writeFileSync, readFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const args = process.argv.slice(2);
const apply = args.includes("--apply");
const revert = args.includes("--revert");
const unpublishOld = args.includes("--unpublish-old");
const logArg = args[args.indexOf("--log") + 1];

/** The merge (from the brief): «أبشر بالبطاطس — ٧ مم» + «— ١٠ مم» -> «أبشر بالبطاطس» with المقاس. */
const MERGE = {
  targetSlug: "absher-french-fries",
  /** The merged product's Arabic name as given in the brief (the catalog has «بطاطس أبشر 7 مللي»). */
  nameAr: "أبشر بالبطاطس",
  optionKey: "size",
  sources: [
    { slug: "absher-frensh-fries-7mm", valueKey: "7mm", valueAr: "٧ مم", valueEn: "7 mm" },
    { slug: "absher-frensh-fries-10mm", valueKey: "10mm", valueAr: "١٠ مم", valueEn: "10 mm" },
  ],
};

/** "أبشر بالبطاطس — ٧ مم" -> "أبشر بالبطاطس"; "Absher Frensh Fries 10mm" -> "Absher Frensh Fries". */
function stripSize(name: string): string {
  return name
    .replace(/[\s\-–—(]*[0-9٠-٩]+(?:[.,٫][0-9٠-٩]+)?\s*(?:mm|مم|ملم|مللي)\)?\s*$/i, "")
    .replace(/[\s\-–—]+$/, "")
    .trim();
}

function host(): string {
  try {
    return new URL(process.env.DATABASE_URL ?? "").hostname.split(".")[0];
  } catch {
    return "unknown-db";
  }
}

interface MergeLog {
  db: string;
  at: string;
  targetId: string;
  createdTarget: boolean;
  leads: { id: string; from: string }[];
  menuItems: { id: string; from: string }[];
  related: { productId: string; before: string[] }[];
  redirects: string[];
  unpublished: string[];
}

async function main() {
  console.log(`Database: ${host()}   mode: ${revert ? "REVERT" : apply ? "APPLY" : "DRY RUN"}${unpublishOld ? " + unpublish old" : ""}\n`);
  if (revert) return doRevert();

  const products = await prisma.product.findMany({
    orderBy: { slug: "asc" },
    include: { translations: true, _count: { select: { variants: true, leads: true } } },
  });

  // ---- 1. Report every product ---------------------------------------------------------------
  console.log("Products:");
  for (const p of products) {
    const ar = p.translations.find((t) => t.locale === "AR")?.name ?? "";
    console.log(`  ${p.isPublished ? "pub  " : "draft"} ${p.type.padEnd(7)} variants=${p._count.variants} ${p.slug}  «${ar}»`);
  }

  // ---- 2. Absher merge ----------------------------------------------------------------------
  const sources = await prisma.product.findMany({
    where: { slug: { in: MERGE.sources.map((s) => s.slug) } },
    include: {
      translations: true,
      mainImage: { select: { id: true, url: true, altTextAr: true, altTextEn: true } },
      images: { orderBy: { createdAt: "asc" }, select: { id: true, url: true, altTextAr: true, altTextEn: true } },
      videos: { select: { id: true } },
      documents: { select: { id: true } },
      certifications: { select: { id: true } },
    },
  });
  const ordered = MERGE.sources.map((s) => ({ spec: s, product: sources.find((p) => p.slug === s.slug) }));
  const missing = ordered.filter((o) => !o.product).map((o) => o.spec.slug);
  const existingTarget = await prisma.product.findUnique({ where: { slug: MERGE.targetSlug }, include: { _count: { select: { variants: true } } } });

  console.log("\nAbsher merge:");
  if (missing.length && !existingTarget) {
    console.log(`  SKIP -- source product(s) not found: ${missing.join(", ")}`);
    return report(products.map((p) => p.slug));
  }
  const first = ordered[0].product!;
  const firstAr = first?.translations.find((t) => t.locale === "AR");
  const firstEn = first?.translations.find((t) => t.locale === "EN");
  const nameAr = MERGE.nameAr || (firstAr ? stripSize(firstAr.name) : "");
  const nameEn = firstEn ? stripSize(firstEn.name).replace(/\s{2,}/g, " ") : "";
  console.log(`  source names: ${ordered.map((o) => `«${o.product?.translations.find((t) => t.locale === "AR")?.name}»`).join(" + ")}`);
  const sizeType = await prisma.optionType.findUnique({ where: { key: MERGE.optionKey } });
  if (!sizeType) throw new Error(`OptionType "${MERGE.optionKey}" missing -- run the product_variants migration first.`);

  const productSku = existingTarget?.sku ?? `${first.sku}-GRP`;
  console.log(`  target: /products/${MERGE.targetSlug}  ${existingTarget ? `(exists, ${existingTarget._count.variants} variants)` : "(will be created)"}`);
  console.log(`  name: «${nameAr}» / "${nameEn}"   product SKU: ${productSku}  <- TODO confirm the names and the group SKU`);
  for (const { spec, product } of ordered) {
    if (!product) continue;
    const gallery = product.mainImage ? [product.mainImage, ...product.images.filter((i) => i.id !== product.mainImage!.id)] : product.images;
    console.log(`  variant ${MERGE.optionKey}=${spec.valueKey}: sku=${product.sku} weight=${product.weight ?? "—"} images=${gallery.length} leads=${await prisma.lead.count({ where: { productId: product.id } })}`);
  }
  for (const s of MERGE.sources) console.log(`  redirect 301: /products/${s.slug} -> /products/${MERGE.targetSlug}?${MERGE.optionKey}=${s.valueKey}`);
  console.log(`  old products: ${unpublishOld ? "unpublished (archived, not deleted)" : "left published until --unpublish-old"}`);

  if (!apply) {
    console.log("\nDry run -- nothing written. Re-run with --apply.");
    return report(products.map((p) => p.slug));
  }

  const log: MergeLog = { db: host(), at: new Date().toISOString(), targetId: "", createdTarget: false, leads: [], menuItems: [], related: [], redirects: [], unpublished: [] };

  await prisma.$transaction(
    async (tx) => {
      let target = await tx.product.findUnique({ where: { slug: MERGE.targetSlug } });
      if (!target) {
        target = await tx.product.create({
          data: {
            sku: productSku,
            slug: MERGE.targetSlug,
            type: "VARIANT",
            temperatureClass: first.temperatureClass,
            isPublished: true,
            isFeatured: ordered.some((o) => o.product?.isFeatured),
            originCountry: first.originCountry,
            weight: first.weight,
            dimensions: first.dimensions,
            relatedProductIds: first.relatedProductIds.filter((id) => !sources.some((s) => s.id === id)),
            categoryId: first.categoryId,
            brandId: first.brandId,
            mainImageId: first.mainImageId,
            mobileImageId: first.mobileImageId,
            images: { connect: first.images.map((i) => ({ id: i.id })) },
            videos: { connect: [...new Set(sources.flatMap((s) => s.videos.map((v) => v.id)))].map((id) => ({ id })) },
            documents: { connect: [...new Set(sources.flatMap((s) => s.documents.map((v) => v.id)))].map((id) => ({ id })) },
            certifications: { connect: [...new Set(sources.flatMap((s) => s.certifications.map((v) => v.id)))].map((id) => ({ id })) },
            translations: {
              create: first.translations.map((t) => ({
                locale: t.locale,
                name: t.locale === "AR" ? nameAr : nameEn,
                shortDescription: t.shortDescription,
                description: t.description,
                packagingInfo: t.packagingInfo,
                storageInfo: t.storageInfo,
                ingredients: t.ingredients,
                nutritionInfo: t.nutritionInfo,
                allergens: t.allergens,
              })),
            },
          },
        });
        log.createdTarget = true;
      }
      log.targetId = target.id;

      const option = await tx.productOption.upsert({
        where: { productId_optionTypeId: { productId: target.id, optionTypeId: sizeType.id } },
        create: { productId: target.id, optionTypeId: sizeType.id, sortOrder: 0 },
        update: {},
      });
      let defaultVariantId = target.defaultVariantId;
      for (const [i, { spec, product }] of ordered.entries()) {
        if (!product) continue;
        const value = await tx.productOptionValue.upsert({
          where: { productOptionId_key: { productOptionId: option.id, key: spec.valueKey } },
          create: { productOptionId: option.id, key: spec.valueKey, valueAr: spec.valueAr, valueEn: spec.valueEn, sortOrder: i },
          update: {},
        });
        const existing = await tx.productVariant.findFirst({ where: { productId: target.id, optionValues: { some: { optionValueId: value.id } } } });
        if (existing) {
          defaultVariantId ??= existing.id;
          continue;
        }
        const ar = product.translations.find((t) => t.locale === "AR");
        const en = product.translations.find((t) => t.locale === "EN");
        const gallery = product.mainImage ? [product.mainImage, ...product.images.filter((img) => img.id !== product.mainImage!.id)] : product.images;
        const skuFree = !(await tx.productVariant.findUnique({ where: { sku: product.sku } }));
        const variant = await tx.productVariant.create({
          data: {
            productId: target.id,
            sku: skuFree ? product.sku : null,
            weightAr: product.weight,
            weightEn: product.weight,
            packagingAr: ar?.packagingInfo ?? null,
            packagingEn: en?.packagingInfo ?? null,
            storageAr: ar?.storageInfo ?? null,
            storageEn: en?.storageInfo ?? null,
            available: true,
            sortOrder: i,
            optionValues: { create: [{ optionValueId: value.id }] },
            images: { create: gallery.map((img, k) => ({ url: img.url, mediaId: img.id, altAr: img.altTextAr, altEn: img.altTextEn, sortOrder: k })) },
          },
        });
        defaultVariantId ??= variant.id;
      }
      await tx.product.update({ where: { id: target.id }, data: { type: "VARIANT", defaultVariantId } });

      // Leads, menu links and "related products" pointing at the old products -> the merged one.
      for (const product of sources) {
        const leads = await tx.lead.findMany({ where: { productId: product.id }, select: { id: true } });
        if (leads.length) await tx.lead.updateMany({ where: { id: { in: leads.map((l) => l.id) } }, data: { productId: target.id } });
        log.leads.push(...leads.map((l) => ({ id: l.id, from: product.id })));
        const menuItems = await tx.menuItem.findMany({ where: { productId: product.id }, select: { id: true } });
        if (menuItems.length) await tx.menuItem.updateMany({ where: { id: { in: menuItems.map((m) => m.id) } }, data: { productId: target.id } });
        log.menuItems.push(...menuItems.map((m) => ({ id: m.id, from: product.id })));
      }
      const sourceIds = sources.map((s) => s.id);
      const referencing = await tx.product.findMany({ where: { relatedProductIds: { hasSome: sourceIds }, NOT: { id: target.id } }, select: { id: true, relatedProductIds: true } });
      for (const p of referencing) {
        const next = [...new Set(p.relatedProductIds.map((id) => (sourceIds.includes(id) ? target!.id : id)))].filter((id) => id !== p.id);
        await tx.product.update({ where: { id: p.id }, data: { relatedProductIds: next } });
        log.related.push({ productId: p.id, before: p.relatedProductIds });
      }

      for (const s of MERGE.sources) {
        const fromPath = `/products/${s.slug}`;
        await tx.redirect.upsert({
          where: { fromPath },
          create: { fromPath, toPath: `/products/${MERGE.targetSlug}?${MERGE.optionKey}=${s.valueKey}`, statusCode: "MOVED_PERMANENTLY", isActive: true },
          update: { toPath: `/products/${MERGE.targetSlug}?${MERGE.optionKey}=${s.valueKey}`, statusCode: "MOVED_PERMANENTLY", isActive: true },
        });
        log.redirects.push(fromPath);
      }

      if (unpublishOld) {
        await tx.product.updateMany({ where: { id: { in: sourceIds } }, data: { isPublished: false, isFeatured: false } });
        log.unpublished.push(...sourceIds);
      }
    },
    { timeout: 60_000, maxWait: 10_000 }
  );

  const file = `scripts/.migrate-variants-${log.db}-${log.at.replace(/[:.]/g, "-")}.json`;
  writeFileSync(file, JSON.stringify(log, null, 2));
  console.log(`\nApplied. Revert log: ${file}`);
  console.log(`  merged product: ${log.targetId}${log.createdTarget ? " (created)" : " (existed)"}; moved leads=${log.leads.length} menuItems=${log.menuItems.length} related=${log.related.length}; redirects=${log.redirects.length}; unpublished=${log.unpublished.length}`);
  return report(products.map((p) => p.slug));
}

/** TODO list: products that may need real variant data from the business (nothing is invented). */
function report(slugs: string[]) {
  const others = slugs.filter((s) => s !== MERGE.targetSlug && !MERGE.sources.some((m) => m.slug === s));
  console.log("\nTODO (real variant data needed from Golden Seven -- stays SIMPLE until then):");
  for (const slug of others) console.log(`  - ${slug}`);
  console.log("  - absher-french-fries: confirm the group SKU, and whether other sizes/weights (e.g. 12 mm, 10 kg) exist.");
}

async function doRevert() {
  if (!logArg || logArg.startsWith("--")) throw new Error("--revert needs --log <file> (written by --apply)");
  const log = JSON.parse(readFileSync(logArg, "utf8")) as MergeLog;
  if (log.db !== host()) throw new Error(`Log is for database "${log.db}", but DATABASE_URL points at "${host()}".`);
  console.log(`Reverting merge from ${log.at}: target ${log.targetId}`);
  if (!apply) {
    console.log(`  would: move back ${log.leads.length} leads, ${log.menuItems.length} menu items, restore ${log.related.length} related lists, deactivate ${log.redirects.length} redirects, republish ${log.unpublished.length} products, unpublish the merged product.`);
    console.log("Dry run -- add --apply to revert.");
    return;
  }
  await prisma.$transaction(async (tx) => {
    for (const l of log.leads) await tx.lead.update({ where: { id: l.id }, data: { productId: l.from } }).catch(() => undefined);
    for (const m of log.menuItems) await tx.menuItem.update({ where: { id: m.id }, data: { productId: m.from } }).catch(() => undefined);
    for (const r of log.related) await tx.product.update({ where: { id: r.productId }, data: { relatedProductIds: r.before } }).catch(() => undefined);
    await tx.redirect.updateMany({ where: { fromPath: { in: log.redirects } }, data: { isActive: false } });
    if (log.unpublished.length) await tx.product.updateMany({ where: { id: { in: log.unpublished } }, data: { isPublished: true } });
    await tx.product.update({ where: { id: log.targetId }, data: { isPublished: false } });
  });
  console.log("Reverted (the merged product is unpublished, not deleted).");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
