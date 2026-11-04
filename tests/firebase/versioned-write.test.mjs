import { before, after, beforeEach, test } from "node:test";
import { readFileSync } from "node:fs";
import { strict as assert } from "node:assert";
import { initializeTestEnvironment, assertSucceeds } from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { applyVersionedPatch } from "../../src/versioned-write.mjs";

if (!/^(127\.0\.0\.1|localhost):[0-9]+$/.test(process.env.FIRESTORE_EMULATOR_HOST || "")) {
  throw new Error("M0 transactional tests require a loopback Firestore Emulator");
}
const CID = "fixture-couple";
const ALICE = "fixture-alice";
const BOB = "fixture-bob";
const EVE = "fixture-outsider";
const TARGET = `couples/${CID}/shared/versioned-room`;
let env;
const client = uid => env.authenticatedContext(uid).firestore();
const target = db => doc(db, TARGET);
const operation = (db, id) => doc(db, `couples/${CID}/writeOps/${id}`);
const mutate = (db, uid, id, expectedRevision, patch) => applyVersionedPatch({
  db, targetRef: target(db), operationRef: operation(db, id),
  operationId: id, actorUid: uid, expectedRevision, patch,
  allowedFields: ["left", "right", "name"],
});
before(async () => {
  const [host, portText] = process.env.FIRESTORE_EMULATOR_HOST.split(":");
  env = await initializeTestEnvironment({
    projectId: "demo-goc-nho-safety",
    firestore: { host, port: Number(portText), rules: readFileSync("firestore.rules", "utf8") },
  });
});
after(async () => { if (env) await env.cleanup(); });
beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async ctx => {
    const db = ctx.firestore();
    await setDoc(doc(db, `couples/${CID}`), {
      members: [ALICE, BOB], roles: { [ALICE]: 0, [BOB]: 1 }, code: "SYNTHETIC",
    });
    await setDoc(doc(db, TARGET), { revision: 0, left: "old", right: "old", name: "keep" });
  });
});

test("first write increments revision once; identical retried operation is idempotent", async () => {
  const a = client(ALICE), b = client(BOB);
  const first = await assertSucceeds(mutate(a, ALICE, "op-1", 0, { left: "new" }));
  assert.deepEqual(first, { status: "applied", revision: 1 });
  const again = await assertSucceeds(mutate(a, ALICE, "op-1", 0, { left: "new" }));
  assert.deepEqual(again, { status: "replayed", revision: 1 });
  const snapshot = await assertSucceeds(getDoc(target(b)));
  assert.deepEqual(snapshot.data(), { revision: 1, left: "new", right: "old", name: "keep" });
  const record = await assertSucceeds(getDoc(operation(b, "op-1")));
  assert.equal(record.data().appliedRevision, 1);
});

test("replaying an old operation after a partner's newer write does not undo it", async () => {
  const a = client(ALICE), b = client(BOB);
  await mutate(a, ALICE, "left-one", 0, { left: "Alice" });
  await mutate(b, BOB, "right-one", 1, { right: "Bob" });
  const retry = await mutate(a, ALICE, "left-one", 0, { left: "Alice" });
  assert.deepEqual(retry, { status: "replayed", revision: 1 });
  assert.deepEqual((await getDoc(target(a))).data(), {
    revision: 2, left: "Alice", right: "Bob", name: "keep",
  });
});

test("stale revision and operation-ID reuse with changed payload are rejected", async () => {
  const a = client(ALICE), b = client(BOB);
  await mutate(a, ALICE, "update-once", 0, { left: "Alice" });
  await assert.rejects(mutate(b, BOB, "stale-other", 0, { right: "Bob" }), /STALE_REVISION/);
  await assert.rejects(mutate(a, ALICE, "update-once", 0, { left: "different" }), /OPERATION_ID_COLLISION/);
  assert.equal((await getDoc(target(b))).data().revision, 1);
  assert.equal((await getDoc(operation(b, "stale-other"))).exists(), false);
});

test("competing clients with the same expected revision never both commit", async () => {
  const a = client(ALICE), b = client(BOB);
  const results = await Promise.allSettled([
    mutate(a, ALICE, "race-a", 0, { left: "A" }),
    mutate(b, BOB, "race-b", 0, { right: "B" }),
  ]);
  assert.equal(results.filter(r => r.status === "fulfilled").length, 1);
  assert.equal(results.filter(r => r.status === "rejected").length, 1);
  assert.match(String(results.find(r => r.status === "rejected").reason), /STALE_REVISION/);
  const current = await getDoc(target(a));
  assert.equal(current.data().revision, 1);
});

test("outsider cannot modify target or create ledger record", async () => {
  const eve = client(EVE);
  await assert.rejects(mutate(eve, EVE, "outsider", 0, { left: "bad" }));
  assert.equal((await getDoc(target(client(ALICE)))).data().revision, 0);
  assert.equal((await getDoc(operation(client(ALICE), "outsider"))).exists(), false);
});

test("invalid refs, reserved fields and unsupported payloads fail before network writes", async () => {
  const a = client(ALICE);
  await assert.rejects(mutate(a, ALICE, "wrong-field", 0, { revision: 99 }), /INVALID_FIELDS/);
  await assert.rejects(mutate(a, ALICE, "unsupported", 0, { left: undefined }), /INVALID_PATCH_VALUE/);
  await assert.rejects(applyVersionedPatch({
    db: a, targetRef: target(a), operationRef: doc(a, `couples/${CID}/notes/op`),
    operationId: "bad-ref", actorUid: ALICE, expectedRevision: 0,
    patch: { left: "bad" }, allowedFields: ["left"],
  }), /INVALID_REFERENCE/);
  assert.equal((await getDoc(target(a))).data().revision, 0);
});
