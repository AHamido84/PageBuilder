"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MediaPickerControlled } from "@/components/admin/ui/media-picker-field";

interface Props {
  productId: string;
  mainImage: { id: string; url: string } | null;
  mobileImage: { id: string; url: string } | null;
  /** First gallery image -- what cards show while no main image is picked. */
  fallbackUrl: string | null;
  setAction: (productId: string, slot: "main" | "mobile", mediaId: string) => Promise<{ error?: string }>;
}

/** Redesign PHASE 7: the product's main image (cards, listings, first gallery slide) and optional mobile-only variant. */
export function ProductKeyImages({ productId, mainImage, mobileImage, fallbackUrl, setAction }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function save(slot: "main" | "mobile", mediaId: string) {
    setError(null);
    startTransition(async () => {
      const result = await setAction(productId, slot, mediaId);
      if (result?.error) setError(result.error);
      router.refresh();
    });
  }

  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
      <h2 className="mb-1 text-sm font-medium">Main &amp; mobile image</h2>
      <p className="mb-4 text-xs text-neutral-500">
        The main image represents this product on cards and listings and opens its gallery.
        {!mainImage ? (fallbackUrl ? " None picked — the first gallery image is used." : " None picked and the gallery is empty — cards show the SKU.") : null}
      </p>
      <div className={`grid gap-6 sm:grid-cols-2 ${pending ? "opacity-60" : ""}`}>
        <MediaPickerControlled
          label="Main image"
          uploadFolderName="Products"
          mediaId={mainImage?.id ?? ""}
          previewUrl={mainImage?.url}
          onChange={(id) => save("main", id)}
        />
        <MediaPickerControlled
          label="Mobile image (optional — shown on phones instead of the main image)"
          uploadFolderName="Products"
          mediaId={mobileImage?.id ?? ""}
          previewUrl={mobileImage?.url}
          onChange={(id) => save("mobile", id)}
        />
      </div>
      {error ? <p className="mt-3 text-xs text-red-400">{error}</p> : null}
    </div>
  );
}
