// Source-of-truth pilot for REAL 3D scene composition.
// World coordinates are metres on the room's X/Z floor plane.
// This file is imported by the 3D generators, not by the live UI.
// No floor/collider approval or Firebase persistence is inferred.
export const SPACIOUS_SCENE_PILOT = Object.freeze({
  "phong-khach": Object.freeze({
    old: Object.freeze({
      coffeeTable: Object.freeze([0.55,0.45]),
      rug: Object.freeze([0.55,0.55]),
    }),
    next: Object.freeze({
      coffeeTable: Object.freeze([-1.15,0.65]),
      rug: Object.freeze([-1.15,0.7]),
    }),
    // Display-only area chosen to compare alternatives; not a verified floor polygon.
    centralReview: Object.freeze([-0.65,-0.6,1.45,1.55]),
    // Approximate coffee table rectangle, independent from decorative rug.
    furnitureSize: Object.freeze([1.1,0.75]),
  }),
  "bep": Object.freeze({
    old: Object.freeze({
      diningTable: Object.freeze([0.6,1.1]),
      rug: Object.freeze([0.6,1.1]),
      seats: Object.freeze([Object.freeze([-0.25,1.1]),Object.freeze([1.45,1.1])]),
    }),
    next: Object.freeze({
      diningTable: Object.freeze([1.35,1.55]),
      rug: Object.freeze([1.35,1.55]),
      seats: Object.freeze([Object.freeze([0.5,1.55]),Object.freeze([2.2,1.55])]),
    }),
    centralReview: Object.freeze([-0.5,-0.25,0.9,1.85]),
    // Table plus chair reach, only approximate; not the actual alpha contact mask.
    furnitureSize: Object.freeze([2.2,1.05]),
  }),
});
function overlapArea(a,b){
  return Math.max(0,Math.min(a[2],b[2])-Math.max(a[0],b[0]))*
    Math.max(0,Math.min(a[3],b[3])-Math.max(a[1],b[1]));
}
export function centerOcclusionEstimate(roomId,layout="next"){
  const entry=SPACIOUS_SCENE_PILOT[roomId];
  if(!entry||!["old","next"].includes(layout))throw new Error("UNKNOWN_SPACIOUS_LAYOUT");
  const p=entry[layout][roomId==="bep"?"diningTable":"coffeeTable"];
  const [w,d]=entry.furnitureSize;
  return overlapArea(entry.centralReview,[p[0]-w/2,p[1]-d/2,p[0]+w/2,p[1]+d/2]);
}
export function compareCenterClearance(roomId){
  const previous=centerOcclusionEstimate(roomId,"old");
  const proposed=centerOcclusionEstimate(roomId,"next");
  const p=SPACIOUS_SCENE_PILOT[roomId];
  return Object.freeze({
    roomId,oldCenterOcclusionM2:previous,
    newCenterOcclusionM2:proposed,
    estimatedClearanceGainM2:previous-proposed,
    reviewerStatus:"SOURCE_LAYOUT_PROPOSAL",
    physicalContactVerified:false,
    fullFloorAreaVerified:false,
    canPersist:false,
    reviewBoundary:p.centralReview,
  });
}
