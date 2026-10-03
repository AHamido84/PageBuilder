"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Copy, ExternalLink, Replace, Trash2, X } from "lucide-react";
import { useConfirm } from "@/components/admin/ui/confirm-dialog";
import { useAdminToast } from "@/components/admin/ui/toast";
import { acceptAttrFor, formatBytes, uploadMediaFile, type FolderOption, type MediaItem } from "@/lib/media/upload-client";
import { MediaThumb } from "./media-thumb";

interface Usage {
  label: string;
  href: string;
}

interface Props {
  item: MediaItem;
  folders: FolderOption[];
  canUpdate: boolean;
  canDelete: boolean;
  onSaved: (item: MediaItem) => void;
  onDeleted: (id: string) => void;
  /** Tag chips are clickable as a filter shortcut. */
  onTagClick?: (tag: string) => void;
}

const inputClass = "w-full rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm disabled:opacity-60";
const labelClass = "mb-1 block text-xs text-neutral-400";

function CopyField({ label, value }: { label: string; value: string }) {
  const toast = useAdminToast();
  return (
    <div>
      <span className={labelClass}>{label}</span>
      <div className="flex gap-1.5">
        <input readOnly value={value} onFocus={(e) => e.target.select()} className={`${inputClass} font-mono text-[11px] text-neutral-400`} />
        <button
          type="button"
          aria-label={`Copy ${label}`}
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(value);
              toast.push({ title: `${label} copied`, tone: "success" });
            } catch {
              toast.push({ title: "Couldn't access the clipboard -- select the text and copy it manually.", tone: "error" });
            }
          }}
          className="shrink-0 rounded-md border border-neutral-700 px-2 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100"
        >
          <Copy size={13} />
        </button>
      </div>
    </div>
  );
}

