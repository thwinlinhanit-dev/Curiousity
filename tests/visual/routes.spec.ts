import { test, expect } from "@playwright/test";

const routes = [
  ["home", "/"],
  ["hub", "/?app=hub"],
  ["lesson", "/?s=physics&c=phys1&t=position-displacement"],
  ["library", "/?app=library"],
  ["sims", "/?app=sims"],
  ["gallery", "/?app=gallery"],
];

for (const [name, url] of routes) {
  test(`screenshot ${name}`, async ({ page }) => {
    await page.goto(url);
    await expect(page.locator("main")).toBeVisible();
    await page.waitForTimeout(1200); // lazy chunks and canvas first frame
    await expect(page).toHaveScreenshot(`${name}.png`, { fullPage: true, animations: "disabled" });
  });
}

test("no horizontal overflow at 320px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto("/?app=hub");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(2);
});
