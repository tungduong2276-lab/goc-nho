/**
 * M1 review-only connectivity of MANUALLY DRAWN floor, proposed doorway,
 * walkway and fixed-contact polygons. Never reads Firebase or certifies doors.
 * Source standing spots are UI anchors, NOT walked avatar trajectories.
 */
import {ROOM_SOURCES,PlacementPreviewError} from "./house-placement-preview.mjs";
import {buildFloorReviewBundle,FLOOR_EVIDENCE_PROTOCOL} from "./house-floor-evidence.mjs";

export const MANUAL_CONNECTIVITY_PROTOCOL="M1_MANUAL_WALKWAY_CONNECTIVITY_UNAPPROVED";
const fail=code=>{throw new PlacementPreviewError(code);};
const orient=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
const EPS=1e-7;
function onSegment(p,a,b){
 return Math.abs(orient(a,b,p))<=EPS&&
  p[0]>=Math.min(a[0],b[0])-EPS&&p[0]<=Math.max(a[0],b[0])+EPS&&
  p[1]>=Math.min(a[1],b[1])-EPS&&p[1]<=Math.max(a[1],b[1])+EPS;
}
export function pointInReviewPolygon(p,poly){
 if(!Array.isArray(poly)||poly.length<3||!Array.isArray(p)||p.length!==2||
    !p.every(Number.isFinite))return false;
 let inside=false;
 for(let i=0,j=poly.length-1;i<poly.length;j=i++){
  const a=poly[j],b=poly[i];
  if(onSegment(p,a,b))return true;
  if((a[1]>p[1])!==(b[1]>p[1])&&
     p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])inside=!inside;
 }
 return inside;
}
function segmentsMeet(a,b,c,d){
 const abC=orient(a,b,c),abD=orient(a,b,d),
       cdA=orient(c,d,a),cdB=orient(c,d,b);
 if((abC>EPS&&abD<-EPS||abC<-EPS&&abD>EPS)&&
    (cdA>EPS&&cdB<-EPS||cdA<-EPS&&cdB>EPS))return true;
 return onSegment(c,a,b)||onSegment(d,a,b)||onSegment(a,c,d)||onSegment(b,c,d);
}
/** Boundary touches are deliberately counted as *possible* connections. */
export function reviewPolygonsMeet(a,b){
 if(!Array.isArray(a)||!Array.isArray(b)||a.length<3||b.length<3)return false;
 if(a.some(p=>pointInReviewPolygon(p,b))||b.some(p=>pointInReviewPolygon(p,a)))return true;
 for(let i=0;i<a.length;i++)for(let j=0;j<b.length;j++){
  if(segmentsMeet(a[i],a[(i+1)%a.length],b[j],b[(j+1)%b.length]))return true;
 }
 return false;
}
function sourceStanding(scene,roomId){
 const sourceKey=ROOM_SOURCES[roomId];
 const source=sourceKey===null?scene?.room:scene?.rooms?.[sourceKey];
 const anchors=sourceKey===null?source?.dung:source?.spots?.dung;
 if(!Array.isArray(anchors)||anchors.length<1||anchors.length>30||
   anchors.some(p=>!Array.isArray(p)||p.length!==2||
     p.some(v=>typeof v!=="number"||!Number.isFinite(v)||v<0||v>1170)))
   fail("UNTRUSTED_SCENE_STANDING_ANCHOR");
 return anchors;
}
function reachableWalkways(walkways,doorways){
 const reached=new Set(),queue=[];
 for(let i=0;i<walkways.length;i++){
  if(doorways.some(d=>reviewPolygonsMeet(walkways[i].vertices,d.vertices))){
   reached.add(i);queue.push(i);
  }
 }
 for(let h=0;h<queue.length;h++){
  const i=queue[h];
  for(let j=0;j<walkways.length;j++){
   if(!reached.has(j)&&reviewPolygonsMeet(walkways[i].vertices,walkways[j].vertices)){
    reached.add(j);queue.push(j);
   }
  }
 }
 return reached;
}
/**
 * Even a candidate connected path has NO clearance guarantee: only polygon
 * adjacency is examined. Alternate furniture states, ramps, elevations,
 * obstacles outside the annotations and actual door hardware are unknown.
 */
