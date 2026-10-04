"use client";

import { TextField, TextareaField, SelectField } from "@/components/admin/ui/field";
import type { BlockEditProps, BlockRenderProps } from "../../types";
import type { PageIntroData } from "../content-blocks";

/** Phase 7: a purpose-built block for the header/intro zone of otherwise-hardcoded catalog listing
 * pages (Products/Brands/Blog/Solutions index) -- mirrors `src/components/ui/section.tsx`'s
 * eyebrow/title/description props exactly (same fields, same render markup) so converting a page's
 * existing hardcoded header to this block is a zero-visual-change swap, not a redesign. Deliberately
 * NOT folded into HEADING/RICH_TEXT: those are single-field blocks, and this one's three fields
 * need to stay a single reorderable/duplicatable/hideable unit matching what today's pages already
 * show as one cohesive header. */
export function PageIntroEdit({ data, onChange, locale }: BlockEditProps<PageIntroData>) {
  const dir = locale === "ar" ? "rtl" : "ltr";
  return (
    <div className="space-y-3">
      <TextField label="Eyebrow (optional)" value={data.eyebrow ?? ""} onChange={(eyebrow) => onChange({ ...data, eyebrow })} dir={dir} />
      <TextField label="Title" value={data.title ?? ""} onChange={(title) => onChange({ ...data, title })} dir={dir} />
      <TextareaField label="Description (optional)" value={data.description ?? ""} onChange={(description) => onChange({ ...data, description })} dir={dir} rows={2} />
      <SelectField
        label="Title heading level"
        value={data.headingLevel ?? "h1"}
        onChange={(headingLevel) => onChange({ ...data, headingLevel })}
        options={[
          { value: "h1", label: "H1 — main page title (default)" },
          { value: "h2", label: "H2 — intro further down the page" },
        ]}
      />
    </div>
  );
}

export function PageIntroRender({ data }: BlockRenderProps<PageIntroData>) {
  if (!data.eyebrow && !data.title && !data.description) return null;
  return (
    <div className="max-w-2xl">
      {data.eyebrow ? <p className="manifest-strip mb-3 text-[var(--g7-gold-500)]">{data.eyebrow}</p> : null}
      {data.title ? (data.headingLevel === "h2" ? <h2 className="t-h2 text-[var(--g7-teal-900)]">{data.title}</h2> : <h1 className="t-h2 text-[var(--g7-teal-900)]">{data.title}</h1>) : null}
      {data.description ? <p className="t-p mt-4 font-light text-[var(--g7-muted)]">{data.description}</p> : null}
    </div>
  );
}
