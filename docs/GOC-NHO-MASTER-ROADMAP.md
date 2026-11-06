# GÓC NHỎ — MASTER ROADMAP & AI HANDOFF

> **Status:** Approved planning baseline, **not implemented**. Updated: 2026-11-03.
> **Repo:** `tungduong2276-lab/goc-nho`. **Language:** Vietnamese.
> **Audience:** future ChatGPT/Claude coding sessions, developer, reviewer.
> **Priority:** protect real Firebase data belonging to two people. This document is a plan, not proof that a feature exists.

## 0. START HERE — instructions for a new AI conversation

1. Read `AGENTS.md` and this entire file. Inspect actual `main`, open PRs, CI status and Firebase configuration before making assumptions.
2. Ask which milestone to implement **only if the user has not already specified it**. If asked to continue, start with the first incomplete milestone and current blockers.
3. Read existing code before editing; do not rewrite the app from scratch or replace the Firebase backend.
4. Implement in small feature branches with PRs, run static, browser and Firebase Emulator tests; **do not merge failing or unverified changes**. For visual 3D changes inspect actual renders and touch hitboxes.
5. Do not claim deployed changes, successful tests, backups, Firebase Rules enforcement, or merged PRs without verifying.
6. Never delete or migrate live couple data without an explicit, reviewed backup/rollback plan. Do not put real secrets or personal data in repo, logs, fixtures, or AI prompts.
7. Finish each session by updating the handoff section at the end of this file with verified PRs, tests, blockers and next action, or clearly state why it was not updated.

## 1. Product vision

**Góc Nhỏ** is a private shared space for two people: a cozy, cute isometric/3D-inspired house, garden, gifts, activities and memories. Guiding loop:

**Decorate a home → share gifts / tend plants / play together → create intentional memories → display them in a museum and a keepsake book.**

The experience should feel alive and intimate, **not** like a daily-chore streak game. Avoid punishing missed days or generating intrusive surveillance-like activity histories. Keep mobile interaction first-class.

Existing sections: Nhà, Hẹn hò, Khu vườn, Gửi nhau, Chơi cùng, Kỷ niệm, with multiple subtabs. Preserve all existing interactions and content.

## 2. Current verified technical baseline (2026-11-03)

- Single-page app with substantial JavaScript and CSS in `index.html`.
- Firebase compat SDK references in HTML: app, auth and Firestore; inspect actual config and rules rather than assuming Storage or Functions are configured.
- Existing functions include `put(col,obj,opts)`, `del(col,id)`, `mergeMetaForWrite(latest,patch)`, plus local/DB mode and retry logic. The generic `put` writes whole documents; **avoid whole-document writes for concurrent placement, gifts or plant progression**.
- 3D scenes use rendered assets and `assets/3d/scene.json` with scene coordinates, room spots and hit polygons. Inspect `_xuong-3d/`, `scripts/` and rendering workflow before changing dimensions.
- `package.json`: `npm test` = `npm run test:static && npm run test:browser`; static checker `scripts/check-garden.mjs`; Playwright browser suite `tests/browser/`.
- **PR #10** (all-tabs layout refresh) was merged to `main` at `07f52a7d2d5f716134168680a6ff92d6d2cd36d9` on 2026-11-03. Verify main HEAD may have advanced.
- **PR #9** `feature/spacious-house-weather-botany`: house map expansion, decorative weather and flowering trees; **open/unmerged at last check**. Earlier CI had 13/15 tests passing, then two fixes were committed and a rerun started. **Recheck CI before merging**. This PR does **not** fully enlarge each individual room interior, despite enlarging the overview. Verify rendered map polygons/anchors match visual geometry.
- PR #9 may conflict with later `main` updates; resolve carefully. Do not start persistent furniture placement until room geometry is stable.

## 3. Milestone sequence (user-approved order)

Estimates assume one developer with AI support; ranges are planning guesses, not promises. Sequential rough total 18–28 focused weeks, depending on rendering, assets, tests and Firebase rules.

### M0 — Foundation and safety gate (5–7 working days, before M1)

**Deliverables:** inventory Firestore collections/docs and access paths; inspect auth, rules and Storage availability; test backup/export and restore on a separate environment; add Firebase Emulator integration tests; establish fixture data for two simulated users; verify PR #9 and 3D room dimensions; define schema conventions and feature flags; baseline performance and CI.

**Acceptance:** existing `npm test` passes on `main`; no production data touched by tests; backup/restore procedure proven in nonproduction; 2-client test harness works; pending PR #9 explicitly resolved or documented as blocker.

### M1 — Trang trí Nhà 3D (4–6 weeks)

**Goal:** a room can be furnished by both people and remain consistent after reload.

- Model rooms, floor bounds, placement slots, object anchors, z-order, scale, rotation, collision and hit testing. Stabilize room dimensions first.
- **Important feasibility constraint:** current rooms are prerendered 3D imagery + metadata, not a fully real-time 3D engine. MVP uses approved placement slots and angle-appropriate 2D/3D-rendered sprites, not an ungrounded promise of arbitrary 3D movement.
- MVP objects: table, chair, cabinet, lamp, potted plant, wall art, rug. Select, preview, move, rotate when supported, place, remove to inventory, undo last local action.
- Use stable object IDs, validated room bounds and atomic/transactional conflict handling; keep owner and update version.
- Verify two simultaneous clients; reject invalid positions, stale writes and placement collisions; support reconnect.

**Acceptance:** both see same positions; reload persists; no out-of-bounds objects; no duplicate item placement; legacy rooms and old data still render.

### M2 — Dấu vết thời gian (2–3 weeks)

- Attach opt-in memories (text, photo reference, event date, creator) to objects, plants and locations.
- Show object timeline and editable memory details; allow deletion with proper permissions.
- Link memories by ID instead of duplicating payloads.
- **No covert tracking:** do not silently log every user interaction.

**Acceptance:** moving an object preserves memories; concurrent reads converge; deletion/permissions respected.

### M3 — Hộp quà bí mật (2–3 weeks)

- Gift object with sender, recipient, content, created time, unlock policy, opened state and room placement.
- MVP unlock conditions: immediate or scheduled timestamp; richer triggers only after a secure design review.
- **Critical security:** hiding content in UI is insufficient. A Firestore document readable before unlock cannot contain plaintext secret payload. Use separate protected content with trusted server-side release/authorization (e.g. Rules plus server-managed transition) or equivalent demonstrably secure architecture. Do not implement "secret" as CSS hiding or merely obfuscated client JSON.
- Audio/photo files require secure storage and access rules if used.

**Acceptance:** unauthorized/early clients cannot read payload even via direct API; one-time open transition is idempotent; offline and clock-skew cases handled.

### M4 — Khu vườn mở rộng (3–4 weeks)

- Flowering trees: hoa giấy, hoa sữa, anh đào, phượng and more; growth phases; plots and repositioning; seed inventory; gifting; attach memories.
- Preserve existing watering, seasonal gallery, pot counts, progression and hit targets.
- Use transactions/idempotency for shared care actions; prevent duplicate watering and plant duplication.

**Acceptance:** old plants survive upgrade; concurrent care is consistent; tap targets pass mobile widths 360/390/430px.

### M5 — Bốn mùa và thời tiết (2–3 weeks)

- Shared environmental state for house and garden; day/night, rain, clouds, snow, petals, leaves and lighting palettes.
- Distinguish **decorative weather** from actual meteorological forecasts; do not claim real weather without a selected location, data source and consent where appropriate.
- Reduced-motion mode, disable effects, image budgets and battery-friendly animation.

**Acceptance:** overlays never intercept taps; coordinates unchanged; reduced motion respected; UI clearly labels decorative modes.

### M6 — Bảo tàng 3D (3–4 weeks)

- Reuse room placement engine to arrange photos, framed notes, display cabinets, souvenirs and selected memories.
- Source of truth remains original memory; displays reference memory IDs.
- Support categories, timelines, item details, empty states and permissions.

**Acceptance:** deleting/changing access to original memory updates museum; no duplicated source records or broken layouts.

### M7 — Mini-game hai người (3–4 weeks)

- Implement one reusable multiplayer session framework and **one** initial cooperative game, "Hai nửa bí mật": one person sees a map, the other sees rules/keys; communication is required.
- Ready state, roles, turn/order, server-authoritative result checks as appropriate, reconnect, resume and abandonment.
- Do not rely solely on client-written victory claims.

**Acceptance:** no duplicate turns, corrupted sessions or permanent stuck states after disconnect; two-client test passes.

### M8 — Sách kỷ niệm (2–3 weeks)

- Select time range and explicit memories/photos/gifts; edit captions, titles and order; preview, export Vietnamese-language PDF and optionally save version.
- Filter by permissions and unlock status; no unopened gift content in export.
- Keep PDF generation separate from app's normal data-writing flows.

