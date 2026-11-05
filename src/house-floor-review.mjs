/**
 * Image-reviewed floor proposals, NOT approved furniture locations.
 * Pixel coordinates refer to 1170 x 1170 original room artwork.
 * Excludes original standing anchors by a conservative minimum distance.
 * Baked-in props have no collision meshes and are NOT validated.
 * No persistence, no Firebase, no production authorization.
 */
import { makePlacementPreview, PlacementPreviewError, ROOM_SOURCES } from "./house-placement-preview.mjs";

export const FLOOR_PROPOSALS = Object.freeze({
  "phong-khach": Object.freeze([[300,705],[855,765]]),
  bep: Object.freeze([[300,725],[640,910]]),
  "phong-anh": Object.freeze([[270,740],[825,765]]),
  "phong-em": Object.freeze([[315,750],[825,765]]),
  "goc-sang-tao": Object.freeze([[300,755],[480,855]]),
  gac: Object.freeze([[270,730],[840,765]]),
});
export const FLOOR_REVIEW_STATUS = "PROPOSED_NOT_APPROVED";
const CHAR_CLEARANCE = 120; // image source px; center-to-center only, NOT character bounds
const PAIR_CLEARANCE = 160; // image source px; larger than 44px touch target at 390px stage
const distance = (a,b) => Math.hypot(a[0]-b[0],a[1]-b[1]);
const valid = (p,size) => Array.isArray(p) && p.length === 2 &&
  p.every((v,i) => Number.isFinite(v) && v>=0 && v<=size[i]);
const error = () => {throw new PlacementPreviewError("FLOOR_PROPOSAL_UNSAFE");};

/** Separate, opt-in draft; original 12 character-standing candidates remain unchanged. */
export function makeFloorProposalPreview(scene, proposals = FLOOR_PROPOSALS) {
  const base = makePlacementPreview(scene);
  if (!proposals || Object.keys(proposals).sort().join("|") !==
    Object.keys(ROOM_SOURCES).sort().join("|")) error();
  const slots=[];
  for (const [roomId, sourceId] of Object.entries(ROOM_SOURCES)) {
    const source = sourceId===null ? scene.room : scene.rooms[sourceId];
    const anchors = sourceId===null ? scene.room.dung : source.spots.dung;
    const points = proposals[roomId];
    if (!Array.isArray(points) || points.length !== 2 || !Array.isArray(anchors) ||
        !points.every(point => valid(point,source.size)) ||
        distance(points[0],points[1]) < PAIR_CLEARANCE ||
        points.some(point => anchors.some(anchor => distance(point,anchor)<CHAR_CLEARANCE))) error();
    points.forEach((point,i) => slots.push(Object.freeze({
      id: roomId+"-candidate-"+(i+1), roomId,
      x:point[0],y:point[1],status:FLOOR_REVIEW_STATUS,
    })));
  }
  return {...base,slots:Object.freeze(slots),items:[],undoStack:[],canPersist:false};
}
