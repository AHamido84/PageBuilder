"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateLeadStatusAction } from "./actions";

const STATUSES = ["NEW", "CONTACTED", "QUALIFIED", "IN_PROGRESS", "WON", "LOST"];

export function LeadStatusSelect({ leadId, status }: { leadId: string; status: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <select
      defaultValue={status}
      disabled={pending}
      onChange={(e) =>
        startTransition(async () => {
          await updateLeadStatusAction(leadId, e.target.value);
          router.refresh();
        })
      }
      className="rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1 text-xs"
    >
      {STATUSES.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  );
}
