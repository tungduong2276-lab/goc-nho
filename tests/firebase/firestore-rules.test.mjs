import { before, after, beforeEach, test } from "node:test";
import { readFileSync } from "node:fs";
import { strict as assert } from "node:assert";
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
} from "@firebase/rules-unit-testing";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";

// Must run under the dedicated Firestore Emulator. Never instantiate a production client.
if (!process.env.FIRESTORE_EMULATOR_HOST) {
  throw new Error("M0 tests require FIRESTORE_EMULATOR_HOST; refusing production access");
}
if (!process.env.FIRESTORE_EMULATOR_HOST.startsWith("127.0.0.1:") &&
    !process.env.FIRESTORE_EMULATOR_HOST.startsWith("localhost:")) {
  throw new Error("M0 tests only accept a loopback emulator address");
}

const projectId = "demo-goc-nho-safety";
const ALICE = "fixture-alice";
const BOB = "fixture-bob";
const EVE = "fixture-outsider";
const CID = "fixture-couple";
let env;

const context = uid => uid ? env.authenticatedContext(uid) : env.unauthenticatedContext();
const ref = (uid, path) => doc(context(uid).firestore(), path);
const couple = () => `couples/${CID}`;

before(async () => {
  const address = process.env.FIRESTORE_EMULATOR_HOST;
  const [host, portText] = address.split(":");
  assert(Number.isInteger(Number(portText)) && Number(portText) > 0);
  env = await initializeTestEnvironment({
    projectId,
    firestore: {
      host,
      port: Number(portText),
      rules: readFileSync("firestore.rules", "utf8"),
    },
  });
});

after(async () => {
  if (env) await env.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async ctx => {
    const fs = ctx.firestore();
    await setDoc(doc(fs, couple()), {
      members: [ALICE, BOB],
      roles: { [ALICE]: 0, [BOB]: 1 },
      code: "TEST-ONLY",
    });
    await setDoc(doc(fs, `${couple()}/notes/memory`), { id: "memory", body: "synthetic" });
    await setDoc(doc(fs, "users/" + ALICE), { cid: CID });
  });
});

test("profile: only the owner can read or edit their user document", async () => {
  await assertSucceeds(getDoc(ref(ALICE, "users/" + ALICE)));
  await assertSucceeds(setDoc(ref(ALICE, "users/" + ALICE), { cid: CID, safe: true }));
  await assertFails(getDoc(ref(BOB, "users/" + ALICE)));
  await assertFails(setDoc(ref(EVE, "users/" + ALICE), { cid: "other" }));
  await assertFails(getDoc(ref(null, "users/" + ALICE)));
});

test("couple metadata: two members read but outsider and anonymous clients cannot", async () => {
  for (const uid of [ALICE, BOB]) {
    await assertSucceeds(getDoc(ref(uid, couple())));
  }
  await assertFails(getDoc(ref(EVE, couple())));
  await assertFails(getDoc(ref(null, couple())));
});

test("nested couple data: both members may read and write; outsiders cannot", async () => {
  const path = `${couple()}/notes/memory`;
  await assertSucceeds(getDoc(ref(ALICE, path)));
  await assertSucceeds(getDoc(ref(BOB, path)));
  await assertSucceeds(setDoc(ref(BOB, `${couple()}/notes/new`), { id: "new", body: "test" }));
  await assertFails(getDoc(ref(EVE, path)));
  await assertFails(setDoc(ref(EVE, path), { body: "tamper" }));
  await assertFails(deleteDoc(ref(null, path)));
});

test("couple membership: cannot add a third member to an occupied house", async () => {
  await assertFails(updateDoc(ref(ALICE, couple()), {
    members: [ALICE, BOB, EVE],
  }));
  await assertFails(updateDoc(ref(EVE, couple()), { code: "hijacked" }));
});

test("couple membership: authenticated second partner can join a one-person house", async () => {
  const single = "couples/fixture-single";
  await env.withSecurityRulesDisabled(async ctx => {
    await setDoc(doc(ctx.firestore(), single), {
      members: [ALICE], roles: { [ALICE]: 0 }, code: "JOIN-TEST",
    });
  });
  await assertSucceeds(updateDoc(ref(BOB, single), {
    members: [ALICE, BOB],
  }));
  await assertFails(updateDoc(ref(EVE, single), {
    members: [ALICE, BOB, EVE],
  }));
});

test("invitation code: signed-in user can get, anonymous client cannot", async () => {
  await env.withSecurityRulesDisabled(async ctx => {
    await setDoc(doc(ctx.firestore(), "codes/TEST-ONLY"), { cid: CID });
  });
  await assertSucceeds(getDoc(ref(EVE, "codes/TEST-ONLY")));
  await assertFails(getDoc(ref(null, "codes/TEST-ONLY")));
});

test("SECURITY GAP: both members can read nested unreleased gift payload under current rules", async () => {
  const path = `${couple()}/gifts/unreleased`;
  await env.withSecurityRulesDisabled(async ctx => {
    await setDoc(doc(ctx.firestore(), path), {
      unlockAt: "2099-01-01T00:00:00.000Z",
      payload: "SYNTHETIC_SECRET_NEVER_USE_REAL_DATA",
    });
  });
  // This test documents current behavior. It is NOT a security acceptance test for M3.
  // M3 must prevent early reads through separate protected payload and trusted release.
  const result = await assertSucceeds(getDoc(ref(BOB, path)));
  assert.equal(result.data().payload, "SYNTHETIC_SECRET_NEVER_USE_REAL_DATA");
});

