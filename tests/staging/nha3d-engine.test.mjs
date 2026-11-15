// Bản thử nhà 3D (nha3d/): lõi logic thuần, không mạng, không Firebase.
import test from "node:test";
import assert from "node:assert/strict";
import { CATALOG, ROOM, DEFAULT_LAYOUT, CELL } from "../../nha3d/catalog.mjs";
import {
  validatePlacement, blockGrid, findPath, worldPath, circleBlocked, slideMove, seatsOf, approachPoint,
  sanitizeLayout, deserialize, serialize, findSpot, History, rotLocal, itemPose, footprint, clearLine, cellFree, worldToCell, clone
} from "../../nha3d/engine.mjs";

// Hộp bao thật (m) đo từ mô hình _xuong-3d bằng three.js r169, ngày 2026-11-08 (trước khi scale/off).
const MEASURED = {
  sofa: [2.30, 1.00], banTra: [1.10, 1.10], banAn: [2.16, 0.80], dem: [0.64, 0.64], banLamViec: [1.35, 1.13],
  giuong: [1.24, 2.07], tuDo: [1.10, 0.66], banTrangDiem: [1.00, 1.00], ruong: [1.02, 0.65], keSach: [1.30, 0.42],
  tuLanh: [0.90, 0.80], bepNau: [1.02, 0.75], huHenHo: [0.42, 0.42], giaVe: [0.98, 0.74], mayDanhChu: [1.00, 0.60],
  hopMau: [0.80, 0.50], radio: [0.50, 0.24], tuKinh: [1.20, 0.46], denCay: [0.50, 0.50], trauBa: [0.90, 0.60],
  chauLuoiHo: [1.02, 0.44], keCay: [1.30, 0.36], oMeo: [0.94, 0.94], thamTron: [2.0, 2.0], thamVuong: [2.0, 1.4],
  thamLon: [2.90, 2.90], cuaSo: [1.54, 0.25], khungAnh: [0.86, 0.09], bangGhim: [1.10, 0.14], lich: [0.72, 0.09], banDo: [1.30, 0.08]
};

test("mọi món trong danh mục có số đo, và mô hình (sau scale) vừa dấu chân ô lưới (sai ≤ 5 cm)", () => {
  for (const [id, def] of Object.entries(CATALOG)) {
    assert.ok(MEASURED[id], "thiếu số đo cho " + id);
    const sc = def.scale ?? 1, [mw, md] = MEASURED[id];
    assert.ok(mw * sc <= def.w * CELL + 0.05, `${id}: rộng ${mw * sc} > ${def.w * CELL}`);
    if (def.kind !== "wall") assert.ok(md * sc <= def.d * CELL + 0.05, `${id}: sâu ${md * sc} > ${def.d * CELL}`);
  }
});

test("bố cục mặc định hợp lệ hết, không chồng nhau", () => {
  const { layout, dropped } = sanitizeLayout(clone(DEFAULT_LAYOUT));
  assert.deepEqual(dropped, []);
  assert.equal(layout.items.length, DEFAULT_LAYOUT.items.length);
});

test("chặn đặt ra ngoài phòng, chồng đồ, sai góc xoay; thảm được nằm dưới đồ", () => {
  const L = { items: [{ uid: "s", type: "sofa", gx: 2, gz: 2, r: 0 }] };
  assert.equal(validatePlacement(L, { uid: "x", type: "sofa", gx: 12, gz: 0, r: 0 }).ok, false);
  assert.equal(validatePlacement(L, { uid: "x", type: "sofa", gx: -1, gz: 0, r: 0 }).ok, false);
  const hit = validatePlacement(L, { uid: "x", type: "banTra", gx: 6, gz: 3, r: 0 });
  assert.equal(hit.ok, false); assert.equal(hit.with, "s");
  assert.equal(validatePlacement(L, { uid: "x", type: "banTra", gx: 7, gz: 3, r: 0 }).ok, true);
  assert.equal(validatePlacement(L, { uid: "x", type: "sofa", gx: 0, gz: 6, r: 5 }).ok, false);
  assert.equal(validatePlacement(L, { uid: "x", type: "thamTron", gx: 2, gz: 1, r: 0 }).ok, true);
  // sofa xoay 90°: 2 × 5 ô
  assert.equal(validatePlacement({ items: [] }, { uid: "x", type: "sofa", gx: 14, gz: 0, r: 1 }).ok, true);
  assert.equal(validatePlacement({ items: [] }, { uid: "x", type: "sofa", gx: 15, gz: 0, r: 1 }).ok, false);
});

test("đồ treo tường: chỉ trên tường L/R, không chồng nhau, không vượt tường", () => {
  const L = { items: [{ uid: "w", type: "cuaSo", wall: "R", at: 4, r: 0 }] };
  assert.equal(validatePlacement(L, { uid: "x", type: "lich", wall: "R", at: 6, r: 0 }).ok, false);
  assert.equal(validatePlacement(L, { uid: "x", type: "lich", wall: "R", at: 7, r: 0 }).ok, true);
  assert.equal(validatePlacement(L, { uid: "x", type: "lich", wall: "L", at: 5, r: 0 }).ok, true);
  assert.equal(validatePlacement(L, { uid: "x", type: "lich", wall: "R", at: ROOM.w - 1, r: 0 }).ok, false);
  assert.equal(validatePlacement(L, { uid: "x", type: "lich", wall: "S", at: 0, r: 0 }).ok, false);
});

