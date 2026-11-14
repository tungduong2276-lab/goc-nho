# M0 deployed configuration review — 2026-11-14

Read-only Console inspection; no Rules publication, production document writes, Auth changes, IAM changes, billing changes or export/import performed. Account identifiers and private document contents are intentionally omitted.

## Production project `goc-nho`

- Firestore `(default)` is in `asia-southeast1`.
- The Rules page marks the active release as Nov 2, 2026, 8:58 PM (Console display). It is older than and differs from repository `firestore.rules` at main `e84a5d5b075252a0ac7d9ac3c44942e781fd26c0`.
- **High priority:** deployed Rules retain `match /{document=**}` under `/couples/{cid}`. Under Rules v2 this also matches the parent couple document, so a current member's broad nested write permission bypasses the parent membership-update restrictions. The repository has the narrower `/{collection}/{document=**}` fix; it has not been observed deployed. No exploit was attempted against production.
- Deployed join logic also differs from main: it allows adding one member while the old member count is below two, without main's explicit `roles` equality condition. The deployed code rule lacks main's member-authorized delete branch. Review all compatibility differences before publishing a replacement.
- Authentication has Email/Password enabled. Authorized domains: `localhost`, `goc-nho.firebaseapp.com`, `goc-nho.web.app`. No change was made.
- App Check shows its initial **Get started** screen. Enforcement has not been established by this review; do not claim App Check protection.
- IAM Allow page, with **Include Google-provided role grants unchecked**, shows one human Owner (Legacy) and one Firebase Admin SDK service account. Its visible roles are Firebase Admin SDK Administrator Service Agent, Firebase Authentication Admin and Service Account Token Creator. This is a visible-grants inventory, not an exhaustive effective-permissions or service-account-key audit. No public principal was visible in this view.

## Staging observations from the same session

- `goc-nho-staging-2026`: Firestore `(default)`, `asia-southeast1`; root data view reports no data; active Rules deny all client reads/writes. Anonymous Auth is enabled; App Check shows Get started; billing plan is Spark.
- `goc-nho-restore-test`: project exists, but Firestore presents **Create database**, rather than an existing restore destination.
- Source Import/Export page disables both actions because billing is not enabled; its operations table reports no recent moved data.
- The user elected to skip export/import and not enable billing. This leaves cloud backup/restore **unverified**, not passed.

## Next safe action

Prepare a narrowly scoped Rules correction against the observed deployed policy, test existing application flows and membership attacks with synthetic Emulator data, and review the full diff plus the captured prior policy for rollback. Keep production unchanged until that concrete release is reviewed. Do not deploy the unrelated versioned-write candidate or enable M1 persistence. PR #97 stays Draft.

No new full test suite was run for this documentation-only review. Earlier in this session, main passed 24/24 offline staging tests and static checks. Neither result establishes production authorization behavior or backup completion.
