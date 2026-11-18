import { expect, test } from "@playwright/test";
import { expectNoAxeViolations } from "./stub";

/**
 * A check of the deployed site with real data (FR-FW-7): every page loads its data, passes axe
 * (colour contrast included), and works by keyboard. Skipped unless LIVE_URL is set, so CI never
 * calls production:
 *
 *   LIVE_URL=https://feedwatch.sholaayeni.xyz npx playwright test e2e/live.spec.ts
 */
const LIVE = process.env.LIVE_URL?.replace(/\/+$/, "");

test.describe("live site", () => {
  test.skip(!LIVE, "set LIVE_URL to check a deployed site");
  // Four pages × two themes share one client's rate limit (20 requests, then 2/s): run them in turn.
  test.describe.configure({ mode: "serial" });

  test("[FR-FW-7] overview: live feeds, keyboard filtering, no axe violations", async ({ page }) => {
    await page.goto(`${LIVE}/`);
    const table = page.getByRole("table");
    await expect(table).toBeVisible({ timeout: 20_000 });
    await expect(page.locator("header [role=status]")).toContainText("Live");
    await expectNoAxeViolations(page);

    await page.getByRole("radio", { name: "All chains" }).focus();
    await page.keyboard.press("End");
    await expect(page.getByRole("table", { name: /feeds on Base$/ })).toBeVisible();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("radio", { name: "All feeds" })).toBeFocused();
  });

  test("[FR-FW-7] feed detail: a reading and two charts, read by keyboard", async ({ page }) => {
    await page.goto(`${LIVE}/feed/?chain=ethereum&id=WBTC%2FBTC`);
    await expect(page.getByRole("heading", { level: 1, name: "WBTC/BTC" })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("figure")).toHaveCount(2);
    await expectNoAxeViolations(page);
    const chart = page.getByRole("group", { name: /^Price chart/ });
    await chart.focus();
    await page.keyboard.press("End");
    await expect(chart.locator("[aria-live]")).toContainText("UTC: ");
  });

  test("[FR-FW-7] compare: the shared feeds, no axe violations", async ({ page }) => {
    await page.goto(`${LIVE}/compare/`);
    const table = page.getByRole("table", { name: "Feeds on all three chains, widest spread first" });
    await expect(table).toBeVisible({ timeout: 20_000 });
    expect(await table.getByRole("row").count()).toBeGreaterThan(1);
    await expectNoAxeViolations(page);
  });

  test("[FR-FW-7] incidents: open and 30 days, switched by keyboard, no axe violations", async ({ page }) => {
    await page.goto(`${LIVE}/incidents/`);
    await expect(page.getByRole("heading", { level: 1, name: "Incidents" })).toBeVisible();
    await expect(page.getByText(/open\.$|No open incidents/)).toBeVisible({ timeout: 20_000 });
    await expectNoAxeViolations(page);
    await page.getByRole("radio", { name: "Open" }).focus();
    await page.keyboard.press("ArrowRight");
    await expect(page.getByText(/incidents in the last 30 days|No incidents in the last 30 days/)).toBeVisible({
      timeout: 20_000,
    });
    await expectNoAxeViolations(page);
  });
});