**Acceptance:** UTF-8/Vietnamese diacritics and images render correctly; book never leaks protected content; export is reproducible.

## 4. Proposed data architecture — DESIGN, NOT EXISTING SCHEMA

```text
spaces/{spaceId}
  members/{uid}
  rooms/{roomId}
    objects/{objectId}
  memories/{memoryId}
  gifts/{giftId}
  plants/{plantId}
  environment/current
  gameSessions/{sessionId}
  books/{bookId}
```

Do **not** migrate old collections to these paths automatically. Audit existing Firestore first; introduce adapters/dual-read only with tests. Prefer independent documents over a large shared metadata document.

Suggested common fields: `schemaVersion`, stable `id`, `createdAt`, `updatedAt`, `createdBy`, `updatedBy`, `spaceId`. Use Firestore server timestamps when ordering matters; explicitly handle offline/pending writes. Validate `spaceId` membership and permissions with Security Rules. Rules alone may not enforce complex cross-document business invariants; use trusted server actions/transactions where required.

- Room object: `assetId`, `roomId`, `placement`, `rotation`, `ownerUid`, `revision`, `memoryIds` (or inverse links).
- Memory: `targetType`, `targetId`, `body`, `mediaRefs`, `eventAt`, `visibility`.
- Gift: `senderUid`, `recipientUid`, `unlockAt`, `status`, **separate secured payload**.
- Plant: `species`, `plot`, `growthStage`, `lastCareAt`, `revision`.
- Game session: `participants`, `phase`, `turn`, `state`, `revision`.
- Book: `title`, `selectedMemoryIds`, `layout`, `version`.

Security and privacy: never embed private payloads in public render metadata, URL query strings or cached service worker resources. Storage uploads need file-type, size and access checks. Budget reads/writes, indexes and asset sizes before rollout.

## 5. Required branch / PR / CI workflow

1. Branch per milestone or small slice, e.g. `feature/house-placement-mvp`, from latest `main`.
2. PR describes scope, screenshots/render previews, schema changes, Firebase Rules changes, migration/rollback, security considerations and test evidence.
3. Static syntax and existing checks: `npm test` (including Playwright); new unit and Emulator tests must be included in CI before feature release.
4. Two-client integration tests: concurrent edit, stale revision, offline/reconnect, retry, idempotency, page reload, deleted/expired content and permissions.
5. Responsive tests: 360px, 390px, 430px, tablet. Keyboard access, touch overlap, reduced-motion preference, loading/empty/error states.
6. For 3D changes: render all affected scene/time variants, inspect images, validate metadata polygons and hitboxes against actual visuals. Do not substitute a green source-code assertion for a real visual check.
7. Verify no new uncaught browser errors, broken existing tab navigation, Firebase regression, unsafe Rules, or data loss. CI green **and** manual visual/security gates before merge.
8. Merge only verified PRs; confirm merge SHA and, separately, deployment if available. Monitor and be able to disable new features via flags.

**Never** remove tests, weaken assertions or bypass checks merely to get a green CI. Do not use production couple data for testing.

## 6. Immediate next actions / blockers

1. Check current `main` and PR #9 status, latest CI logs and 3D render artifacts.
2. Fix any remaining PR #9 test failures; inspect rendered room/map geometry and hit zones. Merge only after validation; otherwise document remaining blockers.
3. Run M0 audit of Firebase Rules, real data model (without exposing contents), backup/restore, and test infrastructure.
4. Create M1 design PR with scene coordinate conventions, placement schema, three-object proof of concept and 2-client tests.
5. Update this file after each milestone, including actual results.

## 7. Session handoff template (maintain this section)

```text
Date:
Current main SHA:
Milestone / branch / PR:
Implemented (verified):
Tests run and outcomes (links):
Firebase schema / Rules / migration impact:
Visual render and hitbox evidence:
Open blockers:
Next safe action:
```

**Current handoff as of 2026-11-03 — verified after PR #15:**

- **Current main SHA at handoff:** `b9a0992b2edadc936a0e8171a62f3e67404a2112`.
- **Merged:** PR #13 (M7 game theme design), PR #14 (corrected Firestore Rules membership wildcard; not a Firebase production deployment), PR #15 (isolated Firestore Emulator tests and `npm test` integration).
- **CI evidence:** PR #15 Actions #87 passed 15/15 browser tests, 9/9 Emulator tests and static checks: https://github.com/tungduong2276-lab/goc-nho/actions/runs/41631762782.
- **Firebase data/Rules impact:** no production reads/writes, migration or deployment performed during those PRs. Deployed production Rules version remains unverified. Nine Emulator tests include known-risk demonstrations of early gift reads and lost updates under `set()`; they do not establish security for unopened gifts or concurrent M1 placement.
- **Open:** PR #9 (house/weather, enlarged overall map but not each room interior; needs visual renders/hitbox confirmation and reconciliation with main), PR #12 (draft broad M0 work, partially extracted through PRs #14/#15), PR #4 (old drawing gallery fix not reconciled with latest main).
- **Remaining M0 blockers:** staging-only export/restore proof, live deployed Rules inventory/rollback, two-client offline/reconnect plus stale version tests, M1 feature flag conventions and independent visual 3D review. See `docs/M0-FIREBASE-SAFETY-AUDIT.md` and `docs/M0-STAGING-BACKUP-RUNBOOK.md`.
- **Next safe action:** validate staging backup/restore with synthetic data and admin authorization; resolve PR #9 geometry/visual inspection before persistent 3D placements. Do not merge unverified code or run tests against live couple data.

### Handoff update — 2026-11-03, M0 continuation (PR #18, pending)

