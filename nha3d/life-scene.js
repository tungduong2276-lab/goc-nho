// Hai góc chơi cố định ngoài sân, không thuộc layout, không sửa vị trí đồ hai người đã lưu.
// Các chậu hoa/nhà vẫn dùng raycast ưu tiên; hai góc này chỉ nằm trên vùng sân trống mặc định.
import * as THREE from "three";
import { C, piece, rbox, rcyl, sphere, torus } from "./xuong/lib.js";
import { COZY } from "./cozy-palette.mjs";

const g=()=>new THREE.Group();
const mark=(root,kind)=>{root.traverse(n=>{n.userData.lifeSpot=kind;});root.userData.lifeSpot=kind;return root;};

export function chickenYard(){
  const root=g();
  piece(rbox(1.85,0.12,1.35,0.07),COZY.mint,{pos:[0,0.05,0],parent:root});
  // Chuồng mái hồng và cửa vòm xanh
  piece(rbox(1.3,0.96,0.95,0.12),COZY.cream,{pos:[0,.56,-.15],parent:root});
  piece(rbox(1.52,.13,1.13,.09),COZY.pink,{pos:[0,1.13,-.15],parent:root});
  piece(rbox(.48,.6,.07,.1),COZY.blue,{pos:[0,.44,.36],parent:root});
  for(const [x,z,color] of [[-.55,.42,0xFFF4DE],[.5,.4,COZY.cream]]){
    const bird=g();bird.position.set(x,.22,z);root.add(bird);
    piece(sphere(.19,14,10),color,{pos:[0,.13,0],parent:bird});
    piece(sphere(.11,12,9),color,{pos:[.08,.31,.04],parent:bird});
    piece(sphere(.045,8,6),C.butter,{pos:[.17,.3,.11],parent:bird});
    piece(sphere(.02,8,6),C.navy,{pos:[.12,.33,.13],parent:bird,noOutline:true});
    piece(sphere(.07,10,8),C.pink,{pos:[0,.38,-.01],parent:bird});
  }
  return mark(root,"coop");
}
export function fishPond(){
  const root=g();
  piece(rcyl(1.12,1.18,.24,.14,36),COZY.mint,{pos:[0,.10,0],parent:root});
  piece(rcyl(1.0,1.0,.065,.06,36),COZY.blue,{pos:[0,.245,0],parent:root,noOutline:true});
  piece(torus(1.05,.09),COZY.pink,{pos:[0,.28,0],rot:[Math.PI/2,0,0],parent:root});
  for(let i=0;i<4;i++){
    const a=i*Math.PI/2;
    piece(sphere(.15,14,9).scale(1,.48,.55),i%2?C.butter:C.pink,{pos:[Math.cos(a)*.48,.32,Math.sin(a)*.5],parent:root,noOutline:true});
    piece(sphere(.025,8,6),C.navy,{pos:[Math.cos(a)*.48+.08,.335,Math.sin(a)*.5+.04],parent:root,noOutline:true});
  }
  for(let i=0;i<3;i++)piece(sphere(.045,10,8),C.white,{pos:[-.45+i*.4,.33,-.25+i*.21],parent:root,noOutline:true});
  return mark(root,"pond");
}
export function lifeYardScene(){
  const all=g();all.name="world-life-yard";
  const coop=chickenYard();coop.position.set(6.6,0,-4.1);all.add(coop);
  const pond=fishPond();pond.position.set(7.5,0,3.8);all.add(pond);
  return all;
}
