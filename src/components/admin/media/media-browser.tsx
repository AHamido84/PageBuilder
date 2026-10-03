"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, Search, Upload, X } from "lucide-react";
import { Drawer } from "@/components/admin/ui/drawer";
import { useAdminToast } from "@/components/admin/ui/toast";
import {
  acceptAttrFor,
  fetchFolders,
  folderIdByName,
  formatBytes,
  type FolderListResponse,
  type MediaItem,
  type MediaKind,
} from "@/lib/media/upload-client";
import { FolderSidebar, ALL_FOLDERS, UNFILED, type FolderFilter } from "./folder-sidebar";
import { MediaThumb } from "./media-thumb";
import { MediaDetailsEditor } from "./media-details-editor";
import { DropZone, UploadQueueList, useUploadQueue } from "./upload-queue";

export interface MediaPermissions {
  create: boolean;
  update: boolean;
  delete: boolean;
}

interface CommonProps {
  /** Upload destination suggested when browsing "All files"/"Unfiled" -- e.g. "Brands" for a brand-logo picker. */
  uploadFolderName?: string;
}

interface ManageProps extends CommonProps {
  mode: "manage";
  permissions: MediaPermissions;
}

interface PickProps extends CommonProps {
  mode: "pick";
  accept: MediaKind;
  multi?: boolean;
  /** Already-selected ids, shown with a checkmark. */
  selectedIds: string[];
  onPick: (items: MediaItem[]) => void;
}

export type MediaBrowserProps = ManageProps | PickProps;

const TYPE_LABELS: Record<MediaKind, string> = { IMAGE: "Images", VIDEO: "Videos", DOCUMENT: "Documents" };

/**
 * The whole Media Library UI: folder sidebar, search/type/tag filters, drag-and-drop multi-upload
 * with progress, paginated grid, and either the details/bulk-move tools (manage mode, the
 * /admin/media page) or a preview + Select flow (pick mode, inside every media picker modal).
 */
