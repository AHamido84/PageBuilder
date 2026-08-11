"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  widthClassName?: string;
}

export function Drawer({ open, onClose, title, children, widthClassName = "w-full max-w-md" }: DrawerProps) {
  // Portals render nothing on the server; a plain `typeof document === "undefined"` check still returns
  // the real portal content on the client's very first (pre-hydration) render, which mismatches the
  // server's `null` and throws a hydration error. Delaying the portal to a post-mount effect makes the
  // client's first render match the server (both `null`), and only reveals it on the next commit.
  const [mounted, setMounted] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- deliberate mount-detection flag, not state sync
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!mounted) return null;

  return createPortal(
    <div className={`fixed inset-0 z-[250] ${open ? "" : "pointer-events-none"}`}>
      <div
        className={`absolute inset-0 bg-black/60 transition-opacity ${open ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`absolute inset-y-0 right-0 flex ${widthClassName} flex-col border-l border-neutral-800 bg-neutral-900 shadow-xl transition-transform duration-200 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-neutral-800 px-5 py-4">
          <h2 className="text-sm font-semibold text-neutral-100">{title}</h2>
          <button type="button" onClick={onClose} className="text-neutral-400 hover:text-neutral-100" aria-label="Close">
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>,
    document.body
  );
}
