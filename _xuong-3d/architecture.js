/**
 * Góc Nhỏ: render-only spacious architectural studies from real Three.js
 * geometry, NOT scaled versions of existing WebP room art.
 *
 * Six actual ground meshes, rear-wall apertures, split wall segments, jambs,
 * door leaf swung out of the walking lane, contiguous corridor slabs.
 * Candidate furniture is recreated in 3D rather than enlarged old sprites.
 * Rendered images are review artifacts, not app/production replacements.
 */
import {THREE,C,piece,rbox,sphere,rcyl,makeScene,isoCamera,shoot,toPx} from "./lib.js";
import * as F from "./furn.js";
import {ARCH_ROOMS,ARCH_ROOM_ORDER,ARCH_DOOR,ARCH_RENDER,aperture,doorwayClear} from "./architecture-plan.js";

const group=()=>new THREE.Group();
function put(parent,w,h,d,col,x,y,z,options={}){
  return piece(rbox(w,h,d,Math.min(0.055,w*.18,h*.18,d*.18)),col,{
    parent,pos:[x,y,z],...options
  });
}
function cylinder(parent,r,h,col,x,y,z){
  return piece(rcyl(r,r*.95,h,0.025,24),col,{parent,pos:[x,y,z]});
}
function floorModel(parent,room){
  const n=room.width,d=room.depth,H=ARCH_DOOR.wallHeight,T=ARCH_DOOR.wallThickness;
  const half=n/2,halfD=d/2,opening=aperture(room.id);
  // Main physical floor: do not fake expansion through CSS scaling.
  put(parent,n+T,.48,d+T,room.base,-.09,-.24,-.08);
  put(parent,n,.065,d,room.floor,0,.015,0,{noOutline:true,receive:true,cast:false});
  if(room.id==="bep"){
    for(let x=-half+.5;x<half;x+=1)for(let z=-halfD+.5;z<halfD;z+=1){
      if((Math.floor(x+half)+Math.floor(z+half))%2===1)
        put(parent,.96,.009,.96,C.sky2,x,.055,z,{noOutline:true,cast:false});
    }
  } else for(let x=-half+.5;x<half;x+=.5)
    put(parent,.015,.009,d,room.base,x,.053,0,{noOutline:true,cast:false});
  // A complete rear-right wall is retained. The left one is THREE separate
  // structural solids: two legs plus a lintel. There is no invisible wall
  // mesh through the opening; floor and hall run continuously under it.
  put(parent,n+T,H,T,room.wallRight,-.07,H/2,-halfD-T/2);
  const gaps=[
    [-halfD,opening.zMin],
    [opening.zMax,halfD]
  ];
  for(const [a,b] of gaps)if(b-a>.01)
    put(parent,T,H,b-a,room.wallLeft,-half-T/2,H/2,(a+b)/2);
  put(parent,T,H-ARCH_DOOR.height,ARCH_DOOR.width,room.wallLeft,
    -half-T/2,ARCH_DOOR.height+(H-ARCH_DOOR.height)/2,ARCH_DOOR.centerZ);
  // Skirting is broken by exactly the same opening.
  for(const [a,b] of gaps)if(b-a>.01)
    put(parent,.045,.14,b-a,room.base,-half+.01,.09,(a+b)/2,{noOutline:true});
  put(parent,n,.14,.045,room.base,0,.09,-halfD+.03,{noOutline:true});
  return opening;
}
function corridorModel(parent,room,opening,time){
  const x=opening.wallX,z=ARCH_DOOR.centerZ;
  // Slabs overlap by 0.06 m around x=-4 and share exactly the same ground y.
  // There is a continuous physical floor, not a floating scene button.
  const left=x-ARCH_DOOR.hallDepth,right=x+.06;
  put(parent,right-left,.23,ARCH_DOOR.hallWidth,room.base,(left+right)/2,-.135,z,{receive:true});
  put(parent,right-left,.06,ARCH_DOOR.hallWidth,0xE8D7C5,(left+right)/2,.012,z,{noOutline:true,cast:false});
  const carpetLeft=left+.15,carpetRight=x+1.8;
  put(parent,carpetRight-carpetLeft,.033,1.01,room.id==="phong-em"?C.pinkL:C.butter,
    (carpetLeft+carpetRight)/2,.06,z,{noOutline:true,cast:false});
  // Side railings guide the hallway, without blocking the door opening.
  for(const side of [-1,1]){
    const edge=z+side*ARCH_DOOR.hallWidth/2;
    put(parent,right-left,.42,.10,room.base,(left+right)/2,.23,edge);
    put(parent,right-left,.07,.16,C.white,(left+right)/2,.48,edge);
  }
  // Door jambs and lintel are rendered ON the true cut wall.
  for(const edge of [opening.zMin,opening.zMax]){
    put(parent,.24,ARCH_DOOR.height,.10,C.white,x,.5*ARCH_DOOR.height,edge);
    put(parent,.27,.13,.14,room.base,x,2.05,edge);
  }
  put(parent,.28,.17,ARCH_DOOR.width+.14,C.white,x,ARCH_DOOR.height+.06,z);
  put(parent,.25,.11,ARCH_DOOR.width+.28,room.base,x,ARCH_DOOR.height+.21,z);
  // A hinged door swung 90 degrees INTO the side of the hall. Its leaf is
  // aligned with X, against the lower-z jamb, leaving the centre aisle free.
  const leaf=group();
  leaf.position.set(x-.05,0,opening.zMin-.08);
  put(leaf,1.18,2.08,.08,room.id==="phong-em"?C.pinkL:C.wood,
    -.57,1.04,0);
  cylinder(leaf,.055,.11,C.butterD,-.24,1.04,-.08);
  parent.add(leaf);
  // Tiny ceiling light, physically outside of the room.
  cylinder(parent,.15,.08,C.butter,(left+right)/2,2.48,z);
  const spark=piece(sphere(.065,12,8),C.white,{parent,pos:[(left+right)/2,2.36,z],
    emissive:C.butter,ei:time==="dem"?1.0:.4,noOutline:true});
  return spark;
}
function bed(parent,color){
  put(parent,1.57,.39,2.28,C.wood,0,.24,0);
  put(parent,1.47,.2,2.14,C.white,0,.49,0);
  put(parent,1.6,1.05,.17,C.wood,0,.59,-1.05);
  put(parent,1.46,.14,1.27,color,0,.66,.43);
  put(parent,.78,.13,.44,C.white,0,.69,-.67);
}
function desk(parent,color=C.wood){
  put(parent,1.2,.11,.72,color,0,.78,0);
  for(const x of [-.49,.49])for(const z of [-.23,.23])
    put(parent,.07,.7,.07,C.woodD,x,.38,z);
  put(parent,.5,.1,.36,C.sky2,-.15,.87,-.05);
  put(parent,.42,.32,.045,C.navy,-.15,1.07,-.19,{rot:[-.2,0,0]});
  cylinder(parent,.07,.12,C.pink,.41,.93,.10);
}
function cabinet(parent,w=1.0,color=C.white){
  put(parent,w,1.9,.62,color,0,.95,0);
  put(parent,.04,1.75,.65,C.stoneD,0,.96,.34,{noOutline:true});
  cylinder(parent,.035,.09,C.butterD,-.1,1.1,.355);
  cylinder(parent,.035,.09,C.butterD,.1,1.1,.355);
}
function table(parent,w=1.4){
  put(parent,w,.13,1.05,C.wood,0,.76,0);
  for(const x of [-w/2+.16,w/2-.16])for(const z of [-.38,.38])
    put(parent,.075,.72,.075,C.woodD,x,.36,z);
}
function plant(parent){
  cylinder(parent,.22,.32,C.pink,0,.17,0);
  for(let i=0;i<6;i++){
    const a=i*Math.PI/3;
    piece(sphere(.16,12,10),i%2?C.leaf:C.leafL,{
      parent,pos:[Math.cos(a)*.17,.46+(i%2)*.09,Math.sin(a)*.17],
      scale:[1,.55,1.6]});
  }
}
function easel(parent){
  for(const x of [-.4,.4])put(parent,.09,1.9,.09,C.woodD,x,.95,0,{rot:[0,0,x*.16]});
  put(parent,.095,1.55,.095,C.woodD,0,.8,-.4,{rot:[-.24,0,0]});
  put(parent,1.02,.78,.06,C.white,0,1.26,.08);
  put(parent,1.1,.1,.15,C.wood,0,.82,.10);
  piece(sphere(.2,14,10),C.sky,{parent,pos:[-.12,1.36,.14],scale:[1.7,.65,.2],noOutline:true});
  piece(sphere(.12,14,10),C.pink,{parent,pos:[.2,1.25,.15],scale:[1,.85,.2],noOutline:true});
}
function bookshelf(parent){
  for(const x of [-.62,.62])put(parent,.095,1.65,.58,C.woodD,x,.83,0);
  for(const y of [.12,.65,1.18,1.62])put(parent,1.36,.09,.58,C.wood,y?0:0,y,0);
  for(let i=0;i<10;i++)put(parent,.08,.32,.25,[C.pink,C.sky,C.butter,C.leaf][i%4],
    -.5+i*.11,.88,0);
}
function dresser(parent){
  table(parent,1.1);
  put(parent,.73,.75,.09,C.pinkL,0,1.56,-.21);
  put(parent,.55,.6,.045,C.sky3,0,1.55,-.15,{noOutline:true});
  cylinder(parent,.09,.15,C.pink,.32,.92,.12);
}
function frameScene(room,time){
  if(!doorwayClear(room.id))throw new Error("Furniture blocks architectural doorway in "+room.id);
  const scene=makeScene(time,{shadowSize:10,shadowRes:2048,shadowBlur:5});
  const shell=group();
  const door=floorModel(shell,room);
  corridorModel(shell,room,door,time);
  scene.add(shell);
  // A truly larger physical arrangement: object transforms are in world
  // units. No old cropped layer is enlarged or shifted to fake area.
  const draw=group();scene.add(draw);
  for(const o of room.objects){
    const instance=group();draw.add(instance);
    instance.position.set(o.x,0,o.z);
    switch(o.kind){
      case "sofa":instance.add(F.sofa());break;
      case "bantra":table(instance,1.25);break;
      case "kesach":bookshelf(instance);break;
      case "den":instance.add(F.floorLamp(time==="dem"));break;
      case "tulanh":cabinet(instance,.9);break;
      case "bepnau":put(instance,1.04,.9,.73,C.white,0,.47,0);put(instance,1.08,.09,.75,C.stoneD,0,.96,0);
        for(const x of [-.25,.25])cylinder(instance,.16,.03,C.navy,x,1.02,0);break;
      case "quaybep":put(instance,2.45,.87,.74,C.wood,0,.44,0);put(instance,2.5,.07,.78,C.white,0,.93,0);break;
      case "banan":table(instance,1.55);
        for(const side of [-1,1]){const chair=group();instance.add(chair);
          chair.position.x=side*1.02;
          put(chair,.42,.11,.4,C.pink,0,.46,0);
          put(chair,.1,.73,.42,C.white,side*.2,.7,0);
        }break;
      case "giuong":bed(instance,room.id==="phong-em"?C.pinkL:C.sky);break;
      case "banlamviec":desk(instance,C.white);break;
      case "tudo":cabinet(instance);break;
      case "sach":bookshelf(instance);break;
      case "bantrangdiem":dresser(instance);break;
      case "kecay":bookshelf(instance);break;
      case "hopnhatky":cabinet(instance,.56,C.petal);break;
      case "giave":easel(instance);break;
      case "maydanhchu":desk(instance,C.wood);break;
      case "hopmau":table(instance,.8);break;
      case "banthucong":table(instance,1.1);break;
      case "ruong":put(instance,1.05,.55,.66,C.wood,0,.28,0);
        put(instance,1.12,.12,.68,C.butterD,0,.63,0);break;
      case "tukinh":cabinet(instance,1.1,C.sky2);break;
      case "album":table(instance,.78);put(instance,.45,.05,.35,C.pink,0,.86,0);break;
      case "ghe":instance.add(F.cushion(C.pinkL));break;
      default:throw new Error("Unsupported candidate furniture: "+o.kind);
    }
  }
  // Appropriate decor is also 3D: back-wall window and nonblocking rug.
  const window=F.windowW({sky:time==="dem"?0x243858:0xBFE3FA,
    stars:time==="dem",moon:time==="dem",cloud:time!=="dem"});
  F.onWall(window,"R",1.2,1.7,room.width,room.depth);scene.add(window);
  if(room.id==="phong-khach"||room.id==="phong-em"||room.id==="goc-sang-tao"){
    const rug=F.rug(1.65);rug.position.set(1.0,0,.6);scene.add(rug);
  }
  const plant=F.pothos();plant.position.set(3.23,0,-1.6);scene.add(plant);
  return {scene,door};
}
function cam(){
  return isoCamera(ARCH_RENDER.width,ARCH_RENDER.height,
    ARCH_RENDER.ppm,ARCH_RENDER.target);
}
function meta(room,cam,door){
  const {width,depth}=room,px=p=>toPx(cam,p[0],p[1],p[2]);
  const floorCorners=[
    [-width/2,0,-depth/2],[width/2,0,-depth/2],
    [width/2,0,depth/2],[-width/2,0,depth/2]];
  const gate=ARCH_DOOR;
  return {
    id:room.id,title:room.title,
    size:[ARCH_RENDER.width,ARCH_RENDER.height],ppm:ARCH_RENDER.ppm,
    footprintMetres:[width,depth],areaSqm:width*depth,
    originalAreaSqm:room.id==="gac"?24:36,
    doorway:{wall:"L",widthMetres:gate.width,heightMetres:gate.height,
      threshold:door.threshold,inside:door.inside,outside:door.outside,
      floorPixels:px([door.threshold[0],0,door.threshold[1]]),
      insidePixels:px([door.inside[0],0,door.inside[1]]),
      outsidePixels:px([door.outside[0],0,door.outside[1]])},
    floorCornersPixels:floorCorners.map(px),
    furniture:room.objects.map(o=>({kind:o.kind,world:[o.x,o.z],
      px:px([o.x,0,o.z]),size:[o.w,o.d]})),
    note:"3D architectural visual prototype only: not production room metadata"
  };
}
export const jobs=Object.fromEntries(ARCH_ROOM_ORDER.map(id=>[id,async()=>{
  const room=ARCH_ROOMS[id],out=[],camera=cam();
  for(const time of ARCH_RENDER.times){
    const {scene}=frameScene(room,time);
    out.push({file:"kien_truc_"+id+"_"+time+"@3x.png",data:shoot(scene,camera)});
  }
  const {door}=frameScene(room,"ngay");
  out.push({file:"kien_truc_"+id+"_meta",meta:meta(room,camera,door)});
  return out;
}]));
