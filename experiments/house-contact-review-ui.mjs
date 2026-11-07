import {ROOM_SOURCES} from "../src/house-placement-preview.mjs";
import {createContactProposal,buildReviewExport,sourceLayerForContact} from "../src/house-floor-contact-atlas.mjs";

const $=id=>document.getElementById(id);
const images=Object.freeze({
 "phong-khach":"phong_khach_ngay.webp",bep:"bep_ngay.webp",
 "phong-anh":"phong_anh_ngay.webp","phong-em":"phong_em_ngay.webp",
 "goc-sang-tao":"sang_tao_ngay.webp",gac:"gac_ngay.webp",
});
let scene=null;
let vertices=[];
const proposals=new Map();
const key=()=>JSON.stringify([$("room").value,$("layer").value]);
const selectedRoom=()=>$("room").value;
const selectedLayer=()=>$("layer").value;
const notice=message=>{$("status").textContent=message;};
const pathFor=(room,layer)=>{
 const prefix=ROOM_SOURCES[room];
 return "../assets/3d/"+(prefix===null?"":prefix+"_")+layer+".webp";
};
function layersFor(room){
 const key=ROOM_SOURCES[room];
 const obj=key===null?scene.room:scene.rooms[key];
 if(key===null)return Object.keys(obj.layers);
 const states=[];
 for(const [id,item] of Object.entries(obj.items||{}))
  states.push(id+"_"+item.st[0]);
 return states;
}
function setRoom(){
 const room=selectedRoom();
 $("background").src="../assets/3d/"+images[room];
 const select=$("layer");
 const previous=select.value;
 select.replaceChildren();
 for(const name of Object.keys(ROOM_SOURCES).includes(room)?layersFor(room):[]){
   const option=document.createElement("option");option.value=name;option.textContent=name;
   select.append(option);
 }
 if(Array.from(select.options).some(x=>x.value===previous))select.value=previous;
 setLayer();
}
function setLayer(){
 vertices=proposals.get(key())?.vertices.map(p=>[...p])||[];
 render();
 notice("Đang đối chiếu "+selectedLayer()+". Bản vẽ chỉ là đề xuất chưa duyệt.");
}
function drawLine(points,closed,stroke,fill,width=4){
 if(!points.length)return;
 const ns="http://www.w3.org/2000/svg";
 const svg=document.createElementNS(ns,closed?"polygon":"polyline");
 svg.setAttribute("points",points.map(p=>p.join(",")).join(" "));
 svg.setAttribute("fill",fill);svg.setAttribute("stroke",stroke);
 svg.setAttribute("stroke-width",String(width));svg.setAttribute("stroke-linejoin","round");
 $("polygon").append(svg);
 for(const [x,y] of points){
  const dot=document.createElementNS(ns,"circle");dot.setAttribute("cx",x);dot.setAttribute("cy",y);
  dot.setAttribute("r","7");dot.setAttribute("fill",stroke);dot.setAttribute("stroke","#fff");
  dot.setAttribute("stroke-width","2");$("polygon").append(dot);
 }
}
function render(){
 if(!scene)return;
 const room=selectedRoom(),active=selectedLayer();
 $("layers").replaceChildren();$("polygon").replaceChildren();
 for(const name of layersFor(room)){
   if(name!==active&&!$("show-all").checked)continue;
   const layer=sourceLayerForContact(scene,room,name);
   const [x0,y0,x1,y1]=layer.box;
   const img=document.createElement("img");
   img.className="sprite";img.src=pathFor(room,name);img.alt="";
   img.style.left=x0/1170*100+"%";img.style.top=y0/1170*100+"%";
   img.style.width=(x1-x0)/1170*100+"%";img.style.height=(y1-y0)/1170*100+"%";
   img.style.opacity=name===active?"1":".28";
   $("layers").append(img);
 }
 for(const p of proposals.values()){
   if(p.roomId===room&&p.layerId!==active)
     drawLine(p.vertices,true,"#db8240","rgba(219,130,64,.1)",3);
 }
 if(vertices.length)drawLine(vertices,vertices.length>=3,
   "#e9cf35","rgba(233,207,53,.18)",5);
 $("point-count").textContent=vertices.length+" điểm đang vẽ · "+
   proposals.size+" đề xuất (không lưu)";
 $("commit").disabled=vertices.length<3;
 $("undo-point").disabled=vertices.length===0;
 $("clear").disabled=vertices.length===0;
}
function add(x,y){
 if(!Number.isFinite(x)||!Number.isFinite(y)||x<0||x>1170||y<0||y>1170){
   notice("Tọa độ phải nằm trong ảnh 1170×1170.");return;
 }
 vertices.push([Math.round(x*10)/10,Math.round(y*10)/10]);
 if(vertices.length>32)vertices.pop();
 render();
}
$("stage").addEventListener("click",event=>{
 const rect=$("stage").getBoundingClientRect();
 add((event.clientX-rect.left)/rect.width*1170,
     (event.clientY-rect.top)/rect.height*1170);
});
$("add").addEventListener("click",()=>add(Number($("x").value),Number($("y").value)));
$("undo-point").addEventListener("click",()=>{vertices.pop();render();});
$("clear").addEventListener("click",()=>{vertices=[];render();});
$("commit").addEventListener("click",()=>{
 try{
   const value=createContactProposal(scene,{roomId:selectedRoom(),layerId:selectedLayer(),vertices});
   proposals.set(key(),value);render();
   notice("Đề xuất hợp lệ về hình học 2D, CHƯA ĐƯỢC DUYỆT tiếp xúc sàn.");
 }catch(e){notice("Không thể ghi nhận: "+(e?.code||"INVALID_POLYGON"));}
});
$("export-button").addEventListener("click",()=>{
 const value=buildReviewExport(Array.from(proposals.values()));
 $("export").value=JSON.stringify(value,null,2);
 notice("Đã tạo JSON trong ô văn bản. Dữ liệu vẫn chỉ trong bộ nhớ.");
});
$("copy").addEventListener("click",async()=>{
 if(!$("export").value){notice("Hãy tạo JSON trước khi sao chép.");return;}
 try{await navigator.clipboard.writeText($("export").value);notice("Đã sao chép JSON chưa duyệt.");}
 catch{$("export").select();notice("Hãy sao chép văn bản đang được chọn; clipboard không được cấp quyền.");}
});
$("reset").addEventListener("click",()=>{
 proposals.clear();vertices=[];$("export").value="";render();
 notice("Đã xóa tất cả bản đề xuất trong bộ nhớ.");
});
$("show-all").addEventListener("change",render);
$("layer").addEventListener("change",setLayer);
$("room").addEventListener("change",setRoom);
$("enable").addEventListener("click",async()=>{
 $("enable").disabled=true;
 try{
  const response=await fetch("../assets/3d/scene.json",{cache:"no-store"});
  if(!response.ok)throw Error("SCENE_UNAVAILABLE");
  scene=await response.json();
  $("editor").hidden=false;$("start").hidden=true;setRoom();
 }catch{
  $("enable").disabled=false;notice("Không thể tải cảnh. Không có gì được lưu.");
 }
});
