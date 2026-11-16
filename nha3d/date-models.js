import {THREE,C,piece,rbox,sphere,rcyl,torus} from "./xuong/lib.js";
import {island} from "./world-models.js";
const G=()=>new THREE.Group();
export function picnic(){
 const g=G();piece(rbox(1.9,.045,1.8,.03),C.pinkL,{pos:[0,.025,0],parent:g});
 for(let i=0;i<5;i++)piece(rbox(1.85,.008,.07,.01),C.white,{pos:[0,.052,-.7+i*.35],parent:g,noOutline:true});
 piece(rcyl(.24,.24,.06,.01,20),C.white,{pos:[0,.09,-.35],parent:g});
 for(const x of [-.11,.11])piece(sphere(.09,10,8),C.orange,{pos:[x,.18,-.35],parent:g});return g;
}
export function campfire(){
 const g=G();for(let i=0;i<8;i++){const a=i*Math.PI/4;piece(sphere(.12,10,8).scale(1,.65,1),C.stone,{pos:[Math.sin(a)*.35,.07,Math.cos(a)*.35],parent:g});}
 for(const a of [-.6,.6])piece(rbox(.55,.1,.12,.03),C.woodD,{pos:[0,.09,0],rot:[0,a,0],parent:g});
 for(let i=0;i<3;i++){const f=piece(sphere(.17-i*.035,12,8).scale(.8,1.8,1),[C.orange,C.butter,C.pink][i],{pos:[(i-1)*.09,.3+i*.04,0],parent:g});f.userData.flame=i;}return g;
}
export function dateIsland(w,d,time){
 const g=island(w,d,time);piece(rcyl(2.2,2.4,.06,.03,32).scale(1,1,.7),0xFFE7BE,{pos:[w/2-2,-.035,1.4],parent:g,receive:true});
 for(let i=0;i<5;i++){const r=piece(torus(.4+i*.05,.018,Math.PI*1.6,5,24),0xD3F6FA,{pos:[w/2+.55+i*.65,-.37,2.5-i*.9],rot:[Math.PI/2,0,i],parent:g,noOutline:true});r.userData.ripple=i;}
 for(let i=0;i<6;i++){const f=piece(sphere(.13,10,8).scale(1,.12,2.2),0x5F9DB9,{pos:[w/2+1.5+i*.28,-.385,-1.3+i*.7],parent:g,noOutline:true,cast:false});f.userData.swimmer=i;}
 for(let i=0;i<12;i++){const m=piece(sphere(.025,6,5),time==="dem"?C.butter:C.white,{pos:[Math.sin(i*2.4)*5,.6+(i%3)*.25,Math.cos(i*2.4)*4],parent:g,noOutline:true,cast:false});m.userData.mote=i;}return g;
}
export function tool(kind,color=0xA8DCF0){
 const g=G();g.position.set(.3,.75,.16);
 if(kind==="fish"){piece(rcyl(.022,.03,1.2,.008,8),C.woodD,{pos:[0,.42,.3],rot:[.65,0,.15],parent:g});const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,.9,.66),new THREE.Vector3(0,-1.1,1.8)]),new THREE.LineBasicMaterial({color:0xffffff}));g.add(line);piece(sphere(.055,10,8),C.pink,{pos:[0,-1.1,1.8],parent:g});}
 else{piece(rcyl(.08,.06,.23,.02,12),color,{pos:[0,.05,0],parent:g});piece(rcyl(.085,.085,.04,.01,12),C.white,{pos:[0,.18,0],parent:g});}return g;
}
export function caughtFish(color){
 const g=G();piece(sphere(.18,12,8).scale(1.5,.8,.6),color,{parent:g});piece(new THREE.ConeGeometry(.13,.2,3),color,{pos:[-.29,0,0],rot:[0,0,-Math.PI/2],parent:g});piece(sphere(.025,8,6),C.navy,{pos:[.15,.04,.1],parent:g,noOutline:true});return g;
}
export function drinks(color=0xE9B2C8){
 const g=G();for(const x of [-.18,.18]){piece(rcyl(.09,.07,.23,.02,14),color,{pos:[x,.12,0],parent:g});piece(rcyl(.094,.094,.025,.008,14),C.white,{pos:[x,.245,0],parent:g});piece(rcyl(.009,.009,.2,.002,6),C.pink,{pos:[x+.02,.3,0],rot:[0,0,-.15],parent:g});}return g;
}
export function animate(root,t,reduced=false){
 if(!root||reduced)return;
 root.traverse(o=>{if(o.userData.flame!==undefined)o.scale.y=1+Math.sin(t*6+o.userData.flame)*.13;
 if(o.userData.ripple!==undefined){o.scale.setScalar(1+Math.sin(t*.8+o.userData.ripple)*.17);o.rotation.z=t*.08+o.userData.ripple;}
 if(o.userData.swimmer!==undefined){const i=o.userData.swimmer;o.position.z=-1.3+i*.7+Math.sin(t*.6+i)*.5;o.rotation.y=Math.sin(t*.7+i)*.5;}
 if(o.userData.mote!==undefined){const i=o.userData.mote;o.position.y=.7+(i%3)*.25+Math.sin(t+i)*.15;}});
}