export function auditManualWalkwayConnectivity({bundle,scene}){
 if(!bundle||bundle.protocol!==FLOOR_EVIDENCE_PROTOCOL||
    bundle.status!=="UNAPPROVED"||bundle.canPersist!==false||
    !Array.isArray(bundle.annotations))fail("UNTRUSTED_MANUAL_FLOOR_BUNDLE");
 // Revalidate all annotations rather than trusting a supplied 'readiness'.
 const verified=buildFloorReviewBundle(bundle.annotations);
 const results=[];
 for(const roomId of Object.keys(ROOM_SOURCES)){
  const entries=verified.annotations.filter(a=>a.roomId===roomId);
  const byRole=role=>entries.filter(x=>x.role===role);
  const floors=byRole("floor"),walkways=byRole("walkway"),
        doorways=byRole("doorway"),contacts=byRole("fixed_contact");
  const anchors=sourceStanding(scene,roomId);
  const reached=reachableWalkways(walkways,doorways);
  const intersectsContacts=walkways.some(w=>contacts.some(c=>
   reviewPolygonsMeet(w.vertices,c.vertices)));
  const contactsOutsideFloor=contacts.some(c=>!floors.some(f=>
    c.vertices.every(p=>pointInReviewPolygon(p,f.vertices))));
  const standing=anchors.map((p,i)=>{
   const starts=walkways.map((w,j)=>pointInReviewPolygon(p,w.vertices)?j:-1).filter(j=>j>=0);
   const connectedToProposedDoorway=starts.some(j=>reached.has(j));
   return Object.freeze({
    sourceSpotIndex:i,sourcePoint:[...p],
    insideProposedFloor:floors.some(f=>pointInReviewPolygon(p,f.vertices)),
    onProposedWalkway:starts.length>0,
    connectedToProposedDoorway,
    touchesAnnotatedFixedContact:contacts.some(c=>pointInReviewPolygon(p,c.vertices)),
    verifiedAccessible:false,canPersist:false,
    status:"ONLY_PROPOSED_2D_POLYGON_ADJACENCY"
   });
  });
  const readiness=verified.readiness.find(x=>x.roomId===roomId);
  const flags=[];
  if(readiness.missing.length)flags.push("MISSING_REVIEW_POLYGON_ROLES");
  if(readiness.reservesOutsideProposedFloor)flags.push("RESERVED_AREA_OUTSIDE_PROPOSED_FLOOR");
  if(!standing.every(a=>a.insideProposedFloor))flags.push("SOURCE_STANDING_OUTSIDE_PROPOSED_FLOOR");
  if(!standing.every(a=>a.connectedToProposedDoorway))
   flags.push("SOURCE_STANDING_NOT_CONNECTED_TO_DRAWN_DOORWAY");
  if(intersectsContacts)flags.push("WALKWAY_TOUCHES_ANNOTATED_FIXED_CONTACT");
  if(contactsOutsideFloor)flags.push("CONTACT_POSSIBLY_OUTSIDE_PROPOSED_FLOOR");
  // No source room contains a modeled door or human-approved threshold.
  flags.push("NO_MODELED_OR_APPROVED_DOOR_GEOMETRY");
  results.push(Object.freeze({roomId,annotationCount:entries.length,
   proposedWalkwayRegions:walkways.length,proposedDoorwayRegions:doorways.length,
   proposedFixedContacts:contacts.length,
   doorwayConnectedWalkwayRegions:reached.size,
   sourceStanding:standing,
   potentialWalkwayFixedContactTouch:intersectsContacts,
   fixedContactsOutsideProposedFloor:contactsOutsideFloor,
   warnings:Object.freeze(flags),
   physicalAvatarClearanceVerified:false,
   actualDoorGeometryVerified:false,
   actualWalkwayVerified:false,canPersist:false,status:"UNAPPROVED"}));
 }
 return Object.freeze({protocol:MANUAL_CONNECTIVITY_PROTOCOL,
  status:"UNAPPROVED",canPersist:false,approvedDoorways:[],
  avatarClearanceVerified:false,
  rooms:Object.freeze(results)});
}
