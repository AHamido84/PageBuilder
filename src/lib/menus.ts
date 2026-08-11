import { prisma } from "@/lib/prisma";
import { resolveHref } from "@/lib/page-builder/href";
import { HOMEPAGE_SLUG } from "@/lib/page-builder/homepage";

export interface PublicMenuItem {
  id: string;
  label: string;
  href: string | null;
  children: PublicMenuItem[];
}

type MenuItemWithRelations = {
  id: string;
  labelEn: string;
  labelAr: string;
  url: string | null;
  parentId: string | null;
  page: { slug: string } | null;
  category: { slug: string } | null;
  product: { slug: string } | null;
};

function resolveItemHref(item: MenuItemWithRelations, locale: string): string | null {
  if (item.page) {
    return item.page.slug === HOMEPAGE_SLUG ? `/${locale}` : `/${locale}/${item.page.slug}`;
  }
  if (item.category) {
    return `/${locale}/products?category=${item.category.slug}`;
  }
  if (item.product) {
    return `/${locale}/products/${item.product.slug}`;
  }
  if (item.url) {
    return resolveHref(item.url, locale);
  }
  return null;
}

/** Reads a real admin-managed Menu (built at /admin/menus) for the public header or footer. Returns [] if the location has no menu yet. */
export async function getPublicMenu(location: "HEADER" | "FOOTER", locale: string): Promise<PublicMenuItem[]> {
  const menu = await prisma.menu.findUnique({
    where: { location },
    include: {
      items: {
        orderBy: { order: "asc" },
        include: {
          page: { select: { slug: true } },
          category: { select: { slug: true } },
          product: { select: { slug: true } },
        },
      },
    },
  });

  if (!menu || menu.items.length === 0) return [];

  const upperLocale = locale.toUpperCase();
  const byParent = new Map<string | null, MenuItemWithRelations[]>();
  for (const item of menu.items) {
    const list = byParent.get(item.parentId) ?? [];
    list.push(item);
    byParent.set(item.parentId, list);
  }

  function build(parentId: string | null): PublicMenuItem[] {
    const nodes = byParent.get(parentId) ?? [];
    return nodes.map((item) => ({
      id: item.id,
      label: upperLocale === "AR" ? item.labelAr : item.labelEn,
      href: resolveItemHref(item, locale),
      children: build(item.id),
    }));
  }

  return build(null);
}
