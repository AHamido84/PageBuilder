-- AlterTable
ALTER TABLE "Media" ADD COLUMN     "description" TEXT,
ADD COLUMN     "folderId" TEXT,
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "title" TEXT;

-- CreateTable
CREATE TABLE "MediaFolder" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MediaFolder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MediaFolder_name_key" ON "MediaFolder"("name");

-- CreateIndex
CREATE INDEX "Media_folderId_idx" ON "Media"("folderId");

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "MediaFolder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Default folders, seeded here (not in prisma/seed.ts) so every environment gets them from
-- `prisma migrate deploy` alone. Existing media stay unfiled (folderId NULL) -- nothing is moved.
INSERT INTO "MediaFolder" ("id", "name", "sortOrder") VALUES
    ('mediafolder_hero', 'Hero', 10),
    ('mediafolder_banners', 'Banners', 20),
    ('mediafolder_products', 'Products', 30),
    ('mediafolder_categories', 'Categories', 40),
    ('mediafolder_brands', 'Brands', 50),
    ('mediafolder_logos', 'Logos', 60),
    ('mediafolder_backgrounds', 'Backgrounds', 70),
    ('mediafolder_solutions', 'Solutions', 80),
    ('mediafolder_articles', 'Articles', 90),
    ('mediafolder_general', 'General', 100)
ON CONFLICT ("name") DO NOTHING;
