// Bản thử Nhà 3D kiểu Play Together (nha3d/). Chạy trên Chromium không GPU (SwiftShader),
// nên dùng __NHA3D__.tick() để tua logic thay vì chờ theo tốc độ vẽ.
import { test, expect } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

test.describe.configure({ timeout: 120_000 });
const THREE_DIR = resolve("node_modules/three");

async function openHouse(page, { width = 390, height = 844 } = {}) {
  await page.setViewportSize({ width, height });
  const errors = [], firebase = [];
  page.on("pageerror", e => errors.push(e.message));
  page.on("request", r => { if (/firestore|firebaseio|identitytoolkit|securetoken|gstatic\.com\/firebasejs/.test(r.url())) firebase.push(r.url()); });
  if (existsSync(THREE_DIR)) {
    await page.route("https://cdn.jsdelivr.net/npm/three@0.169.0/**", route => {
      const rel = new URL(route.request().url()).pathname.replace("/npm/three@0.169.0/", "");
      route.fulfill({ contentType: "text/javascript", body: readFileSync(resolve(THREE_DIR, rel)) });
    });
  }
  await page.route("https://fonts.googleapis.com/**", route => route.abort());
  await page.route("https://fonts.gstatic.com/**", route => route.abort());
  await page.goto("/nha3d/index.html");
  await page.waitForFunction(() => window.__NHA3D__?.ready, null, { timeout: 90_000 });
  await page.evaluate(() => window.__NHA3D__.pauseAI(true));
  const N = (f, ...a) => page.evaluate(([f, a]) => window.__NHA3D__[f](...a), [f, a]);
  return { errors, firebase, N };
}

test("dựng nhà 3D trực tiếp, không lỗi và không gọi Firebase", async ({ page }) => {
  const { errors, firebase, N } = await openHouse(page);
  await expect(page.locator("#world")).toBeVisible();
  await expect(page.locator("#loading")).toHaveClass(/gone/);
  await expect(page.locator("#toast")).toContainText("chỉ lưu trên máy này");
  expect((await N("info")).calls).toBeGreaterThan(50);
  expect((await N("layout")).items.length).toBeGreaterThan(10);
  expect(errors).toEqual([]);
  expect(firebase).toEqual([]);
});

test("chạm sofa để ngồi, rủ người kia ngồi cùng, đẩy cần điều khiển để đứng dậy", async ({ page }) => {
  const { errors, N } = await openHouse(page);
  const [x, y] = await N("screenOfItem", "a2", 0.5);
  expect(await N("pickAt", x, y)).toBe("a2");
  await page.mouse.click(x, y);
  await page.getByRole("button", { name: "Ngồi cùng Em" }).click();
  await page.waitForTimeout(700);
  await N("tick", 10);
  expect((await N("me")).mode).toBe("sit");
  expect((await N("partner")).mode).toBe("sit");
  await page.keyboard.down("ArrowUp"); await N("tick", 1); await page.keyboard.up("ArrowUp");
  expect((await N("me")).mode).toBe("idle");
  expect(errors).toEqual([]);
});

test("trang trí: thêm đồ từ kho, xoay, không cho thả chồng, và còn nguyên sau khi tải lại", async ({ page }) => {
  const { errors, N } = await openHouse(page);
  const start = (await N("layout")).items.length;
  await page.locator("#btn-edit").click();
  await expect(page.locator(".tray")).toBeVisible();
  await page.getByRole("tab", { name: "Sở thích" }).click();
  await page.locator('.card[data-type="radio"]').click();
  const added = (await N("layout")).items;
  expect(added.length).toBe(start + 1);
  const radio = added[added.length - 1];
  await expect(page.locator("#item-tools")).toBeVisible();
  await page.locator("#btn-rot").click();
  expect((await N("layout")).items.find(i => i.uid === radio.uid).r).toBe(1);

  // kéo bàn trà đè lên sofa → bị từ chối, về chỗ cũ
  const before = (await N("layout")).items.find(i => i.uid === "a3");
  const [tx, ty] = await N("screenOfItem", "a3", 0.4);
  const [sx, sy] = await N("screenOfItem", "a2", 0.3);
  await page.mouse.move(tx, ty); await page.mouse.down();
  for (let k = 1; k <= 10; k++) await page.mouse.move(tx + (sx - tx) * k / 10, ty + (sy - ty) * k / 10);
  await page.mouse.up();
  await expect(page.locator("#toast")).toContainText("Chồng lên");
  expect((await N("layout")).items.find(i => i.uid === "a3")).toEqual(before);

  await page.locator("#btn-done").click();
  await page.reload();
  await page.waitForFunction(() => window.__NHA3D__?.ready, null, { timeout: 90_000 });
  const after = await N("layout");
  expect(after.items.length).toBe(start + 1);
  expect(after.items.find(i => i.uid === radio.uid).r).toBe(1);
  expect(errors).toEqual([]);
});