test("xoay vector cục bộ khớp three.js rotation.y", () => {
  const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, a + " ≠ " + b);
  const v = rotLocal(0, 1, 1); near(v.x, 1); near(v.z, 0);   // +z → +x khi xoay +90°
  const w = rotLocal(1, 0, 1); near(w.x, 0); near(w.z, -1);
  const u = rotLocal(1, 2, 4); near(u.x, 1); near(u.z, 2);
});

test("tìm đường vòng qua sofa, không cắt góc, và báo null khi bị nhốt", () => {
  const L = { items: [{ uid: "s", type: "sofa", gx: 4, gz: 4, r: 0 }] };
  const G = blockGrid(L);
  const p = findPath(G, { i: 6, j: 2 }, { i: 6, j: 8 });
  assert.ok(p && p.length > 6);
  for (const c of p) assert.ok(cellFree(G, c.i, c.j));
  for (let k = 1; k < p.length; k++) {
    const a = p[k - 1], b = p[k];
    if (a.i !== b.i && a.j !== b.j) assert.ok(cellFree(G, b.i, a.j) && cellFree(G, a.i, b.j), "cắt góc");
  }
  // nhốt ô (0,0) bằng hai kệ
  const box = { items: [{ uid: "a", type: "keSach", gx: 1, gz: 0, r: 1 }, { uid: "b", type: "keSach", gx: 0, gz: 1, r: 0 }] };
  assert.equal(findPath(blockGrid(box), { i: 0, j: 0 }, { i: 8, j: 8 }), null);
});

test("đường đi thế giới rút gọn nhưng không xuyên vật cản", () => {
  const { layout } = sanitizeLayout(clone(DEFAULT_LAYOUT));
  const G = blockGrid(layout);
  const path = worldPath(G, 0.25, 2.5, 3.25, -2.25);
  assert.ok(path && path.length >= 2);
  for (let k = 1; k < path.length; k++) assert.ok(clearLine(G, path[k - 1], path[k]), "đoạn " + k + " xuyên đồ");
});

test("cần điều khiển: trượt dọc vật cản, không đi xuyên tường hay đồ", () => {
  const L = { items: [{ uid: "s", type: "sofa", gx: 4, gz: 4, r: 0 }] };
  const G = blockGrid(L);
  const p = itemPose(L.items[0]);
  // đứng ngay trên sofa (phía -z), đẩy chéo xuống-phải: phải trượt theo x, không vào sofa
  const z0 = p.z - 0.5 - 0.21;
  const m = slideMove(G, p.x, z0, 0.1, 0.1);
  assert.ok(!circleBlocked(G, m.x, m.z)); assert.ok(m.x > p.x);
  // tường trái
  const W = ROOM.w * CELL;
  const w = slideMove(G, -W / 2 + 0.21, 0, -0.2, 0);
  assert.ok(w.x >= -W / 2 + 0.2);
});

test("ghế và điểm tiếp cận xoay theo đồ và luôn đi tới được", () => {
  for (const r of [0, 1, 2, 3]) {
    const L = { items: [{ uid: "s", type: "banAn", gx: 6, gz: 6, r }] };
    const G = blockGrid(L);
    const seats = seatsOf(L.items[0]);
    assert.equal(seats.length, 2);
    for (const s of seats) {
      const fp = footprint(L.items[0]).map(([i, j]) => i + "," + j);
      const c = worldToCell(s.x, s.z); assert.ok(fp.includes(c.i + "," + c.j), "ghế nằm ngoài dấu chân");
      const ap = approachPoint(G, L.items[0], s);
      assert.ok(ap && !circleBlocked(G, ap.x, ap.z), "điểm tiếp cận bị chặn r=" + r);
      assert.ok(worldPath(G, 0.25, 3.25, ap.x, ap.z), "không có đường tới ghế r=" + r);
    }
  }
});

test("nạp bố cục hỏng/lạ: bỏ món sai, giữ món đúng, không bao giờ ném lỗi", () => {
  assert.equal(deserialize("{oops").layout.items.length, DEFAULT_LAYOUT.items.length);
  const raw = { v: 1, wall: "hong", floor: "khongco", items: [
    { uid: "1", type: "sofa", gx: 0, gz: 0, r: 0 },
    { uid: "1", type: "sofa", gx: 0, gz: 4, r: 0 },          // trùng uid
    { uid: "2", type: "rongbay", gx: 0, gz: 0, r: 0 },       // không có trong danh mục
    { uid: "3", type: "banTra", gx: 1, gz: 0, r: 0 },        // chồng sofa
    { uid: "4", type: "tuLanh", gx: 10, gz: 10, r: 0, state: "mo" },
    { uid: "5", type: "tuLanh", gx: 12, gz: 10, r: 0, state: "<script>" }
  ] };
  const { layout, dropped } = deserialize(serialize(raw));
  assert.deepEqual(layout.items.map(i => i.uid), ["1", "4", "5"]);
  assert.equal(layout.wall, "hong"); assert.equal(layout.floor, "go");
  assert.equal(layout.items[1].state, "mo"); assert.equal(layout.items[2].state, undefined);
  assert.equal(dropped.length, 3);
});

test("tìm chỗ trống cho món mới và hoàn tác", () => {
  const { layout } = sanitizeLayout(clone(DEFAULT_LAYOUT));
  for (const id of Object.keys(CATALOG)) {
    const spot = findSpot(layout, id);
    if (spot) assert.ok(validatePlacement(layout, spot).ok, id);
  }
  const h = new History(2);
  h.push({ v: 1, items: [1] }); h.push({ v: 1, items: [2] }); h.push({ v: 1, items: [3] });
  assert.deepEqual(h.undo().items, [3]); assert.deepEqual(h.undo().items, [2]); assert.equal(h.undo(), null);
});
