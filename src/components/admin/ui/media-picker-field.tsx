"use client";

import { useState } from "react";
import { MediaLibraryModal, type MediaListItem } from "./media-library-modal";

interface MediaPickerFieldProps {
  name: string;
  label: string;
  accept?: "IMAGE" | "DOCUMENT" | "VIDEO";
  defaultMediaId?: string | null;
  defaultUrl?: string | null;
  onSelect?: (mediaId: string, url: string) => void;
}

/** Uncontrolled variant, backed by a hidden `<input>` for plain `<form>` submission. */
export function MediaPickerField({ name, label, accept = "IMAGE", defaultMediaId, defaultUrl, onSelect }: MediaPickerFieldProps) {
  const [mediaId, setMediaId] = useState(defaultMediaId ?? "");
  const [previewUrl, setPreviewUrl] = useState(defaultUrl ?? "");
  const [open, setOpen] = useState(false);

  function handlePick(item: MediaListItem) {
    setMediaId(item.id);
    setPreviewUrl(item.url);
    onSelect?.(item.id, item.url);
  }

  return (
    <div>
      <label className="mb-1 block text-xs text-neutral-400">{label}</label>
      <input type="hidden" name={name} value={mediaId} />
      {previewUrl && accept === "IMAGE" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={previewUrl} alt="" className="mb-2 h-20 w-20 rounded-md border border-neutral-700 object-cover" />
      ) : previewUrl ? (
        <p className="mb-2 text-xs text-neutral-400">File selected</p>
      ) : null}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-md border border-neutral-700 px-3 py-1.5 text-sm text-neutral-300 hover:bg-neutral-800"
        >
          {previewUrl ? "Change" : "Select"} from library
        </button>
        {mediaId ? (
          <button
            type="button"
            onClick={() => {
              setMediaId("");
              setPreviewUrl("");
              onSelect?.("", "");
            }}
            className="rounded-md border border-neutral-800 px-3 py-1.5 text-sm text-neutral-500 hover:bg-neutral-800"
          >
            Clear
          </button>
        ) : null}
      </div>

      <MediaLibraryModal
        open={open}
        onClose={() => setOpen(false)}
        title={`Select ${label.toLowerCase()}`}
        accept={accept}
        selectedIds={mediaId ? [mediaId] : []}
        onSelect={handlePick}
      />
    </div>
  );
}

interface MediaPickerControlledProps {
  label: string;
  accept?: "IMAGE" | "DOCUMENT" | "VIDEO";
  mediaId: string;
  previewUrl?: string;
  onChange: (mediaId: string, url: string) => void;
}

/** Controlled variant of MediaPickerField for use outside plain <form> submission (e.g. the page builder's in-memory state). */
export function MediaPickerControlled({ label, accept = "IMAGE", mediaId, previewUrl, onChange }: MediaPickerControlledProps) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <label className="mb-1 block text-xs text-neutral-400">{label}</label>
      {previewUrl && accept === "IMAGE" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={previewUrl} alt="" className="mb-2 h-20 w-20 rounded-md border border-neutral-700 object-cover" />
      ) : previewUrl ? (
        <p className="mb-2 text-xs text-neutral-400">File selected</p>
      ) : null}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-md border border-neutral-700 px-3 py-1.5 text-sm text-neutral-300 hover:bg-neutral-800"
        >
          {previewUrl ? "Change" : "Select"} from library
        </button>
        {mediaId ? (
          <button
            type="button"
            onClick={() => onChange("", "")}
            className="rounded-md border border-neutral-800 px-3 py-1.5 text-sm text-neutral-500 hover:bg-neutral-800"
          >
            Clear
          </button>
        ) : null}
      </div>

      <MediaLibraryModal
        open={open}
        onClose={() => setOpen(false)}
        title={`Select ${label.toLowerCase()}`}
        accept={accept}
        selectedIds={mediaId ? [mediaId] : []}
        onSelect={(item) => onChange(item.id, item.url)}
      />
    </div>
  );
}
