/**
 * Actual source-world floor expansion PILOT; not a certified walkable/decoration
 * zone. Pixel canvas remains 1170 but world shells become larger and furniture
 * is translated outward without scaling its mesh.
 */
const cfg={
 "phong-khach":{source:[6,6],expanded:[7,7],ppmOld:112,ppmNew:96},
 bep:{source:[6,6],expanded:[7,7],ppmOld:112,ppmNew:96},
 "phong-anh":{source:[6,6],expanded:[7,7],ppmOld:112,ppmNew:96},
 "phong-em":{source:[6,6],expanded:[7,7],ppmOld:112,ppmNew:96},
 "goc-sang-tao":{source:[6,6],expanded:[7,7],ppmOld:112,ppmNew:96},
 gac:{source:[6,4],expanded:[7,5],ppmOld:112,ppmNew:96}
};
export const M1_EXPANDED_SOURCE_ROOMS=Object.freeze(Object.fromEntries(
 Object.entries(cfg).map(([id,v])=>[id,Object.freeze({
  source:Object.freeze(v.source),expanded:Object.freeze(v.expanded),
  ppmOld:v.ppmOld,ppmNew:v.ppmNew,
  oldAreaM2:v.source[0]*v.source[1],newAreaM2:v.expanded[0]*v.expanded[1],
  status:"EXPERIMENTAL_SOURCE_GEOMETRY_ONLY",canPersist:false
 })])
));
export function expandedSourceCoordinates(roomId,position){
 const c=M1_EXPANDED_SOURCE_ROOMS[roomId];
 if(!c||!Array.isArray(position)||position.length!==2||position.some(n=>!Number.isFinite(n)))
  throw Error("INVALID_PHYSICAL_EXPANSION_COORDINATES");
 return [position[0]*c.expanded[0]/c.source[0],
  position[1]*c.expanded[1]/c.source[1]];
}
export function applyExpandedPosition(object,roomId){
 const [x,z]=expandedSourceCoordinates(roomId,[object.position.x,object.position.z]);
 object.position.x=x;object.position.z=z;return object;
}
export function realExpansionReport(roomId){
 const c=M1_EXPANDED_SOURCE_ROOMS[roomId];if(!c)throw Error("UNKNOWN_EXPANSION_ROOM");
 return {...c,roomId,worldAreaGainM2:c.newAreaM2-c.oldAreaM2,
  worldAreaGainPercent:Math.round((c.newAreaM2/c.oldAreaM2-1)*1000)/10,
  visualReviewRequired:true,doorwaysApproved:false,walkwaysApproved:false,
  canPersist:false};
}
