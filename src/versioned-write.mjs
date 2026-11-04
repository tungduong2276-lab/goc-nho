import { runTransaction } from "firebase/firestore";

/**
 * M0 experimental write primitive for future features. Not wired to index.html.
 * The caller must provide two document refs in the same couple:
 *   couples/{cid}/{collection}/{targetId}
 *   couples/{cid}/writeOps/{operationId}
 * The broad legacy rules do NOT make this a security boundary.
 */
export class VersionedWriteError extends Error {
  constructor(code) {
    super(code);
    this.name = "VersionedWriteError";
    this.code = code;
  }
}

const idOk = value => typeof value === "string" && /^[a-zA-Z0-9_-]{1,80}$/.test(value);
const objectOk = value => value !== null && typeof value === "object" &&
  !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;

function canonical(value) {
  if (value === null || typeof value === "string" || typeof value === "boolean") return value;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (Array.isArray(value)) return value.map(canonical);
  if (objectOk(value)) return Object.fromEntries(Object.keys(value).sort().map(k => [k, canonical(value[k])]));
  throw new VersionedWriteError("INVALID_PATCH_VALUE");
}

export async function applyVersionedPatch({
  db, targetRef, operationRef, expectedRevision, operationId,
  actorUid, patch, allowedFields, secureProtocol = false,
}) {
  if (!db || !targetRef || !operationRef || !idOk(operationId) || !idOk(actorUid) ||
      !Number.isSafeInteger(expectedRevision) || expectedRevision < 0 ||
      !Array.isArray(allowedFields) || !allowedFields.length || !objectOk(patch)) {
    throw new VersionedWriteError("INVALID_ARGUMENT");
  }
  const parts = targetRef.path?.split("/") || [];
  if (parts.length !== 4 || parts[0] !== "couples" || !idOk(parts[1]) ||
      (parts[2] === "writeOps" || (secureProtocol && parts[2] !== "roomObjects")) ||
      operationRef.path !== `couples/${parts[1]}/writeOps/${operationId}`) {
    throw new VersionedWriteError("INVALID_REFERENCE");
  }
  const keys = Object.keys(patch);
  const reserved = new Set(["revision", "id", "ownerUid", "createdAt", "updatedAt", "members", "roles", "code", "lastOperationId", "updatedBy"]);
  if (!keys.length || !keys.every(k => allowedFields.includes(k) && !reserved.has(k) &&
      /^[a-zA-Z][a-zA-Z0-9_]{0,79}$/.test(k))) {
    throw new VersionedWriteError("INVALID_FIELDS");
  }
  // This MVP deliberately accepts JSON-compatible fields only; no serverTimestamp,
  // deleteField, functions, undefined or custom prototype values in the hash.
  const stablePatch = canonical(patch);
  const fingerprint = JSON.stringify({ targetPath: targetRef.path, actorUid, patch: stablePatch });
  return runTransaction(db, async tx => {
    // All reads MUST precede writes in a Firestore transaction.
    const prior = await tx.get(operationRef);
    if (prior.exists()) {
      const record = prior.data();
      if (record.fingerprint !== fingerprint || record.expectedRevision !== expectedRevision) {
        throw new VersionedWriteError("OPERATION_ID_COLLISION");
      }
      return { status: "replayed", revision: record.appliedRevision };
    }
    const existing = await tx.get(targetRef);
    if (!existing.exists()) throw new VersionedWriteError("MISSING_TARGET");
    const revision = existing.data().revision;
    if (!Number.isSafeInteger(revision) || revision < 0) {
      throw new VersionedWriteError("INVALID_REVISION");
    }
    if (revision !== expectedRevision) throw new VersionedWriteError("STALE_REVISION");
    tx.update(targetRef, {
      ...stablePatch, revision: revision + 1,
      ...(secureProtocol ? { lastOperationId: operationId, updatedBy: actorUid } : {}),
    });
    tx.set(operationRef, {
      operationId, actorUid, targetPath: targetRef.path,
      ...(secureProtocol ? { targetId: parts[3] } : {}),
      expectedRevision, appliedRevision: revision + 1, fingerprint,
    });
    return { status: "applied", revision: revision + 1 };
  });
}
