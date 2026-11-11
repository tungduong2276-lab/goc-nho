import test from "node:test";
import assert from "node:assert/strict";
import {
  createEmulatorPresenceClient, readPeerPresence, LEASE_MS, WRITE_INTERVAL_MS,
} from "../../nha3d/emulator-presence-client.mjs";

const PROJECT = "demo-goc-nho-safety", HOST = "127.0.0.1:8080";
const ALICE = "fixture-alice", BOB = "fixture-bob";
const SESSION_A = "alice_session_0001", SESSION_B = "bob_session_0000001";
const canOccupy = (room, cell) =>
  ["khach", "bep", "ngu"].includes(room) &&
  cell.i >= 0 && cell.i < 16 && cell.j >= 0 && cell.j < 14;
const time = ms => ({ toMillis: () => ms });
const clock = { value: 100_000 };
function setup() {
  let own = null, callback = null, closed = false, writes = [], removed = false;
  const transport = {
    readOwn: async () => own,
    writeOwn: async data => { writes.push(data); own = data; },
    subscribePartner: cb => {
      callback = cb;
      return () => { closed = true; callback = null; };
    },
    serverTimestamp: () => "mock-serverTimestamp",
    timestamp: time,
  };
  const client = (overrides = {}) => createEmulatorPresenceClient({
    projectId: PROJECT, emulatorHost: HOST,
    cid: "fixture-couple", uid: ALICE, partnerUid: BOB,
    sessionId: SESSION_A, transport, canOccupy,
    now: () => clock.value, ...overrides,
  });
  return {
    transport, client, writes, receive: snapshot => callback?.(snapshot),
    get closed() { return closed; },
    get own() { return own; },
    set own(value) { own = value; },
    get removed() { return removed; }
  };
}
function peerData({
  uid = BOB, sessionId = SESSION_B, seq = 1, room = "khach",
  i = 8, j = 11, updatedAt = time(clock.value - 1_000),
  expiresAt = time(clock.value + 9_000), ...extra
} = {}) {
  return { v: 1, uid, sessionId, seq, room, i, j, updatedAt, expiresAt, ...extra };
}
test("requires explicit emulator project, loopback host, UID and adapter injection", () => {
  const f = setup();
  assert.throws(() => f.client({ projectId: "goc-nho-staging-2026" }), /EMULATOR_ONLY/);
  assert.throws(() => f.client({ emulatorHost: "firestore.googleapis.com:443" }), /EMULATOR_ONLY/);
  assert.throws(() => f.client({ emulatorHost: "10.0.0.20:8080" }), /EMULATOR_ONLY/);
  assert.throws(() => f.client({ uid: BOB }), /INVALID_PRESENCE_CLIENT/);
  assert.throws(() => f.client({ sessionId: "short" }), /INVALID_PRESENCE_CLIENT/);
  assert.throws(() => f.client({ transport: {} }), /INVALID_PRESENCE_CLIENT/);
});

test("reader rejects wrong identity, invalid layout, future, expired and pending writes", () => {
  clock.value = 100_000;
  const opts = { partnerUid: BOB, now: clock.value, canOccupy };
  const base = peerData();
  const accepted = readPeerPresence(base, opts);
  assert.equal(accepted.room, "khach");
  assert.deepEqual(accepted.cell, { i: 8, j: 11 });
  for (const bad of [
    null, { ...base, uid: ALICE }, { ...base, sessionId: "short" },
    { ...base, seq: 0 }, { ...base, room: "unknown" },
    { ...base, i: -1 }, { ...base, j: 14 },
    { ...base, updatedAt: time(clock.value + 30_000) },
    { ...base, expiresAt: time(clock.value - 1) },
    { ...base, expiresAt: time(clock.value + 60_000) },
  ]) assert.equal(readPeerPresence(bad, opts), null);
  assert.equal(readPeerPresence(base, { ...opts, pendingWrites: true }), null);
  assert.equal(readPeerPresence({ ...base, seq: 0 }, opts), null);
  assert.equal(readPeerPresence({ ...base, seq: 2 }, {
    ...opts, canOccupy: () => false,
  }), null);
  assert.equal(readPeerPresence({ ...base, seq: 0 }, { ...opts, previous: accepted }), null);
  assert.equal(readPeerPresence({ ...base, sessionId: "alternate_session_01" }, {
    ...opts, previous: accepted,
  }), null);
});

