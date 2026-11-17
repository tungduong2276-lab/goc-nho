import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { COZY, ROOM_MOODS } from "../../nha3d/cozy-palette.mjs";
import { decorateCozyRoom, disposeCozyRoom, COZY_DECOR_NAME } from "../../nha3d/cozy-decor.js";
import { ROOM, DEFAULT_LAYOUT, WALL_COLORS, FLOOR_COLORS } from "../../nha3d/catalog.mjs";
import { ROOM_PRESETS } from "../../nha3d/rooms.mjs";
import { deserialize, serialize } from "../../nha3d/engine.mjs";

test("Mint, hồng, baby blue là ba màu chính trong mặc định của mọi phòng", () => {
  const walls = Object.fromEntries(WALL_COLORS.map(c => [c.id, c.wall]));
  const floors = Object.fromEntries(FLOOR_COLORS.map(c => [c.id, c.floor]));
  assert.equal(walls.mint, COZY.mintWall);
  assert.equal(walls.babyblue, COZY.blueWall);
  assert.equal(walls.hong, COZY.pinkWall);
  assert.equal(floors.mint, COZY.mintFloor);
  assert.equal(DEFAULT_LAYOUT.wall, ROOM_MOODS.nha.wall);
  assert.deepEqual(new Set(Object.values(ROOM_MOODS).map(m => m.wall)), new Set(["mint", "hong", "babyblue"]));
  for (const [id, room] of Object.entries(ROOM_PRESETS)) {
    assert.equal(room.defaultLayout.wall, ROOM_MOODS[id].wall, id);
    assert.equal(room.defaultLayout.floor, ROOM_MOODS[id].floor, id);
    assert.ok(walls[room.defaultLayout.wall], id);
    assert.ok(floors[room.defaultLayout.floor], id);
  }
});

test("Đổi màu mặc định không tự ghi đè layout cũ và không tạo món đồ mới", () => {
  const saved = { v: 1, wall: "bo", floor: "godam", items: DEFAULT_LAYOUT.items.map(i => ({ ...i })) };
  const original = JSON.stringify(saved);
  const restored = deserialize(original, ROOM).layout;
  assert.equal(restored.wall, "bo");
  assert.equal(restored.floor, "godam");
  assert.deepEqual(restored.items, saved.items);
  assert.equal(JSON.stringify(saved), original);
  assert.equal(serialize(restored), serialize(saved));
});

test("Trang trí 3D chỉ nằm trên vỏ phòng, tháo ra được và không chiếm ô va chạm", () => {
  const shell = new THREE.Group();
  const countBefore = shell.children.length;
  const decoration = decorateCozyRoom(shell, "nha", 8, 7, 2.7);
  assert.equal(shell.getObjectByName(COZY_DECOR_NAME), decoration);
  assert.ok(decoration.children.length >= 12);
  assert.equal(countBefore, 0);
  assert.ok(decoration.children.every(child => !child.userData.uid));
  disposeCozyRoom(shell);
  assert.equal(shell.getObjectByName(COZY_DECOR_NAME), undefined);
  assert.equal(shell.children.length, countBefore);
});
