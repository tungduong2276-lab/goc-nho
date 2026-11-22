import test from "node:test";
import assert from "node:assert/strict";
import * as SY from "../../nha3d/sync.mjs";

const T = Date.UTC(2026, 10, 16, 8);
const L = () => ({ items: [
  { uid: "a", type: "sofa", gx: 5, gz: 6, r: 0 },
  { uid: "g", type: "luongTrong", gx: 4, gz: 14, r: 0, plant: { sp: "dau", at: T, by: "anh", w: [[T, "anh"]] } }
] });

test("mã hoá và giải mã một món đồ giữ nguyên, kể cả cây và lần tưới", () => {
  const it = L().items[1], d = SY.encodeItem("san", it);
  assert.deepEqual(d.w, [{ t: T, by: "anh" }]);
  assert.ok(!Array.isArray(d.w[0]), "Firestore không nhận mảng lồng mảng");
  assert.deepEqual(SY.decodeItem(d), it);
  assert.equal(SY.decodeItem({ k: "item", uid: 3 }), null);
  const messy = SY.decodeItem({ ...d, w: [{ t: T + 2, by: "em" }, { t: T + 2, by: "em" }, { t: T - 9, by: "anh" }, { t: "x", by: "anh" }, { t: T + 1, by: "eve" }] });
  assert.deepEqual(messy.plant.w, [[T + 2, "em"]], "bỏ trùng, bỏ lần tưới trước khi gieo và dữ liệu lạ");
});

test("chỉ gửi món đã đổi; lần tưới không làm gửi lại cả món; gieo mới thì gửi kèm lần tưới", () => {
  const last = new Map(), layout = L();
  let d = SY.diffLayout(last, layout);
  assert.equal(d.upserts.length, 2); assert.ok(d.upserts.every(u => u.withWater));
  SY.remember(last, layout);
  assert.deepEqual(SY.diffLayout(last, layout), { upserts: [], removes: [] });
  layout.items[1].plant.w.push([T + 5, "em"]);
  assert.deepEqual(SY.diffLayout(last, layout), { upserts: [], removes: [] }, "tưới đi đường arrayUnion riêng");
  layout.items[0].gx = 7;
  d = SY.diffLayout(last, layout);
  assert.deepEqual(d.upserts.map(u => [u.it.uid, u.withWater]), [["a", false]]);
  SY.remember(last, layout);
  layout.items[1].plant = undefined;
  d = SY.diffLayout(last, layout);
  assert.deepEqual(d.upserts.map(u => [u.it.uid, u.withWater]), [["g", true]], "thu hoạch xoá luôn lần tưới cũ");
  SY.remember(last, layout);
  layout.items.splice(0, 1);
  assert.deepEqual(SY.diffLayout(last, layout).removes, ["a"]);
});

test("gộp thay đổi từ máy kia: thêm, sửa, xoá, bỏ qua cảnh khác", () => {
  const layout = L();
  const moved = SY.encodeItem("san", { ...layout.items[0], gx: 9 });
  const touched = SY.applyItemChanges(layout, "san", [
    { id: SY.itemId("san", "a"), data: moved },
    { id: SY.itemId("san", "new"), data: SY.encodeItem("san", { uid: "new", type: "chauTrong", gx: 1, gz: 1, r: 0 }) },
    { id: SY.itemId("san", "g"), data: null },
    { id: SY.itemId("nha", "a"), data: SY.encodeItem("nha", { uid: "a", type: "sofa", gx: 0, gz: 0, r: 0 }) }
  ]);
  assert.deepEqual(touched, ["a", "new", "g"]);
  assert.deepEqual(layout.items.map(i => [i.uid, i.gx]), [["a", 9], ["new", 1]]);
  assert.deepEqual(SY.applyItemChanges(layout, "san", [{ id: SY.itemId("san", "a"), data: moved }]), [], "không đổi thì không vẽ lại");
});

test("vị trí người kia: hợp lệ và còn mới; ghi tiết kiệm", () => {
  const p = { k: "presence", who: "em", scene: "san", x: 1, z: 2, at: 1000 };
  assert.equal(SY.readPresence(p, 1000 + 10e3).fresh, true);
  assert.equal(SY.readPresence(p, 1000 + SY.PRESENCE_STALE_MS + 1).fresh, false);
  assert.equal(SY.readPresence({ ...p, scene: "mars" }), null);
  const base = { scene: "san", x: 0, z: 0, mode: "idle", seat: null, ev: null, tx: null, tz: null, moving: true };
  assert.equal(SY.shouldSendPresence(null, base, 0), true);
  const prev = { ...base, sentAt: 0, moving: true };
  assert.equal(SY.shouldSendPresence(prev, { ...base, x: 0.5 }, 300), false, "đang đi: không ghi dày hơn 1,2 giây");
  assert.equal(SY.shouldSendPresence(prev, { ...base, x: 0.5 }, SY.PRESENCE_MOVE_MS), true);
  assert.equal(SY.shouldSendPresence(prev, { ...base, scene: "nha" }, 10), true, "đổi cảnh ghi ngay");
  assert.equal(SY.shouldSendPresence(prev, { ...base, ev: { id: "1", kind: "heart" } }, 10), true, "thả tim ghi ngay");
  assert.equal(SY.shouldSendPresence(prev, { ...base, tx: 3, tz: 4 }, 10), true, "chạm đi tới chỗ mới ghi ngay");
  const idle = { ...base, moving: false };
  assert.equal(SY.shouldSendPresence(prev, idle, 40), true, "dừng ngay cả khi hai vị trí giống nhau");
  assert.equal(SY.shouldSendPresence({ ...prev, moving: false }, idle, 5000), false);
  assert.equal(SY.shouldSendPresence({ ...prev, moving: false }, idle, SY.PRESENCE_HEARTBEAT_MS), true);
});

test("di chuyển liên tục không gửi vị trí mỗi khung hình", () => {
  let previous = null;
  const sentAt = [];
  for (let i = 0; i < 180; i++) {
    const t = i * 1000 / 60;
    const sample = { scene: "san", x: i * 0.03, z: 0, mode: "idle", seat: null, tx: null, tz: null, moving: true };
    if (SY.shouldSendPresence(previous, sample, t)) {
      sentAt.push(t);
      previous = { ...sample, sentAt: t };
    }
  }
  assert.deepEqual(sentAt, [0, 1200, 2400]);
  assert.equal(SY.shouldSendPresence(previous, { ...previous, moving: false }, 3000), true);
});
