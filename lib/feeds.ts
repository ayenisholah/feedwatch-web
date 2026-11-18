import type { Chain, FeedSummary } from "./api/schemas";

/**
 * Feed rules shared by the pages: status order and tone, filtering, sorting and the age ratio.
 * Status values and the 1.1 grace come from feedwatch-platform SPEC ("Checks").
 */

export const CHAIN_NAMES: Record<Chain, string> = {
  ethereum: "Ethereum",
  arbitrum: "Arbitrum",
  base: "Base",
};

/** A feed is `stale` once its age passes heartbeat × this. */
export const STALE_GRACE = 1.1;

export type Status = "error" | "stale" | "drift" | "ok";
export type Tone = "danger" | "warning" | "info" | "success" | "neutral";

const STATUS: Record<Status, { rank: number; tone: Tone; label: string }> = {
  error: { rank: 0, tone: "danger", label: "Error" },
  stale: { rank: 1, tone: "warning", label: "Stale" },
  drift: { rank: 2, tone: "info", label: "Drift" },
  ok: { rank: 3, tone: "success", label: "OK" },
};

function known(status: string): status is Status {
  return Object.hasOwn(STATUS, status);
}

/** The badge tone and label for a status; anything unexpected is neutral. */
export function statusDisplay(status: string): { tone: Tone; label: string } {
  if (known(status)) return { tone: STATUS[status].tone, label: STATUS[status].label };
  return { tone: "neutral", label: status ? status.charAt(0).toUpperCase() + status.slice(1) : "Unknown" };
}

/** Whether a status needs attention: anything but `ok`. */
export function isIssue(status: string): boolean {
  return status !== "ok";
}

/** Worst first (error, stale, drift, ok, then unknown), then by chain order, then feed ID. */
export function sortFeeds(feeds: readonly FeedSummary[]): FeedSummary[] {
  const rank = (s: string) => (known(s) ? STATUS[s].rank : 4);
  const chainRank = (c: Chain) => Object.keys(CHAIN_NAMES).indexOf(c);
  return [...feeds].sort(
    (a, b) =>
      rank(a.status) - rank(b.status) ||
      chainRank(a.chain) - chainRank(b.chain) ||
      a.feedId.localeCompare(b.feedId, "en"),
  );
}

export type FeedFilter = { chain: Chain | "all"; issuesOnly: boolean; query: string };

/** Feeds matching the chain, the issues-only switch, and a case-insensitive feed ID search. */
export function filterFeeds(feeds: readonly FeedSummary[], { chain, issuesOnly, query }: FeedFilter): FeedSummary[] {
  const needle = query.trim().toLowerCase();
  return feeds.filter(
    (f) =>
      (chain === "all" || f.chain === chain) &&
      (!issuesOnly || isIssue(f.status)) &&
      (!needle || f.feedId.toLowerCase().includes(needle)),
  );
}

/** Counts for the summary widgets. */
export function summarize(feeds: readonly FeedSummary[]): { total: number; ok: number; issues: number } {
  const issues = feeds.filter((f) => isIssue(f.status)).length;
  return { total: feeds.length, ok: feeds.length - issues, issues };
}

/** Age as a fraction of the heartbeat (1 = due now), or null when either is unknown. */
export function ageRatio(ageS: number | null | undefined, heartbeatS: number | null | undefined): number | null {
  if (ageS === null || ageS === undefined || !heartbeatS) return null;
  return ageS / heartbeatS;
}

/** The feed detail page's URL. */
export function feedHref(chain: Chain, feedId: string): string {
  return `/feed/?chain=${chain}&id=${encodeURIComponent(feedId)}`;
}
