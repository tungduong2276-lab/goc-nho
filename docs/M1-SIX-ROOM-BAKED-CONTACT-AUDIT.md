# M1 — Six-room source-mesh audit: baked props and floor finishes

## Why
The previous five-room audit only inspected interactive item meshes. That misses the living room and background props such as stairs, coffee table, sofa-adjacent objects, plant pots, kitchen counter, rugs and floor tiles. A room can look empty in a sprite review while a baked 3D object actually occupies its floor.

## Implementation
- `_xuong-3d/room.js` exposes a **read-only living-room inspector** for the default furniture states, and nine actual baked background object groups. Rendering behavior is unchanged.
- `_xuong-3d/rooms2.js` exposes each source room's baked `deco.children` and marks generated rugs and kitchen checker-floor tiles as **floor coverings/finishes**, not automatic movement blockers.
- `_xuong-3d/m1-ground-contact-proposals.mjs` now enumerates all six rooms, their interactive furniture states and their baked scene components. For each component, the existing source mesh algorithm estimates world-X/Z bounding rectangle from mesh bounding boxes intersecting y <= 0.14 m; then projects that rectangle through the real source camera onto 1170px source coordinates. Output is `review-artifacts/house-mesh-contact/source-ground-contact-proposals.json`.
- Every baked component is tagged with an explicit `kind`: `FLOOR_FINISH_NOT_BLOCKER`, `FLOOR_COVERING_NOT_BLOCKER`, `WALL_OR_RAISED_DECOR` or `UNCLASSIFIED_SOURCE_PROP`. Unknowns need a reviewer; **never convert the classification into placement permission**.
- New `_xuong-3d/m1-ground-contact-audit.test.mjs` tests room coverage, real source SHA-256, world/image geometry finiteness, classification, wall-mounted items and fail-closed flags.
- Feature-branch CI installs Three.js for auditing; emits a JSON artifact, checks all six rooms and runs the existing `npm test` suite.

## Important, explicit limitations
- A mesh world-space **axis-aligned bounding box** is not an exact contact polygon. The 0.14m ground-proximity threshold is heuristic. In particular, chair legs, doors in different states, rounded plant pots, wall decor and sloped objects require further geometric verification.
- Baked source components can consist of many nested mesh parts; some have no near-ground mesh, some are decorative **floor finishes** and others are potentially solid objects. All unknown elements stay unclassified until reviewed.
- The living room is currently inspected in its **default interactive state only** (six base items); alternate open/rain/playing jar and radio states are not covered. The other five rooms inspect all source item states.
- This does **not** extract door thresholds, walking paths, human collision capsules, external-to-room entrances or verified free decor slots. It does not change the actual rendered artwork, room size, game UI or Firebase.
- `canPersist:false`, `physicalContactVerified:false`, `blocksWalkwayVerified:false`, `approvedFloorPolygons:null` apply to all review outputs. Even an empty candidate or a `FLOOR_COVERING_NOT_BLOCKER` label does not authorize placement.

## Acceptance and next steps
1. Full feature HEAD CI green and six-room JSON artifact checked for counts, null footprints, category distribution and unexpected giant bounds.
2. Compare candidates with 3D source and composited four-light images. Evaluate living-room alternate furniture states.
3. Next isolated PR: obtain mesh slice **at the true floor plane** with an explicitly separate classification of built-in ground obstacles, then have a reviewer validate real floor outline, doors, stairs and walkable connectivity.
4. No PR #9 → main merge or Firebase shared-decoration writes before M0 security and staged backup/restore have been proven.


## Observations from actual feature CI #243 artifact (not inferred)
- Read-only Three.js exporter emitted **6 rooms, 42 interactive state records and 199 baked component records**.
- By room (interactive/baked): Phòng khách 6/9, Bếp 6/130, Phòng Anh 7/4, Phòng Em 6/25, Góc sáng tạo 7/7, Gác 10/24. Many Bếp records are individual decorative floor tiles, *not* 130 furniture obstacles.
- Ground-near mesh envelopes among the 199 baked components: 8 living, 75 kitchen, 2 Phòng Anh, 3 Phòng Em, 6 Góc sáng tạo, 15 Gác.
- Notable review flags from source coordinates: living room `pothos` has a maximum X of approximately 3.053 m while its nominal room ends at X=3 m; Gác `deco-011` extends to Z≈-2.453 m against a nominal -2m back boundary. These may be intentional decorative overhangs, **not** verified collisions. Large envelopes (including the 9m² living-room rug) need separate examination and must not be interpreted as free floor or blocked floor.
- Source-mesh audit now emits conservative `warningFlags` (`EXTENDS_BEYOND_SOURCE_SHELL_REVIEW` and `BROAD_WORLD_ENVELOPE_REVIEW`) and tests against artificial examples. Flags guide review only, and absence of flags does not certify a safe placement.
- Actual CI #243 passed its source audit plus full suite (4 source tests, 98 staging, 41 Playwright, 29 Firebase Emulator); any later code/document edits require a separate successful final-HEAD workflow.
