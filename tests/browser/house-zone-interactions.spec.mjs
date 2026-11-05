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
    // The isometric SVG can be replaced during fit3(): resolve and focus
    // the current polygon in the same Playwright keyboard action.
    await target.press("Enter");
    await expect(page).toHaveURL(new RegExp(`#${hash}$`));
  }
});

test("focused room remains keyboard-operable when house DOM rerenders", async ({ page }) => {
  await openHouse(page);
  for (const [zone, hash] of rooms) {
    await page.goto("/index.html#nha");
    const target = page.locator(`.world .zones polygon[data-zone="${zone}"]`);
    await expect(target).toBeVisible();
    await target.focus();
    await expect(target).toBeFocused();
    // Simulate the app updating shared/decorative state while someone is
    // navigating by keyboard: renderHome replaces every SVG polygon.
    await page.evaluate(() => renderHome());
    await expect(target, `${zone}: rerender should retain keyboard focus`).toBeFocused();
    await target.press("Enter");
    await expect(page).toHaveURL(new RegExp(`#${hash}import { test, expect } from "@playwright/test";

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
    // The isometric SVG can be replaced during fit3(): resolve and focus
    // the current polygon in the same Playwright keyboard action.
    await target.press("Enter");
    await expect(page).toHaveURL(new RegExp(`#${hash}$`));
  }
});

));
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
      // Room polygons overlap in the isometric projection. A polygon bounding
      // box center can belong to a higher floor; sample its truly clickable
      // pixels and require a meaningful uncovered hit region instead.
      // The house map can replace the SVG while images and fit3() settle.
      // Retry the scroll on the current locator, never a stale element handle.
      await expect.poll(async () => {
        try {
          await target.scrollIntoViewIfNeeded({ timeout: 1500 });
          return true;
        } catch {
          return false;
        }
      }, { timeout: 10000 }).toBe(true);
      const hit = await target.evaluate(el => {
        const box = el.getBBox();
        const ctm = el.getScreenCTM();
        const points = [];
        let inside = 0;
        for (let row = 0; row < 16; row++) {
          for (let col = 0; col < 16; col++) {
            const p = new DOMPoint(
              box.x + box.width * (col + 0.5) / 16,
              box.y + box.height * (row + 0.5) / 16
            );
            if (!el.isPointInFill(p)) continue;
            inside++;
            const viewport = p.matrixTransform(ctm);
            if (document.elementFromPoint(viewport.x, viewport.y) === el) {
              points.push({ x: viewport.x, y: viewport.y });
            }
          }
        }
        return { inside, reachable: points.length, point: points[Math.floor(points.length / 2)] };
      });
      expect(hit.inside, `${zone}: polygon should have filled area`).toBeGreaterThan(10);
      expect(hit.reachable, `${zone}: visible room must have a usable pointer hit region`).toBeGreaterThanOrEqual(5);
      await page.mouse.click(hit.point.x, hit.point.y);
      await expect(page).toHaveURL(new RegExp(`#${hash}$`));
    }
  }
});
