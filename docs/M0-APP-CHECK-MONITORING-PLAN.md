# M0 — App Check in monitoring mode (prepared, not enabled)

**Status 2026-11-15:** client code and tests are prepared on a Draft PR. Nothing was registered or changed in Firebase Console, Google Cloud, billing, Auth, IAM or Rules. App Check on production project `goc-nho` still shows **Get started** as of the last inspection (2026-11-14). This document is a plan, not evidence of protection.

## What the code change does

- `index.html` loads `firebase-app-check-compat.js` (same SDK version as the other three) and calls `startAppCheck()` right after `firebase.initializeApp()` and before Firestore/Auth are touched.
- `startAppCheck()` does nothing unless `window.FIREBASE_APP_CHECK.siteKey` in `firebase-config.js` is a non-empty string. The shipped value is `""`, so merging this PR alone changes no request the app makes.
- With a key it calls `activate(provider, true)` once. Supported `provider` values: `recaptcha-enterprise` (default) and `recaptcha-v3`. Any failure is caught and logged; the app keeps starting.
- The client never enables enforcement. Enforcement exists only as a Console switch.
- `sw.js` cache version goes to `goc-nho-v15` so installed phones pick up the new shell.

## Operator steps (user, in Console — not automated)

1. **Confirm the serving host.** Open the live app and read the host in the address bar (GitHub Pages for this repo, expected `tungduong2276-lab.github.io`; not verified by this session). The installed PWA uses the same host.
2. **Create the key.** Google Cloud console → reCAPTCHA page, project `goc-nho` (check the project picker). Enable the reCAPTCHA Enterprise API if prompted. Create a **Web** key, score-based (leave the checkbox challenge off), with only the host from step 1. Do not add `localhost`.
   - If the Console requires a billing account at any point: **stop**. Billing was declined on 2026-11-14. Firebase's docs describe reduced score levels without billing, but whether this project can enable the API without it has not been checked. The fallback is a reCAPTCHA v3 key with `provider: "recaptcha-v3"`; Firebase recommends Enterprise for new integrations.
3. **Register the app.** Firebase Console → Security → App Check → Apps → register the web app with that key. Leave Cloud Firestore and Authentication **Unenforced**.
4. **Ship the key.** Put the key ID in `siteKey` in `firebase-config.js` on this PR's branch (it is a public site key, not a secret), finish the review list below, merge, and open the app on both phones.
5. **Watch metrics.** App Check → APIs → Cloud Firestore and Authentication, for at least 7 days and until both phones have opened the new version. Expected: the verified share climbs toward 100%; a lasting "outdated client" share means a phone is still on the old shell.
6. **Enforcement is a separate decision**, reviewed on its own, after step 5 and after the review list is closed.

## Review list before a key is merged

- [ ] reCAPTCHA badge position at 360/390/430 px: it must not cover the tab bar or bottom buttons. If it does, decide between moving it and hiding it with the attribution text Google requires.
- [ ] Cold start offline and in the installed PWA: app opens, cached data shows, no stuck loading gate.
- [ ] A browser with a content blocker: app still signs in and syncs while unenforced.
- [ ] No new uncaught errors in the console on either phone.
- [ ] Exact-head CI green on the commit that carries the key.

## Rollback

- While unenforced, App Check cannot block any request. To remove it: set `siteKey` back to `""` (or revert the PR) and redeploy. No Firestore data, Rules or Auth setting is involved.
- If enforcement is ever turned on and a phone is locked out: switch the product back to **Unenforced** in Console (enforcement changes can take several minutes to apply), then investigate.

## Limits

- Monitoring mode is measurement only. Until enforcement, requests without a valid token are still accepted.
- App Check does not replace Firestore Rules or membership checks; the M3 secret-gift requirement is unaffected.
- Emulator and browser tests never contact reCAPTCHA or App Check. `tests/browser/app-check-monitoring.spec.mjs` uses a stub SDK and covers: shipped config stays off and contacts no attestation host; a key activates the chosen provider once with auto-refresh; missing key, unknown provider, missing SDK and SDK exceptions never break startup; call order inside `cloudInit()`.
- Not tested: a real reCAPTCHA key, real token issuance, Console metrics, badge layout, behaviour on the two real phones.
