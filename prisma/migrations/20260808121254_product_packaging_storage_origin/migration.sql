-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "originCountry" TEXT;

-- AlterTable
ALTER TABLE "ProductTranslation" ADD COLUMN     "packagingInfo" TEXT,
ADD COLUMN     "storageInfo" TEXT;
