import { test, expect } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
test.describe.configure({ timeout: 90_000 });
async function openPreview(page, width = 390, search = "") {
  await page.setViewportSize({ width, height: 844 });
  const errors = [], firebase = [];
  page.on("pageerror", e => errors.push(e.message));
  page.on("request", req => { const url = req.url(); if (["firestore", "firebaseio", "identitytoolkit", "securetoken", "gstatic.com/firebasejs"].some(token => url.includes(token))) firebase.push(url); });
  if (existsSync(resolve("node_modules/three"))) {
    await page.route("https://cdn.jsdelivr.net/npm/three@0.169.0/**", route => {
      const rel = new URL(route.request().url()).pathname.replace("/npm/three@0.169.0/", "");
      route.fulfill({ contentType: "text/javascript", body: readFileSync(resolve("node_modules/three", rel)) });
    });
  }
  await page.goto("/nha3d/multiroom-preview.html" + search);
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

test("room activities respond locally and change with the room", async ({ page }) => {
 const { errors, firebase } = await openPreview(page);
 await page.getByRole("button", { name: "☕ Uống trà" }).click();
 await expect(page.locator("#status")).toContainText("Lần 1", { timeout: 30_000 });
 await expect.poll(() => page.evaluate(() => document.querySelector("#world")?.width > 0)).toBe(true);
 await page.getByRole("button", { name: "☕ Uống trà" }).click();
 await expect(page.locator("#status")).toContainText("Lần 2", { timeout: 30_000 });
 await page.getByRole("button", { name: "🚪 Phòng bếp" }).click();
 await expect(page.locator("#status")).toContainText("Đang ở Phòng bếp", { timeout: 30_000 });
 await page.getByRole("button", { name: "🍳 Nấu cùng nhau" }).click();
 await expect(page.locator("#status")).toContainText("Căn bếp thơm", { timeout: 30_000 });
 expect(errors).toEqual([]);
 expect(firebase).toEqual([]);
});

test("activity controls remain reachable on narrow mobile screens", async ({ page }) => {
 await openPreview(page, 360);
 const button = page.getByRole("button", { name: "☕ Uống trà" });
 await expect(button).toBeVisible();
 const rect = await button.boundingBox();
 expect(rect && rect.x >= 0 && rect.y >= 0 && rect.x + rect.width <= 360).toBeTruthy();

 await button.click();
 await expect(page.locator("#status")).toContainText("Lần 1", { timeout: 30_000 });
});

for (const width of [360, 390, 430]) {
 test("complete 3-room activity lifecycle on " + width + "px mobile", async ({ page }) => {
  const { errors, firebase } = await openPreview(page, width);
  const state = () => page.evaluate(() => window.__NHA3D_PREVIEW_STATE__?.());
  for (const [room, action, next] of [
   ["khach", "☕ Uống trà", "🚪 Phòng bếp"],
   ["bep", "🍳 Nấu cùng nhau", "🚪 Phòng khách"],
   ["khach", null, "🚪 Phòng ngủ"],
   ["ngu", "💌 Lời nhắn", null]
  ]) {
   await expect.poll(async () => (await state())?.room).toBe(room);
   if (action) {
    await page.getByRole("button", { name: action }).click();
    await expect.poll(async () => (await state())?.counts[room], { timeout: 30_000 }).toBe(room === "khach" ? 1 : 1);
    await expect.poll(async () => (await state())?.props, { timeout: 5_000 }).toBeGreaterThan(0);
    await expect.poll(async () => (await state())?.acting).toBe(true);
    await expect.poll(async () => (await state())?.props, { timeout: 8_000 }).toBe(0);
    await expect.poll(async () => (await state())?.acting).toBe(false);
   }
   if (next) {
    await page.getByRole("button", { name: next }).click();
    const destination = next.includes("bếp") ? "bep" : next.includes("ngủ") ? "ngu" : "khach";
    await expect.poll(async () => (await state())?.room, { timeout: 30_000 }).toBe(destination);
    await expect.poll(async () => (await state())?.props).toBe(0);
   }
  }
  expect(errors).toEqual([]);
  expect(firebase).toEqual([]);
 });
}

test("interrupting an activity with a door clears temporary props", async ({ page }) => {
 const { errors, firebase } = await openPreview(page);
 const state = () => page.evaluate(() => window.__NHA3D_PREVIEW_STATE__());
 await page.getByRole("button", { name: "☕ Uống trà" }).click();
 await expect.poll(async () => (await state()).acting, { timeout: 30_000 }).toBe(true);
 await expect.poll(async () => (await state()).props).toBeGreaterThan(0);
 await page.getByRole("button", { name: "🚪 Phòng bếp" }).click();
 await expect.poll(async () => (await state()).props).toBe(0);
 await expect.poll(async () => (await state()).acting).toBe(false);
 await expect.poll(async () => (await state()).room, { timeout: 30_000 }).toBe("bep");
 expect(errors).toEqual([]);
 expect(firebase).toEqual([]);
});


test("local-only companion can high-five and follow a doorway without Firebase", async ({ page }) => {
 const { errors, firebase } = await openPreview(page);
 const state = () => page.evaluate(() => window.__NHA3D_PREVIEW_STATE__());
 await expect(page.locator("header")).toContainText("Chưa đồng bộ hai máy");
 await expect.poll(async () => (await state()).partner.visible).toBe(false);
 await page.getByRole("button", { name: /Gọi bạn mô phỏng/ }).click();
 await expect.poll(async () => (await state()).partner.visible).toBe(true);
 expect((await state()).partner.mode).toBe("local-demo");
 expect((await state()).partner.cell).not.toBeNull();
 await page.getByRole("button", { name: /Chạm tay/ }).click();
 await expect.poll(async () => (await state()).partner.gesture, { timeout: 30_000 }).toBe(true);
 await expect(page.locator("#status")).toContainText("Mô phỏng cục bộ");
 await page.getByRole("button", { name: "🚪 Phòng bếp" }).click();
 await expect.poll(async () => (await state()).room, { timeout: 30_000 }).toBe("bep");
 await expect.poll(async () => (await state()).partner.visible).toBe(true);
 await expect.poll(async () => (await state()).partner.gesture).toBe(false);
 await page.getByRole("button", { name: /Ẩn bạn mô phỏng/ }).click();
 await expect.poll(async () => (await state()).partner.visible).toBe(false);
 expect(errors).toEqual([]);
 expect(firebase).toEqual([]);
});

for (const width of [360, 390, 430]) {
 test("companion controls stay reachable at " + width + "px", async ({ page }) => {
  await openPreview(page, width);
  for (const button of await page.locator("#activities button").all()) {
   const rect = await button.boundingBox();
   expect(rect).not.toBeNull();
   expect(rect.x).toBeGreaterThanOrEqual(0);
   expect(rect.x + rect.width).toBeLessThanOrEqual(width + 1);
   expect(rect.height).toBeGreaterThanOrEqual(44);
  }
 });
}


test("two-tab opt-in lab shows the other tab only in the same room and disconnects safely", async ({ browser }) => {
 const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
 const a = await context.newPage(), b = await context.newPage();
 const left = await openPreview(a, 390, "?lab=two-tabs");
 const right = await openPreview(b, 390, "?lab=two-tabs");
 const state = p => p.evaluate(() => window.__NHA3D_PREVIEW_STATE__());
 await expect(a.locator("header")).toContainText("Chỉ 2 tab cùng trình duyệt");
 await expect.poll(async () => (await state(a)).partner.labActive).toBe(false);
 await expect.poll(async () => (await state(a)).partner.visible).toBe(false);
 await a.getByRole("button", { name: /Kết nối hai tab/ }).click();
 await b.getByRole("button", { name: /Kết nối hai tab/ }).click();
 await expect.poll(async () => (await state(a)).partner.visible, { timeout: 12_000 }).toBe(true);
 await expect.poll(async () => (await state(b)).partner.visible, { timeout: 12_000 }).toBe(true);
 expect((await state(a)).partner.mode).toBe("two-tab-lab");
 expect((await state(b)).partner.cell).not.toBeNull();
 await b.getByRole("button", { name: "🚪 Phòng bếp" }).click();
 await expect.poll(async () => (await state(b)).room, { timeout: 30_000 }).toBe("bep");
 await expect.poll(async () => (await state(a)).partner.remoteRoom, { timeout: 10_000 }).toBe("bep");
 await expect.poll(async () => (await state(a)).partner.visible).toBe(false);
 await a.getByRole("button", { name: "🚪 Phòng bếp" }).click();
 await expect.poll(async () => (await state(a)).room, { timeout: 30_000 }).toBe("bep");
 await expect.poll(async () => (await state(a)).partner.visible, { timeout: 10_000 }).toBe(true);
 await b.getByRole("button", { name: /Ngắt kết nối tab/ }).click();
 await expect.poll(async () => (await state(a)).partner.visible, { timeout: 10_000 }).toBe(false);
 await expect.poll(async () => (await state(a)).partner.remoteRoom).toBe(null);
 await expect.poll(async () => (await state(b)).partner.labActive).toBe(false);
 expect(left.errors).toEqual([]);
 expect(right.errors).toEqual([]);
 expect(left.firebase).toEqual([]);
 expect(right.firebase).toEqual([]);
 await context.close();
});

test("two-tab lab stays opt-in and touch controls fit at 360px", async ({ page }) => {
 const { errors, firebase } = await openPreview(page, 360, "?lab=two-tabs");
 const status = () => page.evaluate(() => window.__NHA3D_PREVIEW_STATE__());
 await expect.poll(async () => (await status()).partner.labActive).toBe(false);
 await expect(page.getByRole("button", { name: /Gọi bạn mô phỏng/ })).toHaveCount(0);
 const connect = page.getByRole("button", { name: /Kết nối hai tab/ });
 const rect = await connect.boundingBox();
 expect(rect).not.toBeNull();
 expect(rect.x).toBeGreaterThanOrEqual(0);
 expect(rect.x + rect.width).toBeLessThanOrEqual(361);
 expect(rect.height).toBeGreaterThanOrEqual(44);
 await connect.click();
 await expect.poll(async () => (await status()).partner.labActive).toBe(true);
 await expect.poll(async () => (await status()).partner.visible).toBe(false, "a single tab has no remote partner");
 await page.getByRole("button", { name: /Ngắt kết nối tab/ }).click();
 await expect.poll(async () => (await status()).partner.labActive).toBe(false);
 expect(errors).toEqual([]);
 expect(firebase).toEqual([]);
});
