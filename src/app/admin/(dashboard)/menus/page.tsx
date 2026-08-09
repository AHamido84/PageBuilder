import { prisma } from "@/lib/prisma";
import { getCurrentUser, assertCan } from "@/lib/rbac/current-user";
import { Tabs } from "@/components/admin/ui/tabs";
import { MenuEditor, type MenuItemNode } from "./menu-editor";

export const dynamic = "force-dynamic";

async function getMenuItems(location: "HEADER" | "FOOTER"): Promise<MenuItemNode[]> {
  const menu = await prisma.menu.findUnique({
    where: { location },
    include: {
      items: {
        orderBy: { order: "asc" },
        include: { page: true, category: { include: { translations: true } }, product: { include: { translations: true } } },
      },
    },
  });

  if (!menu) return [];

  return menu.items.map((item) => {
    let linkType: MenuItemNode["linkType"] = "URL";
    let targetId = "";
    let targetLabel = item.url ?? "—";

    if (item.pageId) {
      linkType = "PAGE";
      targetId = item.pageId;
      targetLabel = item.page?.slug ?? "";
    } else if (item.categoryId) {
      linkType = "CATEGORY";
      targetId = item.categoryId;
      targetLabel = item.category?.translations.find((t) => t.locale === "EN")?.name ?? item.category?.slug ?? "";
    } else if (item.productId) {
      linkType = "PRODUCT";
      targetId = item.productId;
      targetLabel = item.product?.translations.find((t) => t.locale === "EN")?.name ?? item.product?.sku ?? "";
    }

    return {
      id: item.id,
      labelEn: item.labelEn,
      labelAr: item.labelAr,
      linkType,
      targetId,
      url: item.url ?? "",
      targetLabel,
      parentId: item.parentId,
    };
  });
}

export default async function MenusPage() {
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "menus", "read");

  const [headerItems, footerItems, pages, categories, products] = await Promise.all([
    getMenuItems("HEADER"),
    getMenuItems("FOOTER"),
    prisma.page.findMany({ select: { id: true, slug: true }, orderBy: { slug: "asc" } }),
    prisma.category.findMany({ include: { translations: true }, orderBy: { slug: "asc" } }),
    prisma.product.findMany({ include: { translations: true }, orderBy: { sku: "asc" }, take: 200 }),
  ]);

  const pageOptions = pages.map((p) => ({ id: p.id, label: p.slug }));
  const categoryOptions = categories.map((c) => ({ id: c.id, label: c.translations.find((t) => t.locale === "EN")?.name ?? c.slug }));
  const productOptions = products.map((p) => ({ id: p.id, label: p.translations.find((t) => t.locale === "EN")?.name ?? p.sku }));

  return (
    <div>
      <h1 className="mb-6 text-lg font-semibold">Menus</h1>
      <Tabs
        items={[
          {
            key: "header",
            label: "Header menu",
            content: <MenuEditor location="HEADER" items={headerItems} pageOptions={pageOptions} categoryOptions={categoryOptions} productOptions={productOptions} />,
          },
          {
            key: "footer",
            label: "Footer menu",
            content: <MenuEditor location="FOOTER" items={footerItems} pageOptions={pageOptions} categoryOptions={categoryOptions} productOptions={productOptions} />,
          },
        ]}
      />
    </div>
  );
}
