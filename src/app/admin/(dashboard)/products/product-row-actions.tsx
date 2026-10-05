"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { togglePublishAction, toggleFeatureAction, duplicateProductAction } from "./actions";
import { DeleteProductButton } from "./delete-product-button";
import { useAdminToast } from "@/components/admin/ui/toast";
import { useConfirm } from "@/components/admin/ui/confirm-dialog";
import { convertToVariantProductAction } from "./variant-actions";

export function ProductRowActions({
  productId,
  isPublished,
  isFeatured,
  canDelete,
  isVariant = false,
}: {
  productId: string;
  isPublished: boolean;
  isFeatured: boolean;
  canDelete: boolean;
  isVariant?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const toast = useAdminToast();
  const confirm = useConfirm();

  return (
    <div className="flex items-center justify-end gap-3 text-sm">
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(async () => { await togglePublishAction(productId, !isPublished); router.refresh(); })}
        className="text-neutral-400 hover:text-neutral-100 disabled:opacity-60"
      >
        {isPublished ? "Unpublish" : "Publish"}
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(async () => { await toggleFeatureAction(productId, !isFeatured); router.refresh(); })}
        className={isFeatured ? "text-amber-400 hover:text-amber-300" : "text-neutral-400 hover:text-neutral-100"}
      >
        {isFeatured ? "★ Featured" : "☆ Feature"}
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await duplicateProductAction(productId);
            if (result.error) toast.push({ title: "Couldn't duplicate", description: result.error, tone: "error" });
            else {
              toast.push({ title: "Product duplicated", tone: "success" });
              router.refresh();
            }
          })
        }
        className="text-neutral-400 hover:text-neutral-100 disabled:opacity-60"
      >
        Duplicate
      </button>
      {!isVariant ? (
        <button
          type="button"
          disabled={pending}
          onClick={async () => {
            const ok = await confirm({
              title: "تحويل إلى منتج بأنواع؟",
              description: "صور المنتج ووزنه وتعبئته الحالية تصبح النوع الأول. بعدها أضف الخيارات (مثل المقاس) من تبويب «الأنواع».",
              confirmLabel: "تحويل",
              cancelLabel: "إلغاء",
            });
            if (!ok) return;
            startTransition(async () => {
              const result = await convertToVariantProductAction(productId);
              if (!result.ok) toast.push({ title: result.error ?? "تعذر التحويل", tone: "error" });
              else router.push(`/admin/products/${productId}`);
            });
          }}
          className="text-neutral-400 hover:text-neutral-100 disabled:opacity-60"
        >
          تحويل لمنتج بأنواع
        </button>
      ) : null}
      {canDelete ? <DeleteProductButton productId={productId} /> : null}
    </div>
  );
}
