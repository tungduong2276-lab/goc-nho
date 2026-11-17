// Bản thử Nhà 3D kiểu Play Together (nha3d/). Chạy trên Chromium không GPU (SwiftShader),
// nên dùng __NHA3D__.tick() để tua logic thay vì chờ theo tốc độ vẽ.
import { test, expect } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

test.describe.configure({ timeout: 120_000 });
const THREE_DIR = resolve("node_modules/three");

async function openHouse(page, { width = 390, height = 844, scene = "nha" } = {}) {
  await page.setViewportSize({ width, height });
  const errors = [], firebase = [];
  page.on("pageerror", e => errors.push(e.message));
  page.on("request", r => { if (/firestore\.googleapis|firebaseio|identitytoolkit|securetoken/.test(r.url())) firebase.push(r.url()); });
  // Không nạp SDK Firebase thật trong test: đảo chạy chế độ chỉ-trên-máy, W2 được thử bằng bộ nối giả.
  await page.route("https://www.gstatic.com/**", route => route.abort());
  if (existsSync(THREE_DIR)) {
    await page.route("https://cdn.jsdelivr.net/npm/three@0.169.0/**", route => {
      const rel = new URL(route.request().url()).pathname.replace("/npm/three@0.169.0/", "");
      route.fulfill({ contentType: "text/javascript", body: readFileSync(resolve(THREE_DIR, rel)) });
    });
  }
  await page.route("https://fonts.googleapis.com/**", route => route.abort());
  await page.route("https://fonts.gstatic.com/**", route => route.abort());
  await page.goto("/nha3d/index.html?scene=" + scene);
  await page.waitForFunction(() => window.__NHA3D__?.ready, null, { timeout: 90_000 });
  await page.evaluate(() => window.__NHA3D__.pauseAI(true));
  const N = (f, ...a) => page.evaluate(([f, a]) => window.__NHA3D__[f](...a), [f, a]);
  return { errors, firebase, N };
}

test("dựng nhà 3D trực tiếp, không lỗi và không gọi Firebase", async ({ page }) => {
  const { errors, firebase, N } = await openHouse(page);
  await expect(page.locator("#world")).toBeVisible();
  await expect(page.locator("#loading")).toHaveClass(/gone/);
  await expect(page.locator("#trial-pill")).toHaveText("Chỉ trên máy này");
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
  const { errors, firebase, N } = await openHouse(page, { scene: "san" });
  // đứng cạnh vườn ngoài sân
  const bed = (await N("layout")).items.find(i => i.uid === "y-g1");
  await N("teleport", -11 + (bed.gx + 1.5) * 0.5, -9 + (bed.gz + 3) * 0.5);
  await page.waitForTimeout(300);
  expect(await N("plant", "y-g1")).toBeNull();
  expect(await N("plantKey", "y-g1")).toBe("trong");
  // Chạm luống → menu gieo hạt
  const [x, y] = await N("screenOfItem", "y-g1", 0.5);
  await page.mouse.click(x, y);
  await expect(page.locator("#actions")).toBeVisible();
  await page.locator("#actions button", { hasText: "Gieo cà chua bi" }).click();
  await expect.poll(async () => { await N("tick", 0.5); return (await N("plant", "y-g1"))?.stage; }, { timeout: 30_000 }).toBe(0);
  expect((await N("plant", "y-g1")).wateredBy).toEqual(["anh"]);
  // Rủ người kia cùng tưới → cả hai cùng tưới
  await N("skipHours", 2);
  const [x2, y2] = await N("screenOfItem", "y-g1", 0.5);
  await page.mouse.click(x2, y2);
  await page.locator("#actions button", { hasText: "cùng tưới" }).click();
  await expect.poll(async () => { await N("tick", 0.5); return (await N("plant", "y-g1")).wateredBy.length; }, { timeout: 40_000 }).toBe(2);
  // Cây lớn và đổi hình theo thời gian
  await N("skipHours", 16);
  const grown = await N("plant", "y-g1");
  expect(grown.stage).toBeGreaterThanOrEqual(2);
  expect(await N("plantKey", "y-g1")).toBe(`cachua:${grown.stage}:am`);
  // Quên tưới hơn một ngày → khát, hình đổi
  await N("skipHours", 30);
  expect((await N("plant", "y-g1")).thirsty).toBe(true);
  expect(await N("plantKey", "y-g1")).toMatch(/:khat$/);
  // Tưới tiếp đến khi chín rồi thu hoạch
  for (let i = 0; i < 3 && !(await N("plant", "y-g1")).ripe; i++) {
    const [wx, wy] = await N("screenOfItem", "y-g1", 0.5);
    const before = (await N("layout")).items.find(i => i.uid === "y-g1").plant.w.length;
    await page.mouse.click(wx, wy);
    await page.locator("#actions button", { hasText: "Tưới nước" }).click();
    await expect.poll(async () => { await N("tick", 0.5); return (await N("layout")).items.find(i => i.uid === "y-g1").plant.w.length; }, { timeout: 30_000 }).toBe(before + 1);
    await N("skipHours", 20);
  }
  expect((await N("plant", "y-g1")).ripe).toBe(true);
  const [hx, hy] = await N("screenOfItem", "y-g1", 0.5);
  await page.mouse.click(hx, hy);
  await page.locator("#actions button", { hasText: "Thu hoạch" }).click();
  await expect.poll(async () => { await N("tick", 0.5); return (await N("basket")).cachua || 0; }, { timeout: 30_000 }).toBe(3);
  expect(await N("plant", "y-g1")).toBeNull();
  // Lưu qua tải lại trang
  await page.reload();
  await page.waitForFunction(() => window.__NHA3D__?.ready, null, { timeout: 90_000 });
  expect((await N("basket")).cachua).toBe(3);
  expect(errors).toEqual([]);
  expect(firebase).toEqual([]);
});

