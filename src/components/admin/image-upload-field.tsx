"use client";

import { useState } from "react";
import { compressImageForUpload } from "@/lib/media/compress-image-client";

interface Props {
  name: string;
  label: string;
  defaultMediaId?: string | null;
  defaultUrl?: string | null;
}

export function ImageUploadField({ name, label, defaultMediaId, defaultUrl }: Props) {
  const [mediaId, setMediaId] = useState(defaultMediaId ?? "");
  const [previewUrl, setPreviewUrl] = useState(defaultUrl ?? "");
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const rawFile = event.target.files?.[0];
    if (!rawFile) return;

    setUploading(true);
    setError(null);

    try {
      const file = await compressImageForUpload(rawFile);
      const body = new FormData();
      body.set("file", file);
      const res = await fetch("/api/admin/media", { method: "POST", body });
      // A request Vercel's platform itself rejects for size (HTTP 413) comes back as plain text,
      // not JSON -- res.json() would throw and leave the real reason unreported.
      const json = await res.json().catch(() => null);

      if (!res.ok || !json) {
        setError(json?.error ?? `Upload failed (HTTP ${res.status}).`);
        return;
      }

      setMediaId(json.id);
      setPreviewUrl(json.url);
    } catch {
      setError("Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <label className="mb-1 block text-xs text-neutral-400">{label}</label>
      <input type="hidden" name={name} value={mediaId} />
      {previewUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={previewUrl} alt="" className="mb-2 h-20 w-20 rounded-md border border-neutral-700 object-cover" />
      ) : null}
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleChange}
        className="block w-full text-sm text-neutral-300 file:mr-3 file:rounded-md file:border-0 file:bg-neutral-800 file:px-3 file:py-1.5 file:text-sm file:text-neutral-200"
      />
      {uploading ? <p className="mt-1 text-xs text-neutral-500">Uploading...</p> : null}
      {error ? <p className="mt-1 text-xs text-red-400">{error}</p> : null}
    </div>
  );
}
