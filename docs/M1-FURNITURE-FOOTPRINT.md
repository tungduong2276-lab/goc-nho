# M1 — Footprint / collision preflight (local-only)

## Phạm vi
This branch adds a **synthetic 2D guard** for five furniture types: chair 80×70, table 130×90, lamp 50×50, plant 70×70, rug 120×90 (all values in source-image pixels). Rotation by 90° swaps the occupied rectangle dimensions. Geometry uses a 24px image inset, 12px spacing between rectangles and a 52px protective disc around each original character standing anchor, plus 12px clearance.

Before each local `place`, `move`, or `rotate` action, `assertFurnitureFits` checks the exact target slot and transformed footprint, other simulated items, per-room image bounds, and standing positions. Failed actions do not mutate the draft. UI disables invalid options and shows dashed outlines for occupied rectangles.

## Hard limitations / release gates
- `LOCAL_GEOMETRY_ONLY_UNAPPROVED` is **not** an authorization to persist. `canPersist:false`; only isolated `experiments/house-placement.html` is affected.
- This model knows **no real 3D floor mesh, walls, furniture collision hulls, layering, perspective or baked-in prop coverage**. Its 2D canvas rectangles are only conservative placeholders; passing checks cannot establish visual clearance, even when slots remain `PROPOSED_NOT_APPROVED`.
- No modification of `index.html`, Firebase SDK/config/Rules, app data paths, or production data.
- Before a production feature: visually inspect the six 1170px original room assets with each proposed footprint; define wall polygons and baked-in obstacles; validate asset-specific z-order/sprites; run mobile/keyboard/manual acceptance, two-client concurrency, staging restore and production Rules/Auth/App Check/IAM audit.
- Do not merge PR #9 into `main` while M0 gates are open.

## Tests
`tests/staging/m1-furniture-collision.test.mjs` tests five dimensions, rotation, six independent rooms, wall inset, character exclusion, furniture overlap, action failure and authorization refusal. Existing `npm test` must remain green in GitHub Actions before merging this slice into PR #9.
