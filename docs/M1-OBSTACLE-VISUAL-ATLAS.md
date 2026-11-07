# M1 — Visual obstacle atlas for the six room preview scenes

## Inputs and evidence
The six CI 390px screenshots from GitHub Actions run #41953137827 were inspected alongside `assets/3d/scene.json`. The six room backgrounds render from fixed 1170×1170 artwork. Existing scene layer boxes were also reviewed; some cover large transparent composited areas, so treating them as physical collision hulls would be misleading.

`src/house-obstacle-atlas.mjs` records **12 manually estimated rectangles** for prominent baked-in elements: living-room sofa and stairs; kitchen table and fridge; bedroom bed/wardrobe and bed/vanity; creative-room easel and workbench; attic display cabinet and chest. Each rectangle is an **approximate visible silhouette** with screenshot provenance, not a verified 3D footprint, and is marked `approved:false`.

## Behavior
- Combines the existing 2 candidate zones per room with the provisional obstacle rectangles in an isolated `OBSTACLE_REVIEW_ZONES` overlay.
- Local place/move/rotate must satisfy the existing room/candidate footprint and character checks **and** not touch annotated visual rectangles. A red overlay shows estimates; green overlays still mean only proposed floor zones.
- If a proposed slot intersects an estimated obstacle, controls disable that placement; e.g., candidate 1 in the living room overlaps the sofa review rectangle. These are conservative **prototype** exclusions, not a claim to physically simulate 3D contact.
- All records explicitly remain `PROPOSED_NOT_APPROVED`, `bakedFurnitureCertified:false`; `canPersist:false` is unchanged.
- Added unit and 360/390/430px browser checks. CI must pass before merging into PR #9.

## Deliberate limitations and M0 gates
No measured scene mesh, depth ordering, real floor polygon, unobstructed doorway paths or certified collision hull has been produced. The coarse rectangles can create false positives and false negatives. **Do not export these polygons into production writes, claim collision approval or merge PR #9 to main.** Create reviewed 1170px source-image annotations with visual sign-off and independent scene access before any production use.

No production Firebase reads/writes, Rules/claims, schema migrations, real-time app UI changes or deployment. Independent staging export/restore, deployed Rules/Auth/App Check/IAM, two-user safety test and rollback remain blockers.

## Unrelated CI regression
PR #53 post-merge Actions run #41959100927 failed intermittently in `tests/browser/garden.spec.mjs` at `hit.boundingBox() === null` while the garden was rerendering. The garden geometry assertions and real pointer clicks remain intact; this branch adds an explicit wait for the target hitbox before testing those interactions. The change does not alter runtime garden behavior.
