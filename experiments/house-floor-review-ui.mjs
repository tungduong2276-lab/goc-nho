import {ROOM_SOURCES} from "../src/house-placement-preview.mjs";
import {makeFloorAnnotation,buildFloorReviewBundle} from "../src/house-floor-evidence.mjs";
import {buildFloorEvidenceWithProvenance} from "../src/house-floor-review-provenance.mjs";
const $=id=>document.getElementById(id);
const backgrounds=Object.freeze({"phong-khach":"phong_khach",bep:"bep","phong-anh":"phong_anh","phong-em":"phong_em","goc-sang-tao":"sang_tao",gac:"gac"});
const LIGHTING=Object.freeze(["sang","ngay","chieu","dem"]);
function updateBackground(){
 const room=$("room").value,lighting=$("lighting").value;
 if(!LIGHTING.includes(lighting))throw Error("INVALID_REVIEW_LIGHTING");
 $("background").src="../assets/3d/"+backgrounds[room]+"_"+lighting+".webp";
 $("background").dataset.lighting=lighting;
}
let scene=null,vertices=[],sceneSha256=null;
const proposals=[],captures=[];
const notice=message=>{$("status").textContent=message;};
function roomSource(){
 const source=ROOM_SOURCES[$("room").value];
 return source===null?scene.room:scene.rooms[source];
}
// A review-only reconstruction of ONE state per physical furniture item.
// Source sprite boxes are image extents, not floor contacts or 3D collision.
const livingDefaults=["pk_sofa","pk_khung_anh","pk_lich","pk_bang_ghim_trong","pk_hu_it","pk_radio_tat"];
function livingFamily(key){
 if(key.startsWith("pk_hu_"))return "pk_hu";
 if(key.startsWith("pk_radio_"))return "pk_radio";
 if(key.startsWith("pk_bang_ghim_"))return "pk_bang_ghim";
 return key;
}
function visibleLayers(){
 const room=$("room").value,source=roomSource();
 const focus=$("role").value==="fixed_contact"?$("layer").value:null;
 if(ROOM_SOURCES[room]===null){
  const items=[...livingDefaults];
  if(focus){
   const family=livingFamily(focus);
   const at=items.findIndex(x=>livingFamily(x)===family);
   if(at<0)items.push(focus);else items[at]=focus;
  }
  return items.filter(x=>Object.hasOwn(source.layers,x));
 }
 const items=Object.entries(source.items).map(([itemId,item])=>{
  const selected=focus?.startsWith(itemId+"_")?focus:null;
  return selected||itemId+"_"+item.st[0];
 });
 return items.filter(x=>Object.hasOwn(source.layers,x));
}
function renderLayers(){
 if(!scene)return;
 const parent=$("layers");parent.replaceChildren();
 if(!$("show-furniture").checked)return;
 const room=$("room").value,source=roomSource(),prefix=ROOM_SOURCES[room];
 const focus=$("role").value==="fixed_contact"?$("layer").value:null;
 for(const key of visibleLayers()){
  const box=source.layers[key];
  const image=document.createElement("img");
  image.src="../assets/3d/"+(prefix===null?"":prefix+"_")+key+".webp";
  image.dataset.layer=key;
  image.alt="";
  image.style.left=100*box[0]/1170+"%";
  image.style.top=100*box[1]/1170+"%";
  image.style.width=100*(box[2]-box[0])/1170+"%";
  image.style.height=100*(box[3]-box[1])/1170+"%";
  image.style.opacity=focus&&key!==focus?".72":"1";
  parent.append(image);
 }
}
function refreshRoom(){
 updateBackground();
 const layer=$("layer"),previous=layer.value;
 layer.replaceChildren();
 for(const key of Object.keys(roomSource().layers)){
  const option=document.createElement("option");
  option.value=key;option.textContent=key;layer.append(option);
 }
 if([...layer.options].some(option=>option.value===previous))layer.value=previous;
 vertices=[];renderLayers();render();
 notice("Vùng đang vẽ chỉ là đề xuất, chưa duyệt.");
}
function drawPolygon(points,color,opacity=.14){
 const ns="http://www.w3.org/2000/svg";
 if(points.length>=2){
  const poly=document.createElementNS(ns,points.length>=3?"polygon":"polyline");
  poly.setAttribute("points",points.map(p=>p.join(",")).join(" "));
  poly.setAttribute("stroke",color);poly.setAttribute("stroke-width","5");
  poly.setAttribute("fill",points.length>=3?`rgba(0,0,0,${opacity})`:"none");
  $("overlay").append(poly);
 }
 for(const p of points){
  const circle=document.createElementNS(ns,"circle");
  circle.setAttribute("cx",p[0]);circle.setAttribute("cy",p[1]);
  circle.setAttribute("r","7");circle.setAttribute("fill",color);
  circle.setAttribute("stroke","white");circle.setAttribute("stroke-width","2");
  $("overlay").append(circle);
 }
}
function render(){
 $("overlay").replaceChildren();
 const colors={floor:"#16815c",doorway:"#d0822d",walkway:"#e3a329",fixed_contact:"#c84a4a"};
 if(scene){
  for(const p of proposals)if(p.roomId===$("room").value)
   drawPolygon(p.vertices,colors[p.role]);
  drawPolygon(vertices,"#f0cf35");
 }
 $("counter").textContent=`${vertices.length} điểm · ${proposals.length} vùng chưa duyệt`;
 $("commit").disabled=vertices.length<3;
 $("undo").disabled=$("clear").disabled=vertices.length===0;
 $("layer-control").hidden=$("role").value!=="fixed_contact";
 const bundle=buildFloorReviewBundle(proposals);
 const current=bundle.readiness.find(x=>x.roomId===$("room").value);
 const mismatches=captures.filter(c=>c.roomId===$("room").value&&c.lighting!==$("lighting").value).length;
 $("summary").textContent=`Thiếu bằng chứng: ${current.missing.join(", ")||"không còn loại trống"}\nLối đi ngoài vùng sàn: ${current.reservesOutsideProposedFloor?"CẦN XEM LẠI":"chưa phát hiện / chưa đủ dữ liệu"}\nTrạng thái: CHƯA ĐƯỢC DUYỆT\\nBản vẽ từ ánh sáng khác: ${mismatches}`;
}
function addPoint(x,y){
 if(!Number.isFinite(x)||!Number.isFinite(y)||x<0||y<0||x>1170||y>1170){notice("Tọa độ không hợp lệ.");return;}
 if(vertices.length>=32){notice("Mỗi vùng tối đa 32 đỉnh.");return;}
 vertices.push([Math.round(x*10)/10,Math.round(y*10)/10]);
 render();
}
$("stage").addEventListener("click",e=>{
 const b=$("stage").getBoundingClientRect();
 addPoint((e.clientX-b.left)*1170/b.width,(e.clientY-b.top)*1170/b.height);
});
$("add").addEventListener("click",()=>addPoint(Number($("x").value),Number($("y").value)));
$("undo").addEventListener("click",()=>{vertices.pop();render();});
$("clear").addEventListener("click",()=>{vertices=[];render();});
$("commit").addEventListener("click",()=>{
 try{
  const roomId=$("room").value,role=$("role").value;
  const entry=makeFloorAnnotation({roomId,role,vertices,
   layerId:role==="fixed_contact"?$("layer").value:null},scene);
  if(role==="fixed_contact"&&proposals.some(x=>x.roomId===roomId&&x.role===role&&x.layerId===entry.layerId))
   throw Error("DUPLICATE_CONTACT_ANNOTATION");
  // Snapshot only the actual visible state at annotation time.
  // A hidden furniture layer cannot establish contact evidence.
  const visible=$("show-furniture").checked?visibleLayers():[];
  if(role==="fixed_contact"&&!visible.includes($("layer").value))
   throw Error("CONTACT_SPRITE_NOT_VISIBLE");
  proposals.push(entry);
  captures.push({roomId,role,layerId:entry.layerId,lighting:$("lighting").value,
   visibleLayers:[...visible]});
  vertices=[];$("export").value="";render();
  notice("Đã ghi nhận bản vẽ để kiểm tra, CHƯA ĐƯỢC DUYỆT.");
 }catch(e){notice("Không ghi nhận: "+(e.code||e.message||"INVALID_POLYGON"));}
});
$("export-button").addEventListener("click",()=>{
 try{
  const bundle=buildFloorReviewBundle(proposals);
  const evidence=buildFloorEvidenceWithProvenance({bundle,sceneSha256,captures});
  $("export").value=JSON.stringify(evidence,null,2);
  notice("Đã xuất dữ liệu chưa duyệt; không có lưu Firebase.");
 }catch(e){notice("Không xuất được: "+(e.code||"INVALID_FLOOR_BUNDLE"));}
});
$("reset").addEventListener("click",()=>{proposals.length=0;captures.length=0;vertices=[];$("export").value="";render();notice("Đã xóa dữ liệu trong bộ nhớ.");});
$("room").addEventListener("change",refreshRoom);
$("lighting").addEventListener("change",()=>{updateBackground();render();notice("Đang xem ánh sáng "+$("lighting").value+". Mọi vùng vẫn chưa duyệt.");});
$("role").addEventListener("change",()=>{vertices=[];renderLayers();render();});
$("layer").addEventListener("change",renderLayers);
$("show-furniture").addEventListener("change",renderLayers);
$("enable").addEventListener("click",async()=>{
 $("enable").disabled=true;
 try{
  const response=await fetch("../assets/3d/scene.json",{cache:"no-store"});
  if(!response.ok)throw Error("SCENE_UNAVAILABLE");
  const raw=await response.text();
  const digest=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(raw));
  sceneSha256=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,"0")).join("");
  scene=JSON.parse(raw);$("editor").hidden=false;$("start").hidden=true;
  refreshRoom();
 }catch(e){$("enable").disabled=false;notice("Không tải được cảnh. Không có dữ liệu nào được lưu.");}
});
