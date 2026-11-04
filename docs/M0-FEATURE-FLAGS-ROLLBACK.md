# M0 — Feature flags and safe release protocol

**Status:** design and release checklist; not evidence of a production rollout.

## Invariants
- Production Firebase data for the two existing members is never a test fixture.
- New features default **off** unless a reviewed release explicitly enables them.
- Do not modify `couples/{cid}`, `users/{uid}`, `codes/{code}` or existing subcollection document shapes to implement a flag.
- Prefer a build-time constant or local-only preview flag for unfinished visual UI. Local flags are **not** an authorization boundary.
- Security-sensitive features require Firestore Rules / trusted server enforcement even when hidden behind a flag.

## Flag convention for upcoming milestones
| Feature | Flag | Default | Data-writing allowed when off? |
| --- | --- | --- | --- |
| M1 house placement | `housePlacementV1` | off | No |
| M2 object memories | `objectMemoriesV1` | off | No |
| M3 secret gifts | `secretGiftsV1` | off | No |
| M4 expanded garden | `expandedGardenV1` | off | No |
| M5 shared weather | `sharedWeatherV1` | off | No |
| M6 museum placement | `museumPlacementV1` | off | No |
| M7 cooperative sessions | `cooperativeSessionsV1` | off | No |
| M8 memory book | `memoryBookV1` | off | No |

The flags above are **reserved names**, not implemented or enabled. The decorative weather selector in PR #9 is local-only and does not imply `sharedWeatherV1`.

## Per-PR rollout checklist
1. Document precise affected paths, schema version, Rules diff, authorization model and rollback owner.
2. Verify static checks, Playwright on mobile widths, Firestore Emulator permissions and two-client concurrency/offline tests.
3. If persistent data changes, validate synthetic staging export/restore first; obtain explicit review before any live migration or rules deployment.
4. Enable only in a separate reviewed release after CI, visual inspection and staging acceptance.
5. Monitor failures without logging private payloads; disable the feature first on regression.
6. Rollback must not delete data created under a newer schema. Disable writes and preserve records for forward repair.

## Blockers to a real release
- Production deployed Rules / Auth / App Check inventory and rollback version have not been independently verified.
- Staging project export/restore with synthetic records has not been executed.
- PR #9 3D rendered geometry and mobile hitboxes remain a separate acceptance gate.
