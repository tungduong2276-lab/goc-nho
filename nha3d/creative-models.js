// Bức tranh hoàn thiện thành khung tranh THẬT trong phòng bảo tàng;
// truyện hoàn thiện thành gáy sách trên kệ phòng ngủ. Chỉ dùng ảnh vẽ được tổng hợp
// từ nét của hai người, không nạp URL ngoài hoặc tiết lộ quà bị niêm phong.
import * as THREE from "three";
import { COZY } from "./cozy-palette.mjs";
import { combinePainting, drawPainting } from "./creative.mjs";

function pictureTexture(strokes){
  const canvas=document.createElement("canvas");canvas.width=384;canvas.height=256;
  drawPainting(canvas,strokes,"#FFFCF9");
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
// Giấy thật trên giá vẽ: cả hai nhìn bức tranh trong căn phòng ngay cả khi đóng bảng bút.
export function easelPreview(painting){
  const group=new THREE.Group();group.name="co-creative-easel";
  if(!painting)return group;
  const strokes=combinePainting(painting.anh,painting.em);
  const texture=pictureTexture(strokes);
  const board=new THREE.Mesh(new THREE.PlaneGeometry(.80,.54),
    new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide}));
  board.position.set(0,1.05,.115);board.userData.creativeTexture=texture;
  group.add(board);return group;
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
  // Mỗi lần đổi phòng, giải phóng cả khung tranh/gáy sách tạo riêng; không đụng
  // vào vật liệu dùng chung của furniture hoặc avatar.
  root?.traverse(o=>{
    if(o.name!=="co-creative-gallery"&&o.name!=="co-creative-books"&&o.name!=="co-creative-easel")return;
    o.traverse(mesh=>{
      if(!mesh.isMesh)return;
      mesh.userData?.creativeTexture?.dispose();
      mesh.geometry?.dispose();
      for(const m of Array.isArray(mesh.material)?mesh.material:[mesh.material])m?.dispose();
    });
  });
}
