import {test} from "node:test";
import {strict as assert} from "node:assert";
import {readFileSync} from "node:fs";
import {makeFloorProposalPreview} from "../../src/house-floor-review.mjs";
import {assertWithinProposedZones} from "../../src/house-room-zones.mjs";
import {ROOM_OBSTACLE_ATLAS,makeObstacleReviewZones,OBSTACLE_REVIEW_ZONES} from "../../src/house-obstacle-atlas.mjs";
const scene=JSON.parse(readFileSync("assets/3d/scene.json","utf8"));
const fresh=()=>makeFloorProposalPreview(scene);
const add=(roomId,slot=1,type="chair")=>({kind:"place",id:"test",roomId,slotId:roomId+"-candidate-"+slot,assetType:type});
test("all six rooms have at least two documented provisional visible-prop silhouettes",()=>{
 assert.equal(Object.keys(ROOM_OBSTACLE_ATLAS).length,6);
 for(const [room,obstacles] of Object.entries(ROOM_OBSTACLE_ATLAS)){
   assert.ok(obstacles.length>=2);
   assert.equal(OBSTACLE_REVIEW_ZONES[room].bakedFurnitureCertified,false);
   assert.equal(OBSTACLE_REVIEW_ZONES[room].reviewStatus,"PROPOSED_NOT_APPROVED");
   assert.equal(OBSTACLE_REVIEW_ZONES[room].exclusions.length,obstacles.length);
   for(const o of obstacles){
     assert.equal(o.approved,false);
     assert.equal(o.source,"CI_SCREENSHOT_41953137827_390PX");
     assert.ok(o.polygon.every(p=>p[0]>=0&&p[1]>=0&&p[0]<=1170&&p[1]<=1170));
   }
 }
});
test("visually occupied sofa region blocks the first living-room proposal",()=>{
 const d=fresh();
 assert.throws(()=>assertWithinProposedZones(d,add("phong-khach"),OBSTACLE_REVIEW_ZONES),
   e=>e.code==="ZONE_EXCLUSION_COLLISION");
 assert.equal(d.canPersist,false);
 assert.equal(d.items.length,0);
});
test("authoring atlas retains at least one local chair preview position in each room",()=>{
 const d=fresh();
 for(const room of Object.keys(ROOM_OBSTACLE_ATLAS)){
   const viable=[1,2].filter(slot=>{
     try{assertWithinProposedZones(d,add(room,slot),OBSTACLE_REVIEW_ZONES);return true;}
     catch{return false;}
   });
   assert.ok(viable.length>0,room+" must retain a preview slot, or require revised images");
 }
});
test("fail closed on malformed, missing, or falsely approved authored obstacles",()=>{
 const invalid=(room,value)=>({...ROOM_OBSTACLE_ATLAS,[room]:value});
 assert.throws(()=>makeObstacleReviewZones(invalid("bep",[])),e=>e.code==="INVALID_OBSTACLE_ATLAS");
 assert.throws(()=>makeObstacleReviewZones(invalid("bep",ROOM_OBSTACLE_ATLAS.bep.map(o=>({...o,approved:true})))),e=>e.code==="INVALID_OBSTACLE_ATLAS");
 assert.throws(()=>makeObstacleReviewZones({...ROOM_OBSTACLE_ATLAS,unexpected:[]}),e=>e.code==="INVALID_OBSTACLE_ATLAS");
 assert.throws(()=>makeObstacleReviewZones(invalid("bep",[{...ROOM_OBSTACLE_ATLAS.bep[0],polygon:[[0,0],[1500,0],[1500,100]]}])),e=>e.code==="INVALID_OBSTACLE_ATLAS");
});
