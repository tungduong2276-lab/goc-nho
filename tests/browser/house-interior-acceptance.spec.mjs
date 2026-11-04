import { test, expect } from "@playwright/test";

// PR #9 M0 acceptance regression: inspect the actual room-interior asset,
// not just a successful SVG polygon click from the overview.
const rooms = [
  ["phong-khach", "Phòng khách"],
  ["bep", "Bếp"],
  ["phong-anh", "Phòng Anh"],
  ["phong-em", "Phòng Em"],
  ["goc-sang-tao", "Góc sáng tạo"],
  ["gac", "Gác kỷ niệm"],
];

test("all six room interiors render real images and allow returning home on small phones", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("hu-hen-ho-me", "0"));
  await page.route("https://www.gstatic.com/**", route => route.abort());
  await page.route("https://fonts.googleapis.com/**", route => route.abort());
  await page.route("https://fonts.gstatic.com/**", route => route.abort());

  for (const width of [360, 390, 430]) {
    await page.setViewportSize({ width, height: 844 });
    for (const [route, name] of rooms) {
      await page.goto(`/index.html#${route}`);
      const view = page.locator(`#v-${route}`);
      await expect(view).toBeVisible();
      const room = view.locator(".room3d");
      await expect(room, `${route}: interior scene must exist`).toBeVisible();
      const stage = room.locator(".rstage");
      await expect(stage).toHaveAttribute("data-w", "1170");
      const bg = room.locator("img.wbg");
      await expect(bg).toBeVisible();
      await expect.poll(async () => bg.evaluate(img =>
        img.complete && img.naturalWidth > 0 && img.naturalHeight > 0
      ), { timeout: 10000, message: `${route}: room image must finish loading` }).toBe(true);

      // Room content and fit3() can be rebuilt after asset load.
      // Require nonzero *settled* dimensions, rather than sampling the
      // element during its initial CSS/DOM transition.
      await expect.poll(async () => room.evaluate(el => {
        const box = el.getBoundingClientRect();
        const stageBox = el.querySelector(".wcanvas")?.getBoundingClientRect();
        return box.width > 200 && box.height > 200 &&
          !!stageBox && stageBox.width > 0 && stageBox.height > 0;
      }), { timeout: 10000, message: `${route}: room stage never becomes measurable` }).toBe(true);

      let geometry;
      await expect.poll(async () => {
        geometry = await room.evaluate(el => {
        const scene = el.querySelector(".wcanvas");
        const stage = el.querySelector(".rstage");
        const backdrop = el.querySelector(".wbg");
        const bounds = el.getBoundingClientRect();
        const raw = scene?.getBoundingClientRect();
        return {
          width: bounds.width, height: bounds.height,
          scrollWidth: el.scrollWidth,
          rawWidth: raw?.width, rawHeight: raw?.height,
          stageWidth: stage?.getBoundingClientRect().width,
          stageHeight: stage?.getBoundingClientRect().height,
          canvasTop: scene ? Number.parseFloat(getComputedStyle(scene).top) : null,
          imageWidth: backdrop?.naturalWidth, imageHeight: backdrop?.naturalHeight,
        };
        });
        // DOM rebuilds can replace an already measured scene between awaits.
        // Keep all original checks; only accept a complete, nonzero snapshot.
        return geometry.width > 200 && geometry.height > 200 &&
          geometry.rawWidth > 0 && geometry.rawHeight > 0 &&
          geometry.stageWidth > 0 && geometry.stageHeight > 0;
      }, { timeout: 10000, message: `${route}: room geometry must settle before assertions` }).toBe(true);
      expect(geometry.width, `${route}: visible stage width`).toBeGreaterThan(200);
      expect(geometry.height, `${route}: visible stage height`).toBeGreaterThan(200);
      expect(geometry.imageWidth, `${route}: source art must be loaded`).toBeGreaterThan(0);
      expect(geometry.imageHeight, `${route}: source art must be loaded`).toBeGreaterThan(0);
      expect(geometry.rawWidth).toBeGreaterThan(0);
      expect(geometry.rawHeight).toBeGreaterThan(0);
      // House rooms display the entire 1170-square image, with no top crop.
      expect(Math.abs(geometry.stageWidth - geometry.stageHeight), `${route}: square fitted stage`).toBeLessThanOrEqual(2);
      expect(geometry.canvasTop, `${route}: uncropped image begins at stage top`).toBe(0);
      // Layout should be contained within viewport; no horizontal page overflow.
      const pageWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(pageWidth, `${route}: unexpected horizontal overflow at ${width}px`).toBeLessThanOrEqual(width + 2);

      const heading = view.locator(".tab-head h2");
      await expect(heading).toBeVisible();
      await expect(heading).not.toBeEmpty();
      const back = view.locator('a.back[href="#nha"]');
      await expect(back, `${route}: back link`).toBeVisible();
      await back.click();
      await expect(page).toHaveURL(/#nha$/);
      await expect(page.locator("#v-nha")).toBeVisible();
    }
  }
});
