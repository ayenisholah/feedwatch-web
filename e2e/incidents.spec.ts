import { expect, test } from "@playwright/test";
import { expectNoAxeViolations, fixture, stubApi } from "./stub";

test.describe("incidents", () => {
  test("[FR-FW-7] shows open incidents, reached from the nav", async ({ page }) => {
    await stubApi(page, {
      "/api/incidents": { body: fixture("incidents-open") },
      "/api/feeds": { body: fixture("feeds") },
    });
    await page.goto("/");
    await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Incidents" }).click();
    await expect(page).toHaveURL(/\/incidents\/$/);
    await expect(page.getByRole("heading", { level: 1, name: "Incidents" })).toBeVisible();
    const list = page.getByRole("list", { name: "Incidents, newest first" });
    await expect(list.getByRole("listitem")).toHaveCount(1);
    await expect(list).toContainText("USUAL");
    await expect(list).toContainText("Ongoing for");
    await expectNoAxeViolations(page);
  });

  test("[FR-FW-7] switches to the last 30 days by keyboard, with the outage grouped", async ({ page }) => {
    await stubApi(page, {
      "/api/incidents?status=all": { body: fixture("incidents-all") },
      "/api/incidents": { body: fixture("incidents-open") },
    });
    await page.goto("/incidents/");
    await expect(page.getByText("1 open.")).toBeVisible();
    await page.getByRole("radio", { name: "Open" }).focus();
    await page.keyboard.press("ArrowRight");
    await expect(page).toHaveURL(/\?status=all$/);
    await expect(page.getByText("146 incidents in the last 30 days, 1 still open.")).toBeVisible();
    await expect(page.getByText("145 feeds at once")).toBeVisible();
    await page.getByText("Show the 145 feeds").click();
    await expect(page.getByRole("link", { name: "ARB", exact: true })).toBeVisible();
    await expectNoAxeViolations(page);
  });

  test("[FR-FW-7] shows the empty, error and loading states", async ({ page }) => {
    await stubApi(page, { "/api/incidents": { body: { incidents: [] } } });
    await page.goto("/incidents/");
    await expect(page.getByText("No open incidents")).toBeVisible();
    await expectNoAxeViolations(page);

    await page.unrouteAll();
    await stubApi(page, { "/api/incidents": { status: 503, body: { error: "down" } } });
    await page.reload();
    await expect(page.getByRole("alert").filter({ hasText: "Couldn't load feed data" })).toBeVisible();
    await expectNoAxeViolations(page);

    await page.unrouteAll();
    await stubApi(page, { "/api/incidents": "hang" });
    await page.reload();
    await expect(page.getByText("Loading feed data…")).toBeVisible();
  });
});
