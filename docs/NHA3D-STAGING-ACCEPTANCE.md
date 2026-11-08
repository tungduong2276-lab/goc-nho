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
- No staging hosting deployment or two-device manual acceptance is claimed.


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
