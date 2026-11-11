import { test } from "node:test";
import assert from "node:assert/strict";
import { makeStagingPlan } from "../../scripts/m0-staging-preflight.mjs";
import { createSyntheticManifest } from "../../scripts/m0-restore-manifest.mjs";
import { reviewM0StagingEvidence, M0EvidenceError } from "../../scripts/m0-staging-evidence-review.mjs";

const preflight = () => makeStagingPlan({
  productionProject: "gocnho-live-prod",
  sourceProject: "gocnho-stage-src",
  targetProject: "gocnho-stage-dst",
  exportBucket: "gs://gocnho-m0-staging-backups",
  runId: "synthetic_20261104",
  sourceSyntheticConfirmed: true, targetEmptyConfirmed: true,
  sourceNotProductionConfirmed: true, targetNotProductionConfirmed: true,
});
const records = () => [
  { path: "couples/fixture-couple", fields: { members: ["fixture-alice", "fixture-bob"] } },
  { path: "couples/fixture-couple/notes/nested", fields: {
    note: "synthetic", at: { __firestoreType: "timestamp", seconds: 1730000000, nanoseconds: 123 },
  }},
  { path: "users/fixture-alice", fields: { cid: "fixture-couple" } },
  { path: "codes/FIXTURE-CODE", fields: { cid: "fixture-couple" } },
];
const assertions = () => ({
  sourceContainsOnlySyntheticRecords: true, targetWasEmptyBeforeImport: true,
  sourceAndTargetIndependentlyConfirmed: true, bucketIamAndRetentionReviewed: true,
  rollbackProcedureReviewed: true,
});
function example() {
  const plan = preflight(), prefix = plan.exportOutputPrefix + "/snapshot_20261111";
  return {
    plan, expectedManifest: createSyntheticManifest(records()), restoredRows: records(),
    exportOperation: {
      projectId: plan.sourceProject,
      name: "projects/gocnho-stage-src/databases/(default)/operations/ABCDEF_123456",
      done: true, uriPrefix: prefix, completedAt: "2026-11-11T12:00:00Z",
    },
    importOperation: {
      projectId: plan.targetProject,
      name: "projects/gocnho-stage-dst/databases/(default)/operations/IMPORT_123456",
      done: true, uriPrefix: prefix, completedAt: "2026-11-11T12:20:00Z",
    },
    assertions: assertions(),
  };
}
test("even a complete, matching synthetic evidence packet never claims cloud approval", () => {
  const report = reviewM0StagingEvidence(example());
  assert.equal(report.status, "READY_FOR_INDEPENDENT_ADMIN_REVIEW");
  assert.deepEqual(report.blockers, []);
  assert.equal(report.m0Approved, false);
  assert.equal(report.cloudOperationsVerified, false);
  assert.equal(report.dataReadFromCloud, false);
  assert.equal(report.productionAccessed, false);
});

test("missing operations, manual checks and manifests are explicitly blocked", () => {
  const result = reviewM0StagingEvidence({ plan: preflight() });
  assert.equal(result.status, "BLOCKED_NEEDS_EVIDENCE");
  assert.ok(result.blockers.includes("MISSING_EXPORT_OPERATION"));
  assert.ok(result.blockers.includes("MISSING_IMPORT_OPERATION"));
  assert.ok(result.blockers.includes("MISSING_SYNTHETIC_HASH_COMPARISON"));
  assert.ok(result.blockers.some(x => x.startsWith("MISSING_ATTESTATION_")));
  assert.equal(result.m0Approved, false);
});

test("detects changed nested content, extra documents and time precision", () => {
  const bad = example();
  bad.restoredRows[1].fields.at.nanoseconds++;
  const result = reviewM0StagingEvidence(bad);
  assert.ok(result.blockers.includes("SYNTHETIC_RESTORE_HASH_MISMATCH"));
  const x = example();
  x.restoredRows.push({
    path: "couples/fixture-couple/notes/extra", fields: { added: true },
  });
  assert.ok(reviewM0StagingEvidence(x).blockers.includes("SYNTHETIC_RESTORE_HASH_MISMATCH"));
});

test("rejects an operation from a different project and invalid completion metadata", () => {
  const fake = example();
  fake.exportOperation.name = fake.exportOperation.name.replace("gocnho-stage-src", "gocnho-live-prod");
  assert.throws(() => reviewM0StagingEvidence(fake), /OPERATION_PROJECT_MISMATCH/);
  const invalid = example();
  invalid.importOperation.done = false;
  assert.throws(() => reviewM0StagingEvidence(invalid), /OPERATION_NOT_COMPLETE/);
  const broken = example();
  broken.importOperation.completedAt = "not-a-date";
  assert.throws(() => reviewM0StagingEvidence(broken), /INVALID_OPERATION_COMPLETION_TIME/);
});

test("blocks wrong export/import URI and wrong chronological order", () => {
  const e = example();
  e.exportOperation.uriPrefix = "gs://gocnho-m0-staging-backups/OTHER/snapshot";
  assert.ok(reviewM0StagingEvidence(e).blockers.includes("EXPORT_OUTSIDE_APPROVED_BUCKET_PREFIX"));
  const changed = example();
  changed.importOperation.uriPrefix += "/different";
  assert.ok(reviewM0StagingEvidence(changed).blockers.includes("IMPORT_USES_DIFFERENT_EXPORT"));
  const chronology = example();
  chronology.importOperation.completedAt = chronology.exportOperation.completedAt;
  assert.ok(reviewM0StagingEvidence(chronology).blockers.includes("IMPORT_NOT_AFTER_EXPORT"));
});

test("strictly rejects extra fields to stop credentials or private payloads entering review", () => {
  const e = example();
  e.exportOperation.serviceAccountPrivateKey = "DO_NOT_LOG_OR_COLLECT";
  assert.throws(() => reviewM0StagingEvidence(e), /UNEXPECTED_OPERATION_FIELDS/);
  const a = example();
  a.assertions.productionDataSample = true;
  assert.throws(() => reviewM0StagingEvidence(a), /INVALID_ASSERTIONS/);
  const corrupted = example();
  corrupted.plan.exportOutputPrefix = "gs://unapproved/backups";
  assert.throws(() => reviewM0StagingEvidence(corrupted), /PLAN_PREFIX_MISMATCH/);
  const bad = example();
  bad.importOperation.uriPrefix = "gs://bucket/../../other";
  assert.throws(() => reviewM0StagingEvidence(bad), /INVALID_EXPORT_URI/);
});

test("rejects unapproved or modified preflight and modified synthetic fixture manifests", () => {
  const e = example();
  e.plan.verifiedAgainstCloud = true;
  assert.throws(() => reviewM0StagingEvidence(e), /INVALID_PREFLIGHT_PLAN/);
  const f = example();
  f.expectedManifest.documents[0].hash = "f".repeat(64);
  assert.throws(() => reviewM0StagingEvidence(f));
  const g = example();
  g.restoredRows[0].path = "couples/real-users";
  assert.throws(() => reviewM0StagingEvidence(g));
});

test("never provides a command to deploy, export, import or merge", () => {
  const result = reviewM0StagingEvidence(example());
  const json = JSON.stringify(result);
  assert.doesNotMatch(json, /gcloud firestore (?:export|import)|firebase deploy|secret|privateKey/);
  assert.ok(result.note.includes("Independently"));
  assert.equal(result.cloudOperationsVerified, false);
});
