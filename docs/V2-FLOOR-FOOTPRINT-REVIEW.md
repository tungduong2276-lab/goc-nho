# Góc Nhỏ V2 — floor footprints and honest scene entrances (M1 geometry slice)

**Status:** experimental, local-only physical-floor prototype. Not deployed, not an M0 sign-off. Tracked by stacked PR against Draft PR #79, not `main`.

## What was measured against real room art

The 1170×1170 room backgrounds are orthographic/isometric pre-rendered WebP images. The visible floor edge in `assets/3d/bep_ngay.webp`, `phong_anh_ngay.webp`, `phong_em_ngay.webp`, `sang_tao_ngay.webp` and `gac_ngay.webp` was inspected. Objects are rendered as separate sprites from the `layers` metadata in `assets/3d/scene.json`. **Layer rectangles include empty margins and long dark-blue shadows; they are not a furniture physical collision footprint.**

`src/living-world-floor-geometry.mjs` now defines art-anchored **floor** polygons, named furniture **base** polygons and safe front-edge positions for all seven local-movement spaces (six rooms plus garden). `src/living-world-nav.mjs` uses these polygons and adds a small foot-clearance buffer before the existing A* route computation. This increases usable candidate ground surface within the existing rendered scene by over 15% for the five standard diamond-floor rooms; **it does not create larger source artwork or arbitrary new 3D room space**.

A key correction is in the kitchen: the dining table/chairs, refrigerator, stove and built-in counter are separate collision footprints. Previously, a counter-only bounding rectangle missed the actual dining table.



**Directional controls:** if an arrow points into a table, the avatar searches for the nearest reachable aisle offset and takes a real A* path around it. It does not teleport across furniture or silently ignore an otherwise possible movement. The test keeps the original 'down arrow must move' behavior and adds a collision-valid sidestep check.

**No room art currently displays a distinct door.** The `exit` coordinates mark a **safe location near the open front edge**, not a completed traversable doorway. Do not call these locations an implemented doorway transition; add an actual visible threshold/doorway and test transitions in a follow-up slice.

## How to inspect the overlay

Open a local/test instance with:

- `?world2=1&floormap=1#bep` (or the slug of another room).
- Green translucent polygon: candidate walkable floor.
- Pink/red areas: occupied physical furniture footprints.
- Blue circle: safe candidate point at the open front edge of the painted floor.
- Tap or click elsewhere as normal. The overlay always has `pointer-events:none`, so it must **not** block refrigerator, stove, sofa, garden or avatar interactions.

The overlay is not present with `?world2=1` alone or with V2 disabled. It does not read or write Firebase, modify saved room geometry or migrate any data. The generated CI screenshots `world-v2-floormap-*.png` are meant for manual review on 360/390/430px screens.

## Geometry review checklist

- [ ] Confirm floor polygon lies wholly on painted floor in all seven spaces, at day/evening/night lighting.
- [ ] Confirm **every** pink footprint is centered on physical ground contact, not the drawn object's back, wall decoration or transparent shadow.
- [ ] Verify standing sprites and both avatar routes neither clip solid furniture nor jump through a wall during re-render.
- [ ] Validate that kitchen table, stove, fridge and counter remain clickable without tapping the floor instead.
- [ ] Validate garden tree, swing, board and pot hitboxes retain priority at 360/390/430px.
- [ ] Verify actual opening/doorway design and coordinates for future two-character room transitions; do not claim the unpainted front edge is a door.
- [ ] On-device test at least two separate devices with live test-only profiles, reduced motion and network interruption.

Static geometry tests and browser snapshots are **partial evidence, not visual acceptance**. Any failed assertion or visually wrong footprint blocks merging this slice, and any unverified art overlap blocks releasing V2 to `main`.

## Data and release

- Art files unchanged, Firebase config/Rules/schema unchanged, `main` unchanged.
- V2 remains opt-in; path, QA shapes and movement state remain in RAM.
- PWA cache bumps from v16 to v17 to include the geometry import, preventing offline module-missing errors.
- Keep M0 live Cloud staging export/restore, deployed Rules/Auth/IAM/App Check and true two-device tests as blockers.

**Next:** after geometry review, draw a physically visible front threshold/corridor and connect it to the map, then add real in-world object approach positions and animated physical actions; independently improve room art/camera layouts rather than faking room size with CSS zoom.
