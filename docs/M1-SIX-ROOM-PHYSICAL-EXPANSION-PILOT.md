# M1 — Six physical source-world room expansions (pilot)

This PR changes **actual Three.js world shell sizes and furniture coordinates**, not CSS. It does not yet update the shipped WebP images or live `scene.json`.

## World geometry change
| Source room | Before | Proposed source | World floor area gain |
| --- | --- | --- | --- |
| Phòng khách | 6×6 m (36m²) | 7×7 m (49m²) | +13m² / 36.1% |
| Bếp | 6×6 m | 7×7 m | +13m² / 36.1% |
| Phòng Anh | 6×6 m | 7×7 m | +13m² / 36.1% |
| Phòng Em | 6×6 m | 7×7 m | +13m² / 36.1% |
| Góc sáng tạo | 6×6 m | 7×7 m | +13m² / 36.1% |
| Gác kỷ niệm | 6×4 m (24m²) | 7×5 m (35m²) | +11m² / 45.8% |

The actual ortho camera changes from 112 to 96 pixels/metre to fit a genuinely larger source world in the same 1170×1170 output resolution. All interactive mesh sizes stay unchanged; their root world-X/Z positions are reanchored towards wider edges. Source wall-mounted items use the widened shell bounds rather than being scaled after placement. Bếp checker floor and wall tiles are regenerated across 7m source dimensions; floor/wall finishes are excluded from double translation. Interior source decoration roots are translated, but complex internal roof/garland art is **pending visual review**, not automatically approved.

## Tests and evidence
- `_xuong-3d/m1-expanded-room-source.mjs`: explicit old/new world metric contracts and position mapping. No placement authorization.
- `_xuong-3d/m1-physical-expansion-source.test.mjs`: checks real source Three.js room shell n/d, actual camera PPM, physical area increases, sampled furniture world positions and unchanged mesh scale.
- Isolated CI renders all **four lighting backgrounds** and interactive source states of all six rooms, checks actual full 1170px art, and uses `scripts/m1-six-room-physical-compare.py` to compare against shipped app composites.
- Six review images under `review-artifacts/house-physical-expansion/`, each showing real shipped before vs actual widened Three.js after, with a measurable source-world area change and no App/Firebase writes.

## Safety
- `main` and production Firebase unchanged. The currently shipped House tab is still served by its old packaged WebP/sprite metadata. This source-only pilot MUST NOT be represented as completed live room enlargement.
- Before updating any shipped asset: review all six before/after composites, furniture states, visible floor area, roof/window art, four lighting states, tap polygons/anchors and mobile view. Then run a separate guarded asset-pack PR to regenerate every related layer and meta, check app tests, and merge into PR #9 only after green final-HEAD CI.
- M0 deployed Auth/Rules/App Check/IAM/backups & manual floor/doorway approval remain incomplete. This PR leaves placement `canPersist:false` and all route/collision decisions unapproved.
- Earlier PR #74 source-only path audit: all 13 original standing positions found candidate paths in five rooms; both Gác standing positions intersect conservative possible obstacles. Source 3D widening may change paths, but it is **not proof** that actual Gác is fixed.

## Next steps
Review the actual CI images; adjust any roof, window, rug or item hotspot anomalies; measure connectivity after widening against unknown props; then prepare a separate guarded artwork + metadata rollout, not a blind merge to production.
