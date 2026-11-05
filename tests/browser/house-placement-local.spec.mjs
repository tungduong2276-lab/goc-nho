import { test, expect } from "@playwright/test";

test("isolated furniture preview is opt-in, works in six rooms, never requests Firebase", async ({ page }) => {
  const requests = [];
  page.on("request", request => requests.push(request.url()));
  for (const width of [360,390,430]) {
    await page.setViewportSize({width,height:844});
    await page.goto("/experiments/house-placement.html");
    await expect(page.getByRole("heading",{name:/Thử trang trí Nhà 3D/})).toBeVisible();
    await expect(page.locator("#editor")).toBeHidden();
    await page.getByRole("button",{name:/Bắt đầu thử/}).click();
    await expect(page.locator("#editor")).toBeVisible();
    for (const room of ["phong-khach","bep","phong-anh","phong-em","goc-sang-tao","gac"]) {
      await page.locator("#room").selectOption(room);
      const img=page.locator("#background");
      await expect.poll(() => img.evaluate(el => el.complete && el.naturalWidth > 0)).toBe(true);
      await expect(page.locator("button.slot")).toHaveCount(2);
      await page.locator("button.slot").first().click();
      await page.locator("#asset").selectOption("chair");
      await page.locator("#place").click();
      await expect(page.locator(".item")).toHaveCount(1);
      await expect(page.locator("#move")).toBeEnabled();
      await page.locator("#move").click();
      await expect(page.locator(".item")).toHaveCount(1);
      await page.locator("#rotate").click();
      await page.locator("#undo").click();
      await page.locator("#remove").click();
      await expect(page.locator(".item")).toHaveCount(0);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width+2);
    await page.locator("#reset").click();
    await expect(page.locator(".item")).toHaveCount(0);
    await page.reload();
    await expect(page.locator("#editor")).toBeHidden();
  }
  expect(requests.some(url => /firestore|firebase|googleapis|gstatic|identitytoolkit/i.test(url))).toBe(false);
});

test("no duplicate placement and reset clears memory without saving", async ({page}) => {
  await page.goto("/experiments/house-placement.html");
  await page.locator("#enable").click();
  await page.locator("button.slot").first().click();
  await page.locator("#place").click();
  await expect(page.locator("#place")).toBeDisabled();
  await page.locator("button.slot").last().click();
  await page.locator("#place").click();
  await expect(page.locator(".item")).toHaveCount(2);
  await expect(page.locator("#move")).toBeDisabled();
  await page.locator("#reset").click();
  await expect(page.locator(".item")).toHaveCount(0);
  await expect(page.locator("#undo")).toBeDisabled();
});
