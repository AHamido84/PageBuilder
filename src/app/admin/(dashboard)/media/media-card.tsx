"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Drawer } from "@/components/admin/ui/drawer";
import { useConfirm } from "@/components/admin/ui/confirm-dialog";
import { useAdminToast } from "@/components/admin/ui/toast";

export interface MediaItem {
  id: string;
  url: string;
  originalName: string;
  type: "IMAGE" | "DOCUMENT" | "VIDEO";
  mimeType: string;
  sizeBytes: number;
  altTextEn: string | null;
  altTextAr: string | null;
  createdAt: string;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function Thumbnail({ item }: { item: MediaItem }) {
  if (item.type === "IMAGE") {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={item.url} alt={item.altTextEn ?? ""} className="h-full w-full object-cover" />;
  }
  const icon = item.type === "VIDEO" ? "🎬" : "📄";
  return <div className="flex h-full w-full items-center justify-center text-3xl">{icon}</div>;
}

export function MediaCard({ item }: { item: MediaItem }) {
  const [open, setOpen] = useState(false);
  const [originalName, setOriginalName] = useState(item.originalName);
  const [altTextEn, setAltTextEn] = useState(item.altTextEn ?? "");
  const [altTextAr, setAltTextAr] = useState(item.altTextAr ?? "");
  const [saving, setSaving] = useState(false);
  const [replacing, setReplacing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const confirm = useConfirm();
  const toast = useAdminToast();
  const router = useRouter();

  async function saveMetadata() {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/media/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ originalName, altTextEn, altTextAr }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.push({ title: "Couldn't save", description: json.error, tone: "error" });
        return;
      }
      toast.push({ title: "Saved", tone: "success" });
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function handleReplace(file: File) {
    setReplacing(true);
    try {
      const body = new FormData();
      body.set("file", file);
      const res = await fetch(`/api/admin/media/${item.id}/replace`, { method: "POST", body });
      const json = await res.json();
      if (!res.ok) {
        toast.push({ title: "Couldn't replace file", description: json.error, tone: "error" });
        return;
      }
      toast.push({ title: "File replaced", tone: "success" });
      router.refresh();
    } finally {
      setReplacing(false);
    }
  }

  async function handleDelete() {
    const ok = await confirm({
      title: "Delete this file?",
      description: "This removes it from the media library permanently.",
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;

    const res = await fetch(`/api/admin/media/${item.id}`, { method: "DELETE" });
    const json = await res.json();
    if (!res.ok) {
      toast.push({ title: "Couldn't delete", description: json.error, tone: "error" });
      return;
    }
    toast.push({ title: "Deleted", tone: "success" });
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group block overflow-hidden rounded-md border border-neutral-800 bg-neutral-900 text-left"
      >
        <div className="aspect-square bg-neutral-800">
          <Thumbnail item={item} />
        </div>
        <div className="p-2">
          <p className="truncate text-xs text-neutral-300">{item.originalName}</p>
          <p className="text-[10px] text-neutral-500">{formatSize(item.sizeBytes)}</p>
        </div>
      </button>

      <Drawer open={open} onClose={() => setOpen(false)} title="Media details">
        <div className="mb-4 overflow-hidden rounded-md border border-neutral-800 bg-neutral-950">
          <div className="aspect-video">
            <Thumbnail item={item} />
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-neutral-400">File name</label>
            <input
              value={originalName}
              onChange={(e) => setOriginalName(e.target.value)}
              className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-neutral-400">Alt text (English)</label>
            <input
              value={altTextEn}
              onChange={(e) => setAltTextEn(e.target.value)}
              className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm"
            />
          </div>
          <div dir="rtl">
            <label className="mb-1 block text-xs text-neutral-400">النص البديل (عربي)</label>
            <input
              value={altTextAr}
              onChange={(e) => setAltTextAr(e.target.value)}
              className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm"
            />
          </div>
          <p className="text-xs text-neutral-500">
            {item.mimeType} · {formatSize(item.sizeBytes)} · uploaded {new Date(item.createdAt).toLocaleDateString()}
          </p>

          <button
            type="button"
            onClick={saveMetadata}
            disabled={saving}
            className="w-full rounded-md bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-900 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save changes"}
          </button>

          <div className="border-t border-neutral-800 pt-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf,video/mp4,video/webm"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleReplace(file);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={replacing}
              className="w-full rounded-md border border-neutral-700 px-3 py-1.5 text-sm text-neutral-300 hover:bg-neutral-800 disabled:opacity-60"
            >
              {replacing ? "Replacing..." : "Replace file"}
            </button>
          </div>

          <button
            type="button"
            onClick={handleDelete}
            className="w-full rounded-md border border-red-900 px-3 py-1.5 text-sm text-red-400 hover:bg-red-950"
          >
            Delete
          </button>
        </div>
      </Drawer>
    </>
  );
}
