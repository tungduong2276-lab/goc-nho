import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {walkable,clearSegment,walkDistance} from "../../src/living-world-nav.mjs";
import {
  V2_DOORS,V2_SLUGS,floorThreshold,pathToPorch,
  arrivalFromCorridor,hallRoute
} from "../../src/living-world-transitions.mjs";

const scene=JSON.parse(readFileSync(new URL("../../assets/3d/scene.json",import.meta.url),"utf8"));
const sceneRooms={"phong-khach":null,"bep":"bep","phong-anh":"phong_anh",
  "phong-em":"phong_em","goc-sang-tao":"sang_tao",
  "gac":"gac","khu-vuon":"khu_vuon"};
test("seven distinct portal identities match seven real isometric scenes",()=>{
  assert.deepEqual(V2_SLUGS.sort(),Object.keys(sceneRooms).sort());
  assert.equal(new Set(V2_DOORS.map(d=>d.id)).size,7);
  assert.equal(Object.isFrozen(V2_DOORS),true);
  for(const door of V2_DOORS){
    assert.ok(door.label.length>0);
    assert.ok(door.emoji.length>0);
    assert.ok(door.x>=0&&door.x<=100);
    assert.ok(door.y>=0&&door.y<=100);
  }
});
test("walking to the shared porch follows collision-safe floor segments in all rooms",()=>{
  for(const [slug,key] of Object.entries(sceneRooms)){
    const start=key?scene.rooms[key].spots.dung[0]:scene.room.dung[0];
    const exit=floorThreshold(slug);
    assert.ok(exit,"missing walkable exit for "+slug);
    assert.ok(walkable(slug,exit),slug+" exit is on physical floor");
    assert.ok(walkable(slug,start),slug+" spawn is safe");
    const path=pathToPorch(slug,start);
    assert.ok(path?.length>=2,slug+" porch is not physically reachable");
    assert.deepEqual(path[0],start,slug+" starts at current avatar");
    assert.deepEqual(path.at(-1),exit,slug+" must arrive at ground threshold");
    assert.ok(walkDistance(path)>0,slug+" cannot teleport to corridor");
    for(let i=1;i<path.length;i++){
      assert.ok(clearSegment(slug,path[i-1],path[i]),slug+" crosses furniture");
    }
    assert.deepEqual(arrivalFromCorridor(slug),exit);
  }
});
test("each pair of rooms is reachable through a stable central corridor",()=>{
  for(const source of V2_SLUGS)for(const target of V2_SLUGS){
    const path=hallRoute(source,target);
    assert.equal(path.length,4,source+" -> "+target);
    assert.deepEqual(path[0],[50,93]);
    assert.deepEqual(path[1],[50,72]);
    assert.ok(path.every(p=>p.every(Number.isFinite)));
    assert.ok(path.every(p=>p.every(v=>v>=0&&v<=100)));
    assert.equal(Object.isFrozen(path),true);
    assert.deepEqual(hallRoute(source,target),path,"deterministic path");
  }
});
test("invalid or out-of-bounds room transitions are rejected, not rendered",()=>{
  assert.equal(floorThreshold("fake"),null);
  assert.equal(arrivalFromCorridor("fake"),null);
  assert.equal(pathToPorch("bep",[NaN,900]),null);
  assert.equal(pathToPorch("bep",[585,-80]),null);
  assert.equal(hallRoute("unknown","bep"),null);
  assert.equal(hallRoute("bep","unknown"),null);
});
test("corridor and porch have no direct Firebase/write/persistence path",()=>{
  for(const path of ["src/living-world-hallway.mjs","src/living-world-transitions.mjs"]){
    const source=readFileSync(new URL("../../"+path,import.meta.url),"utf8");
    assert.doesNotMatch(source,/\b(?:firebase|firestore|putMeta|setDoc|updateDoc|localStorage|sessionStorage)\s*\(/i);
    assert.doesNotMatch(source,/\b(?:fetch|XMLHttpRequest|WebSocket)\s*\(/);
  }
});
