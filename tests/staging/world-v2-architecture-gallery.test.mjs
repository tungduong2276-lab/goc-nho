import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
import {resolve} from "node:path";
import {ARCH_ROOM_ORDER,ARCH_ROOMS,ARCH_DOOR} from "../../_xuong-3d/architecture-plan.js";

const repo=resolve(".");
const base=resolve("assets/3d/v2arch");
const read=file=>readFileSync(resolve(repo,file),"utf8");
test("12 real gallery assets and metric floor/corridor metadata remain in isolated V2 folder",()=>{
  const file=resolve(base,"preview.json");
  assert.ok(existsSync(file),"render/pack before running staging tests");
  const m=JSON.parse(readFileSync(file,"utf8"));
  assert.equal(m.mode,"render-only");
  assert.equal(m.schemaVersion,1);
  assert.deepEqual(m.canvas,[1170,1170]);
  assert.deepEqual(Object.keys(m.rooms).sort(),[...ARCH_ROOM_ORDER].sort());
  for(const slug of ARCH_ROOM_ORDER){
    const room=m.rooms[slug],plan=ARCH_ROOMS[slug];
    assert.equal(room.areaSqm,plan.width*plan.depth);
    assert.ok(room.areaSqm>room.originalAreaSqm);
    assert.equal(room.doorway.widthMetres,ARCH_DOOR.width);
    assert.equal(room.furniture.length,plan.objects.length);
    assert.ok(room.floorCornersPixels.length>=4);
    for(const light of ["ngay","dem"]){
      const filename=slug+"_"+light+".webp";
      assert.equal(room.images[light],filename);
      assert.ok(existsSync(resolve(base,filename)),filename);
    }
  }
});
test("viewer is strictly read-only and gated by two explicit query flags",()=>{
  const code=read("src/living-world-architecture-preview.mjs");
  assert.match(code,/qs\.get\("world2"\)==="1"/);
  assert.match(code,/qs\.get\("archpreview"\)==="1"/);
  assert.match(code,/cloudWrites:false/);
  assert.doesNotMatch(code,/\b(?:firebase|Firestore|DB\.collection|setDoc|addDoc|updateDoc|deleteDoc|localStorage|sessionStorage)\s*[.(]/i);
  assert.doesNotMatch(code,/window\.location\.hash\s*=/);
  assert.doesNotMatch(code,/\.room3d\s*\.replaceChildren|\.wcanvas\s*\.innerHTML/);
});
test("all legacy 3D background art stays loaded by the original app",()=>{
  const s=read("index.html");
  for(const item of ["roomSceneHTML(r)","assets/3d/scene.json","renderRooms()"]){
    assert.ok(s.includes(item),item+" must remain untouched");
  }
  assert.ok(s.includes('src="./src/living-world-architecture-preview.mjs"'));
});
