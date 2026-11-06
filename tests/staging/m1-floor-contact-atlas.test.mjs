import {test} from "node:test";
import {strict as assert} from "node:assert";
import {readFileSync} from "node:fs";
import {validateContactPolygon,sourceLayerForContact,createContactProposal,buildReviewExport,requireApprovedContact,CONTACT_PROTOCOL} from "../../src/house-floor-contact-atlas.mjs";
import {ROOM_SOURCES} from "../../src/house-placement-preview.mjs";
const scene=JSON.parse(readFileSync("assets/3d/scene.json","utf8"));
test("every scene room exposes a real source layer and no implicit approval",()=>{
 for(const room of Object.keys(ROOM_SOURCES)){
  const sourceId=ROOM_SOURCES[room],s=sourceId===null?scene.room:scene.rooms[sourceId];
  const layerId=Object.keys(s.layers)[0];
  const l=sourceLayerForContact(scene,room,layerId);
  assert.deepEqual(l.box,s.layers[layerId]);
  const v=[[200,700],[300,700],[300,760],[200,760]];
  const p=createContactProposal(scene,{roomId:room,layerId,vertices:v});
  assert.equal(p.protocol,CONTACT_PROTOCOL);
  assert.equal(p.areaPx2,6000);
  assert.equal(p.reviewStatus,"VISUAL_APPROVAL_REQUIRED");
  assert.equal(p.contactVerified,false);
  assert.equal(p.canPersist,false);
  assert.throws(()=>requireApprovedContact(p),e=>e.code==="FLOOR_CONTACT_NOT_APPROVED");
 }
});
test("reject crossing, degenerate, out of room, repeated and oversized footprints",()=>{
 const invalid=[
  [[10,10],[110,110],[10,110],[110,10]],
  [[10,10],[20,20],[30,30]],
  [[-1,10],[30,10],[30,30]],
  [[0,0],[4,0],[0,4]],
  [[0,0],[10,0],[10,0],[0,10]],
  Array.from({length:33},(_,i)=>[100+i*5,100]),
 ];
 for(const v of invalid)
  assert.throws(()=>validateContactPolygon(v),e=>["INVALID_CONTACT_POLYGON","CONTACT_POLYGON_DEGENERATE","CONTACT_POLYGON_SELF_INTERSECT"].includes(e.code));
});
test("independent proposals export only review data with valid immutable metadata",()=>{
 const proposal=createContactProposal(scene,{roomId:"bep",layerId:"banan_trong",vertices:[[470,700],[560,700],[560,770],[470,770]]});
 const out=buildReviewExport([proposal]);
 assert.equal(out.canPersist,false);assert.equal(out.proposals[0].status,"VISUAL_APPROVAL_REQUIRED");
 assert.equal(out.proposals[0].roomId,"bep");
 assert.deepEqual(out.proposals[0].vertices,proposal.vertices);
 assert.throws(()=>buildReviewExport([{...proposal,contactVerified:true}]),e=>e.code==="INVALID_CONTACT_EXPORT");
 assert.throws(()=>requireApprovedContact({...proposal,canPersist:true,contactVerified:true}),e=>e.code==="FLOOR_CONTACT_NOT_APPROVED");
});
test("cannot add invented rooms or layers",()=>{
 assert.throws(()=>sourceLayerForContact(scene,"invalid","x"),e=>e.code==="UNKNOWN_ROOM");
 assert.throws(()=>sourceLayerForContact(scene,"bep","fake_solid_floor"),e=>e.code==="UNKNOWN_LAYER");
});
