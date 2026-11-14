# Production membership hotfix — candidate, not deployed

## Problem and exact scope

The read-only Console review on 2026-11-14 found that `goc-nho` still serves an older Rules policy with `match /{document=**}` inside `/couples/{cid}`. Under Rules v2 this match can also cover the parent couple document. An existing member can therefore bypass the parent's membership update conditions and add a third user, replace a partner, replace the root document, or delete it.

`tests/firebase/fixtures/production-observed-20261114.rules` records the code observed in the Console (no personal documents or credentials). It is intentionally unsafe and must never be published. `production-membership-hotfix.rules` is a reviewed copy of current root `firestore.rules`; a regression asserts exact equality to prevent drift. It requires a subcollection segment before granting broad member permission.

Changing only the recursive match would break legitimate `leaveDoc` and `removePartner` app operations that currently succeed through that broad permission. The candidate therefore uses main's explicit self-leave and partner-removal conditions (preserving the invitation code), main's member-authorized invitation-code deletion, and its join-role equality check. These are material differences from the cloud baseline and require release review. Root `firestore.rules`, application code, schemas and live Firebase configuration are unchanged by this PR.

## Verification

`npm run test:firebase` runs the new regression file together with the existing suites. The new suite loads three policies serially: observed production, the membership-compatible candidate, and current main. It uses only the `demo-goc-nho-safety` project at a loopback Emulator endpoint.

Five attacks must succeed **only on the synthetic reproduction of the old policy**, and fail on both the candidate and main: adding a third member, replacing the partner, removing the partner while changing the code, replacing the root, and deleting the root. Rejected attacks must preserve the original members/code. Positive tests retain metadata updates, deep nested member CRUD, house creation, second-partner joining, self-leave with role deletion, partner removal and role repair; outsiders and unauthenticated clients remain denied. Invitation-code deletion is denied to outsiders, fails under the old cloud policy, and succeeds for a member with the candidate/main.

This proves the bounded Rules behavior in Emulator, not production deployment, end-to-end device acceptance, App Check, secure gifts, IAM isolation or backup completion. Existing broad nested permissions and other join-policy risks are outside this hotfix.

Local results (2026-11-14): final `test:firebase` passed **57/57** tests, including nested subtests; static checks and **24/24** staging tests passed. Full `npm test` did not pass locally: browser navigation timed out on Windows (12/15 failed initially; 10/15 failed with two workers). Browser assertions were retained. Verify the unchanged browser suite in exact-head CI; a local Emulator pass alone does not authorize merge or publication.

## Release and rollback review

1. Reopen the production Rules page and confirm the active code still matches the observed baseline; stop if it changed. Review the candidate diff and independently confirm the production project selector.
2. Verify CI on the exact PR head and run the synthetic suite. Review real app compatibility without using private records as fixtures.
3. Obtain explicit authorization for the production Rules publication. Do not deploy automatically from CI or merge this test fixture as if that publishes Rules.
4. Publish only the reviewed membership-compatible policy. Verify the active Rules text/version and client behavior separately; do not probe attacks on real couple documents.
5. The prior Rules release is visible in Console history. Restoring it would reintroduce the vulnerability, so rollback requires explicit security review and authorization; prefer correcting any compatibility issue without reopening the parent bypass. No data restore/export is part of this change.

Managed cloud export/import is omitted at the user's request; its M0 acceptance gate remains unverified. PR #97 remains Draft and shared M1 writes remain disabled.
