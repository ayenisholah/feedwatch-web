import type { Incident } from "./api/schemas";

/**
 * Incidents for the incidents page. Many feeds failing together (every RPC down, for example) opens
 * one incident per feed with the same kind, times and detail; those are grouped into one event so
 * a single outage doesn't bury the incidents around it.
 */

/** Incidents sharing kind, open time, close time and detail, at least {@link GROUP_MIN} of them. */
export type IncidentGroup = {
  key: string;
  kind: string;
  detail: string | null | undefined;
  openedAt: number | null | undefined;
  closedAt: number | null | undefined;
  incidents: Incident[];
};

export type IncidentItem = { type: "single"; incident: Incident } | { type: "group"; group: IncidentGroup };

/** Fewer incidents than this sharing a signature are listed one by one. */
export const GROUP_MIN = 3;

/** Groups simultaneous incidents, keeping the API's newest-first order of first appearance. */
export function groupIncidents(incidents: readonly Incident[]): IncidentItem[] {
  const signature = (i: Incident) => JSON.stringify([i.kind, i.openedAt ?? null, i.closedAt ?? null, i.detail ?? null]);
  const bySignature = new Map<string, Incident[]>();
  for (const incident of incidents) {
    const key = signature(incident);
    bySignature.set(key, [...(bySignature.get(key) ?? []), incident]);
  }
  const items: IncidentItem[] = [];
  const seen = new Set<string>();
  for (const incident of incidents) {
    const key = signature(incident);
    const members = bySignature.get(key)!;
    if (members.length < GROUP_MIN) {
      items.push({ type: "single", incident });
    } else if (!seen.has(key)) {
      seen.add(key);
      const { kind, detail, openedAt, closedAt } = incident;
      items.push({ type: "group", group: { key, kind, detail, openedAt, closedAt, incidents: members } });
    }
  }
  return items;
}

/** How long an incident lasted, or has lasted so far, in seconds; null when its start is unknown. */
export function incidentDuration(
  openedAt: number | null | undefined,
  closedAt: number | null | undefined,
  nowMs: number,
): number | null {
  if (openedAt === null || openedAt === undefined) return null;
  return Math.max(0, (closedAt ?? nowMs / 1000) - openedAt);
}

/** Open and total counts, for the page summary. */
export function countIncidents(incidents: readonly Incident[]): { total: number; open: number } {
  return {
    total: incidents.length,
    open: incidents.filter((i) => i.closedAt === null || i.closedAt === undefined).length,
  };
}
