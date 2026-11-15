import test from "node:test";
import assert from "node:assert/strict";
import { makeHouse, routeHouse, transitionAtDoor } from "../../nha3d/multiroom.mjs";

test("multi-room route includes explicit doorway and return", () => {
  const house = makeHouse();
  const a = { room: "khach", cell: { i: 15, j: 10 } };
  const b = { room: "bep", cell: { i: 2, j: 10 } };
  const route = routeHouse(house, a, b);
  assert.ok(route?.some(s => s.type === "door" && s.id === "khach-bep"));
  assert.deepEqual(transitionAtDoor(house, a, "khach-bep"), { room: "bep", cell: { i: 0, j: 10 } });
  assert.ok(routeHouse(house, b, a)?.some(s => s.type === "door"));
});
test("cannot teleport away from doorway or into missing room", () => {
  const h = makeHouse();
  assert.equal(transitionAtDoor(h, { room: "khach", cell: { i: 2, j: 2 } }, "khach-bep"), null);
  assert.equal(routeHouse(h, { room: "unknown", cell: { i: 1, j: 1 } }, { room: "bep", cell: { i: 1, j: 1 } }), null);
});
test("blocked destination doorway prevents crossing", () => {
  const h = makeHouse();
  h.rooms.bep.layout.items.push({ uid: "blocked", type: "dem", gx: 0, gz: 10, r: 0 });
  const start = { room: "khach", cell: { i: 15, j: 10 } };
  assert.equal(transitionAtDoor(h, start, "khach-bep"), null);
  assert.equal(routeHouse(h, start, { room: "bep", cell: { i: 2, j: 10 } }), null);
});
test("room layouts are independent copies; legacy layout untouched", () => {
  const a = makeHouse(), b = makeHouse();
  a.rooms.khach.layout.items.pop();
  assert.notEqual(a.rooms.khach.layout.items.length, b.rooms.khach.layout.items.length);
  assert.equal(a.rooms.bep.layout.items.length, 0);
});
