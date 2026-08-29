import { prisma } from "@/lib/prisma";
import type { HeroData, HeroRenderData, HeroResolvedProduct } from "../content-blocks";

/**
 * Server-side hydration for the Hero block: turns the `Media` ids persisted in `heroSchema`
 * (desktopMediaId/mobileMediaId/posterId, plus per-slide ids) into real URLs, and the Product
 * Composition mode's `primaryProductId`/`secondaryProductId`/`supportingProductId` into real,
 * current catalog data -- all batched into as few queries as possible. Called by both
 * `SectionRenderer` (public site) and the admin builder's initial page load (see `types.ts`'s
 * `resolveData` doc comment for why this exists as a hook rather than making Hero's `Render`
 * itself an async Server Component). `locale` picks which `ProductTranslation` to read; a
 * product's name is the only locale-specific field resolved here.
 */
export async function resolveHeroData(data: HeroData, locale: string): Promise<HeroRenderData> {
  const ids = new Set<string>();
  if (data.desktopMediaId) ids.add(data.desktopMediaId);
  if (data.mobileMediaId) ids.add(data.mobileMediaId);
  if (data.posterId) ids.add(data.posterId);
  for (const slide of data.slides) {
    if (slide.desktopMediaId) ids.add(slide.desktopMediaId);
    if (slide.mobileMediaId) ids.add(slide.mobileMediaId);
    if (slide.posterId) ids.add(slide.posterId);
  }

  const c = data.composition;
  if (c.backgroundId) ids.add(c.backgroundId);
  if (c.mobileBackgroundId) ids.add(c.mobileBackgroundId);
  if (c.mainImageId) ids.add(c.mainImageId);
  if (c.secondaryImageId) ids.add(c.secondaryImageId);
  for (const id of c.productImageIds) ids.add(id);
  for (const id of c.decorativeImageIds) ids.add(id);

  const productIds = new Set<string>();
  if (data.primaryProductId) productIds.add(data.primaryProductId);
  if (data.secondaryProductId) productIds.add(data.secondaryProductId);
  if (data.supportingProductId) productIds.add(data.supportingProductId);

  if (ids.size === 0 && productIds.size === 0) return data;

  const [media, products] = await Promise.all([
    ids.size ? prisma.media.findMany({ where: { id: { in: Array.from(ids) } }, select: { id: true, url: true, type: true } }) : Promise.resolve([]),
    productIds.size
      ? prisma.product.findMany({
          where: { id: { in: Array.from(productIds) } },
          select: {
            id: true,
            slug: true,
            sku: true,
            isFeatured: true,
            images: { take: 1, select: { url: true } },
            translations: { where: { locale: locale.toUpperCase() === "AR" ? "AR" : "EN" }, select: { name: true } },
          },
        })
      : Promise.resolve([]),
  ]);
  const byId = new Map(media.map((m) => [m.id, m]));
  const productById = new Map(products.map((p) => [p.id, p]));

  function toResolvedProduct(id: string): HeroResolvedProduct | undefined {
    const p = productById.get(id);
    if (!p) return undefined;
    return { id: p.id, name: p.translations[0]?.name ?? p.sku, slug: p.slug, sku: p.sku, imageUrl: p.images[0]?.url ?? null, isFeatured: p.isFeatured };
  }

  const desktop = data.desktopMediaId ? byId.get(data.desktopMediaId) : undefined;
  const mobile = data.mobileMediaId ? byId.get(data.mobileMediaId) : undefined;
  const poster = data.posterId ? byId.get(data.posterId) : undefined;

  let slideMedia: HeroRenderData["slideMedia"];
  for (const slide of data.slides) {
    const sDesktop = slide.desktopMediaId ? byId.get(slide.desktopMediaId) : undefined;
    const sMobile = slide.mobileMediaId ? byId.get(slide.mobileMediaId) : undefined;
    const sPoster = slide.posterId ? byId.get(slide.posterId) : undefined;
    if (sDesktop || sMobile || sPoster) {
      slideMedia ??= {};
      slideMedia[slide.id] = {
        desktopUrl: sDesktop?.url,
        desktopKind: sDesktop?.type,
        mobileUrl: sMobile?.url,
        mobileKind: sMobile?.type,
        posterUrl: sPoster?.url,
      };
    }
  }

  function toUrlMap(mediaIds: string[]): Record<string, string> {
    const map: Record<string, string> = {};
    for (const id of mediaIds) {
      const url = byId.get(id)?.url;
      if (url) map[id] = url;
    }
    return map;
  }

  const compositionMedia = {
    backgroundUrl: c.backgroundId ? byId.get(c.backgroundId)?.url : undefined,
    mobileBackgroundUrl: c.mobileBackgroundId ? byId.get(c.mobileBackgroundId)?.url : undefined,
    mainUrl: c.mainImageId ? byId.get(c.mainImageId)?.url : undefined,
    secondaryUrl: c.secondaryImageId ? byId.get(c.secondaryImageId)?.url : undefined,
    productUrls: toUrlMap(c.productImageIds),
    decorativeUrls: toUrlMap(c.decorativeImageIds),
  };

  return {
    ...data,
    desktopMediaUrl: desktop?.url,
    desktopMediaKind: desktop?.type,
    mobileMediaUrl: mobile?.url,
    mobileMediaKind: mobile?.type,
    posterUrl: poster?.url,
    slideMedia,
    primaryProduct: data.primaryProductId ? toResolvedProduct(data.primaryProductId) : undefined,
    secondaryProduct: data.secondaryProductId ? toResolvedProduct(data.secondaryProductId) : undefined,
    supportingProduct: data.supportingProductId ? toResolvedProduct(data.supportingProductId) : undefined,
    compositionMedia,
  };
}
