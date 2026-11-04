/**
 * Offline-only synthetic Firestore manifest comparison.
 * This module performs no reads/writes or connections to Firebase/GCP.
 * Callers must supply sanitized synthetic records exported by an authorized
 * staging administrator; never supply production or personal data.
 */
import { createHash } from "node:crypto";

export class ManifestError extends Error {
  constructor(code) { super(code); this.name = "ManifestError"; this.code = code; }
}
const plain = v => v !== null && typeof v === "object" &&
  Object.getPrototypeOf(v) === Object.prototype;
const forbidden = new Set(["__proto__", "constructor", "prototype"]);
const segmentRe = /^[A-Za-z0-9_-]{1,120}$/;
const MAX_DOCUMENTS = 1000;
const MAX_DEPTH = 20;
const MAX_JSON_BYTES = 65536;

function canonical(value, depth = 0) {
  if (depth > MAX_DEPTH) throw new ManifestError("NESTING_LIMIT");
  if (value === null || typeof value === "string" || typeof value === "boolean") return value;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (Array.isArray(value)) return value.map(x => canonical(x, depth + 1));
  if (!plain(value)) throw new ManifestError("INVALID_VALUE");
  const keys = Object.keys(value).sort();
  if (keys.some(k => forbidden.has(k))) throw new ManifestError("FORBIDDEN_FIELD_NAME");
  return Object.fromEntries(keys.map(k => [k, canonical(value[k], depth + 1)]));
}
function normalizePath(path) {
  if (typeof path !== "string") throw new ManifestError("INVALID_DOCUMENT_PATH");
  const parts = path.split("/");
  if (parts.length < 2 || parts.length % 2 !== 0 ||
      parts.some(s => !segmentRe.test(s))) throw new ManifestError("INVALID_DOCUMENT_PATH");
  if (parts[0] !== "couples" && parts[0] !== "users" && parts[0] !== "codes")
    throw new ManifestError("UNEXPECTED_COLLECTION");
  // No Firestore documents outside the explicitly synthetic fixture namespace.
  if (parts[0] === "couples" && parts[1] !== "fixture-couple")
    throw new ManifestError("NON_SYNTHETIC_DOCUMENT");
  if (parts[0] === "users" && !["fixture-alice", "fixture-bob"].includes(parts[1]))
    throw new ManifestError("NON_SYNTHETIC_DOCUMENT");
  if (parts[0] === "codes" && parts[1] !== "FIXTURE-CODE")
    throw new ManifestError("NON_SYNTHETIC_DOCUMENT");
  return path;
}
function digest(value) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

/**
 * Each input row is {path, fields}. The fields use JSON-compatible tagged
 * representations for Firestore timestamps, geo points, bytes and references:
 * e.g. {__firestoreType:"timestamp", seconds:1730000000, nanoseconds:123}.
 * These tagged objects are data in a human-reviewed offline snapshot, NOT a
 * replacement for the Firestore SDK/Admin API's native typed values.
 */
export function createSyntheticManifest(rows) {
  if (!Array.isArray(rows) || rows.length === 0 || rows.length > MAX_DOCUMENTS)
    throw new ManifestError("INVALID_DOCUMENT_COUNT");
  const paths = new Set();
  const documents = rows.map(row => {
    if (!plain(row) || Object.keys(row).sort().join(",") !== "fields,path" ||
        !plain(row.fields)) throw new ManifestError("INVALID_DOCUMENT");
    const path = normalizePath(row.path);
    if (paths.has(path)) throw new ManifestError("DUPLICATE_DOCUMENT");
    paths.add(path);
    const fields = canonical(row.fields);
    if (Buffer.byteLength(JSON.stringify(fields), "utf8") > MAX_JSON_BYTES)
      throw new ManifestError("DOCUMENT_TOO_LARGE");
    return { path, hash: digest(fields) };
  }).sort((a, b) => a.path.localeCompare(b.path, "en"));
  return {
    format: "goc-nho-m0-synthetic-v1",
    syntheticOnly: true,
    count: documents.length,
    documents,
    rootHash: digest(documents),
    source: "OFFLINE_INPUT_NOT_CLOUD_VERIFIED",
  };
}

export function compareSyntheticRestore(expected, restoredRows) {
  if (!plain(expected) || expected.format !== "goc-nho-m0-synthetic-v1" ||
      expected.syntheticOnly !== true || expected.source !== "OFFLINE_INPUT_NOT_CLOUD_VERIFIED" ||
      !Array.isArray(expected.documents) || !Number.isSafeInteger(expected.count) ||
      expected.count !== expected.documents.length ||
      expected.count < 1 || expected.count > MAX_DOCUMENTS ||
      typeof expected.rootHash !== "string" ||
      !/^[a-f0-9]{64}$/.test(expected.rootHash))
    throw new ManifestError("INVALID_EXPECTED_MANIFEST");
  const expectedRows = expected.documents;
  const unique = new Set();
  for (const d of expectedRows) {
    if (!plain(d) || Object.keys(d).sort().join(",") !== "hash,path" ||
        typeof d.hash !== "string" || !/^[a-f0-9]{64}$/.test(d.hash))
      throw new ManifestError("INVALID_EXPECTED_MANIFEST");
    normalizePath(d.path);
    if (unique.has(d.path)) throw new ManifestError("INVALID_EXPECTED_MANIFEST");
    unique.add(d.path);
  }
  const sorted = [...expectedRows].sort((a,b) => a.path.localeCompare(b.path, "en"));
  if (JSON.stringify(sorted) !== JSON.stringify(expectedRows) ||
      digest(expectedRows) !== expected.rootHash)
    throw new ManifestError("TAMPERED_EXPECTED_MANIFEST");
  const actual = createSyntheticManifest(restoredRows);
  const byPath = new Map(actual.documents.map(d => [d.path, d.hash]));
  const expectedByPath = new Map(expectedRows.map(d => [d.path, d.hash]));
  const missing = expectedRows.filter(d => !byPath.has(d.path)).map(d => d.path);
  const extra = actual.documents.filter(d => !expectedByPath.has(d.path)).map(d => d.path);
  const changed = expectedRows.filter(d => byPath.has(d.path) && byPath.get(d.path) !== d.hash)
    .map(d => d.path);
  return {
    status: missing.length === 0 && extra.length === 0 && changed.length === 0 ?
      "SYNTHETIC_MANIFEST_MATCH" : "SYNTHETIC_MANIFEST_MISMATCH",
    expectedCount: expected.count,
    actualCount: actual.count,
    expectedRootHash: expected.rootHash,
    actualRootHash: actual.rootHash,
    missing, extra, changed,
    verifiedAgainstCloud: false,
    backupRestoreExecuted: false,
  };
}
