# M1 — Bedroom spacious asset rollout on experimental branch

## Scope
PR #62 reviewed the before/after actual Three.js renders and merged its source geometry into PR #9 at 4e97cfb9. This separate PR packages the actual photos and scene metadata for Phòng Anh and Phòng Em; it does not deploy to main or write Firebase.

## Implementation checklist
- scripts/m1-pack-bedroom-assets.py takes full 1170x1170 PNGs from the authentic rooms2.js jobs, repacks four lighting backgrounds (sang/ngay/chieu/dem) and all item/state sprites, crop with alpha threshold 10.
- Update only scene.rooms.phong_anh and scene.rooms.phong_em within assets/3d/scene.json. Other rooms, map, living room, kitchen, rig, and the garden stay untouched.
- Validate that item/state keys, image sizes, two standing points and the six flower-shelf anchors do not drift; otherwise refuse to package.
- GitHub Actions renders/repacks before npm test, confirms staging/Playwright/Firebase Emulator on new assets, then commits tested WebP and scene.json only to isolated feature/m1-spacious-bedroom-assets. A separate CI on the final binary HEAD is required because bot pushes do not necessarily trigger PR checks.
- tests/staging/m1-bedroom-packed-assets.test.mjs verifies all lighting, 4 interactive objects per bedroom, sprite bounds, and scene compatibility.
- tests/browser/m1-bedroom-spacious-interaction.spec.mjs exercises real sprite image loading and room geometry across phone and wide breakpoints, and trial-clicks the bed hotspot.
- scripts/m1-bedroom-spacious-compare.py provides two before/after renders and a provisional review manifest.

## Merge gates
1. No Firestore rules, Firebase config, live data, index.html, unrelated room assets or collections changed.
2. Green staging, browser and emulator tests on the binary HEAD, then post-merge CI on the parent branch.
3. Visually correct bed/canopy, desk, bear, flower shelf and diary; no clipped assets. All sprite hotspots align with current metadata.
4. Scene floor, doorways and contact masks remain UNAPPROVED; no shared decoration writes may be enabled.
5. PR #9 stays Draft until actual M0 production security, staging backup/restore and rollback checks complete.

After these two bedrooms, prioritize the remaining studio and attic rooms using the same source-rendered review and separate asset packaging process.