test("two simulated members converge when writing distinct Firestore documents", async () => {
  const alicePath = `${couple()}/shared/alice-write`;
  const bobPath = `${couple()}/shared/bob-write`;
  // Separate authenticated clients write simultaneously; neither uses production data.
  await Promise.all([
    assertSucceeds(setDoc(ref(ALICE, alicePath), { from: ALICE, revision: 1 })),
    assertSucceeds(setDoc(ref(BOB, bobPath), { from: BOB, revision: 1 })),
  ]);
  const [seenByBob, seenByAlice] = await Promise.all([
    assertSucceeds(getDoc(ref(BOB, alicePath))),
    assertSucceeds(getDoc(ref(ALICE, bobPath))),
  ]);
  assert.equal(seenByBob.data().from, ALICE);
  assert.equal(seenByAlice.data().from, BOB);
});

test("KNOWN RISK: stale whole-document set overwrites the other partner's field", async () => {
  const path = `${couple()}/shared/stale-document`;
  await env.withSecurityRulesDisabled(async ctx => {
    await setDoc(doc(ctx.firestore(), path), { left: "old", right: "old" });
  });
  const [viewA, viewB] = await Promise.all([
    assertSucceeds(getDoc(ref(ALICE, path))),
    assertSucceeds(getDoc(ref(BOB, path))),
  ]);
  await assertSucceeds(setDoc(ref(ALICE, path), { ...viewA.data(), left: "new-A" }));
  await assertSucceeds(setDoc(ref(BOB, path), { ...viewB.data(), right: "new-B" }));
  const final = await assertSucceeds(getDoc(ref(ALICE, path)));
  // Mirrors current put(col,obj) behavior. M1 must use revisions/transactions.
  assert.equal(final.data().left, "old");
  assert.equal(final.data().right, "new-B");
});

test("M0 baseline: independent field updates from both members preserve both changes", async () => {
  const path = `${couple()}/shared/field-patches`;
  await env.withSecurityRulesDisabled(async ctx => {
    await setDoc(doc(ctx.firestore(), path), {
      left: "old", right: "old", untouched: "preserve",
    });
  });
  // updateDoc applies field-level patches; unlike the current generic put/set,
  // neither client replaces a stale snapshot of the entire document.
  await Promise.all([
    assertSucceeds(updateDoc(ref(ALICE, path), { left: "new-A" })),
    assertSucceeds(updateDoc(ref(BOB, path), { right: "new-B" })),
  ]);
  const [seenByAlice, seenByBob] = await Promise.all([
    assertSucceeds(getDoc(ref(ALICE, path))),
    assertSucceeds(getDoc(ref(BOB, path))),
  ]);
  for (const snapshot of [seenByAlice, seenByBob]) {
    assert.equal(snapshot.data().left, "new-A");
    assert.equal(snapshot.data().right, "new-B");
    assert.equal(snapshot.data().untouched, "preserve");
  }
});

test("invitation code collision: existing code cannot be overwritten by a second creator", async () => {
  await env.withSecurityRulesDisabled(async ctx => {
    await setDoc(doc(ctx.firestore(), "codes/EXISTING"), { cid: CID });
  });
  await assertFails(setDoc(ref(EVE, "codes/EXISTING"), { cid: "attacker-house" }));
  const existing = await assertSucceeds(getDoc(ref(ALICE, "codes/EXISTING")));
  assert.equal(existing.data().cid, CID);
});

test("membership join rejects changing roles or invitation code", async () => {
  const path = "couples/fixture-join-immutable";
  await env.withSecurityRulesDisabled(async ctx => {
    await setDoc(doc(ctx.firestore(), path), {
      members: [ALICE], roles: { [ALICE]: 0 }, code: "JOIN-IMMUTABLE",
    });
  });
  await assertFails(updateDoc(ref(BOB, path), {
    members: [ALICE, BOB],
    roles: { [ALICE]: 0, [BOB]: 0 },
  }));
  await assertFails(updateDoc(ref(BOB, path), {
    members: [ALICE, BOB], code: "REPLACED",
  }));
  const after = await assertSucceeds(getDoc(ref(ALICE, path)));
  assert.deepEqual(after.data().members, [ALICE]);
  assert.equal(after.data().code, "JOIN-IMMUTABLE");
});

test("outsider cannot read or write even when nested fixture is malformed", async () => {
  const path = `${couple()}/notes/malformed`;
  await env.withSecurityRulesDisabled(async ctx => {
    await setDoc(doc(ctx.firestore(), path), {
      id: "malformed", body: null, unexpected: { nested: true },
    });
  });
  await assertFails(getDoc(ref(EVE, path)));
  await assertFails(updateDoc(ref(EVE, path), { body: "tampered" }));
  await assertSucceeds(getDoc(ref(ALICE, path)));
});
