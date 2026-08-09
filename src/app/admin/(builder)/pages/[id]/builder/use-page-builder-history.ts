"use client";

import { useCallback, useRef, useState } from "react";

interface HistoryState<T> {
  past: T[];
  present: T;
  future: T[];
}

/** Client-side undo/redo over an in-memory state value. Rapid changes (text typing) coalesce into one history entry via debounce; discrete changes (add/delete/reorder/duplicate) push immediately. */
export function usePageBuilderHistory<T>(initial: T, maxDepth = 50) {
  const [state, setState] = useState<HistoryState<T>>({ past: [], present: initial, future: [] });
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingBaseRef = useRef<T | null>(null);

  const commit = useCallback(
    (updater: T | ((prev: T) => T), opts?: { debounce?: boolean }) => {
      setState((s) => {
        const next = typeof updater === "function" ? (updater as (prev: T) => T)(s.present) : updater;
        if (opts?.debounce) {
          if (pendingBaseRef.current === null) pendingBaseRef.current = s.present;
          if (debounceRef.current) clearTimeout(debounceRef.current);
          debounceRef.current = setTimeout(() => {
            setState((s2) => ({ past: [...s2.past, pendingBaseRef.current as T].slice(-maxDepth), present: s2.present, future: [] }));
            pendingBaseRef.current = null;
          }, 500);
          return { ...s, present: next };
        }
        return { past: [...s.past, s.present].slice(-maxDepth), present: next, future: [] };
      });
    },
    [maxDepth]
  );

  const undo = useCallback(() => {
    setState((s) => {
      if (s.past.length === 0) return s;
      const previous = s.past[s.past.length - 1];
      return { past: s.past.slice(0, -1), present: previous, future: [s.present, ...s.future] };
    });
  }, []);

  const redo = useCallback(() => {
    setState((s) => {
      if (s.future.length === 0) return s;
      const [next, ...rest] = s.future;
      return { past: [...s.past, s.present], present: next, future: rest };
    });
  }, []);

  return { present: state.present, commit, undo, redo, canUndo: state.past.length > 0, canRedo: state.future.length > 0 };
}
