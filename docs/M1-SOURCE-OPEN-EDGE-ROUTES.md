# M1 — Conservative source-shell open-side route hypotheses

This is a **visual planning and diagnostics tool**, not real door metadata, certified walking clearance, or permission to place furniture.

## Grounding
- The actual Three.js `roomShell()` code builds two full rear walls: at world **xMin** and **zMin**. It leaves positive X and positive Z perimeter edges visually open in the isometric room model; there is **no implemented doorway geometry** to identify an actual door.
- Real initial standing points are read from `jobs.nen` for Phòng khách and `R.spots.dung` for the other five rooms, maintaining source units (world X/Z in metres).
- Interactive 3D near-floor AABB bounds from **every item state**, plus conservatively included unclassified background components, are treated as possible obstacles. Rugs, floor finishes and wall/raised decor are excluded from this rough candidate-only block list; exclusions do **not** certify those surfaces walkable.
- A quarter-metre grid and nominal 0.30m radius generate hypothetical routes to either positive shell edge. Candidate routes explicitly report blocked starts, unreachable edges, and source-open approach paths. These paths **are not** verified walkable corridors or independently checked human/avatar capsules.

## Review artifacts
- `review-artifacts/house-routes/six-room-open-edge-candidates.json`: six source-derived rooms, original standing positions, conservative blockage counts and paths.
- Six independent top-down SVGs: rear walls in dark purple, model-open edges in orange dashed, sources in blue, possible obstacles red and proposed approaches teal.
- Node tests verify clear and blocked synthetic cases, bad inputs, real six-room source standing anchors and fail-closed statuses.

## Required human/engineering work
1. Decide where actual room entry/door thresholds should exist. Source shells currently contain no doorway objects: declaring an orange edge a **door** would be misleading.
2. Manually review exact physical collider meshes and decorative objects; AABBs overblock, single-plane sections can miss short objects. A grid path is not collision clearance.
3. Review avatar standing reach, stair access and interaction points at all four lighting states, desktop and mobile.
4. Only once reviewed, author real threshold polygons, bounded corridors and user-defined furniture slots. No Firebase persistence or production merge until full M0 backups/security and independent M1 acceptance.

**Unconditional fail closed:** `doorGeometryPresent:false`, `walkwayVerified:false`, `verifiedDoorways:[]`, `canPersist:false`. Source-empty routes do not mean no route exists; source-found routes do not grant safe access.
