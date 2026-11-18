import { describe, expect, test } from "vitest";
import { formatAgo, formatDuration, formatPercent, formatPrice, formatUtc, isoTime, MISSING } from "./format";

describe("format", () => {
  test("[FR-FW-7] prices use a precision that suits their size", () => {
    expect(formatPrice(3120.5)).toBe("3,120.50");
    expect(formatPrice(91234.567)).toBe("91,234.57");
    expect(formatPrice(1.00012)).toBe("1.0001");
    expect(formatPrice(0.0000123456)).toBe("0.00001235");
    expect(formatPrice(-1500)).toBe("-1,500.00");
    expect(formatPrice(0)).toBe("0");
    for (const missing of [null, undefined, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(formatPrice(missing)).toBe(MISSING);
    }
  });

  test("[FR-FW-7] percentages", () => {
    expect(formatPercent(0.2526)).toBe("0.25%");
    expect(formatPercent(0.013488, 3)).toBe("0.013%");
    expect(formatPercent(null)).toBe(MISSING);
    expect(formatPercent(Number.NaN)).toBe(MISSING);
  });

  test("[FR-FW-7] durations show their two largest units", () => {
    expect(formatDuration(0)).toBe("0s");
    expect(formatDuration(45.9)).toBe("45s");
    expect(formatDuration(725)).toBe("12m 5s");
    expect(formatDuration(720)).toBe("12m");
    expect(formatDuration(15_120)).toBe("4h 12m");
    expect(formatDuration(86_400)).toBe("1d");
    expect(formatDuration(97_200 + 86_400)).toBe("2d 3h");
    expect(formatDuration(86_400 + 60)).toBe("1d");
    for (const missing of [null, undefined, -1, Number.NaN]) expect(formatDuration(missing)).toBe(MISSING);
  });

  test("[FR-FW-7] relative and absolute times", () => {
    const now = 1_794_960_300_000;
    expect(formatAgo(1_794_960_298, now)).toBe("just now");
    expect(formatAgo(1_794_960_300 - 90, now)).toBe("1m 30s ago");
    expect(formatAgo(1_794_960_400, now)).toBe("just now");
    expect(formatAgo(null, now)).toBe(MISSING);
    expect(formatUtc(1_794_960_300)).toBe("2026-11-18 00:05 UTC");
    expect(formatUtc(undefined)).toBe(MISSING);
    expect(isoTime(1_794_960_300)).toBe("2026-11-18T00:05:00.000Z");
  });
});
