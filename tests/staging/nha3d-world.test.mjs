import test from "node:test";
import assert from "node:assert/strict";
import * as E from "../../nha3d/engine.mjs";
import * as WD from "../../nha3d/world.mjs";
import { ROOM, DEFAULT_LAYOUT } from "../../nha3d/catalog.mjs";

test("sân mặc định hợp lệ, nhà chặn đường, cửa trước đi tới được từ bến thuyền", () => {
  const { layout, dropped } = E.sanitizeLayout(E.clone(WD.DEFAULT_YARD), WD.YARD);
  assert.deepEqual(dropped, []);
  const G = E.blockGrid(layout, WD.YARD);
  const house = E.worldToCell(0, -6, WD.YARD);
  assert.equal(E.cellFree(G, house.i, house.j), false, "giữa nhà phải bị chặn");
  const dock = layout.items.find(i => i.type === "benThuyen"), p = E.itemPose(dock, WD.YARD);
  const path = E.worldPath(G, p.x, p.z, WD.DOOR_OUT.x, WD.DOOR_OUT.z, WD.YARD);
  assert.ok(path && path.length > 2, "phải có đường từ bến tới cửa");
  const sp = E.worldToCell(WD.SPAWN_OUT.x, WD.SPAWN_OUT.z, WD.YARD);
  assert.equal(E.cellFree(G, sp.i, sp.j), true);
});

test("trong nhà: thảm cửa là ô dành riêng, không đặt đồ đặc lên được nhưng bố cục cũ vẫn nạp", () => {
  const L = E.clone(DEFAULT_LAYOUT);
  assert.equal(E.validatePlacement(L, { uid: "x", type: "banTra", gx: 7, gz: 12, r: 0 }, ROOM).ok, false);
  assert.equal(E.validatePlacement(L, { uid: "x", type: "thamVuong", gx: 6, gz: 11, r: 0 }, ROOM).ok, true, "thảm vẫn trải qua được");
  const legacy = E.clone(DEFAULT_LAYOUT); legacy.items.push({ uid: "old", type: "banTra", gx: 7, gz: 12, r: 0 });
  assert.ok(E.sanitizeLayout(legacy, ROOM).layout.items.some(i => i.uid === "old"));
  const G = E.blockGrid(E.sanitizeLayout(E.clone(DEFAULT_LAYOUT), ROOM).layout, ROOM);
  const sp = E.worldToCell(WD.SPAWN_IN.x, WD.SPAWN_IN.z, ROOM);
  assert.equal(E.cellFree(G, sp.i, sp.j), true);
});

test("bước qua cửa chỉ khi đứng ở khung cửa và đi vào trong", () => {
  const o = WD.DOOR_OUT, i = WD.DOOR_IN;
  assert.equal(WD.crossesDoor("san", o.x, o.z, 0, -1), true);
  assert.equal(WD.crossesDoor("san", o.x, o.z, 0, 1), false, "quay lưng lại cửa thì không vào");
  assert.equal(WD.crossesDoor("san", o.x + 1.5, o.z, 0, -1), false, "lệch khỏi khung cửa");
  assert.equal(WD.crossesDoor("san", WD.SPAWN_OUT.x, WD.SPAWN_OUT.z, 0, -1), false, "vừa bước ra không bị kéo vào lại");
  assert.equal(WD.crossesDoor("nha", i.x, i.z, 0, 1), true);
  assert.equal(WD.crossesDoor("nha", WD.SPAWN_IN.x, WD.SPAWN_IN.z, 0, 1), false);
});

test("sân hỏng thì dùng sân mặc định, không lấy bố cục trong nhà", () => {
  const r = E.sanitizeLayout(null, WD.YARD);
  assert.ok(r.layout.items.some(i => i.type === "nhaNgoai"));
});
