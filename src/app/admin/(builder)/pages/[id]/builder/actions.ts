"use server";

import { z } from "zod";
import sanitizeHtml from "sanitize-html";
import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, assertCan } from "@/lib/rbac/current-user";
import { logActivity } from "@/lib/activity-log";
import { getBlock } from "@/lib/page-builder/registry";
import type { BuilderSection } from "@/lib/page-builder/types";
import { HOMEPAGE_SLUG } from "@/lib/page-builder/homepage";
import { brandGridSchema } from "@/lib/page-builder/blocks/commerce-blocks";

const sectionInputSchema = z.object({
  id: z.string().min(1),
  type: z.string().min(1),
  dataEn: z.unknown(),
  dataAr: z.unknown(),
  settings: z.unknown(),
  isVisible: z.boolean(),
});

export interface SaveDraftResult {
  success: boolean;
  error?: string;
  savedAt?: string;
}

const RICH_TEXT_ALLOWLIST: sanitizeHtml.IOptions = {
  allowedTags: ["b", "i", "u", "s", "strong", "em", "p", "h2", "h3", "h4", "ul", "ol", "li", "a", "br"],
  allowedAttributes: { a: ["href"] },
  allowedSchemes: ["http", "https", "mailto"],
};

function sanitizeSectionData(type: string, data: unknown): unknown {
  if (type !== "RICH_TEXT" || typeof data !== "object" || data === null) return data;
  const record = data as Record<string, unknown>;
  return { ...record, html: sanitizeHtml(typeof record.html === "string" ? record.html : "", RICH_TEXT_ALLOWLIST) };
}

/** Bulk-replaces a page's sections in one transaction. No unique(pageId,order) constraint exists anymore — order is always derived from array position, never trusted from the client beyond ordering. */
export async function saveDraftAction(pageId: string, sections: unknown[]): Promise<SaveDraftResult> {
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "pages", "update");

  const parsed = z.array(sectionInputSchema).safeParse(sections);
  if (!parsed.success) return { success: false, error: "Invalid section payload." };

  // Persist the *parsed* (enResult.data/arResult.data), not the raw client payload -- Zod strips
  // any key a block's schema doesn't declare, which matters because a block's Render may receive
  // extra runtime-only fields (e.g. Hero's resolveData attaches desktopMediaUrl/desktopMediaKind
  // alongside the persisted desktopMediaId). Re-using the raw payload here would let those ride
  // along into storage and go stale the moment the referenced Media row's URL changes.
  const validated: typeof parsed.data = [];
  for (const s of parsed.data) {
    const block = getBlock(s.type);
    if (!block) return { success: false, error: `Unknown block type "${s.type}".` };
    const enResult = block.dataSchema.safeParse(s.dataEn);
    const arResult = block.dataSchema.safeParse(s.dataAr);
    if (!enResult.success || !arResult.success) {
      return { success: false, error: `Invalid content in a "${block.label}" section.` };
    }
    validated.push({ ...s, dataEn: enResult.data, dataAr: arResult.data });
  }

  const sanitized = validated.map((s) => ({
    ...s,
    dataEn: sanitizeSectionData(s.type, s.dataEn),
    dataAr: sanitizeSectionData(s.type, s.dataAr),
  }));

  // Split into a bulk createMany for genuinely-new rows (added this session, not yet
  // in the DB) and per-row updates only for rows that already exist -- a page with
  // many sections (e.g. the homepage) doing N sequential upserts in one interactive
  // transaction against Neon's per-query latency can exceed Prisma's 5s default
  // transaction timeout (P2028, "Transaction already closed"); createMany is one
  // round trip regardless of row count, and the explicit timeout below is a safety
  // margin for the remaining per-row updates.
  await prisma.$transaction(async (tx) => {
    const existing = await tx.pageSection.findMany({ where: { pageId }, select: { id: true } });
    const existingIds = new Set(existing.map((e) => e.id));
    const incomingIds = new Set(sanitized.map((s) => s.id));
    const toDelete = existing.filter((e) => !incomingIds.has(e.id)).map((e) => e.id);
    if (toDelete.length) await tx.pageSection.deleteMany({ where: { id: { in: toDelete } } });

    const toCreate = sanitized
      .map((s, order) => ({ s, order }))
      .filter(({ s }) => !existingIds.has(s.id));
    if (toCreate.length) {
      await tx.pageSection.createMany({
        data: toCreate.map(({ s, order }) => ({
          id: s.id,
          pageId,
          type: s.type,
          order,
          dataEn: s.dataEn as Prisma.InputJsonValue,
          dataAr: s.dataAr as Prisma.InputJsonValue,
          settings: s.settings as unknown as Prisma.InputJsonValue,
          isVisible: s.isVisible,
        })),
      });
    }

    for (let i = 0; i < sanitized.length; i++) {
      const s = sanitized[i];
      if (!existingIds.has(s.id)) continue;
      await tx.pageSection.update({
        where: { id: s.id },
        data: {
          type: s.type,
          order: i,
          dataEn: s.dataEn as Prisma.InputJsonValue,
          dataAr: s.dataAr as Prisma.InputJsonValue,
          settings: s.settings as unknown as Prisma.InputJsonValue,
          isVisible: s.isVisible,
        },
      });
    }
  }, { timeout: 20000 });

  await logActivity({ userId: currentUser.id, action: "pageSection.saveDraft", entityType: "Page", entityId: pageId });
  revalidatePath(`/admin/pages/${pageId}/builder`);
  return { success: true, savedAt: new Date().toISOString() };
}

