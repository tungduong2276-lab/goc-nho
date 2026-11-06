/**
 * Experimental five-room source mesh audit.
 * World X/Z contact proposals from meshes near y=0, projected using the
 * ACTUAL source camera. NOT a physics engine, approved collider or Firebase data.
 */
import {THREE,toPx} from "./lib.js";
import {ROOM_IDS,inspectRoomSource} from "./rooms2.js";
import {createHash} from "node:crypto";
import {readFileSync,writeFileSync,mkdirSync} from "node:fs";

export const PROTOCOL="M1_3D_MESH_CONTACT_CANDIDATE_UNAPPROVED";
const GROUND_Y=0.14; // source metres, deliberately permissive
const ROUND=n=>Math.round(n*1000)/1000;
const rootFiles=["_xuong-3d/rooms2.js","_xuong-3d/furn.js","_xuong-3d/lib.js","_xuong-3d/bedroom-spacious-pilot.js","_xuong-3d/spacious-layout.js"];
function fileDigest(){
 const h=createHash("sha256");
 for(const file of rootFiles){h.update(file);h.update(readFileSync(file));}
 return h.digest("hex");
}
function sourceContact(item,camera){
 item.updateWorldMatrix(true,true);
 const ground=[];
 let meshCount=0;
 item.traverse(node=>{
  if(!node.isMesh||!node.geometry||!node.visible)return;
  if(node.material?.side===THREE.BackSide)return; // skip inverted outlines
  const bounds=new THREE.Box3().setFromObject(node);
  meshCount++;
  if(!bounds.isEmpty()&&Number.isFinite(bounds.min.y)&&
     bounds.min.y<=GROUND_Y&&bounds.max.y>=-0.02&&
     bounds.max.x>bounds.min.x&&bounds.max.z>bounds.min.z)
    ground.push(bounds);
 });
 if(ground.length===0)return {meshCount,nearFloorMeshes:0,worldRect:null,imagePolygon:null};
 const b=ground.reduce((acc,box)=>acc.union(box),new THREE.Box3());
 const rect=[b.min.x,b.min.z,b.max.x,b.max.z].map(ROUND);
 const [x0,z0,x1,z1]=rect;
 const corners=[[x0,z0],[x1,z0],[x1,z1],[x0,z1]];
 const polygon=corners.map(([x,z])=>toPx(camera,x,0,z).map(ROUND));
 return {meshCount,nearFloorMeshes:ground.length,worldRect:rect,imagePolygon:polygon};
}
export function buildMeshAudit(){
 const rooms=[];
 for(const id of ROOM_IDS){
  if(!["bep","phong_anh","phong_em","sang_tao","gac"].includes(id))continue;
  const {source,camera,n,d,items}=inspectRoomSource(id);
  const states=[];
  for(const [itemId,alternatives] of Object.entries(items)){
   for(const [state,item] of Object.entries(alternatives)){
    // Render source intentionally hides states; enable only the inspected
    // object when walking its own geometry without altering live app state.
    item.visible=true;
    const footprint=sourceContact(item,camera);
    item.visible=false;
    states.push({itemId,state,layerId:itemId+"_"+state,...footprint,
      evidence:"MESH_AABB_NEAR_GROUND_ONLY",contactVerified:false,canPersist:false});
   }
  }
  rooms.push({roomId:id,worldFloorRect:[-n/2,-d/2,n/2,d/2],
   floorStatus:"SOURCE_SHELL_RECT_NOT_APPROVED",doorwayStatus:"UNKNOWN",
   walkwayStatus:"UNKNOWN",itemStates:states,canPersist:false});
 }
 return {protocol:PROTOCOL,sourceSha256:fileDigest(),coordinateSpace:"world_metres_XZ_and_image_1170px",
  groundThresholdMetres:GROUND_Y,rooms,reviewStatus:"EXPERIMENTAL_ONLY",
  approvedFloorPolygons:null,canPersist:false};
}
if(process.argv[1]?.endsWith("m1-ground-contact-proposals.mjs")){
 const out=buildMeshAudit();
 mkdirSync("review-artifacts/house-mesh-contact",{recursive:true});
 writeFileSync("review-artifacts/house-mesh-contact/source-ground-contact-proposals.json",JSON.stringify(out,null,2));
 const count=out.rooms.reduce((n,r)=>n+r.itemStates.length,0);
 console.log("M1 unapproved mesh candidates: "+out.rooms.length+" rooms, "+count+" item states");
 if(out.rooms.length!==5||count<20||out.rooms.some(r=>r.itemStates.length===0))process.exitCode=1;
}
