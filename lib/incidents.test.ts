import { describe, expect, test } from "vitest";
import allFixture from "@/e2e/fixtures/incidents-all.json";
import { type Incident, IncidentsResponseSchema } from "./api/schemas";
import { countIncidents, groupIncidents, incidentDuration } from "./incidents";

const incident = (id: string, overrides: Partial<Incident> = {}): Incident => ({
  id,
  chain: "base",
  feedId: id,
  kind: "stale",
  openedAt: 100,
  closedAt: 200,
  detail: "age 90000s",
  ...overrides,
});

describe("incidents", () => {
  test("[FR-FW-7] groups the 2026-11-17 outage into one event and keeps USUAL on its own", () => {
    const { incidents } = IncidentsResponseSchema.parse(allFixture);
    const items = groupIncidents(incidents);
    expect(items).toHaveLength(2);
    const [outage, usual] = items;
    expect(outage).toMatchObject({
      type: "group",
      group: { kind: "error", detail: "unavailable: every provider failed" },
    });
    expect(outage?.type === "group" && outage.group.incidents).toHaveLength(145);
    expect(usual).toMatchObject({ type: "single", incident: { feedId: "USUAL" } });
    expect(countIncidents(incidents)).toEqual({ total: 146, open: 1 });
  });

  test("[FR-FW-7] lists fewer than three simultaneous incidents one by one, in order", () => {
    const items = groupIncidents([
      incident("a"),
      incident("b", { kind: "drift" }),
      incident("c"),
      incident("d", { openedAt: null, closedAt: undefined, detail: null }),
    ]);
    expect(items.map((i) => (i.type === "single" ? i.incident.id : "group"))).toEqual(["a", "b", "c", "d"]);
    const grouped = groupIncidents([incident("a"), incident("x", { kind: "drift" }), incident("b"), incident("c")]);
    expect(grouped.map((i) => (i.type === "single" ? i.incident.id : `group:${i.group.incidents.length}`))).toEqual([
      "group:3",
      "x",
    ]);
  });

  test("[FR-FW-7] durations, open or closed", () => {
    expect(incidentDuration(100, 400, 0)).toBe(300);
    expect(incidentDuration(100, null, 1_000_000)).toBe(900);
    expect(incidentDuration(100, undefined, 50_000)).toBe(0);
    expect(incidentDuration(null, 400, 0)).toBeNull();
    expect(countIncidents([incident("a", { closedAt: undefined })])).toEqual({ total: 1, open: 1 });
  });
});