test("thế giới mở: đi ra vào cửa nhà, sân có vườn, quầy cà phê, xích đu", async ({ page }) => {
  const { errors, firebase, N } = await openHouse(page, { scene: "san" });
  expect(await N("scene")).toBe("san");
  const yard = (await N("layout")).items.map(i => i.type);
  for (const t of ["nhaNgoai", "luongTrong", "quayCafe", "xichDu", "hopThu", "benThuyen"]) expect(yard).toContain(t);
  await expect(page.locator(".doortag")).toHaveText("🏠 Vào nhà");
  await expect(page.locator("#btn-edit")).toBeHidden();
  // Đi thẳng vào cửa bằng phím (cùng đường xử lý với cần điều khiển)
  await page.keyboard.down("w"); await page.keyboard.down("d");
  await expect.poll(async () => { await N("tick", 0.2); return N("scene"); }, { timeout: 40_000 }).toBe("nha");
  await page.keyboard.up("w"); await page.keyboard.up("d");
  await page.evaluate(() => window.__NHA3D__.settle());
  await expect(page.locator(".doortag")).toHaveText("🚪 Ra sân");
  await expect(page.locator("#btn-edit")).toBeVisible();
  expect((await N("layout")).items.some(i => i.type === "sofa")).toBe(true);
  // Đi ra bằng thảm cửa
  await page.keyboard.down("s"); await page.keyboard.down("a");
  await expect.poll(async () => { await N("tick", 0.2); return N("scene"); }, { timeout: 40_000 }).toBe("san");
  await page.keyboard.up("s"); await page.keyboard.up("a");
  await page.evaluate(() => window.__NHA3D__.settle());
  // Chạm vào nhà → "Vào nhà"
  const [hx, hy] = await N("screenOfItem", "y-nha", 0.5);
  await page.mouse.click(hx, hy);
  await page.locator("#actions button", { hasText: "Vào nhà" }).click();
  await expect.poll(async () => { await N("tick", 0.2); return N("scene"); }, { timeout: 40_000 }).toBe("nha");
  await page.evaluate(() => window.__NHA3D__.settle());
  // Nhãn cửa cũng đưa ra sân
  await page.locator(".doortag").click();
  await expect.poll(async () => { await N("tick", 0.2); return N("scene"); }, { timeout: 40_000 }).toBe("san");
  // Lưu cảnh đang đứng qua lần mở sau
  await page.evaluate(() => window.__NHA3D__.settle());
  await page.goto("/nha3d/index.html");
  await page.waitForFunction(() => window.__NHA3D__?.ready, null, { timeout: 90_000 });
  expect(await N("scene")).toBe("san");
  expect(errors).toEqual([]);
  expect(firebase).toEqual([]);
});

