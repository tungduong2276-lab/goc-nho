import { test, expect } from "@playwright/test";

// Decorative weather is a device-local preference; never write couple Firebase data.
test("decorative weather persists after reload and remains isolated between browsers", async ({ browser }) => {
  const first = await browser.newContext();
  const second = await browser.newContext();
  try {
    const a = await first.newPage();
    const b = await second.newPage();
    for (const page of [a, b]) {
      await page.addInitScript(() => localStorage.setItem("hu-hen-ho-me", "0"));
      await page.goto("/#nha");
      await expect(page.locator(".house-weather")).toBeVisible();
    }

    await a.locator('[data-house-weather="tuyet"]').click();
    await expect(a.locator(".world")).toHaveAttribute("data-weather", "tuyet");
    await expect.poll(() => a.evaluate(() => localStorage.getItem("goc-nho-house-weather"))).toBe("tuyet");
    await a.reload();
    await expect(a.locator(".world")).toHaveAttribute("data-weather", "tuyet");
    await expect(a.locator('[data-house-weather="tuyet"]')).toHaveAttribute("aria-pressed", "true");

    // A different browser has its own preference, not the first browser's choice.
    await expect(b.locator(".world")).toHaveAttribute("data-weather", "nang");
    await b.locator('[data-house-weather="hoa"]').click();
    await b.reload();
    await expect(b.locator(".world")).toHaveAttribute("data-weather", "hoa");
    await expect(a.locator(".world")).toHaveAttribute("data-weather", "tuyet");
  } finally {
    await first.close();
    await second.close();
  }
});

test("invalid stored weather falls back to a safe decorative default", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("hu-hen-ho-me", "0");
    localStorage.setItem("goc-nho-house-weather", "unknown-weather");
  });
  await page.goto("/#nha");
  await expect(page.locator(".world")).toHaveAttribute("data-weather", "nang");
  await expect(page.locator('[data-house-weather="nang"]')).toHaveAttribute("aria-pressed", "true");
});
