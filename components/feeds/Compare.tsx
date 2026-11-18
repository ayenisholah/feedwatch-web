"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/Badge/Badge";
import { Card } from "@/components/ui/Card/Card";
import { EmptyState } from "@/components/ui/EmptyState/EmptyState";
import { ArrowDownIcon, ArrowUpIcon, ChartIcon } from "@/components/ui/icons";
import { PageHeader } from "@/components/ui/PageHeader/PageHeader";
import { type Chain, type ChainValue, CompareResponseSchema, type CompareRow } from "@/lib/api/schemas";
import { useApi } from "@/lib/api/use-api";
import { CHAIN_ORDER, extremes, SPREAD_ALERT_PCT, sortBySpread, spreadIsWide } from "@/lib/compare";
import { CHAIN_NAMES, feedHref, isIssue } from "@/lib/feeds";
import { formatDuration, formatPercent, formatPrice } from "@/lib/format";
import { useNow } from "@/lib/use-query-param";
import { DataState } from "./DataState";
import { CompareSkeleton } from "./Skeleton";
import { StatusBadge } from "./StatusBadge";

type Extreme = "high" | "low" | undefined;

function ChainReading({ value, extreme }: { value: ChainValue | undefined; extreme: Extreme }) {
  if (!value) return <span className="text-fg-muted">Not on this chain</span>;
  return (
    <div className="flex flex-col items-end gap-1 text-right">
      <span className="inline-flex items-center gap-1.5 tabular-nums">
        {extreme && (
          <span className="inline-flex items-center gap-0.5 text-description text-fg-muted">
            {extreme === "high" ? <ArrowUpIcon size={14} /> : <ArrowDownIcon size={14} />}
            {extreme === "high" ? "highest" : "lowest"}
          </span>
        )}
        {formatPrice(value.value)}
      </span>
      <span className="text-description text-fg-muted">age {formatDuration(value.ageS)}</span>
      {isIssue(value.status) && <StatusBadge status={value.status} />}
    </div>
  );
}

function Spread({ pct }: { pct: number | null | undefined }) {
  const text = formatPercent(pct, 3);
  if (!spreadIsWide(pct)) return <span className="tabular-nums">{text}</span>;
  return (
    <Badge tone="warning" title={`Above ${SPREAD_ALERT_PCT}%`}>
      {text} <span className="sr-only">, above {SPREAD_ALERT_PCT}%</span>
    </Badge>
  );
}

function extremeFor(row: CompareRow): (chain: Chain) => Extreme {
  const { high, low } = extremes(row);
  return (chain) => (high.includes(chain) ? "high" : low.includes(chain) ? "low" : undefined);
}

const feedLink =
  "rounded-sm font-medium text-brand-fg underline-offset-4 outline-none hover:underline focus-visible:ring-4 focus-visible:ring-focus-ring";

function CompareTable({ rows }: { rows: readonly CompareRow[] }) {
  const th = "px-4 py-3 text-description font-medium text-fg-muted";
  return (
    <div className="hidden overflow-hidden rounded-md border border-line bg-surface md:block">
      <table className="w-full border-collapse text-body">
        <caption className="sr-only">Feeds on all three chains, widest spread first</caption>
        <thead className="border-b border-line">
          <tr>
            <th scope="col" className={`${th} text-left`}>
              Feed
            </th>
            {CHAIN_ORDER.map((chain) => (
              <th key={chain} scope="col" className={`${th} text-right`}>
                {CHAIN_NAMES[chain]}
              </th>
            ))}
            <th scope="col" className={`${th} text-right`}>
              Spread
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const extreme = extremeFor(row);
            return (
              <tr key={row.feedId} className="border-b border-line align-top last:border-0">
                <th scope="row" className="px-4 py-3 text-left">
                  <Link href={feedHref("ethereum", row.feedId)} className={feedLink}>
                    {row.feedId}
                  </Link>
                </th>
                {CHAIN_ORDER.map((chain) => (
                  <td key={chain} className="px-4 py-3">
                    <ChainReading value={row.chains[chain]} extreme={extreme(chain)} />
                  </td>
                ))}
                <td className="px-4 py-3 text-right">
                  <Spread pct={row.spreadPct} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function CompareCards({ rows }: { rows: readonly CompareRow[] }) {
  return (
    <ul aria-label="Feeds on all three chains" className="flex flex-col gap-4 md:hidden">
      {rows.map((row) => {
        const extreme = extremeFor(row);
        return (
          <Card as="li" key={row.feedId} className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <Link href={feedHref("ethereum", row.feedId)} className={feedLink}>
                {row.feedId}
              </Link>
              <span className="text-description text-fg-muted">
                spread <Spread pct={row.spreadPct} />
              </span>
            </div>
            <dl className="flex flex-col gap-2">
              {CHAIN_ORDER.map((chain) => (
                <div key={chain} className="flex items-start justify-between gap-3 border-t border-line pt-2">
                  <dt className="text-fg-muted">{CHAIN_NAMES[chain]}</dt>
                  <dd>
                    <ChainReading value={row.chains[chain]} extreme={extreme(chain)} />
                  </dd>
                </div>
              ))}
            </dl>
          </Card>
        );
      })}
    </ul>
  );
}

/** The feeds on all three chains side by side, with their spread (FR-FW-7). */
export function Compare() {
  const result = useApi("/api/compare", CompareResponseSchema, { isEmpty: (d) => d.feeds.length === 0 });
  const now = useNow();
  return (
    <>
      <PageHeader
        title="Compare chains"
        description={`The feeds RedStone pushes to Ethereum, Arbitrum and Base, side by side. Spread is (highest − lowest) ÷ median; above ${SPREAD_ALERT_PCT}%, the default deviation trigger, it's highlighted.`}
      />
      <DataState
        result={result}
        retry={result.retry}
        loading={<CompareSkeleton />}
        nowMs={now}
        empty={<EmptyState icon={<ChartIcon />} title="No feed is present on all three chains right now" />}
      >
        {(data) => {
          const rows = sortBySpread(data.feeds);
          return (
            <>
              <CompareTable rows={rows} />
              <CompareCards rows={rows} />
            </>
          );
        }}
      </DataState>
    </>
  );
}
