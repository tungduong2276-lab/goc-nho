import { applyPreviewAction, PlacementPreviewError } from "../src/house-placement-preview.mjs";
import { makeFloorProposalPreview } from "../src/house-floor-review.mjs";
import { assertFurnitureFits, itemFootprint } from "../src/house-furniture-collision.mjs";
import { ROOM_ZONE_PROPOSALS, assertWithinProposedZones } from "../src/house-room-zones.mjs";
import { ROOM_OBSTACLE_ATLAS, OBSTACLE_REVIEW_ZONES } from "../src/house-obstacle-atlas.mjs";
import { reviewSixRoomWalkways } from "../src/house-walkway-audit.mjs";

// Deliberately isolated from index.html and Firebase. Nothing persists.
const $ = id => document.getElementById(id);
const icons = Object.freeze({chair:"🪑",table:"🪵",lamp:"💡",plant:"🪴",rug:"🟠"});
const images = Object.freeze({
  "phong-khach":"phong_khach_ngay.webp",
  bep:"bep_ngay.webp",
  "phong-anh":"phong_anh_ngay.webp",
  "phong-em":"phong_em_ngay.webp",
  "goc-sang-tao":"sang_tao_ngay.webp",
  gac:"gac_ngay.webp",
});
let draft = null;
let scene = null;
let walkwayReviews = null;
let selectedSlot = null;
let sequence = 0;
const room = () => $("room").value;
const slots = () => draft?.slots.filter(s => s.roomId === room()) ?? [];
const selectedItem = () => draft?.items.find(x => x.slotId === selectedSlot && x.roomId === room());
const notify = message => { $("status").textContent = message; };

function render() {
  if (!draft) return;
  const current = slots();
  const assetUrl = images[room()];
  $("background").src = "../assets/3d/" + assetUrl;
  $("markers").replaceChildren();
  $("zones").replaceChildren();
  $("obstacles").replaceChildren();
  $("walkways").replaceChildren();
  const lane=walkwayReviews[room()];
  const ns="http://www.w3.org/2000/svg";
  const svg=document.createElementNS(ns,"svg");
  svg.setAttribute("viewBox","0 0 1170 1170");
  svg.setAttribute("class","walkway-overlay");
  svg.setAttribute("aria-hidden","true");
  const path=document.createElementNS(ns,"line");
  path.setAttribute("x1",lane.path[0][0]);path.setAttribute("y1",lane.path[0][1]);
  path.setAttribute("x2",lane.path[1][0]);path.setAttribute("y2",lane.path[1][1]);
  path.setAttribute("stroke",lane.blockingIds.length?"#bf4a31":"#3369a0");
  path.setAttribute("stroke-width",String(lane.clearanceRadiusPx*2));
  path.setAttribute("stroke-opacity",".3");
  path.setAttribute("stroke-dasharray","24 15");
  svg.append(path);
  for(const point of lane.path){const circle=document.createElementNS(ns,"circle");
    circle.setAttribute("cx",point[0]);circle.setAttribute("cy",point[1]);circle.setAttribute("r","15");
    circle.setAttribute("fill","#173954");circle.setAttribute("stroke","#fff");circle.setAttribute("stroke-width","4");
    svg.append(circle);
  }
  $("walkways").append(svg);
  $("walkway-status").textContent=lane.blockingIds.length?
    "Lối đi tham chiếu có "+lane.blockingIds.length+" vùng vật cản ước lượng cắt qua. Không dùng để điều hướng thật.":
    "Không tìm thấy vật cản ước lượng trên đoạn nối hai điểm đứng. Sàn và cửa vẫn chưa được đo/duyệt.";
  for(const obstacle of ROOM_OBSTACLE_ATLAS[room()]){
    const el=document.createElement("div");
    el.className="obstacle-review";
    const xs=obstacle.polygon.map(p=>p[0]), ys=obstacle.polygon.map(p=>p[1]);
    el.style.left=Math.min(...xs)/1170*100+"%";
    el.style.top=Math.min(...ys)/1170*100+"%";
    el.style.width=(Math.max(...xs)-Math.min(...xs))/1170*100+"%";
    el.style.height=(Math.max(...ys)-Math.min(...ys))/1170*100+"%";
    el.title=obstacle.label+" (ước lượng từ ảnh)";
    $("obstacles").append(el);
  }
  const zone=ROOM_ZONE_PROPOSALS[room()];
  for(const poly of zone.candidateFloor){
    const el=document.createElement("div");
    el.className="floor-zone";
    const xs=poly.map(p=>p[0]),ys=poly.map(p=>p[1]);
    const left=Math.min(...xs),top=Math.min(...ys);
    el.style.left=left/1170*100+"%";
    el.style.top=top/1170*100+"%";
    el.style.width=(Math.max(...xs)-left)/1170*100+"%";
    el.style.height=(Math.max(...ys)-top)/1170*100+"%";
    $("zones").append(el);
  }
  $("slot-picker").replaceChildren();
  for (const slot of current) {
    const item = draft.items.find(x => x.slotId === slot.id && x.roomId === room());
    if (item) {
      const icon = document.createElement("span");
      icon.className = "item";
      icon.textContent = icons[item.assetType];
      icon.style.left = slot.x / 1170 * 100 + "%";
      icon.style.top = slot.y / 1170 * 100 + "%";
      icon.style.rotate = item.rotation + "deg";
      const footprint = itemFootprint(item.assetType,item.rotation);
      icon.style.width = footprint.width / 1170 * 100 + "%";
      icon.style.height = footprint.height / 1170 * 100 + "%";
      icon.style.border = "2px dashed #315f68";
      icon.style.background = "rgba(49,95,104,.12)";
      icon.style.display = "grid";
      icon.style.placeItems = "center";
      icon.style.fontSize = "clamp(10px,3vw,25px)";
      icon.setAttribute("aria-hidden", "true");
      $("markers").append(icon);
    }
    const marker = document.createElement("span");
    marker.className = "slot";
    marker.style.left = slot.x / 1170 * 100 + "%";
    marker.style.top = slot.y / 1170 * 100 + "%";
    marker.dataset.slot = slot.id;
    marker.dataset.occupied = String(Boolean(item));
    marker.setAttribute("aria-hidden", "true");
    marker.textContent = String(current.indexOf(slot) + 1);
    $("markers").append(marker);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "slot-pick";
    button.dataset.slot = slot.id;
    button.setAttribute("aria-pressed", String(selectedSlot === slot.id));
    button.setAttribute("aria-label", "Chọn vị trí " + (current.indexOf(slot) + 1) +
      (item ? ", đang có " + item.assetType : ", trống"));
    button.textContent = "Vị trí " + (current.indexOf(slot) + 1) + (item ? " · có đồ" : " · trống");
    button.addEventListener("click", () => {
      selectedSlot = slot.id;
      render();
      notify("Đã chọn vị trí " + (current.indexOf(slot) + 1) + " (chưa duyệt hình học).");
    });
    $("slot-picker").append(button);
  }
  const item = selectedItem();
  const other = current.find(s => s.id !== selectedSlot);
  const otherTaken = draft.items.some(x => x.slotId === other?.id && x.roomId === room());
  let placementSafe=false;
  if(selectedSlot && !item) {
    try {const action={kind:"place",id:"probe",roomId:room(),slotId:selectedSlot,assetType:$("asset").value};assertFurnitureFits(scene,draft,action);assertWithinProposedZones(draft,action,OBSTACLE_REVIEW_ZONES);placementSafe=true;}catch { /* invalid footprint is a disabled action */ }
  }
  $("place").disabled = !placementSafe;
  let canMove=!!item && !!other && !otherTaken;
  if(canMove){try{const action={kind:"move",id:item.id,slotId:other.id};assertFurnitureFits(scene,draft,action);assertWithinProposedZones(draft,action,OBSTACLE_REVIEW_ZONES);}catch{canMove=false;}}
  $("move").disabled = !canMove;
  let canRotate=!!item;
  if(item){try{const action={kind:"rotate",id:item.id,rotation:(item.rotation+90)%360};assertFurnitureFits(scene,draft,action);assertWithinProposedZones(draft,action,OBSTACLE_REVIEW_ZONES);}catch{canRotate=false;}}
  $("rotate").disabled = !canRotate;
  $("remove").disabled = !item;
  $("undo").disabled = draft.undoStack.length === 0;
}

