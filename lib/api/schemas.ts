import { z } from "zod";
import type { components } from "./schema";

/**
 * Runtime validation for every API response, written to match the types generated from the pinned
 * `openapi.json` (feedwatch-api v0.1.0). The `Same` checks at the bottom fail `tsc` if a schema here
 * and the contract drift apart, so regenerating `schema.ts` from a new release points at every
 * schema that needs updating.
 */

type Schemas = components["schemas"];

export const ChainSchema = z.enum(["ethereum", "arbitrum", "base"]);
export type Chain = z.infer<typeof ChainSchema>;

export const FeedSummarySchema = z.object({
  chain: ChainSchema,
  feedId: z.string(),
  status: z.string(),
  checkedAt: z.number().nullish(),
  value: z.number().nullish(),
  answerRaw: z.string().nullish(),
  roundId: z.string().nullish(),
  updatedAt: z.number().nullish(),
  ageS: z.number().nullish(),
  heartbeatS: z.number().nullish(),
  deviationThresholdPct: z.number().nullish(),
  referenceDeviationPct: z.number().nullish(),
  referenceSource: z.string().nullish(),
});
export type FeedSummary = z.infer<typeof FeedSummarySchema>;

export const FeedsResponseSchema = z.object({
  lastPollAt: z.number().nullish(),
  feeds: z.array(FeedSummarySchema),
});
export type FeedsResponse = z.infer<typeof FeedsResponseSchema>;

export const SeriesPointSchema = z.object({
  t: z.number(),
  value: z.number().nullish(),
  ageS: z.number().nullish(),
});
export type SeriesPoint = z.infer<typeof SeriesPointSchema>;

export const FeedDetailSchema = z.object({
  latest: FeedSummarySchema.nullish(),
  series: z.array(SeriesPointSchema),
});
export type FeedDetail = z.infer<typeof FeedDetailSchema>;

export const ChainValueSchema = z.object({
  value: z.number().nullish(),
  ageS: z.number().nullish(),
  status: z.string(),
});
export type ChainValue = z.infer<typeof ChainValueSchema>;

export const CompareRowSchema = z.object({
  feedId: z.string(),
  chains: z.record(z.string(), ChainValueSchema),
  spreadPct: z.number().nullish(),
});
export type CompareRow = z.infer<typeof CompareRowSchema>;

export const CompareResponseSchema = z.object({
  lastPollAt: z.number().nullish(),
  feeds: z.array(CompareRowSchema),
});
export type CompareResponse = z.infer<typeof CompareResponseSchema>;

export const IncidentSchema = z.object({
  id: z.string(),
  chain: ChainSchema,
  feedId: z.string(),
  kind: z.string(),
  openedAt: z.number().nullish(),
  closedAt: z.number().nullish(),
  detail: z.string().nullish(),
});
export type Incident = z.infer<typeof IncidentSchema>;

export const IncidentsResponseSchema = z.object({ incidents: z.array(IncidentSchema) });
export type IncidentsResponse = z.infer<typeof IncidentsResponseSchema>;

export const HealthSchema = z.object({
  status: z.string(),
  influx: z.string(),
  lastPollAt: z.number().nullish(),
});
export type Health = z.infer<typeof HealthSchema>;

// Compile-time contract checks: each schema's type must be exactly the generated one.
type Same<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Assert<T extends true> = T;
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- exists only to be type-checked
type ContractChecks = [
  Assert<Same<Chain, Schemas["Chain"]>>,
  Assert<Same<FeedSummary, Schemas["FeedSummary"]>>,
  Assert<Same<FeedsResponse, Schemas["FeedsResponse"]>>,
  Assert<Same<SeriesPoint, Schemas["SeriesPoint"]>>,
  Assert<Same<FeedDetail, Schemas["FeedDetail"]>>,
  Assert<Same<ChainValue, Schemas["ChainValue"]>>,
  Assert<Same<CompareRow, Schemas["CompareRow"]>>,
  Assert<Same<CompareResponse, Schemas["CompareResponse"]>>,
  Assert<Same<Incident, Schemas["Incident"]>>,
  Assert<Same<IncidentsResponse, Schemas["IncidentsResponse"]>>,
  Assert<Same<Health, Schemas["Health"]>>,
];
