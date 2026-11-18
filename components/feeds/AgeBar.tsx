import { cn } from "@/lib/cn";
import { ageRatio, STALE_GRACE } from "@/lib/feeds";
import { formatDuration, MISSING } from "@/lib/format";

/**
 * How far a feed is into its heartbeat. The track spans 0 to heartbeat × {@link STALE_GRACE}; the
 * marker is the heartbeat itself. Green before the heartbeat, amber inside the grace, red past it.
 * Exposed as a labelled meter with the percentage and both durations as text.
 */
export function AgeBar({
  ageS,
  heartbeatS,
  className,
}: {
  ageS: number | null | undefined;
  heartbeatS: number | null | undefined;
  className?: string;
}) {
  const ratio = ageRatio(ageS, heartbeatS);
  if (ratio === null) return <span className="text-fg-muted">{MISSING}</span>;
  const percent = Math.round(ratio * 100);
  const fill = Math.min(ratio / STALE_GRACE, 1) * 100;
  const tone = ratio > STALE_GRACE ? "bg-danger" : ratio > 1 ? "bg-warning" : "bg-success";
  return (
    <div className={cn("flex min-w-32 items-center gap-2", className)}>
      <div
        role="meter"
        aria-label="Age against heartbeat"
        aria-valuemin={0}
        aria-valuemax={Math.round(STALE_GRACE * 100)}
        aria-valuenow={Math.min(percent, Math.round(STALE_GRACE * 100))}
        aria-valuetext={`${percent}% of the heartbeat: ${formatDuration(ageS)} of ${formatDuration(heartbeatS)}`}
        className="relative h-2 flex-1 overflow-hidden rounded-pill bg-surface-sunken"
      >
        <span className={cn("absolute inset-y-0 left-0 rounded-pill", tone)} style={{ width: `${fill}%` }} />
        <span
          aria-hidden="true"
          className="absolute inset-y-0 w-0.5 bg-fg-muted"
          style={{ left: `${(1 / STALE_GRACE) * 100}%` }}
        />
      </div>
      <span className="w-11 text-right text-description text-fg-muted tabular-nums">{percent}%</span>
    </div>
  );
}
