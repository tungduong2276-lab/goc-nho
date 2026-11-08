import { test, expect } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
test.describe.configure({ timeout: 90_000 });
async function openPreview(page, width = 390) {
  await page.setViewportSize({ width, height: 844 });
  const errors = [], firebase = [];
  page.on("pageerror", e => errors.push(e.message));
  page.on("request", req => { if (/firestore|firebaseio|identitytoolkit|securetoken|gstatic\\.com\\/firebasejs/.test(req.url())) firebase.push(req.url()); });
  if (existsSync(resolve("node_modules/three"))) {
    await page.route("https://cdn.jsdelivr.net/npm/three@0.169.0/**", route => {
      const rel = new URL(route.request().url()).pathname.replace("/npm/three@0.169.0/", "");
      route.fulfill({ contentType: "text/javascript", body: readFileSync(resolve("node_modules/three", rel)) });
    });
  }
  await page.goto("/nha3d/multiroom-preview.html");
  await expect(page.locator("#status")).toContainText("Phòng khách", { timeout: 60_000 });
  return { errors, firebase };
}
test("three-room preview renders and navigates through real doors without Firebase", async ({ page }) => {
  const { errors, firebase } = await openPreview(page);
  await expect(page.locator("#world")).toBeVisible();
  await page.getByRole("button", { name: "🚪 Phòng bếp" }).click();
  await expect(page.locator("#status")).toContainText("Phòng bếp", { timeout: 30_000 });
  await page.getByRole("button", { name: "🚪 Phòng khách" }).click();
  await expect(page.locator("#status")).toContainText("Phòng khách", { timeout: 30_000 });
  await page.getByRole("button", { name: "🚪 Phòng ngủ" }).click();
  await expect(page.locator("#status")).toContainText("Phòng ngủ", { timeout: 30_000 });
  expect(errors).toEqual([]); expect(firebase).toEqual([]);
});
for (const width of [360,390,430]) test("preview controls stay inside mobile viewport at "+width+"px", async ({ page }) => {
  await openPreview(page,width);
  for (const b of await page.locator("#doors button").all()) {
    const box=await b.boundingBox();
    expect(box).not.toBeNull();
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x+box.width).toBeLessThanOrEqual(width+1);
    expect(box.height).toBeGreaterThanOrEqual(44);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(1);
});
