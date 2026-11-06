# M1 — Source triangle sections for physical-contact review

**Status: experimental, unapproved, no placement permissions.**

## Why this step matters

The prior six-room source audit computes one axis-aligned world X/Z rectangle from every mesh close to the ground. Such a rectangle merges separate chair legs, plants and adjacent supports into one oversized blocked area. This pilot produces the **actual section of rendered source triangles** at a fixed plane instead, retaining separate lines or closed loops. It does not claim these lines are a final collision shape.

## Implementation and evidence

- `_xuong-3d/m1-plane-slice-geometry.mjs`: pure triangle/plane intersection at Y=0.08 metres, snapping/stitching into multiple open or closed X/Z paths. Detects coplanar triangles, branching vertices, open contours and capped output.
- `_xuong-3d/m1-ground-section-proposals.mjs`: walks real source THREE.js meshes, applies full world transforms to indexed/non-indexed triangles, skips inverted toon outline shells, slices every interactive state and each baked component in six rooms, then projects the resulting world-XZ lines onto the **ground image plane Y=0** using each room's authentic camera and 1170px coordinates.
- No changes to room source geometry, image renderer, `scene.json`, live app, deployed Firebase configuration, or data.
- `review-artifacts/house-mesh-sections/source-mesh-plane-sections.json`: detailed per-item and per-background-component path sets, section metadata, flags, source digest and algorithm digest.
- `review-artifacts/house-mesh-sections/{roomId}-sections.svg`: six independent vector evidence views. Blue is interactive, red is unclassified baked decor, gray is floor material/covering. They are **unapproved line reviews**, not a screenshot, floor plan or navigation clearance map.
- CI runs five pure edge-case tests, four real scene-level tests, validates non-persistence flags and publishes JSON + six SVGs. Existing staging/browser/Firebase Emulator suite remains mandatory.

## Known non-equivalences: slice ≠ physical foot contact

1. The single 8 cm plane can miss objects shorter than 8 cm, underside-only feet, hanging parts, or shapes with no triangle crossing the selected height. A missing section is `NO_SECTION_AT_SELECTED_HEIGHT_REVIEW`, **not** a free placement slot.
2. A triangle exactly coplanar with the plane is counted but not filled. Closed paths are not validated solids; open loops and nonmanifold joins are explicitly flagged. Underlying scene meshes may have open surfaces and artist geometry.
3. The 10,000-segment per candidate limit and 1,024-path limit are flagged as `INCOMPLETE_SECTION_LIMIT_REVIEW`. No truncated output is valid for collision.
4. The living room source currently exposes only its six default interactive states; the other five rooms enumerate all interactive states. Background tiles/rugs are classified as materials/coverings but are not certified nonblocking by physics.
5. Physical entryways, doors, human standing capsules, stairs/walking connections, room-specific collision allowances and free decorating slots remain **unknown**.
6. True contact measurement will require multi-height/mesh-visibility review and a human-approved floor and walkway model. These source paths may inform but never replace that process.

## Safety and acceptance

All records explicitly contain `contactVerified:false`, `canPersist:false` and `sectionStatus:"REQUIRES_PHYSICAL_VISUAL_REVIEW"`. This experiment cannot activate furniture placement or Firestore writes.

Merge only into the experimental PR #9 branch after successful CI on the final HEAD and inspection of real JSON/SVG evidence. Do not merge PR #9 into `main` before M0 staging export/restore, deployed Auth/Rules/App Check/IAM, rollback and human-approved six-room floor/doorway/walkway evidence.

## Next isolated tasks

Add alternate source states for the living-room props, compare sections at multiple Y heights against actual scene renders, decide which baked objects are permanent obstacles, and validate connectivity of proposed walkways. Keep all authorizations fail-closed.
