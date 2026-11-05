import {test} from "node:test";
import {strict as assert} from "node:assert";
import {ROOM_SOURCES} from "../../src/house-placement-preview.mjs";
import {makeDecorFloorReview,requireVerifiedFloorReview,FLOOR_V2_PROTOCOL} from "../../src/house-floor-zones-v2.mjs";
import {analyzeAlphaPixels} from "../../src/house-alpha-footprint-review.mjs";
test("six rooms expose proposed floor regions but never usable approved space",()=>{
 for(const room of Object.keys(ROOM_SOURCES)){
  const x=makeDecorFloorReview(room);
  assert.equal(x.protocol,FLOOR_V2_PROTOCOL);
  assert.equal(x.candidateFloor.length,2);
  assert.equal(x.approvedFloorPolygon,null);
  assert.equal(x.usableFloorAreaPx2,null);
  assert.equal(x.spaciousScore,null);
  assert.deepEqual(x.decorFreeZones,[]);
  assert.equal(x.canPersist,false);
  assert.throws(()=>requireVerifiedFloorReview(x),e=>e.code==="DECOR_FLOOR_NOT_APPROVED");
 }
});
test("alpha measurement cannot substitute for floor contact or door clearance",()=>{
 const alpha=analyzeAlphaPixels({data:new Uint8ClampedArray([255,0,0,255]),width:1,height:1});
 const x=makeDecorFloorReview("bep",[alpha]);
 assert.equal(x.alphaEvidenceCount,1);
 assert.ok(x.missingEvidence.includes("VERIFIED_FLOOR_CONTACTS"));
 assert.ok(x.missingEvidence.includes("DOORWAY_THRESHOLDS"));
 assert.equal(x.reviewStatus,"UNVERIFIED");
});
test("bad scene inputs or forged alpha approvals fail closed",()=>{
 assert.throws(()=>makeDecorFloorReview("missing"),e=>e.code==="UNKNOWN_ROOM");
 assert.throws(()=>makeDecorFloorReview("bep",[{protocol:"SPRITE_ALPHA_VISUAL_ONLY",canPersist:true,floorContactStatus:"VERIFIED"}]),e=>e.code==="INVALID_ALPHA_EVIDENCE");
});
