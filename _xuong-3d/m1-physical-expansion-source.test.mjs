import {test} from "node:test";
import {strict as assert} from "node:assert";
import {M1_EXPANDED_SOURCE_ROOMS,expandedSourceCoordinates,realExpansionReport} from "./m1-expanded-room-source.mjs";
import {inspectLivingSource} from "./room.js";
import {inspectRoomSource} from "./rooms2.js";
import {buildMeshAudit} from "./m1-ground-contact-proposals.mjs";
import {buildSixRoomSourceRouteAudit} from "../src/house-open-edge-route-audit.mjs";
const keys=["phong-khach","bep","phong-anh","phong-em","goc-sang-tao","gac"];
const map={"bep":"bep","phong-anh":"phong_anh","phong-em":"phong_em","goc-sang-tao":"sang_tao",gac:"gac"};
test("actually increase world floor width/depth and area for all six source scenes",()=>{
 assert.deepEqual(Object.keys(M1_EXPANDED_SOURCE_ROOMS),keys);
 for(const id of keys){
  const p=realExpansionReport(id),c=M1_EXPANDED_SOURCE_ROOMS[id];
  const scene=id==="phong-khach"?inspectLivingSource():inspectRoomSource(map[id]);
  assert.deepEqual([scene.n,scene.d],c.expanded);
  assert.equal(scene.camera.userData.ppm,c.ppmNew);
  assert.ok(scene.n>c.source[0]&&scene.d>c.source[1]);
  assert.ok(p.worldAreaGainM2>10);
  assert.ok(p.worldAreaGainPercent>=35);
  assert.equal(p.visualReviewRequired,true);
  assert.equal(p.doorwaysApproved,false);
  assert.equal(p.walkwaysApproved,false);
  assert.equal(p.canPersist,false);
 }
});
test("model positions move physically in XZ without scaling object meshes",()=>{
 const [tableX,tableZ]=expandedSourceCoordinates("bep",[1.35,1.55]);
 assert.ok(Math.abs(tableX-1.575)<1e-9&&Math.abs(tableZ-1.8083333333333333)<1e-9);
 const [atticX,atticZ]=expandedSourceCoordinates("gac",[2,1]);
 assert.ok(Math.abs(atticX-7/3)<1e-9&&Math.abs(atticZ-1.25)<1e-9);
 assert.throws(()=>expandedSourceCoordinates("foobar",[1,1]),/INVALID_PHYSICAL_EXPANSION_COORDINATES/);
 const living=inspectLivingSource();
 const table=living.backgrounds.find(x=>x.id==="coffee_table").object;
 assert.ok(table.position.x< -1.25); // old spacious pilot was -1.15m
 const room=inspectRoomSource("phong_anh");
 const bed=room.items.giuong.gon;
 assert.ok(bed.position.x< -2.4);
 assert.equal(bed.scale.x,1);
});
test("real expanded source meshes remain review-only, with no geometry approval",()=>{
 const audit=buildMeshAudit();
 assert.equal(audit.rooms.length,6);
 assert.equal(audit.canPersist,false);
 assert.equal(audit.reviewStatus,"EXPERIMENTAL_ONLY");
 assert.equal(audit.approvedFloorPolygons,null);
 for(const entry of audit.rooms){
  assert.deepEqual(entry.worldFloorRect,[-M1_EXPANDED_SOURCE_ROOMS[entry.roomId].expanded[0]/2,
   -M1_EXPANDED_SOURCE_ROOMS[entry.roomId].expanded[1]/2,
   M1_EXPANDED_SOURCE_ROOMS[entry.roomId].expanded[0]/2,
   M1_EXPANDED_SOURCE_ROOMS[entry.roomId].expanded[1]/2]);
  assert.ok(entry.itemStates.every(x=>x.canPersist===false));
 }
});

test("attic decorative sunlight is not a solid blocker; existing source spots have candidate routes",()=>{
 const audit=buildMeshAudit();
 const attic=audit.rooms.find(x=>x.roomId==="gac");
 const beam=attic.bakedComponents.find(x=>x.id==="deco-011");
 assert.ok(beam,"real attic sunlight object must remain in source");
 assert.equal(beam.kind,"LIGHT_EFFECT_NOT_BLOCKER");
 const routes=buildSixRoomSourceRouteAudit().rooms.find(x=>x.roomId==="gac");
 assert.equal(routes.doorGeometryPresent,false);
 assert.equal(routes.walkwayVerified,false);
 assert.ok(routes.routes.length>=2);
 for(const spot of routes.routes){
  assert.equal(spot.status,"UNAPPROVED_ROUTE_HYPOTHESIS");
  assert.ok(spot.paths.some(path=>path.found));
  assert.equal(spot.canPersist,false);
 }
});
