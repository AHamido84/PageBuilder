"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { UploadButton } from "./upload-button";

export function MediaFilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <input
        type="search"
        defaultValue={searchParams.get("q") ?? ""}
        onChange={(e) => update("q", e.target.value)}
        placeholder="Search files..."
        className="rounded-md border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-sm"
      />
      <select
        defaultValue={searchParams.get("type") ?? ""}
        onChange={(e) => update("type", e.target.value)}
        className="rounded-md border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-sm"
      >
        <option value="">All types</option>
        <option value="IMAGE">Images</option>
        <option value="VIDEO">Videos</option>
        <option value="DOCUMENT">Documents</option>
      </select>
      <div className="ml-auto">
        <UploadButton />
      </div>
    </div>
  );
}
