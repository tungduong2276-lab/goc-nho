// Rounded pastel portals for the 3D home. Purely presentational: room coordinates,
// walkability, scene IDs and the couple's saved furniture are not modified.
import * as THREE from "three";
import { COZY } from "./cozy-palette.mjs";

const ROOMS = Object.freeze({
  "hanh-lang": ["Hành lang","♡"],
  nha: ["Phòng khách","⌂"],
  ngu: ["Phòng ngủ","☾"],
  bep: ["Góc bếp","♡"],
  "bao-tang": ["Kỷ niệm","✦"],
  xuong: ["Xưởng vẽ","✎"],
  "phong-choi": ["Góc chơi","☆"]
});
const mat=(color,extra={})=>new THREE.MeshToonMaterial({color,...extra});
export function makeCutePortal(door){
  const g=new THREE.Group();g.name="cute-portal-"+door.to.scene;
  const theme=door.to.scene==="ngu"||door.to.scene==="phong-choi"?COZY.pink
    :door.to.scene==="bep"||door.to.scene==="xuong"?COZY.blue:COZY.mint;
  const trim=mat(COZY.cream),accent=mat(theme),deep=mat(0x587B91),shine=mat(0xFFFFFF);
  const mesh=(geometry,material,x,y,z)=>{
    const o=new THREE.Mesh(geometry,material);o.position.set(x,y,z);
    o.castShadow=true;g.add(o);return o;
  };
  // Slim pillars, one curved arch and a low rounded mat: no forest of box-shaped doors.
  for(const x of [-.55,.55]){
    mesh(new THREE.CapsuleGeometry(.075,1.33,5,12),trim,x,.76,.02);
    mesh(new THREE.SphereGeometry(.105,12,8),accent,x,1.52,.08);
    mesh(new THREE.SphereGeometry(.045,10,8),shine,x,1.52,.17);
  }
  mesh(new THREE.TorusGeometry(.55,.078,10,32,Math.PI),trim,0,1.45,.02);
  // Soft translucent opening preserves the physical sense of passage.
  mesh(new THREE.PlaneGeometry(1.0,1.33),mat(theme,{transparent:true,opacity:.16,depthWrite:false}),0,.74,-.055);
  const matShape=mesh(new THREE.CylinderGeometry(.63,.68,.035,32),accent,0,.018,.10);
  matShape.scale.set(1,.7,.54);
  // Small flowers along the lintel; nothing hangs over the clickable furniture.
  for(const x of [-.38,.38]){
    const petal=mesh(new THREE.SphereGeometry(.068,12,8),accent,x,1.87,.12);
    petal.scale.set(1.0,.6,.45);
    mesh(new THREE.SphereGeometry(.026,10,8),deep,x,1.87,.166);
  }
  const [name,symbol]=ROOMS[door.to.scene]||[door.label||"Phòng mới","♡"];
  // One short, legible enamel plaque for every room; it moves with its arch.
  const c=document.createElement("canvas");c.width=384;c.height=104;
  const ctx=c.getContext("2d");
  if(ctx){
    ctx.fillStyle="#FFFDF7";ctx.beginPath();ctx.roundRect(4,4,376,96,30);ctx.fill();
    ctx.strokeStyle="#587B91";ctx.lineWidth=7;ctx.stroke();
    ctx.fillStyle="#D66090";ctx.font="bold 38px sans-serif";ctx.textAlign="center";ctx.fillText(symbol,42,68);
    ctx.fillStyle="#1D2B4F";ctx.font="bold 38px sans-serif";ctx.fillText(name,216,68);
  }
  const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;
  const sign=mat(0xFFFFFF,{map:tex,transparent:true,side:THREE.DoubleSide});
  mesh(new THREE.PlaneGeometry(1.42,.39),sign,0,2.08,.12);
  return g;
}
export function disposeCutePortal(group){
  group.traverse(o=>{
    o.geometry?.dispose();
    for(const material of (Array.isArray(o.material)?o.material:[o.material])){
      if(material){material.map?.dispose();material.dispose();}
    }
  });
}
