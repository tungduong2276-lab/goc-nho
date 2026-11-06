/**
 * M1 v2 readiness report. Current source images contain no verified floor,
 * doorway or contact polygons. Deliberately returns no usable free floor,
 * even when visually opaque sprite pixels are measured successfully.
 */
import {ROOM_SOURCES,PlacementPreviewError} from "./house-placement-preview.mjs";
import {ROOM_ZONE_PROPOSALS} from "./house-room-zones.mjs";
const fail=code=>{throw new PlacementPreviewError(code);};
export const FLOOR_V2_PROTOCOL="DECOR_FLOOR_REVIEW_UNVERIFIED";
export function makeDecorFloorReview(roomId,alphaRecords=[],zones=ROOM_ZONE_PROPOSALS){
 if(!Object.hasOwn(ROOM_SOURCES,roomId))fail("UNKNOWN_ROOM");
 if(!Array.isArray(alphaRecords)||alphaRecords.some(r=>
  !r||r.protocol!=="SPRITE_ALPHA_VISUAL_ONLY"||
  r.floorContactStatus!=="UNTRACED"||r.canPersist!==false))fail("INVALID_ALPHA_EVIDENCE");
 const proposed=zones?.[roomId];
 if(!proposed||proposed.reviewStatus!=="PROPOSED_NOT_APPROVED"||
   !Array.isArray(proposed.candidateFloor))fail("INVALID_ZONE_MAP");
 return Object.freeze({
  protocol:FLOOR_V2_PROTOCOL,roomId,
  alphaEvidenceCount:alphaRecords.length,
  candidateFloor:proposed.candidateFloor,
  candidateStatus:"PROPOSED_NOT_APPROVED",
  approvedFloorPolygon:null,
  verifiedContactPolygons:null,
  doorwayReserve:null,
  walkwayReserve:null,
  decorFreeZones:Object.freeze([]),
  largestContiguousZone:null,
  usableFloorAreaPx2:null,
  spaciousScore:null,
  missingEvidence:Object.freeze(["APPROVED_FLOOR_BOUNDARY",
    "VERIFIED_FLOOR_CONTACTS","DOORWAY_THRESHOLDS","WALKABLE_CORRIDORS"]),
  canPersist:false,reviewStatus:"UNVERIFIED",
 });
}
export function requireVerifiedFloorReview(report){
 if(!report||report.protocol!==FLOOR_V2_PROTOCOL)fail("INVALID_FLOOR_REVIEW");
 fail("DECOR_FLOOR_NOT_APPROVED");
}
