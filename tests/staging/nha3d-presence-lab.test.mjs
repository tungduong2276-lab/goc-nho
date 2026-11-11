import test from "node:test";
import assert from "node:assert/strict";
import { createPresenceProtocol, PEER_TTL_MS } from "../../nha3d/presence-lab.mjs";
import { makeHouse } from "../../nha3d/multiroom.mjs";
import { PREVIEW_LAYOUTS, PREVIEW_SPAWN } from "../../nha3d/multiroom-preview-layout.mjs";
import { blockGrid, cellFree } from "../../nha3d/engine.mjs";
const house = makeHouse(PREVIEW_LAYOUTS);
const grids = Object.fromEntries(Object.entries(house.rooms).map(([id, room]) =>
  [id, blockGrid(room.layout, room.size)]));
function canOccupy(room, cell) {
  return typeof room === "string" && Object.hasOwn(grids, room) &&
    cell !== null && typeof cell === "object" &&
    Number.isInteger(cell.i) && Number.isInteger(cell.j) &&
    cellFree(grids[room], cell.i, cell.j);
}
const ALICE = "alice_demo_session_001", BOB = "bob_demo_session_002", EVE = "eve_demo_session_003";
const create = (id, clock) => createPresenceProtocol({ selfId: id, now: () => clock.value, canOccupy });

test("two synthetic tabs exchange validated room/cell state with monotonically increasing sequence", () => {
  const clock = { value: 100_000 }, alice = create(ALICE, clock), bob = create(BOB, clock);
  const a = alice.packet("state", { room: PREVIEW_SPAWN.room, cell: PREVIEW_SPAWN.cell });
  const b = bob.packet("state", { room: "bep", cell: { i: 0, j: 10 } });
  assert.equal(bob.receive(a).kind, "updated");
  assert.equal(alice.receive(b).kind, "updated");
  assert.deepEqual(bob.current().cell, PREVIEW_SPAWN.cell);
  assert.equal(alice.current().room, "bep");
  assert.equal(alice.receive(b).kind, "ignored", "duplicates must not replay");
  const move = bob.packet("state", { room: "ngu", cell: { i: 8, j: 0 } });
  assert.equal(alice.receive(move).kind, "updated");
  assert.equal(alice.current().room, "ngu");
  assert.equal(alice.receive(b).kind, "ignored", "old location must never override new");
  assert.equal(alice.current().room, "ngu");
});

test("spoofed shape, blocked tile, unexpected room and third peer are rejected", () => {
  const clock = { value: 100_000 }, alice = create(ALICE, clock), bob = create(BOB, clock), eve = create(EVE, clock);
  assert.equal(alice.receive({}).kind, "ignored");
  assert.equal(alice.receive(bob.packet("state", { room: "khach", cell: PREVIEW_SPAWN.cell })).kind, "updated");
  assert.equal(alice.receive(eve.packet("state", { room: "bep", cell: { i: 0, j: 10 } })).kind, "ignored");
  for (const invalid of [
    { v: 1, type: "state", id: BOB, seq: 4, at: 100_000, room: "khach", cell: { i: -1, j: 0 } },
    { v: 1, type: "state", id: BOB, seq: 4, at: 100_000, room: "unknown", cell: { i: 1, j: 1 } },
    { v: 1, type: "state", id: BOB, seq: 4, at: 100_000, room: "khach", cell: { i: "8", j: 11 } },
    { v: 1, type: "state", id: BOB, seq: 4, at: 100_000, room: "khach", cell: null },
    { v: 1, type: "state", id: BOB, seq: 4, at: 100_000, room: "khach", cell: { i: 0.1, j: 1 } },
    { v: 1, type: "state", id: ALICE, seq: 4, at: 100_000, room: "khach", cell: PREVIEW_SPAWN.cell },
    { v: 1, type: "state", id: BOB, seq: 4, at: 1, room: "khach", cell: PREVIEW_SPAWN.cell },
    { v: 1, type: "state", id: BOB, seq: 4, at: 104_000, room: "khach", cell: PREVIEW_SPAWN.cell }
  ]) assert.equal(alice.receive(invalid).kind, "ignored");
  assert.deepEqual(alice.current().cell, PREVIEW_SPAWN.cell);
  assert.throws(() => bob.packet("state", { room: "khach", cell: { i: -9, j: 0 } }), /walkable/);
});

test("hello handshake, graceful disconnect and a fresh reconnection work without persistence", () => {
  const clock = { value: 100_000 }, alice = create(ALICE, clock), bob = create(BOB, clock);
  assert.equal(alice.receive(bob.packet("hello")).kind, "hello");
  assert.equal(alice.current(), null, "hello contains no location");
  const first = bob.packet("state", { room: "khach", cell: PREVIEW_SPAWN.cell });
  assert.equal(alice.receive(first).kind, "updated");
  assert.equal(alice.receive(bob.packet("bye")).kind, "left");
  assert.equal(alice.current(), null);
  const returnState = bob.packet("state", { room: "ngu", cell: { i: 8, j: 0 } });
  assert.equal(alice.receive(returnState).kind, "updated");
  clock.value += PEER_TTL_MS + 1;
  assert.equal(alice.current(), null, "silent/closed tab expires");
  assert.equal(alice.receive(eveState(clock.value)).kind, "updated", "another tab may join after expiry");
  function eveState(at) { return { v: 1, type: "state", id: EVE, seq: 1, at, room: "bep", cell: { i: 0, j: 10 } }; }
});

test("a late or mismatched bye cannot eject a newer live peer", () => {
  const clock = { value: 100_000 }, alice = create(ALICE, clock), bob = create(BOB, clock), eve = create(EVE, clock);
  const first = bob.packet("state", { room: "khach", cell: PREVIEW_SPAWN.cell });
  alice.receive(first);
  assert.equal(alice.receive({ ...first, type: "bye" }).kind, "ignored");
  assert.equal(alice.receive(eve.packet("bye")).kind, "ignored");
  assert.equal(alice.current().id, BOB);
});
