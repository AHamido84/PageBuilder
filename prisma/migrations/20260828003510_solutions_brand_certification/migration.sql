-- AlterTable
ALTER TABLE "Brand" ADD COLUMN     "isFeatured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Certification" ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "Solution" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "icon" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "pageId" TEXT NOT NULL,

    CONSTRAINT "Solution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SolutionTranslation" (
    "id" TEXT NOT NULL,
    "solutionId" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "name" TEXT NOT NULL,
    "shortDescription" TEXT,

    CONSTRAINT "SolutionTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Solution_slug_key" ON "Solution"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Solution_pageId_key" ON "Solution"("pageId");

-- CreateIndex
CREATE INDEX "Solution_isPublished_idx" ON "Solution"("isPublished");

-- CreateIndex
CREATE INDEX "SolutionTranslation_locale_idx" ON "SolutionTranslation"("locale");

-- CreateIndex
CREATE UNIQUE INDEX "SolutionTranslation_solutionId_locale_key" ON "SolutionTranslation"("solutionId", "locale");

-- CreateIndex
CREATE INDEX "Brand_isFeatured_idx" ON "Brand"("isFeatured");

-- AddForeignKey
ALTER TABLE "Solution" ADD CONSTRAINT "Solution_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "Page"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolutionTranslation" ADD CONSTRAINT "SolutionTranslation_solutionId_fkey" FOREIGN KEY ("solutionId") REFERENCES "Solution"("id") ON DELETE CASCADE ON UPDATE CASCADE;
