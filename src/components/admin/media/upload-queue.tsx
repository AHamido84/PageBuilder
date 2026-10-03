"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, AlertCircle, X } from "lucide-react";
import { uploadMediaFile, kindOfFile, type MediaItem, type MediaKind } from "@/lib/media/upload-client";

export interface QueueEntry {
  key: string;
  name: string;
  progress: number;
  status: "uploading" | "done" | "error";
  error?: string;
}

interface UseUploadQueueOptions {
  folderId: string | null;
  /** Restricts uploads to one kind (e.g. an image-only picker); other files fail fast with a clear message. */
  accept?: MediaKind;
  onUploaded: (item: MediaItem) => void;
}

/**
 * Uploads files one after another (keeps each request under Vercel's body limit and avoids
 * hammering sharp on the server) while tracking per-file progress for the queue list below.
 */
export function useUploadQueue({ folderId, accept, onUploaded }: UseUploadQueueOptions) {
  const [entries, setEntries] = useState<QueueEntry[]>([]);
  const counter = useRef(0);
  const onUploadedRef = useRef(onUploaded);
  useEffect(() => {
    onUploadedRef.current = onUploaded;
  });

  const update = (key: string, patch: Partial<QueueEntry>) =>
    setEntries((prev) => prev.map((e) => (e.key === key ? { ...e, ...patch } : e)));

  const addFiles = useCallback(
    async (files: FileList | File[]) => {
      const list = Array.from(files);
      const queued = list.map((file) => ({ file, key: `u${++counter.current}` }));
      setEntries((prev) => [...prev, ...queued.map(({ file, key }) => ({ key, name: file.name, progress: 0, status: "uploading" as const }))]);

      for (const { file, key } of queued) {
        const kind = kindOfFile(file);
        if (!kind) {
          update(key, { status: "error", error: `Unsupported file type (${file.type || "unknown"}).` });
          continue;
        }
        if (accept && kind !== accept) {
          update(key, { status: "error", error: `Only ${accept.toLowerCase()} files can be used here.` });
          continue;
        }
        try {
          const item = await uploadMediaFile(file, { folderId, onProgress: (p) => update(key, { progress: p }) });
          update(key, { status: "done", progress: 1 });
          onUploadedRef.current(item);
        } catch (error) {
          update(key, { status: "error", error: error instanceof Error ? error.message : "Upload failed." });
        }
      }
    },
    [folderId, accept]
  );

  const dismiss = (key: string) => setEntries((prev) => prev.filter((e) => e.key !== key));
  const clearFinished = () => setEntries((prev) => prev.filter((e) => e.status === "uploading"));
  const busy = entries.some((e) => e.status === "uploading");

  return { entries, addFiles, dismiss, clearFinished, busy };
}

export function UploadQueueList({
  entries,
  onDismiss,
  onClearFinished,
}: {
  entries: QueueEntry[];
  onDismiss: (key: string) => void;
  onClearFinished: () => void;
}) {
  if (entries.length === 0) return null;
  const finished = entries.filter((e) => e.status !== "uploading").length;
  return (
    <div className="mb-3 rounded-md border border-neutral-800 bg-neutral-900/60 p-2">
      <div className="mb-1.5 flex items-center justify-between px-1 text-[11px] text-neutral-500">
        <span>
          Uploads · {finished}/{entries.length} finished
        </span>
        {finished > 0 ? (
          <button type="button" onClick={onClearFinished} className="hover:text-neutral-300">
            Clear finished
          </button>
        ) : null}
      </div>
      <ul className="max-h-40 space-y-1 overflow-y-auto">
        {entries.map((entry) => (
          <li key={entry.key} className="flex items-center gap-2 rounded px-1 py-1 text-xs">
            {entry.status === "done" ? (
              <CheckCircle2 size={14} className="shrink-0 text-emerald-400" />
            ) : entry.status === "error" ? (
              <AlertCircle size={14} className="shrink-0 text-red-400" />
            ) : (
              <span className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-neutral-600 border-t-neutral-200" />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-neutral-300" title={entry.name}>
                {entry.name}
              </p>
              {entry.status === "error" ? (
                <p className="text-[11px] text-red-400">{entry.error}</p>
              ) : (
                <div className="mt-1 h-1 overflow-hidden rounded-full bg-neutral-800">
                  <div
                    className={`h-full rounded-full transition-[width] ${entry.status === "done" ? "bg-emerald-500" : "bg-neutral-300"}`}
                    style={{ width: `${Math.round(entry.progress * 100)}%` }}
                  />
                </div>
              )}
            </div>
            {entry.status !== "uploading" ? (
              <button type="button" onClick={() => onDismiss(entry.key)} aria-label="Dismiss" className="text-neutral-500 hover:text-neutral-300">
                <X size={12} />
              </button>
            ) : (
              <span className="w-8 text-end tabular-nums text-neutral-500">{Math.round(entry.progress * 100)}%</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Wraps an area so files dragged from the desktop can be dropped onto it, with a visible drop overlay. */
export function DropZone({ onFiles, disabled, children, className }: { onFiles: (files: FileList) => void; disabled?: boolean; children: React.ReactNode; className?: string }) {
  const [over, setOver] = useState(false);
  const depth = useRef(0);
  const hasFiles = (e: React.DragEvent) => Array.from(e.dataTransfer.types).includes("Files");

  return (
    <div
      className={`relative ${className ?? ""}`}
      onDragEnter={(e) => {
        if (disabled || !hasFiles(e)) return;
        e.preventDefault();
        depth.current += 1;
        setOver(true);
      }}
      onDragOver={(e) => {
        if (disabled || !hasFiles(e)) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
      }}
      onDragLeave={() => {
        if (disabled) return;
        depth.current = Math.max(0, depth.current - 1);
        if (depth.current === 0) setOver(false);
      }}
      onDrop={(e) => {
        if (disabled || !hasFiles(e)) return;
        e.preventDefault();
        depth.current = 0;
        setOver(false);
        if (e.dataTransfer.files.length) onFiles(e.dataTransfer.files);
      }}
    >
      {children}
      {over ? (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-lg border-2 border-dashed border-emerald-500 bg-neutral-950/80">
          <p className="text-sm font-medium text-emerald-300">Drop files to upload</p>
        </div>
      ) : null}
    </div>
  );
}
