import { describe, expect, test } from "vitest";
import compareFixture from "@/e2e/fixtures/compare.json";
import { type CompareRow, CompareResponseSchema } from "./api/schemas";
import { extremes, sortBySpread, spreadIsWide } from "./compare";

const row = (
  values: Partial<Record<"ethereum" | "arbitrum" | "base", number | null>>,
  spreadPct?: number | null,
): CompareRow => ({
  feedId: "X",
  spreadPct,
  chains: Object.fromEntries(Object.entries(values).map(([c, v]) => [c, { value: v, status: "ok" }])),
});

describe("compare", () => {
  test("[FR-FW-7] flags spreads above the default deviation trigger", () => {
    expect(spreadIsWide(0.51)).toBe(true);
    expect(spreadIsWide(0.5)).toBe(false);
    expect(spreadIsWide(null)).toBe(false);
    expect(spreadIsWide(undefined)).toBe(false);
  });

  test("[FR-FW-7] marks the highest and lowest chains, with ties", () => {
    expect(extremes(row({ ethereum: 1, arbitrum: 3, base: 2 }))).toEqual({ high: ["arbitrum"], low: ["ethereum"] });
    expect(extremes(row({ ethereum: 2.36, arbitrum: 2.37, base: 2.36 }))).toEqual({
      high: ["arbitrum"],
      low: ["ethereum", "base"],
    });
    expect(extremes(row({ ethereum: 1, arbitrum: 1, base: 1 }))).toEqual({ high: [], low: [] });
    expect(extremes(row({ ethereum: 1, arbitrum: null }))).toEqual({ high: [], low: [] });
    expect(extremes(row({}))).toEqual({ high: [], low: [] });
  });

  test("[FR-FW-7] sorts the widest spread first, using the recorded production rows", () => {
    const { feeds } = CompareResponseSchema.parse(compareFixture);
    expect(sortBySpread(feeds).map((f) => f.feedId)).toEqual([
      "XVS",
      "ETH",
      "wstETH",
      "cbBTC",
      "BTC",
      "USDC",
      "thBILL_FUNDAMENTAL",
    ]);
    const tie = (feedId: string) => ({ ...row({ ethereum: 1 }, 0.1), feedId });
    expect(sortBySpread([tie("b"), tie("a")]).map((f) => f.feedId)).toEqual(["a", "b"]);
    const missing = { ...row({ ethereum: 1 }), feedId: "A", spreadPct: null };
    expect(sortBySpread([missing, { ...row({}, 0), feedId: "B" }]).map((f) => f.feedId)).toEqual(["B", "A"]);
  });
});