export function MediaDetailsEditor({ item, folders, canUpdate, canDelete, onSaved, onDeleted, onTagClick }: Props) {
  const [form, setForm] = useState({
    originalName: item.originalName,
    title: item.title ?? "",
    description: item.description ?? "",
    altTextEn: item.altTextEn ?? "",
    altTextAr: item.altTextAr ?? "",
    folderId: item.folderId ?? "",
  });
  const [tags, setTags] = useState<string[]>(item.tags);
  const [tagDraft, setTagDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [replaceProgress, setReplaceProgress] = useState<number | null>(null);
  const [usage, setUsage] = useState<Usage[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const confirm = useConfirm();
  const toast = useAdminToast();

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/admin/media/${item.id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (!cancelled) setUsage(json?.usage ?? []);
      })
      .catch(() => {
        if (!cancelled) setUsage([]);
      });
    return () => {
      cancelled = true;
    };
  }, [item.id]);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  function commitTagDraft(): string[] {
    const pieces = tagDraft.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean);
    setTagDraft("");
    if (pieces.length === 0) return tags;
    const next = [...new Set([...tags, ...pieces])];
    setTags(next);
    return next;
  }

  async function save() {
    if (!form.originalName.trim()) {
      toast.push({ title: "File name can't be empty", tone: "error" });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/media/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, folderId: form.folderId || null, tags: commitTagDraft() }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.media) {
        toast.push({ title: "Couldn't save", description: json?.error, tone: "error" });
        return;
      }
      setTags(json.media.tags);
      toast.push({ title: "Saved", tone: "success" });
      onSaved(json.media);
    } finally {
      setSaving(false);
    }
  }

  async function replace(file: File) {
    const inUse = usage?.length ?? 0;
    const ok = await confirm({
      title: "Replace this file?",
      description: `The new file takes over this item's name, alt text, folder and tags${
        inUse ? `, and every place it's used (${inUse}) updates automatically` : ""
      }. The current file is removed from storage.`,
      confirmLabel: "Replace",
    });
    if (!ok) return;
    setReplaceProgress(0);
    try {
      const updated = await uploadMediaFile(file, { endpoint: `/api/admin/media/${item.id}/replace`, onProgress: setReplaceProgress });
      toast.push({ title: "File replaced", tone: "success" });
      onSaved(updated);
    } catch (error) {
      toast.push({ title: "Couldn't replace file", description: error instanceof Error ? error.message : undefined, tone: "error" });
    } finally {
      setReplaceProgress(null);
    }
  }

  async function remove() {
    const ok = await confirm({
      title: "Delete this file?",
      description: "This permanently removes the file from storage. It can't be undone.",
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    const res = await fetch(`/api/admin/media/${item.id}`, { method: "DELETE" });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      if (json?.usage) setUsage(json.usage);
      toast.push({ title: "Couldn't delete", description: json?.error, tone: "error" });
      return;
    }
    toast.push({ title: "Deleted", tone: "success" });
    onDeleted(item.id);
  }

  const inUse = usage !== null && usage.length > 0;

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-md border border-neutral-800 bg-[repeating-conic-gradient(#262626_0%_25%,#171717_0%_50%)] bg-[length:16px_16px]">
        <div className="flex aspect-video items-center justify-center">
          {item.type === "VIDEO" ? (
            <video src={item.url} controls preload="metadata" className="h-full w-full object-contain" />
          ) : (
            <MediaThumb item={item} className="h-full w-full object-contain" />
          )}
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 rounded-md border border-neutral-800 p-3 text-xs">
        <dt className="text-neutral-500">Type</dt>
        <dd className="truncate text-neutral-300">{item.mimeType}</dd>
        <dt className="text-neutral-500">Size</dt>
        <dd className="text-neutral-300">{formatBytes(item.sizeBytes)}</dd>
        {item.width && item.height ? (
          <>
            <dt className="text-neutral-500">Dimensions</dt>
            <dd className="text-neutral-300">
              {item.width} × {item.height}px
            </dd>
          </>
        ) : null}
        <dt className="text-neutral-500">Uploaded</dt>
        <dd className="text-neutral-300">{new Date(item.createdAt).toLocaleString()}</dd>
      </dl>

      <CopyField label="URL" value={item.url} />
      <CopyField label="ID" value={item.id} />
      <a href={item.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-neutral-400 hover:text-neutral-200">
        <ExternalLink size={12} /> Open original
      </a>

      <fieldset disabled={!canUpdate} className="space-y-3">
        <div>
          <label className={labelClass} htmlFor="media-name">
            File name
          </label>
          <input id="media-name" value={form.originalName} onChange={set("originalName")} maxLength={255} className={inputClass} />
          <p className="mt-1 text-[11px] text-neutral-600">Renaming changes the display name only -- the URL stays the same, so nothing breaks.</p>
        </div>
        <div>
          <label className={labelClass} htmlFor="media-title">
            Title
          </label>
          <input id="media-title" value={form.title} onChange={set("title")} maxLength={200} className={inputClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="media-description">
            Description
          </label>
          <textarea id="media-description" value={form.description} onChange={set("description")} maxLength={1000} rows={2} className={inputClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="media-alt-en">
            Alt text (English)
          </label>
          <input id="media-alt-en" value={form.altTextEn} onChange={set("altTextEn")} maxLength={300} className={inputClass} />
        </div>
        <div dir="rtl">
          <label className={labelClass} htmlFor="media-alt-ar">
            النص البديل (عربي)
          </label>
          <input id="media-alt-ar" value={form.altTextAr} onChange={set("altTextAr")} maxLength={300} className={inputClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="media-folder">
            Folder
          </label>
          <select id="media-folder" value={form.folderId} onChange={set("folderId")} className={inputClass}>
            <option value="">Unfiled</option>
            {folders.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="media-tags">
            Tags
          </label>
          {tags.length > 0 ? (
            <div className="mb-1.5 flex flex-wrap gap-1">
              {tags.map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-neutral-800 py-0.5 ps-2 pe-1 text-[11px] text-neutral-300">
                  <button type="button" onClick={() => onTagClick?.(tag)} className="hover:text-white" title="Show all files with this tag">
                    {tag}
                  </button>
                  {canUpdate ? (
                    <button type="button" aria-label={`Remove tag ${tag}`} onClick={() => setTags(tags.filter((t) => t !== tag))} className="rounded-full p-0.5 hover:bg-neutral-700">
                      <X size={10} />
                    </button>
                  ) : null}
                </span>
              ))}
            </div>
          ) : null}
          <input
            id="media-tags"
            value={tagDraft}
            placeholder="Add tags, comma-separated, Enter to add"
            onChange={(e) => setTagDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commitTagDraft();
              }
            }}
            className={inputClass}
          />
        </div>
        {canUpdate ? (
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="w-full rounded-md bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-900 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
        ) : null}
      </fieldset>

      <div className="rounded-md border border-neutral-800 p-3">
        <p className="mb-1.5 text-xs font-medium text-neutral-300">Used in</p>
        {usage === null ? (
          <p className="text-xs text-neutral-500">Checking...</p>
        ) : usage.length === 0 ? (
          <p className="text-xs text-neutral-500">Not used anywhere yet.</p>
        ) : (
          <ul className="space-y-1">
            {usage.map((u, i) => (
              <li key={`${u.href}-${i}`}>
                <Link href={u.href} className="text-xs text-sky-400 hover:underline">
                  {u.label}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {canUpdate ? (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptAttrFor(item.type)}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) replace(file);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={replaceProgress !== null}
            className="flex w-full items-center justify-center gap-1.5 rounded-md border border-neutral-700 px-3 py-1.5 text-sm text-neutral-300 hover:bg-neutral-800 disabled:opacity-60"
          >
            <Replace size={14} />
            {replaceProgress !== null ? `Replacing... ${Math.round(replaceProgress * 100)}%` : "Replace file"}
          </button>
        </div>
      ) : null}

      {canDelete ? (
        <div>
          <button
            type="button"
            onClick={remove}
            disabled={inUse || usage === null}
            className="flex w-full items-center justify-center gap-1.5 rounded-md border border-red-900 px-3 py-1.5 text-sm text-red-400 hover:bg-red-950 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Trash2 size={14} /> Delete
          </button>
          {inUse ? <p className="mt-1 text-[11px] text-neutral-500">In use -- remove it from the places above before deleting.</p> : null}
        </div>
      ) : null}
    </div>
  );
}
