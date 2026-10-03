-- Redesign PHASE 7: explicit product main image + optional mobile image, and a category banner.
-- All additive and nullable; existing rows keep their pre-PHASE 7 behavior (main image falls back
-- to the first gallery image, categories without a banner render their header as before).

-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "bannerId" TEXT;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "mainImageId" TEXT,
ADD COLUMN     "mobileImageId" TEXT;

-- CreateIndex
CREATE INDEX "Category_bannerId_idx" ON "Category"("bannerId");

-- CreateIndex
CREATE INDEX "Product_mainImageId_idx" ON "Product"("mainImageId");

-- CreateIndex
CREATE INDEX "Product_mobileImageId_idx" ON "Product"("mobileImageId");

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_bannerId_fkey" FOREIGN KEY ("bannerId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_mainImageId_fkey" FOREIGN KEY ("mainImageId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_mobileImageId_fkey" FOREIGN KEY ("mobileImageId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;
