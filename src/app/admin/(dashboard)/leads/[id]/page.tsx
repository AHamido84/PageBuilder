import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, assertCan } from "@/lib/rbac/current-user";
import { EditLeadForm } from "./edit-lead-form";
import { LeadNotes } from "./lead-notes";

export const dynamic = "force-dynamic";

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "leads", "read");

  const lead = await prisma.lead.findUnique({
    where: { id },
    include: { notes: { orderBy: { createdAt: "desc" }, include: { author: { select: { name: true } } } } },
  });

  if (!lead) notFound();

  return (
    <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
      <div>
        <h1 className="mb-6 text-lg font-semibold">{lead.contactName}</h1>
        <EditLeadForm lead={lead} />
      </div>
      <div>
        <LeadNotes
          leadId={lead.id}
          notes={lead.notes.map((n) => ({ id: n.id, body: n.body, createdAt: n.createdAt.toISOString(), authorName: n.author?.name ?? null }))}
        />
      </div>
    </div>
  );
}
