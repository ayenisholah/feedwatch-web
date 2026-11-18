/**
 * Display formatting for feed data. Pure, and in English with `en-US` number grouping. A missing
 * value always renders as an em dash, so tables keep their shape.
 */

export const MISSING = "—";

type Maybe<T> = T | null | undefined;

const grouped = (digits: number) =>
  new Intl.NumberFormat("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
const significant = new Intl.NumberFormat("en-US", { maximumSignificantDigits: 4 });

/**
 * A price at a precision that suits its size: cents from 1,000 up, four decimals from 1, and four
 * significant digits below that (so 0.00001234 stays readable).
 */
export function formatPrice(value: Maybe<number>): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return MISSING;
  const size = Math.abs(value);
  if (size >= 1000) return grouped(2).format(value);
  if (size >= 1) return grouped(4).format(value);
  return significant.format(value);
}

/** A percentage, such as `0.25%`. */
export function formatPercent(value: Maybe<number>, digits = 2): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return MISSING;
  return `${grouped(digits).format(value)}%`;
}

/** A length of time in its two largest units: `45s`, `12m 5s`, `4h 12m`, `2d 3h`. */
export function formatDuration(seconds: Maybe<number>): string {
  if (seconds === null || seconds === undefined || !Number.isFinite(seconds) || seconds < 0) return MISSING;
  const s = Math.floor(seconds);
  const units: [number, string][] = [
    [Math.floor(s / 86_400), "d"],
    [Math.floor((s % 86_400) / 3_600), "h"],
    [Math.floor((s % 3_600) / 60), "m"],
    [s % 60, "s"],
  ];
  const first = units.findIndex(([n]) => n > 0);
  if (first === -1) return "0s";
  return units
    .slice(first, first + 2)
    .filter(([n], i) => i === 0 || n > 0)
    .map(([n, unit]) => `${n}${unit}`)
    .join(" ");
}

/** How long ago `unixSeconds` was, as seen at `nowMs`: `just now` under 5 s, else `4h 12m ago`. */
export function formatAgo(unixSeconds: Maybe<number>, nowMs: number): string {
  if (unixSeconds === null || unixSeconds === undefined) return MISSING;
  const elapsed = Math.max(0, nowMs / 1000 - unixSeconds);
  return elapsed < 5 ? "just now" : `${formatDuration(elapsed)} ago`;
}

/** An absolute UTC time, such as `2026-11-18 06:13 UTC`. */
export function formatUtc(unixSeconds: Maybe<number>): string {
  if (unixSeconds === null || unixSeconds === undefined) return MISSING;
  return `${new Date(unixSeconds * 1000).toISOString().slice(0, 16).replace("T", " ")} UTC`;
}

/** The ISO form for a `<time dateTime>` attribute. */
export function isoTime(unixSeconds: number): string {
  return new Date(unixSeconds * 1000).toISOString();
}
