# M0 — Firebase safety audit (2026-11-03)

**Scope:** source-only audit of main (commit `7008a7a`). No production Firebase access, backup, deploy, migration or write was performed. This document is evidence of findings, **not** M0 completion.

## Verified from checked-in sources

- `index.html` starts Firebase compat app, Auth and Firestore; `firestore.rules` exists. No `firebase.json` at repository root (404), and no direct `firebase.storage(` or `firebase.functions(` usage found in main HTML.
- `createCouple()` writes `couples/{cid}` and `codes/{code}`; user profile is `users/{uid}`; app resolves couple data under `couples/{cid}/...` and reads collections through `COLS`. Existing schema is **not** the proposed `spaces/{spaceId}` design.
- `put(col,obj)` uses `ref.set(data)` (whole-document replacement); `del(col,id)` uses `ref.delete()`. `meta/main` has a dedicated Firestore transaction/merge path. Existing synchronization, retry and offline behavior need concurrent-client testing before adding placement/gifts/plant actions.
- Firestore Rules allow members of a couple broad reads/writes on all nested documents under `couples/{cid}`. This is incompatible with keeping secret-gift plaintext hidden from a member until a release time.
- `codes/{code}`: any authenticated user can `get` a code and `create` a code. Evaluate code collisions and membership enrollment constraints with Emulator; do not amend rules in production without a separate audited release.
- `couples/{cid}` update branches permit member removal and joining. Threat-model identity/membership manipulation, field integrity and concurrent join.

## M0 gates — NOT YET VERIFIED

- [ ] Inventory actual collection names, shapes and reads/writes (only metadata/paths, **never** export private contents into repo).
- [ ] Confirm deployed Rules match checked-in Rules, Auth providers, indexes, Storage/Functions availability and App Check configuration through authorized Firebase administration.
- [ ] Establish separate Firebase staging project with nonproduction IDs and synthetic couple fixture (two members plus third outsider).
- [ ] Establish emulator-based Rules tests: own user read/write; outsider denial; join/remove membership; nested couple permissions; malformed records; code collision; simultaneous writes.
- [ ] Verify database export and restore in **isolated staging** with explicit timestamps, integrity verification and documented rollback. Never test restore against production.
- [ ] Add two-client browser harness for concurrent updates, reconnect/offline, stale revisions, idempotent retries, navigation and 360/390/430px touch targets.
- [ ] Confirm `npm test` on current main and every feature branch; CI on PR #9 must be green and rendered geometry visually inspected before merge.
- [ ] Establish per-feature flag + conservative roll-forward/rollback plan for any future schema-changing feature.

## Risk-driven release order

1. PR #9: fix current weather regression; inspect 3D map rendered geometry, zones, anchors and internal room dimensions; reconcile with main and all-tabs PR #10.
2. Create emulator configuration **only for staging/test** and a permission-test suite before modifying live Rules.
3. Inventory existing collections, write paths and backup/export process, validate restore on a separate test project.
4. Add two-client concurrency and permission regression tests to CI.
5. Only then start M1 room placement on its own feature branch; use a transaction/versioned design and do not migrate old data implicitly.

## Rollback and data privacy

No unreviewed deletion, schema replacement or automatic migration of `couples`, `users`, `codes` or nested records. Store only synthetic identities and fixtures. For changes involving Rules, roll back the Rules deployment via reviewed version management; for any data migration, first require an independently verified staging export/restore and idempotent script. Never treat a passed browser test as proof of Firebase isolation.
