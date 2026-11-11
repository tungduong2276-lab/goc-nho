import { before, after, beforeEach, afterEach, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { initializeTestEnvironment, assertFails } from "@firebase/rules-unit-testing";
import {
  doc, getDoc, setDoc, onSnapshot, serverTimestamp, Timestamp,
  disableNetwork, enableNetwork,
} from "firebase/firestore";
import {
  createEmulatorPresenceClient, WRITE_INTERVAL_MS,
} from "../../nha3d/emulator-presence-client.mjs";

// All transport clients are explicitly bound to a loopback Firestore Emulator.
// NEVER create a real app or fetch real user data in this test.
const HOST = process.env.FIRESTORE_EMULATOR_HOST || "";
if (!/^(127\.0\.0\.1|localhost):[0-9]+$/.test(HOST)) {
  throw new Error("Presence transport integration tests require local Firestore Emulator");
}
const PROJECT = "demo-goc-nho-safety", CID = "fixture-couple";
const ALICE = "fixture-alice", BOB = "fixture-bob", EVE = "fixture-outsider";
const ownPath = uid => `couples/${CID}/nha3dPresence/${uid}`;
const occupy = (room, cell) =>
  ["khach", "bep", "ngu"].includes(room) && Number.isInteger(cell.i) &&
  Number.isInteger(cell.j) && cell.i >= 0 && cell.i < 16 && cell.j >= 0 && cell.j < 14;
const waitFor = async (check, ms = 6_000) => {
  const until = Date.now() + ms;
  while (Date.now() < until) {
    const v = check();
    if (v) return v;
    await new Promise(resolve => setTimeout(resolve, 60));
  }
  assert.fail("Timed out waiting for synthetic presence snapshot");
};
let env;
const liveClientDatabases = new Set();
function trackedFirestore(uid) {
  const fs = env.authenticatedContext(uid).firestore();
  liveClientDatabases.add(fs);
  return fs;
}
function sdkTransport(fs, uid, partnerUid) {
  const self = doc(fs, ownPath(uid)), partner = doc(fs, ownPath(partnerUid));
  return {
    readOwn: async () => {
      const snapshot = await getDoc(self);
      return snapshot.exists() ? snapshot.data() : null;
    },
    writeOwn: data => setDoc(self, data),
    subscribePartner: (onDoc, onError) => onSnapshot(partner,
      { includeMetadataChanges: true },
      snapshot => onDoc({
        data: snapshot.exists() ? snapshot.data() : null,
        pendingWrites: snapshot.metadata.hasPendingWrites,
      }), onError),
    timestamp: ms => Timestamp.fromMillis(ms),
    serverTimestamp,
  };
}
function client(uid, partnerUid, { online = () => true, onPeer = () => {}, onError = () => {} } = {}) {
  return createEmulatorPresenceClient({
    projectId: PROJECT, emulatorHost: HOST, cid: CID, uid, partnerUid,
    sessionId: uid === ALICE ? "alice_session_0001" : "bob_session_0000001",
    transport: sdkTransport(trackedFirestore(uid), uid, partnerUid),
    canOccupy: occupy, isOnline: online, onPeer, onError,
  });
}
before(async () => {
  const [host, portString] = HOST.split(":");
  env = await initializeTestEnvironment({
    projectId: PROJECT,
    firestore: {
      host, port: Number(portString),
      rules: readFileSync("tests/firebase/fixtures/m1-nha3d-presence.rules", "utf8"),
    },
  });
});
// Listener streams can remain active briefly after unsubscribe. Explicitly
// terminate every test-owned SDK Firestore instance before deleting the
// rules-test environment. Without this, CI waited until its 20-minute limit
// despite all three integration assertions having passed.
afterEach(async () => {
  const clients = [...liveClientDatabases];
  liveClientDatabases.clear();
  // rules-unit-testing creates the Firestore *compat* facade here.
  // Its instance method terminates the underlying connection; the modular
  // terminate(fs) function expects a different Firestore object and throws
  // TypeError: firestore._delete is not a function.
  await Promise.all(clients.map(fs => fs.terminate()));
});
after(async () => { await env?.cleanup(); });
beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async ctx => {
    const fs = ctx.firestore();
    await setDoc(doc(fs, `couples/${CID}`), {
      members: [ALICE, BOB], roles: { [ALICE]: 0, [BOB]: 1 }, code: "SYNTHETIC",
    });
  });
});

test("two separate authenticated emulator clients exchange short-lease positions and room transitions", async () => {
  const aliceSeen = [], bobSeen = [], errors = [];
  const a = client(ALICE, BOB, { onPeer: p => aliceSeen.push(p), onError: e => errors.push(e) });
  const b = client(BOB, ALICE, { onPeer: p => bobSeen.push(p), onError: e => errors.push(e) });
  try {
    await a.join("khach", { i: 8, j: 11 });
    await b.join("khach", { i: 8, j: 12 });
    await waitFor(() => a.getPeer()?.uid === BOB && b.getPeer()?.uid === ALICE);
    assert.equal(b.getPeer().room, "khach");
    await new Promise(resolve => setTimeout(resolve, WRITE_INTERVAL_MS + 70));
    assert.deepEqual(await a.publish("bep", { i: 0, j: 10 }), { status: "published", seq: 2 });
    await waitFor(() => b.getPeer()?.room === "bep");
    assert.deepEqual(b.getPeer().cell, { i: 0, j: 10 });
    assert.ok(aliceSeen.some(p => p?.uid === BOB));
    assert.ok(bobSeen.some(p => p?.uid === ALICE));
    assert.deepEqual(errors, []);
  } finally { a.disconnect(); b.disconnect(); }
});

test("application offline guard refuses queued write while SDK network is disabled", async () => {
  const fs = trackedFirestore(ALICE);
  let online = true;
  const a = createEmulatorPresenceClient({
    projectId: PROJECT, emulatorHost: HOST, cid: CID, uid: ALICE, partnerUid: BOB,
    sessionId: "alice_session_0001", transport: sdkTransport(fs, ALICE, BOB),
    canOccupy: occupy, isOnline: () => online,
  });
  try {
    await a.join("khach", { i: 8, j: 11 });
    online = false;
    await disableNetwork(fs);
    await assert.rejects(a.publish("bep", { i: 0, j: 10 }), /OFFLINE_BLOCKED/);
    await enableNetwork(fs);
    online = true;
    const state = await getDoc(doc(fs, ownPath(ALICE)));
    assert.equal(state.data().seq, 1);
    assert.equal(state.data().room, "khach");
    await new Promise(resolve => setTimeout(resolve, WRITE_INTERVAL_MS + 70));
    assert.equal((await a.publish("bep", { i: 0, j: 10 })).seq, 2);
  } finally {
    await enableNetwork(fs);
    a.disconnect();
  }
});

test("emulator still rejects outsider forging a real member even if adapter guard bypassed", async () => {
  const c = trackedFirestore(EVE);
  await assertFails(setDoc(doc(c, ownPath(ALICE)), {
    v: 1, uid: ALICE, room: "khach", i: 8, j: 11,
    sessionId: "alice_session_0001", seq: 1,
    updatedAt: serverTimestamp(), expiresAt: Timestamp.fromMillis(Date.now() + 10_000),
  }));
});
