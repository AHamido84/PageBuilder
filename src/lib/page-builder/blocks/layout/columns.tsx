"use client";

import Link from "next/link";
import { TextField, TextareaField } from "@/components/admin/ui/field";
import { MediaPickerControlled } from "@/components/admin/ui/media-picker-field";
import type { BlockEditProps, BlockRenderProps } from "../../types";
import { resolveHref } from "../../href";
import type { ColumnsData } from "../layout-blocks";

const GRID_CLASS: Record<number, string> = {
  2: "grid gap-8 sm:grid-cols-2",
  3: "grid gap-8 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid gap-8 sm:grid-cols-2 lg:grid-cols-4",
};

function emptyItem(): ColumnsData["items"][number] {
  return { heading: "", body: "", image: null, linkUrl: "", linkLabel: "" };
}

/**
 * Shared implementation for the Two/Three/Four Columns blocks. NOT a factory
 * called at module scope -- this file is "use client", and calling an exported
 * function from server code (like a block-registry array built in a server
 * module) breaks the RSC boundary. Each column-count variant below is instead
 * a real, directly-exported component that simply passes `count` as a closed-over
 * constant, so it can be referenced (not invoked) from server code safely.
 */
function ColumnsEditImpl({ count, data, onChange, locale }: BlockEditProps<ColumnsData> & { count: number }) {
  const dir = locale === "ar" ? "rtl" : "ltr";
  function setItem(i: number, next: ColumnsData["items"][number]) {
    const items = Array.from({ length: count }, (_, idx) => (idx === i ? next : data.items[idx] ?? emptyItem()));
    onChange({ items });
  }
  const items = Array.from({ length: count }, (_, i) => data.items[i] ?? emptyItem());
  return (
    <div className="space-y-4">
      {items.map((item, i) => (
        <div key={i} className="space-y-2 rounded-md border border-neutral-800 p-3">
          <p className="text-xs font-medium text-neutral-500">Column {i + 1}</p>
          <TextField label="Heading" value={item.heading} onChange={(heading) => setItem(i, { ...item, heading })} dir={dir} />
          <TextareaField label="Body" value={item.body} onChange={(body) => setItem(i, { ...item, body })} dir={dir} rows={2} />
          <MediaPickerControlled label="Image" mediaId={item.image?.id ?? ""} previewUrl={item.image?.url} onChange={(id, url) => setItem(i, { ...item, image: id ? { id, url } : null })} />
          <div className="grid grid-cols-2 gap-2">
            <TextField label="Link label" value={item.linkLabel} onChange={(linkLabel) => setItem(i, { ...item, linkLabel })} />
            <TextField label="Link URL" value={item.linkUrl} onChange={(linkUrl) => setItem(i, { ...item, linkUrl })} />
          </div>
        </div>
      ))}
    </div>
  );
}

function ColumnsRenderImpl({ count, data, locale }: BlockRenderProps<ColumnsData> & { count: number }) {
  const items = Array.from({ length: count }, (_, i) => data.items[i]).filter(Boolean) as ColumnsData["items"];
  return (
    <div className={GRID_CLASS[count]}>
      {items.map((item, i) => (
        <div key={i}>
          {item.image?.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.image.url} alt="" className="mb-4 aspect-[4/3] w-full rounded-[var(--radius-md)] object-cover" />
          ) : null}
          {item.heading ? <h3 className="font-display text-xl">{item.heading}</h3> : null}
          {item.body ? <p className="mt-2 text-sm opacity-70">{item.body}</p> : null}
          {item.linkLabel && item.linkUrl ? (
            <Link href={resolveHref(item.linkUrl, locale)} className="mt-3 inline-block text-sm underline opacity-80 hover:opacity-100">
              {item.linkLabel}
            </Link>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export function TwoColumnsEdit(props: BlockEditProps<ColumnsData>) {
  return <ColumnsEditImpl count={2} {...props} />;
}
export function TwoColumnsRender(props: BlockRenderProps<ColumnsData>) {
  return <ColumnsRenderImpl count={2} {...props} />;
}
export function ThreeColumnsEdit(props: BlockEditProps<ColumnsData>) {
  return <ColumnsEditImpl count={3} {...props} />;
}
export function ThreeColumnsRender(props: BlockRenderProps<ColumnsData>) {
  return <ColumnsRenderImpl count={3} {...props} />;
}
export function FourColumnsEdit(props: BlockEditProps<ColumnsData>) {
  return <ColumnsEditImpl count={4} {...props} />;
}
export function FourColumnsRender(props: BlockRenderProps<ColumnsData>) {
  return <ColumnsRenderImpl count={4} {...props} />;
}
