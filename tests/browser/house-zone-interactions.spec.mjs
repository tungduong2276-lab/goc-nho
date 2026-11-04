import { test, expect } from "@playwright/test";

// Visual geometry is rendered separately. These tests exercise *actual* SVG
// hit regions in Chromium instead of trusting metadata bounds alone.
const rooms = [
  ["sangtao", "goc-sang-tao"],
  ["khach", "phong-khach"],
  ["bep", "bep"],
  ["anh", "phong-anh"],
  ["em", "phong-em"],
  ["gac", "gac"],
];

async function openHouse(page) {
  await page.addInitScript(() => localStorage.setItem("hu-hen-ho-me", "0"));
  await page.route("https://www.gstatic.com/**", route => route.abort());
  await page.route("https://fonts.googleapis.com/**", route => route.abort());
  await page.route("https://fonts.gstatic.com/**", route => route.abort());
  await page.goto("/index.html#nha");
  await expect(page.locator(".world .zones polygon[data-zone]")).toHaveCount(11);
}

test("all six house room polygons respond to keyboard Enter", async ({ page }) => {
  await openHouse(page);
  for (const [zone, hash] of rooms) {
    await page.goto("/index.html#nha");
    const target = page.locator(`.world .zones polygon[data-zone="${zone}"]`);
    await expect(target).toBeVisible();
    await target.focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(new RegExp(`#${hash}$`));
  }
});

test("real pointer taps on room polygons navigate on 360/390/430px phones", async ({ page }) => {
  for (const width of [360, 390, 430]) {
    await page.setViewportSize({ width, height: 844 });
    await openHouse(page);
    for (const [zone, hash] of rooms) {
      await page.goto("/index.html#nha");
      const target = page.locator(`.world .zones polygon[data-zone="${zone}"]`);
      await expect(target).toBeVisible();
      await target.click();
      await expect(page).toHaveURL(new RegExp(`#${hash}$`));
    }
  }
});
