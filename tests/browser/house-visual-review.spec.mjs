import { test, expect } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// Screenshot review is deliberately local browser-only: no Firebase credentials,
// downloads of real user data, production mutations or CI auto-approval.
const rooms = [
  ["phong-khach", "Phòng khách"],
  ["bep", "Bếp"],
  ["phong-anh", "Phòng Anh"],
  ["phong-em", "Phòng Em"],
  ["goc-sang-tao", "Góc sáng tạo"],
  ["gac", "Gác kỷ niệm"],
];
const output = "test-results/house-visual-review";

test("export six room interiors and mobile layouts for human visual review", async ({ page }) => {
  test.setTimeout(120_000);
  mkdirSync(output, { recursive: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => localStorage.setItem("hu-hen-ho-me", "0"));
  await page.route("https://www.gstatic.com/**", route => route.abort());
  await page.route("https://fonts.googleapis.com/**", route => route.abort());
  await page.route("https://fonts.gstatic.com/**", route => route.abort());

  const shots = [];
  await page.goto("/index.html#nha");
  await expect(page.locator("#v-nha")).toBeVisible();
  await expect(page.locator(".world .zones polygon[data-zone]")).toHaveCount(11);
  await page.screenshot({
    path: join(output, "00-overview-mobile-390.png"),
    fullPage: true, animations: "disabled",
  });
  shots.push({ path: "00-overview-mobile-390.png", route: "nha", kind: "page" });

  for (const [route, title] of rooms) {
    await page.goto(`/index.html#${route}`);
    const view = page.locator(`#v-${route}`);
    const scene = view.locator(".room3d");
    const image = scene.locator("img.wbg");
    await expect(scene).toBeVisible();
    await expect.poll(() => image.evaluate(img =>
      img.complete && img.naturalWidth === 1170 && img.naturalHeight === 1170
    ), { timeout: 10000 }).toBe(true);
    await expect.poll(() => scene.evaluate(el => {
      const r = el.getBoundingClientRect();
      const bg = el.querySelector("img.wbg")?.getBoundingClientRect();
      return r.width >= 300 && r.height >= 300 && !!bg && bg.width >= 300;
    }), { timeout: 10000 }).toBe(true);

    // Scene-only image lets a reviewer compare all six rooms at identical size.
    await scene.screenshot({
      path: join(output, `room-${route}-390.png`),
      animations: "disabled",
    });
    // Whole page preserves surrounding controls, back navigation and spacing.
    await page.screenshot({
      path: join(output, `page-${route}-390.png`),
      fullPage: true, animations: "disabled",
    });
    shots.push(
      { path: `room-${route}-390.png`, route, title, kind: "interior" },
      { path: `page-${route}-390.png`, route, title, kind: "page" },
    );
  }
  writeFileSync(join(output, "review-manifest.json"), JSON.stringify({
    status: "AUTOMATED_CAPTURE_NOT_VISUAL_SIGNOFF",
    viewport: { width: 390, height: 844 },
    rooms: rooms.length, screenshots: shots,
    requiresHumanReview: [
      "Verify no furniture/characters are cropped or visually misplaced",
      "Verify room floors and ceilings are fully visible and proportionate",
      "Check labels, controls and navigation do not overlap on mobile",
      "Confirm 1170x1170 source art provides enough physical decoration space",
      "Record any changes requested before merging PR #9",
    ],
    verifiedAgainstProduction: false,
  }, null, 2) + "\n");
  expect(shots).toHaveLength(13);
});
