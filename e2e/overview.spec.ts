import { expect, test } from "@playwright/test";
import { expectNoAxeViolations, fixture, stubApi } from "./stub";

test.describe("overview", () => {
  test("[FR-FW-7] shows every feed, worst first, with no axe violations", async ({ page }) => {
    await stubApi(page, { "/api/feeds": { body: fixture("feeds") } });
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1, name: "Feeds" })).toBeVisible();
    const table = page.getByRole("table", { name: "146 feeds on all chains" });
    await expect(table).toBeVisible();
    await expect(table.getByRole("row").nth(1)).toContainText("USUAL");
    await expect(page.getByRole("link", { name: "Overview" })).toHaveAttribute("aria-current", "page");
    await expectNoAxeViolations(page);
  });

  test("[FR-FW-7] filters by keyboard and keeps the choice in the URL", async ({ page }) => {
    await stubApi(page, { "/api/feeds": { body: fixture("feeds") } });
    await page.goto("/?chain=base");
    await expect(page.getByRole("table", { name: "30 feeds on Base" })).toBeVisible();

    await page.getByRole("radio", { name: "Base" }).focus();
    await page.keyboard.press("ArrowLeft");
    await expect(page.getByRole("table", { name: "21 feeds on Arbitrum" })).toBeVisible();
    await expect(page).toHaveURL(/\?chain=arbitrum$/);

    await page.getByRole("searchbox", { name: "Search feeds" }).fill("zzz");
    await expect(page.getByText("No feeds match")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("table")).toBeVisible();
  });

  test("[FR-FW-7] shows the loading state", async ({ page }) => {
    await stubApi(page, { "/api/feeds": "hang" });
    await page.goto("/");
    await expect(page.getByText("Loading feed data…")).toBeVisible();
    await expectNoAxeViolations(page);
  });

  test("[FR-FW-7] shows the empty state", async ({ page }) => {
    await stubApi(page, { "/api/feeds": { body: { lastPollAt: null, feeds: [] } } });
    await page.goto("/");
    await expect(page.getByText("No feeds reported in the last 15 minutes")).toBeVisible();
    await expectNoAxeViolations(page);
  });

  test("[FR-FW-7] shows an error, and Try again recovers", async ({ page }) => {
    let fail = true;
    // Playwright tries the most recently added route first, so this goes after the default stubs.
    await stubApi(page, {});
    await page.route("**/api/feeds", (route) =>
      fail
        ? route.fulfill({ status: 503, contentType: "application/json", body: '{"error":"down"}' })
        : route.fulfill({ contentType: "application/json", body: JSON.stringify(fixture("feeds")) }),
    );
    await page.goto("/");
    const alert = page.getByRole("alert").filter({ hasText: "Couldn't load feed data" });
    await expect(alert).toContainText("Feed data is temporarily unavailable.");
    await expectNoAxeViolations(page);

    fail = false;
    await alert.getByRole("button", { name: "Try again" }).click();
    await expect(page.getByRole("table")).toBeVisible();
  });

  test("[FR-FW-7] the theme switch works and the dark theme passes axe", async ({ page }) => {
    await stubApi(page, { "/api/feeds": { body: fixture("feeds") } });
    await page.goto("/");
    await page.getByRole("radio", { name: "Dark theme" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect(page.getByRole("table")).toBeVisible();
    await expectNoAxeViolations(page);
  });
});
