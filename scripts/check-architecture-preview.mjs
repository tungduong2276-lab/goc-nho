// Validate the 3D OUTPUTS, not merely the source parameters. CI calls this
// after Playwright WebGL renders six day/night architectural candidates.
import {readFileSync,statSync,existsSync} from "node:fs";
import {resolve,join} from "node:path";
import assert from "node:assert/strict";
import {ARCH_ROOMS,ARCH_ROOM_ORDER,ARCH_DOOR,ARCH_RENDER} from "../_xuong-3d/architecture-plan.js";

const out=resolve(process.argv[2]||"out_arch");
const metadata=JSON.parse(readFileSync(join(out,"meta.json"),"utf8"));
for(const id of ARCH_ROOM_ORDER){
  const room=ARCH_ROOMS[id],key="kien_truc_"+id+"_meta";
  const m=metadata[key];assert.ok(m,"missing actual render metadata "+key);
  assert.deepEqual(m.size,[ARCH_RENDER.width,ARCH_RENDER.height]);
  assert.deepEqual(m.footprintMetres,[room.width,room.depth]);
  assert.equal(m.areaSqm,room.width*room.depth);
  assert.ok(m.areaSqm>m.originalAreaSqm*1.7);
  assert.equal(m.doorway.widthMetres,ARCH_DOOR.width);
  assert.equal(m.doorway.heightMetres,ARCH_DOOR.height);
  assert.equal(m.furniture.length,room.objects.length);
  const all=[...m.floorCornersPixels,m.doorway.floorPixels,
    m.doorway.insidePixels,m.doorway.outsidePixels,...m.furniture.map(f=>f.px)];
  for(const p of all){
    assert.ok(Array.isArray(p)&&p.length===2&&p.every(Number.isFinite),
      id+" projected coordinate invalid");
    assert.ok(p.every(value=>value>=0&&value<=1170),
      id+" model is clipped by preview camera at "+JSON.stringify(p));
  }
  const t=m.doorway;
  assert.ok(Math.hypot(t.insidePixels[0]-t.outsidePixels[0],
    t.insidePixels[1]-t.outsidePixels[1])>55,id+" doorway is only decorative");
  for(const time of ARCH_RENDER.times){
    const filename=join(out,"kien_truc_"+id+"_"+time+"@3x.png");
    assert.ok(existsSync(filename),filename+" not rendered");
    assert.ok(statSync(filename).size>12000,filename+" seems blank");
  }
  process.stdout.write(id+": "+m.areaSqm+" m² (old "+m.originalAreaSqm+
    "), 1.5m open doorway, both lighting renders OK\n");
}
console.log("PASS: all six physically larger Three.js rooms rendered with valid projected door/floor coordinates.");
