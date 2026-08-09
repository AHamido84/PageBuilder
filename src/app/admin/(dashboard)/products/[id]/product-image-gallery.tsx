"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addProductImageAction, removeProductImageAction } from "../actions";

interface GalleryItem {
  id: string;
  url: string;
  type: "IMAGE" | "DOCUMENT" | "VIDEO";
}

interface Props {
  productId: string;
  images: GalleryItem[];
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
      <h2 className="mb-3 text-sm font-medium">Gallery (images &amp; videos)</h2>
      <div className="mb-3 flex flex-wrap gap-3">
        {images.map((item) => (
          <div key={item.id} className="relative">
            {item.type === "IMAGE" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.url} alt="" className="h-20 w-20 rounded-md border border-neutral-700 object-cover" />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-md border border-neutral-700 bg-neutral-800 text-2xl">
                🎬
              </div>
            )}
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  await removeProductImageAction(productId, item.id);
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
        accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
        onChange={handleUpload}
        className="block text-sm text-neutral-300 file:mr-3 file:rounded-md file:border-0 file:bg-neutral-800 file:px-3 file:py-1.5 file:text-sm file:text-neutral-200"
      />
      {uploading ? <p className="mt-1 text-xs text-neutral-500">Uploading...</p> : null}
      {error ? <p className="mt-1 text-xs text-red-400">{error}</p> : null}
    </div>
  );
}
