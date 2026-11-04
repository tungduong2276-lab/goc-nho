# M0 candidate Rules for future versioned room objects — Emulator only

**Not deployable as-is.** This PR adds `tests/firebase/fixtures/m0-versioned.rules` and integration tests while leaving the actual root `firestore.rules` and `firebase.json` unchanged. No real Firebase project is contacted.

## Why the recursive exclusion is mandatory

Firestore combines all matching `allow` clauses with logical OR. Adding narrower `match /writeOps/{opId}` rules is not enough when the existing broad `match /{collection}/{document=**}` still allows every couple member to write. The candidate explicitly excludes `roomObjects` and `writeOps` from that legacy recursive grant, then handles the two collections with dedicated predicates. Existing legacy collections retain the existing membership behavior in this candidate.

## Draft wire protocol

- Only existing synthetic room object documents may be updated; direct client create/delete is denied during this prototype.
- Each atomic transaction updates one `couples/{cid}/roomObjects/{targetId}` and creates one `couples/{cid}/writeOps/{operationId}` record.
- The object revision must increment exactly by one. Its `lastOperationId` and `updatedBy` must match the ledger and authenticated UID.
- The ledger must be newly created, immutable, tied to the target, expected/applied revision and authenticated UID, and verified against the **after-state** of the target using `getAfter`. Target updates likewise require matching ledger state.
- The versioned-write helper's `secureProtocol: true` option supplies these extra fields for this specific future `roomObjects` path. Its previous/default behavior is unchanged and remains **insecure under legacy broad Rules**.
- Rules intentionally do not establish a cryptographic binding of `fingerprint` to payload or authenticate actor claims from an untrusted client outside the proposed authenticated writes. Review field allowlists, operation ID limits, costs, collection nesting and creation permissions before proposing production Rules.

## Release blockers

1. Real isolated Firebase staging Cloud Firestore export + restore to a **second distinct** test destination, with manifest verification.
2. Authorized inspection of production-deployed Rules, Auth, App Check, IAM and rollback version.
3. Formal Rules threat-model review: maximum rule access-call budget, cross-document race/ledger growth, field validation, malicious member abuse and legacy compatibility.
4. Application-level two-client/offline/retry and UI feature flag acceptance. Transactions cannot commit offline.
5. Independent PR #9 house/room visual acceptance. **Do not enable M1 placement** or deploy this Rules candidate from a passing Emulator test.
