/**
 * M0 offline administrative evidence cross-checker.
 * NO credentials, Cloud API, environment access, subprocesses, or file writes.
 * An entirely self-reported packet can NEVER prove a real managed restore.
 */
import { makeStagingPlan } from "./m0-staging-preflight.mjs";
import { compareSyntheticRestore } from "./m0-restore-manifest.mjs";

export class M0EvidenceError extends Error {
  constructor(code) { super(code); this.name = "M0EvidenceError"; this.code = code; }
}

const isPlain = v => v !== null && typeof v === "object" &&
  Object.getPrototypeOf(v) === Object.prototype;
const allowedKeys = (value, keys) => isPlain(value) &&
  Object.keys(value).sort().join(",") === [...keys].sort().join(",");
const operationPattern = /^projects\/([a-z][a-z0-9-]{4,28}[a-z0-9])\/databases\/\(default\)\/operations\/[A-Za-z0-9_-]{6,256}$/;
const utcPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/;
const attestations = [
  "sourceContainsOnlySyntheticRecords",
  "targetWasEmptyBeforeImport",
  "sourceAndTargetIndependentlyConfirmed",
  "bucketIamAndRetentionReviewed",
  "rollbackProcedureReviewed",
];
function requirePlan(plan) {
  if (!isPlain(plan) || plan.status !== "REVIEW_ONLY_NOT_EXECUTED" ||
      plan.verifiedAgainstCloud !== false || !Array.isArray(plan.operations)) {
    throw new M0EvidenceError("INVALID_PREFLIGHT_PLAN");
  }
  const validated = makeStagingPlan({
    productionProject: plan.productionProjectForExclusionOnly,
    sourceProject: plan.sourceProject, targetProject: plan.targetProject,
    exportBucket: plan.exportBucket, runId: plan.runId,
    sourceSyntheticConfirmed: true, targetEmptyConfirmed: true,
    sourceNotProductionConfirmed: true, targetNotProductionConfirmed: true,
  });
  if (plan.exportOutputPrefix !== validated.exportOutputPrefix)
    throw new M0EvidenceError("PLAN_PREFIX_MISMATCH");
  return validated;
}
function inspectOperation(op, expectedProject, operationType) {
  if (op === null || op === undefined) return ["MISSING_" + operationType.toUpperCase() + "_OPERATION"];
  if (!allowedKeys(op, ["projectId", "name", "done", "uriPrefix", "completedAt"]))
    throw new M0EvidenceError("UNEXPECTED_OPERATION_FIELDS");
  const match = typeof op.name === "string" && op.name.match(operationPattern);
  if (!match || match[1] !== expectedProject || op.projectId !== expectedProject)
    throw new M0EvidenceError("OPERATION_PROJECT_MISMATCH");
  if (op.done !== true) throw new M0EvidenceError("OPERATION_NOT_COMPLETE");
  if (typeof op.completedAt !== "string" || !utcPattern.test(op.completedAt) ||
      Number.isNaN(Date.parse(op.completedAt)) ||
      new Date(op.completedAt).toISOString().slice(0, 19) !== op.completedAt.slice(0, 19))
    throw new M0EvidenceError("INVALID_OPERATION_COMPLETION_TIME");
  if (typeof op.uriPrefix !== "string" ||
      !/^gs:\/\/[a-z0-9][a-z0-9._-]{2,61}[a-z0-9]\/[A-Za-z0-9_./-]+$/.test(op.uriPrefix) ||
      op.uriPrefix.includes("..") || op.uriPrefix.includes("//"))
    throw new M0EvidenceError("INVALID_EXPORT_URI");
  return [];
}

/**
 * The supplied operation records and attestations are user-provided metadata
 * only. Successful output is a review packet, NOT independent cloud proof.
 * The manifest accepts ONLY the fixture namespace defined by its own module.
 */
export function reviewM0StagingEvidence({
  plan, expectedManifest, restoredRows, exportOperation = null,
  importOperation = null, assertions = {},
} = {}) {
  const validated = requirePlan(plan);
  const blockers = [];
  if (!isPlain(assertions) ||
      Object.keys(assertions).some(k => !attestations.includes(k)))
    throw new M0EvidenceError("INVALID_ASSERTIONS");
  for (const key of attestations) if (assertions[key] !== true)
    blockers.push("MISSING_ATTESTATION_" + key);
  blockers.push(...inspectOperation(exportOperation, validated.sourceProject, "export"));
  blockers.push(...inspectOperation(importOperation, validated.targetProject, "import"));

  if (exportOperation && importOperation) {
    const prefix = validated.exportOutputPrefix;
    const actual = exportOperation.uriPrefix;
    if (actual !== prefix && !actual.startsWith(prefix + "/"))
      blockers.push("EXPORT_OUTSIDE_APPROVED_BUCKET_PREFIX");
    if (actual !== importOperation.uriPrefix)
      blockers.push("IMPORT_USES_DIFFERENT_EXPORT");
    if (exportOperation.name === importOperation.name)
      blockers.push("OPERATION_IDENTITIES_NOT_DISTINCT");
    if (Date.parse(importOperation.completedAt) <= Date.parse(exportOperation.completedAt))
      blockers.push("IMPORT_NOT_AFTER_EXPORT");
  }

  if (expectedManifest === undefined || restoredRows === undefined) {
    blockers.push("MISSING_SYNTHETIC_HASH_COMPARISON");
  } else {
    const result = compareSyntheticRestore(expectedManifest, restoredRows);
    if (result.status !== "SYNTHETIC_MANIFEST_MATCH")
      blockers.push("SYNTHETIC_RESTORE_HASH_MISMATCH");
  }

  return Object.freeze({
    status: blockers.length === 0 ?
      "READY_FOR_INDEPENDENT_ADMIN_REVIEW" : "BLOCKED_NEEDS_EVIDENCE",
    checksCompletedByThisTool: ["project_id_isolation", "operation_metadata_shape",
      "offline_synthetic_manifest_comparison"],
    blockers: Object.freeze(blockers),
    m0Approved: false,
    cloudOperationsVerified: false,
    dataReadFromCloud: false,
    productionAccessed: false,
    note: "Self-reported metadata is not proof of Cloud Firestore export/import. Independently inspect operation logs, IAM, billing, source/target databases, and deployed Rules/Auth/App Check before M0 approval.",
  });
}
