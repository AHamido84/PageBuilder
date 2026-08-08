import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function getCounts() {
  const [products, categories, leads, newLeads, users] = await Promise.all([
    prisma.product.count(),
    prisma.category.count(),
    prisma.lead.count(),
    prisma.lead.count({ where: { status: "NEW" } }),
    prisma.user.count(),
  ]);
  return { products, categories, leads, newLeads, users };
}

export default async function AdminDashboardPage() {
  const counts = await getCounts();

  const cards = [
    { label: "Products", value: counts.products },
    { label: "Categories", value: counts.categories },
    { label: "Leads (total)", value: counts.leads },
    { label: "Leads (new)", value: counts.newLeads },
    { label: "Users", value: counts.users },
  ];

  return (
    <div>
      <h1 className="mb-6 text-lg font-semibold">Dashboard</h1>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {cards.map((card) => (
          <div key={card.label} className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
            <p className="text-2xl font-semibold">{card.value}</p>
            <p className="text-sm text-neutral-400">{card.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
