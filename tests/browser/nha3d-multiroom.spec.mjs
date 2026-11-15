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

for (const width of [360,390,430]) test("furnished room stays between mobile controls at "+width+"px", async ({ page }) => {
  const { errors, firebase } = await openPreview(page,width);
  const assertView = async () => {
    const view = await page.evaluate(() => window.__NHA3D_PREVIEW_STATE__().view);
    expect(view.safe.bottom).toBeGreaterThan(view.safe.top+100);
    expect(view.nearWallHeight).toBeLessThan(1);
    for (const p of view.bounds) {
      expect(p.x).toBeGreaterThanOrEqual(view.safe.left);
      expect(p.x).toBeLessThanOrEqual(view.safe.right);
      expect(p.y).toBeGreaterThanOrEqual(view.safe.top);
      expect(p.y).toBeLessThanOrEqual(view.safe.bottom);
    }
  };
  await assertView();
  for (const [label, room] of [['🚪 Phòng bếp','bep'],['🚪 Phòng khách','khach'],['🚪 Phòng ngủ','ngu']]) {
    await page.getByRole('button',{name:label,exact:true}).click();
    await expect.poll(() => page.evaluate(() => window.__NHA3D_PREVIEW_STATE__().room), {timeout:30_000}).toBe(room);
    await assertView();
  }
  await page.setViewportSize({width:430,height:900});
  await expect.poll(() => page.evaluate(() => window.__NHA3D_PREVIEW_STATE__().view.safe.right)).toBe(418);
  await assertView();
  expect(errors).toEqual([]); expect(firebase).toEqual([]);
});

test("room refits when a control panel grows after load", async ({ page }) => {
  const { errors, firebase } = await openPreview(page);
  const before = await page.evaluate(() => window.__NHA3D_PREVIEW_STATE__().view.safe.top);
  await page.evaluate(() => { document.querySelector("header").style.paddingBottom = "64px"; });
  await expect.poll(() => page.evaluate(() => window.__NHA3D_PREVIEW_STATE__().view.safe.top)).toBeCloseTo(before + 64, 1);
  const { view, headerBottom } = await page.evaluate(() => ({ view: window.__NHA3D_PREVIEW_STATE__().view,
    headerBottom: document.querySelector("header").getBoundingClientRect().bottom }));
  for (const p of view.bounds) expect(p.y).toBeGreaterThanOrEqual(headerBottom);
  expect(errors).toEqual([]); expect(firebase).toEqual([]);
});

test("header keeps a top margin and landscape rotation keeps the room readable", async ({ page }) => {
  const { errors, firebase } = await openPreview(page);
  expect(await page.evaluate(() => document.querySelector("header").getBoundingClientRect().top)).toBeGreaterThanOrEqual(12);
  await page.setViewportSize({ width: 844, height: 390 });
  // Landscape uses the free area left of the right-hand buttons, not the thin band above them.
  await expect.poll(() => page.evaluate(() => window.__NHA3D_PREVIEW_STATE__().view.safe.right)).toBeLessThan(832);
  const { view, panels } = await page.evaluate(() => ({ view: window.__NHA3D_PREVIEW_STATE__().view,
    panels: ["header", ".status", "#doors", "#activities"].map(selector => {
      const r = document.querySelector(selector).getBoundingClientRect();
      return { left: r.left, top: r.top, right: r.right, bottom: r.bottom };
    }) }));
  const xs = view.bounds.map(p => p.x), ys = view.bounds.map(p => p.y);
  const room = { left: Math.min(...xs), right: Math.max(...xs), top: Math.min(...ys), bottom: Math.max(...ys) };
  expect(room.bottom - room.top).toBeGreaterThanOrEqual(120);
  for (const p of panels) expect(p.left < room.right && p.right > room.left && p.top < room.bottom && p.bottom > room.top).toBe(false);
  expect(errors).toEqual([]); expect(firebase).toEqual([]);
});

for (const width of [360,390,430]) test("room indicator fits one row with full accessible names at "+width+"px", async ({ page }) => {
  await openPreview(page,width);
  const buttons = await page.locator("#rooms button").evaluateAll(els => els.map(el => {
    const r = el.getBoundingClientRect();
    return { top: Math.round(r.top), left: r.left, right: r.right, height: r.height, label: el.getAttribute("aria-label"), current: el.getAttribute("aria-current") };
  }));
  expect(buttons.map(b => b.label)).toEqual(["Phòng khách","Phòng bếp","Phòng ngủ"]);
  expect(buttons.map(b => b.current)).toEqual(["true","false","false"]);
  expect(new Set(buttons.map(b => b.top)).size).toBe(1);
  for (const b of buttons) {
    expect(b.left).toBeGreaterThanOrEqual(0);
    expect(b.right).toBeLessThanOrEqual(width+1);
    expect(b.height).toBeGreaterThanOrEqual(44);
  }
});