test("join publishes only walkable cell, throttles, blocks offline and never deletes presence", async () => {
  clock.value = 100_000;
  const f = setup(), observed = [];
  let online = true;
  const a = f.client({
    isOnline: () => online, onPeer: peer => observed.push(peer),
  });
  await assert.rejects(a.publish("khach", { i: 8, j: 11 }), /NOT_JOINED/);
  await assert.rejects(a.join("khach", { i: 16, j: 11 }), /INVALID_CELL/);
  assert.deepEqual(await a.join("khach", { i: 8, j: 11 }),
    { status: "published", seq: 1 });
  assert.equal(f.writes.length, 1);
  assert.equal(f.writes[0].updatedAt, "mock-serverTimestamp");
  assert.equal(f.writes[0].expiresAt.toMillis(), clock.value + LEASE_MS);
  assert.equal((await a.publish("khach", { i: 9, j: 11 })).status, "throttled");
  clock.value += WRITE_INTERVAL_MS + 1;
  assert.deepEqual(await a.publish("khach", { i: 9, j: 11 }),
    { status: "published", seq: 2 });
  online = false;
  await assert.rejects(a.publish("khach", { i: 10, j: 11 }), /OFFLINE_BLOCKED/);
  assert.equal(f.writes.length, 2);
  a.disconnect(); a.disconnect();
  assert.equal(f.closed, true);
  assert.equal(f.writes.length, 2, "disconnect never writes or deletes, only lease timeout");
  assert.equal(a.status, "closed");
  await assert.rejects(a.publish("khach", { i: 10, j: 11 }), /NOT_JOINED/);
  assert.deepEqual(observed, []);
});

test("live snapshots update the peer, stale replay cannot roll back, expired peer disappears", async () => {
  clock.value = 100_000;
  const f = setup(), seen = [], a = f.client({ onPeer: p => seen.push(p) });
  await a.join("khach", { i: 8, j: 11 });
  f.receive({ data: peerData() });
  assert.equal(a.getPeer().uid, BOB);
  f.receive({ data: peerData({ room: "bep", i: 0, j: 10, seq: 2 }) });
  assert.equal(a.getPeer().room, "bep");
  f.receive({ data: peerData({ seq: 1, room: "ngu", i: 8, j: 0 }) });
  assert.equal(a.getPeer().room, "bep", "old seq must never roll back new location");
  f.receive({ data: peerData({ seq: 3, i: 16 }) });
  assert.equal(a.getPeer().room, "bep", "invalid cell must not erase current peer");
  f.receive({ data: peerData({ seq: 3, room: "ngu", i: 8, j: 0 }), pendingWrites: true });
  assert.equal(a.getPeer().room, "bep", "ignore uncommitted state");
  clock.value += 10_500;
  assert.equal(a.tick(), null);
  assert.equal(seen.at(-1), null, "stale displayed presence expires without server TTL deletion");
  assert.equal(seen.length, 3, "new connected, moved, expired only");
  a.disconnect();
});

test("new session cannot replace active owner session, but can join after lease expiration", async () => {
  clock.value = 100_000;
  const f = setup();
  f.own = {
    ...peerData({ uid: ALICE, sessionId: SESSION_A, seq: 7 }),
    expiresAt: time(clock.value + 7_000),
  };
  await assert.rejects(f.client({
    sessionId: "new_session_000001",
  }).join("khach", { i: 8, j: 11 }), /ACTIVE_SESSION/);
  clock.value += 7_001;
  const fresh = f.client({ sessionId: "new_session_000001" });
  assert.equal((await fresh.join("khach", { i: 8, j: 11 })).seq, 1);
  assert.equal(f.own.sessionId, "new_session_000001");
  fresh.disconnect();
});

test("writes in flight cannot schedule another write, stop cannot re-enable a closed client", async () => {
  clock.value = 100_000;
  const f = setup(), client = f.client();
  await client.join("khach", { i: 8, j: 11 });
  clock.value += WRITE_INTERVAL_MS + 1;
  let finish;
  f.transport.writeOwn = () => new Promise(resolve => { finish = resolve; });
  const pending = client.publish("bep", { i: 0, j: 10 });
  await Promise.resolve(); await Promise.resolve();
  assert.equal((await client.publish("khach", { i: 8, j: 11 })).status, "busy");
  client.disconnect();
  finish();
  assert.equal((await pending).status, "stopped-after-write");
  assert.equal(client.status, "closed");
  await assert.rejects(client.join("khach", { i: 8, j: 11 }), /ALREADY_JOINED_OR_CLOSED/);
});
