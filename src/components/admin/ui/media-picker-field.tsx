"use client";

import { useEffect, useRef, useState } from "react";
import { Modal } from "./modal";

interface MediaListItem {
  id: string;
  url: string;
  originalName: string;
  type: "IMAGE" | "DOCUMENT" | "VIDEO";
}

interface MediaPickerFieldProps {
  name: string;
  label: string;
  accept?: "IMAGE" | "DOCUMENT" | "VIDEO";
  defaultMediaId?: string | null;
  defaultUrl?: string | null;
  onSelect?: (mediaId: string, url: string) => void;
}

export function MediaPickerField({ name, label, accept = "IMAGE", defaultMediaId, defaultUrl, onSelect }: MediaPickerFieldProps) {
  const [mediaId, setMediaId] = useState(defaultMediaId ?? "");
  const [previewUrl, setPreviewUrl] = useState(defaultUrl ?? "");
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<MediaListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    // Data fetching triggered by the picker opening — the canonical effect use
    // case, so the loading-state set at the start of the fetch is intentional.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    fetch(`/api/admin/media?type=${accept}`)
      .then((res) => res.json())
      .then((json) => {
        if (!cancelled) setItems(json.media ?? []);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, accept]);

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
      setMediaId(json.id);
      setPreviewUrl(json.url);
      onSelect?.(json.id, json.url);
      setOpen(false);
    } finally {
      setUploading(false);
    }
  }

  const acceptAttr =
    accept === "IMAGE"
      ? "image/jpeg,image/png,image/webp"
      : accept === "VIDEO"
        ? "video/mp4,video/webm"
        : "application/pdf";

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
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md border border-neutral-700 px-3 py-1.5 text-sm text-neutral-300 hover:bg-neutral-800"
      >
        {previewUrl ? "Change" : "Select"} from library
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title={`Select ${label.toLowerCase()}`} maxWidth="max-w-2xl">
        <div className="mb-3">
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptAttr}
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
            className="rounded-md bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-900 disabled:opacity-60"
          >
            {uploading ? "Uploading..." : "Upload new file"}
          </button>
          {error ? <p className="mt-1 text-xs text-red-400">{error}</p> : null}
        </div>

        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <p className="text-sm text-neutral-500">Loading...</p>
          ) : items.length > 0 ? (
            <div className="grid grid-cols-5 gap-2">
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setMediaId(item.id);
                    setPreviewUrl(item.url);
                    onSelect?.(item.id, item.url);
                    setOpen(false);
                  }}
                  className="overflow-hidden rounded-md border border-neutral-800 hover:border-neutral-500"
                  title={item.originalName}
                >
                  <div className="aspect-square bg-neutral-800">
                    {item.type === "IMAGE" ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-2xl">
                        {item.type === "VIDEO" ? "🎬" : "📄"}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-neutral-500">No files yet — upload one above.</p>
          )}
        </div>
      </Modal>
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
  const [items, setItems] = useState<MediaListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    fetch(`/api/admin/media?type=${accept}`)
      .then((res) => res.json())
      .then((json) => {
        if (!cancelled) setItems(json.media ?? []);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, accept]);

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
      onChange(json.id, json.url);
      setOpen(false);
    } finally {
      setUploading(false);
    }
  }

  const acceptAttr =
    accept === "IMAGE" ? "image/jpeg,image/png,image/webp" : accept === "VIDEO" ? "video/mp4,video/webm" : "application/pdf";

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

      <Modal open={open} onClose={() => setOpen(false)} title={`Select ${label.toLowerCase()}`} maxWidth="max-w-2xl">
        <div className="mb-3">
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptAttr}
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
            className="rounded-md bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-900 disabled:opacity-60"
          >
            {uploading ? "Uploading..." : "Upload new file"}
          </button>
          {error ? <p className="mt-1 text-xs text-red-400">{error}</p> : null}
        </div>

        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <p className="text-sm text-neutral-500">Loading...</p>
          ) : items.length > 0 ? (
            <div className="grid grid-cols-5 gap-2">
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onChange(item.id, item.url);
                    setOpen(false);
                  }}
                  className="overflow-hidden rounded-md border border-neutral-800 hover:border-neutral-500"
                  title={item.originalName}
                >
                  <div className="aspect-square bg-neutral-800">
                    {item.type === "IMAGE" ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-2xl">{item.type === "VIDEO" ? "🎬" : "📄"}</div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-neutral-500">No files yet — upload one above.</p>
          )}
        </div>
      </Modal>
    </div>
  );
}
