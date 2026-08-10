import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, can } from "@/lib/rbac/current-user";
import type { Prisma } from "@prisma/client";

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || !can(user, "leads", "read")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const type = searchParams.get("type");
  const assignee = searchParams.get("assignee");
  const q = searchParams.get("q");

  const where: Prisma.LeadWhereInput = {};
  if (status) where.status = status as Prisma.EnumLeadStatusFilter["equals"];
  if (type) where.inquiryType = type as Prisma.EnumLeadInquiryTypeFilter["equals"];
  if (assignee) where.assigneeId = assignee === "unassigned" ? null : assignee;
  if (q) {
    where.OR = [
      { contactName: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { companyName: { contains: q, mode: "insensitive" } },
    ];
  }

  const leads = await prisma.lead.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { industry: { select: { nameEn: true } }, product: { select: { sku: true } }, assignee: { select: { name: true } } },
  });

  const header = ["Contact name", "Company", "Email", "Phone", "Type", "Status", "Assigned to", "Industry", "Product SKU", "Message", "Received"];
  const rows = leads.map((lead) => [
    lead.contactName,
    lead.companyName ?? "",
    lead.email,
    lead.phone ?? "",
    lead.inquiryType,
    lead.status,
    lead.assignee?.name ?? "",
    lead.industry?.nameEn ?? "",
    lead.product?.sku ?? "",
    (lead.message ?? "").replace(/\r?\n/g, " "),
    lead.createdAt.toISOString(),
  ]);

  const csv = [header, ...rows].map((row) => row.map((cell) => csvEscape(String(cell))).join(",")).join("\r\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="leads-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
