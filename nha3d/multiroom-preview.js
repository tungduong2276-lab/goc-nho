// Three-room visual prototype. No Firebase, no localStorage, no edits to legacy house.
import * as THREE from "three";
import * as F from "./xuong/furn.js";
import { CELL, CATALOG, WALL_COLORS, FLOOR_COLORS } from "./catalog.mjs";
import { makeHouse, HOUSE_ROOMS, transitionAtDoor, routeHouse } from "./multiroom.mjs";
import { cellCenter, blockGrid, worldPath, worldToCell } from "./engine.mjs";

const house = makeHouse();
const canvas = document.querySelector("#world"), status = document.querySelector("#status");
const doorsUI = document.querySelector("#doors"), roomsUI = document.querySelector("#rooms");
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
const avatar = new THREE.Group(); scene.add(avatar);
const body = new THREE.Mesh(new THREE.CapsuleGeometry(.21, .43, 4, 8), new THREE.MeshStandardMaterial({ color: 0xe75b91 }));
body.position.y = .53; avatar.add(body);
const head = new THREE.Mesh(new THREE.SphereGeometry(.26, 16, 12), new THREE.MeshStandardMaterial({ color: 0xffd9b9 }));
head.position.y = 1.02; avatar.add(head);
const hair = new THREE.Mesh(new THREE.SphereGeometry(.27, 16, 10, 0, Math.PI * 2, 0, Math.PI * .48), new THREE.MeshStandardMaterial({ color: 0x41384c }));
hair.position.y = 1.08; avatar.add(hair);
const mat = c => new THREE.MeshStandardMaterial({ color: c, roughness: .94 });
const REAL_MODELS = { "F.sofa": () => F.sofa(), "F.coffeeTable": () => F.coffeeTable(), "F.bookshelfLow": () => F.bookshelfLow(), "F.pothos": () => F.pothos(), "F.petBed": () => F.petBed() };
function disposeRoom() { floorGroup.traverse(o => { if (o.isMesh && o.userData.previewOwned) { o.geometry.dispose(); for (const m of (Array.isArray(o.material) ? o.material : [o.material])) m.dispose(); } }); floorGroup.clear(); }
function block(x, y, z, w, h, d, color) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color)); m.position.set(x, y, z); m.userData.previewOwned = true; floorGroup.add(m); return m;
}
let roomId = "khach", pos = { i: 8, j: 10 }, walking = [], last = performance.now();
const names = { khach: "🛋️ Phòng khách", bep: "🍳 Phòng bếp", ngu: "🛏️ Phòng ngủ" };
function roomInfo() { return house.rooms[roomId]; }
function renderRoom() {
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
    if (builder && !rug) {
      const model = builder(); model.position.set(x + (def.off?.[0] || 0), 0, z + (def.off?.[1] || 0));
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
  walking = [];
  roomsUI.replaceChildren();
  for (const [id, def] of Object.entries(HOUSE_ROOMS)) {
    const b = document.createElement("button"); b.textContent = names[id]; b.setAttribute("aria-current", String(id === roomId));
    b.addEventListener("click", () => { if (id !== roomId) { status.textContent = "Hãy đi qua cửa để sang " + def.name; } });
    roomsUI.append(b);
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
  const start = { room: roomId, cell: pos };
  const route = routeHouse(house, start, { room: dest.room, cell: dest.cell });
  if (!route) { status.textContent = "Lối đi bị chặn, hãy dời đồ khỏi cửa."; return; }
  const doorStep = route.find(s => s.type === "door" && s.id === id);
  if (!doorStep || doorStep.from.room !== roomId) { status.textContent = "Không tìm thấy lối qua cửa này."; return; }
  const walk = route.find(s => s.type === "walk" && s.room === roomId);
  if (walk) {
    walking = walk.cells.slice(1).map(c => cellCenter(c.i, c.j, roomInfo().size));
    // Route might begin at the same cell; transition after walking in the frame loop.
  } else walking = [];
  pendingDoor = { id, endpoint: doorStep.from, dest };
  if (!walking.length) crossDoor();
}
let pendingDoor = null;
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
  pointer.set(e.clientX / innerWidth * 2 - 1, 1 - e.clientY / innerHeight * 2);
  ray.setFromCamera(pointer, camera);
  const point = new THREE.Vector3();
  if (!ray.ray.intersectPlane(plane, point)) return;
  pendingDoor = null;
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
  const target = avatar.position.clone().add(new THREE.Vector3(10, 12, 12));
  camera.position.lerp(target, .1); camera.lookAt(avatar.position.x, .4, avatar.position.z);
  renderer.render(scene, camera); requestAnimationFrame(frame);
}
renderRoom(); requestAnimationFrame(frame);
