// Three-room visual prototype. No Firebase, no localStorage, no edits to legacy house.
import * as THREE from "three";
import * as F from "./xuong/furn.js";
import { OBJ, plantPot, rugRound, rugRect } from "./xuong/rooms2.js";
import { C } from "./xuong/lib.js";
import { CELL, CATALOG, WALL_COLORS, FLOOR_COLORS } from "./catalog.mjs";
import { PREVIEW_LAYOUTS, PREVIEW_SPAWN } from "./multiroom-preview-layout.mjs";
import { makeHouse, HOUSE_ROOMS, transitionAtDoor } from "./multiroom.mjs";
import { cellCenter, blockGrid, cellFree, findPath, worldPath, worldToCell } from "./engine.mjs";
import { routeToFurniture } from "./multiroom-activities.mjs";
import { companionSpawn, routeCompanionToPlayer } from "./partner-preview.mjs";
import { createTwoTabPresenceLab } from "./two-tab-lab-browser.mjs?rev=20261111b";

// Furnishing is preview-only: no schema migration or writes to existing saved homes.

const house = makeHouse(PREVIEW_LAYOUTS);
const canvas = document.querySelector("#world"), status = document.querySelector("#status");
const doorsUI = document.querySelector("#doors"), roomsUI = document.querySelector("#rooms");
const activitiesUI = document.querySelector("#activities");
const activityCounts = { khach: 0, bep: 0, ngu: 0 };
let activityVisualRoom = null;
const activities = {
  khach: { label: "☕ Uống trà", message: "Hai người cùng ngồi uống trà trong phòng khách." },
  bep: { label: "🍳 Nấu cùng nhau", message: "Căn bếp thơm mùi bữa ăn hai người chuẩn bị." },
  ngu: { label: "💌 Lời nhắn", message: "Một lời nhắn dễ thương đã xuất hiện trong phòng ngủ." }
};
let renderer;
try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true }); }
catch { document.querySelector("#error").hidden = false; document.querySelector("#error").textContent = "Trình duyệt này chưa hỗ trợ WebGL."; throw new Error("WebGL unavailable"); }
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
renderer.setClearColor(0xfceef3);
const scene = new THREE.Scene();
scene.add(new THREE.HemisphereLight(0xffffff, 0xc9c0b7, 2.2));
const sun = new THREE.DirectionalLight(0xffffff, 1.7); sun.position.set(-4, 9, 6); scene.add(sun);
const camera = new THREE.OrthographicCamera(-6, 6, 6, -6, .1, 100);
const floorGroup = new THREE.Group(); scene.add(floorGroup);
const activityVisuals = new THREE.Group(); scene.add(activityVisuals);
const avatar = new THREE.Group(); scene.add(avatar);
const activityProps = new THREE.Group(); avatar.add(activityProps);
// A second character is a local demonstration, not a remotely connected partner.
const partner = new THREE.Group(); scene.add(partner); partner.visible = false;
const partnerBody = new THREE.Mesh(new THREE.CapsuleGeometry(.21, .43, 4, 8), new THREE.MeshStandardMaterial({ color: 0x74b8c6 }));
partnerBody.position.y = .53; partner.add(partnerBody);
const partnerHead = new THREE.Mesh(new THREE.SphereGeometry(.26, 16, 12), new THREE.MeshStandardMaterial({ color: 0xf5cbaa }));
partnerHead.position.y = 1.02; partner.add(partnerHead);
const partnerHair = new THREE.Mesh(new THREE.SphereGeometry(.27, 16, 10, 0, Math.PI * 2, 0, Math.PI * .48), new THREE.MeshStandardMaterial({ color: 0x66536a }));
partnerHair.position.y = 1.08; partner.add(partnerHair);
const body = new THREE.Mesh(new THREE.CapsuleGeometry(.21, .43, 4, 8), new THREE.MeshStandardMaterial({ color: 0xe75b91 }));
body.position.y = .53; avatar.add(body);
const head = new THREE.Mesh(new THREE.SphereGeometry(.26, 16, 12), new THREE.MeshStandardMaterial({ color: 0xffd9b9 }));
head.position.y = 1.02; avatar.add(head);
const hair = new THREE.Mesh(new THREE.SphereGeometry(.27, 16, 10, 0, Math.PI * 2, 0, Math.PI * .48), new THREE.MeshStandardMaterial({ color: 0x41384c }));
hair.position.y = 1.08; avatar.add(hair);
const mat = c => new THREE.MeshStandardMaterial({ color: c, roughness: .94 });
const REAL_MODELS = {
  "F.sofa": () => F.sofa(), "F.coffeeTable": () => F.coffeeTable(),
  "F.bookshelfLow": () => F.bookshelfLow(), "F.pothos": () => F.pothos(),
  "F.petBed": () => F.petBed(), "F.jar": () => F.jar(),
  "F.floorLamp": () => F.floorLamp(), "F.radio": () => F.radio(),
  "OBJ.banan": () => OBJ.banan("trong"), "OBJ.tulanh": () => OBJ.tulanh("dong"),
  "OBJ.bepnau": () => OBJ.bepnau("tat"), "OBJ.giuong": () => OBJ.giuong("gon"),
  "OBJ.tudo": () => OBJ.tudo("dong"), "OBJ.bantrangdiem": () => OBJ.bantrangdiem(),
  "OBJ.ruong": () => OBJ.ruong("dong"),
  "plantPot": () => plantPot(),
  "rugRound": def => rugRound(def.args[0], C[def.args[1]] ?? C.pinkL, C[def.args[2]] ?? C.petal),
  "rugRect": def => rugRect(def.args[0], def.args[1], C[def.args[2]] ?? C.sky2, C[def.args[3]] ?? C.white),
  "F.rug": () => F.rug()
};
function clearActivityProps() {
  activityProps.traverse(o => { if (o.isMesh) { o.geometry.dispose(); for (const m of (Array.isArray(o.material) ? o.material : [o.material])) m.dispose(); } });
  activityProps.clear();
}
function createActivityProps(room) {
  clearActivityProps();
  const material = color => new THREE.MeshStandardMaterial({ color, roughness: .55 });
  const add = (geometry, color, x, y, z) => {
    const mesh = new THREE.Mesh(geometry, material(color));
    mesh.position.set(x, y, z); activityProps.add(mesh); return mesh;
  };
  if (room === "khach") {
    add(new THREE.CylinderGeometry(.10, .085, .16, 16), 0xfff5e9, .28, .79, .10);
    add(new THREE.TorusGeometry(.07, .023, 8, 12), 0xfff5e9, .40, .79, .10).rotation.y = Math.PI / 2;
  } else if (room === "bep") {
    add(new THREE.CylinderGeometry(.028, .028, .38, 10), 0xb78c65, .27, .74, .10).rotation.z = -.5;
    add(new THREE.SphereGeometry(.09, 12, 8), 0xd9a66c, .34, .56, .10);
  } else if (room === "ngu") {
    add(new THREE.BoxGeometry(.28, .012, .20), 0xfff8ed, .26, .66, .14);
    add(new THREE.CylinderGeometry(.012, .012, .30, 8), 0x9b7ee3, .28, .77, .12).rotation.z = -.6;
  }
}
function clearActivityVisuals() {
  activityVisuals.traverse(o => { if (o.isMesh) { o.geometry.dispose(); for (const m of (Array.isArray(o.material) ? o.material : [o.material])) m.dispose(); } });
  activityVisuals.clear(); activityVisualRoom = null;
}
function showActivityVisual(room) {
  clearActivityVisuals(); activityVisualRoom = room;
  const colors = { khach: 0xf8b6d0, bep: 0xffd87c, ngu: 0xe8b8ff };
  const geometry = room === "khach" ? new THREE.TorusGeometry(.25, .065, 10, 24) :
    room === "bep" ? new THREE.SphereGeometry(.29, 18, 12) : new THREE.OctahedronGeometry(.28);
  const visual = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: colors[room], emissive: colors[room], emissiveIntensity: .22 }));
  visual.position.set(avatar.position.x, 1.75, avatar.position.z);
  activityVisuals.add(visual);
}
function disposeRoom() { floorGroup.traverse(o => { if (o.isMesh && o.userData.previewOwned) { o.geometry.dispose(); for (const m of (Array.isArray(o.material) ? o.material : [o.material])) m.dispose(); } }); floorGroup.clear(); }
function block(x, y, z, w, h, d, color) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color)); m.position.set(x, y, z); m.userData.previewOwned = true; floorGroup.add(m); return m;
}
let roomId = PREVIEW_SPAWN.room, pos = { ...PREVIEW_SPAWN.cell }, walking = [], last = performance.now();
let pendingActivity = null;
let activityPoseUntil = 0;
let partnerActive = false, partnerCell = null, partnerWalking = [], pendingPartnerGesture = false;
let partnerGestureUntil = 0;
function clearPartnerGesture() {
  pendingPartnerGesture = false; partnerWalking = []; partnerGestureUntil = 0;
  partner.scale.y = 1; partnerBody.rotation.z = 0; partnerHead.rotation.z = 0;
}
function finishPartnerGesture() {
  if (!pendingPartnerGesture || !partnerActive) return;
  pendingPartnerGesture = false;
  partnerGestureUntil = performance.now() + 2200;
  showActivityVisual(roomId);
  status.textContent = "💞 Hai nhân vật chạm tay! (Mô phỏng cục bộ, không đồng bộ hai máy.)";
}
const names = { khach: "🛋️ Phòng khách", bep: "🍳 Phòng bếp", ngu: "🛏️ Phòng ngủ" };
function roomInfo() { return house.rooms[roomId]; }
// Explicit opt-in. BroadcastChannel connects browser tabs with the SAME origin/profile,
// never separate phones. The normal staging preview remains unchanged.
const twoTabRequested = new URLSearchParams(location.search).get("lab") === "two-tabs";
let twoTabLab = null, remoteTabState = null, labControlButton = null;
const labPanelState = document.querySelector("#lab-state");
const labPanelDetail = document.querySelector("#lab-detail");
function updateLabPanel(info) {
  if (!twoTabRequested || !info || !labPanelState) return;
  const roomName = info.remoteRoom && HOUSE_ROOMS[info.remoteRoom]?.name;
  const messages = {
    off: "⚪ Chưa bật kết nối. Nhấn Mở tab thứ hai để tự bật cả hai tab.",
    waiting: "🟠 Kênh đã bật, đang tìm tab thứ hai. Chưa có tín hiệu phản hồi.",
    connected: "🟢 Đã kết nối thành công! Hai nhân vật đang cùng phòng.",
    "other-room": "🟡 Đã kết nối, nhưng tab còn lại đang ở " + (roomName || "phòng khác") + ".",
    unsupported: "🔴 Không thể mở kênh hai tab. Hãy dùng Chrome thường, cùng một hồ sơ."
  };
  labPanelState.textContent = messages[info.phase] || messages.waiting;
  labPanelDetail.textContent = "Tín hiệu nhận: " + info.received +
    " · Đã gửi: " + info.sent +
    " · Bỏ qua: " + info.ignored +
    ". Hai tab cần cùng tên miền và cùng hồ sơ Chrome; không dùng ẩn danh/nhúng trang.";
  if (labControlButton) labControlButton.textContent = info.active ? "⛔ Ngắt kết nối tab" : "🔗 Kết nối hai tab";
}
function canOccupyLabCell(id, cell) {
  if (typeof id !== "string" || !Object.hasOwn(house.rooms, id) ||
      !cell || !Number.isInteger(cell.i) || !Number.isInteger(cell.j)) return false;
  const room = house.rooms[id];
  return cellFree(blockGrid(room.layout, room.size), cell.i, cell.j);
}
function syncRemoteAvatar() {
  if (!twoTabRequested) return;
  const visible = Boolean(twoTabLab?.active && remoteTabState && remoteTabState.room === roomId);
  partner.visible = visible;
  partnerCell = visible ? { ...remoteTabState.cell } : null;
  if (visible) {
    // Both fresh tabs spawn at the same tile. Render the blue marker on a
    // neighboring free tile in that case, so two people stay visually distinct.
    // This changes display ONLY, never the transmitted or diagnostic location.
    const sameTile = partnerCell.i === pos.i && partnerCell.j === pos.j;
    const shown = sameTile ? (companionSpawn(roomInfo(), pos) ?? partnerCell) : partnerCell;
    const xy = cellCenter(shown.i, shown.j, roomInfo().size);
    partner.position.set(xy.x, 0, xy.z);
  }
}
if (twoTabRequested) {
  document.querySelector("header span.pill").textContent = "🧪 Chỉ 2 tab cùng trình duyệt · Không kết nối điện thoại";
  twoTabLab = createTwoTabPresenceLab({
    getLocalState: () => ({ room: roomId, cell: { ...pos } }),
    canOccupy: canOccupyLabCell,
    onRemoteChange: state => { remoteTabState = state; syncRemoteAvatar(); },
    onStatusChange: updateLabPanel,
    getPairKey: () => new URLSearchParams(location.search).get("pair") || "default"
  });
  addEventListener("pagehide", () => twoTabLab.stop());
  document.getElementById("lab-open")?.addEventListener("click", e => {
    // One explicit click pairs two tabs from this same top-level origin/profile.
    // Use a fresh ephemeral channel per attempt so old open labs cannot hijack it.
    const here = new URL(location.href);
    if (!twoTabLab.active && !/^[a-f0-9]{20}$/.test(here.searchParams.get("pair") || "") &&
        globalThis.crypto?.getRandomValues) {
      const raw = new Uint8Array(10);
      crypto.getRandomValues(raw);
      here.searchParams.set("pair", Array.from(raw, v => v.toString(16).padStart(2, "0")).join(""));
      here.searchParams.set("rev", "20261111b");
      history.replaceState(null, "", here.pathname + here.search + here.hash);
    }
    here.searchParams.set("join", "1");
    e.currentTarget.href = here.href;
    if (!twoTabLab.active && !twoTabLab.start()) {
      status.textContent = "Không thể bật kênh giữa hai tab trên trình duyệt này.";
    }
  });
  addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") { twoTabLab.publish(true); twoTabLab.tick(true); }
  });
}
function renderRoom() {
  activityPoseUntil = 0;
  clearPartnerGesture();
  clearActivityProps();
  avatar.scale.y = 1;
  body.rotation.z = 0;
  head.rotation.z = 0;
  clearActivityVisuals();
  disposeRoom();
  const { size, layout } = roomInfo(), W = size.w * CELL, D = size.d * CELL;
  const wall = WALL_COLORS.find(c => c.id === layout.wall)?.wall ?? 0xeaf5ff;
  const fc = FLOOR_COLORS.find(c => c.id === layout.floor)?.floor ?? 0xe8c9a0;
  block(0, -.09, 0, W, .18, D, fc);
  const H = size.wallH || 2.7, opening = 1.05;
  // Wall segments leave real openings at door positions, including the two visible walls.
  for (const side of ["L", "R", "T", "B"]) {
    const length = (side === "L" || side === "R") ? D : W;
    const cuts = house.doors.flatMap(door => [door.a, door.b]).filter(ep => ep.room === roomId)
      .filter(ep => side === "L" ? ep.cell.i === 0 : side === "R" ? ep.cell.i === size.w-1 : side === "T" ? ep.cell.j === 0 : ep.cell.j === size.d-1)
      .map(ep => (side === "L" || side === "R" ? ep.cell.j : ep.cell.i) * CELL + CELL/2);
    const intervals = cuts.map(c => [Math.max(0,c-opening/2),Math.min(length,c+opening/2)]).sort((a,b)=>a[0]-b[0]);
    let at = 0;
    const segment = (from,to) => {
      if (to-from < .01) return;
      const center = (from+to)/2-length/2;
      if (side === "L" || side === "R") block(side === "L" ? -W/2 : W/2,H/2,center,.14,H,to-from,wall);
      else block(center,H/2,side === "T" ? -D/2 : D/2,to-from,H,.14,wall);
    };
    for (const [a,b] of intervals) { segment(at,a); at=Math.max(at,b); }
    segment(at,length);
  }
  // Low-poly visual placeholders, footprints correspond to the collision engine.
  for (const it of layout.items) {
    const def = CATALOG[it.type]; if (!def || def.kind === "wall") continue;
    const w = (it.r & 1 ? def.d : def.w) * CELL, d = (it.r & 1 ? def.w : def.d) * CELL;
    const x = -W/2 + (it.gx + w/CELL/2)*CELL, z = -D/2 + (it.gz + d/CELL/2)*CELL;
    const rug = def.kind === "rug";
    const builder = REAL_MODELS[def.model];
    if (builder) {
      const model = builder(def); model.position.set(x + (def.off?.[0] || 0), 0, z + (def.off?.[1] || 0));
      model.rotation.y = (it.r & 3) * Math.PI/2; model.scale.multiplyScalar(def.scale || 1);
      floorGroup.add(model);
    } else block(x, rug ? .018 : .24, z, w*.92, rug ? .025 : .48, d*.92, rug ? 0xf2a9c4 : 0x9fcbb6);
  }
  // Visible doorway markers align with actual openings in the wall segments.
  for (const door of house.doors) {
    const endpoint = door.a.room === roomId ? door.a : door.b.room === roomId ? door.b : null;
    if (!endpoint) continue;
    const c = cellCenter(endpoint.cell.i, endpoint.cell.j, size);
    const m = block(c.x, .025, c.z, .45, .045, .45, 0xffd36e); m.userData.doorId = door.id;
  }
  const c = cellCenter(pos.i, pos.j, size); avatar.position.set(c.x, 0, c.z);
  if (twoTabRequested) {
    // In lab mode this mesh belongs ONLY to the other tab, not the AI companion.
    partner.visible = false; partnerCell = null; syncRemoteAvatar();
  } else {
    const companionCell = partnerActive ? companionSpawn(roomInfo(), pos) : null;
    partnerCell = companionCell;
    partner.visible = Boolean(companionCell);
    if (companionCell) {
      const cp = cellCenter(companionCell.i, companionCell.j, size);
      partner.position.set(cp.x, 0, cp.z);
    } else if (partnerActive) partnerActive = false;
  }
  walking = [];
  roomsUI.replaceChildren();
  for (const [id, def] of Object.entries(HOUSE_ROOMS)) {
    const b = document.createElement("button"); b.textContent = names[id]; b.setAttribute("aria-current", String(id === roomId));
    b.addEventListener("click", () => { if (id !== roomId) { status.textContent = "Hãy đi qua cửa để sang " + def.name; } });
    roomsUI.append(b);
  }
  activitiesUI.replaceChildren();
  const action = activities[roomId];
  const activityButton = document.createElement("button");
  activityButton.textContent = action.label;
  activityButton.addEventListener("click", () => {
    const route = routeToFurniture(roomInfo(), pos, roomId);
    if (!route) { status.textContent = "Không có lối đến đồ vật để thực hiện hoạt động."; return; }
    pendingDoor = null;
    clearPartnerGesture();
    clearActivityVisuals();
    walking = route.slice(1).map(c => cellCenter(c.i, c.j, roomInfo().size));
    pendingActivity = { room: roomId, action };
    status.textContent = "Đang đi đến đồ vật để " + action.label;
    if (!walking.length) finishActivity();
  });
  activitiesUI.append(activityButton);
  if (twoTabRequested) {
    const tabButton = document.createElement("button");
    labControlButton = tabButton;
    tabButton.textContent = twoTabLab.active ? "⛔ Ngắt kết nối tab" : "🔗 Kết nối hai tab";
    tabButton.addEventListener("click", () => {
      if (twoTabLab.active) {
        twoTabLab.stop();
        status.textContent = "Đã ngắt kết nối. Không có dữ liệu nào được lưu.";
      } else if (twoTabLab.start()) {
        status.textContent = "Đã bật! Mở cùng URL trên tab thứ hai và nhấn Kết nối hai tab.";
      } else {
        status.textContent = "Trình duyệt chưa hỗ trợ BroadcastChannel. Chế độ này không hoạt động.";
      }
      tabButton.textContent = twoTabLab.active ? "⛔ Ngắt kết nối tab" : "🔗 Kết nối hai tab";
    });
    activitiesUI.append(tabButton);
  } else {
  const companionButton = document.createElement("button");
  companionButton.textContent = partnerActive ? "🙋 Ẩn bạn mô phỏng" : "🧑‍🤝‍🧑 Gọi bạn mô phỏng";
  const highFiveButton = document.createElement("button");
  highFiveButton.textContent = "💞 Chạm tay";
  highFiveButton.disabled = !partnerActive;
  companionButton.addEventListener("click", () => {
    clearPartnerGesture(); clearActivityVisuals();
    partnerActive = !partnerActive;
    partnerCell = partnerActive ? companionSpawn(roomInfo(), pos) : null;
    partner.visible = Boolean(partnerCell);
    if (partnerCell) {
      const cp = cellCenter(partnerCell.i, partnerCell.j, roomInfo().size);
      partner.position.set(cp.x, 0, cp.z);
      status.textContent = "Bạn mô phỏng đã tới! Đây chưa phải người thứ hai trên thiết bị khác.";
    } else {
      partnerActive = false;
      status.textContent = "Đã ẩn bạn mô phỏng (hoặc không tìm được ô trống).";
    }
    companionButton.textContent = partnerActive ? "🙋 Ẩn bạn mô phỏng" : "🧑‍🤝‍🧑 Gọi bạn mô phỏng";
    highFiveButton.disabled = !partnerActive;
  });
  highFiveButton.addEventListener("click", () => {
    if (!partnerActive || !partnerCell) return;
    const route = routeCompanionToPlayer(roomInfo(), partnerCell, pos);
    if (!route) { status.textContent = "Chưa tìm được đường trống để chạm tay."; return; }
    walking = []; pendingDoor = null; pendingActivity = null; activityPoseUntil = 0;
    clearActivityProps(); clearPartnerGesture(); clearActivityVisuals();
    partnerWalking = route.slice(1).map(c => cellCenter(c.i, c.j, roomInfo().size));
    pendingPartnerGesture = true;
    status.textContent = "Bạn mô phỏng đang đi tới để chạm tay...";
    if (!partnerWalking.length) finishPartnerGesture();
  });
  activitiesUI.append(companionButton, highFiveButton);
  }
  doorsUI.replaceChildren();
  for (const door of house.doors) {
    const endpoint = door.a.room === roomId ? door.a : door.b.room === roomId ? door.b : null;
    if (!endpoint) continue;
    const dest = door.a.room === roomId ? door.b : door.a;
    const b = document.createElement("button"); b.textContent = "🚪 " + HOUSE_ROOMS[dest.room].name;
    b.addEventListener("click", () => goDoor(door.id, endpoint, dest)); doorsUI.append(b);
  }
  status.textContent = "Đang ở " + HOUSE_ROOMS[roomId].name;
}
function goDoor(id, endpoint, dest) {
  clearPartnerGesture();
  pendingActivity = null;
  activityPoseUntil = 0;
  clearActivityProps();
  clearActivityVisuals();
  // A door button must route to its own doorway, not an arbitrary shortest route
  // through another room. Both endpoints must remain free before walking begins.
  const sourceRoom = roomInfo(), targetRoom = house.rooms[dest.room];
  const sourceGrid = blockGrid(sourceRoom.layout, sourceRoom.size);
  const targetGrid = blockGrid(targetRoom.layout, targetRoom.size);
  if (!cellFree(sourceGrid, endpoint.cell.i, endpoint.cell.j) ||
      !cellFree(targetGrid, dest.cell.i, dest.cell.j)) {
    status.textContent = "Cửa đang bị đồ đạc chắn."; return;
  }
  const path = findPath(sourceGrid, pos, endpoint.cell);
  if (!path) { status.textContent = "Lối đi bị chặn, hãy dời đồ khỏi cửa."; return; }
  walking = path.slice(1).map(c => cellCenter(c.i, c.j, sourceRoom.size));
  pendingDoor = { id, endpoint: { room: roomId, cell: endpoint.cell }, dest };
  status.textContent = "Đang đi đến cửa " + HOUSE_ROOMS[dest.room].name;
  if (!walking.length) crossDoor();
}
let pendingDoor = null;
function finishActivity() {
  if (!pendingActivity || pendingActivity.room !== roomId) return;
  const { action } = pendingActivity;
  pendingActivity = null;
  activityCounts[roomId] += 1;
  activityPoseUntil = performance.now() + 2200;
  createActivityProps(roomId);
  showActivityVisual(roomId);
  status.textContent = action.message + " · Lần " + activityCounts[roomId];
}
function crossDoor() {
  if (!pendingDoor) return;
  const { id, endpoint } = pendingDoor;
  const current = worldToCell(avatar.position.x, avatar.position.z, roomInfo().size);
  if (current.i !== endpoint.cell.i || current.j !== endpoint.cell.j) { pendingDoor = null; status.textContent = "Chưa tới cửa, hãy thử lại."; return; }
  const result = transitionAtDoor(house, { room: roomId, cell: current }, id);
  pendingDoor = null;
  if (!result) { status.textContent = "Cửa đang bị chặn."; return; }
  roomId = result.room; pos = result.cell; renderRoom();
}
const ray = new THREE.Raycaster(), pointer = new THREE.Vector2(), plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
canvas.addEventListener("pointerup", e => {
  const bounds = canvas.getBoundingClientRect();
  if (!bounds.width || !bounds.height) return;
  pointer.set((e.clientX - bounds.left) / bounds.width * 2 - 1,
              1 - (e.clientY - bounds.top) / bounds.height * 2);
  ray.setFromCamera(pointer, camera);
  const point = new THREE.Vector3();
  if (!ray.ray.intersectPlane(plane, point)) return;
  const { size } = roomInfo();
  const halfW = size.w * CELL / 2, halfD = size.d * CELL / 2;
  if (Math.abs(point.x) >= halfW || Math.abs(point.z) >= halfD) return;
  pendingDoor = null;
  pendingActivity = null;
  clearPartnerGesture();
  activityPoseUntil = 0;
  clearActivityProps();
  clearActivityVisuals();
  const grid = blockGrid(roomInfo().layout, roomInfo().size);
  const path = worldPath(grid, avatar.position.x, avatar.position.z, point.x, point.z, roomInfo().size);
  if (!path) { status.textContent = "Không tìm thấy đường đi."; return; }
  walking = path.slice(1); status.textContent = "Đang đi trong " + HOUSE_ROOMS[roomId].name;
});
function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false);
  const aspect = w/h, span = 6.6;
  camera.left = -span * aspect; camera.right = span * aspect; camera.top = span; camera.bottom = -span;
  camera.updateProjectionMatrix();
}
addEventListener("resize", resize); resize();
function frame(now) {
  const dt = Math.min((now-last)/1000, .05); last = now;
  if (walking.length) {
    const target = walking[0], dx = target.x-avatar.position.x, dz = target.z-avatar.position.z, d = Math.hypot(dx,dz), step = dt*2.4;
    if (d <= step) { avatar.position.x = target.x; avatar.position.z = target.z; walking.shift(); }
    else { avatar.position.x += dx/d*step; avatar.position.z += dz/d*step; }
    pos = worldToCell(avatar.position.x, avatar.position.z, roomInfo().size);
  } else if (pendingDoor) crossDoor();
  else if (pendingActivity) finishActivity();
  if (partnerWalking.length) {
    const target = partnerWalking[0], dx = target.x-partner.position.x, dz = target.z-partner.position.z;
    const distance = Math.hypot(dx, dz), step = dt * 2.2;
    if (distance <= step) {
      partner.position.set(target.x, 0, target.z); partnerWalking.shift();
    } else {
      partner.position.x += dx / distance * step; partner.position.z += dz / distance * step;
    }
    partnerCell = worldToCell(partner.position.x, partner.position.z, roomInfo().size);
  } else if (pendingPartnerGesture) finishPartnerGesture();
  const partnerActing = partner.visible && now < partnerGestureUntil;
  partnerBody.rotation.z = partnerActing ? Math.sin(now * .009) * .13 : 0;
  partnerHead.rotation.z = partnerActing ? Math.sin(now * .007) * .09 : 0;
  partner.scale.y = partnerActing ? .96 : 1;
  if (partnerGestureUntil && !partnerActing) {
    partnerGestureUntil = 0;
    clearActivityVisuals();
  }
  const acting = now < activityPoseUntil && !walking.length;
  if (!acting && activityProps.children.length) clearActivityProps();
  const t = now * .001;
  if (acting && roomId === "khach") {
    // A relaxed tea-time lean and small nod.
    body.rotation.z = Math.sin(t * 2.8) * .045;
    head.rotation.z = Math.sin(t * 3.5) * .08;
    avatar.scale.y = .94;
  } else if (acting && roomId === "bep") {
    // Brisk cooking motion, as if stirring at the counter.
    body.rotation.z = Math.sin(t * 10) * .11;
    head.rotation.z = Math.sin(t * 5) * .045;
    avatar.scale.y = .98 + Math.sin(t * 9) * .025;
  } else if (acting && roomId === "ngu") {
    // Quiet writing: gentle forward bend and small head movements.
    body.rotation.z = -.10 + Math.sin(t * 3) * .015;
    head.rotation.z = -.12 + Math.sin(t * 4) * .025;
    avatar.scale.y = .92;
  } else if (partnerActing) {
    // Both characters react to the local high-five, not just the companion.
    body.rotation.z = Math.sin(t * 9) * .12;
    head.rotation.z = Math.sin(t * 7) * .065;
    avatar.scale.y = .96;
  } else {
    body.rotation.z = 0;
    head.rotation.z = 0;
    avatar.scale.y = 1;
  }
  if (activityVisualRoom === roomId) {
    activityVisuals.position.y = Math.sin(now * .003) * .10;
    activityVisuals.rotation.y += dt * .6;
  }
  // Publish only a coarse, validated tile; no Firebase/network, no per-frame writes.
  if (twoTabLab?.active) twoTabLab.tick();
  const target = avatar.position.clone().add(new THREE.Vector3(10, 12, 12));
  camera.position.lerp(target, .1); camera.lookAt(avatar.position.x, .4, avatar.position.z);
  renderer.render(scene, camera); requestAnimationFrame(frame);
}
// Read-only diagnostic snapshot for end-to-end checks; never exposes user data.
window.__NHA3D_PREVIEW_STATE__ = () => ({
  room: roomId,
  walking: walking.length,
  pendingActivity: Boolean(pendingActivity),
  pendingDoor: Boolean(pendingDoor),
  props: activityProps.children.length,
  effects: activityVisuals.children.length,
  acting: performance.now() < activityPoseUntil,
  counts: { ...activityCounts },
  partner: { mode: twoTabRequested ? "two-tab-lab" : "local-demo",
    diagnostics: twoTabRequested ? twoTabLab?.snapshot() : null, visible: partner.visible,
    cell: partnerCell && { ...partnerCell }, walking: partnerWalking.length,
    gesture: performance.now() < partnerGestureUntil,
    labActive: Boolean(twoTabLab?.active),
    remoteRoom: remoteTabState?.room ?? null }
});
renderRoom();
if (twoTabRequested) {
  updateLabPanel(twoTabLab.snapshot());
  if (new URLSearchParams(location.search).get("join") === "1") {
    if (!twoTabLab.start()) status.textContent = "Không thể tự kết nối tab mới.";
    else status.textContent = "Đã bật tab mới. Đang tìm tab đầu tiên...";
  }
}
requestAnimationFrame(frame);