for (const width of [360,390]) test("two-tab lab panel sits below the header without covering the room indicator at "+width+"px", async ({ page }) => {
  await openPreview(page,width,"?lab=two-tabs&rev=20261111b");
  await expect(page.locator("#lab-state")).toContainText("Chưa bật");
  const rects = () => page.evaluate(() => {
    const box = selector => { const r = document.querySelector(selector).getBoundingClientRect(); return { top: r.top, bottom: r.bottom }; };
    return { header: box("header"), lab: box("#lab-help"), view: window.__NHA3D_PREVIEW_STATE__().view };
  });
  await expect.poll(async () => { const r = await rects(); return r.lab.top - r.header.bottom; }).toBeGreaterThanOrEqual(8);
  await expect.poll(async () => { const r = await rects(); return r.view.safe.top - r.lab.bottom; }).toBeGreaterThanOrEqual(12);
  const { view, lab } = await rects();
  expect(view.safe.bottom).toBeGreaterThan(view.safe.top+100);
  for (const p of view.bounds) expect(p.y).toBeGreaterThanOrEqual(lab.bottom);
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


test("diagnostic lab one-click opens same-profile second tab and confirms real handshake", async ({ browser }) => {
 const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
 const a = await context.newPage();
 const { errors, firebase } = await openPreview(a, 390, "?lab=two-tabs&rev=20261111b");
 await expect(a.locator("#lab-help")).toBeVisible();
 await expect(a.locator("#lab-help")).toContainText("Bản sửa V2.2");
 await expect(a.locator("#lab-state")).toContainText("Chưa bật");
 await expect(a.getByRole("button", { name: /Kết nối hai tab/ })).toBeVisible();
 const [b] = await Promise.all([
   context.waitForEvent("page"),
   a.locator("#lab-open").click()
 ]);
 await b.waitForLoadState("domcontentloaded");
 expect(new URL(b.url()).origin).toBe(new URL(a.url()).origin);
 expect(new URL(b.url()).searchParams.get("join")).toBe("1");
 const pairA = new URL(a.url()).searchParams.get("pair");
 const pairB = new URL(b.url()).searchParams.get("pair");
 expect(pairA).toMatch(/^[a-f0-9]{20}$/);
 expect(pairB).toBe(pairA);
 await expect(b.locator("#lab-help")).toBeVisible();
 const state = p => p.evaluate(() => window.__NHA3D_PREVIEW_STATE__());
 await expect.poll(async () => (await state(a)).partner.diagnostics?.phase, { timeout: 30_000 }).toBe("connected");
 await expect.poll(async () => (await state(b)).partner.diagnostics?.phase, { timeout: 30_000 }).toBe("connected");
 await expect(a.locator("#lab-state")).toContainText("Đã kết nối thành công");
 await expect(b.locator("#lab-state")).toContainText("Đã kết nối thành công");
 expect((await state(a)).partner.diagnostics.received).toBeGreaterThan(0);
 expect((await state(b)).partner.diagnostics.received).toBeGreaterThan(0);
 await b.getByRole("button", { name: /Ngắt kết nối tab/ }).click();
 await expect.poll(async () => (await state(a)).partner.diagnostics?.phase, { timeout: 12_000 }).toBe("waiting");
 await expect(a.locator("#lab-state")).toContainText("đang tìm tab thứ hai");
 await expect.poll(async () => (await state(b)).partner.diagnostics?.phase).toBe("off");
 expect(errors).toEqual([]);
 expect(firebase).toEqual([]);
 await context.close();
});

test("two-tab lab does not falsely connect across isolated browser profiles", async ({ browser }) => {
 const aContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
 const bContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
 const a = await aContext.newPage(), b = await bContext.newPage();
 await openPreview(a, 390, "?lab=two-tabs&rev=20261111b");
 await openPreview(b, 390, "?lab=two-tabs&rev=20261111b");
 await a.getByRole("button", { name: /Kết nối hai tab/ }).click();
 await b.getByRole("button", { name: /Kết nối hai tab/ }).click();
 await expect(a.locator("#lab-state")).toContainText("đang tìm tab thứ hai");
 await expect(b.locator("#lab-state")).toContainText("đang tìm tab thứ hai");
 const state = p => p.evaluate(() => window.__NHA3D_PREVIEW_STATE__());
 await a.waitForTimeout(2_200);
 expect((await state(a)).partner.diagnostics.phase).toBe("waiting");
 expect((await state(b)).partner.diagnostics.phase).toBe("waiting");
 await aContext.close();
 await bContext.close();
});

test("versioned two-tab lab diagnosis is visible on 360px viewport", async ({ page }) => {
 await openPreview(page, 360, "?lab=two-tabs&rev=20261111b");
 await expect(page.locator("#lab-help")).toBeVisible();
 await expect(page.locator("#lab-state")).toContainText("Chưa bật");
 const link = page.locator("#lab-open");
 const box = await link.boundingBox();
 expect(box).not.toBeNull();
 expect(box.x).toBeGreaterThanOrEqual(0);
 expect(box.x + box.width).toBeLessThanOrEqual(361);
 expect(box.height).toBeGreaterThanOrEqual(44);
 const rev = await page.evaluate(() => document.querySelector('script[src*="multiroom-preview.js"]').src);
 expect(rev).toContain("rev=20261111b");
 await expect(page.getByRole("button", { name: /Kết nối hai tab/ })).toBeVisible();
});
