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
  const character = page.locator(".garden3d .chr[data-gchar] .cstack img").first();
  const flower = page.locator(".garden3d .gfl img").first();
  await expect(character).toBeVisible();
  await expect(flower).toBeVisible();
  await expect.poll(() => character.evaluate(el => getComputedStyle(el).animationName)).toBe("gnCharacterIdle");
  await expect.poll(() => flower.evaluate(el => getComputedStyle(el).animationName)).toBe("gnFlowerIdle");
});

test("touching a 3D object produces a physical response and contextual particles", async ({ page }) => {
  await openGarden(page);
  const board = page.locator(".garden3d button[data-gi='bang']");
  // Hover resolves the live hitbox after delayed fit3() transforms settle,
  // then mouse.down exercises real pointerdown without using stale coordinates.
  await board.locator(".ghit").hover();
  // Particle nodes are short-lived and may be removed when the garden rerenders.
  // Observe creation rather than asserting they still exist after the reaction.
  await page.evaluate(() => {
    window.__gnBurstSeen = 0;
    new MutationObserver(records => {
      for (const record of records) for (const node of record.addedNodes) {
        if (node.nodeType !== 1) continue;
        window.__gnBurstSeen += node.matches?.(".gn-burst") ? node.querySelectorAll("i").length : node.querySelectorAll?.(".gn-burst i").length || 0;
      }
    }).observe(document.body, { childList: true, subtree: true });
  });
  await page.mouse.down();
  await expect(board).toHaveClass(/gn-motion-active/);
  await expect(board).toHaveClass(/gn-motion-toggle/);
  await expect.poll(() => page.evaluate(() => window.__gnBurstSeen)).toBeGreaterThanOrEqual(3);
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
  const character = page.locator(".garden3d .chr[data-gchar] .cstack img").first();
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


async function openHouse(page) {
  await page.addInitScript(() => localStorage.setItem("hu-hen-ho-me", "0"));
  await page.route("https://www.gstatic.com/**", route => route.abort());
  await page.route("https://fonts.googleapis.com/**", route => route.abort());
  await page.route("https://fonts.gstatic.com/**", route => route.abort());
  await page.goto("/index.html#nha");
  await expect(page.locator(".world")).toBeVisible();
  await expect(page.locator(".house-room-strip")).toBeVisible();
}

test("house overview connects the exterior to all six existing room scenes", async ({ page }) => {
  await openHouse(page);
  const cards = page.locator(".house-room-card");
  await expect(cards).toHaveCount(6);
  await expect(cards.filter({ hasText: "Phòng khách" })).toBeVisible();
  await expect(cards.filter({ hasText: "Bếp" })).toBeVisible();
  await expect.poll(() => cards.locator("img").evaluateAll(images => images.every(img => img.complete && img.naturalWidth > 0))).toBe(true);
});

test("room directory navigates between interiors and marks the current room", async ({ page }) => {
  await openHouse(page);
  await page.locator('.house-room-card[href="#bep"]').click();
  await expect(page).toHaveURL(/#bep$/);
  await expect(page.locator("#tab-bep .room3d")).toBeVisible();
  await expect(page.locator('#tab-bep .house-room-card[aria-current="page"]')).toHaveAttribute("href", "#bep");

  await page.locator('#tab-bep .house-room-card[href="#phong-em"]').click();
  await expect(page).toHaveURL(/#phong-em$/);
  await expect(page.locator("#tab-phong-em .room3d")).toBeVisible();
  await expect(page.locator('#tab-phong-em .house-room-card[aria-current="page"]')).toHaveAttribute("href", "#phong-em");
});
