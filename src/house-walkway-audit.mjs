/**
 * M1 review only — scene-derived anchor-to-anchor walk lines. These lines
 * are NOT real character navmeshes, door thresholds, or verified free floor.
 * A report may be BLOCKED_BY_ESTIMATE or UNVERIFIED, never approved.
 * No Firebase or persistence.
 */
import { ROOM_SOURCES, PlacementPreviewError } from "./house-placement-preview.mjs";
import { ROOM_OBSTACLE_ATLAS } from "./house-obstacle-atlas.mjs";

export const WALK_REVIEW_PROTOCOL = "LOCAL_WALKWAY_AUDIT_NO_APPROVAL";
export const WALK_LANE_RADIUS_PX = 32;
const fail=code=>{throw new PlacementPreviewError(code);};
const isPoint=p=>Array.isArray(p)&&p.length===2&&p.every(n=>typeof n==="number"&&Number.isFinite(n)&&n>=0&&n<=1170);
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1];
function pointSegmentDistance(p,a,b){
  const d=[b[0]-a[0],b[1]-a[1]], len=dot(d,d);
  const t=len===0?0:Math.max(0,Math.min(1,dot([p[0]-a[0],p[1]-a[1]],d)/len));
  return distance(p,[a[0]+t*d[0],a[1]+t*d[1]]);
}
const cross=(p,q,r)=>(q[0]-p[0])*(r[1]-p[1])-(q[1]-p[1])*(r[0]-p[0]);
function onSegment(p,a,b){
  return Math.abs(cross(a,b,p))<1e-7&&
    p[0]>=Math.min(a[0],b[0])-1e-7&&p[0]<=Math.max(a[0],b[0])+1e-7&&
    p[1]>=Math.min(a[1],b[1])-1e-7&&p[1]<=Math.max(a[1],b[1])+1e-7;
}
function intersects(a,b,c,d) {
  const o1=cross(a,b,c),o2=cross(a,b,d),o3=cross(c,d,a),o4=cross(c,d,b);
  if(((o1>0&&o2<0)||(o1<0&&o2>0))&&((o3>0&&o4<0)||(o3<0&&o4>0)))return true;
  return onSegment(c,a,b)||onSegment(d,a,b)||onSegment(a,c,d)||onSegment(b,c,d);
}
function pointInPolygon(p,polygon){
  let inside=false;
  for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
    const a=polygon[i],b=polygon[j];
    if(onSegment(p,a,b))return true;
    if((a[1]>p[1])!==(b[1]>p[1]) &&
      p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])inside=!inside;
  }
  return inside;
}
/** Swept line against polygon including collinear/tangential contacts. */
export function corridorTouchesPolygon(a,b,poly,radius=WALK_LANE_RADIUS_PX){
  if(!isPoint(a)||!isPoint(b)||distance(a,b)<1||
    !Array.isArray(poly)||poly.length<3||!poly.every(isPoint)||
    typeof radius!=="number"||!Number.isFinite(radius)||radius<0)fail("INVALID_WALK_GEOMETRY");
  if(pointInPolygon(a,poly)||pointInPolygon(b,poly))return true;
  for(let i=0;i<poly.length;i++){
    const c=poly[i],d=poly[(i+1)%poly.length];
    if(intersects(a,b,c,d))return true;
    if(Math.min(pointSegmentDistance(a,c,d),pointSegmentDistance(b,c,d),
      pointSegmentDistance(c,a,b),pointSegmentDistance(d,a,b))<=radius)return true;
  }
  return false;
}
export function reviewRoomWalkway(scene,roomId,atlas=ROOM_OBSTACLE_ATLAS){
  if(!Object.hasOwn(ROOM_SOURCES,roomId))fail("UNKNOWN_ROOM");
  const sourceId=ROOM_SOURCES[roomId];
  const source=sourceId===null?scene?.room:scene?.rooms?.[sourceId];
  const standing=sourceId===null?source?.dung:source?.spots?.dung;
  const size=source?.size;
  if(!Array.isArray(size)||size.length!==2||size[0]!==1170||size[1]!==1170||
    !Array.isArray(standing)||standing.length<2||!standing.slice(0,2).every(isPoint)||
    distance(standing[0],standing[1])<1)fail("INVALID_SCENE_WALK_ANCHORS");
  const props=atlas?.[roomId];
  if(!Array.isArray(props)||props.length<1||
    props.some(p=>!p||p.approved!==false||typeof p.id!=="string"||
      !Array.isArray(p.polygon)||p.polygon.length<3||!p.polygon.every(isPoint)))fail("INVALID_OBSTACLE_ATLAS");
  const path=Object.freeze(standing.slice(0,2).map(p=>Object.freeze([...p])));
  const blockingIds=Object.freeze(props.filter(p=>corridorTouchesPolygon(path[0],path[1],p.polygon))
    .map(p=>p.id));
  // Image geometry alone does not define door thresholds or walkable floor.
  return Object.freeze({
    protocol:WALK_REVIEW_PROTOCOL,roomId,
    sourcePath:sourceId===null?"scene.room.dung":"scene.rooms."+sourceId+".spots.dung",
    path,clearanceRadiusPx:WALK_LANE_RADIUS_PX,blockingIds,
    corridorAssessment:blockingIds.length?"BLOCKED_BY_UNAPPROVED_ESTIMATE":"NO_ESTIMATED_BLOCKER_DETECTED",
    doorway:null,doorwayStatus:"UNTRACED",floorPolygon:null,floorStatus:"UNTRACED",
    status:"UNVERIFIED",canPersist:false,approved:false,
  });
}
export function reviewSixRoomWalkways(scene,atlas=ROOM_OBSTACLE_ATLAS) {
  return Object.freeze(Object.fromEntries(
    Object.keys(ROOM_SOURCES).map(room=>[room,reviewRoomWalkway(scene,room,atlas)])
  ));
}
/** Fail closed: provisional routes may be visualized, never published as true navigation. */
export function assertWalkwayApproved(report){
  if(!report||report.protocol!==WALK_REVIEW_PROTOCOL||report.approved!==true||
    report.doorwayStatus!=="VERIFIED"||report.floorStatus!=="VERIFIED"||
    report.canPersist!==true)fail("WALKWAY_NOT_APPROVED");
  // Do not grant persistence even if a caller forges fields.
  fail("WALKWAY_NOT_APPROVED");
}
