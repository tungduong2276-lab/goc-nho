// Bức tranh hoàn thiện thành khung tranh THẬT trong phòng bảo tàng;
// truyện hoàn thiện thành gáy sách trên kệ phòng ngủ. Chỉ dùng ảnh vẽ được tổng hợp
// từ nét của hai người, không nạp URL ngoài hoặc tiết lộ quà bị niêm phong.
import * as THREE from "three";
import { COZY } from "./cozy-palette.mjs";

function pictureTexture(strokes){
  const canvas=document.createElement("canvas");canvas.width=384;canvas.height=256;
  const ctx=canvas.getContext("2d");ctx.fillStyle="#FFFCF9";ctx.fillRect(0,0,384,256);
  for(const stroke of strokes){
    const pts=stroke.points||[];if(!pts.length)continue;
    ctx.strokeStyle=stroke.color;ctx.fillStyle=stroke.color;ctx.lineWidth=Math.max(1,stroke.width*.8);
    ctx.lineCap="round";ctx.lineJoin="round";ctx.beginPath();
    pts.forEach(([x,y],i)=>{if(i)ctx.lineTo(x*384,y*256);else ctx.moveTo(x*384,y*256);});
    if(pts.length===1){ctx.arc(pts[0][0]*384,pts[0][1]*256,stroke.width/2,0,Math.PI*2);ctx.fill();}else ctx.stroke();
  }
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;return texture;
}
export function galleryFrames(artworks=[]){
  const group=new THREE.Group();group.name="co-creative-gallery";
  const shades=[COZY.pink,COZY.mint,COZY.blue];
  for(const [i,art]of artworks.slice(0,3).entries()){
    const x=(i-1)*.45,y=1.68,z=.21;
    const frame=new THREE.Mesh(new THREE.BoxGeometry(.43,.31,.07),new THREE.MeshToonMaterial({color:shades[i]}));
    frame.position.set(x,y,z);group.add(frame);
    const texture=pictureTexture(art.strokes);
    const image=new THREE.Mesh(new THREE.PlaneGeometry(.36,.24),new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide}));
    image.position.set(x,y,z+.04);image.userData.creativeTexture=texture;group.add(image);
  }
  return group;
}
export function bookSpines(count=0){
  const group=new THREE.Group();group.name="co-creative-books";
  const shades=[COZY.pink,COZY.mint,COZY.blue];
  for(let i=0;i<Math.min(count,8);i++){
    const book=new THREE.Mesh(new THREE.BoxGeometry(.11,.26+(i%3)*.04,.16),
      new THREE.MeshToonMaterial({color:shades[i%3]}));
    book.position.set(-.45+i*.13,.33+(i%3)*.02,.15);
    group.add(book);
  }
  return group;
}
export function disposeCreativeTextures(root){
  root?.traverse(o=>{if(o.userData?.creativeTexture){o.userData.creativeTexture.dispose();o.material?.dispose();o.geometry?.dispose();}});
}
