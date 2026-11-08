import {test} from "node:test";
import assert from "node:assert/strict";
import {ARCH_ROOMS,ARCH_ROOM_ORDER,ARCH_DOOR,ARCH_RENDER,aperture,
  footprintContains,doorwayClear} from "../../_xuong-3d/architecture-plan.js";

const originals={"phong-khach":36,bep:36,"phong-anh":36,"phong-em":36,
  "goc-sang-tao":36,gac:24};
test("all six actual rooms have larger 3D ground area, not 2D CSS enlargement",()=>{
  assert.deepEqual(Object.keys(ARCH_ROOMS).sort(),Object.keys(originals).sort());
  assert.equal(ARCH_ROOM_ORDER.length,6);
  for(const [id,room] of Object.entries(ARCH_ROOMS)){
    assert.ok(room.width>=8,id+" room must be at least 8m wide");
    assert.ok(room.depth>=7,id+" depth at least 7m");
    assert.ok(room.width*room.depth>originals[id]*1.7,id+" physical area increase");
    assert.equal(Object.isFrozen(room),true);
    assert.ok(room.objects.length>=4,id+" is not an empty mock room");
  }
  assert.equal(ARCH_RENDER.width,1170);
  assert.equal(ARCH_RENDER.height,1170);
  assert.deepEqual(ARCH_RENDER.times,["ngay","dem"]);
});
test("physical door is a 1.5m-wide true wall opening, with 2.25m human passage",()=>{
  assert.equal(ARCH_DOOR.width,1.5);
  assert.ok(ARCH_DOOR.height>=2.1);
  assert.ok(ARCH_DOOR.wallHeight>ARCH_DOOR.height);
  for(const id of ARCH_ROOM_ORDER){
    const room=ARCH_ROOMS[id],door=aperture(id);
    const left=-room.width/2;
    assert.equal(door.wallX,left);
    assert.equal(door.zMax-door.zMin,ARCH_DOOR.width);
    assert.ok(door.zMin>-room.depth/2&&door.zMax<room.depth/2);
    assert.ok(door.inside[0]>left&&door.outside[0]<left);
    assert.equal(door.hall[1],door.threshold[1]);
    assert.ok(door.hallBounds.maxX>door.wallX);
    assert.ok(door.hallBounds.minX<door.outside[0]);
    assert.ok(door.hallBounds.minZ<door.zMin&&door.hallBounds.maxZ>door.zMax);
  }
});
test("furniture footprints stay entirely on their expanded floor and away from entrance aisle",()=>{
  for(const room of Object.values(ARCH_ROOMS)){
    for(const o of room.objects){
      assert.ok(Number.isFinite(o.x)&&Number.isFinite(o.z));
      assert.ok(o.w>0&&o.d>0);
      assert.ok(o.x-o.w/2> -room.width/2+0.05,room.id+" "+o.kind+" outside left edge");
      assert.ok(o.x+o.w/2<room.width/2-0.05,room.id+" "+o.kind+" outside right edge");
      assert.ok(o.z-o.d/2> -room.depth/2+0.05,room.id+" "+o.kind+" outside back edge");
      assert.ok(o.z+o.d/2<room.depth/2-0.05,room.id+" "+o.kind+" outside front edge");
    }
    assert.equal(doorwayClear(room.id,.15),true,room.id+" entrance aisle blocked");
  }
});
test("walking space can enter from outside hall without crossing walls or furniture",()=>{
  const delta=.10;
  for(const id of ARCH_ROOM_ORDER){
    const room=ARCH_ROOMS[id],door=aperture(id);
    const centerZ=ARCH_DOOR.centerZ;
    for(let x=door.hall[0];x<=door.inside[0]+.8;x+=delta){
      const onFloor=x>=door.floorBounds.minX;
      const inHall=x<=door.hallBounds.maxX&&
        centerZ>door.hallBounds.minZ&&centerZ<door.hallBounds.maxZ;
      assert.ok(onFloor||inHall,id+" physical floor gap at x="+x.toFixed(2));
      // At the back-wall plane, pass ONLY through the aperture (no painted doorway).
      if(Math.abs(x-door.wallX)<ARCH_DOOR.wallThickness){
        assert.ok(centerZ>door.zMin&&centerZ<door.zMax);
      }
      assert.ok(room.objects.every(o=>!footprintContains(o,[x,centerZ],.12)),
        id+" obstacle in corridor at x="+x.toFixed(2));
    }
  }
});
test("rejects unknown geometry identifiers and malformed points",()=>{
  assert.equal(aperture("missing"),null);
  assert.equal(doorwayClear("missing"),false);
  assert.equal(footprintContains(null,[0,0]),false);
  assert.equal(footprintContains({x:0,z:0,w:1,d:1},[NaN,0]),false);
  assert.equal(footprintContains({x:0,z:0,w:1,d:1},[0,0],-1),false);
});
