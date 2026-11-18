import { describe, expect, test } from "vitest";
import feedsFixture from "@/e2e/fixtures/feeds.json";
import { FeedsResponseSchema, type FeedSummary } from "./api/schemas";
import { ageRatio, feedHref, filterFeeds, isIssue, sortFeeds, statusDisplay, summarize } from "./feeds";

const feed = (chain: FeedSummary["chain"], feedId: string, status: string): FeedSummary => ({ chain, feedId, status });

describe("feeds", () => {
  test("[FR-FW-7] status tones and labels", () => {
    expect(statusDisplay("error")).toEqual({ tone: "danger", label: "Error" });
    expect(statusDisplay("stale")).toEqual({ tone: "warning", label: "Stale" });
    expect(statusDisplay("drift")).toEqual({ tone: "info", label: "Drift" });
    expect(statusDisplay("ok")).toEqual({ tone: "success", label: "OK" });
    expect(statusDisplay("unknown")).toEqual({ tone: "neutral", label: "Unknown" });
    expect(statusDisplay("")).toEqual({ tone: "neutral", label: "Unknown" });
    expect(statusDisplay("toString")).toEqual({ tone: "neutral", label: "ToString" });
    expect(isIssue("ok")).toBe(false);
    expect(isIssue("stale")).toBe(true);
  });

  test("[FR-FW-7] sorts worst first, then by chain, then by feed", () => {
    const sorted = sortFeeds([
      feed("base", "ETH", "ok"),
      feed("ethereum", "ETH", "ok"),
      feed("base", "BTC", "ok"),
      feed("arbitrum", "X", "weird"),
      feed("ethereum", "USUAL", "error"),
      feed("base", "A", "drift"),
      feed("arbitrum", "B", "stale"),
    ]);
    expect(sorted.map((f) => `${f.status}:${f.chain}:${f.feedId}`)).toEqual([
      "error:ethereum:USUAL",
      "stale:arbitrum:B",
      "drift:base:A",
      "ok:ethereum:ETH",
      "ok:base:BTC",
      "ok:base:ETH",
      "weird:arbitrum:X",
    ]);
  });

  test("[FR-FW-7] filters by chain, issues and a case-insensitive search", () => {
    const all = [feed("base", "ETH", "ok"), feed("ethereum", "wstETH", "stale"), feed("base", "BTC", "error")];
    expect(filterFeeds(all, { chain: "all", issuesOnly: false, query: "" })).toHaveLength(3);
    expect(filterFeeds(all, { chain: "base", issuesOnly: false, query: "" })).toHaveLength(2);
    expect(filterFeeds(all, { chain: "all", issuesOnly: true, query: "" })).toHaveLength(2);
    expect(filterFeeds(all, { chain: "all", issuesOnly: false, query: " eth " }).map((f) => f.feedId)).toEqual([
      "ETH",
      "wstETH",
    ]);
    expect(filterFeeds(all, { chain: "base", issuesOnly: true, query: "eth" })).toEqual([]);
  });

  test("[FR-FW-7] summarises the recorded production feeds", () => {
    const { feeds } = FeedsResponseSchema.parse(feedsFixture);
    expect(summarize(feeds)).toEqual({ total: 146, ok: 145, issues: 1 });
  });

  test("[FR-FW-7] age ratio and links", () => {
    expect(ageRatio(43_200, 86_400)).toBe(0.5);
    expect(ageRatio(null, 86_400)).toBeNull();
    expect(ageRatio(10, 0)).toBeNull();
    expect(ageRatio(10, undefined)).toBeNull();
    expect(feedHref("base", "CASH+_FUNDAMENTAL")).toBe("/feed/?chain=base&id=CASH%2B_FUNDAMENTAL");
  });
});
