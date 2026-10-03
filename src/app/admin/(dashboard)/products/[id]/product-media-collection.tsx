"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FileText, ImagePlus, Video as VideoIcon, X } from "lucide-react";
import { MultiMediaPickerButton, type MediaListItem } from "@/components/admin/ui/media-library-modal";

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
  /** PHASE 7 (gallery only): the current main image id + a "Set as main" action per image. */
  mainId?: string | null;
  setMainAction?: (productId: string, mediaId: string) => Promise<{ error?: string }>;
}

const ADD_LABEL: Record<Props["accept"], string> = {
  IMAGE: "Add images from Media Library...",
  VIDEO: "Add videos from Media Library...",
  DOCUMENT: "Add documents from Media Library...",
};

/** Product gallery/videos/documents. Files are picked (or uploaded, into the "Products" folder) through the shared Media Library. */
export function ProductMediaCollection({ productId, label, items, accept, addAction, removeAction, mainId, setMainAction }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function addPicked(picked: MediaListItem[]) {
    const existing = new Set(items.map((i) => i.id));
    const toAdd = picked.filter((p) => !existing.has(p.id));
    if (toAdd.length === 0) return;
    setError(null);
    startTransition(async () => {
      // Sequential so gallery order follows the order files were picked in.
      for (const item of toAdd) {
        const result = await addAction(productId, item.id);
        if (result?.error) {
          setError(result.error);
          break;
        }
      }
      router.refresh();
    });
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
                <img src={item.url} alt="" loading="lazy" className="h-20 w-20 rounded-md border border-neutral-700 object-cover" />
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
                aria-label={`Remove ${item.originalName}`}
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
              {setMainAction ? (
                item.id === mainId ? (
                  <span className="absolute inset-x-0 bottom-0 rounded-b-md bg-amber-500/90 py-0.5 text-center text-[10px] font-medium text-neutral-950">Main</span>
                ) : (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() =>
                      startTransition(async () => {
                        const result = await setMainAction(productId, item.id);
                        if (result?.error) setError(result.error);
                        router.refresh();
                      })
                    }
                    className="absolute inset-x-0 bottom-0 rounded-b-md bg-neutral-950/80 py-0.5 text-center text-[10px] text-neutral-300 hover:bg-neutral-800"
                  >
                    Set as main
                  </button>
                )
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <p className="mb-3 text-xs text-neutral-500">None yet.</p>
      )}
      <MultiMediaPickerButton
        label={ADD_LABEL[accept]}
        accept={accept}
        uploadFolderName="Products"
        onConfirm={addPicked}
        className="inline-flex items-center gap-1.5 rounded-md border border-neutral-700 px-3 py-1.5 text-sm text-neutral-300 hover:bg-neutral-800"
      />
      {pending ? <p className="mt-1 text-xs text-neutral-500">Saving...</p> : null}
      {error ? <p className="mt-1 text-xs text-red-400">{error}</p> : null}
      <p className="mt-2 flex items-center gap-1 text-[11px] text-neutral-600">
        <ImagePlus size={11} /> Removing a file here only detaches it from this product; it stays in the Media Library.
      </p>
    </div>
  );
}
