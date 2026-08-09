"use client";

import Link from "next/link";
import { TextField, TextareaField } from "@/components/admin/ui/field";
import { buttonClasses } from "@/components/ui/button";
import type { BlockEditProps, BlockRenderProps } from "../../types";
import { resolveHref } from "../../href";
import type { CtaData } from "../content-blocks";

export function CtaEdit({ data, onChange, locale }: BlockEditProps<CtaData>) {
  const dir = locale === "ar" ? "rtl" : "ltr";
  return (
    <div className="space-y-3">
      <TextField label="Heading" value={data.heading ?? ""} onChange={(heading) => onChange({ ...data, heading })} dir={dir} />
      <TextareaField label="Body" value={data.body ?? ""} onChange={(body) => onChange({ ...data, body })} dir={dir} rows={2} />
      <div className="grid grid-cols-2 gap-3">
        <TextField label="Button label" value={data.ctaLabel} onChange={(ctaLabel) => onChange({ ...data, ctaLabel })} dir={dir} />
        <TextField label="Button URL" value={data.ctaUrl} onChange={(ctaUrl) => onChange({ ...data, ctaUrl })} />
      </div>
    </div>
  );
}

export function CtaRender({ data, locale }: BlockRenderProps<CtaData>) {
  return (
    <div className="mx-auto max-w-xl text-center">
      {data.heading ? <h2 className="font-display text-3xl">{data.heading}</h2> : null}
      {data.body ? <p className="mx-auto mt-4 opacity-65">{data.body}</p> : null}
      <Link href={resolveHref(data.ctaUrl, locale)} className={`${buttonClasses("primary", "lg")} mt-8 inline-flex`}>
        {data.ctaLabel}
      </Link>
    </div>
  );
}
