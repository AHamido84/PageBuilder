"use client";

import { TextField } from "@/components/admin/ui/field";
import type { BlockEditProps } from "../../types";
import type { ContactInfoData } from "../misc-blocks";

export function ContactInfoEdit({ data, onChange, locale }: BlockEditProps<ContactInfoData>) {
  return (
    <div className="space-y-3">
      <TextField label="Heading (optional)" value={data.heading ?? ""} onChange={(heading) => onChange({ ...data, heading })} dir={locale === "ar" ? "rtl" : "ltr"} />
      <p className="rounded-md bg-neutral-900 px-2 py-1.5 text-[11px] text-neutral-500">
        Location, email, phone, business hours, and map embed are pulled live from Settings → General/Contact/Hours — edit those there, not here.
      </p>
    </div>
  );
}

export function ContactInfoPreview({ data }: { data: ContactInfoData }) {
  return (
    <div className="rounded-md border border-dashed border-neutral-700 bg-neutral-900/50 p-8 text-center text-sm text-neutral-400">
      {data.heading ? <p className="mb-1 font-medium text-neutral-200">{data.heading}</p> : null}
      Live Contact Details — location, email, phone, hours, and map, pulled from Settings.
      <br />
      Renders on the published page with real business data.
    </div>
  );
}