function mutate(action, message) {
  try {
    if(["place","move","rotate"].includes(action.kind)) {assertFurnitureFits(scene,draft,action);assertWithinProposedZones(draft,action,OBSTACLE_REVIEW_ZONES);}
    draft = applyPreviewAction(draft, action);
    render();
    notify(message + " · Chỉ trong bộ nhớ, chưa lưu.");
  } catch (error) {
    notify(error instanceof PlacementPreviewError ? "Không thể thực hiện: " + error.code : "Lỗi thao tác thử nghiệm.");
  }
}
$("enable").addEventListener("click", async () => {
  $("enable").disabled = true;
  try {
    const response = await fetch("../assets/3d/scene.json", {cache:"no-store"});
    if (!response.ok) throw new Error("SCENE_UNAVAILABLE");
    scene = await response.json();
    draft = makeFloorProposalPreview(scene);
    walkwayReviews = reviewSixRoomWalkways(scene);
    $("start").hidden = true;
    $("editor").hidden = false;
    $("stage-wrap").hidden = false;
    selectedSlot = null;
    render();
    notify("Đã mở bản thử cục bộ. Kiểm tra footprint mô phỏng; không xác nhận va chạm với đồ 3D được vẽ sẵn.");
  } catch {
    $("enable").disabled = false;
    $("start").insertAdjacentText("beforeend", " Không thể tải cảnh thử. Không có dữ liệu nào được ghi.");
  }
});
$("asset").addEventListener("change",()=>{render();notify("Đã đổi vật dụng: vùng footprint được kiểm tra lại.");});
$("room").addEventListener("change", () => {selectedSlot=null;render();notify("Đã đổi phòng. Chọn vị trí ứng viên.");});
$("place").addEventListener("click", () => mutate({
  kind:"place",id:"preview-"+(++sequence),assetType:$("asset").value,
  roomId:room(),slotId:selectedSlot,
}, "Đã đặt vật dụng"));
$("move").addEventListener("click", () => {
  const item = selectedItem();
  const other = slots().find(s => s.id !== selectedSlot);
  if (item && other) {
    mutate({kind:"move",id:item.id,slotId:other.id}, "Đã chuyển vị trí");
    selectedSlot=other.id;render();
  }
});
$("rotate").addEventListener("click", () => {
  const item=selectedItem();
  if (item) mutate({kind:"rotate",id:item.id,rotation:(item.rotation+90)%360}, "Đã xoay");
});
$("remove").addEventListener("click", () => {
  const item=selectedItem();
  if (item) mutate({kind:"remove",id:item.id}, "Đã cất vật dụng");
});
$("undo").addEventListener("click", () => mutate({kind:"undo"}, "Đã hoàn tác"));
$("reset").addEventListener("click", () => {
  // Reconstruct from safe in-memory slot metadata, not from app state or cloud.
  draft = {...draft,items:[],undoStack:[]};
  sequence=0;selectedSlot=null;render();notify("Đã xóa mọi vị trí thử nghiệm.");
});
