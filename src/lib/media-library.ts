import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/** Fields the admin Media Library (page + picker modal) needs for every item. */
export const mediaListSelect = {
  id: true,
  url: true,
  fileName: true,
  originalName: true,
  title: true,
  description: true,
  type: true,
  mimeType: true,
  sizeBytes: true,
  width: true,
  height: true,
  altTextEn: true,
  altTextAr: true,
  tags: true,
  folderId: true,
  createdAt: true,
} satisfies Prisma.MediaSelect;

export type MediaListRow = Prisma.MediaGetPayload<{ select: typeof mediaListSelect }>;

/** "unfiled" is a reserved filter value for media with no folder (every pre-existing row). */
export const UNFILED_FOLDER = "unfiled";

const MAX_TAGS = 20;
const MAX_TAG_LENGTH = 40;

export function normalizeTags(raw: string[]): string[] {
  const seen = new Set<string>();
  for (const tag of raw) {
    const clean = tag.trim().toLowerCase().replace(/\s+/g, " ").slice(0, MAX_TAG_LENGTH);
    if (clean) seen.add(clean);
    if (seen.size >= MAX_TAGS) break;
  }
  return [...seen];
}

export interface MediaFilters {
  q?: string | null;
  type?: string | null;
  folder?: string | null;
  tag?: string | null;
}

/** One query builder shared by the Media Library page and the picker API, so search behaves the same in both. */
export function buildMediaWhere({ q, type, folder, tag }: MediaFilters): Prisma.MediaWhereInput {
  const where: Prisma.MediaWhereInput = {};
  if (type === "IMAGE" || type === "DOCUMENT" || type === "VIDEO") where.type = type;
  if (folder === UNFILED_FOLDER) where.folderId = null;
  else if (folder) where.folderId = folder;
  if (tag) where.tags = { has: tag.trim().toLowerCase() };

  const term = q?.trim();
  if (term) {
    where.OR = [
      { originalName: { contains: term, mode: "insensitive" } },
      { title: { contains: term, mode: "insensitive" } },
      { altTextEn: { contains: term, mode: "insensitive" } },
      { altTextAr: { contains: term, mode: "insensitive" } },
      { tags: { has: term.toLowerCase() } },
      { folder: { name: { contains: term, mode: "insensitive" } } },
    ];
  }
  return where;
}

export interface MediaUsage {
  label: string;
  href: string;
}

/**
 * Everywhere a media item is referenced. Two kinds of reference exist:
 * - real foreign keys (category image, brand logo, product gallery, ...), which Postgres would
 *   silently null out (onDelete: SetNull) or unlink if the file were deleted, and
 * - Page Builder JSON, which stores `{ id, url }` copies (or bare URLs) inside section data and
 *   revision snapshots -- invisible to the database, so a delete would leave a broken image.
 * Delete is refused while this list is non-empty; Replace rewrites the JSON copies.
 */
export async function findMediaUsage(media: { id: string; url: string }): Promise<MediaUsage[]> {
  const [item, sectionPages, publishedPages] = await Promise.all([
    prisma.media.findUnique({
      where: { id: media.id },
      select: {
        categoriesUsing: { select: { id: true, slug: true } },
        categoryBannerOf: { select: { id: true, slug: true } },
        productMainImageOf: { select: { id: true, slug: true } },
        productMobileImageOf: { select: { id: true, slug: true } },
        brandLogoOf: { select: { id: true, slug: true } },
        brandBannerOf: { select: { id: true, slug: true } },
        productImagesOf: { select: { id: true, slug: true } },
        productVideosOf: { select: { id: true, slug: true } },
        productDocumentsOf: { select: { id: true, slug: true } },
        blogPostsCoverOf: { select: { id: true, slug: true } },
        certificationsUsing: { select: { id: true } },
        siteSettingLogoOf: { select: { id: true } },
        siteSettingFaviconOf: { select: { id: true } },
        siteSettingOgImageOf: { select: { id: true } },
        siteSettingFooterLogoOf: { select: { id: true } },
        seoOgImageOf: { select: { id: true } },
      },
    }),
    pagesReferencing("PageSection", media),
    pagesReferencing("PageRevision", media),
  ]);

  const usage: MediaUsage[] = [];
  if (item) {
    for (const c of item.categoriesUsing) usage.push({ label: `Category image: ${c.slug}`, href: `/admin/categories/${c.id}` });
    for (const c of item.categoryBannerOf) usage.push({ label: `Category banner: ${c.slug}`, href: `/admin/categories/${c.id}` });
    for (const b of item.brandLogoOf) usage.push({ label: `Brand logo: ${b.slug}`, href: `/admin/brands/${b.id}` });
    for (const b of item.brandBannerOf) usage.push({ label: `Brand banner: ${b.slug}`, href: `/admin/brands/${b.id}` });
    for (const p of item.productImagesOf) usage.push({ label: `Product gallery: ${p.slug}`, href: `/admin/products/${p.id}` });
    for (const p of item.productMainImageOf) usage.push({ label: `Product main image: ${p.slug}`, href: `/admin/products/${p.id}` });
    for (const p of item.productMobileImageOf) usage.push({ label: `Product mobile image: ${p.slug}`, href: `/admin/products/${p.id}` });
    for (const p of item.productVideosOf) usage.push({ label: `Product video: ${p.slug}`, href: `/admin/products/${p.id}` });
    for (const p of item.productDocumentsOf) usage.push({ label: `Product document: ${p.slug}`, href: `/admin/products/${p.id}` });
    for (const p of item.blogPostsCoverOf) usage.push({ label: `Blog cover: ${p.slug}`, href: `/admin/blog/${p.id}` });
    for (const c of item.certificationsUsing) usage.push({ label: "Certification image", href: `/admin/certifications/${c.id}` });
    if (item.siteSettingLogoOf.length) usage.push({ label: "Site logo", href: "/admin/settings" });
    if (item.siteSettingFaviconOf.length) usage.push({ label: "Site favicon", href: "/admin/settings" });
    if (item.siteSettingOgImageOf.length) usage.push({ label: "Default social share image", href: "/admin/settings" });
    if (item.siteSettingFooterLogoOf.length) usage.push({ label: "Footer logo", href: "/admin/settings" });
    if (item.seoOgImageOf.length) usage.push({ label: `SEO share image (${item.seoOgImageOf.length} page/entity record${item.seoOgImageOf.length === 1 ? "" : "s"})`, href: "/admin/pages" });
  }

  const draftIds = new Set(sectionPages.map((p) => p.id));
  for (const p of sectionPages) usage.push({ label: `Page Builder: ${p.slug}`, href: `/admin/pages/${p.id}/builder` });
  for (const p of publishedPages) {
    if (!draftIds.has(p.id)) usage.push({ label: `Published page (removed from draft): ${p.slug}`, href: `/admin/pages/${p.id}/builder` });
  }
  return usage;
}

