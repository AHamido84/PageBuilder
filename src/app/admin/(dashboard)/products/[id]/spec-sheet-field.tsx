"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { MediaPickerField } from "@/components/admin/ui/media-picker-field";
import { setProductSpecSheetAction } from "../actions";

export function SpecSheetField({
  productId,
  defaultMediaId,
  defaultUrl,
}: {
  productId: string;
  defaultMediaId: string | null;
  defaultUrl: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleSelect(mediaId: string) {
    startTransition(async () => {
      await setProductSpecSheetAction(productId, mediaId || null);
      router.refresh();
    });
  }

  return (
    <div>
      <MediaPickerField
        name="_specSheetPicker"
        label="Spec sheet (PDF)"
        accept="DOCUMENT"
        defaultMediaId={defaultMediaId}
        defaultUrl={defaultUrl}
        onSelect={handleSelect}
      />
      {pending ? <p className="mt-1 text-xs text-neutral-500">Saving...</p> : null}
    </div>
  );
}
