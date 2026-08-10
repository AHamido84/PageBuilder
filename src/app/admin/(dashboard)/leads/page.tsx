import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, assertCan } from "@/lib/rbac/current-user";
import type { Prisma, LeadStatus, LeadInquiryType } from "@prisma/client";
import { Pagination } from "@/components/admin/ui/pagination";
import { LeadStatusSelect } from "./lead-status-select";
import { LeadsFilterBar } from "./filter-bar";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;

interface LeadsPageProps {
  searchParams: Promise<{ q?: string; status?: string; type?: string; assignee?: string; page?: string }>;
}

export default async function LeadsPage({ searchParams }: LeadsPageProps) {
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "leads", "read");
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);

  const where: Prisma.LeadWhereInput = {};
  if (params.status) where.status = params.status as LeadStatus;
  if (params.type) where.inquiryType = params.type as LeadInquiryType;
  if (params.assignee) where.assigneeId = params.assignee === "unassigned" ? null : params.assignee;
  if (params.q) {
    where.OR = [
      { contactName: { contains: params.q, mode: "insensitive" } },
      { email: { contains: params.q, mode: "insensitive" } },
      { companyName: { contains: params.q, mode: "insensitive" } },
    ];
  }

  const [leads, total, users] = await Promise.all([
    prisma.lead.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { industry: { select: { nameEn: true } }, product: { select: { sku: true } }, assignee: { select: { id: true, name: true } } },
    }),
    prisma.lead.count({ where }),
    prisma.user.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const canUpdate = currentUser.permissions.has("leads:update");

  function hrefForPage(p: number) {
    const sp = new URLSearchParams();
    if (params.q) sp.set("q", params.q);
    if (params.status) sp.set("status", params.status);
    if (params.type) sp.set("type", params.type);
    if (params.assignee) sp.set("assignee", params.assignee);
    sp.set("page", String(p));
    return `?${sp.toString()}`;
  }

  return (
    <div>
      <h1 className="mb-6 text-lg font-semibold">Leads</h1>
      <LeadsFilterBar users={users} />
      <div className="overflow-hidden rounded-lg border border-neutral-800">
        <table className="w-full text-sm">
          <thead className="bg-neutral-900 text-left text-neutral-400">
            <tr>
              <th className="px-4 py-2">Contact</th>
              <th className="px-4 py-2">Company</th>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Product</th>
              <th className="px-4 py-2">Type</th>
              <th className="px-4 py-2">Assigned to</th>
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
                <td className="px-4 py-2 text-neutral-400">{lead.product?.sku ?? "—"}</td>
                <td className="px-4 py-2 text-neutral-400">{lead.inquiryType}</td>
                <td className="px-4 py-2 text-neutral-400">{lead.assignee?.name ?? "—"}</td>
                <td className="px-4 py-2">
                  {canUpdate ? <LeadStatusSelect leadId={lead.id} status={lead.status} /> : lead.status}
                </td>
                <td className="px-4 py-2 text-neutral-500">{lead.createdAt.toLocaleDateString()}</td>
              </tr>
            ))}
            {leads.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-neutral-500">
                  No leads match those filters.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <Pagination page={page} totalPages={totalPages} hrefForPage={hrefForPage} />
    </div>
  );
}
