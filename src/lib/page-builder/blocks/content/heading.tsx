"use client";

import { SelectField, TextField } from "@/components/admin/ui/field";
import type { BlockEditProps, BlockRenderProps } from "../../types";
import { resolveHeadingClasses } from "../../style-tokens";
import type { HeadingData } from "../content-blocks";

export function HeadingEdit({ data, onChange, locale }: BlockEditProps<HeadingData>) {
  return (
    <div className="space-y-3">
      <TextField label="Text" value={data.text} onChange={(text) => onChange({ ...data, text })} dir={locale === "ar" ? "rtl" : "ltr"} />
      <SelectField
        label="Level"
        value={data.level}
        onChange={(level) => onChange({ ...data, level })}
        options={[
          { value: "h1", label: "H1 — page title" },
          { value: "h2", label: "H2 — section heading" },
          { value: "h3", label: "H3 — sub-heading" },
        ]}
      />
    </div>
  );
}

export function HeadingRender({ data, settings }: BlockRenderProps<HeadingData>) {
  const Tag = data.level;
  return <Tag className={`font-display ${resolveHeadingClasses(settings)}`}>{data.text}</Tag>;
}
