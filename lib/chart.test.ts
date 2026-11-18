import { describe, expect, test } from "vitest";
import { linePath, nearestIndex, niceTicks, scale, timeTicks, values } from "./chart";

describe("chart geometry", () => {
  test("[FR-FW-7] scales map domains to ranges", () => {
    const x = scale([0, 10], [100, 200]);
    expect(x(0)).toBe(100);
    expect(x(5)).toBe(150);
    const inverted = scale([0, 1], [200, 0]);
    expect(inverted(1)).toBe(0);
    expect(scale([3, 3], [0, 100])(3)).toBe(50);
  });

  test("[FR-FW-7] ticks are round numbers that cover the data", () => {
    expect(niceTicks(1803.2, 1829.7, 4)).toEqual({ ticks: [1800, 1810, 1820, 1830], domain: [1800, 1830] });
    expect(niceTicks(0, 86_400, 4).ticks).toEqual([0, 50_000, 100_000]);
    expect(niceTicks(0.9998, 1.0003, 4).ticks).toEqual([0.9998, 1, 1.0002, 1.0004]);
    // A flat series still gets a range around it.
    const flat = niceTicks(1, 1, 4);
    expect(flat.domain[0]).toBeLessThan(1);
    expect(flat.domain[1]).toBeGreaterThan(1);
    expect(niceTicks(0, 0).domain).toEqual([-1, 1]);
  });

  test("[FR-FW-7] time ticks fall on whole steps", () => {
    expect(timeTicks(1_000, 30_000, 10_800)).toEqual([10_800, 21_600]);
    expect(timeTicks(10_800, 10_800, 10_800)).toEqual([10_800]);
  });

  test("[FR-FW-7] the line breaks at missing values", () => {
    const id = (v: number) => v;
    expect(
      linePath(
        [
          { t: 0, y: 1 },
          { t: 1, y: 2 },
          { t: 2, y: null },
          { t: 3, y: 4 },
          { t: 4, y: undefined },
        ],
        id,
        id,
      ),
    ).toBe("M0.0,1.0L1.0,2.0M3.0,4.0");
    expect(linePath([], id, id)).toBe("");
    // An outage: no points for a while breaks the line too.
    const outage = [
      { t: 0, y: 1 },
      { t: 300, y: 1 },
      { t: 40_000, y: 2 },
      { t: 40_300, y: 3 },
    ];
    expect(linePath(outage, id, id, 900)).toBe("M0.0,1.0L300.0,1.0M40000.0,2.0L40300.0,3.0");
  });

  test("[FR-FW-7] finds the nearest point and the finite values", () => {
    const points = [
      { t: 0, y: 1 },
      { t: 300, y: null },
      { t: 600, y: 3 },
    ];
    expect(nearestIndex(points, 280)).toBe(1);
    expect(nearestIndex(points, 9_999)).toBe(2);
    expect(nearestIndex([], 5)).toBe(-1);
    expect(values([...points, { t: 900, y: Number.NaN }])).toEqual([1, 3]);
  });
});
