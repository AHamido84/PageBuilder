import { cache } from "react";
import { prisma } from "@/lib/prisma";

/**
 * Public switch for the builder-driven /products and product pages (Admin -> Settings);
 * PRODUCTS_PAGE_BUILDER=off|on overrides it (off = instant rollback without touching the DB).
 * Off = the routes render their built-in pages exactly as before.
 */
export const isProductsPageBuilderEnabled = cache(async (): Promise<boolean> => {
  const env = process.env.PRODUCTS_PAGE_BUILDER?.trim().toLowerCase();
  if (env === "off" || env === "false" || env === "0") return false;
  if (env === "on" || env === "true" || env === "1") return true;
  const settings = await prisma.siteSetting.findUnique({ where: { id: "singleton" }, select: { productsPageBuilderEnabled: true } });
  return settings?.productsPageBuilderEnabled ?? false;
});