export function MediaBrowser(props: MediaBrowserProps) {
  const isPick = props.mode === "pick";
  const canCreate = isPick || props.permissions.create;
  const canUpdate = !isPick && props.permissions.update;
  const canDelete = !isPick && props.permissions.delete;
  const toast = useAdminToast();

  const [folderData, setFolderData] = useState<FolderListResponse | null>(null);
  const [folderToken, setFolderToken] = useState(0);
  const [folder, setFolder] = useState<FolderFilter>(ALL_FOLDERS);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<MediaKind | "">(isPick ? props.accept : "");
  const [tag, setTag] = useState("");
  const [items, setItems] = useState<MediaItem[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [listToken, setListToken] = useState(0);
  /** Upload destination: undefined = "not chosen yet" (falls back to the suggested folder once folders load). */
  const [uploadTarget, setUploadTarget] = useState<string | null | undefined>(undefined);

  // manage mode
  const [bulk, setBulk] = useState<Set<string>>(new Set());
  const [openId, setOpenId] = useState<string | null>(null);
  // pick mode
  const [chosen, setChosen] = useState<Map<string, MediaItem>>(new Map());
  const [focusedId, setFocusedId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const reloadFolders = useCallback(() => setFolderToken((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    fetchFolders()
      .then((data) => {
        if (!cancelled) setFolderData(data);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [folderToken]);

  const effectiveType = isPick ? props.accept : typeFilter;
  const filterParams = useMemo(() => {
    const params = new URLSearchParams();
    if (effectiveType) params.set("type", effectiveType);
    if (folder !== ALL_FOLDERS) params.set("folder", folder);
    if (query.trim()) params.set("q", query.trim());
    if (tag) params.set("tag", tag);
    return params;
  }, [effectiveType, folder, query, tag]);

  useEffect(() => {
    let cancelled = false;
    const timeout = setTimeout(
      () => {
        setLoading(true);
        fetch(`/api/admin/media?${filterParams.toString()}`)
          .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
          .then((json) => {
            if (cancelled) return;
            setItems(json.media ?? []);
            setHasMore(Boolean(json.hasMore));
          })
          .catch(() => {
            if (!cancelled) toast.push({ title: "Couldn't load media", tone: "error" });
          })
          .finally(() => {
            if (!cancelled) setLoading(false);
          });
      },
      query ? 250 : 0
    );
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
    // toast is a stable context value; listing it would refetch on every toast.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterParams, listToken]);

  async function loadMore() {
    setLoadingMore(true);
    try {
      const params = new URLSearchParams(filterParams);
      params.set("skip", String(items.length));
      const res = await fetch(`/api/admin/media?${params.toString()}`);
      const json = await res.json();
      const seen = new Set(items.map((i) => i.id));
      setItems((prev) => [...prev, ...(json.media as MediaItem[]).filter((m) => !seen.has(m.id))]);
      setHasMore(Boolean(json.hasMore));
    } finally {
      setLoadingMore(false);
    }
  }

  // Until folders load, a suggested destination ("Brands") can't be resolved -- hold uploads so they don't silently land in Unfiled.
  const uploadReady = canCreate && (folderData !== null || !props.uploadFolderName);
  const suggestedFolderId = folderIdByName(folderData?.folders ?? [], props.uploadFolderName);
  const resolvedUploadTarget =
    uploadTarget !== undefined ? uploadTarget : folder !== ALL_FOLDERS && folder !== UNFILED ? folder : suggestedFolderId;

  const queue = useUploadQueue({
    folderId: resolvedUploadTarget,
    accept: isPick ? props.accept : undefined,
    onUploaded: (item) => {
      const matchesFolder = folder === ALL_FOLDERS || (folder === UNFILED ? !item.folderId : item.folderId === folder);
      const matchesType = !effectiveType || item.type === effectiveType;
      if (matchesFolder && matchesType && !tag && !query.trim()) setItems((prev) => [item, ...prev]);
      reloadFolders();
      if (isPick) {
        setFocusedId(item.id);
        if (props.multi) setChosen((prev) => new Map(prev).set(item.id, item));
      }
    },
  });

  function selectFolder(value: FolderFilter) {
    setFolder(value);
    setBulk(new Set());
    // Browsing into a real folder makes it the upload destination too -- what a person expects after clicking it.
    setUploadTarget(value !== ALL_FOLDERS && value !== UNFILED ? value : undefined);
  }

  async function moveSelected(targetFolderId: string) {
    const ids = [...bulk];
    const res = await fetch("/api/admin/media/move", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids, folderId: targetFolderId === UNFILED ? null : targetFolderId }),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      toast.push({ title: "Couldn't move files", description: json?.error, tone: "error" });
      return;
    }
    const name = targetFolderId === UNFILED ? "Unfiled" : folderData?.folders.find((f) => f.id === targetFolderId)?.name;
    toast.push({ title: `Moved ${json.moved} file${json.moved === 1 ? "" : "s"} to ${name}`, tone: "success" });
    setBulk(new Set());
    reloadFolders();
    setListToken((t) => t + 1);
  }

  function handleItemClick(item: MediaItem) {
    if (!isPick) {
      setOpenId(item.id);
      return;
    }
    setFocusedId(item.id);
    if (props.multi) {
      setChosen((prev) => {
        const next = new Map(prev);
        if (next.has(item.id)) next.delete(item.id);
        else next.set(item.id, item);
        return next;
      });
    }
  }

  function confirmPick(explicit?: MediaItem) {
    if (!isPick) return;
    if (props.multi) {
      // Kept as a Map (not filtered from `items`) so picks survive switching folders or searching.
      const picked = [...chosen.values()];
      if (picked.length) props.onPick(picked);
      return;
    }
    const item = explicit ?? items.find((i) => i.id === focusedId);
    if (item) props.onPick([item]);
  }

  const openItem = items.find((i) => i.id === openId) ?? null;
  const focusedItem = items.find((i) => i.id === focusedId) ?? null;
  const folderName = (id: string | null) => (id ? folderData?.folders.find((f) => f.id === id)?.name ?? "—" : "Unfiled");

  const grid = (
    <DropZone onFiles={queue.addFiles} disabled={!uploadReady} className="min-h-[240px] rounded-lg">
      {loading ? (
        <div className={`grid gap-3 ${isPick ? "grid-cols-3 sm:grid-cols-4 lg:grid-cols-5" : "grid-cols-2 sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-7"}`}>
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="aspect-square animate-pulse rounded-md bg-neutral-900" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex min-h-[240px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-neutral-800 text-center text-sm text-neutral-500">
          <Upload size={20} />
          {query || tag ? "No files match your search." : canCreate ? "No files here yet -- drag files here or use Upload." : "No files here yet."}
        </div>
      ) : (
        <div className={`grid gap-3 ${isPick ? "grid-cols-3 sm:grid-cols-4 lg:grid-cols-5" : "grid-cols-2 sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-7"}`}>
          {items.map((item) => {
            const preSelected = isPick && props.selectedIds.includes(item.id);
            const isChosen = isPick ? chosen.has(item.id) || (!props.multi && focusedId === item.id) : bulk.has(item.id);
            return (
              <div key={item.id} className="group relative">
                <button
                  type="button"
                  onClick={() => handleItemClick(item)}
                  onDoubleClick={() => isPick && !props.multi && confirmPick(item)}
                  className={`block w-full overflow-hidden rounded-md border bg-neutral-900 text-start transition-colors ${
                    isChosen ? "border-emerald-500 ring-1 ring-emerald-500" : preSelected ? "border-sky-600" : "border-neutral-800 hover:border-neutral-500"
                  }`}
                >
                  <div className="aspect-square bg-neutral-800">
                    <MediaThumb item={item} />
                  </div>
                  <div className="space-y-0.5 p-1.5">
                    <p className="truncate text-[11px] leading-tight text-neutral-300" title={item.originalName}>
                      {item.title || item.originalName}
                    </p>
                    <p className="truncate text-[10px] leading-tight text-neutral-500">
                      {item.width && item.height ? `${item.width}×${item.height} · ` : ""}
                      {formatBytes(item.sizeBytes)}
                    </p>
                  </div>
                </button>
                {preSelected ? (
                  <span className="pointer-events-none absolute start-1 top-1 rounded bg-sky-700 px-1 text-[9px] font-medium uppercase text-white">Current</span>
                ) : null}
                {!isPick && canUpdate ? (
                  <label
                    className={`absolute end-1 top-1 flex h-5 w-5 cursor-pointer items-center justify-center rounded border ${
                      bulk.has(item.id) ? "border-emerald-500 bg-emerald-500 text-neutral-950" : "border-neutral-500 bg-neutral-950/70 opacity-0 group-hover:opacity-100 focus-within:opacity-100"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      aria-label={`Select ${item.originalName}`}
                      checked={bulk.has(item.id)}
                      onChange={() =>
                        setBulk((prev) => {
                          const next = new Set(prev);
                          if (next.has(item.id)) next.delete(item.id);
                          else next.add(item.id);
                          return next;
                        })
                      }
                    />
                    {bulk.has(item.id) ? <Check size={12} strokeWidth={3} /> : null}
                  </label>
                ) : isChosen ? (
                  <span className="absolute end-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-neutral-950">
                    <Check size={12} strokeWidth={3} />
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
      {hasMore && !loading ? (
        <div className="mt-4 flex justify-center">
          <button type="button" onClick={loadMore} disabled={loadingMore} className="rounded-md border border-neutral-700 px-3 py-1.5 text-sm text-neutral-300 hover:bg-neutral-800 disabled:opacity-60">
            {loadingMore ? "Loading..." : "Load more"}
          </button>
        </div>
      ) : null}
    </DropZone>
  );

  const toolbar = (
    <div className="mb-3 flex flex-wrap items-center gap-2">
      <div className="relative min-w-[200px] flex-1">
        <Search size={14} className="pointer-events-none absolute inset-y-0 start-2.5 my-auto text-neutral-500" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, title, alt text, tag, folder..."
          className="w-full rounded-md border border-neutral-700 bg-neutral-800 py-1.5 pe-2 ps-8 text-sm text-neutral-100 placeholder:text-neutral-500 focus:border-neutral-500 focus:outline-none"
        />
      </div>
      {!isPick ? (
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as MediaKind | "")}
          aria-label="File type"
          className="rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm"
        >
          <option value="">All types</option>
          {(Object.keys(TYPE_LABELS) as MediaKind[]).map((k) => (
            <option key={k} value={k}>
              {TYPE_LABELS[k]}
            </option>
          ))}
        </select>
      ) : null}
      {tag ? (
        <span className="inline-flex items-center gap-1 rounded-full bg-neutral-800 py-1 pe-1.5 ps-2.5 text-xs text-neutral-200">
          Tag: {tag}
          <button type="button" aria-label="Clear tag filter" onClick={() => setTag("")} className="rounded-full p-0.5 hover:bg-neutral-700">
            <X size={11} />
          </button>
        </span>
      ) : null}
      {canCreate ? (
        <div className="ms-auto flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs text-neutral-500">
            Upload to
            <select
              value={resolvedUploadTarget ?? ""}
              onChange={(e) => setUploadTarget(e.target.value || null)}
              className="rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-xs text-neutral-200"
            >
              <option value="">Unfiled</option>
              {folderData?.folders.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </label>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={acceptAttrFor(isPick ? props.accept : "ANY")}
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.length) queue.addFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={!uploadReady}
            className="inline-flex items-center gap-1.5 rounded-md bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-900 disabled:opacity-50"
          >
            <Upload size={14} /> Upload
          </button>
        </div>
      ) : null}
    </div>
  );

  const bulkBar =
    !isPick && bulk.size > 0 ? (
      <div className="mb-3 flex flex-wrap items-center gap-3 rounded-md border border-emerald-900 bg-emerald-950/40 px-3 py-2 text-sm">
        <span className="text-emerald-200">{bulk.size} selected</span>
        <select
          defaultValue=""
          aria-label="Move selected files to folder"
          onChange={(e) => {
            if (e.target.value) moveSelected(e.target.value);
            e.target.value = "";
          }}
          className="rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1 text-sm"
        >
          <option value="" disabled>
            Move to folder...
          </option>
          <option value={UNFILED}>Unfiled</option>
          {folderData?.folders.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
        <button type="button" onClick={() => setBulk(new Set(items.map((i) => i.id)))} className="text-xs text-neutral-400 hover:text-neutral-200">
          Select all loaded ({items.length})
        </button>
        <button type="button" onClick={() => setBulk(new Set())} className="ms-auto text-xs text-neutral-400 hover:text-neutral-200">
          Clear selection
        </button>
      </div>
    ) : null;

  const uploads = <UploadQueueList entries={queue.entries} onDismiss={queue.dismiss} onClearFinished={queue.clearFinished} />;

  if (!isPick) {
    return (
      <div className="flex gap-6">
        <aside className="w-48 shrink-0">
          <FolderSidebar data={folderData} value={folder} onChange={selectFolder} manage={canUpdate} onFoldersChanged={reloadFolders} />
        </aside>
        <div className="min-w-0 flex-1">
          {toolbar}
          {uploads}
          {bulkBar}
          {grid}
        </div>
        <Drawer open={!!openItem} onClose={() => setOpenId(null)} title="Media details">
          {openItem ? (
            <MediaDetailsEditor
              key={`${openItem.id}:${openItem.url}`}
              item={openItem}
              folders={folderData?.folders ?? []}
              canUpdate={canUpdate}
              canDelete={canDelete}
              onTagClick={(t) => {
                setTag(t);
                setOpenId(null);
              }}
              onSaved={(updated) => {
                setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
                reloadFolders();
              }}
              onDeleted={(id) => {
                setItems((prev) => prev.filter((i) => i.id !== id));
                setOpenId(null);
                reloadFolders();
              }}
            />
          ) : null}
        </Drawer>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="flex gap-4">
        <aside className="hidden w-40 shrink-0 md:block">
          <FolderSidebar data={folderData} value={folder} onChange={selectFolder} onFoldersChanged={reloadFolders} />
        </aside>
        <div className="min-w-0 flex-1">
          {toolbar}
          <div className="md:hidden">
            <select value={folder} onChange={(e) => selectFolder(e.target.value)} aria-label="Folder" className="mb-3 w-full rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm">
              <option value={ALL_FOLDERS}>All files</option>
              <option value={UNFILED}>Unfiled</option>
              {folderData?.folders.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>
          {uploads}
          <div className="max-h-[52vh] overflow-y-auto pe-1">{grid}</div>
        </div>
        <aside className="hidden w-56 shrink-0 lg:block">
          {focusedItem ? (
            <div className="space-y-2 text-xs">
              <div className="overflow-hidden rounded-md border border-neutral-800 bg-neutral-950">
                <div className="flex aspect-square items-center justify-center">
                  {focusedItem.type === "VIDEO" ? (
                    <video src={focusedItem.url} controls preload="metadata" className="h-full w-full object-contain" />
                  ) : (
                    <MediaThumb item={focusedItem} className="h-full w-full object-contain" />
                  )}
                </div>
              </div>
              <p className="break-words font-medium text-neutral-200">{focusedItem.title || focusedItem.originalName}</p>
              <dl className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-1 text-neutral-400">
                {focusedItem.width && focusedItem.height ? (
                  <>
                    <dt className="text-neutral-600">Size</dt>
                    <dd>
                      {focusedItem.width}×{focusedItem.height} · {formatBytes(focusedItem.sizeBytes)}
                    </dd>
                  </>
                ) : (
                  <>
                    <dt className="text-neutral-600">Size</dt>
                    <dd>{formatBytes(focusedItem.sizeBytes)}</dd>
                  </>
                )}
                <dt className="text-neutral-600">Folder</dt>
                <dd>{folderName(focusedItem.folderId)}</dd>
                <dt className="text-neutral-600">Alt</dt>
                <dd className={focusedItem.altTextEn ? "" : "text-amber-500"}>{focusedItem.altTextEn || "Missing -- add it in the Media Library"}</dd>
              </dl>
              {focusedItem.tags.length ? (
                <div className="flex flex-wrap gap-1">
                  {focusedItem.tags.map((t) => (
                    <span key={t} className="rounded-full bg-neutral-800 px-2 py-0.5 text-[10px] text-neutral-300">
                      {t}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          ) : (
            <p className="pt-8 text-center text-xs text-neutral-600">Click a file to preview it. Double-click to select.</p>
          )}
        </aside>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3 border-t border-neutral-800 pt-3">
        <p className="text-xs text-neutral-500">
          {props.multi ? `${chosen.size} selected` : focusedItem ? `Selected: ${focusedItem.originalName}` : "Nothing selected"}
          {queue.busy ? " · uploading..." : ""}
        </p>
        <button
          type="button"
          onClick={() => confirmPick()}
          disabled={props.multi ? chosen.size === 0 : !focusedItem}
          className="rounded-md bg-neutral-100 px-4 py-1.5 text-sm font-medium text-neutral-900 disabled:opacity-40"
        >
          {props.multi ? (chosen.size ? `Add ${chosen.size} ${chosen.size === 1 ? "file" : "files"}` : "Add files") : "Select"}
        </button>
      </div>
    </div>
  );
}
