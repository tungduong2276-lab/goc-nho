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
- The background is an existing actual day render. Individual fixed-contact sprites are **not** currently composited in this editor; use the existing contact tool and actual full-composite review before approving anything.
- The logic rejects doorway/walkway segments that cross the outside of a concave floor polygon, even if the endpoints are inside.

## Gates
- Browser tests cover all six rooms, 360/390/430 widths, duplicate contacts, export, memory-only reset and absence of Firebase traffic. Full `npm test` required.
- Review screenshots and compositing, and independently verify contact masks and human standing points across 4 lighting variations before proposing any approval.
- PR #9 stays Draft and cannot merge into main until M0 deployed security and staging export/restore are documented and tested.
