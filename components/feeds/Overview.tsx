"use client";

import { useState } from "react";
import { EmptyState } from "@/components/ui/EmptyState/EmptyState";
import { ChartIcon, SearchIcon } from "@/components/ui/icons";
import { PageHeader } from "@/components/ui/PageHeader/PageHeader";
import { SearchField } from "@/components/ui/SearchField/SearchField";
import { SegmentedControl } from "@/components/ui/SegmentedControl/SegmentedControl";
import { StatWidget } from "@/components/ui/StatWidget/StatWidget";
import { type Chain, ChainSchema, type FeedsResponse, FeedsResponseSchema } from "@/lib/api/schemas";
import { useApi } from "@/lib/api/use-api";
import { CHAIN_NAMES, filterFeeds, sortFeeds, summarize } from "@/lib/feeds";
import { formatAgo } from "@/lib/format";
import { useNow, useQueryParam } from "@/lib/use-query-param";
import { DataState } from "./DataState";
import { OverviewSkeleton } from "./Skeleton";
import { FeedTable } from "./FeedTable";

const CHAIN_FILTERS = ["all", ...ChainSchema.options] as const;
const VIEWS = ["all", "issues"] as const;
type ChainFilter = Chain | "all";
type View = (typeof VIEWS)[number];

function Summary({ data, nowMs }: { data: FeedsResponse; nowMs: number }) {
  const counts = summarize(data.feeds);
  return (
    <section aria-label="Summary" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatWidget label="Feeds monitored" value={counts.total} />
      <StatWidget label="Healthy" value={counts.ok} />
      <StatWidget label="Need attention" value={counts.issues} />
      <StatWidget label="Last poll" value={formatAgo(data.lastPollAt, nowMs)} />
    </section>
  );
}

type FilterState = {
  chain: ChainFilter;
  setChain: (c: ChainFilter) => void;
  view: View;
  setView: (v: View) => void;
  query: string;
  setQuery: (q: string) => void;
};

function Filters({ chain, setChain, view, setView, query, setQuery, issues }: FilterState & { issues: number }) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-wrap items-center gap-3">
        <SegmentedControl
          aria-label="Chain"
          options={CHAIN_FILTERS.map((c) => ({ value: c, label: c === "all" ? "All chains" : CHAIN_NAMES[c] }))}
          value={chain}
          onChange={setChain}
        />
        <SegmentedControl
          aria-label="Which feeds"
          options={[
            { value: "all", label: "All feeds" },
            { value: "issues", label: `Issues (${issues})` },
          ]}
          value={view}
          onChange={setView}
        />
      </div>
      <SearchField label="Search feeds" value={query} onChange={setQuery} className="lg:w-72" />
    </div>
  );
}

function Feeds({ data, nowMs, filters }: { data: FeedsResponse; nowMs: number; filters: FilterState }) {
  const { chain, view, query } = filters;
  const shown = sortFeeds(filterFeeds(data.feeds, { chain, issuesOnly: view === "issues", query }));
  const scope = chain === "all" ? "all chains" : CHAIN_NAMES[chain];
  return (
    <div className="flex flex-col gap-6">
      <Summary data={data} nowMs={nowMs} />
      <Filters {...filters} issues={summarize(data.feeds).issues} />
      {shown.length === 0 ? (
        <EmptyState
          icon={<SearchIcon />}
          title="No feeds match"
          description={`Nothing on ${scope} matches these filters.`}
        />
      ) : (
        <FeedTable feeds={shown} nowMs={nowMs} caption={`${shown.length} feeds on ${scope}`} />
      )}
    </div>
  );
}

/** The home page: summary widgets, filters and every feed's latest status (FR-FW-7). */
export function Overview() {
  const result = useApi("/api/feeds", FeedsResponseSchema, { isEmpty: (d) => d.feeds.length === 0 });
  const now = useNow();
  const [chain, setChain] = useQueryParam<ChainFilter>("chain", CHAIN_FILTERS, "all");
  const [view, setView] = useQueryParam<View>("view", VIEWS, "all");
  const [query, setQuery] = useState("");
  const filters = { chain, setChain, view, setView, query, setQuery };

  return (
    <>
      <PageHeader
        title="Feeds"
        description="Every RedStone push price feed on Ethereum, Arbitrum and Base, checked every 15 seconds against its heartbeat and a reference price."
      />
      <DataState
        result={result}
        retry={result.retry}
        loading={<OverviewSkeleton />}
        nowMs={now}
        empty={
          <EmptyState
            icon={<ChartIcon />}
            title="No feeds reported in the last 15 minutes"
            description="The poller may be restarting. This page refreshes every 15 seconds."
          />
        }
      >
        {(data) => <Feeds data={data} nowMs={now} filters={filters} />}
      </DataState>
    </>
  );
}
