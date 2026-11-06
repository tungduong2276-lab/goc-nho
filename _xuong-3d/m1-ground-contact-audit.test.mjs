import {test} from "node:test";
import {strict as assert} from "node:assert";
import {buildMeshAudit,fileDigest,ROOM_IDS,reviewRectFlags} from "./m1-ground-contact-proposals.mjs";

const audit=buildMeshAudit();
test("all six real THREE.js rooms include separate baked and interactive source evidence",()=>{
 assert.deepEqual(audit.rooms.map(r=>r.roomId),ROOM_IDS);
 assert.match(audit.sourceSha256,/^[0-9a-f]{64}$/);
 assert.equal(audit.sourceSha256,fileDigest());
 assert.equal(audit.canPersist,false);
 assert.equal(audit.reviewStatus,"EXPERIMENTAL_ONLY");
 assert.equal(audit.approvedFloorPolygons,null);
 for(const room of audit.rooms){
  assert.equal(room.floorStatus,"SOURCE_SHELL_RECT_NOT_APPROVED");
  assert.equal(room.doorwayStatus,"UNKNOWN");
  assert.equal(room.walkwayStatus,"UNKNOWN");
  assert.equal(room.canPersist,false);
  assert.ok(room.itemStates.length>0,room.roomId+" missing interactive");
  assert.ok(room.bakedComponents.length>0,room.roomId+" missing background");
 }
});
test("keep floor coverings distinct from unclassified baked objects",()=>{
 const living=audit.rooms.find(r=>r.roomId==="phong-khach");
 assert.equal(living.interactiveStateCoverage,"LIVING_DEFAULT_STATES_ONLY");
 assert.ok(living.itemStates.some(r=>r.layerId==="pk_sofa"));
 assert.equal(living.bakedComponents.length,9);
 assert.equal(living.bakedComponents.find(o=>o.id==="rug").kind,"FLOOR_COVERING_NOT_BLOCKER");
 assert.equal(living.bakedComponents.find(o=>o.id==="coffee_table").kind,"UNCLASSIFIED_SOURCE_PROP");
 assert.equal(living.bakedComponents.find(o=>o.id==="window").kind,"WALL_OR_RAISED_DECOR");
 const kitchen=audit.rooms.find(r=>r.roomId==="bep");
 assert.equal(kitchen.interactiveStateCoverage,"ALL_SOURCE_ITEM_STATES");
 assert.ok(kitchen.bakedComponents.some(c=>c.kind==="FLOOR_FINISH_NOT_BLOCKER"),"missing checker tiles");
 assert.ok(audit.rooms.some(r=>r.bakedComponents.some(c=>c.kind==="FLOOR_COVERING_NOT_BLOCKER")));
});
test("world/source camera coordinates are finite; no mesh envelope is a collision clearance",()=>{
 let covered=0;
 for(const room of audit.rooms)for(const item of [...room.itemStates,...room.bakedComponents]){
  assert.equal(item.canPersist,false);
  assert.equal(item.blocksWalkwayVerified??false,false);
  assert.equal(item.physicalContactVerified??item.contactVerified,false);
  assert.ok(Number.isInteger(item.meshCount)&&item.meshCount>=0);
  assert.ok(Number.isInteger(item.nearFloorMeshes)&&item.nearFloorMeshes>=0);
  if(!item.worldRect){
   assert.equal(item.imagePolygon,null);assert.equal(item.nearFloorMeshes,0);continue;
  }
  covered++;
  assert.equal(item.worldRect.length,4);
  assert.ok(item.worldRect.every(Number.isFinite));
  assert.ok(item.worldRect[2]>item.worldRect[0]&&item.worldRect[3]>item.worldRect[1]);
  assert.equal(item.imagePolygon.length,4);
  assert.ok(item.imagePolygon.every(p=>p.length===2&&p.every(Number.isFinite)));
 }
 assert.ok(covered>35,"Too few source ground candidates");
});
test("alternatives are not silently claimed in living source; five other rooms report all states",()=>{
 const living=audit.rooms.find(r=>r.roomId==="phong-khach");
 assert.equal(living.itemStates.length,6);
 for(const room of audit.rooms.filter(r=>r!==living))
  assert.equal(room.interactiveStateCoverage,"ALL_SOURCE_ITEM_STATES");
 const raised=audit.rooms.find(r=>r.roomId==="gac").itemStates.find(s=>s.layerId==="bandogioi_trong");
 assert.equal(raised.worldRect,null,"wall map must not create a fake floor obstacle");
});

test("oversize and beyond-shell source rectangles are warnings, never authorization",()=>{
 const shell=[-3,-3,3,3];
 assert.deepEqual(reviewRectFlags(null,shell),[]);
 assert.deepEqual(reviewRectFlags([-1,-1,1,1],shell),["BROAD_WORLD_ENVELOPE_REVIEW"]);
 assert.deepEqual(reviewRectFlags([2.8,0,3.3,0.4],shell),["EXTENDS_BEYOND_SOURCE_SHELL_REVIEW"]);
 assert.deepEqual(reviewRectFlags([-0.2,-0.2,0.2,0.2],shell),[]);
 for(const room of audit.rooms)for(const candidate of [...room.itemStates,...room.bakedComponents]){
  assert.deepEqual(candidate.warningFlags,reviewRectFlags(candidate.worldRect,room.worldFloorRect));
  assert.equal(candidate.canPersist,false);
 }
});
