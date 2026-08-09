-- DropIndex
DROP INDEX "PageSection_pageId_order_key";

-- AlterTable
ALTER TABLE "PageRevision" ADD COLUMN     "isPublished" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "PageSection" ADD COLUMN     "settings" JSONB NOT NULL DEFAULT '{}';

-- CreateIndex
CREATE INDEX "PageRevision_pageId_isPublished_idx" ON "PageRevision"("pageId", "isPublished");

-- CreateIndex
CREATE INDEX "PageSection_pageId_order_idx" ON "PageSection"("pageId", "order");

-- Defense-in-depth: at most one published revision per page, enforced at the DB layer.
-- NOTE: this partial index is hand-added and NOT representable in schema.prisma's DSL
-- (Prisma's @@unique doesn't support WHERE clauses) -- future `prisma migrate diff` runs
-- won't know about it and may propose dropping it. See HANDOFF.md.
CREATE UNIQUE INDEX "PageRevision_pageId_published_key" ON "PageRevision"("pageId") WHERE "isPublished" = true;
