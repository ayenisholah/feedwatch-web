"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Alert } from "@/components/ui/Alert/Alert";
import { Card } from "@/components/ui/Card/Card";
import { EmptyState } from "@/components/ui/EmptyState/EmptyState";
import { ChartIcon, SearchIcon } from "@/components/ui/icons";
import { PageHeader } from "@/components/ui/PageHeader/PageHeader";
import {
  type Chain,
  ChainSchema,
  type FeedDetail as Detail,
  FeedDetailSchema,
  type FeedSummary,
} from "@/lib/api/schemas";
import { useApi } from "@/lib/api/use-api";
import { values } from "@/lib/chart";
import { CHAIN_NAMES } from "@/lib/feeds";
import { formatAgo, formatDuration, formatPercent, formatPrice, formatUtc, MISSING } from "@/lib/format";
import { useNow, useSearchParams } from "@/lib/use-query-param";
import { AgeBar } from "./AgeBar";
import { DataState } from "./DataState";
import { DetailSkeleton } from "./Skeleton";
import { LineChart } from "./LineChart";
import { StatusBadge } from "./StatusBadge";

/** Matches the API's feed ID rule (feedwatch-api `valid_feed_id`). */
const FEED_ID = /^[A-Za-z0-9_.+/-]{1,64}$/;
const hours = (h: number) => `${Number(h.toFixed(1))}h`;

function NotFound({ id }: { id?: string }) {
  return (
    <>
      <PageHeader title="Feed not found" />
      <EmptyState
        icon={<SearchIcon />}
        title={
          id ? `There's no data for “${id}” on this chain in the last 24 hours.` : "This link doesn't name a feed."
        }
        action={
          <Link
            href="/"
            className="rounded-sm text-brand-fg underline underline-offset-4 outline-none focus-visible:ring-4 focus-visible:ring-focus-ring"
          >
            See all feeds
          </Link>
        }
      />
    </>
  );
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-description text-fg-muted">{label}</dt>
      <dd className="text-body text-fg">{children}</dd>
    </div>
  );
}

function Facts({ feed, nowMs }: { feed: FeedSummary; nowMs: number }) {
  const reference =
    feed.referenceDeviationPct === null || feed.referenceDeviationPct === undefined
      ? "No reference price for this asset"
      : `${formatPercent(feed.referenceDeviationPct, 3)} (${feed.referenceSource ?? "unknown source"})`;
  return (
    <Card as="section" aria-label="Latest reading">
      <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Fact label="Price">
          <span className="text-h5 tabular-nums">{formatPrice(feed.value)}</span>
          <span className="block text-description break-all text-fg-muted">raw {feed.answerRaw ?? MISSING}</span>
        </Fact>
        <Fact label="Last update on chain">
          {formatUtc(feed.updatedAt)}
          <span className="block text-description text-fg-muted">
            {feed.updatedAt === null || feed.updatedAt === undefined ? MISSING : formatAgo(feed.updatedAt, nowMs)} ·
            round {feed.roundId ?? MISSING}
          </span>
        </Fact>
        <Fact label="Age against heartbeat">
          <AgeBar ageS={feed.ageS} heartbeatS={feed.heartbeatS} />
          <span className="block text-description text-fg-muted">heartbeat {formatDuration(feed.heartbeatS)}</span>
        </Fact>
        <Fact label="Deviation trigger">
          {feed.deviationThresholdPct === null || feed.deviationThresholdPct === undefined
            ? "None (updates on a daily schedule)"
            : formatPercent(feed.deviationThresholdPct)}
          <span className="block text-description text-fg-muted">vs reference: {reference}</span>
        </Fact>
      </dl>
    </Card>
  );
}

function Charts({ detail }: { detail: Detail }) {
  const prices = detail.series.map((p) => ({ t: p.t, y: p.value }));
  const ages = detail.series.map((p) => ({
    t: p.t,
    y: p.ageS === null || p.ageS === undefined ? null : p.ageS / 3_600,
  }));
  const heartbeat = detail.latest?.heartbeatS;
  const range = values(prices);
  if (range.length === 0) {
    return (
      <EmptyState
        icon={<ChartIcon />}
        title="No readings in the last 24 hours"
        description="The chart appears once the feed has been read."
      />
    );
  }
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card>
        <LineChart
          title="Price"
          summary={`Last 24 hours, every 5 minutes: low ${formatPrice(Math.min(...range))}, high ${formatPrice(Math.max(...range))}.`}
          points={prices}
          format={formatPrice}
        />
      </Card>
      <Card>
        <LineChart
          title="Age (hours)"
          summary={`Time since the last on-chain update${heartbeat ? `, against the ${formatDuration(heartbeat)} heartbeat` : ""}. It drops to zero at each update.`}
          points={ages}
          format={hours}
          reference={
            heartbeat ? { value: heartbeat / 3_600, label: `heartbeat ${formatDuration(heartbeat)}` } : undefined
          }
        />
      </Card>
    </div>
  );
}

function Reading({ detail, nowMs }: { detail: Detail; nowMs: number }) {
  const feed = detail.latest;
  return (
    <div className="flex flex-col gap-6">
      {!feed && (
        <Alert tone="info" title="No reading in the last 15 minutes">
          The poller hasn’t reported this feed recently. History is below.
        </Alert>
      )}
      {feed && (feed.value === null || feed.value === undefined) && (
        <Alert tone="warning" title="This feed couldn't be read this cycle">
          Its contract call failed (status {feed.status}). Earlier readings, if any, are in the charts.
        </Alert>
      )}
      {feed && <Facts feed={feed} nowMs={nowMs} />}
      <Charts detail={detail} />
    </div>
  );
}

function Loaded({ chain, id }: { chain: Chain; id: string }) {
  const result = useApi(`/api/feeds/${chain}/${encodeURIComponent(id)}`, FeedDetailSchema);
  const now = useNow();
  const header = (
    <PageHeader
      title={id}
      description={`${CHAIN_NAMES[chain]} · RedStone push feed`}
      actions={
        result.state === "data" && result.data.latest ? <StatusBadge status={result.data.latest.status} /> : undefined
      }
    />
  );
  if (result.state === "error" && result.error.status === 404 && result.data === undefined) return <NotFound id={id} />;
  return (
    <>
      {header}
      <DataState result={result} retry={result.retry} loading={<DetailSkeleton />} nowMs={now} empty={null}>
        {(detail) => <Reading detail={detail} nowMs={now} />}
      </DataState>
    </>
  );
}

/** One feed: its latest reading and 24 hours of value and age, at `/feed/?chain=…&id=…` (FR-FW-7). */
export function FeedDetail() {
  const params = useSearchParams();
  const back = (
    <Link
      href="/"
      className="mb-4 inline-block rounded-sm text-description text-brand-fg underline-offset-4 outline-none hover:underline focus-visible:ring-4 focus-visible:ring-focus-ring"
    >
      ← All feeds
    </Link>
  );
  if (params === null) {
    return (
      <>
        {back}
        <div role="status" aria-busy="true">
          <span className="sr-only">Loading feed data…</span>
          <DetailSkeleton />
        </div>
      </>
    );
  }
  const chain = ChainSchema.safeParse(params.get("chain"));
  const id = params.get("id") ?? "";
  return (
    <>
      {back}
      {chain.success && FEED_ID.test(id) ? <Loaded chain={chain.data} id={id} /> : <NotFound />}
    </>
  );
}
