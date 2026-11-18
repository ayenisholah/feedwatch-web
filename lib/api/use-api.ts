"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { z } from "zod";
import { type ApiError, fetchJson } from "./client";

/** How often pages refresh: the API caches data routes for 30 s, so faster gains nothing. */
export const REFRESH_MS = 30_000;

export type ApiState<T> =
  | { state: "loading" }
  | { state: "error"; error: ApiError; data?: T; refreshedAt?: number }
  | { state: "empty"; data: T; refreshedAt: number }
  | { state: "data"; data: T; refreshedAt: number };

export type UseApiOptions<T> = {
  /** Treats a successful response as empty, such as a list with no items. */
  isEmpty?: (data: T) => boolean;
  /** Skips fetching, for a page whose query string isn't valid yet. */
  enabled?: boolean;
  /** Refresh interval in ms; 0 disables polling. */
  refreshMs?: number;
};

/**
 * Fetches `path`, validates it with `schema`, and refreshes every {@link REFRESH_MS} while the tab
 * is visible. A failed refresh keeps the last good data alongside the error, so a page can show
 * both. `retry` fetches again at once.
 */
export function useApi<S extends z.ZodType>(
  path: string,
  schema: S,
  { isEmpty, enabled = true, refreshMs = REFRESH_MS }: UseApiOptions<z.infer<S>> = {},
): ApiState<z.infer<S>> & { retry: () => void } {
  type T = z.infer<S>;
  const [result, setResult] = useState<ApiState<T>>({ state: "loading" });
  const [attempt, setAttempt] = useState(0);
  // Kept in refs so a new function or schema identity from the caller doesn't restart polling.
  // This effect is declared first, so the refs are current when the loading effect runs.
  const isEmptyRef = useRef(isEmpty);
  const schemaRef = useRef(schema);
  useEffect(() => {
    isEmptyRef.current = isEmpty;
    schemaRef.current = schema;
  });

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;

    const load = async () => {
      clearTimeout(timer);
      if (document.visibilityState === "hidden") return;
      try {
        const response = await fetchJson(path, schemaRef.current, controller.signal);
        if (response.ok) {
          const data = response.data as T;
          const refreshedAt = Date.now();
          setResult({ state: isEmptyRef.current?.(data) ? "empty" : "data", data, refreshedAt });
        } else {
          setResult((previous) =>
            "data" in previous
              ? { state: "error", error: response.error, data: previous.data, refreshedAt: previous.refreshedAt }
              : { state: "error", error: response.error },
          );
        }
      } catch {
        return; // Aborted: the component unmounted or the path changed.
      }
      if (refreshMs > 0) timer = setTimeout(() => void load(), refreshMs);
    };

    // Coming back to the tab refreshes at once, then resumes the interval.
    const onVisibility = () => {
      if (document.visibilityState === "visible") void load();
    };
    document.addEventListener("visibilitychange", onVisibility);
    void load();
    return () => {
      controller.abort();
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [path, enabled, refreshMs, attempt]);

  const retry = useCallback(() => {
    setResult({ state: "loading" });
    setAttempt((n) => n + 1);
  }, []);

  return { ...result, retry };
}
