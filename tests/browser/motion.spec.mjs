import { test, expect } from "@playwright/test";

async function openGarden(page) {
  await page.addInitScript(() => localStorage.setItem("hu-hen-ho-me", "0"));
  await page.route("https://www.gstatic.com/**", route => route.abort());
  await page.route("https://fonts.googleapis.com/**", route => route.abort());
  await page.route("https://fonts.gstatic.com/**", route => route.abort());
  await page.goto("/index.html#khu-vuon");
  await expect(page.locator(".garden3d")).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("data-gn-motion", "ready");
}

test("3D garden characters and flowers have independent idle motion", async ({ page }) => {
  await openGarden(page);
  const character = page.locator(".garden3d .chr[data-gchar] .cstack").first();
  const flower = page.locator(".garden3d .gfl img").first();
  await expect(character).toBeVisible();
  await expect(flower).toBeVisible();
  await expect.poll(() => character.evaluate(el => getComputedStyle(el).animationName)).toBe("gnCharacterIdle");
  await expect.poll(() => flower.evaluate(el => getComputedStyle(el).animationName)).toBe("gnFlowerIdle");
});

test("touching a 3D object produces a physical response and contextual particles", async ({ page }) => {
  await openGarden(page);
  const board = page.locator(".garden3d button[data-gi='bang']");
  const point = await board.evaluate(el => {
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  });
  await page.mouse.move(point.x, point.y);
  await page.mouse.down();
  await expect(board).toHaveClass(/gn-motion-active/);
  await expect(board).toHaveClass(/gn-motion-toggle/);
  await expect(page.locator(".garden3d .wcanvas .gn-burst i")).toHaveCount(3);
  await page.mouse.up();
  await expect(page.locator("#gGallery")).toBeVisible();
});

test("reduced-motion preference disables continuous animation and particle bursts", async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    reducedMotion: "reduce"
  });
  const page = await context.newPage();
  await openGarden(page);
  const character = page.locator(".garden3d .chr[data-gchar] .cstack").first();
  await expect.poll(() => character.evaluate(el => getComputedStyle(el).animationName)).toBe("none");
  const board = page.locator(".garden3d button[data-gi='bang']");
  const point = await board.evaluate(el => {
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  });
  await page.mouse.move(point.x, point.y);
  await page.mouse.down();
  await expect(board).not.toHaveClass(/gn-motion-active/);
  await expect(page.locator(".gn-burst")).toHaveCount(0);
  await page.mouse.up();
  await context.close();
});
