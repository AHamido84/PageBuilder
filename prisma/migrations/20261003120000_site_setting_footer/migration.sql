-- AlterTable
ALTER TABLE "SiteSetting" ADD COLUMN     "footerLogoId" TEXT,
ADD COLUMN     "footerSettings" JSONB;

-- AddForeignKey
ALTER TABLE "SiteSetting" ADD CONSTRAINT "SiteSetting_footerLogoId_fkey" FOREIGN KEY ("footerLogoId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;