test("tủ đồ đổi trang phục và nhớ sau khi tải lại", async ({ page }) => {
  const { errors, N } = await openHouse(page);
  const [x, y] = await N("screenOfItem", "b2", 0.5);
  await page.mouse.click(x, y);
  await page.getByRole("button", { name: "Thay đồ" }).click();
  await N("tick", 10);
  await expect(page.locator("#wardrobe")).toBeVisible();
  await page.getByRole("tab", { name: "Mũ" }).click();
  await page.getByRole("button", { name: "Mũ rơm" }).click();
  await expect(page.getByRole("button", { name: "Mũ rơm" })).toHaveAttribute("aria-pressed", "true");
  await page.locator("#wardrobe [data-close]").click();
  await page.reload();
  await page.waitForFunction(() => window.__NHA3D__?.ready, null, { timeout: 90_000 });
  const looks = await page.evaluate(() => JSON.parse(localStorage.getItem("gocnho.nha3d.looks.v1")));
  expect(looks.anh.hat).toBe("murom");
  expect(errors).toEqual([]);
});

for (const width of [360, 390, 430]) {
  test(`nút điều khiển đủ lớn và không chồng nhau ở ${width}px`, async ({ page }) => {
    await openHouse(page, { width, height: 800 });
    const boxes = {};
    for (const sel of ["#joy", ".emotes", "#btn-edit", "#btn-time", "#btn-me", "[data-emote='heart']"]) {
      const b = await page.locator(sel).boundingBox();
      expect(b, sel).not.toBeNull();
      expect(b.x).toBeGreaterThanOrEqual(0); expect(b.x + b.width).toBeLessThanOrEqual(width);
      expect(b.width).toBeGreaterThanOrEqual(44); expect(b.height).toBeGreaterThanOrEqual(44);
      boxes[sel] = b;
    }
    const a = boxes["#joy"], e = boxes[".emotes"];
    expect(a.x + a.width < e.x || e.x + e.width < a.x || a.y + a.height < e.y || e.y + e.height < a.y).toBe(true);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
}

test("vườn: gieo hạt, cùng tưới, cây lớn theo giờ thật, khát khi quên tưới, thu hoạch", async ({ page }) => {
  const { errors, firebase, N } = await openHouse(page);
  expect(await N("plant", "g1")).toBeNull();
  expect(await N("plantKey", "g1")).toBe("trong");
  // Chạm luống → menu gieo hạt
  const [x, y] = await N("screenOfItem", "g1", 0.5);
  await page.mouse.click(x, y);
  await expect(page.locator("#actions")).toBeVisible();
  await page.locator("#actions button", { hasText: "Gieo cà chua bi" }).click();
  await expect.poll(async () => { await N("tick", 0.5); return (await N("plant", "g1"))?.stage; }, { timeout: 30_000 }).toBe(0);
  expect((await N("plant", "g1")).wateredBy).toEqual(["anh"]);
  // Rủ người kia cùng tưới → cả hai cùng tưới
  await N("skipHours", 2);
  const [x2, y2] = await N("screenOfItem", "g1", 0.5);
  await page.mouse.click(x2, y2);
  await page.locator("#actions button", { hasText: "cùng tưới" }).click();
  await expect.poll(async () => { await N("tick", 0.5); return (await N("plant", "g1")).wateredBy.length; }, { timeout: 40_000 }).toBe(2);
  // Cây lớn và đổi hình theo thời gian
  await N("skipHours", 16);
  const grown = await N("plant", "g1");
  expect(grown.stage).toBeGreaterThanOrEqual(2);
  expect(await N("plantKey", "g1")).toBe(`cachua:${grown.stage}:am`);
  // Quên tưới hơn một ngày → khát, hình đổi
  await N("skipHours", 30);
  expect((await N("plant", "g1")).thirsty).toBe(true);
  expect(await N("plantKey", "g1")).toMatch(/:khat$/);
  // Tưới tiếp đến khi chín rồi thu hoạch
  for (let i = 0; i < 3 && !(await N("plant", "g1")).ripe; i++) {
    const [wx, wy] = await N("screenOfItem", "g1", 0.5);
    const before = (await N("layout")).items.find(i => i.uid === "g1").plant.w.length;
    await page.mouse.click(wx, wy);
    await page.locator("#actions button", { hasText: "Tưới nước" }).click();
    await expect.poll(async () => { await N("tick", 0.5); return (await N("layout")).items.find(i => i.uid === "g1").plant.w.length; }, { timeout: 30_000 }).toBe(before + 1);
    await N("skipHours", 20);
  }
  expect((await N("plant", "g1")).ripe).toBe(true);
  const [hx, hy] = await N("screenOfItem", "g1", 0.5);
  await page.mouse.click(hx, hy);
  await page.locator("#actions button", { hasText: "Thu hoạch" }).click();
  await expect.poll(async () => { await N("tick", 0.5); return (await N("basket")).cachua || 0; }, { timeout: 30_000 }).toBe(3);
  expect(await N("plant", "g1")).toBeNull();
  // Lưu qua tải lại trang
  await page.reload();
  await page.waitForFunction(() => window.__NHA3D__?.ready, null, { timeout: 90_000 });
  expect((await N("basket")).cachua).toBe(3);
  expect(errors).toEqual([]);
  expect(firebase).toEqual([]);
});
