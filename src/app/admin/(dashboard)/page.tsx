import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function getStats() {
  const [
    products,
    activeProducts,
    categories,
    brands,
    pages,
    draftPages,
    leads,
    newLeads,
    recentActivity,
    recentProducts,
    draftPageList,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { isPublished: true } }),
    prisma.category.count(),
    prisma.brand.count(),
    prisma.page.count(),
    prisma.page.count({ where: { status: "DRAFT" } }),
    prisma.lead.count(),
    prisma.lead.count({ where: { status: "NEW" } }),
    prisma.activityLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { user: { select: { name: true } } },
    }),
    prisma.product.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { translations: { where: { locale: "EN" } } },
    }),
    prisma.page.findMany({
      where: { status: "DRAFT" },
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: { id: true, slug: true, updatedAt: true },
    }),
  ]);

  return {
    products,
    activeProducts,
    categories,
    brands,
    pages,
    draftPages,
    leads,
    newLeads,
    recentActivity,
    recentProducts,
    draftPageList,
  };
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default async function AdminDashboardPage() {
  const stats = await getStats();

  const cards = [
    { label: "Total products", value: stats.products, href: "/admin/products" },
    { label: "Active products", value: stats.activeProducts, href: "/admin/products" },
    { label: "Categories", value: stats.categories, href: "/admin/categories" },
    { label: "Brands", value: stats.brands, href: "/admin/brands" },
    { label: "Pages", value: stats.pages, href: "/admin/pages" },
    { label: "Leads (total)", value: stats.leads, href: "/admin/leads" },
    { label: "New inquiries", value: stats.newLeads, href: "/admin/leads" },
    { label: "Draft pages", value: stats.draftPages, href: "/admin/pages" },
  ];

  return (
    <div>
      <h1 className="mb-6 text-lg font-semibold">Dashboard</h1>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="rounded-lg border border-neutral-800 bg-neutral-900 p-4 transition-colors hover:border-neutral-700"
          >
            <p className="text-2xl font-semibold">{card.value}</p>
            <p className="text-sm text-neutral-400">{card.label}</p>
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4 lg:col-span-1">
          <h2 className="mb-3 text-sm font-semibold">Recent activity</h2>
          {stats.recentActivity.length > 0 ? (
            <ul className="space-y-3">
              {stats.recentActivity.map((entry) => (
                <li key={entry.id} className="text-sm">
                  <p className="text-neutral-200">{entry.action}</p>
                  <p className="text-xs text-neutral-500">
                    {entry.user?.name ?? "System"} · {timeAgo(entry.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-neutral-500">No activity yet.</p>
          )}
        </div>

        <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4 lg:col-span-1">
          <h2 className="mb-3 text-sm font-semibold">Recent products</h2>
          {stats.recentProducts.length > 0 ? (
            <ul className="space-y-3">
              {stats.recentProducts.map((product) => (
                <li key={product.id} className="text-sm">
                  <Link href={`/admin/products/${product.id}`} className="text-neutral-200 hover:underline">
                    {product.translations[0]?.name ?? product.sku}
                  </Link>
                  <p className="text-xs text-neutral-500">{product.sku}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-neutral-500">No products yet.</p>
          )}
        </div>

        <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4 lg:col-span-1">
          <h2 className="mb-3 text-sm font-semibold">Draft pages</h2>
          {stats.draftPageList.length > 0 ? (
            <ul className="space-y-3">
              {stats.draftPageList.map((page) => (
                <li key={page.id} className="text-sm">
                  <Link href={`/admin/pages/${page.id}`} className="text-neutral-200 hover:underline">
                    {page.slug}
                  </Link>
                  <p className="text-xs text-neutral-500">Updated {timeAgo(page.updatedAt)}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-neutral-500">No drafts.</p>
          )}
        </div>
      </div>
    </div>
  );
}
