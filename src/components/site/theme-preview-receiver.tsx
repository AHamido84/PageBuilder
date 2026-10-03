"use client";

import { useEffect } from "react";

export const THEME_PREVIEW_MESSAGE = "theme-preview:css";

/**
 * Live preview for the admin Appearance page. That page shows this site in an iframe and posts
 * the CSS for its unsaved theme here; this swaps it in place of the saved theme so the admin sees
 * exactly what Save would publish.
 *
 * Inert for normal visitors: it only listens when the page is framed, and only accepts messages
 * from its own parent window on the same origin (the CSP's frame-ancestors 'self' already stops
 * any other site from framing it). Nothing is persisted -- a reload shows the saved theme again.
 */
export function ThemePreviewReceiver() {
  useEffect(() => {
    if (window.parent === window) return;

    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin || event.source !== window.parent) return;
      const data = event.data as { type?: string; css?: unknown } | null;
      if (data?.type !== THEME_PREVIEW_MESSAGE || typeof data.css !== "string") return;

      const saved = document.getElementById("theme-overrides") as HTMLStyleElement | null;
      if (saved) saved.disabled = true;
      let preview = document.getElementById("theme-preview") as HTMLStyleElement | null;
      if (!preview) {
        preview = document.createElement("style");
        preview.id = "theme-preview";
        document.head.appendChild(preview);
      }
      preview.textContent = data.css;
    }

    window.addEventListener("message", onMessage);
    // Tell the editor this frame is ready, so it sends the current (unsaved) theme right away.
    window.parent.postMessage({ type: "theme-preview:ready" }, window.location.origin);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return null;
}
