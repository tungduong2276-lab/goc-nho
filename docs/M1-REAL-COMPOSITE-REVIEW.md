# M1 — 1170px real-composite evidence audit (not collision approval)

## Why this is a separate review stage
Previous local placement experiments draw green proposed zones, red approximate obstacle boxes, and anchor-to-anchor guide routes over **room backdrops**. The actual shipped UI also renders many interactive asset images as independent transparent overlays (`button.lay` with an image). Drawing a floor polygon from the backdrop alone would falsely imply those overlaid objects do not exist.

`src/house-composite-evidence.mjs` inventories six full composited scenes directly from `assets/3d/scene.json`: actual sprite boxes and every interactive item state, 12 older unapproved obstacle estimates and their *image-rectangle overlap* with source layer boxes. **No alpha cutout or collision hulls are inferred from an image-rectangle overlap.** Sprite bounds can cover substantial transparent artwork and overlapping visual depth.

`tests/browser/house-composite-evidence.spec.mjs` opens the **real** `index.html#<room>` screens at widths 390 and 1300, verifies 1170px original image loading, compares each current non-living room's DOM rendered interactive sprite bounds to the source-layer coordinates to ±2 original pixels, and captures scene screenshots with blue outlines over the **composited actual furniture** (not the background alone). It captures 12 screenshots and a manifest in the same artifact directory as previous six-room review. No new control appears in the real UI. Review-only injected SVG is screenshot-only and not persisted.

## Required independent visual sign-off
For each room, examine the composite screenshot beside the source image and underlying PNG/WebP alpha assets. Trace actual floor polygon, wall boundary, doorway threshold and a minimum unobstructed walking area; cross-check all 90° item footprints and z-order. Record source version and reviewer acceptance. The existing red approximate regions are not geometrically sufficient, and blue scene-layer bounding rectangles are *not* physical blockers.

Until such review, `floorPolygon:null`, `doorwayPolygons:null`, `wallCollisionMesh:null`, `canPersist:false`, `status:UNAPPROVED`. CI only proves repeatable evidence collection and DOM/source-coordinate consistency, **not** correctness of physical room geometry.

## Safety
The review is local browser-only and does not change `index.html`, Firebase configuration/Rules, live collections, clients or deployment. PR #9 stays Draft; M0 actual staging export/restore, production Rules/Auth/App Check/IAM and rollback inspection are still required before enabling shared decoration.
