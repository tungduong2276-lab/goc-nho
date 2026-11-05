import {test} from "node:test";
import {strict as assert} from "node:assert";
import {readFileSync} from "node:fs";
import {BEDROOM_SPACIOUS_PILOT,bedroomClearanceReview} from "../../_xuong-3d/bedroom-spacious-pilot.js";
const source=readFileSync("_xuong-3d/rooms2.js","utf8");
const scene=JSON.parse(readFileSync("assets/3d/scene.json","utf8"));
test("bedroom source layout improves estimated corridor boundary without claiming true clearance",()=>{
  for(const room of ["phong_anh","phong_em"]){
    const x=bedroomClearanceReview(room);
    assert.ok(x.estimatedCenterRegionGainM2>0.1,room);
    assert.ok(x.newEstimatedObstructionM2<x.oldEstimatedObstructionM2);
    assert.equal(x.floorBoundaryVerified,false);
    assert.equal(x.physicalContactVerified,false);
    assert.equal(x.canPersist,false);
    const p=BEDROOM_SPACIOUS_PILOT[room];
    assert.equal(p.next.bed[0],p.old.bed[0]);
    assert.ok(p.next.bed[1]<p.old.bed[1],"bed moved rearward");
    assert.ok(p.next.bed[1]>=-2,"headboard + mattress must remain in 6x6 room shell");
    assert.equal(p.actorSpotsUnchanged,true);
  }
});
test("3D builder uses approved source points for beds and nonblocking rugs rather than CSS shifting",()=>{
  assert.match(source,/BEDROOM_SPACIOUS_PILOT\.phong_anh\.next\.bed/);
  assert.match(source,/BEDROOM_SPACIOUS_PILOT\.phong_em\.next\.bed/);
  assert.match(source,/BEDROOM_SPACIOUS_PILOT\.phong_anh\.next\.rug/);
  assert.match(source,/BEDROOM_SPACIOUS_PILOT\.phong_em\.next\.rug/);
  assert.match(source,/BEDROOM_SPACIOUS_PILOT\.phong_em\.next\.bear/);
  assert.ok(scene.rooms.phong_anh.items.giuong.st.includes("ngu"));
  assert.ok(scene.rooms.phong_em.items.giuong.st.includes("gon"));
  assert.deepEqual(scene.rooms.phong_em.spots.kecay.length,6);
});
test("the preview keeps all functional objects in shell and avoids overlapping character standing spots",()=>{
  for(const [room,p] of Object.entries(BEDROOM_SPACIOUS_PILOT)){
    for(const point of Object.values(p.next)){
      if(!Array.isArray(point))continue;
      assert.ok(point.every(Number.isFinite));
      assert.ok(point.every(n=>Math.abs(n)<2.9));
    }
    const spots=room==="phong_anh"?[[0.3,0.6],[1.6,1.4]]:[[0.3,0.4],[1.2,1.3]];
    for(const spot of spots){
      const [bedX,bedZ]=p.next.bed;
      assert.ok(Math.abs(spot[0]-bedX)>0.7||Math.abs(spot[1]-bedZ)>1.15);
    }
  }
  assert.throws(()=>bedroomClearanceReview("gac"),/UNKNOWN_BEDROOM/);
});
