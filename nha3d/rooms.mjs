import { ROOM_MOODS } from "./cozy-palette.mjs";

// V3 — các phòng có thể đi lại, nối bằng cửa. Chỉ dùng bố cục additive, không chuyển/xoá đồ cũ.
// IDs ổn định: mỗi phòng sở hữu bản lưu riêng; "nha" vẫn là phòng khách lịch sử.
const I = (uid, type, gx, gz, r = 0) => ({uid, type, gx, gz, r});
const wall = (uid, type, side, at) => ({uid, type, wall: side, at, r: 0});
const makeRoom = (id, items, w=16, d=14) => ({
  id, w, d, wallH: 2.7,
  // Cửa ở mép trước, dành lối thoát; hành lang có thêm các cửa ở mép sau.
  reserved: id === "hanh-lang"
    ? [[11,16],[12,16],[11,17],[12,17], ...[3,7,11,15,19].flatMap(i=>[[i,0],[i,1],[i+1,0],[i+1,1]])]
    : [[7,12],[8,12],[7,13],[8,13]],
  defaultLayout: {v:1, wall:ROOM_MOODS[id].wall, floor:ROOM_MOODS[id].floor, items}
});
export const ROOM_PRESETS = Object.freeze({
  "hanh-lang": makeRoom("hanh-lang",[
    I("hall-rug","thamLon",9,7),I("hall-light-l","denCay",1,6),
    I("hall-light-r","denCay",22,6),wall("hall-photo","khungAnh","L",5)
  ],24,18),
  ngu: makeRoom("ngu",[
    I("bed-bed","giuong",2,2),I("bed-closet","tuDo",11,2),
    I("bed-mirror","banTrangDiem",11,6),I("bed-cat","oMeo",3,9),
    I("bed-rug","thamTron",6,6),I("bed-light","denCay",13,10),
    wall("bed-window","cuaSo","R",3)
  ]),
  bep: makeRoom("bep",[
    I("kitchen-fridge","tuLanh",12,2),I("kitchen-stove","bepNau",9,2),
    I("kitchen-table","banAn",3,5),I("kitchen-date","huHenHo",7,2),
    I("kitchen-plant","chauLuoiHo",12,9),wall("kitchen-window","cuaSo","R",4)
  ]),
  "bao-tang": makeRoom("bao-tang",[
    I("museum-case-main","tuKinh",6,2),I("museum-case-left","tuKinh",2,5),
    I("museum-case-right","tuKinh",11,5),I("museum-chest","ruong",6,8),
    I("museum-book","keSach",2,2),I("museum-rug","thamTron",6,7),
    wall("museum-photo","khungAnh","R",4),wall("museum-map","banDo","L",4)
  ]),
  xuong: makeRoom("xuong",[
    I("studio-easel","giaVe",2,2),I("studio-palette","hopMau",4,5),
    I("studio-typewriter","mayDanhChu",10,2),
    I("studio-desk","banLamViec",9,6),I("studio-wishes","loUocMo",5,8),
    wall("studio-rules","bangGhim","L",3)
  ]),
  "phong-choi": makeRoom("phong-choi",[
    I("play-rug","thamTron",6,5),I("play-sofa","sofa",2,3),
    I("play-table","banTra",8,8),I("play-jar","huHenHo",11,2),
    I("play-radio","radio",12,4),I("play-cushion","dem",12,8),
    I("play-wishes","loUocMo",3,9),wall("play-board","bangGhim","L",2)
  ])
});
export const SCENE_LABELS = Object.freeze({
  san:"Ngoài sân",nha:"Phòng khách","hanh-lang":"Hành lang",
  ngu:"Phòng ngủ",bep:"Phòng bếp","bao-tang":"Bảo tàng",
  xuong:"Xưởng sáng tạo","phong-choi":"Phòng hoạt động"
});
// Hướng (nx,nz) chỉ ra hướng người chơi phải bước để đi xuyên qua cửa.
// Điểm cửa nằm ở vùng sàn có thể đi lại, không ở ngoài giới hạn phòng.
const endpoint=(scene,x,z,nx,nz)=>({scene,x,z,nx,nz});
export const ROOM_LINKS=Object.freeze([
  {id:"khach-hanh-lang",a:endpoint("nha",1.75,-2.35,0,-1),b:endpoint("hanh-lang",0,3.7,0,1)},
  {id:"hall-ngu",a:endpoint("hanh-lang",-4,-3.65,0,-1),b:endpoint("ngu",0,3,0,1)},
  {id:"hall-bep",a:endpoint("hanh-lang",-2,-3.65,0,-1),b:endpoint("bep",0,3,0,1)},
  {id:"hall-bao-tang",a:endpoint("hanh-lang",0,-3.65,0,-1),b:endpoint("bao-tang",0,3,0,1)},
  {id:"hall-xuong",a:endpoint("hanh-lang",2,-3.65,0,-1),b:endpoint("xuong",0,3,0,1)},
  {id:"hall-phong-choi",a:endpoint("hanh-lang",4,-3.65,0,-1),b:endpoint("phong-choi",0,3,0,1)}
]);
export function directedDoors(scene, links=ROOM_LINKS){
  return links.flatMap(link=>link.a.scene===scene?[{id:link.id,from:link.a,to:link.b,label:SCENE_LABELS[link.b.scene]}]:
    link.b.scene===scene?[{id:link.id,from:link.b,to:link.a,label:SCENE_LABELS[link.a.scene]}]:[]);
}
export function crossingDoor(scene,x,z,dx,dz,links=ROOM_LINKS){
  return directedDoors(scene,links).find(d=>Math.hypot(x-d.from.x,z-d.from.z)<0.65
    && dx*d.from.nx+dz*d.from.nz>0.3)||null;
}
export function nextDoor(scene,target,links=ROOM_LINKS){
  if(scene===target)return null;
  const queue=[[scene,null]], seen=new Set([scene]);
  while(queue.length){
    const [here,first]=queue.shift();
    for(const door of directedDoors(here,links)){
      const dest=door.to.scene;
      if(seen.has(dest))continue;
      const move=first||door;
      if(dest===target)return move;
      seen.add(dest);queue.push([dest,move]);
    }
  }
  return null;
}
export function entryPoint(scene,from,links=ROOM_LINKS){
  const door=directedDoors(scene,links).find(d=>d.to.scene===from);
  if(!door)return null;
  return {x:door.from.x-door.from.nx*1.15,z:door.from.z-door.from.nz*1.15,
    face:Math.atan2(-door.from.nx,-door.from.nz)};
}
