# Góc Nhỏ V2 — walking/navmesh local preview

**Status:** Experimental stacked feature branch for PR #79. This is a local 2.5D prototype, not a multiplayer launch or final acceptance. Only active under `?world2=1`.

## Scope implemented

- `src/living-world-nav.mjs` defines hand-reviewed approximate floor polygons and static obstacle rectangles for: phòng khách, bếp, phòng Anh, phòng Em, góc sáng tạo, gác kỷ niệm, khu vườn.
- Deterministic grid A* path search with diagonal corner-cut prevention, intermediate collision samples, line-of-sight path simplification and refusal of invalid/outside-floor taps.
- `src/living-world-avatar.mjs` moves the **local** character after tapping empty floor or pressing direction buttons, with client-side interpolation (or immediate movement for reduced motion), mobile controls and three temporary emotional reactions.
- No new storage collection, no Firestore writes, no changes to existing notes, rooms, inventory, outfits, garden or production Rules. Avatar position is memory-only and therefore **not visible to the other partner**.
- Existing room-object click handlers retain priority when the visible object lies under the pointer.

## Known visual/technical limitations

1. Floor polygons are APPROXIMATE from visual review of current premade images. They are not yet semantic room floor masks. Real collision with dynamically placed furniture or character bounding footprints has not passed a manual visual acceptance.
2. A static collision rule cannot make the prebaked 3D room into a freely navigable physics world. Dynamic object placement and multidevice avatar sync require a different scene/runtime data layer.
3. This preview supports seven rooms, but transitions still use legacy tab navigation; room-to-room doorway routes and coordinated camera movement remain future work.
4. Partner avatar presence remains legacy and should not be misrepresented as live positional tracking.
5. Current software check: `npm run test:staging` and `npm run test:browser` in CI, plus manual 360/390/430 visuals. Do not claim these tests passed until linked evidence exists.

## Pre-release gates

- A/B screenshots across every listed room: front/back wall, visible floor, entrance/exit, furniture boundaries and corner tests.
- Verify all physical hitboxes with rendered layered art, including tall furniture and their floor footprints. Obtain human aesthetic approval; rerun against PR #9 changes.
- Two-person staging only for future real-time movement, including authenticated room scopes, reconnect interpolation, throttling, stale messages, expiry and read/write budgeting.
- Separate-project managed export/restore and verified deployed Rules/Auth/App Check/IAM remain the M0 gate; do not promote test assets or code to production without review.

## Handoff

Branch `feature/living-world-v2-walking` based on PR #79 head `bcb8fdce1ee50e2e185aa19d0f98c58ea7cb8813`.
Next: verify CI, repair failures if any, inspect mobile screenshots, then merge **into PR #79's feature branch only**, never into `main` until product/security gates are closed.