/** Page Builder JSON is searched as text: by `"<id>"` (MediaRef objects) and by URL (fields that store a bare URL). */
async function pagesReferencing(table: "PageSection" | "PageRevision", media: { id: string; url: string }) {
  const quotedId = `"${media.id}"`;
  if (table === "PageSection") {
    return prisma.$queryRaw<{ id: string; slug: string }[]>`
      SELECT DISTINCT p.id, p.slug FROM "PageSection" s JOIN "Page" p ON p.id = s."pageId"
      WHERE strpos(s."dataEn"::text, ${quotedId}) > 0 OR strpos(s."dataAr"::text, ${quotedId}) > 0 OR strpos(s.settings::text, ${quotedId}) > 0
         OR strpos(s."dataEn"::text, ${media.url}) > 0 OR strpos(s."dataAr"::text, ${media.url}) > 0 OR strpos(s.settings::text, ${media.url}) > 0`;
  }
  return prisma.$queryRaw<{ id: string; slug: string }[]>`
    SELECT DISTINCT p.id, p.slug FROM "PageRevision" r JOIN "Page" p ON p.id = r."pageId"
    WHERE r."isPublished" = true AND (strpos(r.snapshot::text, ${quotedId}) > 0 OR strpos(r.snapshot::text, ${media.url}) > 0)`;
}

/**
 * After a file is replaced its blob URL changes. Page Builder JSON holds URL copies, so every
 * copy -- live sections AND every revision snapshot (published, or restorable later) -- is
 * rewritten to the new URL in the same transaction as the Media row update.
 */
export function rewriteMediaUrlStatements(oldUrl: string, newUrl: string) {
  return [
    prisma.$executeRaw`
      UPDATE "PageSection" SET
        "dataEn" = replace("dataEn"::text, ${oldUrl}, ${newUrl})::jsonb,
        "dataAr" = replace("dataAr"::text, ${oldUrl}, ${newUrl})::jsonb,
        settings = replace(settings::text, ${oldUrl}, ${newUrl})::jsonb
      WHERE strpos("dataEn"::text, ${oldUrl}) > 0 OR strpos("dataAr"::text, ${oldUrl}) > 0 OR strpos(settings::text, ${oldUrl}) > 0`,
    prisma.$executeRaw`
      UPDATE "PageRevision" SET snapshot = replace(snapshot::text, ${oldUrl}, ${newUrl})::jsonb
      WHERE strpos(snapshot::text, ${oldUrl}) > 0`,
  ];
}

export const MEDIA_FOLDER_NAME_MAX = 60;

export function parseFolderName(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const name = raw.trim();
  return name.length >= 1 && name.length <= MEDIA_FOLDER_NAME_MAX ? name : null;
}

/** Folders with their file counts, plus unfiled/total counts -- the Media Library sidebar's data. */
export async function listFoldersWithCounts() {
  const [folders, unfiledCount, totalCount] = await Promise.all([
    prisma.mediaFolder.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true, _count: { select: { media: true } } },
    }),
    prisma.media.count({ where: { folderId: null } }),
    prisma.media.count(),
  ]);
  return {
    folders: folders.map((f) => ({ id: f.id, name: f.name, count: f._count.media })),
    unfiledCount,
    totalCount,
  };
}

export type FolderSummary = Awaited<ReturnType<typeof listFoldersWithCounts>>;
