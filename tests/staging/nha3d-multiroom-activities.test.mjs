import { test } from "node:test";
import assert from "node:assert/strict";
import { makeHouse } from "../../nha3d/multiroom.mjs";
import { PREVIEW_LAYOUTS, PREVIEW_SPAWN } from "../../nha3d/multiroom-preview-layout.mjs";
import { routeToFurniture } from "../../nha3d/multiroom-activities.mjs";
import { blockGrid, cellFree } from "../../nha3d/engine.mjs";

test("room activities navigate to free floor cells beside real furniture", () => {
 const house = makeHouse(PREVIEW_LAYOUTS);
 for (const id of ["khach", "bep", "ngu"]) {
  const room = house.rooms[id];
  const start = id === "khach" ? PREVIEW_SPAWN.cell : id === "bep" ? { i: 0, j: 10 } : { i: 8, j: 0 };
  const path = routeToFurniture(room, start, id);
  assert.ok(path?.length, id + " must have a reachable activity");
  const grid = blockGrid(room.layout, room.size);
  for (const cell of path) assert.equal(cellFree(grid, cell.i, cell.j), true, id + " path crosses furniture");
 }
});
test("no activity can start from a blocked tile or missing room", () => {
 const house = makeHouse(PREVIEW_LAYOUTS);
 assert.equal(routeToFurniture(house.rooms.khach, { i: 7, j: 9 }, "khach"), null);
 assert.equal(routeToFurniture(house.rooms.khach, PREVIEW_SPAWN.cell, "missing"), null);
});
