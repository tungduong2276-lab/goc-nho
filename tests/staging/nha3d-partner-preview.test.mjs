import test from "node:test";
import assert from "node:assert/strict";
import { makeHouse } from "../../nha3d/multiroom.mjs";
import { PREVIEW_LAYOUTS, PREVIEW_SPAWN } from "../../nha3d/multiroom-preview-layout.mjs";
import { companionSpawn, routeCompanionToPlayer } from "../../nha3d/partner-preview.mjs";
import { blockGrid, cellFree, findPath } from "../../nha3d/engine.mjs";

test("companion spawns on a separate walkable tile in each furnished room", () => {
  const house = makeHouse(PREVIEW_LAYOUTS);
  for (const [id, room] of Object.entries(house.rooms)) {
    const player = id === PREVIEW_SPAWN.room ? PREVIEW_SPAWN.cell :
      house.doors.flatMap(d => [d.a, d.b]).find(ep => ep.room === id).cell;
    const spawn = companionSpawn(room, player);
    assert.ok(spawn, "no valid companion spawn in " + id);
    assert.notDeepEqual(spawn, player, "companion must not overlap player in " + id);
    const grid = blockGrid(room.layout, room.size);
    assert.ok(cellFree(grid, spawn.i, spawn.j));
    const path = routeCompanionToPlayer(room, spawn, player);
    assert.ok(path);
    assert.deepEqual(path[0], spawn);
    assert.ok(Math.abs(path.at(-1).i-player.i) <= 1 && Math.abs(path.at(-1).j-player.j) <= 1);
    assert.ok(findPath(grid, spawn, path.at(-1)), "path must be reachable");
  }
});

test("companion routes to a new player position without entering player cell", () => {
  const room = makeHouse(PREVIEW_LAYOUTS).rooms.khach;
  const start = companionSpawn(room, PREVIEW_SPAWN.cell);
  const target = { i: 15, j: 10 };
  const path = routeCompanionToPlayer(room, start, target);
  assert.ok(path);
  assert.deepEqual(path[0], start);
  assert.notDeepEqual(path.at(-1), target);
  assert.ok(Math.abs(path.at(-1).i-target.i) <= 1);
  assert.ok(Math.abs(path.at(-1).j-target.j) <= 1);
});

test("invalid or overlapping positions are rejected without side effects", () => {
  const room = makeHouse(PREVIEW_LAYOUTS).rooms.khach;
  assert.equal(companionSpawn(null, PREVIEW_SPAWN.cell), null);
  assert.equal(companionSpawn(room, { i: -1, j: 0 }), null);
  assert.equal(routeCompanionToPlayer(room, PREVIEW_SPAWN.cell, PREVIEW_SPAWN.cell), null);
  assert.equal(routeCompanionToPlayer(room, { i: -5, j: 0 }, PREVIEW_SPAWN.cell), null);
});
