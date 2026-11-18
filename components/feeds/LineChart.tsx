"use client";

import { type KeyboardEvent, type PointerEvent, type ReactNode, useEffect, useId, useRef, useState } from "react";
import { linePath, nearestIndex, niceTicks, type Point, scale, timeTicks, values } from "@/lib/chart";
import { formatUtc, isoTime, MISSING } from "@/lib/format";

const HEIGHT = 220;
const M = { top: 12, right: 16, bottom: 28, left: 72 };
const TIME_STEP_S = 6 * 3_600;
/** The series has a point every 5 minutes; a longer gap than three of them is missing data. */
const MAX_GAP_S = 15 * 60;
const tick = "fill-fg-muted text-[11px]";

const hhmm = (t: number) => new Date(t * 1000).toISOString().slice(11, 16);
const shown = (y: Point["y"], format: (v: number) => string) => (y === null || y === undefined ? MISSING : format(y));

/** The element's width, following resizes; `fallback` where ResizeObserver isn't available. */
function useWidth(fallback: number) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(fallback);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry && entry.contentRect.width > 0) setWidth(entry.contentRect.width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, width] as const;
}

/** Which point is highlighted, moved by arrow keys, Home and End; Escape clears it. */
function useCursor(count: number) {
  const [active, setActive] = useState<number | null>(null);
  const onKeyDown = (e: KeyboardEvent) => {
    const end = count - 1;
    const moves: Record<string, number> = {
      ArrowLeft: Math.max(0, (active ?? end + 1) - 1),
      ArrowRight: Math.min(end, (active ?? -1) + 1),
      Home: 0,
      End: end,
    };
    const next = moves[e.key];
    if (e.key === "Escape") setActive(null);
    else if (next !== undefined) {
      e.preventDefault();
      setActive(next);
    }
  };
  return { active, setActive, onKeyDown };
}

type Geometry = {
  width: number;
  x: (t: number) => number;
  y: (v: number) => number;
  ticks: number[];
  t0: number;
  t1: number;
};
type Reference = { value: number; label: string };

function Axes({ g, format, reference }: { g: Geometry; format: (v: number) => string; reference?: Reference }) {
  const right = g.width - M.right;
  return (
    <>
      {g.ticks.map((v) => (
        <g key={v}>
          <line x1={M.left} x2={right} y1={g.y(v)} y2={g.y(v)} className="stroke-line" strokeWidth={1} />
          <text x={M.left - 8} y={g.y(v)} dy="0.32em" textAnchor="end" className={tick}>
            {format(v)}
          </text>
        </g>
      ))}
      {timeTicks(g.t0, g.t1, TIME_STEP_S).map((t) => (
        <text key={t} x={g.x(t)} y={HEIGHT - 8} textAnchor="middle" className={tick}>
          {hhmm(t)}
        </text>
      ))}
      {reference && (
        <g>
          <line
            x1={M.left}
            x2={right}
            y1={g.y(reference.value)}
            y2={g.y(reference.value)}
            className="stroke-fg-muted"
            strokeWidth={1}
          />
          <text x={right} y={g.y(reference.value) - 6} textAnchor="end" className={tick}>
            {reference.label}
          </text>
        </g>
      )}
    </>
  );
}

function Cursor({ g, point }: { g: Geometry; point: Point }) {
  return (
    <g>
      <line
        x1={g.x(point.t)}
        x2={g.x(point.t)}
        y1={M.top}
        y2={HEIGHT - M.bottom}
        className="stroke-fg-muted"
        strokeWidth={1}
      />
      {point.y !== null && point.y !== undefined && (
        <circle cx={g.x(point.t)} cy={g.y(point.y)} r={4} className="fill-brand stroke-surface" strokeWidth={2} />
      )}
    </g>
  );
}

function Tooltip({ g, point, format }: { g: Geometry; point: Point; format: (v: number) => string }) {
  const px = g.x(point.t);
  return (
    <div
      className="pointer-events-none absolute top-2 rounded-sm border border-line bg-surface px-3 py-2 text-description shadow-popover"
      style={px > g.width / 2 ? { right: g.width - px + 8 } : { left: px + 8 }}
    >
      <p className="font-semibold text-fg">{shown(point.y, format)}</p>
      <p className="text-fg-muted">{formatUtc(point.t)}</p>
    </div>
  );
}

