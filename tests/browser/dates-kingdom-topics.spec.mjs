import { test, expect } from "@playwright/test";

async function openAs(page, me, hash) {
  await page.addInitScript(who => localStorage.setItem("hu-hen-ho-me", who), String(me));
  for (const host of ["www.gstatic.com", "fonts.googleapis.com", "fonts.gstatic.com"]) await page.route(`https://${host}/**`, route => route.abort());
  await page.goto("/index.html#" + hash);
}
const court = async page => { await page.locator('[data-kv="court"]').click(); await expect(page.locator("#kgForm")).toBeVisible(); };

test("Em enacts a kingdom proposal alone; Anh still needs approval", async ({ page }) => {
  await openAs(page, 1, "vuong-quoc");
  await court(page);
  await expect(page.locator("#kgForm button.btn-main")).toHaveText("Ban hành ngay");
  await page.locator("#kg-val").fill("Vương quốc Thử Nghiệm");
  await page.locator("#kgForm button.btn-main").click();
  const saved = await page.evaluate(() => Object.values(S.kingdom).map(k => ({ by: k.by, status: k.status, decidedBy: k.decidedBy, hasAt: !!k.decidedAt })));
  expect(saved).toEqual([{ by: 1, status: "ok", decidedBy: 1, hasAt: true }]);
  await expect(page.locator(".props .prop")).toHaveCount(0);
  await expect(page.locator("#v-vuong-quoc .tab-head p")).toContainText("tự quyết được mọi việc");

  // Anh on the same data: his proposal waits, and only Em can pass it.
  await page.evaluate(() => { ME = 0; kgPicked = false; rerender(); });
  await expect(page.locator("#kgForm button.btn-main")).toHaveText(/^Gửi .+ duyệt$/);
  await page.locator("#kg-val").fill("Điều luật thử nghiệm");
  await page.locator("#kgForm button.btn-main").click();
  const anh = await page.evaluate(() => Object.values(S.kingdom).filter(k => k.by === 0).map(k => ({ status: k.status, decidedBy: k.decidedBy ?? null })));
  expect(anh).toEqual([{ status: "pending", decidedBy: null }]);
  await expect(page.locator(".props .prop")).toHaveCount(1);
  await expect(page.locator(".props [data-kok]")).toHaveCount(0);
  await page.evaluate(() => { ME = 1; rerender(); });
  await expect(page.locator(".props [data-kok]")).toHaveText("Thông qua");
});

test("Em builds in one step; Anh lays a foundation that waits for Em", async ({ page }) => {
  await openAs(page, 1, "vuong-quoc");
  await expect(page.locator('[data-kv="map"]')).toBeVisible();
  const build = (me, x) => page.evaluate(({ me, x }) => {
    ME = me; selTile = x + "-0"; rerender();
    const type = Object.keys(BLD).filter(k => k !== "duong").sort((a, b) => BLD[a].cost - BLD[b].cost)[0];
    const button = document.querySelector(`[data-build="${type}"]`);
    if (!button || button.disabled) return { error: "no build button for " + type };
    button.click();
    const r = Object.values(S.realm).find(b => b.x === x && b.y === 0);
    return { by: r.by, built: r.built, builtBy: r.builtBy ?? null };
  }, { me, x });
  expect(await build(1, 0)).toEqual({ by: 1, built: true, builtBy: 1 });
  expect(await build(0, 1)).toEqual({ by: 0, built: false, builtBy: null });
});

test("the jar has the new replayable cards without clashing with saved custom cards", async ({ page }) => {
  await openAs(page, 0, "hom-nay");
  const jar = await page.evaluate(() => {
    const builtIn = GAMES.map(g => g.n);
    return { count: GAMES.length, added: builtIn.filter(n => n > 30), clash: builtIn.filter(n => n > 30 && n < 101),
      noVariety: GAMES.filter(g => !g.joker && !g.aux.length).map(g => g.n),
      thin: GAMES.flatMap(g => g.aux.filter(a => a.list && a.list.length < (a.count || 1) + 3).map(() => g.n)),
      lastIsJoker: !!GAMES[GAMES.length - 1].joker, unique: new Set(builtIn).size === builtIn.length,
      groups: [...new Set(GAMES.map(g => g.g))].every(g => GROUPS[g]),
      topics: [STORY_START, TWISTS, DRAW_THEMES].map(a => [a.length, new Set(a).size]) };
  });
  expect(jar.count).toBe(52);
  expect(jar.added).toHaveLength(22);
  expect(jar).toMatchObject({ clash: [], noVariety: [], thin: [], lastIsJoker: true, unique: true, groups: true });
  expect(jar.topics).toEqual([[28, 28], [32, 32], [44, 44]]);
  await page.locator("details:has(#allList) summary").click();
  await expect(page.locator("#allList li")).toHaveCount(52);
});

test("home tab links into the 3D house as the person holding the phone", async ({ page }) => {
  await openAs(page, 1, "nha");
  const card = page.locator("a.w3d-card");
  await expect(card).toBeVisible();
  await expect(card).toHaveAttribute("href", "./nha3d/?me=em&scene=san");
  const box = await card.boundingBox();
  expect(box.height).toBeGreaterThanOrEqual(56);
});
