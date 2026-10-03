-- Redesign PHASE 8: per-locale page titles. Nullable; existing pages keep their slug-derived title until one is entered.

-- AlterTable
ALTER TABLE "Page" ADD COLUMN     "titleAr" TEXT,
ADD COLUMN     "titleEn" TEXT;