function DataTable({
  title,
  points,
  format,
}: {
  title: string;
  points: readonly Point[];
  format: (v: number) => string;
}) {
  return (
    <details className="text-description text-fg-muted">
      <summary className="w-fit cursor-pointer rounded-sm outline-none focus-visible:ring-4 focus-visible:ring-focus-ring">
        Show data ({points.length} points)
      </summary>
      <table className="mt-2 w-full max-w-md border-collapse">
        <caption className="sr-only">{title}, every 5 minutes</caption>
        <thead>
          <tr>
            <th scope="col" className="py-1 text-left font-medium">
              Time (UTC)
            </th>
            <th scope="col" className="py-1 text-right font-medium">
              {title}
            </th>
          </tr>
        </thead>
        <tbody>
          {points.map((p) => (
            <tr key={p.t} className="border-t border-line">
              <td className="py-1">
                <time dateTime={isoTime(p.t)}>{formatUtc(p.t)}</time>
              </td>
              <td className="py-1 text-right tabular-nums">{shown(p.y, format)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}

/** The transparent area that tracks the pointer; larger than the line, as the dataviz skill asks. */
function HitArea({
  width,
  onPointerMove,
  onLeave,
}: {
  width: number;
  onPointerMove: (e: PointerEvent<SVGRectElement>) => void;
  onLeave: () => void;
}) {
  return (
    <rect
      data-testid="chart-hit-area"
      x={M.left}
      y={M.top}
      width={Math.max(0, width - M.left - M.right)}
      height={HEIGHT - M.top - M.bottom}
      fill="transparent"
      onPointerMove={onPointerMove}
      onPointerLeave={onLeave}
    />
  );
}

export type LineChartProps = {
  /** Names the single series; there's no legend. */
  title: string;
  /** One sentence for the caption, such as the range covered. */
  summary: ReactNode;
  /** Sorted by time. */
  points: readonly Point[];
  /** Formats a value for the tooltip, axis and table. */
  format: (v: number) => string;
  /** A labelled horizontal line, such as the heartbeat on the age chart. */
  reference?: Reference;
};

/**
 * A single-series line over time (dataviz skill: 2px line, hairline recessive grid, crosshair
 * tooltip snapping to the nearest point, the same readout by keyboard, and a table view). Missing
 * values break the line rather than bridging it. Renders nothing without a value to draw.
 */
export function LineChart({ title, summary, points, format, reference }: LineChartProps) {
  const [ref, width] = useWidth(640);
  const { active, setActive, onKeyDown } = useCursor(points.length);
  const titleId = useId();
  const [first, last] = [points[0], points[points.length - 1]];
  const ys = values(points);
  if (!first || !last || ys.length === 0) return null;

  const lo = Math.min(...ys, reference?.value ?? Infinity);
  const hi = Math.max(...ys, reference?.value ?? -Infinity);
  const { ticks, domain } = niceTicks(lo, hi);
  const x = scale([first.t, last.t], [M.left, width - M.right]);
  const g: Geometry = { width, ticks, t0: first.t, t1: last.t, x, y: scale(domain, [HEIGHT - M.bottom, M.top]) };
  const point = active === null ? undefined : points[active];
  const onPointerMove = (e: PointerEvent<SVGRectElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    setActive(nearestIndex(points, first.t + ((e.clientX - box.left) / (box.width || 1)) * (last.t - first.t)));
  };

  return (
    <figure aria-labelledby={titleId} className="flex flex-col gap-2">
      <figcaption>
        <p id={titleId} className="text-subtitle-semibold text-fg">
          {title}
        </p>
        <p className="text-description text-fg-muted">{summary}</p>
      </figcaption>
      <div
        ref={ref}
        role="group"
        tabIndex={0}
        aria-label={`${title} chart. Use the arrow keys to read values.`}
        onKeyDown={onKeyDown}
        onBlur={() => setActive(null)}
        className="relative rounded-sm outline-none focus-visible:ring-4 focus-visible:ring-focus-ring"
      >
        <svg width={width} height={HEIGHT} aria-hidden="true" className="block max-w-full overflow-visible">
          <Axes g={g} format={format} reference={reference} />
          <path
            d={linePath(points, g.x, g.y, MAX_GAP_S)}
            fill="none"
            className="stroke-brand"
            strokeWidth={2}
            strokeLinejoin="round"
          />
          {point && <Cursor g={g} point={point} />}
          <HitArea width={width} onPointerMove={onPointerMove} onLeave={() => setActive(null)} />
        </svg>
        {point && <Tooltip g={g} point={point} format={format} />}
        <p aria-live="polite" className="sr-only">
          {point ? `${formatUtc(point.t)}: ${shown(point.y, format)}` : ""}
        </p>
      </div>
      <DataTable title={title} points={points} format={format} />
    </figure>
  );
}
