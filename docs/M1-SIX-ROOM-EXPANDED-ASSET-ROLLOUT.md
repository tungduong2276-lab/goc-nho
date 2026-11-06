# M1 — Physical six-room artifact rollout (isolated trial)

This PR is stacked on top of the **actual Three.js world geometry** source expansion PR #75, not a CSS image enlargement.

## Source-backed output contract
- Render `room.js nen lop` and `rooms2.js bep phong_anh phong_em sang_tao gac` in the browser with the actual expanded shells (7×7m for five rooms, 7×5m for Gác) and 96 px/metre perspective, all art at 1170×1170 output pixels.
- Compare original shipped default composite to the expanded source composite **before replacing** any WebP asset, using `scripts/m1-six-room-physical-compare.py`.
- `scripts/m1-pack-six-room-expansion.py` crops all newly rendered sprites by alpha, regenerates four lighting backgrounds per room, writes 72 synchronized WebPs (24 backgrounds + 48 interactive states) and atomically updates only the static `assets/3d/scene.json` file after complete validation.
- Preserve every existing room item ID, item state key and spot key. Explicitly include `sourceWorldFloorMetres`, `floorCollisionVerified:false` and `doorwayWalkwayVerified:false` in room metadata.
- Guard the map: only the six room datasets may change, the overview map data must be exactly equal before and after. No Firebase writes, rules or document schema modifications.
- CI tests all source geometry, the complete staged app/browser/Firebase Emulator suite and new packed-data contract before a GitHub Actions commit adds regenerated assets to **this feature branch only**.

## Non-goals and caveats
These images and metadata are **trial app assets on the PR branch only**, not published production data. Rerendered art and new screen-space sprite boxes do not prove placement collision, actual doors, correct avatar walking paths or Firebase permission. The old app two-person data remains untouched.

## Merge gates
1. Inspect six before/after real rendered comparisons and four lighting variants; verify windows/roof decor, furniture/characters, 360/390/430px mobile taps, 1300px desktop and all 48 sprite states.
2. After bot-generated binary asset commit, require CI on that **exact latest PR HEAD**. An `action_required` status does not count as PASS.
3. Merge stacked PR into PR #75 source branch only after all checks; then merge PR #75 into experimental PR #9 after its CI and manual review. PR #9 remains Draft to `main` until actual M0 staging backup/restore, deployed Auth/Rules/App Check/IAM/rollback and M1 floor/doorway safety checks pass.
