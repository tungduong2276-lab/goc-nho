# M0 experimental versioned write core — NOT deployed

This small ESM module (`src/versioned-write.mjs`) is deliberately **not imported by `index.html`** or used by existing Firebase production writes. It prepares an opt-in future M1 write path without migrating or rewriting legacy couple data.

## Contract and expected call

Call `applyVersionedPatch({db,targetRef,operationRef,expectedRevision,operationId,actorUid,patch,allowedFields})` with matching Firestore SDK references under a single **existing** couple:

- Target: `couples/{cid}/{collection}/{documentId}`, containing a nonnegative integer `revision` (start at 0 when a future reviewed feature creates its own documents).
- Operation ledger: `couples/{cid}/writeOps/{operationId}`, distinct from target.
- `patch`: plain, JSON-compatible object with one or more explicitly allowed field names; reserved metadata fields cannot be overwritten through this helper.
- `operationId`: unique stable client-generated ID reused *only* for retries of the exact same logical operation (not recreated for each retry).
- The transaction reads the ledger, then the target, checks `revision`, writes only requested fields and the incremented revision, and atomically creates the ledger entry. The same operation replay returns its original applied revision, even if another actor has subsequently changed the target.
- Reusing the same ID with a different payload or expected revision raises `OPERATION_ID_COLLISION`. Outdated *new* operations raise `STALE_REVISION`. The calling UI must fetch the latest state and ask the user to reconcile changes; never blindly overwrite.

## Important security and offline limits

- **Not an authorization mechanism.** Current broad member Firestore Rules also permit writing ledger records directly and changing revisions outside this helper. These must be restricted and tested **before** any production enablement. The `actorUid` argument is an audit descriptor, not verified Firebase Auth.
- **Transactions require connectivity.** Unlike field-level offline writes, this helper cannot commit offline. Future UI must show explicit pending/retry state with the *same* operation ID, not promise immediate offline success.
- Retry state must be persistent and survive app restarts if the future UI promises recovery after reload. Ledger growth/retention, bounded payloads, indexes and write costs require review.
- **No migration, no automatic backfill of `revision` and no feature flag activation** in this PR. Existing `put()` whole-document updates remain unchanged, including their known lost-update risk.
- Ledger path and target path must receive a purpose-built Rules policy; `writeOps` must not inherit unrestricted broad member writes at release.
- All current tests use two synthetic members and a synthetic outsider against loopback Emulator. They do not prove a real staging Cloud Firestore export/restore, deployed production Rules, or app-level two-device reconnect UX.
