"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckboxField } from "@/components/admin/ui/field";
import { updateRelatedProductsAction, updateProductCertificationsAction } from "../actions";

interface Option {
  id: string;
  label: string;
}

interface Props {
  productId: string;
  otherProducts: Option[];
  selectedRelatedIds: string[];
  certifications: Option[];
  selectedCertificationIds: string[];
}

export function ProductRelationsPicker({ productId, otherProducts, selectedRelatedIds, certifications, selectedCertificationIds }: Props) {
  const [related, setRelated] = useState(new Set(selectedRelatedIds));
  const [certs, setCerts] = useState(new Set(selectedCertificationIds));
  const [, startTransition] = useTransition();
  const router = useRouter();

  function toggleRelated(id: string, checked: boolean) {
    const next = new Set(related);
    if (checked) next.add(id);
    else next.delete(id);
    setRelated(next);
    startTransition(async () => {
      await updateRelatedProductsAction(productId, Array.from(next));
      router.refresh();
    });
  }

  function toggleCert(id: string, checked: boolean) {
    const next = new Set(certs);
    if (checked) next.add(id);
    else next.delete(id);
    setCerts(next);
    startTransition(async () => {
      await updateProductCertificationsAction(productId, Array.from(next));
      router.refresh();
    });
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
      <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
        <h2 className="mb-3 text-sm font-medium">Related products</h2>
        <div className="max-h-72 space-y-1 overflow-y-auto">
          {otherProducts.length === 0 ? (
            <p className="text-xs text-neutral-500">No other products yet.</p>
          ) : (
            otherProducts.map((p) => (
              <CheckboxField key={p.id} label={p.label} checked={related.has(p.id)} onChange={(checked) => toggleRelated(p.id, checked)} />
            ))
          )}
        </div>
      </div>
      <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
        <h2 className="mb-3 text-sm font-medium">Certifications</h2>
        <div className="max-h-72 space-y-1 overflow-y-auto">
          {certifications.length === 0 ? (
            <p className="text-xs text-neutral-500">No certifications published yet — add them under Certifications in the sidebar.</p>
          ) : (
            certifications.map((c) => (
              <CheckboxField key={c.id} label={c.label} checked={certs.has(c.id)} onChange={(checked) => toggleCert(c.id, checked)} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
