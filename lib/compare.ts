import type { Chain, CompareRow } from "./api/schemas";
import { CHAIN_NAMES } from "./feeds";

/**
 * Rules for the compare page. A spread above the default deviation trigger (0.5%, feedwatch-platform
 * SPEC) is worth a look: one chain's feed is further from the others than a single update would move it.
 */
export const SPREAD_ALERT_PCT = 0.5;

export const CHAIN_ORDER = Object.keys(CHAIN_NAMES) as Chain[];

/** Whether a spread is above {@link SPREAD_ALERT_PCT}. */
export function spreadIsWide(spreadPct: number | null | undefined): boolean {
  return spreadPct !== null && spreadPct !== undefined && spreadPct > SPREAD_ALERT_PCT;
}

/**
 * Which chains hold the highest and lowest value in a row. Ties mark every tied chain; when every
 * value is equal, or fewer than two chains have one, nothing is marked.
 */
export function extremes(row: CompareRow): { high: Chain[]; low: Chain[] } {
  const known = CHAIN_ORDER.flatMap((chain) => {
    const value = row.chains[chain]?.value;
    return value === null || value === undefined ? [] : [{ chain, value }];
  });
  const vals = known.map((k) => k.value);
  const [max, min] = [Math.max(...vals), Math.min(...vals)];
  if (known.length < 2 || max === min) return { high: [], low: [] };
  return {
    high: known.filter((k) => k.value === max).map((k) => k.chain),
    low: known.filter((k) => k.value === min).map((k) => k.chain),
  };
}

/** Rows with the widest spread first; a missing spread sorts last, then by feed ID. */
export function sortBySpread(rows: readonly CompareRow[]): CompareRow[] {
  const spread = (r: CompareRow) => r.spreadPct ?? -1;
  return [...rows].sort((a, b) => spread(b) - spread(a) || a.feedId.localeCompare(b.feedId, "en"));
}
