"use client";

import { TextField, styledProps } from "@/components/admin/ui/field";
import type { BlockEditProps } from "../../types";
import type { SolutionsGridData } from "../commerce-blocks";

export function SolutionsGridEdit({ data, onChange, locale }: BlockEditProps<SolutionsGridData>) {
  return (
    <div className="space-y-3">
      <TextField label="Heading" {...styledProps(data, "heading", onChange)} dir={locale === "ar" ? "rtl" : "ltr"} />
      <TextField
        label="Limit (optional)"
        value={data.limit != null ? String(data.limit) : ""}
        onChange={(v) => {
          const n = v.trim() === "" ? undefined : Math.max(1, Math.min(24, Number(v) || 1));
          onChange({ ...data, limit: n });
        }}
      />
      <p className="text-xs text-neutral-500">
        Shows published solutions from Solutions Management (/admin/solutions), ordered exactly as configured there -- same catalog the public /solutions index page reads from.
      </p>
    </div>
  );
}

export function SolutionsGridPreview({ data }: { data: SolutionsGridData }) {
  return (
    <div className="rounded-md border border-dashed border-neutral-700 bg-neutral-900/50 p-8 text-center text-sm text-neutral-400">
      {data.heading ? <p className="mb-1 font-medium text-neutral-200">{data.heading}</p> : null}
      Live Solutions Grid — published solutions{data.limit ? `, up to ${data.limit}` : ""}.
    </div>
  );
}
