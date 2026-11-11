import { before, after, beforeEach, test } from "node:test";
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { initializeTestEnvironment, assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import {
  doc, collection, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
  Timestamp, serverTimestamp
} from "firebase/firestore";

// NEVER contact staging or production: local Emulator + synthetic users only.
const address = process.env.FIRESTORE_EMULATOR_HOST || "";
if (!/^(localhost|127\.0\.0\.1):[0-9]+$/.test(address)) {
  throw new Error("M1 presence security tests require loopback Firestore Emulator");
}
const PROJECT = "demo-goc-nho-safety";
const ALICE = "fixture-alice", BOB = "fixture-bob", EVE = "fixture-outsider";
const CID = "fixture-couple", OTHER = "fixture-other-couple";
const DOC = (cid, uid) => `couples/${cid}/nha3dPresence/${uid}`;
const SESSION_A = "alice_session_0001", SESSION_B = "alice_session_0002";
let env;
const db = uid => uid ? env.authenticatedContext(uid).firestore() : env.unauthenticatedContext().firestore();
const presence = (clientDb, uid, cid = CID) => doc(clientDb, DOC(cid, uid));
function payload(uid, {
  room = "khach", i = 8, j = 11, sessionId = SESSION_A, seq = 1,
  updatedAt = serverTimestamp(),
  expiresAt = Timestamp.fromMillis(Date.now() + 10_000),
  ...extras
} = {}) {
  return { v: 1, uid, room, i, j, sessionId, seq, updatedAt, expiresAt, ...extras };
}
async function fixture(uid, values, cid = CID) {
  await env.withSecurityRulesDisabled(async admin => {
    await setDoc(presence(admin.firestore(), uid, cid), values);
  });
}
async function outdated(uid = ALICE, expired = false) {
  await fixture(uid, {
    ...payload(uid, { seq: 7 }),
    updatedAt: Timestamp.fromMillis(Date.now() - 20_000),
    expiresAt: Timestamp.fromMillis(Date.now() + (expired ? -5_000 : 10_000)),
  });
}
before(async () => {
  const [host, portText] = address.split(":");
  env = await initializeTestEnvironment({
    projectId: PROJECT,
    firestore: {
      host, port: Number(portText),
      rules: readFileSync("tests/firebase/fixtures/m1-nha3d-presence.rules", "utf8"),
    },
  });
});
after(async () => { await env?.cleanup(); });
beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async admin => {
    const fs = admin.firestore();
    await setDoc(doc(fs, `couples/${CID}`), {
      members: [ALICE, BOB], roles: { [ALICE]: 0, [BOB]: 1 }, code: "SYNTHETIC",
    });
    await setDoc(doc(fs, `couples/${OTHER}`), {
      members: [EVE], roles: { [EVE]: 0 }, code: "OTHER",
    });
    await setDoc(doc(fs, `couples/${CID}/notes/legacy`), { body: "unchanged" });
    await setDoc(doc(fs, `couples/${CID}/roomObjects/existing`), {
      revision: 0, left: "legacy",
    });
  });
});

test("Alice and Bob can each publish only their UID and read both room states", async () => {
  const a = db(ALICE), b = db(BOB);
  await assertSucceeds(setDoc(presence(a, ALICE), payload(ALICE)));
  await assertSucceeds(setDoc(presence(b, BOB), payload(BOB, {
    room: "bep", i: 0, j: 10, sessionId: "bob_session_000001",
  })));
  assert.equal((await assertSucceeds(getDoc(presence(b, ALICE)))).data().uid, ALICE);
  assert.equal((await assertSucceeds(getDoc(presence(a, BOB)))).data().room, "bep");
  const listed = await assertSucceeds(getDocs(collection(b, `couples/${CID}/nha3dPresence`)));
  assert.deepEqual(listed.docs.map(x => x.id).sort(), [ALICE, BOB]);
});

test("nonmember and anonymous cannot read/list/write the two-person presence", async () => {
  for (const uid of [EVE, null]) {
    const c = db(uid);
    await assertFails(getDoc(presence(c, ALICE)));
    await assertFails(getDocs(collection(c, `couples/${CID}/nha3dPresence`)));
    await assertFails(setDoc(presence(c, uid || "anonymous"), payload(uid || "anonymous")));
    await assertFails(deleteDoc(presence(c, ALICE)));
  }
});

