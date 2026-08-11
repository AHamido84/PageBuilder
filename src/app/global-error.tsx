"use client";

import { useEffect } from "react";
import "./globals.css";

// Catches errors thrown by the root layout itself (src/app/[locale]/layout.tsx acts as the
// root layout here, since this app has no separate top-level layout.tsx). Deliberately minimal
// and locale-agnostic -- next-intl's provider lives inside the layout that may have just failed,
// so this can't depend on it. Re-imports the global stylesheet directly, per Next.js's own
// guidance for global-error.tsx, since it replaces <html>/<body> entirely.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center bg-paper px-6 text-center text-ink">
        <h1 className="font-display text-3xl">Something went wrong</h1>
        <p className="mx-auto mt-3 max-w-md text-ink/60">
          An unexpected error occurred. Please try again, or head back to the homepage.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="rounded-[var(--radius-sm)] bg-ink px-5 py-2.5 text-sm font-medium text-paper hover:opacity-90"
          >
            Try again
          </button>
          {/* Plain <a>, not next/link -- this boundary exists specifically for when the app shell
              (including the router) may itself be broken; a full navigation is the safe fallback. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a
            href="/"
            className="rounded-[var(--radius-sm)] border border-ink/15 px-5 py-2.5 text-sm font-medium text-ink hover:bg-ink/5"
          >
            Back to home
          </a>
        </div>
      </body>
    </html>
  );
}
