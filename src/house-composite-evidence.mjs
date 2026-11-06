/**
 * M1 visual-only inventory of actual composited room layer bounds from scene.json.
 * Source boxes describe image sprites, NOT their opaque pixels, floor contacts
 * or physical collision meshes. No inferred door/floor/navmesh or approval.
 */
import {ROOM_SOURCES,PlacementPreviewError} from "./house-placement-preview.mjs";
import {ROOM_OBSTACLE_ATLAS} from "./house-obstacle-atlas.mjs";
export const COMPOSITE_REVIEW_PROTOCOL="COMPOSITED_IMAGE_BOUNDS_UNAPPROVED";
const reject=code=>{throw new PlacementPreviewError(code);};
const validBox=(box,size)=>Array.isArray(box)&&box.length===4&&
 box.every(n=>typeof n==="number"&&Number.isFinite(n))&&
 box[0]>=0&&box[1]>=0&&box[2]>box[0]&&box[3]>box[1]&&
 box[2]<=size[0]&&box[3]<=size[1];
function area(box){return (box[2]-box[0])*(box[3]-box[1]);}
function intersect(a,b){
 const w=Math.max(0,Math.min(a[2],b[2])-Math.max(a[0],b[0]));
 const h=Math.max(0,Math.min(a[3],b[3])-Math.max(a[1],b[1]));
 return w*h;
}
function bbox(points){
 return [Math.min(...points.map(p=>p[0])),Math.min(...points.map(p=>p[1])),
   Math.max(...points.map(p=>p[0])),Math.max(...points.map(p=>p[1]))];
}
export function auditCompositedRoom(scene,roomId,atlas=ROOM_OBSTACLE_ATLAS){
 if(!Object.hasOwn(ROOM_SOURCES,roomId))reject("UNKNOWN_ROOM");
 const key=ROOM_SOURCES[roomId],source=key===null?scene?.room:scene?.rooms?.[key];
 if(!Array.isArray(source?.size)||source.size.length!==2||
   source.size.some(n=>!Number.isInteger(n)||n!==1170)||!source.layers||
   typeof source.layers!=="object")reject("INVALID_COMPOSITE_SCENE");
 const entries=Object.entries(source.layers);
 if(entries.length===0||entries.some(([,v])=>!validBox(v,source.size)))
   reject("INVALID_LAYER_BOUNDS");
 const groups=[];
 if(key!==null){
   for(const [itemId,item] of Object.entries(source.items||{})){
     if(!Array.isArray(item.st)||!item.st.length||
        item.st.some(state=>typeof state!=="string"||
         !Object.hasOwn(source.layers,itemId+"_"+state)))reject("MISSING_LAYER_STATE");
     groups.push({itemId,states:[...item.st]});
   }
 }
 const obstacles=atlas?.[roomId];
 if(!Array.isArray(obstacles)||obstacles.some(o=>o.approved!==false||
   !Array.isArray(o.polygon)||o.polygon.length<3))reject("INVALID_OBSTACLE_ATLAS");
 const layers=entries.map(([layerId,coordinates])=>Object.freeze({
   layerId,box:Object.freeze([...coordinates]),status:"RENDERED_SPRITE_EXTENT_NOT_COLLIDER",
 }));
 const candidates=obstacles.map(o=>{
   const b=bbox(o.polygon);
   if(!validBox(b,source.size))reject("INVALID_OBSTACLE_ATLAS");
   const overlaps=layers.filter(l=>intersect(l.box,b)>0)
     .map(l=>({layerId:l.layerId,overlapPx2:intersect(l.box,b),
       overlapFraction:Number((intersect(l.box,b)/area(b)).toFixed(3))}));
   return Object.freeze({id:o.id,label:o.label,approved:false,
     estimatedBox:Object.freeze(b),layersIntersectingEstimate:Object.freeze(overlaps),
     matchingLayerNotGuaranteed:true});
 });
 return Object.freeze({
   protocol:COMPOSITE_REVIEW_PROTOCOL,roomId,sourcePath:key===null?"scene.room":"scene.rooms."+key,
   imageSize:Object.freeze([...source.size]),
   layers:Object.freeze(layers),groups:Object.freeze(groups),
   obstacles:Object.freeze(candidates),imageBackdropOnly:false,
   floorPolygon:null,doorwayPolygons:null,wallCollisionMesh:null,
   verification:"VISUAL_REVIEW_REQUIRED",spriteAlphaMaskExtracted:false,
   status:"UNAPPROVED",canPersist:false,
 });
}
export function auditSixRoomComposites(scene,atlas=ROOM_OBSTACLE_ATLAS){
 return Object.freeze(Object.fromEntries(Object.keys(ROOM_SOURCES)
  .map(id=>[id,auditCompositedRoom(scene,id,atlas)])));
}
