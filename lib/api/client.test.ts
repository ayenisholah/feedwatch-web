import { describe, expect, test, vi } from "vitest";
import { z } from "zod";
import { fetchJson } from "./client";

const schema = z.object({ status: z.string() });

function respond(status: number, body: unknown): typeof fetch {
  return vi.fn(async () => new Response(body === undefined ? "not json" : JSON.stringify(body), { status }));
}

describe("fetchJson", () => {
  test("[FR-FW-7] returns validated data and asks for JSON", async () => {
    const fetcher = respond(200, { status: "ok", extra: 1 });
    await expect(fetchJson("/api/health", schema, undefined, fetcher)).resolves.toEqual({
      ok: true,
      data: { status: "ok" },
    });
    expect(fetcher).toHaveBeenCalledWith(
      "/api/health",
      expect.objectContaining({ headers: { accept: "application/json" } }),
    );
  });

  test("[FR-FW-7] maps error statuses to messages a page can show", async () => {
    const cases: [number, unknown, string][] = [
      [400, { error: 'unknown chain "x"' }, 'unknown chain "x"'],
      [404, { error: "no data for feed" }, "no data for feed"],
      [429, { error: "slow down" }, "Too many requests. The data will refresh in a moment."],
      [503, { error: "x" }, "Feed data is temporarily unavailable."],
      [500, undefined, "The API answered with HTTP 500."],
      [502, { error: 42 }, "The API answered with HTTP 502."],
    ];
    for (const [status, body, message] of cases) {
      await expect(fetchJson("/api/x", schema, undefined, respond(status, body))).resolves.toEqual({
        ok: false,
        error: { status, message },
      });
    }
  });

  test("[FR-FW-7] rejects a body that doesn't match the contract", async () => {
    const result = await fetchJson("/api/x", schema, undefined, respond(200, { status: 1 }));
    expect(result).toEqual({
      ok: false,
      error: { status: 200, message: "The API sent a response this page doesn't understand." },
    });
  });

  test("[FR-FW-7] reports a network failure, but rethrows an abort", async () => {
    const offline = vi.fn(async () => {
      throw new TypeError("Failed to fetch");
    });
    await expect(fetchJson("/api/x", schema, undefined, offline)).resolves.toEqual({
      ok: false,
      error: { status: 0, message: "Couldn't reach the Feedwatch API. Check your connection." },
    });

    const controller = new AbortController();
    controller.abort();
    const aborted = vi.fn(async () => {
      throw new DOMException("aborted", "AbortError");
    });
    await expect(fetchJson("/api/x", schema, controller.signal, aborted)).rejects.toThrow("aborted");
  });
});
