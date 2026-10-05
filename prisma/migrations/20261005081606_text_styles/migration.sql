-- AlterTable
ALTER TABLE "BrandTranslation" ADD COLUMN     "rich" JSONB;

-- AlterTable
ALTER TABLE "CategoryTranslation" ADD COLUMN     "rich" JSONB;

-- AlterTable
ALTER TABLE "Certification" ADD COLUMN     "rich" JSONB;

-- AlterTable
ALTER TABLE "Faq" ADD COLUMN     "rich" JSONB;

-- AlterTable
ALTER TABLE "MenuItem" ADD COLUMN     "rich" JSONB;

-- AlterTable
ALTER TABLE "OptionType" ADD COLUMN     "rich" JSONB;

-- AlterTable
ALTER TABLE "Page" ADD COLUMN     "rich" JSONB;

-- AlterTable
ALTER TABLE "ProductOptionValue" ADD COLUMN     "rich" JSONB;

-- AlterTable
ALTER TABLE "ProductTranslation" ADD COLUMN     "rich" JSONB;

-- AlterTable
ALTER TABLE "ProductVariant" ADD COLUMN     "rich" JSONB;

-- AlterTable
ALTER TABLE "SiteSetting" ADD COLUMN     "rich" JSONB,
ADD COLUMN     "textStylesEnabled" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "SolutionTranslation" ADD COLUMN     "rich" JSONB;

-- AlterTable
ALTER TABLE "VariantSpec" ADD COLUMN     "rich" JSONB;
