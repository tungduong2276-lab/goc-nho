/**
 * Safety-only, read-only plan generator for M0 staging Firestore export/restore.
 * NO auth, NO cloud calls, NO subprocesses, NO filesystem writes.
 * The output is a review checklist, NOT proof that an export/restore occurred.
 */
import { pathToFileURL } from "node:url";

export class StagingPreflightError extends Error {
  constructor(code) { super(code); this.name = "StagingPreflightError"; this.code = code; }
}

const projectRe = /^[a-z][a-z0-9-]{4,28}[a-z0-9]$/;
const bucketRe = /^[a-z0-9][a-z0-9._-]{2,61}[a-z0-9]$/;
const idRe = /^[a-zA-Z0-9][a-zA-Z0-9_-]{5,63}$/;

function validateProject(value) {
  if (typeof value !== "string" || !projectRe.test(value) || value.includes("--"))
    throw new StagingPreflightError("INVALID_PROJECT_ID");
  return value;
}

export function makeStagingPlan({
  productionProject, sourceProject, targetProject, exportBucket, runId,
  sourceSyntheticConfirmed = false, targetEmptyConfirmed = false,
  sourceNotProductionConfirmed = false, targetNotProductionConfirmed = false,
}) {
  const production = validateProject(productionProject);
  const source = validateProject(sourceProject);
  const target = validateProject(targetProject);
  if (new Set([production, source, target]).size !== 3)
    throw new StagingPreflightError("PROJECTS_MUST_BE_DISTINCT");

  if (typeof exportBucket !== "string" || !exportBucket.startsWith("gs://") ||
      !bucketRe.test(exportBucket.slice(5)) || exportBucket.includes(".."))
    throw new StagingPreflightError("INVALID_BUCKET");
  if (typeof runId !== "string" || !idRe.test(runId))
    throw new StagingPreflightError("INVALID_RUN_ID");
  if (!sourceSyntheticConfirmed || !targetEmptyConfirmed ||
      !sourceNotProductionConfirmed || !targetNotProductionConfirmed)
    throw new StagingPreflightError("MISSING_MANUAL_SAFETY_ATTESTATIONS");

  const prefix = `${exportBucket}/goc-nho-m0-synthetic/${runId}`;
  return Object.freeze({
    status: "REVIEW_ONLY_NOT_EXECUTED",
    sourceProject: source,
    targetProject: target,
    productionProjectForExclusionOnly: production,
    exportBucket,
    runId,
    exportOutputPrefix: prefix,
    verifiedAgainstCloud: false,
    operations: [
      {
        phase: "inventory",
        required: [
          "Have an authorized Firebase/GCP administrator independently verify the production project ID",
          "Use a second approval channel to verify source and target are isolated staging projects",
          "Inspect active gcloud account, project IAM and database location before any write",
          "Inspect target database and confirm it is empty; stop if any user documents are present",
          "Confirm bucket residency, encryption, retention, access controls and cross-project import service-account permissions",
          "Write synthetic fixture manifest including nested docs, timestamp fields and hashes; do not include private production data",
        ],
      },
      {
        phase: "export",
        exampleCommand: `gcloud firestore export ${prefix} --project=${source} --database="(default)"`,
        guard: "Review exact project and bucket again before running; use staging synthetic data only",
      },
      {
        phase: "import",
        exampleCommand: null,
        guard: "Only after successful export: copy the actual completed export outputUriPrefix from gcloud operation status; verify it begins with the approved prefix. Run: gcloud firestore import ACTUAL_OUTPUT_URI_PREFIX --project=TARGET_PROJECT --database=\"(default)\" using the separately verified target staging project. NEVER substitute the production project or import into the source.",
        explicitTargetProject: target,
      },
      {
        phase: "verify",
        required: [
          "Read synthetic manifest and compare all IDs, nested documents, fields and stable hashes at destination",
          "Check exported operation completion, audit log identity, Firestore indexes and security-rule behavior separately",
          "Record evidence and a nonproduction rollback procedure in an access-controlled location",
          "Do NOT mark M0 complete without independently reviewing these results",
        ],
      },
    ],
  });
}

export function parseStagingArgs(argv) {
  const allowed = new Set([
    "--production-project", "--source-project", "--target-project",
    "--export-bucket", "--run-id", "--confirm-synthetic-source",
    "--confirm-empty-target", "--confirm-nonprod-source", "--confirm-nonprod-target",
  ]);
  const opts = {};
  const bools = new Set([
    "--confirm-synthetic-source", "--confirm-empty-target",
    "--confirm-nonprod-source", "--confirm-nonprod-target",
  ]);
  for (let i = 0; i < argv.length; i++) {
    const key = argv[i];
    if (!allowed.has(key) || Object.hasOwn(opts, key))
      throw new StagingPreflightError("UNKNOWN_OR_DUPLICATE_ARGUMENT");
    if (bools.has(key)) opts[key] = true;
    else {
      if (!argv[i + 1] || argv[i + 1].startsWith("--"))
        throw new StagingPreflightError("MISSING_ARGUMENT_VALUE");
      opts[key] = argv[++i];
    }
  }
  return makeStagingPlan({
    productionProject: opts["--production-project"],
    sourceProject: opts["--source-project"],
    targetProject: opts["--target-project"],
    exportBucket: opts["--export-bucket"],
    runId: opts["--run-id"],
    sourceSyntheticConfirmed: opts["--confirm-synthetic-source"],
    targetEmptyConfirmed: opts["--confirm-empty-target"],
    sourceNotProductionConfirmed: opts["--confirm-nonprod-source"],
    targetNotProductionConfirmed: opts["--confirm-nonprod-target"],
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    process.stdout.write(JSON.stringify(parseStagingArgs(process.argv.slice(2)), null, 2) + "\n");
  } catch (error) {
    process.stderr.write(`Staging preflight rejected: ${error.code || "ERROR"}\n`);
    process.exitCode = 2;
  }
}
