/** Read-only candidate navigation from original six Three.js source scenes. */
import {buildMeshAudit,ROOM_IDS} from "../_xuong-3d/m1-ground-contact-proposals.mjs";
import {inspectLivingSource} from "../_xuong-3d/room.js";
import {inspectRoomSource} from "../_xuong-3d/rooms2.js";
import {computeSourceRouteCandidates} from "./house-open-edge-route-candidates.mjs";
import {readFileSync,writeFileSync,mkdirSync} from "node:fs";
const sourceNames={"bep":"bep","phong-anh":"phong_anh","phong-em":"phong_em","goc-sang-tao":"sang_tao",gac:"gac"};
export const ROUTE_AUDIT_PROTOCOL="M1_SIX_ROOM_SOURCE_ROUTE_PROPOSALS_UNAPPROVED";
function sourceStanding(id){
 const desc=id==="phong-khach"?inspectLivingSource():inspectRoomSource(sourceNames[id]);
 return desc.standingXZ??[];
}
function solidCandidates(room){
 // Candidate-only; conservatively treat every other near-floor baked component
 // as possibly blocking. Do not treat rug/finishes as certified free floor.
 const solid=room.bakedComponents.filter(c=>
   c.worldRect&&c.kind!=="FLOOR_FINISH_NOT_BLOCKER"&&c.kind!=="FLOOR_COVERING_NOT_BLOCKER"&&c.kind!=="WALL_OR_RAISED_DECOR");
 const interactive=room.itemStates.filter(c=>c.worldRect);
 return {rects:[...solid,...interactive].map(c=>c.worldRect),solidCount:solid.length,
  interactiveStateCount:interactive.length};
}
export function buildSixRoomSourceRouteAudit(){
 const meshes=buildMeshAudit();
 const rooms=meshes.rooms.map(room=>{
  const standing=sourceStanding(room.roomId);
  const candidates=solidCandidates(room);
  const graph=computeSourceRouteCandidates({
   shellRect:room.worldFloorRect,obstacles:candidates.rects,standing,
   step:0.25,clearance:0.3
  });
  return {
   roomId:room.roomId,sourceStanding:standing,
   candidateUnclassifiedBakedObstacles:candidates.solidCount,
   candidateInteractiveStateObstacles:candidates.interactiveStateCount,
   ...graph,sourceObstacles:candidates.rects,allObjectStatesConservativelyUnioned:true,
   doorGeometryPresent:false,verifiedDoorways:[],walkwayVerified:false,canPersist:false
  };
 });
 return {protocol:ROUTE_AUDIT_PROTOCOL,sourceSha256:meshes.sourceSha256,rooms,
  summary:"Only X+ and Z+ edges lack shell walls. They are NOT designed entrances; no door modeled.",
  doorwayStatus:"NOT_AUTHENTICATED",routeStatus:"UNAPPROVED",
  approvedRoutes:[],canPersist:false};
}
function drawSvg(room){
 const [x0,z0,x1,z1]=room.worldShellRect,size=880;
 const sx=x=>80+(x-x0)/(x1-x0)*size,sz=z=>80+(z-z0)/(z1-z0)*size;
 const el=['<svg xmlns="http://www.w3.org/2000/svg" width="1040" height="1110" viewBox="0 0 1040 1110">',
 '<rect width="1040" height="1110" fill="#faf8fa"/>',
 '<text x="36" y="40" font-size="25">M1 source-open-side route candidates — NOT APPROVED</text>',
 '<rect x="80" y="80" width="880" height="880" fill="#edf0f0" stroke="#b7a9bd"/>'];
 // xMin and zMin walls; positive edges are source-open, not doors.
 el.push('<line x1="80" y1="80" x2="80" y2="960" stroke="#603654" stroke-width="10"/>');
 el.push('<line x1="80" y1="80" x2="960" y2="80" stroke="#603654" stroke-width="10"/>');
 el.push('<line x1="960" y1="80" x2="960" y2="960" stroke="#ca9413" stroke-width="6" stroke-dasharray="18 12"/>');
 el.push('<line x1="80" y1="960" x2="960" y2="960" stroke="#ca9413" stroke-width="6" stroke-dasharray="18 12"/>');
 for(const r of room.sourceObstacles){
  el.push('<rect x="'+sx(r[0])+'" y="'+sz(r[1])+'" width="'+(sx(r[2])-sx(r[0]))+
   '" height="'+(sz(r[3])-sz(r[1]))+'" fill="#c85b6d" fill-opacity=".22"/>');
 }
 for(const route of room.routes){
  for(const p of route.paths||[]){
   if(!p.found)continue;
   const pts=p.worldXZ.map(([x,z])=>sx(x).toFixed(1)+","+sz(z).toFixed(1)).join(" ");
   el.push('<polyline points="'+pts+'" fill="none" stroke="#287e7e" stroke-width="4" stroke-opacity=".8"/>');
  }
  el.push('<circle cx="'+sx(route.sourceSpot[0])+'" cy="'+sz(route.sourceSpot[1])+
   '" r="9" fill="#3850ab"/>');
 }
 el.push('<text x="30" y="1020" font-size="20">Orange dashed: no source wall — NOT verified door</text>');
 el.push('<text x="30" y="1054" font-size="20">Blue dots: actual source standing spots; teal: possible paths</text>');
 el.push('<text x="30" y="1085" font-size="20">Red: inflated UNKNOWN furniture envelopes — review only</text>','</svg>');
 return el.join("\n");
}
if(process.argv[1]?.endsWith("house-open-edge-route-audit.mjs")){
 const output=buildSixRoomSourceRouteAudit(),dir="review-artifacts/house-routes";
 mkdirSync(dir,{recursive:true});
 const publicAudit={...output,rooms:output.rooms.map(({sourceObstacles,...rest})=>rest)};
 writeFileSync(dir+"/six-room-open-edge-candidates.json",JSON.stringify(publicAudit,null,2));
 for(const room of output.rooms)writeFileSync(dir+"/"+room.roomId+"-source-open-edges.svg",drawSvg(room));
 const total=output.rooms.reduce((a,r)=>a+r.routes.length,0);
 console.log("M1 open-side route candidates:",output.rooms.length,"rooms,",total,"source standing spots");
 if(output.rooms.length!==6||total<10||output.rooms.some(r=>r.canPersist!==false))process.exitCode=1;
}
