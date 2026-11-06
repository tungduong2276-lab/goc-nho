/**
 * M1 experimental source-mesh audit for all six House rooms, including
 * interactive furniture and baked background/decor components.
 * World-X/Z mesh envelopes are not physical colliders or approved floor masks.
 */
import {THREE,toPx} from "./lib.js";
import {inspectRoomSource} from "./rooms2.js";
import {inspectLivingSource} from "./room.js";
import {createHash} from "node:crypto";
import {readFileSync,writeFileSync,mkdirSync} from "node:fs";

export const PROTOCOL="M1_3D_MESH_CONTACT_CANDIDATE_UNAPPROVED";
export const ROOM_IDS=Object.freeze(["phong-khach","bep","phong-anh","phong-em","goc-sang-tao","gac"]);
const ROOMS2=Object.freeze({"bep":"bep","phong-anh":"phong_anh","phong-em":"phong_em","goc-sang-tao":"sang_tao",gac:"gac"});
export const GROUND_Y=0.14;
const ROUND=n=>Math.round(n*1000)/1000;
const files=["_xuong-3d/room.js","_xuong-3d/rooms2.js","_xuong-3d/furn.js",
 "_xuong-3d/lib.js","_xuong-3d/bedroom-spacious-pilot.js","_xuong-3d/spacious-layout.js"];
export function fileDigest(){
 const hash=createHash("sha256");
 for(const file of files){hash.update(file);hash.update(readFileSync(file));}
 return hash.digest("hex");
}
function sourceContact(object,camera){
 object.updateWorldMatrix(true,true);
 let meshCount=0;
 const ground=[];
 object.traverse(node=>{
  if(!node.isMesh||!node.geometry||!node.visible)return;
  if(node.material?.side===THREE.BackSide)return;
  const bounds=new THREE.Box3().setFromObject(node);
  meshCount++;
  if(!bounds.isEmpty()&&Number.isFinite(bounds.min.y)&&
    bounds.min.y<=GROUND_Y&&bounds.max.y>=-0.02&&
    bounds.max.x>bounds.min.x&&bounds.max.z>bounds.min.z)
    ground.push(bounds);
 });
 if(!ground.length)return {meshCount,nearFloorMeshes:0,worldRect:null,imagePolygon:null};
 const union=ground.reduce((acc,part)=>acc.union(part),new THREE.Box3());
 const rect=[union.min.x,union.min.z,union.max.x,union.max.z].map(ROUND);
 const [x0,z0,x1,z1]=rect;
 const corners=[[x0,z0],[x1,z0],[x1,z1],[x0,z1]];
 return {meshCount,nearFloorMeshes:ground.length,worldRect:rect,
  imagePolygon:corners.map(([x,z])=>toPx(camera,x,0,z).map(ROUND))};
}
/** Conservative diagnostic flags; no flag (or flag removal) means a clear floor. */
export function reviewRectFlags(worldRect,shell){
 if(!worldRect)return [];
 const [left,back,right,front]=worldRect;
 const [floorLeft,floorBack,floorRight,floorFront]=shell;
 const flags=[];
 if(left<floorLeft-0.01||back<floorBack-0.01||
    right>floorRight+0.01||front>floorFront+0.01)
  flags.push("EXTENDS_BEYOND_SOURCE_SHELL_REVIEW");
 if((right-left)*(front-back)>3)
  flags.push("BROAD_WORLD_ENVELOPE_REVIEW");
 return flags;
}
function reviewCandidate({id,kind,object},camera){
 // Explicitly preserve the distinction between decorative floor finishes,
 // unknown source props, and wall elements; none is a verified blocker.
 return {id,kind,...sourceContact(object,camera),
  physicalContactVerified:false,blocksWalkwayVerified:false,canPersist:false,
  review:"WORLD_MESH_AABB_NEAR_GROUND_ONLY"};
}
function interactiveCandidates(descriptor){
 const {camera,items}=descriptor;
 if(Array.isArray(items)){
  return items.map(({itemId,state,layerId,object})=>({
   itemId,state,layerId,...sourceContact(object,camera),
   evidence:"MESH_AABB_NEAR_GROUND_ONLY",contactVerified:false,canPersist:false
  }));
 }
 const states=[];
 for(const [itemId,alternatives] of Object.entries(items))
  for(const [state,object] of Object.entries(alternatives)){
   object.visible=true;
   try{
    states.push({itemId,state,layerId:itemId+"_"+state,
     ...sourceContact(object,camera),
     evidence:"MESH_AABB_NEAR_GROUND_ONLY",contactVerified:false,canPersist:false});
   }finally{object.visible=false;}
  }
 return states;
}
export function buildMeshAudit(){
 const rooms=[];
 for(const roomId of ROOM_IDS){
  const living=roomId==="phong-khach";
  const desc=living?inspectLivingSource():inspectRoomSource(ROOMS2[roomId]);
  const {camera,n,d}=desc;
  const floor=[-n/2,-d/2,n/2,d/2];
  const attachFlags=candidate=>({...candidate,
    warningFlags:reviewRectFlags(candidate.worldRect,floor)});
  const itemStates=interactiveCandidates(desc).map(attachFlags);
  const bakedComponents=desc.backgrounds.map(({id,kind,object})=>
   attachFlags(reviewCandidate({id,kind,object},camera)));
  rooms.push({
   roomId,sourceGenerator:living?"room.js":"rooms2.js",
   interactiveStateCoverage:living?"LIVING_DEFAULT_STATES_ONLY":"ALL_SOURCE_ITEM_STATES",
   worldFloorRect:floor,
   floorStatus:"SOURCE_SHELL_RECT_NOT_APPROVED",
   doorwayStatus:"UNKNOWN",walkwayStatus:"UNKNOWN",
   itemStates,bakedComponents,canPersist:false
  });
 }
 return {protocol:PROTOCOL,sourceSha256:fileDigest(),
  coordinateSpace:"world_metres_XZ_and_image_1170px",
  groundThresholdMetres:GROUND_Y,rooms,
  reviewStatus:"EXPERIMENTAL_ONLY",approvedFloorPolygons:null,canPersist:false};
}
function writeReview(){
 const audit=buildMeshAudit();
 mkdirSync("review-artifacts/house-mesh-contact",{recursive:true});
 writeFileSync("review-artifacts/house-mesh-contact/source-ground-contact-proposals.json",
  JSON.stringify(audit,null,2));
 const n=audit.rooms.reduce((a,r)=>a+r.itemStates.length,0);
 const bg=audit.rooms.reduce((a,r)=>a+r.bakedComponents.length,0);
 console.log("M1 unapproved mesh candidates: "+audit.rooms.length+" rooms, "+n+
  " interactive states, "+bg+" baked components");
 if(audit.rooms.length!==6||n<35||bg<25||audit.rooms.some(r=>!r.bakedComponents.length))
  process.exitCode=1;
}
if(process.argv[1]?.endsWith("m1-ground-contact-proposals.mjs"))writeReview();
