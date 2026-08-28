"use client";

import { TextField } from "@/components/admin/ui/field";
import type { BlockEditProps } from "../../types";
import type { CertificationsGridData } from "../commerce-blocks";

export function CertificationsGridEdit({ data, onChange, locale }: BlockEditProps<CertificationsGridData>) {
  return (
    <div className="space-y-3">
      <TextField label="Heading" value={data.heading ?? ""} onChange={(heading) => onChange({ ...data, heading })} dir={locale === "ar" ? "rtl" : "ltr"} />
      <TextField
        label="Limit (optional)"
        value={data.limit != null ? String(data.limit) : ""}
        onChange={(v) => {
          const n = v.trim() === "" ? undefined : Math.max(1, Math.min(24, Number(v) || 1));
          onChange({ ...data, limit: n });
        }}
      />
      <p className="text-xs text-neutral-500">Shows published certifications from Certification Management, in their configured order.</p>
    </div>
  );
}

export function CertificationsGridPreview({ data }: { data: CertificationsGridData }) {
  return (
    <div className="rounded-md border border-dashed border-neutral-700 bg-neutral-900/50 p-8 text-center text-sm text-neutral-400">
      {data.heading ? <p className="mb-1 font-medium text-neutral-200">{data.heading}</p> : null}
      Live Certifications Grid — published certifications{data.limit ? `, up to ${data.limit}` : ""}.
    </div>
  );
}
