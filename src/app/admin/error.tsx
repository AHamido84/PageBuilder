"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-950 px-6 text-center text-neutral-100">
      <h1 className="text-xl font-semibold">Something went wrong</h1>
      <p className="mx-auto mt-2 max-w-md text-sm text-neutral-400">
        An unexpected error occurred loading this page. Please try again, or head back to the dashboard.
      </p>
      <div className="mt-6 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-md bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-white"
        >
          Try again
        </button>
        <Link href="/admin" className="rounded-md border border-neutral-700 px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-900">
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
