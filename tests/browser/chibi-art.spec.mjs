import { test, expect } from "@playwright/test";
import { readdirSync } from "node:fs";

// Characters and pets use the flat chibi set in assets/chibi; scenery stays 3D.
test("characters render from the chibi set, full frame, with no broken layer", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("hu-hen-ho-me", "0"));
  for (const host of ["www.gstatic.com", "fonts.googleapis.com", "fonts.gstatic.com"]) await page.route(`https://${host}/**`, route => route.abort());
  const failed = [];
  page.on("response", response => { if (response.url().includes("/assets/chibi/") && !response.ok()) failed.push(response.url()); });
  await page.goto("/index.html#khu-vuon");
  const layers = page.locator(".garden3d .chr[data-gchar] .cstack img");
  await expect(layers.first()).toBeVisible();
  await expect.poll(() => layers.evaluateAll(els => els.every(el => el.complete && el.naturalWidth > 0))).toBe(true);
  const info = await layers.evaluateAll(els => els.map(el => {
    const stack = el.parentElement.getBoundingClientRect(), box = el.getBoundingClientRect();
    return { src: el.getAttribute("src"), fills: Math.abs(box.width - stack.width) < 1.5 && Math.abs(box.height - stack.height) < 1.5 };
  }));
  expect(info.length).toBeGreaterThanOrEqual(5);
  for (const layer of info) {
    expect(layer.src).toMatch(/^assets\/chibi\/nv_[a-z0-9_]+\.svg$/);
    expect(layer.fills).toBe(true);
  }
  expect(await page.locator('img[src*="assets/3d/nv_"], img[src*="assets/3d/thu_"]').count()).toBe(0);
  expect(failed).toEqual([]);
});

test("every 3D character layer and pet sprite has a chibi twin", () => {
  const names = (dir, ext) => readdirSync(dir).filter(f => /^(nv|thu)_/.test(f) && f.endsWith(ext)).map(f => f.slice(0, -ext.length)).sort();
  expect(names("assets/chibi", ".svg")).toEqual(names("assets/3d", ".webp"));
});
