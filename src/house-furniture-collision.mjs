/**
 * Synthetic 2D occupied-footprint guard for the isolated M1 preview.
 * IMPORTANT: no meshes for baked-in 3D furniture. Passing these checks is NOT
 * permission to deploy, persist or claim visual floor clearance.
 */
import { PlacementPreviewError, ROOM_SOURCES } from "./house-placement-preview.mjs";
export const FURNITURE_FOOTPRINTS = Object.freeze({
  chair: Object.freeze({width:80,height:70}),
  table: Object.freeze({width:130,height:90}),
  lamp: Object.freeze({width:50,height:50}),
  plant: Object.freeze({width:70,height:70}),
  rug: Object.freeze({width:120,height:90}),
});
export const COLLISION_PROTOCOL = "LOCAL_GEOMETRY_ONLY_UNAPPROVED";
const WALL_INSET=24;
const CHARACTER_RADIUS=52;
const CLEARANCE=12;
const fail=code=>{throw new PlacementPreviewError(code);};
const finite=n=>typeof n==="number"&&Number.isFinite(n);
const rotationOK=n=>[0,90,180,270].includes(n);

export function itemFootprint(type, rotation=0) {
  const p=FURNITURE_FOOTPRINTS[type];
  if(!p) fail("UNKNOWN_ASSET");
  if(!rotationOK(rotation)) fail("INVALID_ROTATION");
  return rotation%180 ? {width:p.height,height:p.width} : {width:p.width,height:p.height};
}
function rectangle(x,y,footprint) {
  return {left:x-footprint.width/2,right:x+footprint.width/2,
    top:y-footprint.height/2,bottom:y+footprint.height/2};
}
function overlap(a,b) {
  return a.left < b.right+CLEARANCE &&
    a.right+CLEARANCE > b.left &&
    a.top < b.bottom+CLEARANCE &&
    a.bottom+CLEARANCE > b.top;
}
function circleRectDistance(anchor,rect) {
  const nearestX=Math.max(rect.left,Math.min(anchor[0],rect.right));
  const nearestY=Math.max(rect.top,Math.min(anchor[1],rect.bottom));
  return Math.hypot(anchor[0]-nearestX,anchor[1]-nearestY);
}
function roomSource(scene,roomId) {
  if(!Object.hasOwn(ROOM_SOURCES,roomId)) fail("UNKNOWN_ROOM");
  const id=ROOM_SOURCES[roomId];
  const source=id===null?scene?.room:scene?.rooms?.[id];
  const anchors=id===null?source?.dung:source?.spots?.dung;
  if(!Array.isArray(source?.size)||source.size.length!==2||
    !source.size.every(n=>Number.isInteger(n)&&n>0) ||
    !Array.isArray(anchors)||!anchors.every(a=>Array.isArray(a)&&a.length===2&&a.every(finite)))
    fail("INVALID_SCENE_ANCHORS");
  return {size:source.size,anchors};
}
/** Rejects unknown slots, unsafe geometry and intersection with simulated items. */
export function assertFurnitureFits(scene,draft,action) {
  if(!draft||draft.protocol!=="LOCAL_PREVIEW_ONLY"||draft.canPersist!==false||
    !Array.isArray(draft.slots)||!Array.isArray(draft.items)) fail("INVALID_DRAFT");
  if(!action || !["place","move","rotate"].includes(action.kind)) fail("INVALID_ACTION");
  const current=action.kind==="place"?null:draft.items.find(i=>i.id===action.id);
  if(action.kind!=="place"&&!current) fail("UNKNOWN_ITEM");
  const roomId=action.kind==="place"?action.roomId:current.roomId;
  const slotId=action.kind==="place"?action.slotId:action.kind==="move"?action.slotId:current.slotId;
  const slot=draft.slots.find(s=>s.roomId===roomId&&s.id===slotId);
  if(!slot) fail("UNKNOWN_SLOT");
  // Candidate points are synthetic and never an authorization for persistence.
  if(!["PROPOSED_NOT_APPROVED","VISUAL_APPROVAL_REQUIRED"].includes(slot.status)) fail("INVALID_SLOT_STATUS");
  if(!finite(slot.x)||!finite(slot.y)) fail("INVALID_SLOT");
  const type=action.kind==="place"?action.assetType:current.assetType;
  const rotation=action.kind==="rotate"?action.rotation:action.kind==="place"?(action.rotation??0):current.rotation;
  const rect=rectangle(slot.x,slot.y,itemFootprint(type,rotation));
  const {size,anchors}=roomSource(scene,roomId);
  if(rect.left<WALL_INSET||rect.top<WALL_INSET||
    rect.right>size[0]-WALL_INSET||rect.bottom>size[1]-WALL_INSET) fail("FOOTPRINT_OUT_OF_BOUNDS");
  if(anchors.some(p=>circleRectDistance(p,rect)<CHARACTER_RADIUS+CLEARANCE)) fail("CHARACTER_COLLISION");
  for(const item of draft.items) {
    if(item.id===current?.id||item.roomId!==roomId) continue;
    const other=rectangle(item.x,item.y,itemFootprint(item.assetType,item.rotation));
    if(overlap(rect,other)) fail("FURNITURE_COLLISION");
  }
  return Object.freeze({protocol:COLLISION_PROTOCOL,roomId,slotId,rect:Object.freeze(rect)});
}
