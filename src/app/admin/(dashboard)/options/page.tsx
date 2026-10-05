import { prisma } from "@/lib/prisma";
import { getCurrentUser, assertCan } from "@/lib/rbac/current-user";
import { OptionsLibrary } from "./options-library";
import { safeRichMap } from "@/lib/text-style/rich-text";

export const dynamic = "force-dynamic";

export default async function ProductOptionsPage() {
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "products", "read");

  const [types, settings] = await Promise.all([
    prisma.optionType.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      include: {
        productOptions: {
          select: { product: { select: { id: true, sku: true, translations: { where: { locale: "AR" }, select: { name: true } } } } },
        },
      },
    }),
    prisma.siteSetting.findUnique({ where: { id: "singleton" }, select: { variantsEnabled: true } }),
  ]);
  const envOverride = process.env.VARIANTS_ENABLED?.trim().toLowerCase() || null;

  return (
    <div dir="rtl" lang="ar">
      <h1 className="mb-2 text-lg font-semibold">مكتبة خيارات المنتجات</h1>
      <p className="mb-6 text-sm text-neutral-500">
        خيارات عامة يمكن استخدامها في أي منتج بأنواع (الوزن، المقاس، القطعية…). المفتاح يظهر في روابط الموقع، مثل <span dir="ltr" className="font-mono">?size=7mm</span>.
      </p>
      <OptionsLibrary
        canUpdate={currentUser.permissions.has("products:update")}
        canDelete={currentUser.permissions.has("products:delete")}
        canToggleSite={currentUser.permissions.has("settings:update")}
        variantsEnabled={settings?.variantsEnabled ?? false}
        envOverride={envOverride}
        types={types.map((t) => ({
          id: t.id,
          key: t.key,
          labelAr: t.labelAr,
          labelEn: t.labelEn,
          display: t.display,
          rich: safeRichMap(t.rich),
          usedBy: t.productOptions.map((po) => ({ id: po.product.id, label: po.product.translations[0]?.name ?? po.product.sku })),
        }))}
      />
    </div>
  );
}
