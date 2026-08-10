"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTransition } from "react";

const STATUSES = ["NEW", "CONTACTED", "QUALIFIED", "IN_PROGRESS", "WON", "LOST"];
const TYPES = ["GENERAL", "INFO", "QUOTE", "BECOME_CUSTOMER", "SALES_INQUIRY"];

interface LeadsFilterBarProps {
  users: { id: string; name: string }[];
}

export function LeadsFilterBar({ users }: LeadsFilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("page");
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }

  const exportHref = `/api/admin/leads/export?${searchParams.toString()}`;

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <input
        type="search"
        defaultValue={searchParams.get("q") ?? ""}
        onChange={(e) => update("q", e.target.value)}
        placeholder="Search name, email, company..."
        className="rounded-md border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-sm"
      />
      <select
        defaultValue={searchParams.get("status") ?? ""}
        onChange={(e) => update("status", e.target.value)}
        className="rounded-md border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-sm"
      >
        <option value="">All statuses</option>
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      <select
        defaultValue={searchParams.get("type") ?? ""}
        onChange={(e) => update("type", e.target.value)}
        className="rounded-md border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-sm"
      >
        <option value="">All types</option>
        {TYPES.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>
      <select
        defaultValue={searchParams.get("assignee") ?? ""}
        onChange={(e) => update("assignee", e.target.value)}
        className="rounded-md border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-sm"
      >
        <option value="">All assignees</option>
        <option value="unassigned">Unassigned</option>
        {users.map((u) => (
          <option key={u.id} value={u.id}>
            {u.name}
          </option>
        ))}
      </select>
      <a href={exportHref} className="ml-auto rounded-md border border-neutral-700 px-3 py-1.5 text-sm text-neutral-300 hover:bg-neutral-800">
        Export CSV
      </a>
    </div>
  );
}
