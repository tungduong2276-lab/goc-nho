import {test} from "node:test";
import {strict as assert} from "node:assert";
import {readFileSync} from "node:fs";
import {makeFloorProposalPreview} from "../../src/house-floor-review.mjs";
import {applyPreviewAction,PlacementPreviewError} from "../../src/house-placement-preview.mjs";
import {assertFurnitureFits,itemFootprint,FURNITURE_FOOTPRINTS,COLLISION_PROTOCOL} from "../../src/house-furniture-collision.mjs";

const scene=JSON.parse(readFileSync("assets/3d/scene.json","utf8"));
const fresh=()=>makeFloorProposalPreview(scene);
const place=(roomId,slotId,assetType="chair",id="one")=>({kind:"place",id,roomId,slotId,assetType});
const fails=(draft,action,code)=>assert.throws(()=>assertFurnitureFits(scene,draft,action),
 e=>e instanceof PlacementPreviewError && e.code===code);

test("five footprint types are finite and rotate 90 degrees correctly",()=>{
 assert.equal(Object.keys(FURNITURE_FOOTPRINTS).length,5);
 for(const type of Object.keys(FURNITURE_FOOTPRINTS)){
  const a=itemFootprint(type,0),b=itemFootprint(type,90);
  assert.ok(a.width>0&&a.height>0);
  assert.equal(b.width,a.height);assert.equal(b.height,a.width);
 }
 assert.deepEqual(itemFootprint("table",180),{width:130,height:90});
 assert.throws(()=>itemFootprint("table",45),e=>e.code==="INVALID_ROTATION");
 assert.throws(()=>itemFootprint("sofa"),e=>e.code==="UNKNOWN_ASSET");
});

test("all six proposed rooms can simulate a small chair without permitting persistence",()=>{
 let d=fresh();
 for(const roomId of ["phong-khach","bep","phong-anh","phong-em","goc-sang-tao","gac"]){
   const action=place(roomId,roomId+"-candidate-1","chair",roomId+"-chair");
   const result=assertFurnitureFits(scene,d,action);
   assert.equal(result.protocol,COLLISION_PROTOCOL);
   d=applyPreviewAction(d,action);
 }
 assert.equal(d.items.length,6);
 assert.equal(d.canPersist,false);
});

test("rejects items whose occupied rectangle crosses the room inset",()=>{
 const d=fresh();
 const edited={...d,slots:d.slots.map(s=>s.id==="bep-candidate-1"?{...s,x:30,y:725}:s)};
 fails(edited,place("bep","bep-candidate-1","table"),"FOOTPRINT_OUT_OF_BOUNDS");
});

test("blocks footprint near a real character standing anchor",()=>{
 const d=fresh();
 const edited={...d,slots:d.slots.map(s=>s.id==="phong-em-candidate-1"?{...s,x:577.1,y:713}:s)};
 fails(edited,place("phong-em","phong-em-candidate-1","plant"),"CHARACTER_COLLISION");
});

test("blocks another object's overlapping rectangle even with different slots",()=>{
 const d=fresh();
 const first=place("bep","bep-candidate-1","table","one");
 assertFurnitureFits(scene,d,first);
 const withFirst=applyPreviewAction(d,first);
 const edited={...withFirst,slots:withFirst.slots.map(s=>s.id==="bep-candidate-2"?{...s,x:360,y:725}:s)};
 fails(edited,place("bep","bep-candidate-2","chair","two"),"FURNITURE_COLLISION");
 // No mutation of the existing draft after rejection.
 assert.equal(withFirst.items.length,1);
});

test("rotating near an edge is validated against the new occupied size",()=>{
 const d=fresh();
 const edited={...d,slots:d.slots.map(s=>s.id==="gac-candidate-1"?{...s,x:70,y:730}:s)};
 const first={...place("gac","gac-candidate-1","table"),rotation:90};
 assertFurnitureFits(scene,edited,first); // rotated table half-width 45 + inset 24
 const placed=applyPreviewAction(edited,first);
 fails(placed,{kind:"rotate",id:"one",rotation:0},"FOOTPRINT_OUT_OF_BOUNDS");
});

test("rejects unapproved state transitions and invalid scene geometry",()=>{
 const d=fresh();
 const altered={...d,slots:d.slots.map(s=>s.id==="bep-candidate-1"?{...s,status:"APPROVED"}:s)};
 fails(altered,place("bep","bep-candidate-1"),"INVALID_SLOT_STATUS");
 fails(d,place("missing","missing-candidate-1"),"UNKNOWN_SLOT");
 fails(d,{kind:"teleport"},"INVALID_ACTION");
});
