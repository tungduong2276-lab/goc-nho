/**
 * Validate generated preview gallery stays aligned with reviewed Three.js
 * source geometry. This runs in CI before browsers load the images.
 */
import assert from "node:assert/strict";
import {readFileSync,statSync} from "node:fs";
import {resolve,join} from "node:path";
import {createHash} from "node:crypto";
import {ARCH_ROOM_ORDER,ARCH_ROOMS,ARCH_DOOR} from "../_xuong-3d/architecture-plan.js";

const base=resolve("assets/3d/v2arch");
const manifest=JSON.parse(readFileSync(join(base,"preview.json"),"utf8"));
const sourceFiles=["_xuong-3d/architecture-plan.js","_xuong-3d/architecture.js",
  "_xuong-3d/lib.js","_xuong-3d/furn.js","_xuong-3d/run.js",
  "scripts/pack-architecture-preview.py"];
const hash=createHash("sha256");
for(const file of sourceFiles){hash.update(file,"utf8");hash.update(readFileSync(resolve(file)));}
assert.equal(manifest.sourceHash,hash.digest("hex"),"3D assets are stale versus renderer source");
assert.equal(manifest.schemaVersion,1);
assert.equal(manifest.mode,"render-only");
assert.deepEqual(manifest.canvas,[1170,1170]);
assert.deepEqual(Object.keys(manifest.rooms).sort(),[...ARCH_ROOM_ORDER].sort());
for(const slug of ARCH_ROOM_ORDER){
  const room=manifest.rooms[slug],source=ARCH_ROOMS[slug];
  assert.ok(room&&room.title);
  assert.equal(room.areaSqm,source.width*source.depth);
  assert.ok(room.areaSqm>room.originalAreaSqm*1.7);
  assert.equal(room.doorway.widthMetres,ARCH_DOOR.width);
  assert.equal(room.doorway.heightMetres,ARCH_DOOR.height);
  assert.equal(room.furniture.length,source.objects.length);
  for(const key of ["floorPixels","insidePixels","outsidePixels"]){
    const p=room.doorway[key];
    assert.ok(Array.isArray(p)&&p.length===2&&p.every(x=>Number.isFinite(x)&&x>=0&&x<=1170),slug+" "+key);
  }
  assert.equal(room.floorCornersPixels.length,4);
  for(const time of ["ngay","dem"]){
    const filename=room.images[time];
    assert.equal(filename,slug+"_"+time+".webp");
    const file=readFileSync(join(base,filename));
    assert.ok(file.length>1200,filename+" missing or suspiciously tiny");
    assert.equal(file.toString("ascii",0,4),"RIFF");
    assert.equal(file.toString("ascii",8,12),"WEBP");
    assert.equal(file.readUInt32LE(4)+8,file.length,"invalid WebP RIFF length");
  }
}
console.log("PASS: 12 local V2 architecture WebPs match renderer fingerprint, metric floor/camera/door metadata and safe namespace");
