import { before, after, beforeEach, test } from "node:test";
import { readFileSync } from "node:fs";
import { strict as assert } from "node:assert";
import {
  initializeTestEnvironment, assertFails, assertSucceeds,
} from "@firebase/rules-unit-testing";
import {
  doc, getDoc, setDoc, updateDoc, deleteDoc, writeBatch,
} from "firebase/firestore";
import { applyVersionedPatch } from "../../src/versioned-write.mjs";

// Candidate Rules only, NEVER production. Separate test process serializes suites.
if (!/^(127\.0\.0\.1|localhost):[0-9]+$/.test(process.env.FIRESTORE_EMULATOR_HOST || "")) {
  throw new Error("M0 candidate Rules require local Firestore Emulator");
}
const ALICE = "fixture-alice", BOB = "fixture-bob", EVE = "fixture-outsider";
const CID = "fixture-couple";
const targetPath = `couples/${CID}/roomObjects/versioned-room`;
const ledgerPath = id => `couples/${CID}/writeOps/${id}`;
let env;
const client = uid => uid ? env.authenticatedContext(uid).firestore() :
  env.unauthenticatedContext().firestore();
const target = db => doc(db, targetPath);
const ledger = (db, id) => doc(db, ledgerPath(id));
const mutate = (db, actorUid, operationId, expectedRevision, patch) => applyVersionedPatch({
  db, targetRef: target(db), operationRef: ledger(db, operationId),
  actorUid, operationId, expectedRevision, patch,
  allowedFields: ["left", "right", "name"], secureProtocol: true,
});

before(async () => {
  const [host, portText] = process.env.FIRESTORE_EMULATOR_HOST.split(":");
  env = await initializeTestEnvironment({
    projectId: "demo-goc-nho-safety",
    firestore: {
      host, port: Number(portText),
      rules: readFileSync("tests/firebase/fixtures/m0-versioned.rules", "utf8"),
    },
  });
});
after(async () => { if (env) await env.cleanup(); });
beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async ctx => {
    const db = ctx.firestore();
    await setDoc(doc(db, `couples/${CID}`), {
      members: [ALICE, BOB], roles: { [ALICE]: 0, [BOB]: 1 }, code: "TEST-ONLY",
    });
    await setDoc(doc(db, targetPath), {
      revision: 0, left: "old", right: "old", name: "keep",
    });
    await setDoc(doc(db, `couples/${CID}/notes/legacy`), { body: "legacy preserved" });
  });
});

test("candidate Rules accept authenticated atomic write, retry and partner follow-up", async () => {
  const a = client(ALICE), b = client(BOB);
  const first = await assertSucceeds(mutate(a, ALICE, "op-alice", 0, { left: "A" }));
  assert.deepEqual(first, { status: "applied", revision: 1 });
  assert.deepEqual(await assertSucceeds(mutate(a, ALICE, "op-alice", 0, { left: "A" })),
    { status: "replayed", revision: 1 });
  await assertSucceeds(mutate(b, BOB, "op-bob", 1, { right: "B" }));
  const latest = (await assertSucceeds(getDoc(target(a)))).data();
  assert.equal(latest.revision, 2);
  assert.equal(latest.left, "A");
  assert.equal(latest.right, "B");
  assert.equal(latest.name, "keep");
  assert.equal(latest.updatedBy, BOB);
  assert.equal(latest.lastOperationId, "op-bob");
  assert.equal((await getDoc(ledger(b, "op-alice"))).data().actorUid, ALICE);
});

test("outsiders and anonymous clients cannot read or create protected records", async () => {
  for (const uid of [EVE, null]) {
    const db = client(uid);
    await assertFails(getDoc(target(db)));
    await assertFails(getDoc(ledger(db, "any")));
    await assertFails(setDoc(target(db), { revision: 999 }));
    await assertFails(setDoc(ledger(db, "fake"), { operationId: "fake" }));
  }
  await assertFails(mutate(client(EVE), EVE, "eve-op", 0, { left: "E" }));
});

