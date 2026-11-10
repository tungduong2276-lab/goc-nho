# Nhà 3D — Staging-only acceptance and rollback checklist

> Scope: PR #97 integration of #93, #95, #96. **Not a production release.** No Firebase production data reads/writes, migrations, Rules deployment, or main merge are authorized by this checklist.

## 1. Before deployment

- [ ] PR #97 head SHA and CI are green **on the exact commit to be deployed**; inspect job logs rather than relying on a previous commit.
- [ ] Confirm the preview remains standalone at `/nha3d/multiroom-preview.html` and is not linked into the live `index.html` entrypoint.
- [ ] Confirm preview has no Firebase SDK initialization, Firestore calls, or credentials. Check Network for `firestore.googleapis.com`, `firebaseio.com`, and `identitytoolkit.googleapis.com` while using the preview.
- [ ] Use a separate staging-only hosting target and domain. Verify the hosting project/target before any deploy. **Do not run `firebase deploy` without a reviewed project alias and hosting-only scope.**
- [ ] Do not upload production snapshots or user data as test fixtures. Use synthetic test accounts only.
- [ ] Capture current staging deployment identifier, hosting config, and a rollback target. If these are unavailable, STOP.

## 2. Device acceptance matrix

Test on **two independent phones**, preferably one iPhone Safari and one Android Chrome, with viewport widths 360, 390 and 430 px (use browser emulation for missing physical sizes).

| Case | Expected result | 360 | 390 | 430 |
| --- | --- | --- | --- | --- |
| Open `/nha3d/multiroom-preview.html` | Scene loads, no console error or blank canvas | ☐ | ☐ | ☐ |
| Enter living room → kitchen → living room → bedroom | Door route completes, correct room and furniture visible | ☐ | ☐ | ☐ |
| Tap an open floor cell | Avatar walks around furniture; does not cross blocked cells | ☐ | ☐ | ☐ |
| Tea, cooking, bedroom note | Avatar approaches furniture; distinct temporary props and feedback | ☐ | ☐ | ☐ |
| Tap door while interaction is active | Pose and props clear immediately; no stale effects in destination | ☐ | ☐ | ☐ |
| Rapidly tap door/action/floor | No stuck avatar, duplicate activity or uncaught exception | ☐ | ☐ | ☐ |
| Rotate screen / background then return | Canvas resizes and controls remain reachable | ☐ | ☐ | ☐ |
| Disable network after initial load | No production data writes; graceful handling if CDN resources unavailable | ☐ | ☐ | ☐ |
| Reload / open on second phone | Preview stays isolated; no claim of live two-person sync | ☐ | ☐ | ☐ |

Record device model, OS/browser, tested SHA, screenshot/video, FPS or noticeable jank, any clipped controls, and reproducible failure steps. The preview is **not** live multiplayer.

## 3. Security and M0 release gates

- [ ] Complete nonproduction Cloud Firestore managed export/restore in two isolated projects and record the successful restore verification.
- [ ] Review actual deployed Firestore Rules, Authentication settings, App Check, IAM and rollback ownership; synthetic Emulator tests alone are insufficient.
- [ ] Verify existing six-room UI and PR #9 geometry/visual review are resolved or documented as release blockers.
- [ ] Before any future shared furniture persistence: two-client concurrent edits, reconnect, unauthorized access and version-conflict tests must pass.
- [ ] Obtain explicit visual acceptance on real phones; CI passing does not imply device acceptance.

## 4. Rollback and promotion

1. If staging breaks, revert the staging hosting deployment to the recorded previous release; do not touch Firestore documents.
2. Preserve screenshots, logs, tested SHA and failed-case reproduction in PR #97.
3. Keep PR #97 Draft until the above gates are satisfied. **Do not merge to main or enable Firebase writes merely because CI is green.**

## 5. Current verified status

- PR #93, #95 (rerun), #96, and initial PR #97 integration CI passed as recorded in the master roadmap.
- PR #97 documentation update commit `28ce1c8` had a workflow in progress when this checklist was drafted. Recheck the current head before sign-off.
- This statement described the initial documentation state; see the later user-reported staging acceptance in section 7.


## 6. Prepared Hosting configuration (not deployed)

- `firebase.nha3d-staging.json` explicitly serves only `dist-nha3d-staging/`. It does not configure Firestore, Functions, Auth or Storage. The build output is gitignored.
- **Never substitute the production project ID.** A separate, user-approved staging Firebase project ID must be verified in Firebase Console before running any hosting command. This repository deliberately has no `.firebaserc` alias.
- After confirming a **distinct staging project ID** and permission to deploy to it, an operator may run:

```sh
npm install
node --test tests/staging/nha3d-staging-bundle.test.mjs
node scripts/build-nha3d-staging.mjs
firebase hosting:channel:deploy nha3d-review --project VERIFIED_STAGING_PROJECT_ID --config firebase.nha3d-staging.json --expires 7d
```

- Replace `VERIFIED_STAGING_PROJECT_ID` only after checking the Firebase Console project selector and project settings. This command is an **operator-only proposed step**, not a completed action. The preview channel URL must be captured from CLI output; never guess it.
- Preview channels may still be reachable by anyone holding their URL. Do not put secrets or real user data in this static build. Confirm access controls appropriate to the intended testers.
- Record the resulting URL, project ID, deployment ID, expiry, SHA and rollback action in PR #97 before distributing to the two testers.


### Operator command for confirmed project

The user has confirmed that the separate staging project `goc-nho-staging-2026` exists. **Existence is user-confirmed; project access, IAM permissions, and actual Console configuration have not been independently verified.** The guarded command below refuses to run without an explicit approval environment variable and hardcodes the staging project ID, not the production project:

```sh
npm install
npx firebase login
NHA3D_STAGING_APPROVED=goc-nho-staging-2026 node scripts/deploy-nha3d-staging.mjs
```

Before running, verify the active Google account has Hosting deploy permission **only** for the intended staging project. This is an operator-run command, not an automatic CI action. Capture the exact URL printed by Firebase CLI; do not invent one. If Firebase Hosting is not initialized or permissions are missing, stop and review rather than changing production settings.


## 7. User-reported staging acceptance — 2026-11-10

**Deployed staging Preview Channel reported from the user's Firebase CLI output:**
- Project: `goc-nho-staging-2026`, channel: `nha3d-review`
- URL: https://goc-nho-staging-2026--nha3d-review-iivw5f6z.web.app
- Reported expiry: **2026-11-17 14:46:26**, local time (+07:00)
- The exact deployed Git SHA and the actual phones/browser versions were **not recorded**. This deployment predates the local-companion prototype below.

**Six functional checks — user-reported PASS (6/6):** 3D renders, three-room navigation, collision-aware walking, tea/cooking/note interactions, interruption cleanup on changing rooms, and successful independent loading/control on a second phone. No failures reported in these six scenarios. The assistant did not independently operate the phones; FPS, Chrome/Safari versions, accessibility, offline/reconnect, cross-device synchronization, and production security were not measured by this report.

**Following the six checks:** a visibly labeled **local-only companion simulation** was added on the PR branch. It can be summoned, approach the player along a collision-safe route, high-five and appear in the next room. It is deliberately **not a real second user**, has no network/storage connection, and is not yet part of the already-deployed URL until an operator rebuilds and redeploys that PR head to staging. Companion implementation and tests must pass CI again before redeployment.

**Promotion remains BLOCKED:** real staging managed export/restore, deployed Rules/Auth/App Check/IAM audit, reviewed room placement geometry, and future two-user concurrency/reconnect security checks. Keep PR #97 Draft; no production Firebase writes.
