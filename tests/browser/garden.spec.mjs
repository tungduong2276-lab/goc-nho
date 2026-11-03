import { test, expect } from "@playwright/test";

async function openGarden(page) {
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  await page.addInitScript(() => {
    localStorage.setItem("hu-hen-ho-me", "0");
  });
  await page.route("**/index.html", async route => {
    const response = await route.fetch();
    let body = await response.text();
    const startup = "cloudInit();initDb();";
    if (!body.includes(startup)) throw new Error("Firebase startup hook changed; review test isolation");
    body = body.replace(startup, "/* Firebase disabled in isolated browser tests */");
    await route.fulfill({ response, body });
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
