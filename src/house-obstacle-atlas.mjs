/**
 * Manually estimated 2D silhouettes for visibly baked-in props in six room
 * screenshots (CI artifact 41953137827, 390px review, mapped to 1170px art).
 * NOT measured physical collision hulls; render and preflight LOCAL ONLY.
 * Strictly never authorize Firebase persistence or production placement.
 */
import { ROOM_ZONE_PROPOSALS } from "./house-room-zones.mjs";
import { ROOM_SOURCES, PlacementPreviewError } from "./house-placement-preview.mjs";

const rect=(x1,y1,x2,y2)=>Object.freeze([
  Object.freeze([x1,y1]),Object.freeze([x2,y1]),
  Object.freeze([x2,y2]),Object.freeze([x1,y2]),
]);
const entry=(id,label,polygon)=>Object.freeze({
  id,label,kind:"VISUAL_OCCLUSION_APPROXIMATION",
  source:"CI_SCREENSHOT_41953137827_390PX",
  approved:false,polygon,
});
/** Source art pixel coordinates, NOT metres or game-world units.
 * Rectangles deliberately approximate visible object silhouettes; they do not
 * approximate underlying 3D collision footprints / depth.
 */
export const ROOM_OBSTACLE_ATLAS=Object.freeze({
  "phong-khach":Object.freeze([
    entry("sofa","Ghế sofa",rect(160,525,435,690)),
    entry("stair","Cầu thang",rect(430,240,655,635)),
  ]),
  bep:Object.freeze([
    entry("dining-table","Bàn ăn",rect(442,610,690,855)),
    entry("fridge","Tủ lạnh",rect(535,280,670,600)),
  ]),
  "phong-anh":Object.freeze([
    entry("bed","Giường",rect(425,435,755,655)),
    entry("wardrobe","Tủ áo",rect(750,420,895,680)),
  ]),
  "phong-em":Object.freeze([
    entry("bed","Giường",rect(420,430,690,665)),
    entry("vanity","Bàn trang điểm",rect(855,495,1040,735)),
  ]),
  "goc-sang-tao":Object.freeze([
    entry("easel","Giá vẽ",rect(440,520,565,735)),
    entry("workbench","Bàn dụng cụ",rect(745,540,1040,735)),
  ]),
  gac:Object.freeze([
    entry("cabinet","Tủ kỷ vật",rect(430,415,615,695)),
    entry("chest","Rương đồ",rect(490,755,635,945)),
  ]),
});
const fail=()=>{throw new PlacementPreviewError("INVALID_OBSTACLE_ATLAS");};
export function makeObstacleReviewZones(atlas=ROOM_OBSTACLE_ATLAS) {
  if(!atlas||Object.keys(atlas).sort().join("|")!==Object.keys(ROOM_SOURCES).sort().join("|"))fail();
  return Object.freeze(Object.fromEntries(Object.entries(ROOM_ZONE_PROPOSALS).map(([roomId,zone])=>{
    const obstacles=atlas[roomId];
    if(!Array.isArray(obstacles)||obstacles.length===0||
      obstacles.some(o=>!o||o.approved!==false||
        o.source!=="CI_SCREENSHOT_41953137827_390PX"||
        !Array.isArray(o.polygon)||o.polygon.length<3||
        o.polygon.some(p=>!Array.isArray(p)||p.length!==2||p.some(n=>typeof n!=="number"||!Number.isFinite(n)||n<0||n>1170))))
        fail();
    return [roomId,Object.freeze({...zone,
      reviewStatus:"PROPOSED_NOT_APPROVED",
      bakedFurnitureCertified:false,
      exclusions:Object.freeze(obstacles.map(o=>o.polygon)),
    })];
  })));
}
export const OBSTACLE_REVIEW_ZONES=makeObstacleReviewZones();
