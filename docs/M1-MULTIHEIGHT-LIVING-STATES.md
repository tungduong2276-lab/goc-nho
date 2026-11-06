# M1 — Four-height 3D source audit and every living-room state

This is **read-only, unapproved geometry evidence**, not a collision engine or permission to decorate.

## Source and method
- The six rooms are built by the actual Three.js generators in `_xuong-3d/room.js` and `_xuong-3d/rooms2.js`.
- Candidate mesh triangle sections are measured at **4 cm, 8 cm, 22 cm, and 45 cm above the room floor** in world metres X/Z.
- Four heights highlight components missed by a single 8 cm section, including elevated table supports or small floor objects. Lines are not filled into permission zones; open and branched contours, coplanar surfaces and overflow retain review flags.
- Every room/height emits one SVG vector diagram, i.e. **24 views**, plus source/algorithm-fingerprinted JSON with per-component `heightSlices`.
- The living-room source inspector enumerates all **12 actual interactive sprites/states** in the renderer: sofa, picture frame, calendar, two pinboard states, two radio states, four jar states, and rainy window. Five other rooms retain all their 36 states, making **48 interactive state records** in the full audit.
- Composited background objects are still counted independently (199 baked components), including rugs and kitchen floor tiles. A floor covering is not automatically blocked and no missing section means free floor.

## Limitations and doors
The source `roomShell()` creates walls on the back **x=-n/2 and z=-d/2** edges and no modeled door or partition on the front **x=+n/2 / z=+d/2** edges. These edges are **source-open sides, not authenticated door locations**. We cannot truthfully certify an entrance without review of actual user and scene navigation; no `doorwayStatus` or `walkwayStatus` changes are warranted here.

The model contains no built-in validated human capsule, no certified physical collision and no complete wall-opening metadata. Multi-height sections reduce false generalizations but still need source-art review before pathfinding candidates or room resizing.

## CI acceptance
The isolated PR requires 9+ source 3D tests, 24 actual SVG files, 48 state records, unapproved flags and the full staging/Playwright/Firebase Emulator suite. Inspect artifact consistency and CI on **last head SHA**; merge only into experimental PR #9. Keep PR #9 Draft, main untouched and all user Firebase data unchanged.

## Next
Prepare an explicitly *candidate-only* navigation graph from the real room shell's open edges, audited standing positions, and conservatively inflated possible solid meshes; flag disconnected starts and missing door features. Separately use source-scene test renders to propose **real increases of wall-to-wall dimensions**, not CSS resizing, with all furniture, lighting and hotspot metadata repacked only after visual QA.
