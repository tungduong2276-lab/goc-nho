import { test } from "node:test";
import assert from "node:assert/strict";
import { makeHouse, routeHouse, transitionAtDoor } from "../../nha3d/multiroom.mjs";
import { blockGrid, cellFree } from "../../nha3d/engine.mjs";

test("both room doorways are reachable in the default house", () => {
 const house = makeHouse();
 for (const door of house.doors) {
  for (const ep of [door.a,door.b]) {
   const r=house.rooms[ep.room], g=blockGrid(r.layout,r.size);
   assert.equal(cellFree(g,ep.cell.i,ep.cell.j),true,door.id+" blocked in "+ep.room);
  }
  assert.deepEqual(transitionAtDoor(house,door.a,door.id),door.b);
  assert.deepEqual(transitionAtDoor(house,door.b,door.id),door.a);
 }
});
test("a route to another room includes an actual door step", () => {
 const house=makeHouse();
 for (const door of house.doors) {
  const route=routeHouse(house,door.a,door.b);
  assert.ok(route?.some(s=>s.type==="door" && s.id===door.id));
 }
});
test("no transition away from door", () => {
 const house=makeHouse();
 assert.equal(transitionAtDoor(house,{room:"khach",cell:{i:7,j:9}},"khach-bep"),null);
});

test("preview spawn is unblocked and can reach both doors", () => {
 const house = makeHouse();
 const spawn = { room: "khach", cell: { i: 8, j: 11 } };
 const grid = blockGrid(house.rooms.khach.layout, house.rooms.khach.size);
 assert.equal(cellFree(grid, spawn.cell.i, spawn.cell.j), true, "avatar must not spawn inside furniture");
 for (const door of house.doors) {
  const route = routeHouse(house, spawn, door.b);
  assert.ok(route?.some(step => step.type === "door" && step.id === door.id), "spawn cannot reach " + door.id);
 }
});
