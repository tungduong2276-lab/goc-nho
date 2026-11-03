# M0 — Staging-only Firestore backup and restore runbook

**Not yet executed.** This is an operational checklist, not proof that production backup or restore works.

## Safety invariants

- Never run export/import or rules deployment against the live Góc Nhỏ Firebase project during M0 verification.
- Use a standalone Firebase project with a **different project ID** and synthetic records (two fake members plus an outsider).
- A local Firestore Emulator export is **not** a backup of Firebase production; do not describe it as one.
- Keep credentials, email addresses, production document contents, exported personal data and keys out of GitHub/CI logs.
- Do not change existing `couples/{cid}`, `users/{uid}` or `codes/{code}` schema.

## Local emulator reproduction

1. Install Node.js (20+), Java 21, dependencies with `npm install`.
2. Run `npm run test:firebase`; this starts Firestore Emulator for `demo-goc-nho-safety` and executes only synthetic test cases.
3. Confirm all tests pass, including a known *non-secure* early-gift read test. That test describes current rules rather than approving secret gifts.
4. To exercise emulator export/import separately, start a local emulator with `firebase emulators:start --project demo-goc-nho-safety --only firestore --export-on-exit ./tmp/m0-emulator-export` after creating synthetic fixtures. Stop it, then restart with `--import ./tmp/m0-emulator-export` and compare synthetic IDs/counts/hashes. Ignore `tmp/` in Git; never export real data there.

## Actual staging-project restore gate (requires authorized admin)

1. Identify isolated staging project ID, IAM roles, billing/storage bucket and retention policy. Obtain approval for the **staging** project, not production.
2. Populate staging with synthetic fixture documents, including nested collections, timestamp fields and a known manifest of document IDs and hashes.
3. Export staging Firestore to a dedicated restricted staging Cloud Storage bucket using approved admin tooling; record export operation and completion status.
4. Restore into a **second empty isolated staging database/project**, not the source. Confirm that all expected documents, nested documents, permissions and selected hashes match the manifest.
5. Test negative cases (wrong destination, accidental production project, insufficient IAM, partial export) and ensure the procedure halts without modifying production.
6. Document the exact validated command versions, project IDs **only if non-sensitive**, permissions, time and evidence in a separate review before declaring M0 backup/restore complete.

## Release/rollback gate

No migration or production rules deployment is included in this PR. For subsequent features, require an explicit diff of schema and Rules, a reviewed rules-test suite, feature flag rollback and staging validation. If a release is rejected, leave production untouched.
