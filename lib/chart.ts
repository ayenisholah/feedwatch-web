/**
 * Geometry for the feed detail's line charts: scales, clean tick values, time ticks, the line
 * path (broken at missing values) and nearest-point lookup. Pure, so it's tested without a DOM.
 */

export type Point = { t: number; y: number | null | undefined };

/** Maps `domain` onto `range` linearly. A zero-width domain maps to the middle of the range. */
export function scale([d0, d1]: [number, number], [r0, r1]: [number, number]): (v: number) => number {
  if (d1 === d0) return () => (r0 + r1) / 2;
  return (v) => r0 + ((v - d0) / (d1 - d0)) * (r1 - r0);
}

/**
 * About `count` evenly spaced, round tick values (1, 2 or 5 × 10ⁿ apart) covering `[min, max]`,
 * plus the extended domain they span, so the line never touches the frame.
 */
export function niceTicks(min: number, max: number, count = 4): { ticks: number[]; domain: [number, number] } {
  if (min === max) {
    const pad = Math.abs(min) * 0.01 || 1;
    return niceTicks(min - pad, max + pad, count);
  }
  const raw = (max - min) / count;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const step = ([1, 2, 5].find((m) => m * magnitude >= raw) ?? 10) * magnitude;
  const start = Math.floor(min / step) * step;
  const end = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let v = start; v <= end + step / 2; v += step) ticks.push(Number(v.toPrecision(12)));
  return { ticks, domain: [start, end] };
}

/** Times on whole multiples of `stepS` (UTC) within `[t0, t1]`. */
export function timeTicks(t0: number, t1: number, stepS: number): number[] {
  const ticks: number[] = [];
  for (let t = Math.ceil(t0 / stepS) * stepS; t <= t1; t += stepS) ticks.push(t);
  return ticks;
}

/**
 * An SVG path through the points, broken wherever a value is missing or consecutive points are
 * more than `maxGapS` apart, so a stretch with no data (an outage) isn't drawn as a straight line.
 */
export function linePath(
  points: readonly Point[],
  x: (t: number) => number,
  y: (v: number) => number,
  maxGapS = Number.POSITIVE_INFINITY,
): string {
  let path = "";
  let previous: number | undefined;
  for (const p of points) {
    if (p.y === null || p.y === undefined) {
      previous = undefined;
      continue;
    }
    const pen = previous !== undefined && p.t - previous <= maxGapS;
    path += `${pen ? "L" : "M"}${x(p.t).toFixed(1)},${y(p.y).toFixed(1)}`;
    previous = p.t;
  }
  return path;
}

/** The index of the point whose time is nearest `t`, or -1 for no points. Points are sorted by time. */
export function nearestIndex(points: readonly Point[], t: number): number {
  let best = -1;
  let distance = Number.POSITIVE_INFINITY;
  points.forEach((p, i) => {
    const d = Math.abs(p.t - t);
    if (d < distance) {
      best = i;
      distance = d;
    }
  });
  return best;
}

/** The finite values among the points. */
export function values(points: readonly Point[]): number[] {
  return points.flatMap((p) => (p.y === null || p.y === undefined || !Number.isFinite(p.y) ? [] : [p.y]));
}
