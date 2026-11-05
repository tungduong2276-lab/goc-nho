/**
 * Six-room PROVISIONAL 2D zone annotations in the 1170x1170 image coordinate
 * system. THESE ARE NOT VERIFIED FLOOR OR BAKED-FURNITURE MESHES.
 * Candidate regions only provide a conservative editor sandbox and visual
 * authoring guide; lack of obstacle metadata always blocks real persistence.
 */
import { PlacementPreviewError, ROOM_SOURCES } from "./house-placement-preview.mjs";
import { FLOOR_PROPOSALS } from "./house-floor-review.mjs";
import { itemFootprint } from "./house-furniture-collision.mjs";

export const ZONE_PROTOCOL = "PROVISIONAL_IMAGE_ZONES_NO_3D_APPROVAL";
const fail=code=>{throw new PlacementPreviewError(code);};
const pointValid=p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite);
const polyValid=p=>Array.isArray(p)&&p.length>=3&&p.every(pointValid);
const signedArea=p=>p.reduce((v,a,i)=>{const b=p[(i+1)%p.length];return v+a[0]*b[1]-b[0]*a[1];},0)/2;
function rectPoly(x,y,halfW,halfH){
  return [[x-halfW,y-halfH],[x+halfW,y-halfH],[x+halfW,y+halfH],[x-halfW,y+halfH]];
}
function inPoly(point,poly) {
  // Boundaries count as inside. Convex and concave polygons supported.
  const [x,y]=point; let inside=false;
  for(let i=0,j=poly.length-1;i<poly.length;j=i++){
    const a=poly[i],b=poly[j];
    const cross=(b[0]-a[0])*(y-a[1])-(b[1]-a[1])*(x-a[0]);
    if(Math.abs(cross)<1e-8&&x>=Math.min(a[0],b[0])&&x<=Math.max(a[0],b[0])&&
      y>=Math.min(a[1],b[1])&&y<=Math.max(a[1],b[1])) return true;
    if((a[1]>y)!==(b[1]>y) && x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0]) inside=!inside;
  }
  return inside;
}
function lineCross(a,b,c,d) {
  const cross=(p,q,r)=>(q[0]-p[0])*(r[1]-p[1])-(q[1]-p[1])*(r[0]-p[0]);
  const v1=cross(a,b,c),v2=cross(a,b,d),v3=cross(c,d,a),v4=cross(c,d,b);
  return ((v1>0&&v2<0)||(v1<0&&v2>0))&&((v3>0&&v4<0)||(v3<0&&v4>0));
}
function polysIntersect(a,b) {
  if(a.some(p=>inPoly(p,b))||b.some(p=>inPoly(p,a))) return true;
  for(let i=0;i<a.length;i++)for(let j=0;j<b.length;j++)
    if(lineCross(a[i],a[(i+1)%a.length],b[j],b[(j+1)%b.length])) return true;
  return false;
}
function footprintPoly(slot,type,rotation) {
  const f=itemFootprint(type,rotation);
  return rectPoly(slot.x,slot.y,f.width/2,f.height/2);
}
function normalize(zone) {
  if(!zone||zone.reviewStatus!=="PROPOSED_NOT_APPROVED"||
    !Array.isArray(zone.candidateFloor)||!Array.isArray(zone.exclusions)||
    !zone.candidateFloor.length ||
    ![...zone.candidateFloor,...zone.exclusions].every(p=>polyValid(p)&&Math.abs(signedArea(p))>=1))
    fail("INVALID_ZONE_MAP");
  return zone;
}
export const ROOM_ZONE_PROPOSALS = Object.freeze(Object.fromEntries(
  Object.entries(FLOOR_PROPOSALS).map(([roomId,points])=>[
    roomId,Object.freeze({
      roomId,reviewStatus:"PROPOSED_NOT_APPROVED",
      // Two local design envelopes per room. NOT guaranteed empty in art.
      candidateFloor:Object.freeze(points.map(([x,y])=>
        Object.freeze(rectPoly(x,y,125,110).map(p=>Object.freeze(p))))),
      // Human-reviewed obstacle polygons are not yet available.
      exclusions:Object.freeze([]),
      bakedFurnitureCertified:false,
    }),
  ])
));
/** Explicit requirement: all 4 rectangle corners must lie in ONE candidate
 * polygon; if any exclusion touches the footprint, reject. No partial clipping.
 */
export function assertWithinProposedZones(draft,action,zones=ROOM_ZONE_PROPOSALS) {
  if(!draft||draft.protocol!=="LOCAL_PREVIEW_ONLY"||draft.canPersist!==false||
    !Array.isArray(draft.slots)||!Array.isArray(draft.items)) fail("INVALID_DRAFT");
  if(!action||!["place","move","rotate"].includes(action.kind)) fail("INVALID_ACTION");
  const current=action.kind==="place"?null:draft.items.find(i=>i.id===action.id);
  if(action.kind!=="place"&&!current) fail("UNKNOWN_ITEM");
  const roomId=current?.roomId??action.roomId;
  if(!Object.hasOwn(ROOM_SOURCES,roomId)) fail("UNKNOWN_ROOM");
  const slotId=action.kind==="rotate"?current.slotId:action.slotId;
  const slot=draft.slots.find(s=>s.id===slotId&&s.roomId===roomId);
  if(!slot||!Number.isFinite(slot.x)||!Number.isFinite(slot.y)) fail("UNKNOWN_SLOT");
  const zone=normalize(zones?.[roomId]);
  const type=current?.assetType??action.assetType;
  const rotation=action.kind==="rotate"?action.rotation:action.kind==="move"?current.rotation:(action.rotation??0);
  const footprint=footprintPoly(slot,type,rotation);
  if(!zone.candidateFloor.some(poly=>footprint.every(p=>inPoly(p,poly))))
    fail("OUTSIDE_PROPOSED_FLOOR");
  if(zone.exclusions.some(poly=>polysIntersect(poly,footprint))) fail("ZONE_EXCLUSION_COLLISION");
  return Object.freeze({protocol:ZONE_PROTOCOL,roomId,slotId,reviewStatus:zone.reviewStatus,bakedFurnitureCertified:false});
}
