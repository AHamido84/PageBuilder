"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { markSubmissionAction } from "../actions";

export function SubmissionStatusSelect({ submissionId, status }: { submissionId: string; status: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <select
      defaultValue={status}
      disabled={pending}
      onChange={(e) =>
        startTransition(async () => {
          await markSubmissionAction(submissionId, e.target.value as "NEW" | "REVIEWED" | "SPAM");
          router.refresh();
        })
      }
      className="rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1 text-xs"
    >
      <option value="NEW">New</option>
      <option value="REVIEWED">Reviewed</option>
      <option value="SPAM">Spam</option>
    </select>
  );
}
