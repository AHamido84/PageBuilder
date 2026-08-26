"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FileText, Video as VideoIcon, X } from "lucide-react";
import { compressImageForUpload } from "@/lib/media/compress-image-client";

interface Item {
  id: string;
  url: string;
  originalName: string;
}

interface Props {
  productId: string;
  label: string;
  items: Item[];
  accept: "IMAGE" | "VIDEO" | "DOCUMENT";
  addAction: (productId: string, mediaId: string) => Promise<{ error?: string }>;
  removeAction: (productId: string, mediaId: string) => Promise<{ error?: string }>;
}

const ACCEPT_ATTR: Record<Props["accept"], string> = {
  IMAGE: "image/jpeg,image/png,image/webp,image/svg+xml",
  VIDEO: "video/mp4,video/webm",
  DOCUMENT: "application/pdf",
};

export function ProductMediaCollection({ productId, label, items, accept, addAction, removeAction }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
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
      await addAction(productId, json.id);
      router.refresh();
    } catch {
      setError("Upload failed.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
      <h2 className="mb-3 text-sm font-medium">{label}</h2>
      {items.length > 0 ? (
        <div className="mb-3 flex flex-wrap gap-3">
          {items.map((item) => (
            <div key={item.id} className="relative">
              {accept === "IMAGE" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.url} alt="" className="h-20 w-20 rounded-md border border-neutral-700 object-cover" />
              ) : (
                <div className="flex h-20 w-32 flex-col items-center justify-center gap-1 rounded-md border border-neutral-700 bg-neutral-800 px-2 text-center">
                  {accept === "VIDEO" ? <VideoIcon size={18} className="text-neutral-400" /> : <FileText size={18} className="text-neutral-400" />}
                  <span className="truncate text-[10px] text-neutral-400" title={item.originalName}>
                    {item.originalName}
                  </span>
                </div>
              )}
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    await removeAction(productId, item.id);
                    router.refresh();
                  })
                }
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-white hover:bg-red-500"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="mb-3 text-xs text-neutral-500">None yet.</p>
      )}
      <input
        type="file"
        accept={ACCEPT_ATTR[accept]}
        onChange={handleUpload}
        className="block text-sm text-neutral-300 file:mr-3 file:rounded-md file:border-0 file:bg-neutral-800 file:px-3 file:py-1.5 file:text-sm file:text-neutral-200"
      />
      {uploading ? <p className="mt-1 text-xs text-neutral-500">Uploading...</p> : null}
      {error ? <p className="mt-1 text-xs text-red-400">{error}</p> : null}
    </div>
  );
}
