"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addProductImageAction, removeProductImageAction } from "../actions";

interface Props {
  productId: string;
  images: { id: string; url: string }[];
}

export function ProductImageGallery({ productId, images }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    try {
      const body = new FormData();
      body.set("file", file);
      const res = await fetch("/api/admin/media", { method: "POST", body });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Upload failed.");
        return;
      }
      await addProductImageAction(productId, json.id);
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
      <h2 className="mb-3 text-sm font-medium">Images</h2>
      <div className="mb-3 flex flex-wrap gap-3">
        {images.map((image) => (
          <div key={image.id} className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image.url} alt="" className="h-20 w-20 rounded-md border border-neutral-700 object-cover" />
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  await removeProductImageAction(productId, image.id);
                  router.refresh();
                })
              }
              className="absolute -right-1 -top-1 rounded-full bg-red-600 px-1.5 text-xs text-white"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleUpload}
        className="block text-sm text-neutral-300 file:mr-3 file:rounded-md file:border-0 file:bg-neutral-800 file:px-3 file:py-1.5 file:text-sm file:text-neutral-200"
      />
      {uploading ? <p className="mt-1 text-xs text-neutral-500">Uploading...</p> : null}
      {error ? <p className="mt-1 text-xs text-red-400">{error}</p> : null}
    </div>
  );
}
