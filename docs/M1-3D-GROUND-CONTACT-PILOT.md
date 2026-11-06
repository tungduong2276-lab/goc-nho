# M1 — Real 3D near-ground mesh candidates (experimental)

**Source:** `_xuong-3d/rooms2.js` builds five real isometric rooms in THREE.js. The CI-only `_xuong-3d/m1-ground-contact-proposals.mjs` now inspects actual world-transformed meshes in all item states, selects mesh bounding boxes extending to within 0.14 m of ground (y=0), unions their world-XZ extents and projects each rectangle with the real room camera. It records physical source room dimensions and a SHA-256 digest of the 3D source files. This does **not** use screenshot alpha or DOM/CSS coordinates as collider geometry.

## Evidence
- `review-artifacts/house-mesh-contact/source-ground-contact-proposals.json`: five rooms, every interactive item state, near-floor mesh count, world metres X/Z rectangle and 1170px projected polygon; a missing contact is `null`, not an invented obstacle.
- GitHub Actions uploads that JSON on the isolated pilot branch after running the actual Three.js source. The run fails if no evidence is produced or if experimental approval flags are inconsistent.
- No Firebase traffic; the source renderer and asset images are not modified by this exporter.

## Important limitations
- This is an **over-approximate mesh bounding rectangle**, not the contact shape of chair legs, a bedside table, an open door, or several disconnected components. It may include outlines and parts not actually on the ground, and cannot identify walkable corridors.
- Decorative background pieces (rugs, stove counter, plants) live in `deco` and are deliberately NOT yet classified as walkable obstacles. No door/threshold polygons have been identified. The five-room pilot **excludes** the separately generated living room.
- The shell dimensions are source-rect candidates, not a reviewed floor boundary. World and image geometry still require a full-composite visual check. Models may contain overhangs, wall-hung items and accessories.
- Everything is `EXPERIMENTAL_ONLY`, `contactVerified:false`, `canPersist:false`. The results must **never** unlock decoration, sync, migration, or placement writes.

## Next
1. Inspect JSON candidate polygons and actual composited images, especially all open/closed states and legs/feet vs whole bounding boxes.
2. Add physical contact classification for background/deco furnishings and separately generated living room; collect human-reviewed door/walkway/standing-place geometry.
3. Propose exact mesh-ground intersections or manually reviewed smaller contact polygons after a real source 3D comparison, while leaving the approval gate fail-closed.
4. Preserve PR #9 Draft and M0 deployed Firebase security plus independent staging backup/restore gates.

## Verified pilot artifact — CI #239
- Generated JSON from the real `Three.js` source for five rooms: 36 interactive item-state meshes examined; 33 yielded near-floor mesh envelopes, 3 yielded no near-floor contact.
- No-ground (not automatically safe to place below): `phong_anh/kesuutap_trong`, `sang_tao/dayphoi_trong`, `gac/bandogioi_trong`, all wall-hung source items.
- All 33 grounded rectangles stayed inside source shell X/Z bounds in this audit. This is only a consistency check, not a clearance or gameplay approval.
- The source JSON was downloaded and inspected from artifact `m1-3d-mesh-contact-proposals-42181665583`; full test and final HEAD status must still be verified before merge.
