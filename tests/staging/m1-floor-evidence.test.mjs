import {test} from "node:test";
import {strict as assert} from "node:assert";
import {readFileSync} from "node:fs";
import {makeFloorAnnotation,buildFloorReviewBundle,requireApprovedFloorEvidence,FLOOR_EVIDENCE_PROTOCOL} from "../../src/house-floor-evidence.mjs";
import {ROOM_SOURCES} from "../../src/house-placement-preview.mjs";

const scene=JSON.parse(readFileSync("assets/3d/scene.json","utf8"));
const shape=[[360,540],[840,540],[840,990],[360,990]];
const reserve=[[550,800],[650,800],[650,880],[550,880]];
const make=(roomId,role,vertices=shape,layerId=null)=>
 makeFloorAnnotation({roomId,role,vertices,layerId},scene);
const fails=(fn,code)=>assert.throws(fn,e=>e.code===code);

test("six rooms need manual boundary and corridor evidence, never unlock persistence",()=>{
 const bundle=buildFloorReviewBundle(Object.keys(ROOM_SOURCES).map(id=>make(id,"floor")));
 assert.equal(bundle.protocol,FLOOR_EVIDENCE_PROTOCOL);
 assert.equal(bundle.readiness.length,6);
 for(const room of bundle.readiness){
  assert.deepEqual(room.missing,["doorway","walkway"]);
  assert.equal(room.status,"UNAPPROVED");
  assert.equal(room.canPersist,false);
 }
 assert.equal(bundle.canPersist,false);
 fails(()=>requireApprovedFloorEvidence(bundle),"FLOOR_GEOMETRY_NOT_APPROVED");
});
test("manual floor, threshold, walkway and existing furniture contact remain review only",()=>{
 const source=scene.rooms.phong_anh;
 const layerId=Object.keys(source.layers)[0];
 const bundle=buildFloorReviewBundle([
  make("phong-anh","floor"),
  make("phong-anh","doorway",reserve),
  make("phong-anh","walkway",reserve),
  make("phong-anh","fixed_contact",reserve,layerId)
 ]);
 const room=bundle.readiness.find(x=>x.roomId==="phong-anh");
 assert.deepEqual(room.missing,[]);
 assert.equal(room.reservesOutsideProposedFloor,false);
 assert.equal(room.canPersist,false);
 fails(()=>requireApprovedFloorEvidence({...bundle,status:"APPROVED",canPersist:true}),"FLOOR_GEOMETRY_NOT_APPROVED");
});
test("review flags doorway/walkway drawn outside proposed floor",()=>{
 const outside=[[10,10],[80,10],[80,80],[10,80]];
 const b=buildFloorReviewBundle([make("bep","floor"),make("bep","doorway",outside)]);
 assert.equal(b.readiness.find(x=>x.roomId==="bep").reservesOutsideProposedFloor,true);
 assert.equal(b.canPersist,false);
});
test("reject invalid roles, rooms, source layers and unexpected identifiers",()=>{
 fails(()=>make("fake","floor"),"UNKNOWN_ROOM");
 fails(()=>make("bep","approval"),"UNKNOWN_FLOOR_ROLE");
 fails(()=>make("bep","fixed_contact",reserve,"invented"),"UNKNOWN_CONTACT_LAYER");
 fails(()=>make("bep","walkway",reserve,"banan_trong"),"UNEXPECTED_LAYER_ID");
 fails(()=>make("bep","floor",[[0,0],[1,1],[2,2]]),"CONTACT_POLYGON_DEGENERATE");
});
test("reject fabricated approvals, duplicate furniture contacts and tampered geometry",()=>{
 const layerId=Object.keys(scene.rooms.phong_em.layers)[0];
 const entry=make("phong-em","fixed_contact",reserve,layerId);
 fails(()=>buildFloorReviewBundle([entry,entry]),"DUPLICATE_CONTACT_ANNOTATION");
 fails(()=>buildFloorReviewBundle([{...entry,canPersist:true}]),"UNTRUSTED_FLOOR_ANNOTATION");
 fails(()=>buildFloorReviewBundle([{...entry,reviewStatus:"APPROVED"}]),"UNTRUSTED_FLOOR_ANNOTATION");
 fails(()=>buildFloorReviewBundle([{...entry,areaPx2:1}]),"TAMPERED_FLOOR_AREA");
 fails(()=>buildFloorReviewBundle([{}]),"UNTRUSTED_FLOOR_ANNOTATION");
});
