-- CreateEnum
CREATE TYPE "LeadInquiryType" AS ENUM ('GENERAL', 'INFO', 'QUOTE');

-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_specSheetId_fkey";

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "inquiryType" "LeadInquiryType" NOT NULL DEFAULT 'GENERAL';

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "specSheetId",
ADD COLUMN     "dimensions" TEXT,
ADD COLUMN     "relatedProductIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "weight" TEXT;

-- AlterTable
ALTER TABLE "ProductTranslation" ADD COLUMN     "allergens" TEXT,
ADD COLUMN     "ingredients" TEXT,
ADD COLUMN     "nutritionInfo" TEXT,
ADD COLUMN     "shortDescription" TEXT;

-- CreateTable
CREATE TABLE "Faq" (
    "id" TEXT NOT NULL,
    "questionEn" TEXT NOT NULL,
    "questionAr" TEXT NOT NULL,
    "answerEn" TEXT NOT NULL,
    "answerAr" TEXT NOT NULL,
    "category" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Faq_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ProductVideos" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ProductVideos_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ProductDocuments" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ProductDocuments_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_CertificationToProduct" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CertificationToProduct_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "Faq_category_idx" ON "Faq"("category");

-- CreateIndex
CREATE INDEX "Faq_order_idx" ON "Faq"("order");

-- CreateIndex
CREATE INDEX "_ProductVideos_B_index" ON "_ProductVideos"("B");

-- CreateIndex
CREATE INDEX "_ProductDocuments_B_index" ON "_ProductDocuments"("B");

-- CreateIndex
CREATE INDEX "_CertificationToProduct_B_index" ON "_CertificationToProduct"("B");

-- AddForeignKey
ALTER TABLE "_ProductVideos" ADD CONSTRAINT "_ProductVideos_A_fkey" FOREIGN KEY ("A") REFERENCES "Media"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProductVideos" ADD CONSTRAINT "_ProductVideos_B_fkey" FOREIGN KEY ("B") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProductDocuments" ADD CONSTRAINT "_ProductDocuments_A_fkey" FOREIGN KEY ("A") REFERENCES "Media"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProductDocuments" ADD CONSTRAINT "_ProductDocuments_B_fkey" FOREIGN KEY ("B") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CertificationToProduct" ADD CONSTRAINT "_CertificationToProduct_A_fkey" FOREIGN KEY ("A") REFERENCES "Certification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CertificationToProduct" ADD CONSTRAINT "_CertificationToProduct_B_fkey" FOREIGN KEY ("B") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