test("members cannot forge partner UID, write across houses or abuse broad legacy allow", async () => {
  const a = db(ALICE), b = db(BOB);
  await assertFails(setDoc(presence(a, BOB), payload(BOB)));
  await assertFails(setDoc(presence(b, ALICE), payload(BOB)));
  await assertFails(setDoc(presence(a, ALICE, OTHER), payload(ALICE)));
  await assertFails(setDoc(doc(a, `couples/${CID}/nha3dPresence/${ALICE}/nested/x`), { hijack: true }));
  const original = await assertSucceeds(getDoc(doc(a, `couples/${CID}/notes/legacy`)));
  assert.equal(original.data().body, "unchanged");
  await assertSucceeds(updateDoc(doc(a, `couples/${CID}/notes/legacy`), { body: "updated" }));
  // Existing ledger+room object protections from M0 candidate must survive.
  await assertFails(updateDoc(doc(a, `couples/${CID}/roomObjects/existing`), { revision: 999 }));
  await assertFails(setDoc(doc(a, `couples/${CID}/writeOps/forged`), { hacked: true }));
});

test("schema allowlist refuses unrecognized fields, wrong room, bounds and invalid session", async () => {
  const a = db(ALICE), target = presence(a, ALICE);
  const bad = [
    { extra: "unexpected" },
    { room: "private-room" }, { room: 5 },
    { i: -1 }, { i: 16 }, { i: 1.5 }, { j: -1 }, { j: 14 }, { j: "10" },
    { sessionId: "short" }, { sessionId: "bad session string" },
    { seq: 0 }, { seq: -2 }, { seq: 1.5 }, { seq: 1_000_000_001 },
  ];
  for (const patch of bad) {
    await assertFails(setDoc(target, { ...payload(ALICE), ...patch }));
  }
  assert.equal((await assertSucceeds(getDoc(target))).exists(), false);
});

test("timestamp and short TTL must be controlled by server clock, not client claims", async () => {
  const a = db(ALICE), target = presence(a, ALICE);
  await assertFails(setDoc(target, payload(ALICE, {
    updatedAt: Timestamp.fromMillis(Date.now()),
  })));
  await assertFails(setDoc(target, payload(ALICE, {
    expiresAt: Timestamp.fromMillis(Date.now() + 600_000),
  })));
  await assertFails(setDoc(target, payload(ALICE, {
    expiresAt: Timestamp.fromMillis(Date.now() - 1_000),
  })));
  await assertSucceeds(setDoc(target, payload(ALICE)));
});

test("updates reject stale sequence, out-of-order replay and active-session takeover", async () => {
  await outdated();
  const a = db(ALICE), target = presence(a, ALICE);
  await assertFails(setDoc(target, payload(ALICE, { seq: 7 })));
  await assertFails(setDoc(target, payload(ALICE, { seq: 6 })));
  await assertFails(setDoc(target, payload(ALICE, {
    sessionId: SESSION_B, seq: 1,
  })));
  await assertSucceeds(setDoc(target, payload(ALICE, { seq: 8, room: "ngu", i: 8, j: 0 })));
  assert.equal((await getDoc(target)).data().seq, 8);
  await assertFails(setDoc(target, payload(ALICE, { seq: 9 })));
  assert.equal((await getDoc(target)).data().seq, 8);
});

test("expired session may be replaced by a fresh session, but not by a stale replay", async () => {
  await outdated(ALICE, true);
  const a = db(ALICE), target = presence(a, ALICE);
  await assertSucceeds(setDoc(target, payload(ALICE, {
    sessionId: SESSION_B, seq: 1, room: "bep", i: 0, j: 10,
  })));
  const state = (await getDoc(target)).data();
  assert.equal(state.sessionId, SESSION_B);
  await assertFails(setDoc(target, payload(ALICE, { seq: 100, sessionId: SESSION_A })));
  await assertFails(setDoc(target, payload(ALICE, { seq: 1, sessionId: SESSION_B })));
});

test("no client including owner can delete presence while a session is active", async () => {
  const a = db(ALICE), b = db(BOB);
  await assertSucceeds(setDoc(presence(a, ALICE), payload(ALICE)));
  // An older client authenticating as Alice cannot be distinguished from a
  // new Alice client by the previous owner-only delete rule. Deny both.
  await assertFails(deleteDoc(presence(b, ALICE)));
  await assertFails(deleteDoc(presence(a, ALICE)));
  const stillPresent = await assertSucceeds(getDoc(presence(b, ALICE)));
  assert.equal(stillPresent.exists(), true);
  assert.equal(stillPresent.data().sessionId, SESSION_A);
});

test("revoking Alice membership immediately denies her reading/writing despite old presence", async () => {
  await assertSucceeds(setDoc(presence(db(ALICE), ALICE), payload(ALICE)));
  await env.withSecurityRulesDisabled(async admin => {
    await updateDoc(doc(admin.firestore(), `couples/${CID}`), { members: [BOB] });
  });
  await assertFails(getDoc(presence(db(ALICE), ALICE)));
  await assertFails(setDoc(presence(db(ALICE), ALICE), payload(ALICE, { seq: 2 })));
  await assertFails(deleteDoc(presence(db(ALICE), ALICE)));
  assert.equal((await assertSucceeds(getDoc(presence(db(BOB), ALICE)))).exists(), true);
});
