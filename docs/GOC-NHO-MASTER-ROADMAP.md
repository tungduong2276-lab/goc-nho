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

**Current handoff as of 2026-11-03 (M0 working branch, not main):**

- Main verified at `7008a7a7278aee443efc5f2593939e38538e881a`; pending branches must be compared against the latest main before merge.
- PR #9 weather regression was patched at `c50890b`; Actions run #61 passed; regenerated 3D map assets committed at `2e8cf10`. Still Draft and requires visual geometry/hitbox review and consistency with main.
- PR #12 (`chore/m0-firebase-safety-audit`) now includes a source-only Firebase audit, `firebase.json` for isolated emulator use, `tests/firebase/firestore-rules.test.mjs`, an `npm run test:firebase` command wired into `npm test`, and a staging-only backup/restore runbook.
- Latest CI for PR #12 at initial handoff: Actions run #65 in progress, not yet evidence of success; check latest run before merge. A separate workflow file was not created.
- Firebase Rules were not changed or deployed; no production connection, backup, migration, deletion or data write. Actual staging export/restore, authorization review, two-client synchronization, room geometry and UI tests remain incomplete.
- PR #13 holds the M7 twelve-theme game expansion proposal only; no premature game implementation or Firebase schema changes.
- **Security discovery confirmed:** initial M0 emulator CI #65 failed 1/7 tests because recursive wildcard Rules v2 could authorize an existing member to add a third member. Branch-only fix `9b96375` constrains nested match to `/{collection}/{document=**}`; CI #69 passed with the fix, but this is NOT deployed to production.
- **Additional tests:** two-client synthetic Firestore convergence and stale `set()` overwrite demonstration added in `73c55ff`. CI runs #70/#71/#73 encountered intermittent existing garden pointer tests before reaching Firebase Emulator; pointer actionability improvements committed in `f38059d` and `72cde8a`. Last checked CI #74 was in progress; its result must be verified before calling M0 tests green.
- **Collection source inventory:** 19 collection names under the existing couple path are listed in `docs/M0-FIREBASE-SAFETY-AUDIT.md` without inspecting live user data.
- Next safe action: inspect the latest PR #12 CI and fix remaining failures without weakening assertions, then review Firebase Rules for compatibility and secure staging deployment. Obtain staging-only backup/restore verification before considering M0 done. No merge before the full gate.

- **Update verified 2026-11-03:** PR #13 design-only M7 games merged to `main` at `112915e`; isolated security PR #14 merged at `9617ce8` (Rules fix and stabilized 3D browser pointer tests). M0 branch CI #77 succeeded: 15/15 browser and 9/9 Emulator tests. M0 remains unfinished: staging restore, live Rules verification, full two-client offline testing and geometry acceptance. PR #12 still Draft; its branch must be reconciled with the newer main before merge.
