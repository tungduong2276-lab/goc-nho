import { test } from "node:test";
import { strict as assert } from "node:assert";
import { spawnSync } from "node:child_process";
import { makeStagingPlan, parseStagingArgs } from "../../scripts/m0-staging-preflight.mjs";

const safe = Object.freeze({
  productionProject: "gocnho-live-prod",
  sourceProject: "gocnho-stage-src",
  targetProject: "gocnho-stage-dst",
  exportBucket: "gs://gocnho-m0-staging-backups",
  runId: "synthetic_20261104",
  sourceSyntheticConfirmed: true,
  targetEmptyConfirmed: true,
  sourceNotProductionConfirmed: true,
  targetNotProductionConfirmed: true,
});

test("plan is explicitly non-executing and targets distinct staging projects", () => {
  const plan = makeStagingPlan(safe);
  assert.equal(plan.status, "REVIEW_ONLY_NOT_EXECUTED");
  assert.equal(plan.verifiedAgainstCloud, false);
  assert.equal(plan.operations.find(x => x.phase === "export").exampleCommand.includes(
    "--project=gocnho-stage-src"), true);
  const restore = plan.operations.find(x => x.phase === "import");
  assert.equal(restore.exampleCommand, null);
  assert.equal(restore.explicitTargetProject, safe.targetProject);
  assert.ok(restore.guard.includes("ACTUAL_OUTPUT_URI_PREFIX"));
  assert.ok(plan.exportOutputPrefix.startsWith("gs://gocnho-m0-staging-backups/"));
  assert.ok(!plan.operations.some(x =>
    typeof x.exampleCommand === "string" && x.exampleCommand.includes("--project=gocnho-live-prod")));
});

test("rejects source or destination equal to production and any same-project restore", () => {
  for (const changes of [
    { sourceProject: safe.productionProject },
    { targetProject: safe.productionProject },
    { targetProject: safe.sourceProject },
    { productionProject: safe.targetProject },
  ]) {
    assert.throws(() => makeStagingPlan({ ...safe, ...changes }), /PROJECTS_MUST_BE_DISTINCT/);
  }
});

test("requires every manual attestation and never treats them as cloud verification", () => {
  for (const key of [
    "sourceSyntheticConfirmed", "targetEmptyConfirmed",
    "sourceNotProductionConfirmed", "targetNotProductionConfirmed",
  ]) assert.throws(() => makeStagingPlan({ ...safe, [key]: false }),
    /MISSING_MANUAL_SAFETY_ATTESTATIONS/);
  assert.equal(makeStagingPlan(safe).verifiedAgainstCloud, false);
});

test("rejects dangerous project, bucket and operation identifiers", () => {
  for (const changes of [
    { sourceProject: "--project=real-prod" },
    { targetProject: "foo;rm -rf" },
    { productionProject: "" },
    { exportBucket: "gs://bucket/evil" },
    { exportBucket: "gs://../escape" },
    { exportBucket: "https://example.com" },
    { runId: "test; rm -rf /" },
    { runId: "../other" },
  ]) assert.throws(() => makeStagingPlan({ ...safe, ...changes }));
});

test("CLI rejects missing input, unknown flags, duplicates and missing values", () => {
  assert.throws(() => parseStagingArgs([]), /INVALID_PROJECT_ID/);
  assert.throws(() => parseStagingArgs(["--execute"]), /UNKNOWN_OR_DUPLICATE_ARGUMENT/);
  assert.throws(() => parseStagingArgs(["--source-project", "stage", "--source-project", "stage"]),
    /UNKNOWN_OR_DUPLICATE_ARGUMENT/);
  assert.throws(() => parseStagingArgs(["--source-project"]), /MISSING_ARGUMENT_VALUE/);
});

test("CLI end-to-end emits review JSON and never runs gcloud", () => {
  const args = [
    "--production-project", safe.productionProject,
    "--source-project", safe.sourceProject,
    "--target-project", safe.targetProject,
    "--export-bucket", safe.exportBucket,
    "--run-id", safe.runId,
    "--confirm-synthetic-source", "--confirm-empty-target",
    "--confirm-nonprod-source", "--confirm-nonprod-target",
  ];
  const result = spawnSync(process.execPath, ["scripts/m0-staging-preflight.mjs", ...args], {
    encoding: "utf8", timeout: 10000,
    env: { ...process.env, PATH: "" },
  });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).status, "REVIEW_ONLY_NOT_EXECUTED");
  assert.equal(JSON.parse(result.stdout).verifiedAgainstCloud, false);
  const denied = spawnSync(process.execPath, [
    "scripts/m0-staging-preflight.mjs", ...args,
    "--target-project", safe.productionProject,
  ], { encoding: "utf8", timeout: 10000, env: { ...process.env, PATH: "" } });
  assert.equal(denied.status, 2);
  assert.match(denied.stderr, /UNKNOWN_OR_DUPLICATE_ARGUMENT/);
});
