/**
 * Góc Nhỏ M1 — real 3D candidate floor geometry, NOT live room coordinates.
 * World coordinates are in metres. A physically empty aperture is cut from
 * the x=-width/2 wall; the outside hall slab overlaps the inside floor and
 * the approach route passes through open air under the door lintel.
 *
 * No production assets or Firebase state depend on these prototypes yet.
 */
const furniture=(kind,x,z,w,d)=>Object.freeze({kind,x,z,w,d});
const config=[
  ["phong-khach","Phòng khách",8,8,0xF5E8DA,0xE7F7F3,0xF4FAFF,0xD7B9A4,[
    furniture("sofa",-2.3,-1.45,1.25,2.0),furniture("bantra",0.9,0.6,1.3,1.2),
    furniture("kesach",2.7,-3.35,1.25,0.65),furniture("den",3.0,2.75,0.5,0.5)]],
  ["bep","Bếp",8,8,0xECF8FC,0xFDF5EA,0xECF9FF,0xBBD5DF,[
    furniture("tulanh",-2.6,-3.25,0.9,0.8),furniture("bepnau",-1.25,-3.25,1.05,0.75),
    furniture("quaybep",1.7,-3.3,2.5,0.7),furniture("banan",1.1,1.15,2.5,1.2)]],
  ["phong-anh","Phòng Anh",8,8,0xE9F5FD,0xF4FAFF,0xF1F6FA,0xC5D5E4,[
    furniture("giuong",-2.15,-1.6,1.55,2.25),furniture("banlamviec",2.45,-3.35,1.35,0.65),
    furniture("tudo",-0.5,-3.35,1.05,0.65),furniture("sach",2.7,2.4,0.7,0.7)]],
  ["phong-em","Phòng Em",8,8,0xFCEAF3,0xFFF8FC,0xF8E6F0,0xDBB5C9,[
    furniture("giuong",-2.15,-1.5,1.55,2.25),furniture("bantrangdiem",1.65,-3.35,1.0,0.65),
    furniture("kecay",3.05,1.0,0.55,1.2),furniture("hopnhatky",-0.5,-3.3,0.65,0.65)]],
  ["goc-sang-tao","Góc sáng tạo",8,8,0xFFF8D9,0xFFFDF4,0xF6E6CF,0xD6B996,[
    furniture("giave",-1.55,-1.6,0.8,0.8),furniture("maydanhchu",2.55,-3.35,1.0,0.7),
    furniture("hopmau",0.55,-3.3,0.8,0.6),furniture("banthucong",1.1,1.35,1.1,1.1)]],
  ["gac","Gác kỷ niệm",8,7,0xF4DEC6,0xFDF3E4,0xEFDCC3,0xBD936D,[
    furniture("ruong",1.6,1.5,1.05,0.65),furniture("tukinh",-2.25,-2.9,1.15,0.55),
    furniture("album",0.4,-2.85,0.8,0.6),furniture("ghe",-2.0,-0.1,0.9,0.9)]]
];
export const ARCH_DOOR=Object.freeze({
  wall:"left",centerZ:1.85,width:1.5,height:2.25,wallHeight:2.8,wallThickness:0.2,
  hallDepth:2.35,hallWidth:2.5
});
export const ARCH_ROOM_ORDER=Object.freeze(config.map(row=>row[0]));
export const ARCH_ROOMS=Object.freeze(Object.fromEntries(config.map(
  ([id,title,width,depth,wallLeft,wallRight,floor,base,objects])=>[id,Object.freeze({
    id,title,width,depth,wallLeft,wallRight,floor,base,
    objects:Object.freeze(objects)
  })])));
export const ARCH_RENDER=Object.freeze({
  width:1170,height:1170,ppm:84,target:Object.freeze([-0.65,1.12,0.1]),
  times:Object.freeze(["ngay","dem"])
});
export function aperture(roomId){
  const r=ARCH_ROOMS[roomId];if(!r)return null;
  const x=-r.width/2,z=ARCH_DOOR.centerZ;
  return Object.freeze({
    wallX:x,zMin:z-ARCH_DOOR.width/2,zMax:z+ARCH_DOOR.width/2,
    inside:Object.freeze([x+0.95,z]),
    threshold:Object.freeze([x,z]),
    outside:Object.freeze([x-1.2,z]),
    hall:Object.freeze([x-2.0,z]),
    floorBounds:Object.freeze({minX:-r.width/2,maxX:r.width/2,minZ:-r.depth/2,maxZ:r.depth/2}),
    hallBounds:Object.freeze({minX:x-ARCH_DOOR.hallDepth,maxX:x+0.06,
      minZ:z-ARCH_DOOR.hallWidth/2,maxZ:z+ARCH_DOOR.hallWidth/2})
  });
}
export function footprintContains(o,[x,z],pad=0){
  if(!o||!Number.isFinite(x)||!Number.isFinite(z)||!Number.isFinite(pad)||pad<0)return false;
  return Math.abs(x-o.x)<=o.w/2+pad&&Math.abs(z-o.z)<=o.d/2+pad;
}
export function doorwayClear(roomId,pad=0.15) {
  const room=ARCH_ROOMS[roomId],door=aperture(roomId);
  if(!door)return false;
  // Validate a 1.2-metre-wide aisle at multiple x positions, not just a
  // single artificial centreline. The passage remains physically useful.
  for(const x of [door.inside[0],door.inside[0]+0.45,door.inside[0]+0.9])
    for(const z of [ARCH_DOOR.centerZ-.3,ARCH_DOOR.centerZ,ARCH_DOOR.centerZ+.3])
      if(room.objects.some(o=>footprintContains(o,[x,z],pad)))return false;
  return true;
}
