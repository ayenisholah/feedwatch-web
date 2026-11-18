import type { z } from "zod";

/**
 * Where the API lives. Empty in production: the site and `/api/*` share an origin. Local
 * development points it at the compose API with `NEXT_PUBLIC_API_BASE=http://localhost:8080`.
 */
export const API_BASE = (process.env.NEXT_PUBLIC_API_BASE ?? "").replace(/\/+$/, "");

/** Why a request failed, in words a page can show. `status` is 0 when no response arrived. */
export type ApiError = { status: number; message: string };

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: ApiError };

/** Messages for the statuses the API returns (feedwatch-platform `docs/DATA_CONTRACT.md`). */
function messageFor(status: number, body: unknown): string {
  if (status === 429) return "Too many requests. The data will refresh in a moment.";
  if (status === 503) return "Feed data is temporarily unavailable.";
  if (body && typeof body === "object" && "error" in body && typeof body.error === "string") {
    return body.error;
  }
  return `The API answered with HTTP ${status}.`;
}

/**
 * GETs `path` from the API and validates the body with `schema`. Never throws: network failures,
 * error statuses and unexpected bodies all come back as `{ ok: false }`. An aborted request
 * rethrows the abort, so callers can tell it apart from a failure.
 */
export async function fetchJson<S extends z.ZodType>(
  path: string,
  schema: S,
  signal?: AbortSignal,
  fetcher: typeof fetch = fetch,
): Promise<ApiResult<z.infer<S>>> {
  let response: Response;
  try {
    response = await fetcher(`${API_BASE}${path}`, { signal, headers: { accept: "application/json" } });
  } catch (error) {
    if (signal?.aborted) throw error;
    return { ok: false, error: { status: 0, message: "Couldn't reach the Feedwatch API. Check your connection." } };
  }
  const body: unknown = await response.json().catch(() => undefined);
  if (!response.ok) {
    return { ok: false, error: { status: response.status, message: messageFor(response.status, body) } };
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return {
      ok: false,
      error: { status: response.status, message: "The API sent a response this page doesn't understand." },
    };
  }
  return { ok: true, data: parsed.data };
}
