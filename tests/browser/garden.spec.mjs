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
  // Playwright's real pointer click waits for layout stability/actionability.
  // A raw mouse click at a previously sampled box can miss while fit3() resizes.
  // The nine-point coordinate regression below still checks actual hit geometry.
  await hit.click();
  await expect(page.locator("#gGallery")).toBeVisible();
});

test("the real swing seat center is inside the swing target", async ({ page }) => {
  await openGarden(page);
  // Click the actual swing-seat center after Playwright waits for a stable hitbox.
  // Avoid stale screen coordinates while fit3() completes.
  await page.locator(".garden3d button[data-gi='ghe'] .ghit").click();
  await expect(page.locator("#tab-care .g-swing button")).toHaveText("Đứng dậy");
});

test("keyboard activation acts on the focused scene button, not the nearest coordinate", async ({ page }) => {
  await openGarden(page);
  const board = page.locator(".garden3d button[data-gi='bang']");
  // The garden scene may be re-rendered during fit3(). Locator.press
  // resolves and focuses the current button before dispatching Enter;
  // page.keyboard.press after a separate focus can target a stale node.
  await board.press("Enter");
  await expect(page.locator("#gGallery")).toBeVisible();
  await expect(page.locator("#tab-care .g-swing button")).toHaveText("Ngồi lên xích đu");
});

test("a pointer tap on the character sends a hug at 390px and 360px", async ({ browser }) => {
  for (const width of [390, 360]) {
    const context = await browser.newContext({ viewport: { width, height: 844 } });
    const page = await context.newPage();
    await openGarden(page);
    const hit = page.locator(".garden3d .chr[data-gchar] .gchar-hit");
    await expect(hit).toBeVisible();
    // The character is animated; a cached point may fall outside its moving hitbox.
    // Locator.click still sends a real pointer event, using the current live geometry.
    await hit.click();
    await expect(page.locator(".toast")).toContainText("Đã gửi");
    const taps = await page.evaluate(() => JSON.parse(localStorage.getItem("hu-hen-ho-v2") || "{}").taps || {});
    const sent = Object.values(taps);
    expect(sent).toHaveLength(1);
    expect(sent[0].kind).toBe("hug");
    await context.close();
  }
});

test("board hit target wins over the neighboring watering-can expansion across viewports", async ({ page }) => {
  for (const width of [390, 360]) {
    await page.setViewportSize({ width, height: 844 });
    for (const [fx, fy] of [[0.2,0.2],[0.5,0.2],[0.8,0.2],[0.2,0.5],[0.5,0.5],[0.8,0.5],[0.2,0.8],[0.5,0.8],[0.8,0.8]]) {
      await page.goto("/index.html#khu-vuon");
      await expect(page.locator(".garden3d")).toBeVisible();
      const hit = page.locator(".garden3d button[data-gi='bang'] .ghit");
      // Keep the nine-point geometry assertion: each selected point must
      // actually receive a real pointer tap. Unlike a raw click using a
      // previously sampled viewport coordinate, locator.click waits for the
      // target to be stable and checks whether another element intercepts
      // this exact relative point (including the neighboring watering can).
      const bounds = await hit.boundingBox();
      expect(bounds, "board must have a rendered hit region").not.toBeNull();
      expect(bounds.width).toBeGreaterThan(0);
      expect(bounds.height).toBeGreaterThan(0);
      await hit.click({
        position: { x: bounds.width * fx, y: bounds.height * fy },
        timeout: 10000,
      });
      await expect(page.locator("#gGallery")).toBeVisible();
    }
  }
});

test("daily pot wins over the overlapping seed-box hit region at both phone widths", async ({ browser }) => {
  for (const width of [390, 360]) {
    for (const fx of [0.15, 0.5, 0.85]) {
      const context = await browser.newContext({ viewport: { width, height: 844 } });
      const page = await context.newPage();
      await openGarden(page);
      const overlap = await page.evaluate(() => {
        const pot = document.querySelector(".garden3d button.gcare .ghit")?.getBoundingClientRect();
        const seed = document.querySelector('.garden3d button[data-gi="hopgiong"] .ghit')?.getBoundingClientRect();
        if (!pot || !seed) return null;
        const left = Math.max(pot.left, seed.left), right = Math.min(pot.right, seed.right);
        const top = Math.max(pot.top, seed.top), bottom = Math.min(pot.bottom, seed.bottom);
        if (right <= left || bottom <= top) return null;
        return { left, right, top, bottom };
      });
      expect(overlap, "daily pot and seed-box hit regions should overlap in the reported collision area").not.toBeNull();
      const point = { x: overlap.left + (overlap.right - overlap.left) * fx, y: overlap.top + (overlap.bottom - overlap.top) * 0.55 };
      await page.mouse.click(point.x, point.y);
      await expect(page.locator(".toast")).toContainText("Đã tưới");
      await expect(page.locator("#tab-care .gcare-card")).toContainText("đã tưới lúc");
      await context.close();
    }
  }
});
