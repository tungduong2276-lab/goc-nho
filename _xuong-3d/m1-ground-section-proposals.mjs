/**
 * CI-only M1 evidence: extract actual triangle/height-plane intersection
 * contours from SIX source THREE.js rooms. This is stricter than AABB
 * envelopes but still NOT a certified floor or contact shape.
 */
import {THREE,toPx} from "./lib.js";
import {inspectLivingSource} from "./room.js";
import {inspectRoomSource} from "./rooms2.js";
import {fileDigest,ROOM_IDS} from "./m1-ground-contact-proposals.mjs";
import {sliceTriangleAtHeight,traceSectionSegments} from "./m1-plane-slice-geometry.mjs";
import {createHash} from "node:crypto";
import {readFileSync,writeFileSync,mkdirSync} from "node:fs";

export const SECTION_PROTOCOL="M1_SOURCE_MESH_PLANE_SECTIONS_UNAPPROVED";
export const SECTION_Y=0.08; // world metres above ground y=0; sections can miss short props
export const SECTION_LIMIT=10000; // per candidate; overflow MUST be reported
const sourceNames=Object.freeze({"bep":"bep","phong-anh":"phong_anh","phong-em":"phong_em","goc-sang-tao":"sang_tao",gac:"gac"});
const round=n=>Math.round(n*1e4)/1e4;
function transform(elements,position,i){
 const x=position.getX(i),y=position.getY(i),z=position.getZ(i);
 return [
  elements[0]*x+elements[4]*y+elements[8]*z+elements[12],
  elements[1]*x+elements[5]*y+elements[9]*z+elements[13],
  elements[2]*x+elements[6]*y+elements[10]*z+elements[14]
 ];
}
/** Section a visible source object; an open mesh can create open lines. */
export function sliceSourceObject(object,camera,height=SECTION_Y){
 if(!Number.isFinite(height)||height<0||height>0.5)throw new Error("INVALID_SECTION_HEIGHT");
 object.updateWorldMatrix(true,true);
 const segments=[];
 let meshCount=0,eligibleMeshes=0,trianglesScanned=0,coplanarTriangles=0,overflow=false;
 object.traverse(node=>{
  if(overflow||!node.isMesh||!node.geometry||!node.visible)return;
  if(node.material?.side===THREE.BackSide)return; // inverted toon outline, not physical mesh
  const geometry=node.geometry,position=geometry.getAttribute("position");
  if(!position)return;
  meshCount++;
  const bounds=new THREE.Box3().setFromObject(node);
  if(bounds.isEmpty()||bounds.min.y>height+1e-7||bounds.max.y<height-1e-7)return;
  eligibleMeshes++;
  const index=geometry.getIndex(),triCount=Math.floor((index?.count??position.count)/3);
  const matrix=node.matrixWorld.elements;
  for(let t=0;t<triCount;t++){
   const i0=index?index.getX(3*t):3*t;
   const i1=index?index.getX(3*t+1):3*t+1;
   const i2=index?index.getX(3*t+2):3*t+2;
   const result=sliceTriangleAtHeight(transform(matrix,position,i0),
    transform(matrix,position,i1),transform(matrix,position,i2),height);
   trianglesScanned++;
   if(result.coplanar)coplanarTriangles++;
   if(result.segment)segments.push(result.segment);
   if(segments.length>=SECTION_LIMIT){overflow=true;break;}
  }
 });
 const graph=traceSectionSegments(segments,{maxPaths:1024});
 const warningFlags=[];
 if(overflow||graph.truncated)warningFlags.push("INCOMPLETE_SECTION_LIMIT_REVIEW");
 if(graph.nonManifoldVertices)warningFlags.push("BRANCHING_SECTION_GRAPH_REVIEW");
 if(graph.openPaths)warningFlags.push("OPEN_SECTION_CONTOURS_REVIEW");
 if(coplanarTriangles)warningFlags.push("COPLANAR_TRIANGLES_NOT_FILLED_REVIEW");
 if(!graph.paths.length)warningFlags.push("NO_SECTION_AT_SELECTED_HEIGHT_REVIEW");
 const contours=graph.paths.map(({closed,worldXZ})=>({
  closed,
  worldXZ:worldXZ.map(p=>p.map(round)),
  image1170:worldXZ.map(([x,z])=>toPx(camera,x,0,z).map(round))
 }));
 return {
  sectionYMetres:height,projectionYMetres:0,
  meshesVisited:meshCount,meshesCrossingHeight:eligibleMeshes,
  trianglesScanned,coplanarTriangles,rawSegments:graph.rawSegmentCount,
  distinctSegments:graph.uniqueSegmentCount,
  closedContours:contours.filter(x=>x.closed).length,openContours:graph.openPaths,
  nonManifoldVertices:graph.nonManifoldVertices,limitReached:overflow||graph.truncated,
  warningFlags,contours,
  sectionStatus:"REQUIRES_PHYSICAL_VISUAL_REVIEW",
  contactVerified:false,canPersist:false
 };
}
function record({id,kind,object},camera){
 return {id,kind,...sliceSourceObject(object,camera)};
}
function itemRecords(descriptor){
 const {camera,items}=descriptor;
 if(Array.isArray(items))return items.map(x=>({
  itemId:x.itemId,state:x.state,layerId:x.layerId,
  ...sliceSourceObject(x.object,camera)
 }));
 const result=[];
 for(const [itemId,states]of Object.entries(items))for(const [state,object]of Object.entries(states)){
  object.visible=true;
  try{result.push({itemId,state,layerId:itemId+"_"+state,
   ...sliceSourceObject(object,camera)});}
  finally{object.visible=false;}
 }
 return result;
}
function algorithmDigest(){
 const hash=createHash("sha256");
 for(const f of ["_xuong-3d/m1-ground-section-proposals.mjs","_xuong-3d/m1-plane-slice-geometry.mjs"]){
  hash.update(f);hash.update(readFileSync(f));
 }
 return hash.digest("hex");
}
export function buildSectionAudit(){
 const rooms=ROOM_IDS.map(roomId=>{
  const living=roomId==="phong-khach";
  const desc=living?inspectLivingSource():inspectRoomSource(sourceNames[roomId]);
  const itemStates=itemRecords(desc);
  const bakedComponents=desc.backgrounds.map(b=>record(b,desc.camera));
  return {roomId,sourceGenerator:living?"room.js":"rooms2.js",
   stateCoverage:living?"LIVING_DEFAULT_STATES_ONLY":"ALL_SOURCE_ITEM_STATES",
   worldShellRect:[-desc.n/2,-desc.d/2,desc.n/2,desc.d/2],
   itemStates,bakedComponents,floorApproval:"UNAPPROVED",
   doorwayStatus:"UNKNOWN",walkwayStatus:"UNKNOWN",canPersist:false};
 });
 return {protocol:SECTION_PROTOCOL,sourceSha256:fileDigest(),algorithmSha256:algorithmDigest(),
  yMetres:SECTION_Y,rooms,approvedFloorPolygons:null,reviewStatus:"UNAPPROVED",
  contactVerified:false,canPersist:false};
}
function svgEscape(v){return String(v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/"/g,"&quot;");}
function renderRoomSvg(room){
 const lines=['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1170 1170">',
 '<rect width="1170" height="1170" fill="#faf8fc"/>',
 '<text x="18" y="40" font-size="22" fill="#542a56">M1 — UNAPPROVED 3D plane-section evidence</text>'];
 for(const candidate of [...room.bakedComponents.map(v=>({...v,sourceKind:"baked"})),
  ...room.itemStates.map(v=>({...v,sourceKind:"interactive"}))]){
  const color=candidate.kind==="FLOOR_FINISH_NOT_BLOCKER"?"#adb1b8":
   candidate.kind==="FLOOR_COVERING_NOT_BLOCKER"?"#90a3aa":
   candidate.sourceKind==="interactive"?"#2384d1":"#b4455c";
  for(const contour of candidate.contours){
   if(contour.image1170.length<2)continue;
   const points=contour.image1170.map(p=>p.join(",")).join(" ");
   lines.push('<polyline points="'+points+'" fill="none" stroke="'+color+
    '" stroke-width="2" stroke-opacity=".8"/>');
  }
 }
 lines.push('<text x="20" y="1142" font-size="19" fill="#542a56">'+svgEscape(room.roomId)+
  ' — floor, doors, and all contacts NOT APPROVED</text>','</svg>');
 return lines.join("\n");
}
if(process.argv[1]?.endsWith("m1-ground-section-proposals.mjs")){
 const audit=buildSectionAudit(),dir="review-artifacts/house-mesh-sections";
 mkdirSync(dir,{recursive:true});
 writeFileSync(dir+"/source-mesh-plane-sections.json",JSON.stringify(audit,null,2));
 for(const room of audit.rooms)writeFileSync(dir+"/"+room.roomId+"-sections.svg",renderRoomSvg(room));
 const counts=audit.rooms.reduce((a,r)=>{a.items+=r.itemStates.length;a.baked+=r.bakedComponents.length;
  a.lines+=[...r.itemStates,...r.bakedComponents].reduce((s,v)=>s+v.distinctSegments,0);
  a.truncated+=[...r.itemStates,...r.bakedComponents].filter(v=>v.limitReached).length;return a;
 },{items:0,baked:0,lines:0,truncated:0});
 console.log("M1 source plane section evidence: "+JSON.stringify({rooms:audit.rooms.length,...counts}));
 if(audit.rooms.length!==6||counts.items!==42||counts.baked!==199||counts.lines<20)
  process.exitCode=1;
}