test("legacy recursive wildcard cannot bypass direct ledger and target protection", async () => {
  const a = client(ALICE);
  await assertFails(updateDoc(target(a), { left: "bypass", revision: 1 }));
  await assertFails(updateDoc(target(a), { revision: 100, lastOperationId: "none", updatedBy: ALICE }));
  await assertFails(setDoc(ledger(a, "forged"), {
    operationId: "forged", actorUid: ALICE, targetId: "versioned-room",
    targetPath, expectedRevision: 0, appliedRevision: 1, fingerprint: "malicious",
  }));
  await assertFails(deleteDoc(target(a)));
  await assertFails(setDoc(target(a), { revision: 0, left: "replacement" }));
  // Existing collections and their member access remain unchanged by the candidate.
  assert.equal((await assertSucceeds(getDoc(doc(a, `couples/${CID}/notes/legacy`)))).data().body,
    "legacy preserved");
  await assertSucceeds(updateDoc(doc(a, `couples/${CID}/notes/legacy`), { body: "allowed" }));
});

test("writeOps cannot be edited or deleted even by members after commit", async () => {
  const a = client(ALICE), b = client(BOB);
  await assertSucceeds(mutate(a, ALICE, "immutable-op", 0, { left: "A" }));
  await assertFails(updateDoc(ledger(a, "immutable-op"), { fingerprint: "rewritten" }));
  await assertFails(deleteDoc(ledger(b, "immutable-op")));
  await assertFails(setDoc(ledger(b, "immutable-op"), {
    actorUid: BOB, operationId: "immutable-op", fingerprint: "replaced",
  }));
  assert.equal((await assertSucceeds(getDoc(ledger(a, "immutable-op")))).data().actorUid, ALICE);
});

test("a member cannot spoof another member's actor identity in an atomic write", async () => {
  const a = client(ALICE);
  await assert.rejects(mutate(a, BOB, "spoof", 0, { left: "bad" }));
  assert.equal((await assertSucceeds(getDoc(target(a)))).data().revision, 0);
  assert.equal((await assertSucceeds(getDoc(ledger(a, "spoof")))).exists(), false);
});

test("ledger alone, wrong target, and mismatched revision cannot commit in a batch", async () => {
  const a = client(ALICE);
  const forgedLedger = {
    operationId: "batch-op", actorUid: ALICE,
    targetPath, targetId: "versioned-room",
    expectedRevision: 0, appliedRevision: 1, fingerprint: "fake",
  };
  const onlyLedger = writeBatch(a);
  onlyLedger.set(ledger(a, "batch-op"), forgedLedger);
  await assertFails(onlyLedger.commit());

  const wrongTarget = writeBatch(a);
  wrongTarget.update(target(a), {
    left: "wrong", revision: 1, updatedBy: ALICE, lastOperationId: "batch-op",
  });
  wrongTarget.set(ledger(a, "batch-op"), { ...forgedLedger, targetId: "elsewhere" });
  await assertFails(wrongTarget.commit());

  const badRevision = writeBatch(a);
  badRevision.update(target(a), {
    left: "jump", revision: 7, updatedBy: ALICE, lastOperationId: "batch-op",
  });
  badRevision.set(ledger(a, "batch-op"), { ...forgedLedger, appliedRevision: 7 });
  await assertFails(badRevision.commit());
  assert.equal((await getDoc(target(a))).data().revision, 0);
});

test("two members racing at revision zero cannot both land; stale op has no ledger", async () => {
  const a = client(ALICE), b = client(BOB);
  const results = await Promise.allSettled([
    mutate(a, ALICE, "race-a", 0, { left: "A" }),
    mutate(b, BOB, "race-b", 0, { right: "B" }),
  ]);
  assert.equal(results.filter(r => r.status === "fulfilled").length, 1);
  assert.equal(results.filter(r => r.status === "rejected").length, 1);
  assert.match(String(results.find(r => r.status === "rejected").reason), /STALE_REVISION/);
  assert.equal((await getDoc(target(a))).data().revision, 1);
  const records = await Promise.all(["race-a", "race-b"].map(id => getDoc(ledger(a, id))));
  assert.equal(records.filter(r => r.exists()).length, 1);
});
