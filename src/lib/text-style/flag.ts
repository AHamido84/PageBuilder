import { cache } from "react";
import { prisma } from "@/lib/prisma";

/** Public-site switch for admin text styling: Admin -> Settings; TEXT_STYLES_ENABLED=off|on overrides it. */
export const areTextStylesEnabled = cache(async (): Promise<boolean> => {
  const env = process.env.TEXT_STYLES_ENABLED?.trim().toLowerCase();
  if (env === "off" || env === "false" || env === "0") return false;
  if (env === "on" || env === "true" || env === "1") return true;
  const settings = await prisma.siteSetting.findUnique({ where: { id: "singleton" }, select: { textStylesEnabled: true } });
  return settings?.textStylesEnabled ?? false;
});