/** Freezes a BRAND_GRID section's selected brands' name/logo/product-count into `resolvedBrands`,
 * once, at the moment of publish -- root-cause fix for brand logos silently disappearing from an
 * already-published page when a brand is later deactivated or its logo Media row is deleted. See
 * the `resolvedBrands` doc comment in commerce-blocks.ts. Any other block type, or data that
 * doesn't parse as BRAND_GRID data, passes through untouched. */
async function freezeBrandGridSection(rawData: unknown, locale: "en" | "ar"): Promise<unknown> {
  const parsed = brandGridSchema.safeParse(rawData);
  if (!parsed.success) return rawData;
  const brandIds = parsed.data.brandIds;
  const brands = await prisma.brand.findMany({
    where: brandIds.length ? { id: { in: brandIds } } : { isActive: true },
    include: { translations: true, logo: { select: { url: true } }, _count: { select: { products: true } } },
  });
  const resolvedBrands = brands.map((b) => ({
    id: b.id,
    name: b.translations.find((t) => t.locale === locale.toUpperCase())?.name ?? b.slug,
    slug: b.slug,
    logoUrl: b.logo?.url ?? null,
    logoId: b.logoId,
    productCount: b._count.products,
  }));
  return { ...parsed.data, resolvedBrands };
}

/** Snapshots the current working draft into a new published PageRevision and flips Page.status. */
export async function publishPageAction(pageId: string): Promise<{ success: boolean; error?: string }> {
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "pages", "publish");

  const page = await prisma.page.findUnique({ where: { id: pageId }, include: { sections: { orderBy: { order: "asc" } } } });
  if (!page) return { success: false, error: "Page not found." };

  const snapshotSections: BuilderSection[] = await Promise.all(
    page.sections.map(async (s) => ({
      id: s.id,
      type: s.type,
      order: s.order,
      dataEn: s.type === "BRAND_GRID" ? await freezeBrandGridSection(s.dataEn, "en") : s.dataEn,
      dataAr: s.type === "BRAND_GRID" ? await freezeBrandGridSection(s.dataAr, "ar") : s.dataAr,
      settings: s.settings as unknown as BuilderSection["settings"],
      isVisible: s.isVisible,
    }))
  );

  await prisma.$transaction(async (tx) => {
    await tx.pageRevision.updateMany({ where: { pageId, isPublished: true }, data: { isPublished: false } });
    await tx.pageRevision.create({
      data: { pageId, authorId: currentUser.id, isPublished: true, snapshot: { sections: snapshotSections } as unknown as Prisma.InputJsonValue },
    });
    await tx.page.update({ where: { id: pageId }, data: { status: "PUBLISHED", publishedAt: new Date() } });
  });

  await logActivity({ userId: currentUser.id, action: "page.publish", entityType: "Page", entityId: pageId });
  const publicPath = page.slug === HOMEPAGE_SLUG ? "" : `/${page.slug}`;
  revalidatePath(`/en${publicPath}`);
  revalidatePath(`/ar${publicPath}`);
  revalidatePath(`/admin/pages/${pageId}/builder`);
  return { success: true };
}

/**
 * Restores a past revision's content into the live working draft WITHOUT
 * auto-republishing — the admin reviews the restored draft and must click
 * Publish again to make it live. A safety revision of the pre-restore state
 * is taken first so a restore itself can always be undone.
 */
export async function restoreRevisionAction(pageId: string, revisionId: string): Promise<{ success: boolean; error?: string }> {
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "pages", "update");

  const revision = await prisma.pageRevision.findUnique({ where: { id: revisionId } });
  if (!revision || revision.pageId !== pageId) return { success: false, error: "Revision not found." };

  const snapshot = revision.snapshot as unknown as { sections: BuilderSection[] };

  await prisma.$transaction(async (tx) => {
    const current = await tx.pageSection.findMany({ where: { pageId }, orderBy: { order: "asc" } });
    await tx.pageRevision.create({
      data: {
        pageId,
        authorId: currentUser.id,
        isPublished: false,
        note: "Auto-saved before restore",
        snapshot: {
          sections: current.map((s) => ({ id: s.id, type: s.type, order: s.order, dataEn: s.dataEn, dataAr: s.dataAr, settings: s.settings, isVisible: s.isVisible })),
        } as unknown as Prisma.InputJsonValue,
      },
    });

    await tx.pageSection.deleteMany({ where: { pageId } });
    // A page with enough sections (e.g. the homepage's 12) doing N sequential creates in one
    // interactive transaction can exceed Prisma's 5s default timeout (P2028) against Neon's
    // per-query latency -- the exact bug already fixed in saveDraftAction above, reproduced here
    // live during this session's own Restore testing. Same fix: one createMany round trip.
    if (snapshot.sections.length) {
      await tx.pageSection.createMany({
        data: snapshot.sections.map((s, i) => ({
          id: crypto.randomUUID(),
          pageId,
          type: s.type,
          order: i,
          dataEn: s.dataEn as Prisma.InputJsonValue,
          dataAr: s.dataAr as Prisma.InputJsonValue,
          settings: s.settings as unknown as Prisma.InputJsonValue,
          isVisible: s.isVisible,
        })),
      });
    }
  }, { timeout: 20000 });

  await logActivity({ userId: currentUser.id, action: "page.restoreRevision", entityType: "Page", entityId: pageId });
  revalidatePath(`/admin/pages/${pageId}/builder`);
  return { success: true };
}
