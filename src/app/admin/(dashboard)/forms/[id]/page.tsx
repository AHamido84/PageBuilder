import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, assertCan } from "@/lib/rbac/current-user";
import { Tabs } from "@/components/admin/ui/tabs";
import { EditFormForm } from "./edit-form-form";
import { SubmissionStatusSelect } from "./submission-status-select";

export const dynamic = "force-dynamic";

export default async function EditFormPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "forms", "update");

  const form = await prisma.form.findUnique({
    where: { id },
    include: { submissions: { orderBy: { createdAt: "desc" }, take: 100 } },
  });

  if (!form) notFound();

  return (
    <div>
      <h1 className="mb-6 text-lg font-semibold">{form.nameEn}</h1>
      <Tabs
        items={[
          { key: "details", label: "Details", content: <EditFormForm form={form} /> },
          {
            key: "submissions",
            label: `Submissions (${form.submissions.length})`,
            content: (
              <div className="space-y-2">
                {form.submissions.map((submission) => (
                  <div key={submission.id} className="rounded-md border border-neutral-800 bg-neutral-900 p-3">
                    <div className="mb-1 flex items-center justify-between">
                      <p className="text-xs text-neutral-500">{submission.createdAt.toLocaleString()}</p>
                      <SubmissionStatusSelect submissionId={submission.id} status={submission.status} />
                    </div>
                    <pre className="whitespace-pre-wrap break-words text-xs text-neutral-300">
                      {JSON.stringify(submission.data, null, 2)}
                    </pre>
                  </div>
                ))}
                {form.submissions.length === 0 ? <p className="text-sm text-neutral-500">No submissions yet.</p> : null}
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
