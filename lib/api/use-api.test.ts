import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { z } from "zod";
import { REFRESH_MS, useApi } from "./use-api";

const schema = z.object({ items: z.array(z.number()) });
const isEmpty = (d: z.infer<typeof schema>) => d.items.length === 0;

let fetchMock: ReturnType<typeof vi.fn>;

function reply(status: number, body: unknown) {
  fetchMock.mockImplementationOnce(async () => new Response(JSON.stringify(body), { status }));
}

function setVisibility(state: "visible" | "hidden") {
  Object.defineProperty(document, "visibilityState", { configurable: true, get: () => state });
  document.dispatchEvent(new Event("visibilitychange"));
}

/** Lets pending fetches and state updates settle. */
async function flush(ms = 0) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date"] });
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  setVisibility("visible");
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("useApi", () => {
  test("[FR-FW-7] goes from loading to data, then to empty on the next refresh", async () => {
    reply(200, { items: [1, 2] });
    reply(200, { items: [] });
    const { result } = renderHook(() => useApi("/api/feeds", schema, { isEmpty }));
    expect(result.current.state).toBe("loading");

    await flush();
    expect(result.current).toMatchObject({ state: "data", data: { items: [1, 2] } });

    await flush(REFRESH_MS);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.current).toMatchObject({ state: "empty", data: { items: [] } });
  });

  test("[FR-FW-7] keeps the last data when a refresh fails, and retry reloads", async () => {
    reply(200, { items: [1] });
    reply(503, { error: "down" });
    reply(200, { items: [2] });
    const { result } = renderHook(() => useApi("/api/feeds", schema));
    await flush();
    await flush(REFRESH_MS);
    expect(result.current).toMatchObject({
      state: "error",
      error: { status: 503, message: "Feed data is temporarily unavailable." },
      data: { items: [1] },
    });

    act(() => result.current.retry());
    expect(result.current.state).toBe("loading");
    await flush();
    expect(result.current).toMatchObject({ state: "data", data: { items: [2] } });
  });

  test("[FR-FW-7] an error with no earlier data has no data", async () => {
    reply(404, { error: "no data for feed" });
    const { result } = renderHook(() => useApi("/api/feeds/base/NOPE", schema));
    await flush();
    expect(result.current).toEqual({
      state: "error",
      error: { status: 404, message: "no data for feed" },
      retry: expect.any(Function),
    });
  });

  test("[FR-FW-7] pauses while the tab is hidden and refreshes on return", async () => {
    reply(200, { items: [1] });
    renderHook(() => useApi("/api/feeds", schema));
    await flush();
    setVisibility("hidden");
    await flush(REFRESH_MS * 3);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    reply(200, { items: [2] });
    setVisibility("visible");
    await flush();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  test("[FR-FW-7] does nothing when disabled or polling is off, and aborts on unmount", async () => {
    const { result } = renderHook(() => useApi("/api/feeds", schema, { enabled: false }));
    await flush(REFRESH_MS);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.current.state).toBe("loading");

    reply(200, { items: [1] });
    renderHook(() => useApi("/api/once", schema, { refreshMs: 0 }));
    await flush(REFRESH_MS * 2);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    let signal: AbortSignal | undefined;
    fetchMock.mockImplementationOnce((_url: string, init: RequestInit) => {
      signal = init.signal ?? undefined;
      return new Promise((_resolve, reject) => {
        init.signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")));
      });
    });
    const { unmount } = renderHook(() => useApi("/api/slow", schema));
    await flush();
    unmount();
    await flush();
    expect(signal?.aborted).toBe(true);
  });
});
