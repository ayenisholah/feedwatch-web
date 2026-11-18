import { vi } from "vitest";
import feeds from "@/e2e/fixtures/feeds.json";
import health from "@/e2e/fixtures/health.json";

/** Recorded production responses by path, for component tests. */
export const fixtures = { feeds, health };

type Reply = { status?: number; body: unknown } | "hang";

/**
 * Replaces `fetch` with one that answers by the path's start: the longest matching key wins.
 * Unmatched paths get 404. Returns the mock, so tests can count calls.
 */
export function stubApi(routes: Record<string, Reply>) {
  const keys = Object.keys(routes).sort((a, b) => b.length - a.length);
  const mock = vi.fn(async (url: string) => {
    const key = keys.find((k) => url.startsWith(k));
    const reply = key === undefined ? { status: 404, body: { error: "not stubbed" } } : routes[key]!;
    if (reply === "hang") return new Promise<Response>(() => {});
    return new Response(JSON.stringify(reply.body), { status: reply.status ?? 200 });
  });
  vi.stubGlobal("fetch", mock);
  return mock;
}
