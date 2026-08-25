"use client";

import { useEffect, useRef, useState } from "react";
import { Search, Check } from "lucide-react";
import { Modal } from "./modal";

export interface MediaListItem {
  id: string;
  url: string;
  originalName: string;
  type: "IMAGE" | "DOCUMENT" | "VIDEO";
  width: number | null;
  height: number | null;
}

type Accept = "IMAGE" | "DOCUMENT" | "VIDEO";

export function acceptAttrFor(accept: Accept): string {
  return accept === "IMAGE" ? "image/jpeg,image/png,image/webp,image/svg+xml" : accept === "VIDEO" ? "video/mp4,video/webm" : "application/pdf";
}

interface BaseProps {
  open: boolean;
  onClose: () => void;
  title: string;
  accept: Accept;
  /** ids to show with a persistent selected highlight/checkmark in the grid. */
  selectedIds: string[];
}

interface SingleSelectProps extends BaseProps {
  multi?: false;
  onSelect: (item: MediaListItem) => void;
}

interface MultiSelectProps extends BaseProps {
  multi: true;
  /** Called once with every newly-picked item when the admin confirms -- lets a caller (e.g. bulk-adding Hero slides) add several at once instead of reopening the picker per image. */
  onConfirm: (items: MediaListItem[]) => void;
}

type MediaLibraryModalProps = SingleSelectProps | MultiSelectProps;

/**
 * Shared media browsing/upload/search UI behind both `MediaPickerField`/`MediaPickerControlled`
 * (single-select) and `MultiMediaPickerButton` (multi-select, for bulk-adding several images in one
 * open/close cycle -- e.g. Hero carousel slides). Previously this grid/search/upload logic was
 * duplicated near-verbatim across MediaPickerField and MediaPickerControlled with no search, no
 * dimensions, and no way to tell which item (if any) is already selected once the modal is open.
 */
export function MediaLibraryModal(props: MediaLibraryModalProps) {
  const { open, onClose, title, accept, selectedIds } = props;
  const [items, setItems] = useState<MediaListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [chosen, setChosen] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      // Resetting on close (not on open) so the grid doesn't visibly flash back to "0 selected,
      // empty search" while the closing animation is still playing.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setChosen(new Set());
      setQuery("");
      return;
    }
    let cancelled = false;
    const timeout = setTimeout(() => {
      setLoading(true);
      const params = new URLSearchParams({ type: accept });
      if (query.trim()) params.set("q", query.trim());
      fetch(`/api/admin/media?${params.toString()}`)
        .then((res) => res.json())
        .then((json) => {
          if (!cancelled) setItems(json.media ?? []);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, query ? 250 : 0); // debounce typed search, load immediately on open
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [open, accept, query]);

  async function handleUpload(file: File) {
    setUploading(true);
    setError(null);
    try {
      const body = new FormData();
      body.set("file", file);
      const res = await fetch("/api/admin/media", { method: "POST", body });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Upload failed.");
        return;
      }
      const uploaded: MediaListItem = { id: json.id, url: json.url, originalName: file.name, type: accept, width: null, height: null };
      if (props.multi) {
        setChosen((prev) => new Set(prev).add(uploaded.id));
        setItems((prev) => [uploaded, ...prev]);
      } else {
        props.onSelect(uploaded);
        onClose();
      }
    } finally {
      setUploading(false);
    }
  }

  function toggleChosen(item: MediaListItem) {
    if (!props.multi) {
      props.onSelect(item);
      onClose();
      return;
    }
    setChosen((prev) => {
      const next = new Set(prev);
      if (next.has(item.id)) next.delete(item.id);
      else next.add(item.id);
      return next;
    });
  }

  function confirmMulti() {
    if (!props.multi) return;
    const picked = items.filter((i) => chosen.has(i.id));
    if (picked.length === 0) return;
    props.onConfirm(picked);
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={title} maxWidth="max-w-3xl">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="pointer-events-none absolute inset-y-0 start-2.5 my-auto text-neutral-500" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by file name..."
            className="w-full rounded-md border border-neutral-700 bg-neutral-800 py-1.5 ps-8 pe-2 text-sm text-neutral-100 placeholder:text-neutral-500 focus:border-neutral-500 focus:outline-none"
          />
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptAttrFor(accept)}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleUpload(file);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="shrink-0 rounded-md bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-900 disabled:opacity-60"
        >
          {uploading ? "Uploading..." : "Upload new file"}
        </button>
      </div>
      {error ? <p className="mb-2 text-xs text-red-400">{error}</p> : null}

      <div className="max-h-96 overflow-y-auto">
        {loading ? (
          <p className="text-sm text-neutral-500">Loading...</p>
        ) : items.length > 0 ? (
          <div className="grid grid-cols-4 gap-3 sm:grid-cols-5">
            {items.map((item) => {
              const isSelected = selectedIds.includes(item.id) || chosen.has(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggleChosen(item)}
                  className={`group relative overflow-hidden rounded-md border text-start transition-colors ${
                    isSelected ? "border-emerald-500 ring-1 ring-emerald-500" : "border-neutral-800 hover:border-neutral-500"
                  }`}
                >
                  <div className="aspect-square bg-neutral-800">
                    {item.type === "IMAGE" ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-2xl">{item.type === "VIDEO" ? "🎬" : "📄"}</div>
                    )}
                  </div>
                  {isSelected ? (
                    <span className="absolute end-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-neutral-950">
                      <Check size={12} strokeWidth={3} />
                    </span>
                  ) : null}
                  <div className="space-y-0.5 p-1.5">
                    <p className="truncate text-[11px] leading-tight text-neutral-300" title={item.originalName}>
                      {item.originalName}
                    </p>
                    {item.width && item.height ? (
                      <p className="text-[10px] leading-tight text-neutral-500">
                        {item.width}×{item.height}
                      </p>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-neutral-500">{query ? "No files match your search." : "No files yet — upload one above."}</p>
        )}
      </div>

      {props.multi ? (
        <div className="mt-3 flex items-center justify-between border-t border-neutral-800 pt-3">
          <p className="text-xs text-neutral-500">{chosen.size} selected</p>
          <button
            type="button"
            onClick={confirmMulti}
            disabled={chosen.size === 0}
            className="rounded-md bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-900 disabled:opacity-40"
          >
            Add {chosen.size || ""} {chosen.size === 1 ? "image" : "images"}
          </button>
        </div>
      ) : null}
    </Modal>
  );
}

/** A button + its own multi-select MediaLibraryModal, for bulk-picking several images in one
 * open/close cycle (e.g. adding many Hero slides at once instead of opening a single-select picker
 * once per slide). `onConfirm` fires once with everything picked. */
export function MultiMediaPickerButton({
  label,
  accept = "IMAGE",
  className,
  onConfirm,
}: {
  label: string;
  accept?: Accept;
  className?: string;
  onConfirm: (items: MediaListItem[]) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={className ?? "flex items-center gap-1.5 rounded-md border border-dashed border-neutral-700 px-3 py-1.5 text-xs text-neutral-400 hover:text-neutral-200"}
      >
        {label}
      </button>
      <MediaLibraryModal open={open} onClose={() => setOpen(false)} title={label} accept={accept} selectedIds={[]} multi onConfirm={onConfirm} />
    </>
  );
}
