import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("[FR-FW-7] the home page renders, switches theme and has no axe violations", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "Feedwatch" })).toBeVisible();
  await expect(page.getByText("Feeds will appear here")).toBeVisible();

  await page.getByRole("radio", { name: "Dark theme" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
