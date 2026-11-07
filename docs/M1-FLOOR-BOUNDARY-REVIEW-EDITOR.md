# M1 — Floor and doorway annotation visual editor

Separate experimental review-only UI: `experiments/house-floor-review.html`.

## How it works
1. Open the experiment explicitly. It does not activate in the normal House tab.
2. Select one of six rooms and one type: floor, doorway, walkway or fixed_contact; a fixed contact must point to a valid scene.json sprite layer.
3. Add 3–32 coordinate vertices by clicking a 1170×1170 source image or entering X/Y. A complete polygon can be recorded as a **candidate only**.
4. Review the six-room completeness and containment warnings. Export the `M1_ROOM_FLOOR_EVIDENCE_UNAPPROVED` JSON in-memory, then manually copy it for discussion.
5. Reload resets all local proposals. There is no Firebase SDK, localStorage, server write, claim of physical collision, approval or placement permission.

## Safety
- Unapproved geometry always has `canPersist:false`; it cannot unlock shared decorating.
- No Firestore Rules, live app, production image or deployment modifications.
- The background is an existing actual day render. The review now overlays ONE default state per physical item, or the currently selected contact item's state, using exact scene.json sprite file paths and image boxes. A toggle hides the overlay for floor-only inspection. **Sprite depth/occlusion and all alternate states are NOT verified here; do not mistake transparent sprite image bounds for foot contact.** Compare original full-composite renders before approving anything.
- The logic rejects doorway/walkway segments that cross the outside of a concave floor polygon, even if the endpoints are inside.

## Gates
- Browser tests cover all six rooms, 360/390/430 widths, duplicate contacts, export, memory-only reset and absence of Firebase traffic. Full `npm test` required.
- Review screenshots and compositing, and independently verify contact masks and human standing points across 4 lighting variations before proposing any approval.
- PR #9 stays Draft and cannot merge into main until M0 deployed security and staging export/restore are documented and tested.

## Separate composite integration (review-only)
- One initial state per item is layered over the day background, with selected `fixed_contact` state taking priority. Living room defaults choose one radio/jar/noticeboard state rather than overlaying all alternatives.
- Reviewer can hide/show furniture layers; the selection affects visual evidence only and never scene.json, Firebase or saved user preferences.
- Playwright checks images load in all six rooms and that changing the selected bed state swaps the corresponding sprite. The composite is a source-coordinate approximation and still needs manual depth, alpha silhouette, floor-contact and standing-point verification.

## M1 four-lighting evidence pass (experimental PR)
- The editor can switch the exact existing `sang/ngay/chieu/dem` backgrounds of all six rooms without editing scene metadata or moving overlays. It is a *visual review*, not a 3D floor reconstruction.
- CI checks 6 rooms × 4 lighting views, confirms the 1170×1170 source image loads and furniture boxes remain stable, and uploads 24 screenshots under `review-artifacts/house-floor-lighting/`.
- The images support checking contrast, room boundaries, visual occlusions and initial footprint proposals; they do **not** confirm whether a sprite image rectangle is a physical collision hull. User-authored floor, doorway, walkable corridor and fixed contact polygons remain required.
- No change to the live app or Firebase. Review metadata always `UNAPPROVED`, `canPersist:false`.

## M1 source provenance for geometry annotations

The review-only exporter now attaches a SHA-256 digest of the exact fetched `assets/3d/scene.json` bytes and one source context per hand-drawn polygon: room, role, selected furniture layer, lighting state and currently visible furniture state keys. It is a **local audit snapshot, not a cryptographic signature or proof of real contact**.

Switching lighting after drawing warns if existing room annotations were drawn under another light. Changing lighting never changes any polygon coordinates. Furniture-contact proposals cannot be recorded while their selected sprite is hidden. Reviewers must compare every source context with current rendered assets and redo the review if the scene digest changes.

All exports and in-memory records remain `UNAPPROVED`, `canPersist:false`; no Firebase writes, production changes or free-placement authorizations. CI checks malformed or forged contexts, browser-export SHA-256 against repository file bytes, source-light snapshots and mobile safety. The remaining manual task is to trace **real physical floor, doorways, walkways and furniture foot contact** per room and validate against all interaction states, not to infer them from image-box rectangles.
