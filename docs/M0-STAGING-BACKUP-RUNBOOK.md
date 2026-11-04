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

## Read-only staging preflight plan generator (new M0 gate)

Run the **non-executing** safety preflight locally before asking an authorized administrator to execute any operation:

```sh
node scripts/m0-staging-preflight.mjs \
  --production-project ACTUAL_PRODUCTION_PROJECT_ID \
  --source-project DISTINCT_STAGING_SOURCE_PROJECT_ID \
  --target-project DISTINCT_EMPTY_STAGING_TARGET_PROJECT_ID \
  --export-bucket gs://APPROVED_STAGING_ONLY_BUCKET \
  --run-id synthetic_20261104 \
  --confirm-synthetic-source --confirm-empty-target \
  --confirm-nonprod-source --confirm-nonprod-target
```

Replace **every** placeholder with independently verified values; placeholders are not accepted evidence. The four `--confirm-...` flags are **operator attestations**, not checks against GCP. The tool verifies syntax, three distinct project IDs, staging-only assertions and bucket/run ID safety, then prints JSON with status `REVIEW_ONLY_NOT_EXECUTED`. It does not call Cloud APIs, authenticate, write files, export, import or prove the destination is empty. It intentionally does not supply an executable import command until the actual completed export output URI and destination have been verified by an authorized administrator.

To run the no-cloud tests: `npm run test:staging`. They also run within `npm test` / GitHub Actions. Failing test cases cover missing attestations, production IDs accidentally used as source or destination, same-project restoration, invalid bucket/input injection and accidental execution. Do not run any real GCP command from CI.

**Critical:** A successful preflight **does not complete M0**. The admin still must prove source/destination isolation, use actual Cloud Firestore managed export/import on synthetic records only, verify the completed operation's output prefix and restricted GCS access, compare manifest hashes after restore and independently review the rollback. Never paste real credentials, export contents or private data into GitHub.
