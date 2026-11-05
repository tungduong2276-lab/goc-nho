/**
 * M1: deterministic mask from real sprite alpha, in image coordinates.
 * Does NOT imply which opaque pixels touch the floor. Never approves
 * placement or writes to a shared state.
 */
import {PlacementPreviewError} from "./house-placement-preview.mjs";
export const ALPHA_REVIEW_PROTOCOL="SPRITE_ALPHA_VISUAL_ONLY";
const fail=code=>{throw new PlacementPreviewError(code);};
export function analyzeAlphaPixels({data,width,height,threshold=32,tileSize=8}){
 if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||
   !data||typeof data.length!=="number"||data.length!==width*height*4||
   !Number.isInteger(threshold)||threshold<0||threshold>254||
   !Number.isInteger(tileSize)||tileSize<1||tileSize>128)fail("INVALID_ALPHA_DATA");
 let minX=width,minY=height,maxX=-1,maxY=-1,opaque=0;
 const columns=Math.ceil(width/tileSize),rows=Math.ceil(height/tileSize);
 const tiles=new Uint8Array(columns*rows);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
   if(data[(y*width+x)*4+3]<=threshold)continue;
   opaque++;minX=Math.min(minX,x);maxX=Math.max(maxX,x);
   minY=Math.min(minY,y);maxY=Math.max(maxY,y);
   tiles[Math.floor(y/tileSize)*columns+Math.floor(x/tileSize)]=1;
 }
 const occupied=[];
 for(let y=0;y<rows;y++)for(let x=0;x<columns;x++){
   if(tiles[y*columns+x])occupied.push(Object.freeze([x,y]));
 }
 const bounds=opaque?Object.freeze([minX,minY,maxX+1,maxY+1]):null;
 return Object.freeze({
   protocol:ALPHA_REVIEW_PROTOCOL,width,height,threshold,tileSize,
   opaquePixels:opaque,opaqueRatio:opaque/(width*height),
   alphaBounds:bounds,
   occupiedTiles:Object.freeze(occupied),tileColumns:columns,tileRows:rows,
   floorContactBounds:null,floorContactStatus:"UNTRACED",
   floorPolygon:null,doorwayReserve:null,walkwayReserve:null,
   approved:false,canPersist:false,
 });
}
export function sourceAlphaBounds(report,sourceBox){
 if(!report||report.protocol!==ALPHA_REVIEW_PROTOCOL||
   !Array.isArray(sourceBox)||sourceBox.length!==4||
   sourceBox.some(v=>typeof v!=="number"||!Number.isFinite(v))||
   sourceBox[2]<=sourceBox[0]||sourceBox[3]<=sourceBox[1])
   fail("INVALID_SOURCE_BOUNDS");
 if(!report.alphaBounds)return null;
 const [x0,y0,x1,y1]=sourceBox;
 const dx=(x1-x0)/report.width,dy=(y1-y0)/report.height;
 const [a,b,c,d]=report.alphaBounds;
 return Object.freeze([x0+a*dx,y0+b*dy,x0+c*dx,y0+d*dy]);
}
/** Source+floor are unapproved: no amount of alpha coverage grants persistence. */
export function assertDecorZoneApproved(candidate){
 if(!candidate||candidate.canPersist!==true||
   candidate.floorStatus!=="VERIFIED"||
   candidate.doorStatus!=="VERIFIED"||
   candidate.contactStatus!=="VERIFIED")fail("DECOR_ZONE_NOT_APPROVED");
 fail("DECOR_ZONE_NOT_APPROVED");
}
