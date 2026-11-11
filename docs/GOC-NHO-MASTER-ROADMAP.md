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


### Handoff update — 2026-11-08, live 3D house prototype (Play Together direction)

- **Main at session start:** `e79f97870c4ea1797ba22c8a6d7011c66e5c9d4a`. Branch `feature/nha3d-play-together-prototype` (from main; independent of PR #9/#79/#92).
- **Product direction from user:** rebuild the house mechanic to feel like Play Together (avatar walks freely, free furniture placement, interact with furniture, outfits). Prerendered-image rooms cannot support this; the prototype instead runs the existing `_xuong-3d` three.js builders **live in the browser**, keeping the exact toon/outline/iso art style.
- **Implemented (standalone, opt-in page `nha3d/`, not linked from `index.html`):** joystick + tap-to-walk with A* and collision slide; sit/sleep/use 13 interactive furniture types; autonomous partner (joins you on a shared seat) and cat; hug/high-five/wave/hearts/8 expressions; decorate mode with 31-item tray, grid drag/rotate/wall items/store/undo, wall/floor colours; wardrobe using `rig.js` layers; 4 times of day. Footprints derived from measured model bounding boxes. See `docs/V2-NHA3D-PLAY-TOGETHER-PROTOTYPE.md`.
- **Firebase / Rules / data:** none. Zero Firebase reads/writes (browser test asserts no Firebase requests); layout/outfits stored only in that browser's `localStorage`. `_xuong-3d` changes are additive exports only.
- **Tests run locally this session:** 11 new engine tests + all 27 `tests/staging` tests pass; `check-garden` + new `sync-nha3d --check` pass; the 7 new Playwright specs pass under a local Chromium/SwiftShader harness. **PR #93 CI run 42443880665 passed** at `a119e37`: static + sync check, 27/27 staging, 22/22 Playwright (incl. 7 new), 29/29 Firestore Emulator — https://github.com/tungduong2276-lab/goc-nho/actions/runs/42443880665 (first run 42443312087 failed only because the test server has no directory index; fixed by opening `/nha3d/index.html`). PR #93 stays Draft; not merged or deployed.
- **Visual evidence:** screenshots inspected at 360/390/430 px (play, sit together, sleep at dawn, wardrobe, decorate, drag). No real-phone performance measurement yet (~385 draw calls, ~140k triangles per frame in first measurement).
- **Open:** no two-person sync or realtime presence; single room; real-device FPS; whether to merge this direction with V2 #79 features. M0 cloud gates unchanged and still block any shared persistent write.
- **Next safe action:** user tries the prototype on both phones; if the direction is approved, design `rooms/{roomId}/objects/{objectId}` persistence on top of `src/versioned-write.mjs` behind a flag, plus multi-room doors, without touching production data until M0 gates close.


### Handoff update — 2026-11-08, Nhà 3D three-room integration review

- **Integration PR #97 Draft:** https://github.com/tungduong2276-lab/goc-nho/pull/97, branch `staging/nha3d-integrated-review-20261108`, based on PR #96 head `9634222964322bb764ce1648cd54dfc3cb0ace9f`, targeting `main`. It combines PR #93 (standalone real-time 3D), #95 (three-room navigation), and #96 (visual rooms, activities and cancellation tests); 47 commits ahead and zero behind main when branch was created. This is a **review branch, not a deployed staging site**.
- **CI verified:** PR #93 workflow `42444142711` passed; PR #95 workflow `42445774522` passed on rerun after an npm cache `EEXIST` installation failure; PR #96 workflow `42478559508` passed, including activity interruption regression. PR #97 workflow `42487705396` passed on the integration head `9634222`. This documentation-only follow-up commit requires its own fresh CI verdict; do not assume green for an untested head.
- **Safety:** the preview is isolated at `/nha3d/multiroom-preview.html` and is not a production Firebase feature. No Firebase production mutations, schema migrations or main merges were performed for this integration review.
- **Release gates still OPEN:** independently verify real-phone visuals and performance at 360/390/430 px; review staging deployment routing and accessibility; confirm synthetic two-client/offline-reconnect checks for any future shared persistence; demonstrate nonproduction Cloud Firestore managed export/restore and review deployed Rules/Auth/App Check/IAM and rollback before enabling shared writes. Do not equate a passing synthetic Emulator suite with production security approval.
- **Next action:** review CI for this documentation commit, then prepare an explicit staging-only deployment and device acceptance checklist without enabling production writes or merging PR #97.


### Handoff update — 2026-11-10, real-device acceptance and local companion slice

- **PR #97 staging:** https://github.com/tungduong2276-lab/goc-nho/pull/97 remains **Draft**, not merged into main. User successfully deployed static Hosting Preview Channel `nha3d-review` in separate project `goc-nho-staging-2026` and supplied the URL https://goc-nho-staging-2026--nha3d-review-iivw5f6z.web.app (reported expiry 2026-11-17 14:46:26 +07:00). This is a *preview channel*; production `goc-nho` was not deployed by these instructions. Exact deployed SHA was not recorded.
- **User-reported 6/6 functional acceptance:** 3D canvas displays; three-room door navigation; avatar walking avoiding furniture; tea, cooking and note activities; interruption cleanup when changing rooms; and a second phone can open and control the preview independently. The report contains no device/browser models, performance benchmark, screenshots or proof of actual cross-device synchronization; do not infer multiplayer support or full release sign-off.
- **Last confirmed CI before new feature:** PR #97 head `55890967f447cf8f59e717f756841ec22081e70a`, workflow `42589318515`, **success**. Earlier isolated bundle workflow `42495930903` published `nha3d-staging-review`.
- **New M1 prototype increment in PR #97 (post-acceptance):** added `nha3d/partner-preview.mjs` (collision-aware companion spawn and route that never enters the player's cell), a visibly labeled *local-only simulated companion* in `nha3d/multiroom-preview.js` that can be shown/hidden, approach the avatar and high-five, and relocate with the player when crossing a room door. Added node unit tests, real-browser interaction/mobile-width regressions, and included the helper in the isolated staging bundle. No Firebase, schema, Rules, backend or live identity changes. This is **not** live two-person presence; the already deployed preview URL does not contain this feature until the new head is separately verified and redeployed.
- **Validation:** new head's CI is pending at the time of this handoff update; check the exact latest SHA and workflow outcome before claiming tests passed or publishing an updated preview. Existing user-reported 6/6 acceptance applies only to the prior staging build, not the new companion slice.

- **CI finding on companion head `41635ce`:** GitHub Actions run `42779413936` completed the static and **45/45 staging tests** successfully, and all new multi-room/companion Playwright checks passed. Overall first attempt failed **1 of 36 browser tests**: the pre-existing Garden overlap case `daily pot wins over the overlapping seed-box hit region` saw no `Đã tưới` toast after a raw coordinate click. This is an unrelated, previously intermittent Garden test, not evidence that the companion test failed. Failed-job rerun was requested via GitHub Actions, with result pending when documented. Preserve the assertion; investigate separately if repeatable. No merge or preview update authorized until the exact rerun outcome is checked.
- **Open M0 blockers:** demonstrated managed Cloud Firestore staging export to a separate restoration project and successful restore/rollback checks; deployed production Rules/Auth/App Check/IAM review; PR #9 room-geometry and shared placement approval; secure concurrent/offline/reconnect testing before enabling actual two-person Firebase writes. PR #9 and M0 PR #12 remain Draft. Keep #97 Draft and avoid production merge.
- **Next safe actions:** fix CI failures (if any), get an updated preview artifact, redeploy *only* to the existing staging Preview Channel with a verified branch snapshot, and obtain manual phone feedback on summon/high-five/door interruption. Then design genuinely authenticated two-person realtime presence behind isolated staging-only feature flags and emulator tests, without persisting production data prematurely.


### Handoff update — 2026-11-10, companion 6/6 acceptance and opt-in two-tab laboratory

- **PR:** #97 Draft, staging integration branch `staging/nha3d-integrated-review-20261108`, targeting main. PR #9 (3D room/visual) and PR #12 (M0 safety) also remain Draft and unmerged. No Firebase production operation or main merge was performed by this work.
- **User-reported clean staging deployment:** static artifact from CI `42780426505` on `532af49` (success), operator's CLI showed `found 14 files in dist-nha3d-staging`, `Deploy complete!` to the **separate** Firebase project `goc-nho-staging-2026` (Preview Channel `nha3d-review`), URL https://goc-nho-staging-2026--nha3d-review-iivw5f6z.web.app, expiry 2026-11-17 22:53:03 (+07:00). Artifact hash/exact deployed SHA not attested by Firebase CLI; no production deployment was reported.
- **Second operator-reported manual acceptance: 6/6 PASS** for the local-only companion (spawn, two-character high-five, following rooms, cancel on door, hide/rejoin, controls on second phone). No issue reported. This is not evidence of real two-phone sync, FPS results or Cloud security.
- **Next M1 safe slice, on PR #97 but NOT yet deployed or accepted:** opt-in `?lab=two-tabs` mode using same-origin `BroadcastChannel` to exchange two-tab room+walkable cell presence within a single browser profile, showing a different-colored remote avatar only while both tabs are in the same room. Dedicated pure `presence-lab.mjs` contract validates message version, IDs, monotonically increasing sequence, timestamp freshness, room bounds, collision-safe tile; `two-tab-lab-browser.mjs` drives hello/state/bye, heartbeats, disconnect and peer timeout with no persistence, authentication or Firebase. Additive UI preserves normal local companion page, browser + Node two-client regressions, and isolated 16-file staging bundle. Scope and limitations in `docs/NHA3D-TWO-TAB-LAB.md`.
- **CI on the new lab head:** must be checked after final commit. Do not call it passing merely because earlier `532af49` CI was green. No replacement staging deploy yet; the approved 14-file preview still serves the prior companion version.
- **M0 blockers remain:** managed Cloud Firestore nonprod export/restore to a separate project, inventory actual deployed Rules/Auth/App Check/IAM/rollback, visual approval of PR #9 room geometry, and authorized two-client emulator/offline/concurrency/reconnect tests. Do not turn tab-only unauthenticated transport into internet-wide sync or merge this PR until gates are met.
- **Next safe action:** inspect CI of final lab head (staging unit, Playwright two-tab, Firebase Emulator, static), diagnose any failures without weakening assertions, then release an artifact for operator-only Preview Channel deployment and opt-in browser two-tab acceptance. Independently design staging-only authenticated two-phone presence behind M0 safeguards.


### Handoff update — 2026-11-11, reported two-tab pairing failure and V2.2 diagnostics

- **Real staging observation from user:** the separate Firebase Hosting Preview Channel `nha3d-review` under `goc-nho-staging-2026` reported successful deployment of **16 static files**, URL https://goc-nho-staging-2026--nha3d-review-iivw5f6z.web.app (user-reported expiry 2026-11-17 23:39:42 +07:00). User then reported **0/6 acceptance items passed** because the two tabs did not connect. Treat the feature as **not accepted**. Other five dependent acceptance checks were not reliably exercised; do not mark all six as independent regressions.
- **Verification limit:** No user browser console output or live staging page access was available to attribute a confirmed root cause. Plausible explanations are wrong lab URL / different storage partition or browser profile, stale JS cache despite successful file-count deploy, background tab throttling or pre-existing third lab tab. Previous successful Playwright two-tab test alone is insufficient to override field failure.
- **V2.2 corrective work on PR #97 (unmerged, NOT deployed):** explicit versioned `?lab=two-tabs&rev=20261111b` HTML + JS and module query to mitigate cache; visible status panel with sent/received/ignored message counters, current peer state and diagnostic guidance; one-click **Mở tab thứ hai trong Chrome này** that automatically opts both tabs in and uses a fresh 20-char hex `pair` channel key; extra heartbeat timer independent of `requestAnimationFrame`. Original simulated-companion path with no query stays unchanged. No Firebase SDK or production data access.
- **Tests added:** one-click same-profile two-tab pair handshake, same pair query on both pages, visible state and disconnect; intentionally separate Chromium profiles cannot see each other; 360px diagnostics; isolated 16-file staging artifact retains allowlist. Unit packet-contract and earlier multiroom/browser/Emulator checks preserved. Validate latest exact-head CI **after** these commits before offering any redeploy command.
- **Open M0 gates unchanged:** staging managed Cloud Firestore export/restore verified on separate project, deployed Rules/Auth/App Check/IAM, production rollback, PR #9 room geometry and authoritatively permissioned two-phone sync. PR #97 stays Draft. Do not merge main or enable real Firebase presence based on this local-lab proof.
- **Next action:** review latest exact-head CI, fix new failures without weakening assertions, then provide operator artifact link and instructions for clean, 16-file **staging Preview Channel only** deployment. Field acceptance should record the observed V2.2 banner and both status panels; if not connected, use non-sensitive displayed counters to distinguish CDN/cache and browser partition issues.


### Handoff update — 2026-11-11, two-tab V2.2 acceptance and M1 authenticated presence candidate

- **User confirmed field acceptance: 6/6 PASS**, no reported errors, on the **same-browser** opt-in V2.2 two-tab staging preview `goc-nho-staging-2026`, `nha3d-review`: movement mirrored, separation when one tab enters kitchen, reunion in same room, departure on returning to living room, disconnect, reconnect. This is a user-report, not independent real-device observation; **does not prove two-phone network sync**.
- **CI on V2.2:** run `42997267353` passed 49/49 Node staging, 41/41 Playwright, 29/29 synthetic Firestore Emulator at head `bca125f`. V2.2 Preview Channel deployed by operator, not CI. PR #97 remains Draft and unmerged, main and production data unchanged.
- **Next safe M1 increment on Draft PR #97:** new `tests/firebase/fixtures/m1-nha3d-presence.rules` and `tests/firebase/nha3d-presence-rules.test.mjs` for **Emulator-only** identity-bound, scoped, short-lease room/cell presence under `couples/{cid}/nha3dPresence/{uid}`. Alice/Bob read each other but may write/delete only their own docs; Eve/anonymous and other couples are denied, identity spoofing and malformed schema disallowed. Sequence monotonicity, server time, 15s max TTL and 1s minimum update spacing are candidate controls. The new `nha3dPresence` name is excluded from the legacy broad recursive member write allow; keep the existing M0 `writeOps` and `roomObjects` exclusions. All changes are **test fixture and docs**; root `firestore.rules`, `firebase.json`, frontend preview bundle, deployed staging Rules and all production data stay untouched.
- **Tests:** new exact-head CI **must be verified**; earlier V2.2 green CI is not evidence for new Rules candidate. See `docs/NHA3D-EMULATOR-PRESENCE-CANDIDATE.md` for data contract, limitations, security review and release plan.
- **M0 blockers:** managed Cloud Firestore export/restore across separate non-production projects with admin evidence; production/staging deployed Rules/Auth/App Check/IAM and rollback review; PR #9 geometry signoff; further browser two-device offline/reconnect and server-authenticated membership tests, TTL cleanup/cost review. Do not enable actual cross-phone Firebase writes/reads or merge PR #97 before all gates.
- **Next action:** diagnose and fix any new Emulator CI failures without weakening authorization assertions; then design a guarded staging-only client adapter and staging admin verification procedure. Real two-phone presence remains planned, not delivered.


### Handoff update — 2026-11-11, emulator-only two-member presence client adapter

- **PR #97 remains Draft** (no merge or production changes); user manually confirmed 6/6 V2.2 same-browser acceptance, not real two-phone sync. Previous exact head `0c13d681` passed 49/49 staging, 41/41 Playwright, 38/38 Firestore Emulator tests for the first identity-scoped candidate.
- **This increment implemented, not wired to the website:** `nha3d/emulator-presence-client.mjs` is a dependency-injected (no Firebase import) prototype requiring exact `demo-goc-nho-safety` project plus loopback Emulator address; its public methods join/publish/disconnect/getPeer/tick are intentionally unconnected to any live Firebase project. The module accepts only room+tile presence, timestamp leases and monotonic sequence; throttles writes, refuses known-offline sends, screens stale/invalid/pending snapshots, and expires peer display locally. Explicit disconnect sends no delete, to avoid an old client deleting a newer session under the candidate owner-only delete allowance.
- **Tests:** `tests/staging/nha3d-emulator-presence-client.test.mjs` (fake injected SDK: invalid target/UID/positions, lease expiration, offline, stale replay, in-flight stop) and `tests/firebase/nha3d-presence-client.test.mjs` (authenticated Alice/Bob SDK clients sharing *loopback Emulator* room/cell state, offline guard, unauthorised Eve). Both are new and require **exact-head CI verification**. `tests/staging/nha3d-staging-bundle.test.mjs` explicitly excludes the Emulator adapter; bundle expected to remain exactly **16 files**. No Firebase SDK, Rules or client was wired into the staging Hosting preview.
- **Docs:** `docs/NHA3D-EMULATOR-PRESENCE-CANDIDATE.md` updated with transport contract, client/server clock, delayed SDK write caveat and security release gates. This remains **protocol research**, not a live two-phone feature.
- **Still blocked by M0:** administrator-proven managed export/restore of synthetic staging data into separate isolated test destination, deployed Rules/Auth/App Check/IAM/rollback review, rule cost/TTL/abuse analysis, PR #9 room geometry and tested two-device UI. Existing broad cloud nested Firestore permissions would allow unsafe writes if the presence collection is enabled without correctly excluding it; do not deploy candidate fixture or merge this PR.
- **Next safe action:** verify latest CI head, investigate failures without relaxing security assertions, then continue only within Emulator or read-only staging-admin verification. No new user CLI deploy is necessary.


### Handoff update — 2026-11-11 evening, CI hang investigation & safe disconnect

- **Previous M1 head `1d2018d1d369ba6035d8e64ad5e534554acb5470`:** CI run `43004621155` was CANCELLED after 20-minute test step. Earlier `43004254876` also cancelled. Logs showed the three new `tests/firebase/nha3d-presence-client.test.mjs` subtests individually **PASS**, then no final Node test summary before timeout. Likely a hanging Firestore SDK client/listener during cleanup, but actual open handle was not independently identified.
- **Fix committed on the same Draft PR #97:** integration tests now track each RulesTestContext Firestore SDK instance and `terminate()` them in `afterEach()`, before environment `cleanup()`; no test assertions or authorization guards were weakened. Details in PR comment.
- **Additional privacy/race fix:** `nha3d/emulator-presence-client.mjs` checks `active/closed` immediately before deferred transport dispatch. A disconnect in the interval between invoking `publish()` and running its microtask now yields `stopped-before-write` and **does not send the location**. `tests/staging/nha3d-emulator-presence-client.test.mjs` asserts zero new writes in that race.
- **Latest code commit before this documentation update:** `8b09afc76c741cfbf0b7b27756ed4d979ea33f27`; its Actions run `43038865231` was still **in progress (Chromium installation)** at last check, NOT yet a green result. Do not claim CI success or merge until **the exact final HEAD** is green. If tests hang again, inspect integration test listener/SDK teardown and ensure the Node process truly exits; do not mask leaks with a force-exit flag.
- **Scope remains Emulator-only:** no change to live `firestore.rules`, `firebase.json`, shipping frontend, staging hosting preview, production data or real two-phone synchronization. User-reported V2.2 **same-browser** presence accepted at 6/6 remains the last manual acceptance. PR #97 Draft/unmerged; PR #9 geometry, PR #12 M0 cloud/export/restore and actual deployed Rules/Auth/App Check/IAM checks remain open.
- **Next engineering action:** verify CI on latest commit; if green, continue design of explicit staging-admin managed export/restore and Rules review, then guarded two-device staging acceptance only after M0. No user Firebase/PowerShell step needed for this emulator-only change.


### Handoff update — 2026-11-11 late, bounded Firestore Emulator SDK integration

- **Field acceptance baseline unchanged:** user confirmed V2.2 same-browser lab 6/6, but real two-phone network sync remains unbuilt/unaccepted. PR #97 stays Draft, main and cloud Firebase untouched.
- **New PR #97 client adapter** `nha3d/emulator-presence-client.mjs` is still Emulator-only and excluded from the 16-file Hosting bundle; includes no-send-after-disconnect guard with a dedicated regression test.
- **CI diagnosis:** earlier M1 tests passed Node stubs and Playwright, but three Firestore SDK integration assertions passed without the Node test process exiting. Public SDK `terminate()` and `RulesTestEnvironment.cleanup()` both returned; diagnostic showed one TCP `127.0.0.1:8080` socket kept open by the long-lived Firestore `onSnapshot` gRPC stream. Attempts to close remaining Firebase apps (none registered) or the isolated socket still failed to end the process; prior CI runs `43040762177`, `43046151432`, `43048073987`, `43049385579`, `43049891164` were not green.
- **Current candidate solution:** `tests/firebase/nha3d-presence-client.test.mjs` now uses actual authenticated `setDoc/getDoc` Firestore Emulator reads/writes and delivers committed peer documents into the *injectable* subscription callback, rather than opening a long-lived Node `onSnapshot` stream. `tests/staging/nha3d-emulator-presence-client.test.mjs` explicitly tests callback lifecycles including unsubscribe after disconnect. `tests/firebase/nha3d-presence-rules.test.mjs` strict Alice/Bob/Eve Rules tests remain unchanged. The CI quick test job fails fast on hung handles without masking results. **Need exact-head CI success before declaring this slice complete.**
- **Coverage limitation:** this is no longer direct SDK push-delivery verification. A separate actual `onSnapshot` browser-side Emulator test (with browser context cleanup and synthetic identity) remains required before a real two-phone staging preview; do not mistake polling proof for realtime push proof. Details `docs/NHA3D-EMULATOR-PRESENCE-CANDIDATE.md`.
- **M0 still open:** isolated nonproduction managed Firestore export/restore proof, actual deployed staging Rules/Auth/App Check/IAM/rollback audit, PR #9 room geometry and two-device acceptance. No changes to production data, deployed Rules or `main`.


### Handoff update — 2026-11-11, M0 offline export/import evidence checker and M1 deletion hardening

- **At start of this increment:** PR #97 Draft at `20873be5c92d7081eab53bf6b62559db046c10dd`; exact-head GitHub Actions `43052046948` **SUCCESS** (57/57 Node staging, 41/41 Playwright, 41/41 Firebase Emulator, standalone 3/3 presence job). User's V2.2 two-tab field acceptance was 6/6; no two-phone cloud acceptance exists.
- **Candidate Rules security hardening (Emulator-only):** `tests/firebase/fixtures/m1-nha3d-presence.rules` now sets `allow delete: if false` for all `nha3dPresence/{uid}` client requests, matching the adapter's unsubscribe-only disconnect. It closes the stale authenticated device's ability to delete another active session with the same UID. The broad recursive legacy member permission still **excludes** `nha3dPresence` to avoid OR-rule bypass. New regression in `tests/firebase/nha3d-presence-rules.test.mjs` checks both partner and owner cannot delete, while the record remains readable. No root `firestore.rules` change or deployment.
- **M0 offline reviewer:** `scripts/m0-staging-evidence-review.mjs` integrates the pre-existing staged-project preflight with synthetic manifest hash comparison and manually supplied sanitized managed-operation metadata. It rejects unexpected fields, wrong project, unapproved export prefix, mismatching import URI, operation not marked complete, wrong chronology, non-synthetic docs and missing safety attestations. `tests/staging/m0-staging-evidence-review.test.mjs` adds positive consistency and malicious/invalid cases. Its best outcome is **`READY_FOR_INDEPENDENT_ADMIN_REVIEW`**, never an approved M0 gate: no network/auth/cloud logs were independently inspected and `m0Approved` remains false.
- **Runbook:** `docs/M0-STAGING-BACKUP-RUNBOOK.md` documents sanitized review input and reminds that Cloud Firestore managed export/import needs billing enabled and that imports can overwrite matching IDs. Operator must **not** supply real contents, service-account JSON or credentials to the tool/chat.
- **Outstanding external gates unchanged:** actual managed synthetic export/restore into a separate empty staging destination, operation logs and completed output URI verified by authorized admin, deployed Rules/Auth/App Check/IAM/rollback review, PR #9 geometry signoff, browser-side real `onSnapshot` and two-device acceptance. Existing `goc-nho-staging-2026` is a staging Hosting site only; **no second verified restore project is known**.
- **After this commit:** inspect latest exact-head CI and fix failures before declaring tests passed. Keep PR #97 Draft/unmerged; no new deployment or production data writes. The approved V2.2 16-file static preview is untouched.


### Handoff update — 2026-11-11 late, browser-side Auth + Firestore Emulator push gate

- **Starting baseline:** PR #97 Draft at `ab2b70b4a18f63a2783fbdf06c460b0bc4f2d5fd`; CI `43054665242` was SUCCESS (65/65 Node staging, 41/41 normal browser, 41/41 full Firestore Emulator, 3/3 standalone authenticated presence). User's deployed V2.2 same-browser lab is 6/6 manual acceptance; real two phones are not implemented/accepted.
- **New non-shipping test files on PR #97:** `tests/browser/nha3d-emulator-realtime.spec.mjs` and `tests/browser/fixtures/nha3d-firestore-emulator.html`. Separate Chromium contexts sign in as two synthetic users via **loopback Auth Emulator**, seed the synthetic house via Firestore Rules testing admin, open **actual browser `onSnapshot`** listeners on the other member's document, verify two-way updates + cross-room change, and verify outsider Eve receives a permission error. Local Firebase compat SDK bundles are loaded from `node_modules`; the test refuses missing Emulators, never calls Firebase cloud. Listener and browser contexts closed in cleanup. No imports/links in production `index.html` or shipped `nha3d` preview.
- **New dedicated CI gate:** `emulator-browser-realtime` in `.github/workflows/garden-browser.yml` on the PR #97 source branch; it runs `firebase emulators:exec --project demo-goc-nho-safety --only firestore,auth` wrapping the one Playwright test. The normal `npm test` browser suite skips this file without the two Emulator host variables. **Inspect exact-head run for actual executed pass, not skip, before declaring success.**
- **No cloud changes:** accepted Firebase Hosting 16-file V2.2 preview remains unchanged. No production/staging Rules deployment, Auth/App Check/IAM changes, data writes, migration, main merge or backup have occurred in this step. Keep PR #97 Draft.
- **Remaining M0 external gates:** prove managed cross-project export/import with synthetic data in a separately empty nonproduction destination, have authorized admin verify deployed Rules/Auth/App Check/IAM/rollback, resolve PR #9 geometry, and perform real separate-device/offline/reconnect acceptance. Two browser contexts on CI localhost cannot replace actual two-phone testing.
- **Next:** evaluate GitHub Actions on the final commit, fix any Firebase bundle/auth/network test failure without weakening assertions or granting real cloud access, then hand off security blockers and keep staging-only.
