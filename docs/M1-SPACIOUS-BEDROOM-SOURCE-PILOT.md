# M1 — Phòng Anh & Phòng Em: Spacious 3D source pilot

## Scope
Pilot uses the real Three.js generator, not CSS scaling. A review of `_xuong-3d/rooms2.js` showed both beds and storage already against side/back walls, so a radical move risks the bed/wardrobe or diary chest overlapping. The safe proposal nudges each bed's headboard towards the back wall while preserving its X position, slides purely decorative rugs towards the bedside, and relocates the teddy in Phòng Em away from the center towards the right edge. Bedroom wall items, shelves, canopy, desk, dresser, wardrobe, diary and all character standing points remain untouched.

- Phòng Anh bed: `[-2.25,-1.6] → [-2.25,-1.92]` (metres X/Z); rug `[0.2,0.9] → [-1.15,0.98]`.
- Phòng Em bed: `[-2.25,-1.7] → [-2.25,-1.92]`; rug `[0.4,0.8] → [-1.15,0.95]`; teddy `[1.9,1.6] → [2.52,1.6]`.
- The modeled bed is approximately 1.2m wide × 2.0m long with headboard at local Z=-1.0. New bed center Z=-1.92 keeps the modeled headboard inside the original 6m shell (Z>=-3).
- Non-interactive rugs are **not** counted as physical collision blockers. `bedroomClearanceReview()` computes approximate change in bed overlap for a reference rectangle. This is not an approved floor/navmesh measurement or proof that a character path is clear.

## Files, tests and deliverables
- `_xuong-3d/bedroom-spacious-pilot.js`: old/next positions and conservative model-space overlap estimate.
- `_xuong-3d/rooms2.js`: consume these source positions for both bedrooms' beds, rugs and bear. Preserve item IDs, states, room anchors, wall décor, scene shell, and room dimensions.
- `scripts/m1-bedroom-spacious-compare.py`: composite current full scene from shipped WebP + `scene.json`, and proposed full 3D render with every default item state; output two true before/after 2340×1240 PNGs and manifest.
- `tests/staging/m1-bedroom-spacious-source.test.mjs`: verify bed moves toward wall, still inside source shell, rug/teddy source placement, preserved functional states/standpoints, and no approval/persistence claims.
- GitHub Actions for this isolated branch renders `rooms2.js` jobs `phong_anh`, `phong_em`, exports two artifacts and runs existing staging, Playwright and Firebase Emulator tests.

## Review gates before actual asset rollout
1. Inspect PNGs. All objects inside walls; bed not clipped; canopy/frame/diary clear; teddy visible but not in the two-character standing area. The new center appears more open rather than simply becoming blank.
2. If approved, create **another** PR based on the experimental PR #9 branch, render **all four times of day** and every state of both rooms and recrop all sprite WebPs. Update only `scene.rooms.phong_anh` and `scene.rooms.phong_em` metadata in lockstep, including layers/anchors. Ensure 360/390/430/1300 mobile/desktop and all real interaction tests succeed on those assets.
3. Do not treat alpha image masks as floor-contact masks. Floor boundary, doorway thresholds, clearance, camera/occlusion and physical contact still require a distinct review.
4. No Firestore SDK usage, no data writes, no deploy and no main merge. PR #9 remains Draft while M0 live rules, IAM, App Check, staging backup/restore and rollback remain unverified.

The pilot deliberately excludes production WebP/assets/scene.json changes; it proves the source generator can create the proposed larger usable center without migrating user data.
