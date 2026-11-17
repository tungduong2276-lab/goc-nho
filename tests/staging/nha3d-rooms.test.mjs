import test from "node:test";
import assert from "node:assert/strict";
import { ROOM, DEFAULT_LAYOUT } from "../../nha3d/catalog.mjs";
import * as WD from "../../nha3d/world.mjs";
import * as E from "../../nha3d/engine.mjs";
import { ROOM_PRESETS, ROOM_LINKS } from "../../nha3d/rooms.mjs";
import { readPresence } from "../../nha3d/sync.mjs";

test("Giữ nguyên scene nhà cũ, sân cũ và thêm sáu không gian nội thất độc lập",()=>{
  assert.equal(WD.SCENES.nha,ROOM);
  assert.equal(WD.SCENES.san,WD.YARD);
  assert.equal(Object.keys(ROOM_PRESETS).length,6);
  assert.equal(Object.keys(WD.SCENES).length,8);
  assert.equal(DEFAULT_LAYOUT.items.find(x=>x.uid==="b1").type,"giuong");
  for(const id of ["hanh-lang","ngu","bep","bao-tang","xuong","phong-choi"])
    assert.ok(WD.SCENES[id]?.defaultLayout);
});

test("Bố cục các phòng hợp lệ, không chồng đồ đặc, lối cửa trong ranh giới phòng",()=>{
  for(const [name,room] of Object.entries(ROOM_PRESETS)){
    const layout=room.defaultLayout, used=new Set();
    for(const it of layout.items){
      assert.ok(!used.has(it.uid),name+": duplicate UID "+it.uid);
      used.add(it.uid);
      const other={...layout,items:layout.items.filter(x=>x.uid!==it.uid)};
      const check=E.validatePlacement(other,it,room,{legacy:true});
      assert.equal(check.ok,true,name+": "+it.uid+" "+check.reason);
    }
    const checked=E.sanitizeLayout(layout,room);
    assert.deepEqual(checked.dropped,[],name+": sanitation dropped items");
    assert.equal(checked.layout.items.length,layout.items.length);
    for(const d of WD.sceneDoors(name)){
      const c=E.worldToCell(d.from.x,d.from.z,room);
      const g=E.blockGrid(layout,room);
      assert.ok(E.nearestFreeCell(g,c.i,c.j,3),name+": inaccessible "+d.id);
      const spawn=WD.spawnFrom(name,d.to.scene);
      assert.ok(Math.abs(spawn.x)<room.w*.25&&Math.abs(spawn.z)<room.d*.25,name+": spawn outside");
    }
  }
});

test("Mọi phòng đi được hai chiều từ phòng khách, không tạo đảo tính năng mới",()=>{
  for(const id of Object.keys(ROOM_PRESETS)){
    const a=WD.nextPortal("san",id);
    assert.equal(a?.to.scene,"nha","sân phải đi qua cửa chính trước");
    assert.equal(WD.nextPortal(id,"san")?.to.scene,id==="hanh-lang"?"nha":"hanh-lang");
  }
  assert.equal(WD.nextPortal("nha","bao-tang")?.to.scene,"hanh-lang");
  assert.equal(WD.nextPortal("hanh-lang","bao-tang")?.to.scene,"bao-tang");
  assert.equal(WD.nextPortal("bao-tang","bao-tang"),null);
  assert.equal(WD.sceneDoors("hanh-lang").length,6);
  assert.equal(ROOM_LINKS.length,6);
});

test("Chuyển cảnh chỉ kích hoạt khi bước đúng hướng vào cửa",()=>{
  const door=WD.sceneDoors("hanh-lang").find(d=>d.to.scene==="bao-tang");
  assert.equal(WD.crossedPortal("hanh-lang",door.from.x,door.from.z,0,-1)?.to.scene,"bao-tang");
  assert.equal(WD.crossedPortal("hanh-lang",door.from.x,door.from.z,0,1),null);
  assert.equal(WD.crossedPortal("hanh-lang",door.from.x,door.from.z+2,0,-1),null);
  assert.equal(WD.crossedPortal("san",WD.DOOR_OUT.x,WD.DOOR_OUT.z,0,-1)?.to.scene,"nha");
  assert.equal(WD.crossedPortal("nha",WD.DOOR_IN.x,WD.DOOR_IN.z,0,1)?.to.scene,"san");
  assert.equal(WD.crossesDoor("san",WD.DOOR_OUT.x,WD.DOOR_OUT.z,0,-1),true);
});

test("Hiện diện người kia nhận phòng mới, từ chối scene lạ",()=>{
  const base={k:"presence",who:"anh",x:0,z:0,at:Date.now()};
  for(const id of Object.keys(WD.SCENES))assert.equal(readPresence({...base,scene:id})?.scene,id);
  for(const id of ["hen","not-a-room","../nha"])assert.equal(readPresence({...base,scene:id}),null);
});


test("Các cửa mặc định tới được bằng A*, kể cả nhà cũ và hành lang rộng",()=>{
  for(const [scene,room] of Object.entries(WD.SCENES)){
    const layout=room.defaultLayout||DEFAULT_LAYOUT;
    const G=E.blockGrid(layout,room);
    for(const door of WD.sceneDoors(scene)){
      const sp=WD.spawnFrom(scene,door.to.scene);
      assert.equal(E.circleBlocked(G,door.from.x,door.from.z,E.AVATAR_R,room),false,scene+": cửa bị đồ chặn: "+door.id);
      const path=E.worldPath(G,sp.x,sp.z,door.from.x,door.from.z,room);
      assert.ok(path?.length>=2,scene+": không thể tới cửa "+door.id);
    }
  }
});
