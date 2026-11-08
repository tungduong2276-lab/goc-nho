import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {ROOM_FLOORS,SCENE_COORDINATES} from "../../src/living-world-floor-geometry.mjs";
import {
  ROOM_NAV,FOOT_CLEARANCE,pointInPolygon,walkable,clearSegment,walkPath,walkDistance
} from "../../src/living-world-nav.mjs";

const scene=JSON.parse(readFileSync(new URL("../../assets/3d/scene.json",import.meta.url),"utf8"));
const map={bep:"bep","phong-anh":"phong_anh","phong-em":"phong_em",
  "goc-sang-tao":"sang_tao",gac:"gac","khu-vuon":"khu_vuon"};
const closed=(a,b)=>Math.abs(a-b)<.001;
const area=poly=>Math.abs(poly.reduce((sum,p,i)=>{
  const q=poly[(i+1)%poly.length];return sum+p[0]*q[1]-q[0]*p[1];
},0))/2;
function selfIntersects(poly){
  const orient=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
  const intersect=(a,b,c,d)=>orient(a,b,c)*orient(a,b,d)<0&&orient(c,d,a)*orient(c,d,b)<0;
  for(let i=0;i<poly.length;i++)for(let j=i+1;j<poly.length;j++){
    if((i+1)%poly.length===j||(j+1)%poly.length===i)continue;
    if(intersect(poly[i],poly[(i+1)%poly.length],poly[j],poly[(j+1)%poly.length]))return true;
  }
  return false;
}
test("seven art-grounded floors and furniture are finite, bounded and non-self-intersecting",()=>{
  assert.deepEqual(Object.keys(ROOM_FLOORS).sort(),Object.keys(ROOM_NAV).sort());
  assert.equal(Object.keys(ROOM_FLOORS).length,7);
  assert.equal(SCENE_COORDINATES.width,1170);
  assert.equal(SCENE_COORDINATES.height,1170);
  for(const [room,layout] of Object.entries(ROOM_FLOORS)){
    for(const [id,poly] of [["floor",layout.floor],...Object.entries(layout.furniture)]){
      assert.ok(poly.length>=3,room+" "+id);
      for(const p of poly){
        assert.equal(p.length,2,room+" "+id);
        assert.ok(p.every(Number.isFinite),room+" "+id);
        assert.ok(p.every(c=>c>=0&&c<=1170),room+" "+id);
      }
      assert.ok(area(poly)>500,room+" "+id+" nonzero area");
      assert.equal(selfIntersects(poly),false,room+" "+id+" self-crossing");
    }
    assert.ok(walkable(room,layout.exit),room+" front edge exit must be reachable");
    assert.equal(ROOM_NAV[room].blocked.length,Object.keys(layout.furniture).length);
    assert.equal(Object.isFrozen(layout.floor),true,"cannot mutate shared navigation data");
    assert.equal(Object.isFrozen(layout.furniture),true,"cannot mutate shared obstacles");
  }
});
test("source interior art and scene metadata are present for every navigable space",()=>{
  assert.deepEqual(scene.room.size,[1170,1170]);
  for(const [slug,sceneId] of Object.entries(map)){
    const room=scene.rooms[sceneId];
    assert.deepEqual(room.size,[1170,1170],slug);
    assert.equal(room.spots.dung.length>=1,true,slug);
    for(const p of room.spots.dung){
      assert.ok(pointInPolygon(p,ROOM_FLOORS[slug].floor),slug+" character anchor should be on floor");
    }
  }
  assert.ok(pointInPolygon(scene.room.dung[0],ROOM_FLOORS["phong-khach"].floor));
});
test("real table and fixture bases are blocked but long sprite shadows are not",()=>{
  for(const [room,spec] of Object.entries(ROOM_FLOORS)){
    for(const [name,poly] of Object.entries(spec.furniture)){
      const middle=[poly.reduce((sum,p)=>sum+p[0],0)/poly.length,
        poly.reduce((sum,p)=>sum+p[1],0)/poly.length];
      if(pointInPolygon(middle,spec.floor))
        assert.equal(walkable(room,middle),false,room+" "+name+" base should block movement");
    }
  }
  assert.equal(walkable("bep",[582,691]),false,"dining table cannot be walked through");
  assert.equal(walkable("bep",[815,685]),false,"counter cannot be walked through");
  assert.equal(walkable("bep",[585,598.7]),true,"kitchen spawn remains safe");
  assert.equal(walkable("bep",[580,810]),true,"front open floor remains usable");
  assert.equal(walkable("bep",[205,710]),true,"new visible left-floor strip is walkable");
  assert.ok(FOOT_CLEARANCE>=8&&FOOT_CLEARANCE<=24);
});
test("rooms gain actual navigable surface, not CSS zooming or pass-through obstacles",()=>{
  const oldDiamond=[[585,444],[977,679],[585,919],[193,679]];
  for(const slug of ["phong-khach","bep","phong-anh","phong-em","goc-sang-tao"]){
    assert.ok(area(ROOM_FLOORS[slug].floor)>area(oldDiamond)*1.15,
      slug+" should add at least 15% potential floor surface");
  }
  for(const [slug,layout] of Object.entries(ROOM_FLOORS)){
    const base=slug==="phong-khach"?scene.room.dung[0]:scene.rooms[map[slug]].spots.dung[0];
    assert.ok(walkable(slug,base),slug+" standing anchor is safe");
    assert.ok(walkable(slug,layout.exit),slug+" open-front route is safe");
    const path=walkPath(slug,base,layout.exit);
    assert.ok(path?.length>=2,slug+" entrance must be reachable from standing point");
    assert.deepEqual(path[0],base);
    assert.deepEqual(path.at(-1),layout.exit);
    for(let i=1;i<path.length;i++){
      assert.ok(clearSegment(slug,path[i-1],path[i]),slug+" segment crosses furniture");
    }
    assert.ok(walkDistance(path)>=0);
  }
});
test("unknown room, malformed coordinates and out-of-scene taps remain refused",()=>{
  assert.equal(walkPath("wrong",[585,598],[200,700]),null);
  assert.equal(walkable("bep",[NaN,520]),false);
  assert.equal(walkable("bep",[Infinity,500]),false);
  assert.equal(walkable("bep",[-1,600]),false);
  assert.equal(walkable("bep",[1171,600]),false);
  assert.equal(walkable("bep",[585,1000]),false);
  assert.equal(closed(walkDistance([]),0),true);
});
