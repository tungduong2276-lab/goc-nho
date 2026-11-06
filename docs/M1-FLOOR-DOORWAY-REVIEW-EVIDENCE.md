# M1 — Independent floor, doorway and walkway review evidence

This branch follows successful post-merge CI #219 for spacious bedrooms on PR #9. The parent branch remains Draft; the later automatic scene.json-only commit requires its own explicit verification.

## What this adds

- `src/house-floor-evidence.mjs`: manual geometry envelopes for six rooms and four annotation roles: floor, doorway, walkway, fixed_contact. Every polygon uses the existing 1170x1170 coordinate-system validator.
- Contact annotations must reference an actual layer in the relevant scene; noncontact annotations must not impersonate furniture.
- `buildFloorReviewBundle` identifies each room's missing floor/doorway/walkway annotations and flags reserve polygons extending outside the proposed floor. It does **not** approve them, invent missing doors, infer physical collisions or calculate usable decor area.
- The bundle and all annotations are always `UNAPPROVED`, `canPersist:false`. `requireApprovedFloorEvidence` always rejects, including forged approval fields.
- Synthetic staging tests cover six-room completeness, malformed geometry, missing/duplicate contact evidence and forged authorization.

## Remaining tasks before usable placement

1. Collect manual polygons from actual multi-state renders with floor contact editor, recording room, source layer, screenshot, lighting variant and reviewer.
2. Validate render alignment and door/walkway containment visually (polygon vertex containment alone cannot prove the whole polygon is inside a concave floor).
3. Evaluate contact unions and walkable connected regions against every furniture state. Establish actual floor masks; do not treat sprite alpha bounds as collision geometry.
4. Test updated annotations at 360/390/430/1300 widths, then seek separate human visual approval.
5. Keep all app placement writes disabled until M0 staging managed backup/restore and deployed production Rules/Auth/App Check/IAM/rollback reviews pass.

**Privacy:** No Firebase SDK calls, production data reads/writes, migrations, real user data fixtures, or live app UI mutations. Only new isolated review-only code, tests and documentation.

**CI:** `npm test` on feature head; screenshots and CI must be separately reviewed before merging to PR #9. PR #9 must not be merged to main solely on the basis of this work.
