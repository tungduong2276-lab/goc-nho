import {test} from "node:test";
import {strict as assert} from "node:assert";
import {readFileSync} from "node:fs";
import {makeFloorProposalPreview} from "../../src/house-floor-review.mjs";
import {applyPreviewAction} from "../../src/house-placement-preview.mjs";
import {assertWithinProposedZones,ROOM_ZONE_PROPOSALS,ZONE_PROTOCOL} from "../../src/house-room-zones.mjs";

const scene=JSON.parse(readFileSync("assets/3d/scene.json","utf8"));
const draft=()=>makeFloorProposalPreview(scene);
const place=(room,slot=1,type="chair")=>({kind:"place",id:"one",roomId:room,slotId:room+"-candidate-"+slot,assetType:type});
const rejects=(d,a,z,code)=>assert.throws(()=>assertWithinProposedZones(d,a,z),e=>e.code===code);
test("six provisional room maps have two candidate polygons and explicitly lack furniture certification",()=>{
 assert.equal(Object.keys(ROOM_ZONE_PROPOSALS).length,6);
 for(const [room,z] of Object.entries(ROOM_ZONE_PROPOSALS)){
  assert.equal(z.roomId,room);assert.equal(z.candidateFloor.length,2);
  assert.equal(z.exclusions.length,0);assert.equal(z.bakedFurnitureCertified,false);
  for(const polygon of z.candidateFloor)assert.ok(polygon.length>=3);
  const d=draft();
  for(const n of [1,2]){
   const result=assertWithinProposedZones(d,place(room,n));
   assert.equal(result.protocol,ZONE_PROTOCOL);
   assert.equal(result.bakedFurnitureCertified,false);
  }
 }
});
test("all five footprints fit both proposal cells while preserving no persistence",()=>{
 const d=draft();
 for(const room of Object.keys(ROOM_ZONE_PROPOSALS))
  for(const type of ["chair","table","lamp","plant","rug"])
   for(const slot of [1,2])
    assert.equal(assertWithinProposedZones(d,place(room,slot,type)).reviewStatus,"PROPOSED_NOT_APPROVED");
 assert.equal(d.canPersist,false);
});
test("rejects footprint outside candidate polygons even if still inside image",()=>{
 const d=draft();
 const slots=d.slots.map(x=>x.id==="bep-candidate-1"?{...x,x:250,y:400}:x);
 rejects({...d,slots},place("bep"),ROOM_ZONE_PROPOSALS,"OUTSIDE_PROPOSED_FLOOR");
});
test("rejects invalid geometry and missing room-zone maps",()=>{
 const d=draft();
 rejects(d,place("bep"),{...ROOM_ZONE_PROPOSALS,bep:{...ROOM_ZONE_PROPOSALS.bep,candidateFloor:[]}},"INVALID_ZONE_MAP");
 rejects(d,place("bep"),{}, "INVALID_ZONE_MAP");
 rejects(d,place("unknown"),ROOM_ZONE_PROPOSALS,"UNKNOWN_ROOM");
});
test("explicit exclusion polygon rejects any intersecting furniture footprint",()=>{
 const d=draft();
 const original=ROOM_ZONE_PROPOSALS.bep;
 const z={...ROOM_ZONE_PROPOSALS,bep:{...original,exclusions:[[[275,700],[325,700],[325,750],[275,750]]]}};
 rejects(d,place("bep"),z,"ZONE_EXCLUSION_COLLISION");
 // The other slot remains available; rejected validation never alters state.
 assert.equal(assertWithinProposedZones(d,place("bep",2),z).roomId,"bep");
 assert.equal(d.items.length,0);
});
test("moving and rotating use target geometry; action identity cannot select another room",()=>{
 const d=draft();
 const placed=applyPreviewAction(d,place("phong-em"));
 assert.equal(assertWithinProposedZones(placed,{kind:"move",id:"one",slotId:"phong-em-candidate-2"}).roomId,"phong-em");
 assert.equal(assertWithinProposedZones(placed,{kind:"rotate",id:"one",rotation:90}).roomId,"phong-em");
 rejects(placed,{kind:"move",id:"one",slotId:"bep-candidate-1"},ROOM_ZONE_PROPOSALS,"UNKNOWN_SLOT");
});
