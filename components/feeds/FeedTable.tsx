import Link from "next/link";
import { CHAIN_NAMES, feedHref } from "@/lib/feeds";
import { formatAgo, formatDuration, formatPercent, formatPrice, MISSING } from "@/lib/format";
import type { FeedSummary } from "@/lib/api/schemas";
import { AgeBar } from "./AgeBar";
import { StatusBadge } from "./StatusBadge";

const cell = "px-4 py-3 align-middle";
const COLUMNS: { label: string; right?: boolean }[] = [
  { label: "Feed" },
  { label: "Chain" },
  { label: "Status" },
  { label: "Price", right: true },
  { label: "Updated" },
  { label: "Age vs heartbeat" },
  { label: "vs reference", right: true },
];

function FeedRow({ feed, nowMs }: { feed: FeedSummary; nowMs: number }) {
  return (
    <tr className="border-b border-line last:border-0">
      <th scope="row" className={`${cell} text-left font-medium`}>
        <Link
          href={feedHref(feed.chain, feed.feedId)}
          className="rounded-sm text-brand-fg underline-offset-4 outline-none hover:underline focus-visible:ring-4 focus-visible:ring-focus-ring"
        >
          {feed.feedId}
        </Link>
      </th>
      <td className={cell}>{CHAIN_NAMES[feed.chain]}</td>
      <td className={cell}>
        <StatusBadge status={feed.status} />
      </td>
      <td className={`${cell} text-right tabular-nums`}>{formatPrice(feed.value)}</td>
      <td className={`${cell} text-fg-muted`}>
        {feed.updatedAt === null || feed.updatedAt === undefined ? MISSING : formatAgo(feed.updatedAt, nowMs)}
        <span className="block text-description">heartbeat {formatDuration(feed.heartbeatS)}</span>
      </td>
      <td className={cell}>
        <AgeBar ageS={feed.ageS} heartbeatS={feed.heartbeatS} />
      </td>
      <td className={`${cell} text-right tabular-nums`}>{formatPercent(feed.referenceDeviationPct, 3)}</td>
    </tr>
  );
}

/**
 * Feeds as a table: name (linking to its detail page), chain, status, value, last update, age
 * against heartbeat, and distance from the reference price. It scrolls sideways inside its own
 * focusable region on narrow screens, never the page.
 */
export function FeedTable({
  feeds,
  nowMs,
  caption,
}: {
  feeds: readonly FeedSummary[];
  nowMs: number;
  caption: string;
}) {
  return (
    <div
      role="region"
      aria-label={caption}
      tabIndex={0}
      className="overflow-x-auto rounded-md border border-line bg-surface outline-none focus-visible:ring-4 focus-visible:ring-focus-ring"
    >
      <table className="w-full min-w-[56rem] border-collapse text-body">
        <caption className="sr-only">{caption}</caption>
        <thead className="border-b border-line">
          <tr>
            {COLUMNS.map(({ label, right }) => (
              <th
                key={label}
                scope="col"
                className={`px-4 py-3 text-description font-medium text-fg-muted ${right ? "text-right" : "text-left"}`}
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {feeds.map((feed) => (
            <FeedRow key={`${feed.chain}/${feed.feedId}`} feed={feed} nowMs={nowMs} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
