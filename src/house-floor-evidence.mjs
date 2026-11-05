/**
 * M1 synthetic-only floor/threshold/walkway annotation envelope.
 * Geometry comes from manual review, NOT inferred from sprite boxes.
 * Deliberately never grants placement or Firebase persistence.
 */
import {ROOM_SOURCES,PlacementPreviewError} from "./house-placement-preview.mjs";
import {validateContactPolygon} from "./house-floor-contact-atlas.mjs";

export const FLOOR_EVIDENCE_PROTOCOL="M1_ROOM_FLOOR_EVIDENCE_UNAPPROVED";
export const FLOOR_ROLES=Object.freeze(["floor","doorway","walkway","fixed_contact"]);
const fail=code=>{throw new PlacementPreviewError(code);};
const pointInPolygon=(point,polygon)=>{
 const [x,y]=point;let inside=false;
 for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
  const a=polygon[j],b=polygon[i];
  const cross=(b[0]-a[0])*(y-a[1])-(b[1]-a[1])*(x-a[0]);
  if(Math.abs(cross)<1e-7&&x>=Math.min(a[0],b[0])&&x<=Math.max(a[0],b[0])&&y>=Math.min(a[1],b[1])&&y<=Math.max(a[1],b[1]))return true;
  if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])inside=!inside;
 }
 return inside;
};
export function makeFloorAnnotation({roomId,role,vertices,layerId=null},scene){
 if(!Object.hasOwn(ROOM_SOURCES,roomId))fail("UNKNOWN_ROOM");
 if(!FLOOR_ROLES.includes(role))fail("UNKNOWN_FLOOR_ROLE");
 if(role==="fixed_contact"){
  const sourceId=ROOM_SOURCES[roomId];
  const source=sourceId===null?scene?.room:scene?.rooms?.[sourceId];
  if(typeof layerId!=="string"||!Object.hasOwn(source?.layers??{},layerId))
   fail("UNKNOWN_CONTACT_LAYER");
 }else if(layerId!==null)fail("UNEXPECTED_LAYER_ID");
 const polygon=validateContactPolygon(vertices);
 return Object.freeze({protocol:FLOOR_EVIDENCE_PROTOCOL,roomId,role,layerId,
   vertices:polygon.vertices,areaPx2:polygon.areaPx2,
   reviewStatus:"REQUIRES_HUMAN_VISUAL_REVIEW",canPersist:false,
   contactVerified:false,sourceScreenshotReviewed:false});
}
export function buildFloorReviewBundle(annotations){
 if(!Array.isArray(annotations))fail("INVALID_FLOOR_BUNDLE");
 const seen=new Set();
 const byRoom=new Map();
 for(const entry of annotations){
  if(!entry||entry.protocol!==FLOOR_EVIDENCE_PROTOCOL||
   entry.reviewStatus!=="REQUIRES_HUMAN_VISUAL_REVIEW"||
   entry.canPersist!==false||entry.contactVerified!==false||
   entry.sourceScreenshotReviewed!==false||
   !Object.hasOwn(ROOM_SOURCES,entry.roomId)||!FLOOR_ROLES.includes(entry.role))
   fail("UNTRUSTED_FLOOR_ANNOTATION");
  const valid=validateContactPolygon(entry.vertices);
  if(valid.areaPx2!==entry.areaPx2)fail("TAMPERED_FLOOR_AREA");
  if(entry.role==="fixed_contact"){
   if(typeof entry.layerId!=="string"||!entry.layerId)fail("INVALID_CONTACT_LAYER");
   const k=entry.roomId+":"+entry.layerId;
   if(seen.has(k))fail("DUPLICATE_CONTACT_ANNOTATION");
   seen.add(k);
  }else if(entry.layerId!==null)fail("UNEXPECTED_LAYER_ID");
  const group=byRoom.get(entry.roomId)??[];
  group.push(entry);byRoom.set(entry.roomId,group);
 }
 // A missing floor/doorway/walkway is never interpreted as empty or safe.
 const readiness=Object.keys(ROOM_SOURCES).map(roomId=>{
  const records=byRoom.get(roomId)??[];
  const missing=["floor","doorway","walkway"].filter(role=>!records.some(r=>r.role===role));
  const floors=records.filter(r=>r.role==="floor");
  const reserves=records.filter(r=>r.role==="doorway"||r.role==="walkway");
  const floatingReserveVertices=reserves.some(r=>!floors.some(f=>r.vertices.every(p=>pointInPolygon(p,f.vertices))));
  return Object.freeze({roomId,annotationCount:records.length,missing:Object.freeze(missing),
   reservesOutsideProposedFloor:floatingReserveVertices,
   status:"UNAPPROVED",canPersist:false});
 });
 return Object.freeze({protocol:FLOOR_EVIDENCE_PROTOCOL,status:"UNAPPROVED",
  canPersist:false,annotations:Object.freeze([...annotations]),readiness:Object.freeze(readiness)});
}
/** No shape of locally authored evidence is a production authorization. */
export function requireApprovedFloorEvidence(){
 fail("FLOOR_GEOMETRY_NOT_APPROVED");
}