- Main last confirmed at `961182c6d5b13e1aa6843d057c87879110d63ae8` (PR #16 merged). Recheck HEAD before further work.
- PR #18 `test/m0-concurrent-field-updates`: added synthetic same-document field-patch convergence, invitation-code collision, immutable-join and malformed-document permission tests; expanded CI triggers for Firebase paths and added Java 21; documented feature flags and outstanding gates. **Not merged; latest CI must be checked.**
- PR #17 `test/pr9-weather-persistence-regression`: both decorative weather regression tests passed in CI #89, but the full suite failed 2/17 unrelated garden interaction cases (character hug, gallery activation). **Not merged.**
- Production data/Rules: untouched; deployed Rules, Auth/App Check and actual staging export/restore remain unverified.
- **M0 remains incomplete** until real staging-only export/restore, authorized deployment inventory, offline/reconnect and stale revision testing, and PR #9 visual geometry review.
- Next safe action: review latest CI for PR #18, diagnose browser failures on PR #17, and arrange authorized isolated staging project validation. Do not start persistent M1 furniture writes yet.

### Handoff update — 2026-11-04, PR #9 validated but M0 not complete

- Main last confirmed: `88092f79a00917320a952a8b46fdea1a5295c1f8`; recheck before merge.
- PR #17 was merged into PR #9 feature branch; PR #21 merged current main into that feature branch without changing main. Temporary sync workflow was removed.
- PR #9 latest verified head: `8792d704dad490a570f050685a67e790b1ad8dbc`; Garden browser regressions CI #104 passed, including 3D geometry rendering, browser/navigation tests and preview artifact publication: https://github.com/tungduong2276-lab/goc-nho/actions/runs/41760611871. Branch was ahead of main with no missing main commits at this check.
- Preview artifact `house-3d-preview` (CI #104) exists; **a successful render job does not establish independent visual approval of room sizes, hit zones or design**. PR #9 still needs this review and M0 release-gate review before merge to main.
- M0 staging locked-rules unauthenticated deny-read smoke passed in run #41757873506. This is **not** proof of Alice/Bob/Eve authorization, staging export/restore, production deployed rules, offline/reconnect, or rollback.
- Firebase production: no production data migration, write, deployment or Rules change performed by this session. Persistent furniture placement must remain gated until M0 acceptance.
- Next safe action: review PR #9 3D preview and touch geometry, finish staging-only synthetic export/restore and offline/reconnect security checks, then decide whether PR #9 can be merged. Do not interpret green CI alone as M0 completion.


### Handoff update — 2026-11-04, PR #23 merged; PR #9 review pending

- **Main SHA confirmed after merge:** `7616685f6fd3c0fcd5abba239faddba2515a8ec8` (PR #23 squash merged).
- **Verified PR #23 CI:** run #108 passed static checks, Playwright browser 15/15 and Firestore Emulator 14/14; see https://github.com/tungduong2276-lab/goc-nho/actions/runs/41762525205.
- **Implemented:** an isolated, synthetic nested-document snapshot/restore regression and serialized Node test-file execution to avoid cross-file `clearFirestore()` races. This is **not** a managed Cloud Firestore export/import, real staging restore or production backup.
- **Firebase production:** no production writes, migration, Rules deployment or restore executed as part of PR #23. Existing early-gift plaintext and stale whole-document-write risks remain.
- **PR #9 review:** still draft and open; latest known head `8792d704dad490a570f050685a67e790b1ad8dbc`; CI #104 was green and generated `house-3d-preview` artifact. Its branch currently lacks two main commits (including PR #23), and GitHub reports it nonmergeable until reconciled. Static inspection of `assets/3d/scene.json`: 11 zone polygons have nonzero areas and all vertices fall inside the 1170×1960 map; separate room render size remains 1170×1170. Static bounds checks do **not** establish visual alignment, touch-target correctness or enlarged interiors.
- **Remaining M0 gates:** real isolated staging export/restore and rollback proof; review of deployed production Rules and IAM/Auth/App Check; two-client offline/reconnect/stale-revision tests; independent PR #9 visual review of rendered assets and hitboxes.
- **Next safe action:** inspect PR #9 preview images and touch geometry, synchronize its branch with latest `main` on a separate safe review step, run complete CI, and retain draft status until visually accepted. Do not enable persistent M1 placement or treat PR #23 as M0 completion.


### Handoff update — 2026-11-04, PR #9 synchronized and mobile hit targets tested

- Main at session start: `b5ddd0ab834ead769544e71fac35578f0f0bdfe4`; recheck current HEAD after this documentation PR.
- PR #9 `feature/spacious-house-weather-botany` synchronized with the above main using non-force merge commit `a8e57e6312d7fc9a40c6599f205e1172943ce207`. The 13 original feature files and three independent main-side M0 files were preserved; no Firebase production changes.
- Independent image review: CI #104 `house-3d-preview` examined. Source PNG 1170×2532 intentionally crops to packaged 1170×1960 WebP; this is expected, **not** a size regression. Six room polygons visually correspond broadly to the house but overlap due to projected room tiers, and some extend over neighboring exterior/porch. Standalone interior scenes remain 1170×1170 and are not enlarged. No claim of final design acceptance.
- PR #25 `test/pr9-room-zone-interactions` was merged into PR #9 **feature branch only** at `5ecbba67a6483a20301f689878b6ece808a5e6e5`. Its browser tests verify Enter navigation for six rooms and actual unobscured pointer-hit regions at 360/390/430px; tests do not assume the bounding-box midpoint is clickable when projected floors overlap.
- CI #114 on PR #9 head `5ecbba67a6483a20301f689878b6ece808a5e6e5` **passed**: four 3D house renders, static checks, 21/21 browser tests, 14/14 synthetic Firestore Emulator tests and preview artifact: https://github.com/tungduong2276-lab/goc-nho/actions/runs/41773787760.
- PR #9 remains open **Draft**, not merged to main or deployed. Green CI and programmatic polygon checks do not prove UX acceptance, room-interior expansion or completion of M0.
- **M0 blockers:** authorized separate Firebase staging Cloud Firestore managed export/restore to a distinct isolated destination, confirmation of deployed live Rules/Auth/App Check without private data disclosure, two-client offline/reconnect and stale-write tests, and final independent visual/mobile approval before releasing PR #9.
- **Next safe action:** keep PR #9 as Draft; review full mobile house appearance and interior dimensions (not only overview); resolve any discovered visual hitbox/design discrepancies. Re-sync PR #9 with main if new documentation commits advance main. Do not enable or merge persistent M1 placement before M0 acceptance.


### Handoff update — 2026-11-04, two-client reconnect and revision tests merged

- **Main SHA at this checkpoint:** `446cbe18be5299ee57e96a925fc4eb3dabbd24b5` (PR #27 squash merge; recheck current main before subsequent changes).
- PR #27 `test/m0-two-client-reconnect-revision` merged after GitHub Actions CI #116 passed: **15/15 browser and 16/16 Firestore Emulator tests**, including two new tests: https://github.com/tungduong2276-lab/goc-nho/actions/runs/41775183998.
- **New synthetic M0 coverage:** with Alice's field-level write queued while offline and Bob updating a different field online, reconnect preserves both and an unrelated field; a transaction with expected `revision` rejects a stale writer instead of silently replacing a partner update.
- **Important scope:** these tests validate a safer **proposed pattern**, not a migration of the app's generic `put()` whole-document write path. No production network access, staging restore, Rules deployment or live data migration occurred.
- **Still blocking M0 completion:** authorized independent Cloud Firestore staging export/restore to a separate empty target, inventory of actually deployed production Rules/Auth/App Check and IAM via authorized admin, further end-to-end browser reconnect/retry/idempotency review, and manual approval of standalone interior sizes/visual appearance for PR #9. PR #9 must be rechecked against newer main before any merge.
- **Next safe action:** obtain an authorized staging-only export/restore validation and deployed-configuration evidence; separately implement a narrow, version-aware writing abstraction for future M1 features without changing existing production data flows, with emulator tests for retry/idempotency and collision.


### Handoff update — 2026-11-04, opt-in versioned write core added (still not deployed)

- **Main at this checkpoint:** `3a1d8866fe78476333e927541584b7da06a06058` (PR #29 squash merged); recheck before follow-up work.
- **Verified CI #118:** static checks, 15/15 Playwright browser and 22/22 synthetic Firestore Emulator tests passed. https://github.com/tungduong2276-lab/goc-nho/actions/runs/41777330414
- **Implemented (not wired):** `src/versioned-write.mjs` and `tests/firebase/versioned-write.test.mjs`; `docs/M0-VERSIONED-WRITES-DESIGN.md` documents an optional transaction helper with revision compare-and-set, an operation-ID replay ledger, refusal of stale writes, collision checks and two-client emulator tests.
- **Safety boundary:** `index.html`, existing `put()`, Firestore Rules and real Firebase schema remain unchanged; no live write path uses the module. The current broad member Rules still permit direct modification of writeOps ledger and target revision, so the helper is **not production-ready authorization**. Transactions also do not commit offline.
- **Outstanding M0 gates:** actual authorized isolated Cloud Firestore staging export/restore into a second destination; deployed production Rules/Auth/App Check/IAM inventory; purpose-built Rules for writeOps plus end-to-end UI retry/persistence/reconnect testing; PR #9 full standalone room visuals and mobile design approval.
- **Next safe action:** prototype and test tightened Rules for the future writeOps schema on Emulator in a separate PR, without deploying or enabling it; continue staging-only operational verification with authorized administrator. Review and resync PR #9 after main changes, but keep it Draft.


### Handoff update — 2026-11-04, scoped versioned-write Rules candidate tested

- **Main at checkpoint:** `6c2994b0bcaf663e6ba8ce4ab8bc7dc98219a57e` (PR #31 merged; check latest main before new work).
- **PR #31 merged:** Emulator-only candidate at `tests/firebase/fixtures/m0-versioned.rules`, security regression suite `tests/firebase/versioned-rules.test.mjs`, and an optional `secureProtocol: true` extension to the **unwired** `src/versioned-write.mjs`; see `docs/M0-VERSIONED-RULES-CANDIDATE.md`.
- **Verified CI #121:** 15/15 browser and 29/29 Firestore Emulator tests passing, including ledger immutability, no unauthorized direct writes, actor spoofing, cross-document revision checks and racing writers. https://github.com/tungduong2276-lab/goc-nho/actions/runs/41779627271
- **Rules critical finding:** Firestore permits requests if **any** matching allow predicate is true. A specific writeOps/roomObjects match cannot override the broad old recursive match; the candidate explicitly excludes protected collection names from the old match. Production root `firestore.rules` remains unchanged and **does not yet have this protection**.
- **No production change:** `firebase.json`, `firestore.rules`, `index.html`, legacy `put()`, data schema and live data were untouched; no Rules deploy, staging export/restore or M1 writes enabled.
- **M0 gates still open:** admin-authorized actual deployed production Rules/Auth/App Check/IAM inspection; real separate Firebase staging export/restore with document manifest; formal security review of bounded rule-access calls, field validation, ledger growth and abuse; two-client browser/UI reconnect/retry integration; PR #9 standalone room visual acceptance.
- **Next safe action:** carry out staging-only project inventory and managed export/restore with authorized credentials, or expand Emulator-only negative/security tests while waiting for staging; do not deploy candidate Rules before reviewed staging and rollback evidence.


### Handoff update — 2026-11-04, staging preflight safety guard merged

- **Main SHA at checkpoint:** `58facfce89f8f7407c38adbe4200cd1bd640a0ed` (PR #33 squash merge; recheck HEAD later).
- **PR #33 merged:** read-only, no-network/no-subprocess script `scripts/m0-staging-preflight.mjs`, six negative/success tests at `tests/staging/m0-preflight.test.mjs`, `npm run test:staging` integrated in `npm test`, and updated `docs/M0-STAGING-BACKUP-RUNBOOK.md`.
- **CI #123 verified:** static checks, 6/6 staging preflight safety tests, 15/15 browser and 29/29 synthetic Firebase Emulator tests all passed: https://github.com/tungduong2276-lab/goc-nho/actions/runs/41795368009.
- **Strict limitation:** preflight prints `REVIEW_ONLY_NOT_EXECUTED` and `verifiedAgainstCloud: false`, validates distinct production/source/target IDs and four manual attestations; it does not authenticate, check actual project identity/emptiness/IAM/bucket ownership, execute Firestore export/import or prove any backup. **M0 staging gate remains OPEN.**
- **Still blocking:** an authorized administrator must provision independently isolated staging source and empty target, compare actual Cloud Firestore managed export and restore against synthetic nested manifest, inspect deployed production Rules/Auth/App Check/IAM and approve rollback. Production live app data and Rules were not touched.
- **Next safe action:** gather staging administrator evidence without secrets/private data and verify the completed export outputUriPrefix, destination, manifest and operation logs under two-person review. Continue to keep PR #9 Draft and M1 persistent feature flags off until all gates, including visual acceptance, are fulfilled.


### Handoff update — 2026-11-04, offline synthetic restore manifest merged

- **Main at checkpoint:** `e104769657ebee91616a1446b068e7c63c4f1ead` (PR #35 squash merge; check current main before the next change).
- **PR #35 implemented:** `scripts/m0-restore-manifest.mjs` for deterministic canonicalized SHA-256 digest/compare of strictly synthetic Firestore-style JSON document records; `tests/staging/m0-restore-manifest.test.mjs` adds 10 cases, including nested documents, missing/extra/changed paths, timestamp precision, duplicated IDs, unsafe values, out-of-scope documents and tampered manifests. Updated `docs/M0-STAGING-BACKUP-RUNBOOK.md`.
- **CI #125 passed:** static checks, **16/16 staging tests**, **15/15 browser**, **29/29 Firestore Emulator**. https://github.com/tungduong2276-lab/goc-nho/actions/runs/41799545947.
- **Scope limitation:** no Cloud SDK, no auth, no Firestore export/import, no live data, no deployed Rules update or schema change. Manifest matching only compares operator-supplied **offline synthetic** snapshots. It does not establish actual project identity, database completeness or a completed restore. Native Firestore types must be converted consistently by an authorized independent process; proof of that conversion is not yet available.
- **Still blocking M0:** authorized Cloud Firestore managed staging export/restore into a separate empty staging destination with actual operation evidence and post-restore inventory; deployed production Rules/Auth/App Check/IAM audit, release/rollback review, and PR #9 full interior visual acceptance.
- **Next concrete action:** receive non-secret staging project IDs and administrator evidence or connect an authorized staging-only administrative environment; verify source/destination and complete managed export/restore with synthetic records. Do not enable M1 placement or merge/deploy PR #9 until gates pass.


### Handoff update — 2026-11-04, PR #9 interior browser acceptance coverage

- **Main at this checkpoint:** `46f0a28fa4a17c0ebbf91a3f293621c19db4eef4`; recheck main before later changes.
- **PR #38** merged **into PR #9 feature branch only** at `b03dea8bd97e2905190019f94c921a655943b511`. Adds `tests/browser/house-interior-acceptance.spec.mjs`: verifies six independent room routes, actual loaded interior images, visible nonzero fitted geometry, no horizontal document overflow and return navigation at 360/390/430px mobile widths. Also strengthens garden keyboard test to press on the current live button after DOM rebuild.
- **Verified CI #131 on PR #38 before its merge:** static and **22/22 browser, 16/16 staging, 29/29 Firestore Emulator** tests passed. https://github.com/tungduong2276-lab/goc-nho/actions/runs/41805558827. CI #129 and #130 initially failed, respectively due to pre-existing keyboard focus re-render race and instantaneous room-size sampling; both were addressed rather than skipping assertions.
- **PR #9 after-merge CI #132** was triggered at https://github.com/tungduong2276-lab/goc-nho/actions/runs/41805967308; inspect its conclusion separately before any further merge/release.
- **Scope:** app `index.html`, 3D art, root Firestore Rules, cloud configuration and production data remain unchanged by PR #38. Test success establishes basic room image/navigation functionality **not** aesthetic approval or an enlarged 1170×1170 interior. PR #9 stays **Draft/unreleased**.
- **M0 still OPEN:** require independently authorized isolated Cloud Firestore managed staging backup/restore evidence, production deployed Rules/Auth/App Check/IAM inventory and final manual 3D room visual/design approval before production release or enabling M1 placement.


### Handoff update — 2026-11-04, house scene geometry integrity

- **PR #40 merged into PR #9 feature branch only** (feature SHA `812dd68da8e8575c4884cf289e84b3f10adf65e9`). Adds `scripts/check-house-geometry.mjs`, `tests/staging/m0-house-geometry.test.mjs`, and a static-test CI gate. No scene, art, app, Firebase Rules, live data or deployment changes.
- **CI #134 passed:** all 11 overview polygons and six room floor anchors passed geometry validation; 9 new synthetic geometry tests, **25/25 staging**, **22/22 browser**, **29/29 synthetic Emulator** tests: https://github.com/tungduong2276-lab/goc-nho/actions/runs/41810865878.
- Validator rejects coordinates outside `scene.map.size`, nonfinite or duplicate vertices, zero-area or self-intersecting polygons, missing room anchors and anchors outside respective polygons; deliberate cross-zone isometric overlap remains allowed and browser hitbox tests still govern reachability.
- **Important:** standalone interior art is still 1170×1170 and not proven physically expanded; static geometry validation does not substitute for visual/design acceptance.
- **Remaining M0 release gates:** real isolated Cloud Firestore managed export from synthetic staging source into independent empty staging target (with operation/IAM/manifests evidence); authorized inspection of deployed production Rules/Auth/App Check/IAM; visual acceptance and rollback. Keep PR #9 Draft, M1 live writes off, production data untouched.


### Handoff update — 2026-11-04, PR #9 uncropped 3D room view

- **PR #42 merged into the PR #9 feature branch only**, at `9615c4f0aa86c87dfc64f84ad3110d58b45be61f`. App change: scoped CSS for all six House room tabs displays the entire existing 1170×1170 interior artwork, replacing the former 1170/960 cropped viewport and removing its -150 source-pixel vertical offset. No scene coordinates, hit polygons, sprites, source images, backend writes or deployed Rules were modified. This improves **visible** space; physical room dimensions/artwork are NOT expanded.
- Extended `tests/browser/house-interior-acceptance.spec.mjs` to assert square room stages and zero image top offset at 360/390/430 px; hardened the keyboard polygon test to press on its live SVG target, preserving the same six exact navigation assertions.
- **CI #137** initially failed an intermittent existing house-map keyboard test while new full-room visual tests passed; correction applied without skipping tests. **CI #138 passed**: 22/22 browser, 25/25 staging and 29/29 synthetic Emulator tests, static checks: https://github.com/tungduong2276-lab/goc-nho/actions/runs/41814155209.
- **PR #9 stays Draft/unreleased.** New room view still needs manual aesthetic approval for image composition and touch affordances. Separately, M0 requires actual managed Cloud Firestore export/restore between isolated source `goc-nho-staging-2026` and target `goc-nho-restore-test` (the user created both), independent confirmation that target is empty, authorized admin/billing evidence, and production-deployed Rules/Auth/App Check/IAM review. The project IDs shown by the user are not proof of restored data or authorized API access.
- **Next safe step:** inspect true post-merge feature-branch CI, do independent full-room screenshot/visual review, then prepare a reviewed nonproduction managed export/restore session with user-operated Firebase Console. Never upgrade billing or touch production automatically.


### Handoff update — 2026-11-04, CI screenshot evidence for six rooms

- **PR #44 merged into PR #9 Draft branch only:** `10a50e1f0a2b6e5df9de8a9d039810a273cc41ad`. Added screenshot capture `tests/browser/house-visual-review.spec.mjs` and `docs/M0-HOUSE-VISUAL-REVIEW.md`, plus seven-day artifact upload in GitHub Actions. Thirteen screenshots: overview, six independent room scenes and six full room pages at mobile 390×844. No live data or source image modifications.
- **Post-merge CI #143 PASSED:** https://github.com/tungduong2276-lab/goc-nho/actions/runs/41817570706 — 23/23 browser, 25/25 staging, 29/29 Emulator; 3D render successful. Artifacts `house-six-room-review-41817570706` (about 2.6 MB) and `house-3d-preview` were published. Prior CI #142 tested the exact PR #44 feature commit before merge: https://github.com/tungduong2276-lab/goc-nho/actions/runs/41817005079. Fixed transient DOM geometry snapshot race without removing assertions.
- **Visual sign-off OPEN:** screenshots have not been manually inspected/approved for furniture overlap, floor/ceiling composition or UI controls. An explicit human pass/revise decision for each room is needed; CI screenshot generation alone is not approval.
- **M0 Cloud gate OPEN:** real isolated managed Firestore export/restore from `goc-nho-staging-2026` into separately empty `goc-nho-restore-test`, plus authorized deployed Rules/Auth/App Check/IAM and rollback audit. No production read/write or Firebase deployment in PR #44. Keep PR #9 Draft and M1 live writes disabled.
- **Next safe action:** use the Actions screenshot artifacts and review checklist to assess all six interiors; fix only demonstrated visual issues on narrow PRs. Ask the user for detailed Console steps only when real staging/admin work is necessary.


### Handoff update — 2026-11-05, M1 safe local placement-engine prototype

- **PR #46 merged into PR #9 Draft branch only** as `df19ec160ada818d448796cf5af76259dd453c65`. Added `src/house-placement-preview.mjs` pure in-memory immutable state engine, `tests/staging/m1-placement-preview.test.mjs` (10 synthetic tests), and `docs/M1-PLACEMENT-PREVIEW-DESIGN.md`. Also fixed CI paths to include `src/**` and `tests/staging/**`; no app UI, source art, Firestore Rules, live data or production deployment changes.
- Six room IDs, two candidate slots each, four prototype asset categories (`chair`, `lamp`, `plant`, `rug`), place/move/rotate/remove/undo, duplicate-ID and slot occupancy refusal, strict invalid action/room rejection, bounded undo history. `protocol: LOCAL_PREVIEW_ONLY`, `canPersist: false`. Candidate slots are derived from existing standing-character points and **NOT approved furniture locations**; real collisions with prerendered furniture/characters still require visual review and an independent placement geometry design.
- **Verified CI #148**: https://github.com/tungduong2276-lab/goc-nho/actions/runs/41945567660 — 35/35 staging (including 10 new prototype tests), 23/23 browser, 29/29 synthetic Firestore Emulator; static checks passed. Earlier CI #147 failed a known intermittent house-map keyboard navigation test unrelated to this new pure data module; the full unchanged suite passed on the subsequent job rerun. Do not erase this flake from release risk.
- **M0 still OPEN**: approved synthetic separate-project managed Cloud Firestore staging export/restore, deployed production Rules/Auth/App Check/IAM audit/rollback, and independent visual acceptance of the six rooms and furniture locations. PR #9 stays Draft; M1 live writes/feature flags remain disabled. Never connect candidate slots to production as-is.
- **Next safe action**: create a local UI preview behind a default-off flag and assess new floor-only furniture slots from actual screenshot review, then test 360/390/430 mobile and offline/reconnect. Do not enable shared persistence until Cloud safety gates pass.


### Handoff update — 2026-11-05, preserve keyboard focus across house rerenders

- **PR #48 merged into PR #9 Draft branch only**, squash `430fcd53f4262be45e8a5391deb659952d9bebd6`. When `renderHome()` rebuilds the isometric SVG, a keyboard-focused room polygon is now remembered and the equivalent fresh polygon receives focus again while the user is still viewing `#nha`. Added a real-browser regression that deliberately rerenders all six focused room polygons before pressing Enter; existing pointer/keyboard assertions remain.
- **Verified CI #156 (PR #48 before merge):** 24/24 browser, 35/35 staging, 29/29 synthetic Firestore Emulator and static checks passed: https://github.com/tungduong2276-lab/goc-nho/actions/runs/41948143034.
- Earlier CI #149 and #150 on the memory-only M1 prototype exposed recurring intermittent keyboard navigation failures; #154 initially failed due to a malformed new test insertion, which was repaired before passing CI #156. These failures were not waived.
- **Still no live M1:** the placement state is pure memory-only and candidate slots remain reused character standing coordinates, **not visual-approved furniture footprints**. PR #9 stays Draft. Separate real Cloud Firestore staging managed export/restore and deployed production Rules/Auth/App Check/IAM/rollback verification remain M0 blockers.
- **Next safe action:** verify post-merge PR #9 CI (the #157 job was triggered), then design visually approved floor slots and local-only user-visible preview. Do not enable shared Firebase writes or merge PR #9 to main before all gates.


### Handoff update — 2026-11-05, isolated M1 placement UI (PR #50, Draft)

- Created `feature/m1-local-placement-ui` from PR #9 head `e7dc343` and Draft PR #50 targeting `feature/spacious-house-weather-botany` (NOT main).
- Added `experiments/house-placement.html` and its local-only module to preview four illustrative items in six rooms, using existing candidate standing spots. Explicit opt-in button; no normal app navigation, Firebase SDK, backend writes, device storage or production migration.
- Added browser regression `tests/browser/house-placement-local.spec.mjs` for 360/390/430px, room images, interactions, reload and absence of Firebase network requests. Added safety notes `docs/M1-LOCAL-PLACEMENT-UI.md`.
- **At time of writing:** CI run #159 (`41953137827`) was in progress; DO NOT claim tests passed or merge before confirmation. Manual review of slot overlaps is pending.
- **M0 blockers remain:** deployed production Rules/Auth/App Check/IAM inspection, actual managed separate-staging export/restore and rollback evidence, and visual approval of house rooms/furniture zones. PR #9 remains Draft. No live data touched.
- **Next:** verify CI for PR #50 and repair any failure on its branch; inspect screenshots for all six rooms and adjust unapproved slots only after geometry review. Do not enable persistent M1 Firebase writes.


### Handoff update — 2026-11-05, proposed six-room floor slots (Draft follow-up)

- PR #50 merged only into PR #9 experimental branch at `c3f4fbe`; post-merge CI #41954074064 passed. `main` stayed at `e79f978`; PR #9 remains Draft and unmerged.
- Created `feature/m1-floor-slot-review` based on PR #9 after CI success. Added `src/house-floor-review.mjs`, standalone UI proposal wiring, negative geometry tests and `docs/M1-FLOOR-REVIEW.md`. Original character-standing candidates are untouched in `src/house-placement-preview.mjs`; the visual proof of concept now uses separate, proposed floor points.
- All 12 floor centers are **unapproved review proposals**. Basic source-image bound, 160px inter-slot center distance and 120px character-standing anchor clearance checks do not prove full furniture footprints or baked-in object collision. No Firestore, live app UI or production data modified.
- Next: inspect CI and snapshots for this branch; correct any failures. Review proposed floor coordinates on six room backgrounds, design per-asset polygon footprints/collision and manual sign-off. No PR #9 to main merge, no M1 cloud writes until M0 export/restore and deployed security audit pass.


### Handoff update — 2026-11-05, M1 footprint preflight PR #52 (Draft)

- Latest verified PR #9 baseline at `48d9b1c` after PR #51 merge; GitHub Actions `41955534130` succeeded. `main` remains `e79f978`, PR #9 stays Draft.
- Created `feature/m1-furniture-footprint-collision` and Draft PR #52 targeting PR #9 feature branch, not main. Scope: local-only five furniture types including table; approximate footprint rectangles, rotation, room image inset, standing-character safety discs, and simulated item-to-item collision before place/move/rotate.
- No live House UI, Firebase reads/writes, production Rules/config/schema change, schema migration or deployment. The five footprints are provisional 2D screen/image-pixel estimates; existing baked-in 3D props/walls are NOT represented as meshes and MUST NOT be considered cleared by these checks.
- Added `tests/staging/m1-furniture-collision.test.mjs`; CI run `41957498414` was in progress when this note was written. Inspect the final CI on the current head and fix any failures before merge; do not claim acceptance early.
- Next: review CI + screenshot implications, merge PR #52 into PR #9 branch only if green, verify branch CI again. For any production M1 work, first complete M0 independent Cloud Firestore staging restore, deployed Rules/Auth/App Check/IAM inspection, full collision masks / manual 3D visual approval and rollback.


### Handoff update — 2026-11-05, six-room obstacle visual audit PR #54 (staging-only)

- Rechecked PR #9 source at `773a58f` (still Draft); its post-merge CI #41959100927 failed in existing Garden pointer test when the board hitbox returned null before layout stabilized. Original staged room-zone CI #41958763237 passed. `main` unchanged.
- New branch `feature/m1-room-obstacle-audit` and PR #54 target **PR #9's trial branch only**. Added `src/house-obstacle-atlas.mjs` with 12 hand-estimated visible prop rectangles (two per existing interior, screenshot provenance #41953137827), each explicitly `approved:false`; uses `OBSTACLE_REVIEW_ZONES` only inside opt-in standalone local preview. Red overlays display candidate prop occlusions. Zero Firebase writes, production migrations or live app changes.
- New local staging tests check unapproved metadata, exclusion behavior and at least one viable chair slot per room. New Playwright screenshot capture `tests/browser/house-obstacle-visual-review.spec.mjs` saves 6 masked scene overlays and an UNAPPROVED manifest to normal 7-day review CI artifact. Garden test adds a wait for the board hitbox, preserving its 18 real pointer assertions.
- **These are not real obstacle meshes or a fully traced walkable floor.** Bounding areas are visually approximate and can both over-block and under-block furniture. Do not approve them for production based only on CI; draw/validate accurate room floor/door/lane/prop hulls against full 1170px source art, perform human sign-off. M0 production Rules/Auth/App Check/IAM audit, independent staging export+restore and rollback remain blocking. PR #9 must not merge to main yet.
- Next: verify the current PR #54 head CI, inspect uploaded six screenshots for red overlay alignment, fix failures before merging into PR #9 branch, and verify CI after that merge. No cloud writes.


### Handoff update — 2026-11-05, local obstacle atlas merged and garden keyboard focus fix

- PR #54 merged into PR #9 feature branch at `2e7f166` with six-room unapproved visible-prop obstacle silhouettes (12 coarse boxes), local-only red overlays and staged screenshot artifact. Prior PR #54 head Actions #41960776892 succeeded 55/55 staging, 27/27 browser, 29/29 emulator. These are **not** approved physical hulls, actual floor/wall meshes, or permission for persistence.
- Post-merge CI #41961169516 failed intermittently on keyboard Enter opening Garden season gallery. Separate PR #55 `fix/garden-keyboard-focus-rerender` addresses runtime lost semantic focus when `rerender()` rebuilds buttons, plus targeted Playwright proof of rerender retaining keyboard focus and single-Enter activation. CI #41961792476 and #41961766104 passed 55/55 staging, 28/28 browser and 29/29 emulator, prior to this documentation checkpoint. Verify current head CI before merge.
- Continue to keep PR #9 Draft, main untouched, no changes to production Firebase. To advance M1 safely, manually trace precise real 1170px art floor boundaries, doors, walk lanes and furniture meshes with signoff; complete M0 separate staging export/restore, production deployed Rules/Auth/App Check/IAM audit and rollback proof before any shared data writes.


### Handoff update — 2026-11-05, M1 six-room source-grounded corridor audit PR #56

- Verified PR #9 experimental base at `4b71cb4`, still Draft, with post-merge Actions `41962414903` SUCCESS (55 staging + 28 browser + 29 emulator). `main` remains `e79f978`. Existing live Firebase data untouched.
- Branch `feature/m1-six-room-walkway-audit`, Draft PR #56 targeting PR #9 trial branch only. Added `src/house-walkway-audit.mjs` to derive one corridor per room directly from the two existing character standing anchors in `scene.json` at 1170px, inspect a 32px safety radius against 12 **unapproved** visual prop bounds, and report object IDs on blocked reference segments (notably the Bếp dining-table estimate). Added stand-alone colored overlay, explicit doorway/floor missing states, staging tests and screenshot manifest checks. Documentation `docs/M1-SIX-ROOM-WALKWAY-AUDIT.md` records scope and next true-art tracing tasks.
- Door thresholds, true walkable floor and room wall mesh **are not available in scene metadata**; reports leave `doorway:null`, `floorPolygon:null`, `doorwayStatus:UNTRACED`, `floorStatus:UNTRACED`, `canPersist:false`, `approved:false`. Do not treat an unobstructed direct segment as an approved route. These overlays are only for local-only review and do not change `index.html` or Firebase.
- First CI run #41963654939 was queued when this handoff entry was drafted. Verify current commit CI, fix failures on branch, and only merge PR #56 into PR #9 trial branch after green checks. Then verify post-merge run. The actual next design task is **full 1170px composite image annotation** of doorway thresholds, floor polygons, wall/fixture collision hulls with independent visual sign-off. M0 production deployed Rules/Auth/App Check/IAM audit, genuine staging export/restore and rollback remain blockers to release/any shared persistence.


### Handoff update — 2026-11-05, actual six-room composite screenshot review (PR #57 draft)

- Confirmed PR #9 Draft at `b5a01d7`, last postmerge CI #41963992533 SUCCESS (59 staging / 28 browser / 29 Firebase emulator), `main` still `e79f978`. No production Firebase reads/writes.
- Created branch `feature/m1-composited-room-audit` from PR #9. The scene renderer uses independent sprite overlays `<button class=lay>...` over background art; old preview red boxes were estimated over background alone, so they must not be trusted as real object collisions.
- Added `src/house-composite-evidence.mjs` to inventory source image sprite rectangles and all interactive item states in six scenes without treating these bounds as solid objects. New `tests/browser/house-composite-evidence.spec.mjs` captures the **actual composited app scenes**, 390px mobile and 1300px wide, with blue source-layer box outlines (12 screenshots). Browser checks non-living-room sprite DOM layout against `scene.json` coordinates to ±2 source pixels. Added `tests/staging/m1-composite-evidence.test.mjs`, `docs/M1-REAL-COMPOSITE-REVIEW.md`.
- Scope remains **evidence only**: floor, doorways, wall colliders and depth / alpha footprints are `null` and `UNAPPROVED`, and no cloud writes / production app UI updates are authorized. Inspect the screenshot artifact and reconcile any source/render mismatch; fix CI before merging this PR into PR #9 experimental branch. No approval of real floor geometry, no M1 shared persistence and no main merge until M0 staging export/restore, deployed Rules/Auth/App Check/IAM and rollback are independently verified.


### Handoff — 2026-11-05, M1 alpha mask + phòng hiển thị rộng hơn
- Latest verified PR #9 experimental base `f9f275a`; Actions `41967545328` succeeded 63 staging + 29 browser + 29 Firestore Emulator. `main` still `e79f978`, PR #9 Draft.
- New branch `feature/m1-alpha-floor-spacious-review` targeting PR #9 only. Technical checklist: `docs/M1-ALPHA-FLOOR-SPACIOUS-IMPLEMENTATION.md`.
- New source `src/house-alpha-footprint-review.mjs` uses real image alpha to compute visual silhouette pixel bounds, tile mask and source scene coordinates. Browser screenshot test `tests/browser/house-alpha-review.spec.mjs` samples three actual WebP layers per room and exports six alpha overlays plus unapproved manifest; unit tests cover transparency, malformed pixels, source mapping.
- New `src/house-floor-zones-v2.mjs` leaves `decorFreeZones:[]`, `usableFloorAreaPx2:null` until actual floor, doorways, physical contacts and walk lanes are verified. Alpha silhouette **does not** equal floor-contact footprint. No Firebase writes.
- Experimental PR #9 `index.html` receives scoped responsive room-stage width up to 960px and near-full mobile viewport, without moving sprite hitboxes or claiming more physical floor. Browser test checks overflow at 360/390/430/1300 across six rooms.
- Check CI and exported PNG artifacts on the PR head; repair any failures, then merge only into PR #9 experimental branch and recheck postmerge CI. To **truly expand floor space**, create a separate scene/assets design pass after independent floor/door and sprite-contact geometry reviews. M0 deployed security/backup-staging restore and rollback checks remain blockers to PR #9 -> main.


### Handoff — 2026-11-05, M1 floor-contact polygon authoring PR (unapproved)
- Verified parent experimental PR #9 head `76bb345`, still Draft; after-merge Actions `41970861340` passed 71 staging + 31 Playwright browser + 29 Firestore Emulator. `main` stayed `e79f978`.
- Branch `feature/m1-contact-polygon-review-editor` targets PR #9 only. New `src/house-floor-contact-atlas.mjs` validates hand-drawn contact polygons (3–32 vertices, no self intersection, area >16 pixels², within 1170px) and source room/layer membership. All proposals remain `contactVerified:false`, `canPersist:false`; even forged approval is rejected.
- New isolated opt-in `experiments/house-contact-review.html` + UI module: review six rooms and their real sprite-image overlays, click/type polygon points, undo, in-memory proposals, JSON review export without persistence. No Firebase, no localStorage, no edits to shipped app renderer. New staging/browser tests and six screenshots at 390px, CI checks artifact completeness. See `docs/M1-FLOOR-CONTACT-ANNOTATION.md`.
- IMPORTANT: this is a data annotation/review editor, not measured contact geometry; real scene-floor, door and wall polygons still need visual acceptance. To make rooms **physically** more spacious, a subsequent independent design PR must update 3D/render source, built-in props, every sprite state, hit polygons, layer depths and anchor points consistently, after confirming true floor contacts; simple CSS scaling is inadequate.
- Before merging into parent, check latest CI results and review exported screenshot artifact, then verify post-merge CI. Keep PR #9 Draft and production Firebase unchanged pending M0 actual backup/restore staging, deployed Rules/Auth/App Check/IAM and rollback checks.


### Handoff — 2026-11-05, 3D spacious source pilot: Phòng khách và Bếp
- Confirmed PR #9 experimental head `28e7c90` (Draft), CI `41984510818` SUCCESS 75 staging / 33 Playwright / 29 Firebase emulator; main `e79f978` unchanged.
- New feature branch `feature/m1-spacious-scene-living-kitchen-pilot` from PR #9. Read `_xuong-3d/room.js`, `_xuong-3d/rooms2.js` and real 3D renderer. 3D source is now changed (not CSS): coffee table and rug in living room shifted nearer the left-side sofa, and dining table/rug in kitchen shifted to right-front edge. Two source chair sitting anchors move in lockstep.
- Source layout and approximate center-region metrics: `_xuong-3d/spacious-layout.js`, `tests/staging/m1-spacious-scene-pilot.test.mjs`. Only a proposed source-art redesign, not physically verified collider or approved floor.
- CI `garden-browser.yml` for this pilot branch renders `room.js nen lop` and `rooms2.js bep` with Three.js r169 and captures 1170px source-art **before/after composited** comparisons via `scripts/m1-spacious-preview.py`; uploads 2 PNGs + manifest. See `docs/M1-SPACIOUS-SCENE-PILOT.md`.
- **Do not merge this pilot blindly**: inspect 2 generated before/after PNGs, all four room lighting variants, object states and updated sitter positions. This pilot does not touch `assets/3d`, `scene.json`, `index.html` or Firebase yet; the actual shipped room remains unchanged. Need a separate post-approval packaging PR regenerating all WebPs and scene layer boxes from actual 3D source, plus browser touch and mobile verification. Keep parent PR #9 Draft pending M0 deployed security and staging export/restore.


### Handoff — 2026-11-05, M1 bedroom spacious real 3D source pilot
- PR #9 experimental head `a713331`, still Draft, `main` still `e79f978`. The most recent successful full test on PR #9 source was Actions `41992449821` (82 staging, 33 browser, 29 emulator); an automatically generated parent commit has an `action_required` status and should not be mistaken for a passing check on that exact SHA.
- New isolated source-render pilot branch `feature/m1-spacious-bedroom-source-pilot`. In `_xuong-3d/rooms2.js`, move both 1.2×2.0m beds modestly toward back wall, shift decorative rugs nearer bedside, and move teddy from center toward right side in Phòng Em. Keep all live room item IDs/states, user-stand points, diary/wardrobe, and props; no changes to shipped WebPs or `scene.json` in this pilot.
- `_xuong-3d/bedroom-spacious-pilot.js` records old/next positions and a conservative approximate clearance change, **not** verified collision or editable decor area. `scripts/m1-bedroom-spacious-compare.py` builds two true composited day before/after images from shipped source and new 3D render. CI branch-specific step renders both bedroom rooms and uploads review images; `tests/staging/m1-bedroom-spacious-source.test.mjs` verifies source relationships.
- Before merging, check new branch Actions and visually review both artifacts for clipped walls/canopy/diary, teddy obstructing human positions, contrast and consistent depth. After a green review, merge ONLY into PR #9 experimental branch. Do NOT update live assets yet: next PR must recrop all light/states, update metadata and rerun actual app browser/touch tests. M0 real Firebase safety gates still block PR #9→main.


### Handoff — 2026-11-05, M1 two-bedroom real asset rollout (PR pending)
- PR #62 bedroom pilot merged to PR #9 experimental branch at 4e97cfb9 after inspecting actual before/after 3D renders. Its head Actions 41993899233 succeeded 85 staging + 33 Playwright + 29 Firebase Emulator. Scene beds moved to rear wall modestly and Phòng Em teddy toward right; review-only until new images are packaged.
- Branch feature/m1-spacious-bedroom-assets from PR #9 experiments only. scripts/m1-pack-bedroom-assets.py regenerates both rooms' four lighting backgrounds and every furniture state using the REAL 3D source and synchronized metadata for image boxes, and explicitly preserves all other rooms and standing/flower shelf points.
- Workflow garden-browser.yml renders/repacks assets BEFORE npm test on this feature branch; it commits the resulting WebP binaries/scene.json to ONLY this PR head branch after tests. Browser test m1-bedroom-spacious-interaction.spec.mjs verifies hotspot/image layout at 360/390/430/1300; unit test m1-bedroom-packed-assets.test.mjs checks complete states.
- Do not claim CI success on generated assets without verifying GitHub Actions for the final binary HEAD (a bot commit may fail to trigger a workflow). Inspect new renders and metadata and only then merge to PR #9 experimental parent. Recheck CI after merge; keep PR #9 Draft and main/Firebase production unchanged. Approved real floor/contact masks and M0 security/backups remain blockers.


### Handoff — 2026-11-05, M1 room-floor evidence review PR #64 (Draft)
- **Parent PR #9:** PR #63 spacious bedroom asset package merged into experimental branch at `22b770880fd4cee8878b109f5bde9c796597f518`; post-merge Actions #219 passed: https://github.com/tungduong2276-lab/goc-nho/actions/runs/42003564328. A later bot-generated scene.json-only commit `a4c9ee3bd2abe2b4d3bf5926407404fc23914565` reports `action_required` in Actions #220, **not a successful final-HEAD check**. Keep PR #9 Draft.
- **PR #64:** review-only `src/house-floor-evidence.mjs`, negative/synthetic `tests/staging/m1-floor-evidence.test.mjs`, and `docs/M1-FLOOR-DOORWAY-REVIEW-EVIDENCE.md`; six-room geometry evidence roles include floor, doorway, walkway, fixed_contact. Missing floor/door/walkway and reserves outside proposed floor are flagged, not treated as approval. Geometry is never certified and `canPersist` is always false.
- **CI:** PR #64 Actions #221 started (https://github.com/tungduong2276-lab/goc-nho/actions/runs/42004400485); pending at handoff, so PR #64 has **NOT** been merged.
- **Production safety:** no live Firebase read/write, deploy, Rules/config/schema changes, or new persistent placement flows. M0 remains incomplete: actual staging-only managed export/restore evidence, deployed Rules/Auth/App Check/IAM/rollback review, and independent six-room visual/floor clearance acceptance.
- **Next safe action:** verify PR #64 CI on its final head, review all six actual room renders, then merge review-only work to PR #9 only if checks pass. Collect floor/contact/doorway human annotations separately; no shared placement until M0 gates pass.


### Handoff — 2026-11-06, M1 six-room lighting + evidence provenance
- Verified PR #68 (`feature/m1-four-lighting-floor-review`) merged to experimental PR #9 at commit `b098927851dbafe5045129615994ab17829116d1`, with source-head Actions #234 green (95 staging, 39 Playwright, 29 Firebase Emulator) and all **24** real six-room × four-lighting screenshot artifacts inspected. Parent post-merge Actions #235 also succeeded on that exact commit.
- PR #9 remains **Draft**, not merged to `main`; no writes to Firebase production or deployed Rules.
- New isolated PR #69 `feature/m1-floor-evidence-scene-provenance`: `src/house-floor-review-provenance.mjs`, updates to `experiments/house-floor-review-ui.mjs`, synthetic + browser tests and review guide. Source SHA-256 plus room, light, selected layer and visible-state keys accompany each manually authored polygon. A hidden furniture sprite cannot be the basis for a contact proposal. This is an audit trail only, **never collision approval**.
- PR #69 Actions #236 passed 98 staging, 41 Playwright and 29 Firebase Emulator tests on code commit `decb9a2cc7697cf2a8f0958d3797f7c251c4f053`. This handoff-only commit needs its own final-HEAD CI check; **do not merge PR #69 until that succeeds**.
- Actual six-room floor boundary, door, walkable corridor, every fixed furniture contact and standing-point masks remain unapproved. Keep `canPersist:false` and do not enable decoration sync. M0 production security checks and independent staging export/restore remain prerequisites to PR #9 → `main`.
- Next: confirm final PR #69 CI, merge only to PR #9 experimental branch if green, confirm post-merge check. Then manually author physically grounded contact/floor polygons against source 3D renders (all lighting and interaction states) or create a separate read-only review-proposal tool; never infer verified colliders from alpha bounds.


### Handoff — 2026-11-06, M1 mesh-derived room contact audit pilot
- Verified parent PR #9 `feature/spacious-house-weather-botany` at `2682f49d217de136be6ef0a27b9aa086eef99de7` remained Draft, with Actions #238 SUCCESS. `main` and production Firebase were not touched.
- Opened isolated Draft PR #70 `feature/m1-3d-mesh-floor-contact-candidates` into PR #9. Source exporter `_xuong-3d/m1-ground-contact-proposals.mjs` reads real Three.js room scenes via read-only `inspectRoomSource()` in `_xuong-3d/rooms2.js`; CI-only artifact JSON records mesh ground-proximity source-space world X/Z rectangle and projection via room camera (1170px), plus source file SHA-256.
- Artifacts from Actions #239 were downloaded and parsed: 5 source rooms, 36 interactive item states; 33 near-ground rectangular candidate envelopes, 3 wall-mounted states with null ground envelope. All 33 rectangles are within the respective source shell rectangles. This is NOT a physical foot polygon: the 0.14m threshold and mesh AABB overestimate and background/deco obstacles, room doors and walkways are not included. The separately built living room is not covered.
- All records remain `EXPERIMENTAL_ONLY`, `contactVerified:false`, `canPersist:false`; no app, Firestore, deployed Rules/schema or live user data edits.
- This documentation commit changes the PR head after #239. **Before merging PR #70, verify the final-head rerun succeeds**, inspect artifacts and make no approval claim. Merge only to PR #9 experimental branch, never to `main` while M0 staging export/restore, deployed Rules/Auth/App Check/IAM and rollback remain unverified.
- Subsequent physical M1 step: include baked background/deco props and living-room source, move from rectangular mesh bounds to a smaller verified floor-contact mask and validated room entry/walkway geometry, then mobile/depth/interaction review.


### Handoff — 2026-11-06, M1 living room + baked background 3D source audit (PR #71)
- Parent experiment PR #9 `feature/spacious-house-weather-botany` HEAD `0a00014d250e0afef0201fc73ae027e09f0c90e5` was **Draft**, post-merge Actions #242 SUCCESS. No production Firebase/main deployment changes.
- New isolated PR #71 `feature/m1-six-room-baked-prop-contact-audit` adds read-only `inspectLivingSource()` to `_xuong-3d/room.js`; background component inspection and rug/floor-tile labels to `_xuong-3d/rooms2.js`; six-room mesh inspection and warning flags to `_xuong-3d/m1-ground-contact-proposals.mjs`, new real-3D Node tests, CI artifact export, and `docs/M1-SIX-ROOM-BAKED-CONTACT-AUDIT.md`.
- Feature CI #243 SUCCESS on its earlier code commit (4 source-mesh tests, 98 staging, 41 Playwright, 29 Firebase Emulator). Artifact from live Three.js source inspected: **six rooms; 42 interactive states and 199 baked components**, of which **109** baked components have candidate near-ground geometry. Kitchen includes many individual floor tiles, NOT furniture blockers.
- Detected two out-of-shell baked AABBs (living pothos slightly beyond X=3m and Gác `deco-011` beyond Z=-2m); large source envelopes also need manual review. The new diagnostic warnings do NOT imply movement blockage, collision clearance or review approval.
- IMPORTANT: living room is `LIVING_DEFAULT_STATES_ONLY` (six default interactive components); other five rooms inspect all source item states. Neither room-shell rectangle nor mesh near-ground AABB is a verified walkable floor polygon. Doorways, stairs and human path connectivity, true contact contours and alternate living states remain unapproved.
- **PR #71 is not automatically safe to merge after this docs update**; verify successful CI on its final HEAD, inspect candidate artifact, then merge ONLY into PR #9 experimental parent and check post-merge CI. Keep `canPersist:false`, no production Firebase read/write or deployment. M0 deployed security checks plus staging backup/restore remain mandatory for `main`.
- Next safe M1 task: compare source AABBs to actual isolated 3D render (floor plane slices where appropriate), manually classify built-in obstacles vs rugs/finish, handle living alternate states and validate entry/door/walkway geometry. Do not start persistent decoration until floor and contact approved.


### Handoff — 2026-11-06, source mesh plane-section pilot (PR pending)
- Verified PR #9 experimental head `96a9f4ced1ea42568d18bca43ad8d92168796d2b` with CI #248 SUCCESS; PR #9 remains Draft to `main` and Firebase production is untouched.
- Isolated branch `feature/m1-mesh-plane-slice-evidence` (PR to experimental parent) supplements prior near-ground AABBs with actual indexed/non-indexed THREE.js triangle intersections at world Y=0.08 m in **all six rooms**, retaining multiple open/closed line contours and projecting them through the real camera onto 1170px source coordinates.
- New source `_xuong-3d/m1-plane-slice-geometry.mjs` and `_xuong-3d/m1-ground-section-proposals.mjs` plus 9 source-specific tests, a branch-only CI extraction/upload step and `docs/M1-TRIANGLE-PLANE-CONTOUR-EVIDENCE.md`. Artifacts intended: six SVG review-only overlays and source/algorithm-hashed JSON `review-artifacts/house-mesh-sections/source-mesh-plane-sections.json`.
- **Do not treat this as physical contact or floor clearance**: sections at a single plane can miss low objects, cope imperfectly with coplanar/open/incomplete meshes, and do not classify actual doorways, corridors, ground truth floor contact, steps or entryways. Living source still lists default item states only. `contactVerified:false`, `canPersist:false`, no Firebase writes.
- Pending acceptance: full CI on final feature HEAD, download and inspect actual six SVGs and JSON counts/flags; repair test/render failures if present. Merge only to PR #9 experimental branch once green, then verify parent post-merge CI. Never merge parent to main before deployed M0 Rules/Auth/App Check/IAM/rollback and independent staging backup/restore are evidenced.


### Handoff — 2026-11-07, M1 all-room physical expansion and exact committed assets (PR #75 / #76)
- The experimental PR #9 remains **Draft**, `main` and both users' Firebase production documents unchanged. PR #73 (`feature/m1-multiheight-living-states`) merged four real mesh-section heights (4/8/22/45 cm) and all 12 living-room sprite states; final source CI #252, parent #253 SUCCESS. No path or door approval.
- PR #74 (`feature/m1-open-edge-route-candidates`) merged source-only conservative path diagnoses using six actual Three.js room scenes and 13 standing points; feature CI #254 and experimental parent post-merge #255 SUCCESS. Two source-positive perimeter edges are **not modeled doors**; all routes are unapproved. An attic translucent sunlight mesh was wrongly classified as an obstacle, now tagged `LIGHT_EFFECT_NOT_BLOCKER`.
- PR #75 (`feature/m1-six-room-world-expansion`) from parent: genuine Three.js shell and furniture world coordinate changes, NOT CSS enlargement. Five 6×6m rooms become 7×7m (+13m² each); Gác 6×4m becomes 7×5m (+11m²). Camera source 112→96 px/metre, output image 1170×1170. Standing/sitting/pet/painting positions were mapped into expanded world coordinates too. **Final source CI #268 SUCCESS** (5 source physical-geometry tests, 4 route tests, 98 staging, 41 Playwright, 29 Firebase Emulator); review-only before/after composites produced. PR #75 still Draft.
- Stacked PR #76 (`feature/m1-six-room-expanded-assets`) repacks all 24 time-of-day backgrounds and 48 sprite/state WebPs from real Three.js rendering; `scene.json` spot/layer/canvas metadata synchronized with full item key preservation, floor-collision and doorway verification explicitly false. A previous old bot build failed at push due CI race. A newer run #272 on source head `efefffbf3292250a25d2390aca175886a4901cfc` **SUCCESS** (5 source tests, 99 staging, 42 Playwright, 29 Firebase Emulator) and generated packaged binary HEAD `bc863b527047c3ba3c5ed5728ba92deb63d351a8`.
- A new six-room Playwright check at 360/390/430/1300 px discovered that four rooms had furniture buttons disabled by `pointer-events:none`. Fixed six-house-room scoped CSS so furniture buttons receive real pointer hits and background images never consume taps. The new test was included in green CI #272.
- **IMPORTANT CI gate:** Bot-created packaged head `bc863b5` has `action_required`, NOT passing CI. Require a new read-only rebuild/compare workflow on its *latest* human-authored HEAD, verify binary WebPs + `scene.json` exactly match real source output, inspect final screenshot artifact, then merge PR #76 only into source PR #75; verify PR #75 CI and then merge PR #75 only into PR #9 experimental parent if successful. Keep PR #9 Draft.
- Cannot claim working 3D furniture placement is released: no verified floor polygons, physical colliders, real doorway geometry, walked corridors, avatar clearance or Firebase deployment. M0 staging export/restore and deployed Auth/Rules/App Check/IAM, backup and rollback remain unresolved.
