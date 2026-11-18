import { readFileSync } from "node:fs";
import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

/** A recorded production response from `e2e/fixtures/`. */
export function fixture(name: string): unknown {
  return JSON.parse(readFileSync(new URL(`./fixtures/${name}.json`, import.meta.url), "utf8"));
}

type Reply = { status?: number; body: unknown } | "hang";

/**
 * Answers `/api/*` from `routes`, keyed by path plus query (`/api/feeds`, `/api/incidents?status=all`).
 * The longest key the request starts with wins; anything else is 404. "hang" never answers, for
 * loading states. Health is stubbed by default so the header's status pill is stable.
 */
export async function stubApi(page: Page, routes: Record<string, Reply>) {
  const all: Record<string, Reply> = { "/api/health": { body: fixture("health") }, ...routes };
  const keys = Object.keys(all).sort((a, b) => b.length - a.length);
  await page.route("**/api/**", async (route) => {
    const url = new URL(route.request().url());
    const key = keys.find((k) => `${url.pathname}${url.search}`.startsWith(k));
    const reply = key === undefined ? { status: 404, body: { error: "not stubbed" } } : all[key]!;
    if (reply === "hang") return;
    await route.fulfill({
      status: reply.status ?? 200,
      contentType: "application/json",
      body: JSON.stringify(reply.body),
    });
  });
}

/** Fails on any axe violation, colour contrast included. */
export async function expectNoAxeViolations(page: Page) {
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.map((v) => `${v.id}: ${v.help} (${v.nodes.length})`)).toEqual([]);
}