test("W2: đảo chung — gửi thay đổi, nhận người kia và đồ đạc từ máy kia (bộ nối giả, không Firebase)", async ({ page }) => {
  const { errors, firebase, N } = await openHouse(page, { scene: "san" });
  await page.evaluate(() => {
    window.__writes = [];
    const rec = kind => (...a) => { window.__writes.push([kind, ...a.map(x => JSON.parse(JSON.stringify(x ?? null)))]); return Promise.resolve(); };
    window.__NHA3D__.useFakeCloud({ ok: true, setItem: rec("item"), delItem: rec("del"), addWater: rec("water"), setMeta: rec("meta"), setPresence: rec("presence") });
  });
  const writes = () => page.evaluate(() => window.__writes);
  // Người kia chưa vào: không hiện, nhãn trạng thái báo vắng
  await N("tick", 0.2);
  expect((await N("cloud")).partnerVisible).toBe(false);
  // Vị trí của mình được gửi đi, có cảnh và trang phục
  await expect.poll(async () => (await writes()).filter(w => w[0] === "presence").length).toBeGreaterThan(0);
  const pres = (await writes()).find(w => w[0] === "presence");
  expect(pres[1]).toBe("anh"); expect(pres[2]).toMatchObject({ scene: "san", mode: "idle" }); expect(pres[2].look).toBeTruthy();
  // Gieo hạt: gửi cả món kèm lần tưới; tưới lại: chỉ gửi lần tưới (arrayUnion)
  const bed = (await N("layout")).items.find(i => i.uid === "y-g1");
  await N("teleport", -11 + (bed.gx + 1.5) * 0.5, -9 + (bed.gz + 3) * 0.5); await page.waitForTimeout(300);
  let [x, y] = await N("screenOfItem", "y-g1", 0.5);
  await page.mouse.click(x, y);
  await page.locator("#actions button", { hasText: "Gieo xà lách" }).click();
  await expect.poll(async () => { await N("tick", 0.3); return (await writes()).filter(w => w[0] === "item" && w[2].uid === "y-g1").length; }, { timeout: 30_000 }).toBe(1);
  const seeded = (await writes()).find(w => w[0] === "item" && w[2].uid === "y-g1");
  expect(seeded[1]).toBe("san"); expect(seeded[2].plant.sp).toBe("xalach"); expect(seeded[3]).toBe(true);
  [x, y] = await N("screenOfItem", "y-g1", 0.5);
  await page.mouse.click(x, y);
  await page.locator("#actions button", { hasText: "Tưới nước" }).click();
  await expect.poll(async () => { await N("tick", 0.3); return (await writes()).filter(w => w[0] === "water").length; }, { timeout: 30_000 }).toBe(1);
  expect((await writes()).filter(w => w[0] === "item" && w[2].uid === "y-g1").length).toBe(1);
  // Máy kia: Em đứng ngoài sân, thả tim, đổi trang phục
  const me = await N("me");
  await N("remoteChanges", [{ id: "p_em", data: { k: "presence", who: "em", scene: "san", x: me.x + 1.2, z: me.z, face: 0, mode: "idle", at: Date.now(), ev: { id: "e1", kind: "invite", text: "rủ bạn cùng tưới" }, look: null } }]);
  await N("tick", 0.2);
  await expect.poll(async () => (await N("cloud")).partnerVisible).toBe(true);
  await expect(page.locator("#toast")).toContainText("Em rủ bạn cùng tưới");
  await expect(page.locator("#partner-status")).toHaveText("Em đang ở đây 💗");
  // Em đi chỗ khác: nhân vật đi theo
  await N("remoteChanges", [{ id: "p_em", data: { k: "presence", who: "em", scene: "san", x: me.x + 1.2, z: me.z, tx: me.x + 1.2, tz: me.z + 2, face: 0, mode: "idle", at: Date.now() } }]);
  await N("tick", 2);
  expect((await N("partner")).z).toBeGreaterThan(me.z + 1.5);
  // Em vào nhà: ngoài sân không còn thấy, nhãn báo Em ở trong nhà
  await N("remoteChanges", [{ id: "p_em", data: { k: "presence", who: "em", scene: "nha", x: 0, z: 2, face: 0, mode: "idle", at: Date.now() } }]);
  await N("tick", 0.2);
  expect((await N("cloud")).partnerVisible).toBe(false);
  await expect(page.locator("#partner-status")).toHaveText("Em đang ở trong nhà");
  // Em gieo dâu ở luống khác và dời ghế dài: máy này thấy ngay
  await N("remoteChanges", [
    { id: "i_san_y-g2", data: { k: "item", scene: "san", uid: "y-g2", it: { type: "luongTrong", gx: 9, gz: 14, r: 0 }, plant: { sp: "dau", at: Date.now() - 1000, by: "em" }, w: [{ t: Date.now() - 1000, by: "em" }] } },
    { id: "i_san_y-b1", data: { k: "item", scene: "san", uid: "y-b1", it: { type: "gheDa", gx: 30, gz: 21, r: 0 } } },
    { id: "i_san_y-f1", data: null }
  ]);
  expect(await N("plantKey", "y-g2")).toBe("dau:0:am");
  const yard = (await N("layout")).items;
  expect(yard.find(i => i.uid === "y-b1").gx).toBe(30);
  expect(yard.some(i => i.uid === "y-f1")).toBe(false);
  // Đồ nhận từ máy kia không bị gửi ngược lại
  const before = (await writes()).filter(w => w[0] === "item" || w[0] === "del").length;
  await N("tick", 0.5);
  expect((await writes()).filter(w => w[0] === "item" || w[0] === "del").length).toBe(before);
  expect(errors).toEqual([]);
  expect(firebase).toEqual([]);
});

