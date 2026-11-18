import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { useNow, useQueryParam } from "./use-query-param";

const CHAINS = ["all", "ethereum", "base"] as const;

afterEach(() => {
  window.history.replaceState(null, "", "/");
  vi.useRealTimers();
});

describe("useQueryParam", () => {
  test("[FR-FW-7] reads an allowed value from the URL after mount", () => {
    window.history.replaceState(null, "", "/?chain=base&x=1");
    const { result } = renderHook(() => useQueryParam("chain", CHAINS, "all"));
    expect(result.current[0]).toBe("base");
  });

  test("[FR-FW-7] ignores a value that isn't allowed", () => {
    window.history.replaceState(null, "", "/?chain=solana");
    const { result } = renderHook(() => useQueryParam("chain", CHAINS, "all"));
    expect(result.current[0]).toBe("all");
  });

  test("[FR-FW-7] writes the URL without adding history, dropping the fallback", () => {
    window.history.replaceState(null, "", "/?x=1#top");
    const before = window.history.length;
    const { result } = renderHook(() => useQueryParam("chain", CHAINS, "all"));
    act(() => result.current[1]("ethereum"));
    expect(result.current[0]).toBe("ethereum");
    expect(window.location.search).toBe("?x=1&chain=ethereum");
    expect(window.location.hash).toBe("#top");
    act(() => result.current[1]("all"));
    expect(window.location.search).toBe("?x=1");
    expect(window.history.length).toBe(before);
  });
});

describe("useNow", () => {
  test("[FR-FW-7] ticks on its interval", () => {
    vi.useFakeTimers({ toFake: ["setInterval", "clearInterval", "Date"], now: 1_000 });
    const { result, unmount } = renderHook(() => useNow(5_000));
    expect(result.current).toBe(1_000);
    act(() => vi.advanceTimersByTime(5_000));
    expect(result.current).toBe(6_000);
    unmount();
  });
});
