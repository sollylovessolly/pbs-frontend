"use client";
import { useEffect, useState } from "react";
import { adminRequest } from "@/lib/admin/api";
export function useAdminQuery<T>(path: string | null, refresh = 0) {
  const [state, setState] = useState<{
    path: string | null;
    data?: T;
    error?: string;
    loading: boolean;
  }>({ path, loading: true });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!path) return;
    const c = new AbortController();
    queueMicrotask(() => {
      if (!c.signal.aborted) setState({ path, loading: true });
    });
    adminRequest<T>(path, { signal: c.signal })
      .then((data) => {
        if (!c.signal.aborted) setState({ path, data, loading: false });
      })
      .catch((e) => {
        if (!c.signal.aborted && e.name !== "AbortError")
          setState({ path, error: e.message, loading: false });
      });
    return () => c.abort();
  }, [path, refresh, attempt]);
  return {
    ...(state.path === path
      ? state
      : { path, data: undefined, error: undefined, loading: true }),
    retry: () => setAttempt((n) => n + 1),
  };
}
