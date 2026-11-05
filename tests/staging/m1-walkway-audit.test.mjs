import {test} from "node:test";
import {strict as assert} from "node:assert";
import {readFileSync} from "node:fs";
import { ROOM_SOURCES } from "../../src/house-placement-preview.mjs";
import { ROOM_OBSTACLE_ATLAS } from "../../src/house-obstacle-atlas.mjs";
import {
  reviewRoomWalkway,reviewSixRoomWalkways,corridorTouchesPolygon,
  WALK_REVIEW_PROTOCOL,WALK_LANE_RADIUS_PX,assertWalkwayApproved,
} from "../../src/house-walkway-audit.mjs";
const scene=JSON.parse(readFileSync("assets/3d/scene.json","utf8"));
test("all six routes are grounded in actual scene standing anchors, no fictitious door or floor",()=>{
 const reports=reviewSixRoomWalkways(scene);
 assert.deepEqual(Object.keys(reports).sort(),Object.keys(ROOM_SOURCES).sort());
 for(const [room,r] of Object.entries(reports)){
   const src=ROOM_SOURCES[room],original=src===null?scene.room.dung:scene.rooms[src].spots.dung;
   assert.equal(r.protocol,WALK_REVIEW_PROTOCOL);
   assert.deepEqual(r.path,original.slice(0,2));
   assert.equal(r.clearanceRadiusPx,WALK_LANE_RADIUS_PX);
   assert.equal(r.doorway,null);
   assert.equal(r.floorPolygon,null);
   assert.equal(r.doorwayStatus,"UNTRACED");
   assert.equal(r.floorStatus,"UNTRACED");
   assert.equal(r.approved,false);
   assert.equal(r.canPersist,false);
   assert.equal(r.status,"UNVERIFIED");
   assert.deepEqual(r.blockingIds,ROOM_OBSTACLE_ATLAS[room].filter(p=>
     corridorTouchesPolygon(r.path[0],r.path[1],p.polygon)).map(x=>x.id));
   assert.throws(()=>assertWalkwayApproved(r),e=>e.code==="WALKWAY_NOT_APPROVED");
 }
});
test("kitchen straight-line route intersects the existing unapproved dining table rectangle",()=>{
 const result=reviewRoomWalkway(scene,"bep");
 assert.ok(result.blockingIds.includes("dining-table"));
 assert.equal(result.corridorAssessment,"BLOCKED_BY_UNAPPROVED_ESTIMATE");
});
test("swept path detects interior crossing, tangency, and near-corner collisions",()=>{
 const box=[[300,300],[400,300],[400,400],[300,400]];
 assert.equal(corridorTouchesPolygon([100,350],[600,350],box,0),true);
 assert.equal(corridorTouchesPolygon([100,300],[600,300],box,0),true);
 assert.equal(corridorTouchesPolygon([100,430],[600,430],box,30),true);
 assert.equal(corridorTouchesPolygon([100,460],[600,460],box,30),false);
 assert.equal(corridorTouchesPolygon([100,100],[150,150],box,30),false);
});
test("reject malformed scene, missing obstacles and unauthorized approval flags",()=>{
 const invalidScene=structuredClone(scene);invalidScene.rooms.bep.spots.dung=[[0,0],[0,0]];
 assert.throws(()=>reviewRoomWalkway(invalidScene,"bep"),e=>e.code==="INVALID_SCENE_WALK_ANCHORS");
 assert.throws(()=>reviewRoomWalkway(scene,"unknown"),e=>e.code==="UNKNOWN_ROOM");
 assert.throws(()=>reviewRoomWalkway(scene,"bep",{}),e=>e.code==="INVALID_OBSTACLE_ATLAS");
 assert.throws(()=>reviewRoomWalkway(scene,"bep",{...ROOM_OBSTACLE_ATLAS,bep:[{...ROOM_OBSTACLE_ATLAS.bep[0],approved:true}]}),e=>e.code==="INVALID_OBSTACLE_ATLAS");
 assert.throws(()=>corridorTouchesPolygon([0,0],[0,0],[[0,0],[20,0],[20,20]],0),e=>e.code==="INVALID_WALK_GEOMETRY");
 const forged={...reviewRoomWalkway(scene,"bep"),approved:true,canPersist:true,doorwayStatus:"VERIFIED",floorStatus:"VERIFIED"};
 assert.throws(()=>assertWalkwayApproved(forged),e=>e.code==="WALKWAY_NOT_APPROVED");
});
