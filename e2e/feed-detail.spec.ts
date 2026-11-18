import { expect, test } from "@playwright/test";
import { expectNoAxeViolations, fixture, stubApi } from "./stub";

test.describe("feed detail", () => {
  test("[FR-FW-7] opens from the overview and shows the reading and charts", async ({ page }) => {
    await stubApi(page, {
      "/api/feeds/ethereum/ETH": { body: fixture("feed-ethereum-ETH") },
      "/api/feeds": { body: fixture("feeds") },
    });
    await page.goto("/");
    await page.getByRole("link", { name: "ETH", exact: true }).first().click();
    await expect(page).toHaveURL(/\/feed\/\?chain=ethereum&id=ETH$/);
    await expect(page.getByRole("heading", { level: 1, name: "ETH" })).toBeVisible();
    await expect(page.getByRole("region", { name: "Latest reading" })).toContainText("1,807.59");
    await expect(page.getByRole("figure", { name: "Value" })).toBeVisible();
    await expect(page.getByRole("figure", { name: "Age (hours)" })).toBeVisible();
    await expectNoAxeViolations(page);
  });

  test("[FR-FW-7] reads a chart by keyboard", async ({ page }) => {
    await stubApi(page, { "/api/feeds/ethereum/ETH": { body: fixture("feed-ethereum-ETH") } });
    await page.goto("/feed/?chain=ethereum&id=ETH");
    const chart = page.getByRole("group", { name: /^Value chart/ });
    await chart.focus();
    await page.keyboard.press("End");
    await expect(chart).toContainText("1,807.59");
    await expect(chart.locator("[aria-live]")).toContainText("UTC: 1,807.59");
    await page.keyboard.press("Escape");
    await expect(chart.locator("[aria-live]")).toHaveText("");
  });

  test("[FR-FW-7] a feed that can't be read says so", async ({ page }) => {
    await stubApi(page, { "/api/feeds/ethereum/USUAL": { body: fixture("feed-ethereum-USUAL") } });
    await page.goto("/feed/?chain=ethereum&id=USUAL");
    await expect(page.getByText("This feed couldn't be read this cycle")).toBeVisible();
    await expect(page.getByText("No readings in the last 24 hours")).toBeVisible();
    await expectNoAxeViolations(page);
  });

  test("[FR-FW-7] an unknown feed or a bad link is not found", async ({ page }) => {
    await stubApi(page, { "/api/feeds/base/NOPE": { status: 404, body: { error: "no data" } } });
    await page.goto("/feed/?chain=base&id=NOPE");
    await expect(page.getByText("Feed not found")).toBeVisible();
    await expectNoAxeViolations(page);
    await page.goto("/feed/");
    await expect(page.getByText("This link doesn't name a feed.")).toBeVisible();
    await page.getByRole("link", { name: "See all feeds" }).click();
    await expect(page).toHaveURL(/\/$/);
  });

  test("[FR-FW-7] shows loading, then an error that Try again recovers from", async ({ page }) => {
    let fail = true;
    await stubApi(page, {});
    await page.route("**/api/feeds/ethereum/WBTC%2FBTC", (route) =>
      fail
        ? route.fulfill({ status: 503, contentType: "application/json", body: '{"error":"down"}' })
        : route.fulfill({ contentType: "application/json", body: JSON.stringify(fixture("feed-ethereum-ETH")) }),
    );
    await page.goto("/feed/?chain=ethereum&id=WBTC%2FBTC");
    await expect(page.getByRole("heading", { level: 1, name: "WBTC/BTC" })).toBeVisible();
    const alert = page.getByRole("alert").filter({ hasText: "Couldn't load feed data" });
    await expect(alert).toBeVisible();
    await expectNoAxeViolations(page);
    fail = false;
    await alert.getByRole("button", { name: "Try again" }).click();
    await expect(page.getByRole("figure", { name: "Value" })).toBeVisible();
  });

  test("[FR-FW-7] shows the loading state", async ({ page }) => {
    await stubApi(page, { "/api/feeds/base/ETH": "hang" });
    await page.goto("/feed/?chain=base&id=ETH");
    await expect(page.getByText("Loading feed data…")).toBeVisible();
    await expectNoAxeViolations(page);
  });
});
