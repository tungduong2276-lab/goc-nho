import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";

test("house weather is selectable, local-only and survives navigation", async ({ page }) => {
  await page.goto("/#nha");
  await page.evaluate(() => {
    localStorage.setItem("hu-hen-ho-me", "0");
    localStorage.setItem("goc-nho-house-weather", "nang");
  });
  await page.reload();
  await expect(page.locator(".house-weather")).toBeVisible();
  await page.locator('[data-house-weather="mua"]').click();
  await expect(page.locator(".world")).toHaveAttribute("data-weather", "mua");
  await expect(page.locator('[data-house-weather="mua"]')).toHaveAttribute("aria-pressed", "true");
  await page.reload();
  await expect(page.locator(".world")).toHaveAttribute("data-weather", "mua");
  await expect(page.locator(".house-weather")).toContainText("không phải thời tiết thực tế");
});

test("expanded house scene declares all requested flowering trees", async () => {
  const src = readFileSync("_xuong-3d/map.js", "utf8");
  for (const kind of ["hoagiay", "hoasua", "anhdao", "phuong"]) {
    expect(src).toContain(`floweringTree('${kind}'`);
  }
  expect(src).toContain("1.16");
  expect(src).toContain("1.24");
});
