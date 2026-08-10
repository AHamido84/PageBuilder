-- CreateEnum
CREATE TYPE "RedirectStatusCode" AS ENUM ('MOVED_PERMANENTLY', 'FOUND');

-- AlterEnum
ALTER TYPE "LeadInquiryType" ADD VALUE 'BECOME_CUSTOMER';
ALTER TYPE "LeadInquiryType" ADD VALUE 'SALES_INQUIRY';

-- AlterTable
ALTER TABLE "SiteSetting" ADD COLUMN     "gtmId" TEXT,
ADD COLUMN     "metaPixelId" TEXT;

-- CreateTable
CREATE TABLE "Redirect" (
    "id" TEXT NOT NULL,
    "fromPath" TEXT NOT NULL,
    "toPath" TEXT NOT NULL,
    "statusCode" "RedirectStatusCode" NOT NULL DEFAULT 'MOVED_PERMANENTLY',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Redirect_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Redirect_fromPath_key" ON "Redirect"("fromPath");
