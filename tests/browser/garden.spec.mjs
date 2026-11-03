import { test, expect } from "@playwright/test";

async function openGarden(page) {
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  await page.addInitScript(() => {
    localStorage.setItem("hu-hen-ho-me", "0");
  });
  await page.route("https://www.gstatic.com/**", route => route.abort());
  await page.route("https://fonts.googleapis.com/**", route => route.abort());
  await page.route("https://fonts.gstatic.com/**", route => route.abort());

  await page.goto("/index.html#khu-vuon");
  await expect(page.locator("#v-khu-vuon")).toBeVisible();
  await expect(page.locator(".garden3d")).toBeVisible();
  expect(pageErrors, "application must load without uncaught JavaScript errors").toEqual([]);
  return pageErrors;
}

test("app boots and renders the garden without a pageerror", async ({ page }) => {
  await openGarden(page);
  await expect(page.locator("#tab-care .tab-head")).toContainText("Khu vườn");
  await expect(page.locator(".garden3d .wcanvas")).toBeVisible();
});

test("the watering button in the care card is actionable", async ({ page }) => {
  await openGarden(page);
  const waterButton = page.locator("#tab-care .gcare-card button[data-gi='binhtuoi']");
  await expect(waterButton).toBeVisible();
  await waterButton.click();
  await expect(page.locator("#tab-care .gcare-card")).toContainText("đã tưới lúc");
  await expect(page.locator("#tab-care .gcare-card button[data-gi='binhtuoi']")).toHaveCount(0);
});

test("a pointer tap on the board opens the seasonal gallery, not a neighboring object", async ({ page }) => {
  await openGarden(page);
  const hit = page.locator(".garden3d button[data-gi='bang'] .ghit");
  const point = await hit.evaluate(el => {
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  });
  await page.mouse.click(point.x, point.y);
  await expect(page.locator("#gGallery")).toBeVisible();
});

test("the real swing seat center is inside the swing target", async ({ page }) => {
  await openGarden(page);
  const point = await page.locator(".garden3d .wcanvas").evaluate(canvas => {
    const r = canvas.getBoundingClientRect();
    const scale = r.width / 1170;
    // Midpoint of the two seat positions in assets/3d/scene.json.
    return { x: r.left + 347.45 * scale, y: r.top + 655.4 * scale };
  });
  await page.mouse.click(point.x, point.y);
  await expect(page.locator("#tab-care .g-swing button")).toHaveText("Đứng dậy");
});

test("keyboard activation acts on the focused scene button, not the nearest coordinate", async ({ page }) => {
  await openGarden(page);
  const board = page.locator(".garden3d button[data-gi='bang']");
  await board.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#gGallery")).toBeVisible();
  await expect(page.locator("#tab-care .g-swing button")).toHaveText("Ngồi lên xích đu");
});

test("a pointer tap on the character sends exactly one hug", async ({ page }) => {
  await openGarden(page);
  const hit = page.locator(".garden3d .chr[data-gchar] .gchar-hit");
  await expect(hit).toBeVisible();
  const point = await hit.evaluate(el => {
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  });
  await page.mouse.click(point.x, point.y);
  await expect(page.locator(".toast")).toContainText("Đã gửi");
  const taps = await page.evaluate(() => JSON.parse(localStorage.getItem("hu-hen-ho-v2") || "{}").taps || {});
  expect(Object.keys(taps)).toHaveLength(1);
  expect(Object.values(taps)[0].kind).toBe("hug");
});

test("board hit target wins over the neighboring watering-can expansion across viewports", async ({ page }) => {
  for (const width of [390, 360]) {
    await page.setViewportSize({ width, height: 844 });
    for (const [fx, fy] of [[0.2,0.2],[0.5,0.2],[0.8,0.2],[0.2,0.5],[0.5,0.5],[0.8,0.5],[0.2,0.8],[0.5,0.8],[0.8,0.8]]) {
      await page.goto("/index.html#khu-vuon");
      await expect(page.locator(".garden3d")).toBeVisible();
      const hit = page.locator(".garden3d button[data-gi='bang'] .ghit");
      const point = await hit.evaluate((el, p) => {
        const r = el.getBoundingClientRect();
        return { x: r.left + r.width * p.fx, y: r.top + r.height * p.fy };
      }, { fx, fy });
      await page.mouse.click(point.x, point.y);
      await expect(page.locator("#gGallery")).toBeVisible();
    }
  }
});
