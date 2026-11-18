import { expect, test } from "@playwright/test";
import { expectNoAxeViolations, fixture, stubApi } from "./stub";

test.describe("compare", () => {
  test("[FR-FW-7] shows the 7 shared feeds side by side, reached from the nav", async ({ page }) => {
    await stubApi(page, { "/api/compare": { body: fixture("compare") }, "/api/feeds": { body: fixture("feeds") } });
    await page.goto("/");
    await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Compare" }).click();
    await expect(page).toHaveURL(/\/compare\/$/);
    await expect(page.getByRole("heading", { level: 1, name: "Compare chains" })).toBeVisible();
    const table = page.getByRole("table", { name: "Feeds on all three chains, widest spread first" });
    await expect(table).toBeVisible();
    await expect(table.getByRole("row")).toHaveCount(8);
    await expect(table.getByRole("row").nth(1)).toContainText("XVS");
    await expect(page.getByRole("link", { name: "Compare" })).toHaveAttribute("aria-current", "page");
    await expectNoAxeViolations(page);
  });

  test("[FR-FW-7] becomes cards on a phone, with no sideways scroll", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await stubApi(page, { "/api/compare": { body: fixture("compare") } });
    await page.goto("/compare/");
    const cards = page.getByRole("list", { name: "Feeds on all three chains" });
    await expect(cards).toBeVisible();
    await expect(cards.getByRole("listitem")).toHaveCount(7);
    await expect(page.getByRole("table")).toBeHidden();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    await expectNoAxeViolations(page);
  });

  test("[FR-FW-7] shows the empty, error and loading states", async ({ page }) => {
    await stubApi(page, { "/api/compare": { body: { lastPollAt: null, feeds: [] } } });
    await page.goto("/compare/");
    await expect(page.getByText("No feed is present on all three chains right now")).toBeVisible();
    await expectNoAxeViolations(page);

    await page.unrouteAll();
    await stubApi(page, { "/api/compare": { status: 503, body: { error: "down" } } });
    await page.reload();
    await expect(page.getByRole("alert").filter({ hasText: "Couldn't load feed data" })).toBeVisible();
    await expectNoAxeViolations(page);

    await page.unrouteAll();
    await stubApi(page, { "/api/compare": "hang" });
    await page.reload();
    await expect(page.getByText("Loading feed data…")).toBeVisible();
  });
});
