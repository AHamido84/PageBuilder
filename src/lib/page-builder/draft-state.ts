import { createHash } from "crypto";
import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Redesign PHASE 10 -- a fingerprint of a page's saved draft, used for two things:
 *  1. Safe autosave: the editor sends the fingerprint of the draft it last loaded/saved; the save is
 *     refused if the draft in the database has changed since (another tab or editor saved in the
 *     meantime), instead of silently overwriting their work.
 *  2. "Unpublished changes": the same fingerprint computed from the published snapshot tells the
 *     toolbar whether the live page differs from the draft.
 * Always computed server-side from stored JSON (never trusting client serialization), with keys
 * sorted so Postgres jsonb key ordering can't produce false differences.
 */

type SectionLike = { type: string; order: number; dataEn: unknown; dataAr: unknown; settings: unknown; isVisible: boolean };

// Publish-time-only data (see freezeBrandGridSection in the builder actions) that the draft never has.
const PUBLISH_ONLY_KEYS = new Set(["resolvedBrands"]);

function stableStringify(value: unknown, topLevelData = false): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value) ?? "null";
  if (Array.isArray(value)) return `[${value.map((v) => stableStringify(v)).join(",")}]`;
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record)
    .filter((k) => record[k] !== undefined && !(topLevelData && PUBLISH_ONLY_KEYS.has(k)))
    .sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(record[k])}`).join(",")}}`;
}

export function fingerprintSections(sections: SectionLike[]): string {
  const normalized = [...sections]
    .sort((a, b) => a.order - b.order)
    .map((s) => `${s.type}|${s.isVisible ? 1 : 0}|${stableStringify(s.dataEn, true)}|${stableStringify(s.dataAr, true)}|${stableStringify(s.settings)}`);
  return createHash("sha1").update(normalized.join("\n")).digest("hex");
}

type Db = PrismaClient | Prisma.TransactionClient;

export async function getDraftFingerprint(pageId: string, db: Db = prisma): Promise<string> {
  const rows = await db.pageSection.findMany({ where: { pageId }, select: { type: true, order: true, dataEn: true, dataAr: true, settings: true, isVisible: true } });
  return fingerprintSections(rows);
}

export interface DraftState {
  draftHash: string;
  /** True when the page has a published version and the saved draft differs from it. */
  hasUnpublishedChanges: boolean;
}

export async function getDraftState(pageId: string, db: Db = prisma): Promise<DraftState> {
  const [draftHash, published] = await Promise.all([
    getDraftFingerprint(pageId, db),
    db.pageRevision.findFirst({ where: { pageId, isPublished: true }, select: { snapshot: true } }),
  ]);
  if (!published) return { draftHash, hasUnpublishedChanges: false };
  const snapshot = published.snapshot as unknown as { sections?: SectionLike[] };
  const publishedHash = fingerprintSections(snapshot.sections ?? []);
  return { draftHash, hasUnpublishedChanges: publishedHash !== draftHash };
}
