-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "featuredOrder" INTEGER,
ADD COLUMN     "isFeatured" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Category_isFeatured_idx" ON "Category"("isFeatured");
