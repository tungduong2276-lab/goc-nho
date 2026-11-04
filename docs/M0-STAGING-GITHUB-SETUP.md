# M0 — GitHub staging environment setup

Firebase staging project: `goc-nho-staging-2026`. This project is **not** the live Góc Nhỏ Firebase project.

## GitHub configuration
- Environment: `staging`
- Environment secrets: `STAGING_FIREBASE_PROJECT_ID`, `STAGING_FIREBASE_API_KEY`, `STAGING_FIREBASE_APP_ID`, `STAGING_FIREBASE_AUTH_DOMAIN`.
- Keep service-account JSON, private keys and administrative tokens out of GitHub until a separate, approved least-privilege deployment design exists.
- Restrict deployment branches/tags in the GitHub Environment before adding any deployment job. The current validation job performs **no** deployment.
- `.github/workflows/m0-staging-config.yml` checks exact staging project identity and presence of configuration. It makes **no network requests** and does not read or write Firebase documents, publish Rules or deploy hosting.

## Firebase Console prerequisites
1. Firestore `(default)` exists. Initially keep client access locked with `allow read, write: if false`.
2. Enable Anonymous sign-in in staging if using synthetic anonymous user fixtures; verify enabled state separately.
3. Register a staging Web App; never paste staging SDK initialization over production `index.html`.
4. Only after Emulator permission tests and explicit staging review, publish the audited Rules to **staging only**. The validation workflow deliberately does not do this.

## Verification and outstanding gates
- Confirm the config-validation workflow is green. A green run proves only environment configuration is present and points to the expected project ID.
- Production deployed Rules/Auth/App Check cannot be inferred from this workflow.
- Staging backup/restore must use synthetic data and a separate destination; do not claim completion until independently verified.
- Two-client offline/reconnect and PR #9 geometry review remain required before M0 acceptance.
