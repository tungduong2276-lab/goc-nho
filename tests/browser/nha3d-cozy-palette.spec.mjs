import { test, expect } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

test.describe.configure({ timeout: 120_000 });
const THREE_DIR = resolve("node_modules/three");

test("mint/hồng/blue xuất hiện ở nhà 3D; sơn phòng không xóa đồ cũ", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const errors = [], requests = [];
  page.on("pageerror", e => errors.push(e.message));
  page.on("request", r => {
    if (/firestore\.googleapis|firebaseio|identitytoolkit|securetoken/.test(r.url())) requests.push(r.url());
  });
  await page.route("https://www.gstatic.com/**", route => route.abort());
  await page.route("https://fonts.googleapis.com/**", route => route.abort());
  await page.route("https://fonts.gstatic.com/**", route => route.abort());
  if (existsSync(THREE_DIR)) await page.route("https://cdn.jsdelivr.net/npm/three@0.169.0/**", route => {
    const rel = new URL(route.request().url()).pathname.replace("/npm/three@0.169.0/", "");
    route.fulfill({ contentType: "text/javascript", body: readFileSync(resolve(THREE_DIR, rel)) });
  });
  await page.goto("/nha3d/index.html?scene=nha&host=1&cloud=0");
  await page.waitForFunction(() => window.__NHA3D__?.ready, null, { timeout: 90_000 });
  const N = (method, ...args) => page.evaluate(([method, args]) => window.__NHA3D__[method](...args), [method, args]);
  await expect(page.locator("#loading")).toHaveClass(/gone/);
  expect(await N("cozy")).toMatchObject({ scene: "nha", wall: "mint" });
  expect((await N("cozy")).decorParts).toBeGreaterThan(12);
  const original = await N("layout");

  await page.locator("#btn-edit").click();
  await page.locator("#btn-paint").click();
  await expect(page.getByRole("button", { name: "Xanh mint" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Hồng phấn" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Baby blue" })).toBeVisible();
  await page.getByRole("button", { name: "Baby blue" }).click();
  expect((await N("layout")).wall).toBe("babyblue");
  expect((await N("layout")).items).toEqual(original.items);
  await page.locator('#paint [data-close]').click();
  await page.locator("#btn-done").click();

  await page.reload();
  await page.waitForFunction(() => window.__NHA3D__?.ready, null, { timeout: 90_000 });
  expect((await N("layout")).wall).toBe("babyblue");
  expect((await N("layout")).items).toEqual(original.items);
  await N("goScene", "ngu"); await N("settle");
  expect(await N("cozy")).toMatchObject({ scene: "ngu", wall: "hong" });
  await N("goScene", "bep"); await N("settle");
  expect(await N("cozy")).toMatchObject({ scene: "bep", wall: "babyblue" });
  await N("goScene", "san"); await N("settle");
  expect((await N("cozy")).decorParts).toBe(0);
  expect(errors).toEqual([]);
  expect(requests).toEqual([]);
});
