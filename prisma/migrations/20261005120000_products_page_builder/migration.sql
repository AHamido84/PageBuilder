-- Products page in the Page Builder (feat/products-page-builder). Additive only: two columns with
-- defaults, no data rewritten. Rollback: switch productsPageBuilderEnabled off (or PRODUCTS_PAGE_BUILDER=off).
ALTER TABLE "Page" ADD COLUMN "isSystem" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "SiteSetting" ADD COLUMN "productsPageBuilderEnabled" BOOLEAN NOT NULL DEFAULT false;
