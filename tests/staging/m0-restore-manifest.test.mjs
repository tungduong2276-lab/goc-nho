import { test } from "node:test";
import { strict as assert } from "node:assert";
import {
  createSyntheticManifest, compareSyntheticRestore, ManifestError,
} from "../../scripts/m0-restore-manifest.mjs";

const fixture = () => [
  { path: "couples/fixture-couple", fields: {
    members: ["fixture-alice", "fixture-bob"], code: "FIXTURE-CODE",
  }},
  { path: "couples/fixture-couple/notes/memory", fields: {
    body: "synthetic only", counters: { z: 2, a: 1 },
    createdAt: { __firestoreType: "timestamp", seconds: 1730000000, nanoseconds: 123 },
  }},
  { path: "couples/fixture-couple/notes/memory/comments/entry-1", fields: {
    message: "nested", owner: "fixture-alice",
  }},
  { path: "users/fixture-alice", fields: { cid: "fixture-couple" }},
  { path: "codes/FIXTURE-CODE", fields: { cid: "fixture-couple" }},
];

test("same synthetic nested records match regardless of document/field insertion order", () => {
  const original = fixture();
  const manifest = createSyntheticManifest(original);
  const swapped = [...original].reverse();
  swapped[3] = { path: "couples/fixture-couple/notes/memory", fields: {
    createdAt: { nanoseconds: 123, seconds: 1730000000, __firestoreType: "timestamp" },
    counters: { a: 1, z: 2 }, body: "synthetic only",
  }};
  const result = compareSyntheticRestore(manifest, swapped);
  assert.equal(manifest.count, 5);
  assert.equal(result.status, "SYNTHETIC_MANIFEST_MATCH");
  assert.equal(result.expectedRootHash, result.actualRootHash);
  assert.deepEqual(result.missing, []);
  assert.equal(result.verifiedAgainstCloud, false);
  assert.equal(result.backupRestoreExecuted, false);
});

test("missing nested document is detected despite other documents matching", () => {
  const rows = fixture(), manifest = createSyntheticManifest(rows);
  const outcome = compareSyntheticRestore(manifest, rows.filter(r => !r.path.includes("/comments/")));
  assert.equal(outcome.status, "SYNTHETIC_MANIFEST_MISMATCH");
  assert.deepEqual(outcome.missing, ["couples/fixture-couple/notes/memory/comments/entry-1"]);
  assert.deepEqual(outcome.changed, []);
});

test("extra document in target is detected as nonempty/dirty destination", () => {
  const rows = fixture(), manifest = createSyntheticManifest(rows);
  const outcome = compareSyntheticRestore(manifest, [
    ...rows, { path: "couples/fixture-couple/notes/extra", fields: { x: "extra" }},
  ]);
  assert.equal(outcome.status, "SYNTHETIC_MANIFEST_MISMATCH");
  assert.deepEqual(outcome.extra, ["couples/fixture-couple/notes/extra"]);
});

test("tampered timestamp precision and text fields are detected", () => {
  const rows = fixture(), manifest = createSyntheticManifest(rows);
  const changed = rows.map(r => structuredClone(r));
  changed[1].fields.createdAt.nanoseconds = 124;
  changed[1].fields.body = "changed";
  const outcome = compareSyntheticRestore(manifest, changed);
  assert.deepEqual(outcome.changed, ["couples/fixture-couple/notes/memory"]);
});

test("duplicate paths are rejected even when contents are identical", () => {
  const rows = fixture();
  assert.throws(() => createSyntheticManifest([...rows, rows[0]]), /DUPLICATE_DOCUMENT/);
});

test("rejects production-looking and out-of-scope paths", () => {
  for (const path of [
    "couples/real-user", "users/real-user", "codes/REAL-CODE",
    "production/fixture-couple", "couples/fixture-couple/notes",
    "couples/fixture-couple//memory", "couples/fixture-couple/notes/../memory",
  ]) assert.throws(() => createSyntheticManifest([{ path, fields: { safe: true } }]),
    error => error instanceof ManifestError);
});

test("rejects non-JSON data and malicious prototype keys", () => {
  const rows = fixture();
  for (const fields of [
    { n: NaN }, { obj: new Date() }, { missing: undefined },
    JSON.parse('{"__proto__":{"polluted":true}}'),
    { value: BigInt(4) },
  ]) assert.throws(() => createSyntheticManifest([{ path: rows[0].path, fields }]),
    error => error instanceof ManifestError);
});

test("rejects unsafe oversized documents, excessive nesting and empty manifests", () => {
  assert.throws(() => createSyntheticManifest([]), /INVALID_DOCUMENT_COUNT/);
  assert.throws(() => createSyntheticManifest([{
    path: "couples/fixture-couple", fields: { content: "x".repeat(66000) },
  }]), /DOCUMENT_TOO_LARGE/);
  let deep = "leaf";
  for (let i = 0; i < 30; i++) deep = { nested: deep };
  assert.throws(() => createSyntheticManifest([{
    path: "couples/fixture-couple", fields: { deep },
  }]), /NESTING_LIMIT/);
});

test("rejects altered, unsorted or fabricated expected manifest", () => {
  const expected = createSyntheticManifest(fixture());
  for (const mutation of [
    m => { m.documents[0].hash = "a".repeat(64); },
    m => { m.documents.reverse(); },
    m => { m.count += 1; },
    m => { m.syntheticOnly = false; },
    m => { m.source = "CLOUD_VERIFIED"; },
  ]) {
    const copy = structuredClone(expected);
    mutation(copy);
    assert.throws(() => compareSyntheticRestore(copy, fixture()),
      error => error instanceof ManifestError);
  }
});

test("input fixture remains unchanged, hash remains deterministic", () => {
  const original = fixture();
  const before = structuredClone(original);
  const a = createSyntheticManifest(original);
  const b = createSyntheticManifest(fixture());
  assert.deepEqual(original, before);
  assert.equal(a.rootHash, b.rootHash);
});
