"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * One query-string parameter as React state, limited to `allowed` values. It's read after mount,
 * because the static export renders without a URL, and written with `history.replaceState`, so
 * changing a filter doesn't add history entries or reload. The fallback value is left out of the URL.
 */
export function useQueryParam<T extends string>(name: string, allowed: readonly T[], fallback: T): [T, (v: T) => void] {
  const [value, setValue] = useState<T>(fallback);

  useEffect(() => {
    const current = new URLSearchParams(window.location.search).get(name);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read the URL after mount
    if (current !== null && (allowed as readonly string[]).includes(current)) setValue(current as T);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `allowed` is a constant in every caller
  }, [name]);

  const update = useCallback(
    (next: T) => {
      setValue(next);
      const url = new URL(window.location.href);
      if (next === fallback) url.searchParams.delete(name);
      else url.searchParams.set(name, next);
      window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
    },
    [name, fallback],
  );

  return [value, update];
}

/** The current time in ms, refreshed every `intervalMs`, for "N s ago" labels. */
export function useNow(intervalMs = 5_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

/** The page's query string, or null until mounted (the static export renders without a URL). */
export function useSearchParams(): URLSearchParams | null {
  const [params, setParams] = useState<URLSearchParams | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read the URL after mount
    setParams(new URLSearchParams(window.location.search));
  }, []);
  return params;
}
