import {test} from "node:test";
import {strict as assert} from "node:assert";
import {SPACIOUS_SCENE_PILOT,compareCenterClearance,centerOcclusionEstimate} from "../../_xuong-3d/spacious-layout.js";
import {readFileSync} from "node:fs";
const scene=JSON.parse(readFileSync("assets/3d/scene.json","utf8"));
test("both pilot rooms reduce independent center-region furniture coverage, without certifying true floor",()=>{
 for(const id of ["phong-khach","bep"]){
   const report=compareCenterClearance(id);
   assert.ok(report.estimatedClearanceGainM2>0.15,id);
   assert.ok(report.newCenterOcclusionM2<report.oldCenterOcclusionM2,id);
   assert.equal(report.canPersist,false);
   assert.equal(report.fullFloorAreaVerified,false);
   assert.equal(report.physicalContactVerified,false);
   assert.equal(report.reviewerStatus,"SOURCE_LAYOUT_PROPOSAL");
 }
 assert.throws(()=>centerOcclusionEstimate("gac"),/UNKNOWN_SPACIOUS_LAYOUT/);
});
test("new furniture centers keep conservative 3D extents within the actual 6x6 room shell",()=>{
 for(const [room,config] of Object.entries(SPACIOUS_SCENE_PILOT)){
   const key=room==="bep"?"diningTable":"coffeeTable";
   for(const p of [config.next[key],config.next.rug]){
     assert.ok(p.every(Number.isFinite));
     assert.ok(Math.abs(p[0])<2.65&&Math.abs(p[1])<2.65);
   }
 }
 const kitchen=SPACIOUS_SCENE_PILOT.bep.next;
 assert.equal(kitchen.seats.length,2);
 for(const seat of kitchen.seats){
   assert.ok(Math.abs(seat[0])<2.5&&Math.abs(seat[1])<2.5);
   assert.ok(Math.hypot(seat[0]-kitchen.diningTable[0],seat[1]-kitchen.diningTable[1])<1);
 }
});
test("the source 3D builders, existing scene schema and render jobs remain coupled",()=>{
 const living=readFileSync("_xuong-3d/room.js","utf8");
 const kitchen=readFileSync("_xuong-3d/rooms2.js","utf8");
 assert.match(living,/SPACIOUS_SCENE_PILOT\["phong-khach"\]\.next/);
 assert.match(kitchen,/SPACIOUS_SCENE_PILOT\.bep\.next/);
 assert.match(kitchen,/spacious\.diningTable/);
 assert.equal(scene.room.size[0],1170);
 assert.equal(scene.rooms.bep.size[0],1170);
 for(const id of Object.keys(scene.rooms.bep.items))
   assert.ok(scene.rooms.bep.layers[id+"_"+scene.rooms.bep.items[id].st[0]]);
});
