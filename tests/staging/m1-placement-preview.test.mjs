import { test } from "node:test";
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import {
  makePlacementPreview, applyPreviewAction, ROOM_SOURCES, PlacementPreviewError,
} from "../../src/house-placement-preview.mjs";

const scene = JSON.parse(readFileSync("assets/3d/scene.json", "utf8"));
const fresh = () => makePlacementPreview(scene);
const add = (roomId, n, id, assetType = "plant") => ({
  kind: "place", id, assetType,
  roomId, slotId: `${roomId}-candidate-${n}`,
});
const fails = (fn, code) => assert.throws(fn, e =>
  e instanceof PlacementPreviewError && e.code === code);

test("creates two in-bounds candidate anchors per room without enabling persistence", () => {
  const draft = fresh();
  assert.equal(draft.protocol, "LOCAL_PREVIEW_ONLY");
  assert.equal(draft.canPersist, false);
  assert.equal(draft.slots.length, 12);
  assert.equal(Object.keys(ROOM_SOURCES).length, 6);
  assert.deepEqual([...new Set(draft.slots.map(s => s.roomId))],
    Object.keys(ROOM_SOURCES));
  assert.ok(draft.slots.every(s =>
    s.status === "VISUAL_APPROVAL_REQUIRED" &&
    Number.isFinite(s.x) && s.x >= 0 && s.x <= 1170 &&
    Number.isFinite(s.y) && s.y >= 0 && s.y <= 1170));
});

test("places one item without mutating the original draft or scene", () => {
  const old = fresh(), before = JSON.stringify(scene);
  const next = applyPreviewAction(old, add("bep", 1, "plant-one"));
  assert.equal(old.items.length, 0);
  assert.equal(next.items.length, 1);
  assert.equal(next.items[0].assetType, "plant");
  assert.equal(next.items[0].x, next.slots[2].x);
  assert.equal(JSON.stringify(scene), before);
});

test("two items cannot occupy the same slot even when asset types differ", () => {
  const placed = applyPreviewAction(fresh(), add("phong-anh", 1, "first", "chair"));
  fails(() => applyPreviewAction(placed, add("phong-anh", 1, "second", "lamp")),
    "SLOT_OCCUPIED");
  assert.equal(placed.items.length, 1);
});

test("move between candidate slots and undo returns exact previous placement", () => {
  const first = applyPreviewAction(fresh(), add("gac", 1, "rug-1", "rug"));
  const moved = applyPreviewAction(first, {
    kind: "move", id: "rug-1", slotId: "gac-candidate-2",
  });
  assert.equal(moved.items[0].slotId, "gac-candidate-2");
  assert.notEqual(moved.items[0].x, first.items[0].x);
  const restored = applyPreviewAction(moved, { kind: "undo" });
  assert.deepEqual(restored.items, first.items);
  assert.deepEqual(first.items[0].slotId, "gac-candidate-1");
});

test("rotate, remove and undo use immutable snapshots", () => {
  const first = applyPreviewAction(fresh(), add("phong-em", 1, "chair-1", "chair"));
  const rotated = applyPreviewAction(first, {
    kind: "rotate", id: "chair-1", rotation: 90,
  });
  assert.equal(first.items[0].rotation, 0);
  assert.equal(rotated.items[0].rotation, 90);
  const removed = applyPreviewAction(rotated, { kind: "remove", id: "chair-1" });
  assert.deepEqual(removed.items, []);
  const undone = applyPreviewAction(removed, { kind: "undo" });
  assert.deepEqual(undone.items, rotated.items);
});

test("rejects duplicate IDs and unknown object types and rotation", () => {
  const first = applyPreviewAction(fresh(), add("phong-khach", 1, "item"));
  fails(() => applyPreviewAction(first, add("bep", 2, "item")), "DUPLICATE_ITEM_ID");
  fails(() => applyPreviewAction(fresh(), add("bep", 1, "x", "script")),
    "UNKNOWN_ASSET");
  fails(() => applyPreviewAction(fresh(), {
    ...add("bep", 1, "x"), rotation: 45,
  }), "INVALID_ROTATION");
  fails(() => applyPreviewAction(first, {
    kind: "rotate", id: "item", rotation: 360,
  }), "INVALID_ROTATION");
});

test("rejects invalid rooms, arbitrary coordinates, and cross-room slot movement", () => {
  fails(() => applyPreviewAction(fresh(), add("missing", 1, "x")), "UNKNOWN_ROOM");
  fails(() => applyPreviewAction(fresh(), {
    kind: "place", id: "x", assetType: "plant",
    roomId: "bep", slotId: "bep-candidate-999",
  }), "UNKNOWN_SLOT");
  const draft = applyPreviewAction(fresh(), add("bep", 1, "x"));
  fails(() => applyPreviewAction(draft, {
    kind: "move", id: "x", slotId: "gac-candidate-1",
  }), "UNKNOWN_SLOT");
  fails(() => applyPreviewAction(draft, {
    kind: "move", id: "missing", slotId: "bep-candidate-2",
  }), "UNKNOWN_ITEM");
});

test("cannot move item into already occupied slot in same room", () => {
  let draft = applyPreviewAction(fresh(), add("goc-sang-tao", 1, "a"));
  draft = applyPreviewAction(draft, add("goc-sang-tao", 2, "b"));
  fails(() => applyPreviewAction(draft, {
    kind: "move", id: "a", slotId: "goc-sang-tao-candidate-2",
  }), "SLOT_OCCUPIED");
});

test("rejects invalid scene, invalid anchors and missing undo", () => {
  fails(() => makePlacementPreview(null), "INVALID_SCENE");
  const broken = structuredClone(scene);
  broken.rooms.bep.spots.dung[0][0] = Infinity;
  fails(() => makePlacementPreview(broken), "INVALID_SCENE_ANCHORS");
  fails(() => applyPreviewAction(fresh(), { kind: "undo" }), "NOTHING_TO_UNDO");
  fails(() => applyPreviewAction({}, add("bep", 1, "x")), "INVALID_DRAFT");
});

test("undo history is bounded and all unsupported actions fail closed", () => {
  let draft = applyPreviewAction(fresh(), add("phong-anh", 1, "chair", "chair"));
  for (let i = 0; i < 40; i++) {
    draft = applyPreviewAction(draft, {
      kind: "rotate", id: "chair", rotation: [0, 90, 180, 270][i % 4],
    });
  }
  assert.equal(draft.undoStack.length, 20);
  fails(() => applyPreviewAction(draft, { kind: "teleport", id: "chair" }),
    "UNKNOWN_ACTION");
  fails(() => applyPreviewAction(draft, { kind: "place", id: "../unsafe" }),
    "INVALID_ITEM_ID");
});
