# M0 — Firebase safety audit (2026-11-03)

**Scope:** source-only audit started from main commit `7008a7a`, updated after M0 PRs #14 and #15. No production Firebase access, backup, deploy, migration or write was performed. This document is evidence of findings, **not** M0 completion.

## Verified from checked-in sources

- `index.html` starts Firebase compat app, Auth and Firestore; `firestore.rules` exists. `firebase.json` was added for isolated Firestore Emulator tests in merged PR #15, and no direct `firebase.storage(` or `firebase.functions(` usage found in main HTML.
- `createCouple()` writes `couples/{cid}` and `codes/{code}`; user profile is `users/{uid}`; app resolves couple data under `couples/{cid}/...` and reads collections through `COLS`. Existing schema is **not** the proposed `spaces/{spaceId}` design.
- Source inventory: `COLS` contains 19 names under the couple path: `history`, `dict`, `museum`, `places`, `wishes`, `letters`, `rules`, `care`, `taps`, `presence`, `gifts`, `fridge`, `story`, `drawings`, `kingdom`, `treasures`, `realm`, `medals`, `pet`, plus a dedicated `meta/main` path. This is a **code-level inventory only**, not a claim that live production has every collection.
- `put(col,obj)` uses `ref.set(data)` (whole-document replacement); `del(col,id)` uses `ref.delete()`. `meta/main` has a dedicated Firestore transaction/merge path. Existing synchronization, retry and offline behavior need concurrent-client testing before adding placement/gifts/plant actions.
- Firestore Rules allow members of a couple broad reads/writes on all nested documents under `couples/{cid}`. This is incompatible with keeping secret-gift plaintext hidden from a member until a release time.
- **Critical confirmed in emulator (CI #65):** under Rules v2 the old nested `match /{document=**}` also matched zero segments and bypassed parent `/couples/{cid}` membership updates. An existing member could add a third member. The fix scoped to `/{collection}/{document=**}` was merged to main in PR #14; 9/9 emulator regression tests passed with this fix (CI #87 on PR #15). Live Firebase Rules deployment remains unverified. This is a security vulnerability in the checked-in baseline, not merely a theoretical risk.
- `codes/{code}`: any authenticated user can `get` a code and `create` a code. Evaluate code collisions and membership enrollment constraints with Emulator; do not amend rules in production without a separate audited release.
- `couples/{cid}` update branches permit member removal and joining. Threat-model identity/membership manipulation, field integrity and concurrent join.

## M0 gates — NOT YET VERIFIED

- [ ] Inventory actual collection names, shapes and reads/writes (only metadata/paths, **never** export private contents into repo).
- [ ] Confirm deployed Rules match checked-in Rules, Auth providers, indexes, Storage/Functions availability and App Check configuration through authorized Firebase administration.
- [ ] Establish separate Firebase staging project with nonproduction IDs and synthetic couple fixture (two members plus third outsider).
- [x] Establish initial synthetic Emulator suite (9/9 on CI #87) for own-user access, outsider denial, joining and restricted membership, nested documents, code get and concurrent writes; additional tests for malformed records and code collision remain outstanding.
- [ ] Verify database export and restore in **isolated staging** with explicit timestamps, integrity verification and documented rollback. Never test restore against production.
- [ ] Add two-client browser harness for concurrent updates, reconnect/offline, stale revisions, idempotent retries, navigation and 360/390/430px touch targets.
- [x] CI #87 passed on PR #15 (15/15 browser, 9/9 Emulator); this test infrastructure was merged as `b9a0992`. PR #9 geometry and rendered hitboxes still require separate manual visual review before merge.
- [ ] Establish per-feature flag + conservative roll-forward/rollback plan for any future schema-changing feature.

## Risk-driven release order

1. PR #9: fix current weather regression; inspect 3D map rendered geometry, zones, anchors and internal room dimensions; reconcile with main and all-tabs PR #10.
2. Create emulator configuration **only for staging/test** and a permission-test suite before modifying live Rules.
3. Inventory existing collections, write paths and backup/export process, validate restore on a separate test project.
4. Add two-client concurrency and permission regression tests to CI.
5. Only then start M1 room placement on its own feature branch; use a transaction/versioned design and do not migrate old data implicitly.

## Rollback and data privacy

No unreviewed deletion, schema replacement or automatic migration of `couples`, `users`, `codes` or nested records. Store only synthetic identities and fixtures. For changes involving Rules, roll back the Rules deployment via reviewed version management; for any data migration, first require an independently verified staging export/restore and idempotent script. Never treat a passed browser test as proof of Firebase isolation.

## Incremental M0 work in PR #18 (pending CI and review)

- Added an Emulator-only two-member same-document `updateDoc` field-patch convergence test. This is a test of a safer write primitive, **not** a fix for the existing whole-document `put()` implementation.
- Added synthetic tests for invitation-code collision, join immutability (code/roles), and outsider access to malformed nested fixtures. Their outcomes must be read from the latest CI run, not assumed.
- Updated GitHub Actions paths so changes to `tests/firebase/**`, `firestore.rules` and `firebase.json` trigger CI; provisioned Java 21 for Firestore Emulator.
- Documented future flags and rollback policy in `docs/M0-FEATURE-FLAGS-ROLLBACK.md`. These flags are **not** live implementations.
- PR #17 browser CI #89 failed (15/17): pointer character hug and board gallery activation. Its two weather-persistence regression tests passed. PR #9 remains blocked until the full browser suite and geometry review pass.

### Gates still requiring external/interactive evidence

1. An authorized Firebase administrator must inspect deployed production Rules, Auth providers, App Check, indexes and Storage/Functions status without disclosing private contents. Source code cannot establish deployed configuration.
2. An isolated **real staging project** must be provisioned and synthetic export/restore verified against a separate destination with manifest hashes. Emulator testing alone does not meet this gate.
3. Two-client offline/reconnect, stale revision, retry/idempotency and mobile hitbox coverage must be exercised before shared M1 writes are enabled.
4. PR #9 visual render, room dimensions and conflict reconciliation with current `main` require separate acceptance.
5. No M0 completion, production backup, rules deployment or migration is claimed by this PR.
