// @vitest-environment node
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import openapiTS, { astToString } from "openapi-typescript";
import { describe, expect, test } from "vitest";
import type { z } from "zod";
import {
  CompareResponseSchema,
  FeedDetailSchema,
  FeedsResponseSchema,
  HealthSchema,
  IncidentsResponseSchema,
} from "./schemas";

const here = (path: string) => fileURLToPath(new URL(path, import.meta.url));
const read = (path: string) => readFileSync(here(path), "utf8");

describe("API contract (feedwatch-api openapi.json)", () => {
  test("[FR-FW-7] schema.ts is exactly what openapi-typescript generates from the pinned document", async () => {
    const generated = astToString(await openapiTS(new URL("./openapi.json", import.meta.url)));
    // The CLI (npm run api:types) adds a banner comment that the library call doesn't.
    const committed = read("./schema.ts").replace(/^\/\*\*[\s\S]*?\*\/\n\n/, "");
    expect(committed).toBe(generated);
  });

  test("[FR-FW-7] the pinned document matches a sibling feedwatch-api checkout", () => {
    const sibling = here("../../../feedwatch-api/openapi.json");
    if (!existsSync(sibling)) return; // CI checks out only this repo.
    const pinned = JSON.parse(read("./openapi.json")) as { info: { version: string } };
    const current = JSON.parse(readFileSync(sibling, "utf8")) as { info: { version: string } };
    // A newer API may be ahead of the pin; the same version must be the same document.
    if (current.info.version === pinned.info.version) expect(current).toEqual(pinned);
  });

  const fixtures: [string, z.ZodType][] = [
    ["health", HealthSchema],
    ["feeds", FeedsResponseSchema],
    ["compare", CompareResponseSchema],
    ["incidents-open", IncidentsResponseSchema],
    ["incidents-all", IncidentsResponseSchema],
    ["feed-ethereum-ETH", FeedDetailSchema],
    ["feed-ethereum-USUAL", FeedDetailSchema],
  ];
  test.each(fixtures)("[FR-FW-7] the recorded production %s response parses", (name, schema) => {
    const body: unknown = JSON.parse(read(`../../e2e/fixtures/${name}.json`));
    expect(schema.safeParse(body).success).toBe(true);
  });
});
