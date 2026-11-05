/**
 * Authoring/validation for PROPOSED floor-contact polygons in 1170px scene
 * coordinates. No alpha silhouette or bounding box is a verified collider.
 * The editor never writes to Firebase or grants persistence.
 */
import {ROOM_SOURCES,PlacementPreviewError} from "./house-placement-preview.mjs";
export const CONTACT_PROTOCOL="LOCAL_FLOOR_CONTACT_PROPOSAL_UNAPPROVED";
const fail=code=>{throw new PlacementPreviewError(code);};
const inside=p=>Array.isArray(p)&&p.length===2&&p.every(v=>typeof v==="number"&&Number.isFinite(v)&&v>=0&&v<=1170);
const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
function onEdge(a,b,c){return Math.abs(cross(a,b,c))<1e-9&&c[0]>=Math.min(a[0],b[0])&&c[0]<=Math.max(a[0],b[0])&&c[1]>=Math.min(a[1],b[1])&&c[1]<=Math.max(a[1],b[1]);}
function segmentsTouch(a,b,c,d){
 const p=cross(a,b,c),q=cross(a,b,d),u=cross(c,d,a),v=cross(c,d,b);
 if(((p>0&&q<0)||(p<0&&q>0))&&((u>0&&v<0)||(u<0&&v>0)))return true;
 return onEdge(a,b,c)||onEdge(a,b,d)||onEdge(c,d,a)||onEdge(c,d,b);
}
export function validateContactPolygon(vertices){
 if(!Array.isArray(vertices)||vertices.length<3||vertices.length>32||!vertices.every(inside))fail("INVALID_CONTACT_POLYGON");
 const area=Math.abs(vertices.reduce((sum,p,i)=>{const n=vertices[(i+1)%vertices.length];return sum+p[0]*n[1]-n[0]*p[1];},0)/2);
 if(area<16)fail("CONTACT_POLYGON_DEGENERATE");
 for(let i=0;i<vertices.length;i++)for(let j=i+1;j<vertices.length;j++){
   if(j===i+1||(i===0&&j===vertices.length-1))continue;
   if(segmentsTouch(vertices[i],vertices[(i+1)%vertices.length],vertices[j],vertices[(j+1)%vertices.length]))fail("CONTACT_POLYGON_SELF_INTERSECT");
 }
 return Object.freeze({areaPx2:area,vertices:Object.freeze(vertices.map(p=>Object.freeze([...p])))});
}
export function sourceLayerForContact(scene,roomId,layerId){
 if(!Object.hasOwn(ROOM_SOURCES,roomId))fail("UNKNOWN_ROOM");
 const source=ROOM_SOURCES[roomId],obj=source===null?scene?.room:scene?.rooms?.[source];
 const box=obj?.layers?.[layerId];
 if(!Array.isArray(box)||box.length!==4||box.some(v=>typeof v!=="number"||!Number.isFinite(v))||box[2]<=box[0]||box[3]<=box[1])fail("UNKNOWN_LAYER");
 return Object.freeze({roomId,layerId,source:source===null?"pk":source,box:Object.freeze([...box])});
}
export function createContactProposal(scene,{roomId,layerId,vertices}){
 const layer=sourceLayerForContact(scene,roomId,layerId);
 const polygon=validateContactPolygon(vertices);
 return Object.freeze({
   protocol:CONTACT_PROTOCOL,roomId,layerId,
   sourceBox:layer.box,vertices:polygon.vertices,areaPx2:polygon.areaPx2,
   authoringStatus:"USER_DRAWN_PROPOSAL",reviewStatus:"VISUAL_APPROVAL_REQUIRED",
   assetAlphaMeasured:false,sourceScreenshotReviewed:false,
   contactVerified:false,canPersist:false,
 });
}
/** A self-reported "approved" object is never sufficient to write shared room state. */
export function requireApprovedContact(input){
 if(!input||input.protocol!==CONTACT_PROTOCOL||input.canPersist!==true||
   input.contactVerified!==true)fail("FLOOR_CONTACT_NOT_APPROVED");
 fail("FLOOR_CONTACT_NOT_APPROVED");
}
export function buildReviewExport(proposals){
 if(!Array.isArray(proposals)||proposals.some(p=>!p||p.protocol!==CONTACT_PROTOCOL||
   p.canPersist!==false||p.contactVerified!==false||
   p.reviewStatus!=="VISUAL_APPROVAL_REQUIRED"||
   !Array.isArray(p.vertices)))fail("INVALID_CONTACT_EXPORT");
 return Object.freeze({protocol:CONTACT_PROTOCOL,reviewStatus:"UNAPPROVED",canPersist:false,
   note:"Local-only authored contact candidates; review 1170px composited sources before approval.",
   proposals:proposals.map(p=>Object.freeze({roomId:p.roomId,layerId:p.layerId,vertices:p.vertices,
     status:"VISUAL_APPROVAL_REQUIRED",sourceBox:p.sourceBox}))});
}
