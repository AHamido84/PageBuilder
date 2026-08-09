import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, assertCan } from "@/lib/rbac/current-user";
import type { Prisma, LeadStatus } from "@prisma/client";
import { LeadStatusSelect } from "./lead-status-select";
import { LeadsFilterBar } from "./filter-bar";

export const dynamic = "force-dynamic";

export default async function LeadsPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "leads", "read");
  const params = await searchParams;

  const where: Prisma.LeadWhereInput = {};
  if (params.status) where.status = params.status as LeadStatus;
  if (params.q) {
    where.OR = [
      { contactName: { contains: params.q, mode: "insensitive" } },
      { email: { contains: params.q, mode: "insensitive" } },
      { companyName: { contains: params.q, mode: "insensitive" } },
    ];
  }

  const leads = await prisma.lead.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { industry: { select: { nameEn: true } }, product: { select: { sku: true } } },
  });

  const canUpdate = currentUser.permissions.has("leads:update");

  return (
    <div>
      <h1 className="mb-6 text-lg font-semibold">Leads</h1>
      <LeadsFilterBar />
      <div className="overflow-hidden rounded-lg border border-neutral-800">
        <table className="w-full text-sm">
          <thead className="bg-neutral-900 text-left text-neutral-400">
            <tr>
              <th className="px-4 py-2">Contact</th>
              <th className="px-4 py-2">Company</th>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Industry</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Received</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id} className="border-t border-neutral-800 align-top">
                <td className="px-4 py-2">
                  <Link href={`/admin/leads/${lead.id}`} className="hover:underline">
                    {lead.contactName}
                  </Link>
                </td>
                <td className="px-4 py-2 text-neutral-400">{lead.companyName ?? "—"}</td>
                <td className="px-4 py-2 text-neutral-400">{lead.email}</td>
                <td className="px-4 py-2 text-neutral-400">{lead.industry?.nameEn ?? "—"}</td>
                <td className="px-4 py-2">
                  {canUpdate ? <LeadStatusSelect leadId={lead.id} status={lead.status} /> : lead.status}
                </td>
                <td className="px-4 py-2 text-neutral-500">{lead.createdAt.toLocaleDateString()}</td>
              </tr>
            ))}
            {leads.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-neutral-500">
                  No leads match those filters.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
