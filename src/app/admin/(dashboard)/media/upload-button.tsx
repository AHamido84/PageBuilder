"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminToast } from "@/components/admin/ui/toast";

export function UploadButton() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const toast = useAdminToast();
  const router = useRouter();

  async function handleFiles(files: FileList) {
    setUploading(true);
    let successCount = 0;
    const errors: string[] = [];
    for (const file of Array.from(files)) {
      const body = new FormData();
      body.set("file", file);
      try {
        const res = await fetch("/api/admin/media", { method: "POST", body });
        if (res.ok) {
          successCount++;
        } else {
          const json = await res.json().catch(() => null);
          errors.push(`${file.name}: ${json?.error ?? `HTTP ${res.status}`}`);
        }
      } catch {
        errors.push(`${file.name}: network error`);
      }
    }
    setUploading(false);
    if (successCount) toast.push({ title: `Uploaded ${successCount} file${successCount === 1 ? "" : "s"}`, tone: "success" });
    // Surfacing the real reason (not just a count) -- a generic "N file(s) failed" gives whoever
    // hits this nothing to act on, whether that's a real user or someone debugging the report.
    for (const message of errors) toast.push({ title: message, tone: "error" });
    router.refresh();
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,application/pdf,video/mp4,video/webm"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="rounded-md bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-900 disabled:opacity-60"
      >
        {uploading ? "Uploading..." : "Upload files"}
      </button>
    </>
  );
}