// ---------- W3 đợt 1: hộp thư, tủ lạnh, hũ hẹn hò dùng dữ liệu thật của app ----------
const APP_SEED = {
  museum: { m1: { id: "m1", name: "Vé xem phim đầu tiên", note: "Một tối nhiều kỷ niệm", date: "2026-11-01" } },
  dict: { word1: { id: "word1", w: "Mây nhỏ", m: "Tên gọi riêng của hai đứa", date: "2026-11-01" } },
  places: { p1: { id: "p1", nick: "Góc trú mưa", real: "Quán nhỏ", date: "2026-11-01" } },
  kingdom: { k1: { id: "k1", by: 1, kind: "name", value: "Đảo Mây", status: "ok", date: "2026-11-01", decidedAt: "2026-11-01" }, k2: { id: "k2", by: 1, kind: "law", value: "Cùng chăm vườn", status: "pending", date: "2026-11-02" } },
  realm: {},
  gifts: { gift1: { id: "gift1", from: 1, to: 0, key: "2099-01-01", label: "Quà thử nghiệm", note: "SEALED_PAYLOAD_DO_NOT_PREVIEW", photos: [], date: "2026-11-01", opened: false } },
  wishes: { w1: { id: "w1", title: "Cùng đi ngắm biển", kind: "go", by: 1, done: false, date: "2026-11-15T08:00:00.000Z" } },
  drawings: { dr1: { id: "dr1", theme: "Chú mèo", topBy: 1, top: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j5WQAAAAASUVORK5CYII=", done: false, date: "2026-11-15T08:00:00.000Z" } },
  story: { s1: { id: "s1", title: "Đảo nhỏ của hai đứa", by: 1, done: false, lines: [{ by: 1, text: "Có một ngôi nhà nhỏ.", date: "2026-11-15T08:00:00.000Z" }], date: "2026-11-15T08:00:00.000Z" } },
  rules: { r1: { id: "r1", rule: "Nhớ ăn sáng", penalty: "Pha trà", date: "2026-11-15T08:00:00.000Z" } },
  meta: { names: ["Anh", "Em"], swaps: {}, extraSwaps: {}, pending: { id: "p1", n: 3 }, custom: [], startDate: "", bday: ["", ""] },
  letters: {
    l1: { id: "l1", from: 1, to: 0, body: "Thư thử nghiệm từ Em", unlockSeason: null, unlockDate: "2020-01-01", date: "2026-01-01T00:00:00.000Z" },
    l2: { id: "l2", from: 1, to: 0, body: "Chưa được đọc", unlockSeason: null, unlockDate: "2099-01-01", date: "2026-01-02T00:00:00.000Z" }
  },
  fridge: { f1: { id: "f1", by: 1, text: "Nhớ ăn sáng nha", color: 1, sticker: null, voice: null, dur: 0, date: "2026-11-15T08:00:00.000Z", hearts: [true, false], replies: [] } },
  history: {}
};
const seedApp = page => page.addInitScript(seed => {
  if (sessionStorage.getItem("seeded")) return; sessionStorage.setItem("seeded", "1");
  localStorage.setItem("hu-hen-ho-me", "0"); localStorage.setItem("hu-hen-ho-v2", JSON.stringify(seed));
}, APP_SEED);

for (const width of [360, 390, 430]) test(`W3c: memory portals and the gift tree use original screens at ${width}px`, async ({ page }) => {
  test.setTimeout(180_000);
  await seedApp(page);
  const { errors, firebase, N } = await openHouse(page, { width });
  const original = await page.evaluate(() => localStorage.getItem("hu-hen-ho-v2"));
  expect((await N("appState")).memory).toMatchObject({ museum: 1, words: 1, places: 1, kingdom: { name: "Đảo Mây", pending: 1 } });
  const open = async (uid, label) => {
    await N("nearItem", uid); await N("tick", 2);
    let pt = null;
    for (const f of [0.1, 0.5, 0.35, 0.65, 0.2, 0.8]) {
      const [px, py] = await N("screenOfItem", uid, f);
      for (const dx of [0, -6, 6]) if (!pt && await N("pickAt", px + dx, py) === uid) pt = [px + dx, py];
    }
    expect(pt, uid).not.toBeNull(); await page.mouse.click(...pt);
    await page.getByRole("button", { name: label, exact: true }).click(); await N("tick", 15);
    await expect(page.locator("#appsheet")).toBeVisible();
    const box = await page.locator("#appsheet-close").boundingBox(); expect(box.x).toBeGreaterThanOrEqual(0); expect(box.x + box.width).toBeLessThanOrEqual(width);
  };
  for (const [uid, label, selector, text] of [
    ["e1", "Bảo tàng (1 hiện vật)", "#tab-museum", "Vé xem phim đầu tiên"],
    ["d2", "Từ điển riêng (1 từ)", "#tab-dict", "Mây nhỏ"],
    ["w5", "Bản đồ (1 địa điểm)", "#tab-places", "Góc trú mưa"]
  ]) { await open(uid, label); await expect(page.frameLocator("#appsheet-frame").locator(selector)).toContainText(text); await page.locator("#appsheet-close").click(); }
  await N("goScene", "san"); await N("settle");
  await open("y-d1", "Ghé Vương quốc (1 đề xuất chờ bạn)");
  await expect(page.frameLocator("#appsheet-frame").locator("#tab-kingdom")).toContainText("Đảo Mây");
  await page.locator("#appsheet-close").click();
  for (let i = 0; i < (width === 390 ? 2 : 1); i++) {
    await open("y-t4", "Xem và gói quà cho nhau");
    const frame = page.frameLocator("#appsheet-frame");
    await expect(frame.locator("#gifts")).toBeVisible();
    await expect(frame.locator("#world-gifts-focus")).toHaveCount(1);
    await expect(frame.locator("a.w3d-card")).toBeHidden();
    await expect(frame.locator("#gifts")).toContainText("Quà thử nghiệm");
    await expect(frame.locator("body")).not.toContainText("SEALED_PAYLOAD_DO_NOT_PREVIEW");
    await expect(frame.locator('[data-gopen="gift1"]')).toHaveCount(0);
    await page.locator("#appsheet-close").click();
  }
  expect(await page.evaluate(() => localStorage.getItem("hu-hen-ho-v2"))).toBe(original);
  expect(JSON.stringify(await N("appState"))).not.toContain("SEALED_PAYLOAD_DO_NOT_PREVIEW");
  await N("goScene", "nha"); await N("settle");
  await page.evaluate(() => { const s = JSON.parse(localStorage.getItem("hu-hen-ho-v2")); s.museum = {}; s.dict = {}; s.places = {}; s.kingdom = {}; localStorage.setItem("hu-hen-ho-v2", JSON.stringify(s)); window.dispatchEvent(new StorageEvent("storage", { key: "hu-hen-ho-v2" })); });
  expect(await N("viewKey", "e1")).toBe("undefined|museum0");
  expect(await N("viewKey", "d2")).toBe("0|words0");
  expect(await N("viewKey", "w5")).toBe("undefined|places0");
  expect(firebase).toEqual([]); expect(errors).toEqual([]);
});

for (const width of [360, 390, 430]) test(`W3b: four creative objects open existing app screens at ${width}px`, async ({ page }) => {
  await seedApp(page);
  const { errors, firebase, N } = await openHouse(page, { width });
  expect((await N("appState")).drawing.mode).toBe("bottom");
  expect((await N("appState")).story.myTurn).toBe(true);
  expect(await N("viewKey", "d1")).toBe("ve|dbottom");
  expect(await N("viewKey", "d5")).toBe("giay|strue");
  expect(await N("viewKey", "w4")).toBe("true|r1");
  const original = await page.evaluate(() => localStorage.getItem("hu-hen-ho-v2"));
  for (const [uid, label, tab, selector, text] of [
    ["d6", "Xem ước mơ (1 mới)", "uoc-mo", "#tab-wishes", "Cùng đi ngắm biển"],
    ["d1", "Đến lượt bạn vẽ nửa dưới", "ve", "#draw-state", "Chú mèo"],
    ["d5", "Đến lượt bạn viết tiếp", "truyen", "#tab-story", "Đảo nhỏ của hai đứa"],
    ["w4", "Bộ luật của hai đứa (1)", "bo-luat", "#tab-rules", "Nhớ ăn sáng"]
  ]) {
    await N("nearItem", uid); await N("tick", 2);
    let pt = null;
    for (const f of [0.5, 0.35, 0.65, 0.2, 0.8]) {
      const [px, py] = await N("screenOfItem", uid, f);
      for (const dx of [0, -6, 6]) if (!pt && await N("pickAt", px + dx, py) === uid) pt = [px + dx, py];
    }
    expect(pt, uid).not.toBeNull();
    await page.mouse.click(...pt);
    await page.getByRole("button", { name: label, exact: true }).click();
    await N("tick", 12);
    await expect(page.locator("#appsheet")).toBeVisible();
    await expect(page.locator("#appsheet-frame")).toHaveAttribute("src", new RegExp(`#${tab}$`));
    await expect(page.frameLocator("#appsheet-frame").locator(selector)).toContainText(text);
    const box = await page.locator("#appsheet-close").boundingBox();
    expect(box.x).toBeGreaterThanOrEqual(0); expect(box.x + box.width).toBeLessThanOrEqual(width);
    await page.locator("#appsheet-close").click();
    await expect(page.locator("#appsheet")).toBeHidden();
  }
  // Reading screens must not fork or overwrite the original app collections.
  expect(await page.evaluate(() => localStorage.getItem("hu-hen-ho-v2"))).toBe(original);
  // A change made by the original app is reflected on returning to the world.
  await page.evaluate(() => { const s = JSON.parse(localStorage.getItem("hu-hen-ho-v2")); s.wishes.w1.done = true; s.drawings.dr1.done = true; s.story.s1.done = true; s.rules = {}; localStorage.setItem("hu-hen-ho-v2", JSON.stringify(s)); window.dispatchEvent(new StorageEvent("storage", { key: "hu-hen-ho-v2" })); });
  expect(await N("viewKey", "d6")).toBe("empty|w0");
  expect(await N("viewKey", "d1")).toBe("xong|dstart");
  expect(await N("viewKey", "d5")).toBe("|sfalse");
  expect(await N("viewKey", "w4")).toBe("false|r0");
  expect(firebase).toEqual([]); expect(errors).toEqual([]);
});

test("W3: hộp thư báo thư mới, mở thư bằng màn hình gốc của app ngay trên đảo", async ({ page }) => {
  await seedApp(page);
  const { errors, firebase, N } = await openHouse(page, { scene: "san" });
  const st = await N("appState");
  expect(st.mail).toEqual({ unread: 1, sealed: 1, total: 2 });
  expect(st.jar.pending).toBe(true);
  expect(await N("appDeco", "y-m1")).toBe(1);
  await N("nearItem", "y-m1"); await N("tick", 2);
  // Hộp thư đứng sát nhà: tìm điểm trên màn hình mà phép chạm thật trúng hộp thư.
  let pt = null;
  for (const f of [0.5, 0.35, 0.65, 0.2, 0.8]) { const [px, py] = await N("screenOfItem", "y-m1", f); for (const dx of [0, -6, 6]) if (!pt && await N("pickAt", px + dx, py) === "y-m1") pt = [px + dx, py]; }
  expect(pt).not.toBeNull();
  await page.mouse.click(...pt);
  await page.locator("#actions button", { hasText: "Mở hộp thư (1 thư mới)" }).click();
  await N("tick", 12);
  // Phong bì bay ra: một thư mới, một thư còn niêm phong.
  expect((await N("partsOf", "y-m1")).map(p => p.id).sort()).toEqual(["l1", "l2"]);
  await N("snapCam");
  const [ex, ey] = await N("screenOfPart", "y-m1", "l1");
  expect(await N("pickPart", ex, ey)).toEqual({ kind: "letter", id: "l1" });
  await page.mouse.click(ex, ey);
  await page.locator("#actions button", { hasText: "Bóc thư" }).click();
  await N("tick", 12);
  await expect(page.locator("#appsheet")).toBeVisible();
  const frame = page.frameLocator("#appsheet-frame");
  await expect(frame.locator("html.embed")).toHaveCount(1);
  await expect(frame.locator("#tab-letters")).toContainText("Thư thử nghiệm từ Em");
  await expect(frame.locator("#app > header")).toBeHidden();
  await page.locator("#appsheet-close").click();
  await expect(page.locator("#appsheet")).toBeHidden();
  // App gốc đã đánh dấu thư đã đọc → cờ hạ, phong bì biến mất.
  await expect.poll(() => N("appState").then(s => s.mail.unread)).toBe(0);
  expect(await N("appDeco", "y-m1")).toBe(0);
  expect(firebase).toEqual([]);
  expect(errors).toEqual([]);
});

test("W3: tủ lạnh dán đúng giấy nhắn thật, hũ có lá đang chờ mở màn bốc thăm của app", async ({ page }) => {
  await seedApp(page);
  const { errors, N } = await openHouse(page, { scene: "nha" });
  const st = await N("appState");
  expect(st.fridge.count).toBe(1);
  expect(st.fridge.fresh).toBe(1);
  expect(st.fridge.shown[0]).toMatchObject({ id: "f1", color: 0xD8F1DF, heart: true });
  expect(await N("viewKey", "c1")).toBe("trong|ff1hn");
  expect(await N("appDeco", "c4")).toBe(1);
  await N("nearItem", "c1"); await N("tick", 2);
  // Chạm thẳng vào mẩu giấy trên cửa: đọc được chữ ngay trong cảnh.
  await N("snapCam");
  const [x, y] = await N("screenOfPart", "c1", "f1");
  expect(await N("pickPart", x, y)).toEqual({ kind: "note", id: "f1" });
  await page.mouse.click(x, y);
  await expect(page.locator("#actions .card-body")).toHaveText("Nhớ ăn sáng nha");
  await page.locator("#actions button", { hasText: "Đáp lại" }).click();
  await N("tick", 12);
  const frame = page.frameLocator("#appsheet-frame");
  await expect(frame.locator("#tab-fridge")).toContainText("Nhớ ăn sáng nha");
  await page.locator("#appsheet-close").click();
  await N("nearItem", "c4"); await N("tick", 2);
  const [jx, jy] = await N("screenOfItem", "c4", 0.6);
  expect(await N("pickAt", jx, jy)).toBe("c4");
  await page.mouse.click(jx, jy);
  await page.locator("#actions button", { hasText: "Đọc lá đang chờ" }).click();
  await N("tick", 12);
  await expect(page.locator("#appsheet-title")).toHaveText("Hũ hẹn hò");
  await expect(frame.locator("#playBtn")).toBeVisible();
  expect(errors).toEqual([]);
});

