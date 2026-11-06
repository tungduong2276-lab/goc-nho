/**
 * Bedroom source-art layout PILOT, not approved physical collision geometry.
 * Coordinates in real 6x6 room metres, x/z horizontal axes.
 * Do not edit shipped WebP assets or scene.json until both composites are reviewed.
 */
export const BEDROOM_SPACIOUS_PILOT=Object.freeze({
  phong_anh:Object.freeze({
    old:Object.freeze({bed:Object.freeze([-2.25,-1.6]),rug:Object.freeze([0.2,0.9])}),
    next:Object.freeze({bed:Object.freeze([-2.25,-1.92]),rug:Object.freeze([-1.15,0.98])}),
    reviewRegion:Object.freeze([-2.25,-1.10,0.8,1.75]),
    estimatedBedFootprint:Object.freeze([1.2,2.0]),
    actorSpotsUnchanged:true,
  }),
  phong_em:Object.freeze({
    old:Object.freeze({bed:Object.freeze([-2.25,-1.7]),rug:Object.freeze([0.4,0.8]),bear:Object.freeze([1.9,1.6])}),
    next:Object.freeze({bed:Object.freeze([-2.25,-1.92]),rug:Object.freeze([-1.15,0.95]),bear:Object.freeze([2.52,1.6])}),
    reviewRegion:Object.freeze([-2.25,-1.10,0.8,1.75]),
    estimatedBedFootprint:Object.freeze([1.2,2.0]),
    actorSpotsUnchanged:true,
  }),
});
function intersect(a,b){
  return Math.max(0,Math.min(a[2],b[2])-Math.max(a[0],b[0]))*
    Math.max(0,Math.min(a[3],b[3])-Math.max(a[1],b[1]));
}
function rectangle(center,width,depth){
  return [center[0]-width/2,center[1]-depth/2,center[0]+width/2,center[1]+depth/2];
}
export function bedroomClearanceReview(roomId){
  const p=BEDROOM_SPACIOUS_PILOT[roomId];
  if(!p)throw new Error("UNKNOWN_BEDROOM");
  const [width,depth]=p.estimatedBedFootprint;
  const before=intersect(p.reviewRegion,rectangle(p.old.bed,width,depth));
  const after=intersect(p.reviewRegion,rectangle(p.next.bed,width,depth));
  return Object.freeze({
    roomId,oldEstimatedObstructionM2:before,newEstimatedObstructionM2:after,
    estimatedCenterRegionGainM2:before-after,decorativeRugIsNotCollider:true,
    status:"3D_SOURCE_PREVIEW_NOT_APPROVED",canPersist:false,
    floorBoundaryVerified:false,physicalContactVerified:false,
  });
}