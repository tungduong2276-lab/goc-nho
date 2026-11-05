# M1 — Six-room provisional floor-region masks

## What exists
`src/house-room-zones.mjs` supplies six room-specific 2D annotations (in the existing 1170×1170 prerendered-image coordinate system). Each room has two small, rectangular **candidate working envelopes** around PR #51 proposed floor anchors, named `candidateFloor`. `exclusions` is an empty array until individual walls/props are traced and reviewed. `reviewStatus: PROPOSED_NOT_APPROVED` and `bakedFurnitureCertified:false` are mandatory.

`assertWithinProposedZones` checks all four corners of each furniture footprint against one proposed polygon and rejects intersection with any authored exclusion polygon. This is an additional conservative preflight to the existing image bounds, character-clearance and simulated furniture-collision checks; it never replaces them. Placement/move/rotate on the isolated experiment page require both guards.

The demo overlays candidate zones as translucent dashed outlines, plus existing furniture outlines. The overlay does not capture pointer events. Existing 360/390/430px browser tests require two zone overlays per room and continue testing mobile interactions.

## Safety and honesty
These polygons are **automatically authored candidate envelopes**, not a surveyed floor, not actual walls, not art-derived obstacle masks, and not verified free space. No `exclusions` have been physically certified, and the images contain baked-in furniture with no collision meshes. The generator makes no claim that proposed candidates can hold all furniture visually. Passing these checks permits **local test interactions only**.

No change to live `index.html`, app navigation, Firebase SDK, credentials, Rules, schema, data or deployment; no persistent decoration. `canPersist:false` remains in place.

## Before introducing real free placement
Manually trace floor boundary, doorways, furniture hulls and navigable character lanes in each 1170px source image; replace the candidate envelopes and populate reviewed exclusion polygons with provenance, tests and visual signoff. Do not mark them approved without reviewer screenshots. Finish independent M0 Firebase backup/restore, deployed Rules/Auth/App Check/IAM, two-client revision handling and rollback gates before any shared writes.
