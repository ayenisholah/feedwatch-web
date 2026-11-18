"use client";

import Link from "next/link";
import { Card } from "@/components/ui/Card/Card";
import { EmptyState } from "@/components/ui/EmptyState/EmptyState";
import { CheckIcon } from "@/components/ui/icons";
import { PageHeader } from "@/components/ui/PageHeader/PageHeader";
import { SegmentedControl } from "@/components/ui/SegmentedControl/SegmentedControl";
import { type Incident, IncidentsResponseSchema } from "@/lib/api/schemas";
import { useApi } from "@/lib/api/use-api";
import { CHAIN_NAMES, feedHref } from "@/lib/feeds";
import { formatAgo, formatDuration, formatUtc, isoTime } from "@/lib/format";
import { countIncidents, groupIncidents, type IncidentGroup, incidentDuration } from "@/lib/incidents";
import { useNow, useQueryParam } from "@/lib/use-query-param";
import { DataState } from "./DataState";
import { StatusBadge } from "./StatusBadge";

const STATUSES = ["open", "all"] as const;
type Status = (typeof STATUSES)[number];

const link =
  "rounded-sm font-medium text-brand-fg underline-offset-4 outline-none hover:underline focus-visible:ring-4 focus-visible:ring-focus-ring";

function Stamp({ at, nowMs }: { at: number; nowMs: number }) {
  return (
    <time dateTime={isoTime(at)} title={formatUtc(at)}>
      {formatUtc(at)} ({formatAgo(at, nowMs)})
    </time>
  );
}

/** When it opened and closed, and how long it lasted or has lasted. */
function When({ openedAt, closedAt, nowMs }: Pick<Incident, "openedAt" | "closedAt"> & { nowMs: number }) {
  const lasted = formatDuration(incidentDuration(openedAt, closedAt, nowMs));
  const open = closedAt === null || closedAt === undefined;
  return (
    <p className="text-description text-fg-muted">
      {openedAt === null || openedAt === undefined ? (
        "Opened more than 30 days ago"
      ) : (
        <>
          Opened <Stamp at={openedAt} nowMs={nowMs} />
        </>
      )}
      {" · "}
      {open ? (
        <span className="font-medium text-fg">Ongoing for {lasted}</span>
      ) : (
        <>
          Closed <Stamp at={closedAt} nowMs={nowMs} /> · lasted {lasted}
        </>
      )}
    </p>
  );
}

function SingleIncident({ incident, nowMs }: { incident: Incident; nowMs: number }) {
  return (
    <Card as="li" className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <StatusBadge status={incident.kind} />
        <Link href={feedHref(incident.chain, incident.feedId)} className={link}>
          {incident.feedId}
        </Link>
        <span className="text-description text-fg-muted">{CHAIN_NAMES[incident.chain]}</span>
      </div>
      <When openedAt={incident.openedAt} closedAt={incident.closedAt} nowMs={nowMs} />
      {incident.detail && <p className="text-body break-words text-fg">{incident.detail}</p>}
    </Card>
  );
}

function GroupedIncident({ group, nowMs }: { group: IncidentGroup; nowMs: number }) {
  return (
    <Card as="li" className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <StatusBadge status={group.kind} />
        <span className="font-medium text-fg">{group.incidents.length} feeds at once</span>
      </div>
      <When openedAt={group.openedAt} closedAt={group.closedAt} nowMs={nowMs} />
      {group.detail && <p className="text-body break-words text-fg">{group.detail}</p>}
      <details className="text-description">
        <summary className="w-fit cursor-pointer rounded-sm text-fg-muted outline-none focus-visible:ring-4 focus-visible:ring-focus-ring">
          Show the {group.incidents.length} feeds
        </summary>
        <ul className="mt-2 grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2 lg:grid-cols-3">
          {group.incidents.map((i) => (
            <li key={i.id}>
              <Link href={feedHref(i.chain, i.feedId)} className={link}>
                {i.feedId}
              </Link>{" "}
              <span className="text-fg-muted">{CHAIN_NAMES[i.chain]}</span>
            </li>
          ))}
        </ul>
      </details>
    </Card>
  );
}

function IncidentList({ status }: { status: Status }) {
  const result = useApi(status === "all" ? "/api/incidents?status=all" : "/api/incidents", IncidentsResponseSchema, {
    isEmpty: (d) => d.incidents.length === 0,
  });
  const now = useNow();
  const empty =
    status === "open" ? (
      <EmptyState icon={<CheckIcon />} title="No open incidents" description="Every feed is fresh and readable." />
    ) : (
      <EmptyState icon={<CheckIcon />} title="No incidents in the last 30 days" />
    );
  return (
    <DataState result={result} retry={result.retry} nowMs={now} empty={empty}>
      {(data) => {
        const { total, open } = countIncidents(data.incidents);
        return (
          <div className="flex flex-col gap-4">
            <p className="text-body text-fg-muted">
              {status === "all" ? `${total} incidents in the last 30 days, ${open} still open.` : `${open} open.`}
            </p>
            <ul aria-label="Incidents, newest first" className="flex flex-col gap-3">
              {groupIncidents(data.incidents).map((item) =>
                item.type === "single" ? (
                  <SingleIncident key={item.incident.id} incident={item.incident} nowMs={now} />
                ) : (
                  <GroupedIncident key={item.group.key} group={item.group} nowMs={now} />
                ),
              )}
            </ul>
          </div>
        );
      }}
    </DataState>
  );
}

/** Incidents: when a feed left `ok`, why, and when it came back (FR-FW-7). */
export function Incidents() {
  const [status, setStatus] = useQueryParam<Status>("status", STATUSES, "open");
  return (
    <>
      <PageHeader
        title="Incidents"
        description="An incident opens when a feed goes stale, misses an update, or can't be read, and closes when it's healthy again."
        actions={
          <SegmentedControl
            aria-label="Which incidents"
            options={[
              { value: "open", label: "Open" },
              { value: "all", label: "Last 30 days" },
            ]}
            value={status}
            onChange={setStatus}
          />
        }
      />
      {/* A new key starts the list fresh, so the other filter's data never shows while loading. */}
      <IncidentList key={status} status={status} />
    </>
  );
}
