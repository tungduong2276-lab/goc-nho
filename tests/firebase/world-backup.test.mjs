import { after, before, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { assertFails, initializeTestEnvironment } from "@firebase/rules-unit-testing";
import { collection, doc, getDoc, getDocs, runTransaction, setDoc, Timestamp } from "firebase/firestore";
import { MAX_POINTS, MAX_STROKES } from "../../nha3d/creative.mjs";
import {
  encodeSyntheticWorldBackup, planSyntheticWorldRestore, readSyntheticWorldBackup,
} from "../../scripts/m0-world-backup.mjs";

const endpoint = /^(127\.0\.0\.1|localhost):([0-9]+)$/.exec(process.env.FIRESTORE_EMULATOR_HOST || "");
if (!endpoint) throw new Error("World backup tests require a loopback Firestore Emulator");

const source = "fixture-couple";
const destination = "fixture-restore";
const alice = "fixture-alice";
const bob = "fixture-bob";
const projectId = "demo-goc-nho-safety";
const canonicalRoot = "couples/" + source + "/world/";
const ref = (db, cid, id) => doc(db, "couples", cid, "world", id);
let env, first, second, outsider;

before(async () => {
  env = await initializeTestEnvironment({
    projectId,
    firestore: { host: endpoint[1], port: Number(endpoint[2]), rules: readFileSync("firestore.rules", "utf8") },
  });
  first = env.authenticatedContext(alice).firestore();
  second = env.authenticatedContext(bob).firestore();
  outsider = env.authenticatedContext("fixture-outsider").firestore();
});
after(async () => { await env?.cleanup(); });
beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async ctx => {
    for (const id of [source, destination]) {
      await setDoc(doc(ctx.firestore(), "couples", id), { members: [alice, bob] });
    }
  });
});

// Test adapter for the field types currently used by the world. Only real
// SDK Timestamp objects are tagged on export, and their stored precision is used.
function mapFields(value, convert) {
  if (Array.isArray(value)) return value.map(item => mapFields(item, convert));
  if (value === null || typeof value !== "object") return value;
  const converted = convert(value);
  if (converted !== value) return converted;
  if (Object.getPrototypeOf(value) !== Object.prototype) throw new Error("Unsupported fixture field type");
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, mapFields(item, convert)]));
}
const encode = data => mapFields(data, value => value instanceof Timestamp
  ? { __firestoreType: "timestamp", seconds: value.seconds, nanoseconds: value.nanoseconds }
  : value);
const decode = data => mapFields(data, value => value.__firestoreType === "timestamp"
  ? new Timestamp(value.seconds, value.nanoseconds)
  : value);
const row = snapshot => ({ path: canonicalRoot + snapshot.id, fields: encode(snapshot.data()) });

async function readWorld(db, cid) {
  const snapshot = await getDocs(collection(db, "couples", cid, "world"));
  return snapshot.docs.map(row);
}

async function restore(db, json, afterRead = async () => {}) {
  const backup = readSyntheticWorldBackup(json);
  assert.equal(backup.status, "VERIFIED_WORLD");
  const refs = backup.records.map(record => ref(db, destination, record.path.slice(canonicalRoot.length)));
  return runTransaction(db, async tx => {
    const snapshots = await Promise.all(refs.map(target => tx.get(target)));
    const current = snapshots.filter(snapshot => snapshot.exists()).map(row);
    await afterRead();
    const plan = planSyntheticWorldRestore(json, current);
    for (const record of plan.create) {
      tx.set(ref(db, destination, record.path.slice(canonicalRoot.length)), decode(record.fields));
    }
    return plan.status;
  });
}

test("isolated destination preserves Firestore timestamps and a maximum-size shared canvas", async () => {
  const ts = new Timestamp(1730000000, 123456789);
  const points = Array.from({ length: MAX_POINTS }, (_, i) => ({ x: (101 + i) / 1000, y: 0.987 }));
  const strokes = Array.from({ length: 2 * MAX_STROKES }, (_, i) => ({
    id: "stroke" + i, by: i < MAX_STROKES ? "anh" : "em", at: 1730000000000 + i,
    color: "#1D2B4F", width: 5, points,
  }));
  await setDoc(ref(first, source, "cc_art_canvas"), {
    k: "creative-art", id: "canvas", title: "Shared canvas fixture", strokes, ts,
  });
  await setDoc(ref(first, source, "l_home"), { k: "life", state: { v: 1 }, ts });
  await setDoc(ref(first, source, "p_anh"), { k: "presence", ts });

  const sourceRows = await readWorld(first, source);
  const canvas = sourceRows.find(record => record.path.endsWith("/cc_art_canvas"));
  assert.ok(Buffer.byteLength(JSON.stringify(canvas.fields), "utf8") > 64 * 1024);
  assert.equal(canvas.fields.ts.nanoseconds, 123456000);

  const json = encodeSyntheticWorldBackup(sourceRows);
  assert.deepEqual(await readWorld(second, destination), []);
  assert.equal(await restore(first, json), "READY");
  const restoredJson = encodeSyntheticWorldBackup(await readWorld(second, destination));
  assert.deepEqual(readSyntheticWorldBackup(restoredJson).manifest, readSyntheticWorldBackup(json).manifest);
  const result = (await getDoc(ref(second, destination, "cc_art_canvas"))).data();
  assert.ok(result.ts instanceof Timestamp);
  assert.equal(result.ts.seconds, ts.seconds);
  assert.equal(result.ts.nanoseconds, 123456000);
  assert.equal(result.strokes.length, 2 * MAX_STROKES);
  assert.equal(result.strokes.at(-1).points.length, MAX_POINTS);
  assert.equal((await getDoc(ref(second, destination, "p_anh"))).exists(), false);
  assert.equal((await getDoc(ref(second, source, "p_anh"))).exists(), true);
  assert.equal(await restore(first, json), "ALREADY_RESTORED");
  await assertFails(getDoc(ref(outsider, destination, "cc_art_canvas")));
});

test("an edit after the transaction read prevents all restore writes", async () => {
  const room = { k: "meta", scene: "nha", wall: "#ABCDEF", floor: "#123456" };
  await setDoc(ref(first, source, "m_nha"), room);
  await setDoc(ref(first, source, "l_home"), { k: "life", state: { v: 1 } });
  const json = encodeSyntheticWorldBackup(await readWorld(first, source));

  await setDoc(ref(first, destination, "m_nha"), room);
  const preview = planSyntheticWorldRestore(json, await readWorld(first, destination));
  assert.equal(preview.status, "READY");
  assert.deepEqual(preview.create.map(record => record.path), [canonicalRoot + "l_home"]);

  let attempts = 0;
  const partnerEdit = { ...room, wall: "#654321" };
  const status = await restore(first, json, async () => {
    attempts++;
    if (attempts === 1) await setDoc(ref(second, destination, "m_nha"), partnerEdit);
  });
  assert.equal(status, "CONFLICT");
  assert.ok(attempts >= 2);
  assert.deepEqual((await getDoc(ref(second, destination, "m_nha"))).data(), partnerEdit);
  assert.equal((await getDoc(ref(second, destination, "l_home"))).exists(), false);
  assert.deepEqual((await getDoc(ref(first, source, "m_nha"))).data(), room);
});
