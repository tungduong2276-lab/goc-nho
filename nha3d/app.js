// Góc Nhỏ — bản thử Nhà 3D kiểu Play Together.
// Dựng trực tiếp bằng three.js với chính bộ hình của _xuong-3d (toon 3 bậc, viền xanh than, camera trực giao 45°).
// KHÔNG đọc/ghi Firebase: bố cục, quần áo và buổi trong ngày chỉ lưu localStorage của trình duyệt này.
import * as THREE from "three";
import { C, setOutline, TIMES } from "./xuong/lib.js";
import * as F from "./xuong/furn.js";
import { OBJ, plantPot, rugRound, rugRect } from "./xuong/rooms2.js";
import { buildAvatar, DEFAULT_LOOK, HAIRS, HAIR_COLORS, TOPS, BOTS, HATS, ACCS, EXPRS } from "./xuong/rig.js";
import { buildCat } from "./xuong/pet.js";
import { CELL, ROOM, CATALOG, CATEGORIES, WALL_COLORS, FLOOR_COLORS, DEFAULT_LAYOUT } from "./catalog.mjs";
import * as E from "./engine.mjs";

const $ = s => document.querySelector(s);
const W = ROOM.w * CELL, D = ROOM.d * CELL;
const NAMES = { anh: "Anh", em: "Em" };
const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

// ---------- lưu trên máy ----------
const KEY = { layout: "gocnho.nha3d.layout.v1", looks: "gocnho.nha3d.looks.v1", me: "gocnho.nha3d.me", time: "gocnho.nha3d.time" };
const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* chế độ riêng tư: bỏ qua */ } }
};
function loadLooks() {
  const def = E.clone(DEFAULT_LOOK);
  try {
    const raw = JSON.parse(store.get(KEY.looks) || "null");
    for (const who of ["anh", "em"]) {
      const l = raw && raw[who]; if (!l) continue;
      if (HAIRS[l.hair]) def[who].hair = l.hair; if (HAIR_COLORS[l.hc]) def[who].hc = l.hc;
      if (TOPS[l.top]) def[who].top = l.top; if (BOTS[l.bot]) def[who].bot = l.bot;
      if (HATS[l.hat]) def[who].hat = l.hat; if (ACCS[l.acc]) def[who].acc = l.acc;
    }
  } catch { /* dùng mặc định */ }
  return def;
}

const S = {
  mode: "play",
  layout: E.deserialize(store.get(KEY.layout) || "null").layout,
  looks: loadLooks(),
  me: store.get(KEY.me) === "em" ? "em" : "anh",
  time: TIMES[store.get(KEY.time)] ? store.get(KEY.time) : "ngay",
  selected: null,
  history: new E.History(40),
  seats: new Map(),      // "uid:k" -> actor
  transient: new Map()   // uid -> trạng thái tạm (giường đang ngủ), không lưu
};
S.G = E.blockGrid(S.layout);
const saveLayout = () => store.set(KEY.layout, E.serialize(S.layout));
// Nút "Về" chỉ có nghĩa khi bản thử nằm cạnh app Góc Nhỏ (…/goc-nho/nha3d/ hoặc máy test).
if (!/\/goc-nho\/nha3d\/|^\/nha3d\//.test(location.pathname) || /\.(web\.app|firebaseapp\.com)$/.test(location.hostname)) $(".back").hidden = true;

// ---------- three.js ----------
const canvas = $("#world");
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
} catch (e) {
  $("#loading").innerHTML = "<p>Máy này chưa hỗ trợ WebGL nên chưa xem được nhà 3D.</p>";
  throw e;
}
const DPR = Math.min(window.devicePixelRatio || 1, 2);
renderer.setPixelRatio(DPR);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
const amb = new THREE.AmbientLight(0xffffff, 1.7);
const key = new THREE.DirectionalLight(0xffffff, 0.9);
key.position.set(-5, 12, 1.2); key.castShadow = true;
Object.assign(key.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7, near: 0.1, far: 40 });
key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -0.0006; key.shadow.normalBias = 0.02; key.shadow.radius = 3;
const fill = new THREE.DirectionalLight(0xffffff, 0.36); fill.position.set(8, 5, -6);
scene.add(amb, key, key.target, fill);

const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -100, 200);
const CAMDIR = new THREE.Vector3(1, 1, 1).normalize();
const RIGHT = new THREE.Vector3(1, 0, -1).normalize();   // phải màn hình trên mặt sàn
const UPG = new THREE.Vector3(-1, 0, -1).normalize();    // lên màn hình trên mặt sàn
const GROUND_STRETCH = 1 / Math.sin(Math.atan(1 / Math.SQRT2)); // 1 px dọc ≈ 1.73 px sàn
const cam = { target: new THREE.Vector3(0, 0.6, 0.6), goal: new THREE.Vector3(0, 0.6, 0.6), ppm: 66, goalPpm: 66, shift: 0 };

function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false);
  setOutline(2.2 * DPR, w * DPR, h * DPR);
  // ppm để thấy trọn phòng (dùng cho chế độ Trang trí)
  const pts = [];
  for (const x of [-W / 2, W / 2]) for (const z of [-D / 2, D / 2]) for (const y of [0, ROOM.wallH]) pts.push(new THREE.Vector3(x, y, z));
  const m = new THREE.Matrix4().lookAt(CAMDIR, new THREE.Vector3(), new THREE.Vector3(0, 1, 0)).invert();
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (const p of pts) { p.applyMatrix4(m); x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); y0 = Math.min(y0, p.y); y1 = Math.max(y1, p.y); }
  EXT.x = x1 - x0; EXT.y = y1 - y0;
  if (S.mode === "edit") editFit();
}
const EXT = { x: 12, y: 9 };
// Chế độ Trang trí: thấy trọn phòng trong khoảng giữa thanh trên và kho đồ.
function editFit() {
  const trayH = $(".tray").offsetHeight || 190, topH = 72;
  cam.goalPpm = Math.max(20, Math.min(innerWidth * 0.9 / EXT.x, (innerHeight - trayH - topH - 8) / EXT.y));
  cam.shift = (trayH - topH) / 2;
  cam.goal.set(0, 1.1, 0);
}
function updateCamera() {
  const w = innerWidth / cam.ppm / 2, h = innerHeight / cam.ppm / 2, s = cam.shift / cam.ppm;
  Object.assign(camera, { left: -w, right: w, top: h - s, bottom: -h - s });
  camera.position.copy(cam.target).addScaledVector(CAMDIR, 60);
  camera.up.set(0, 1, 0); camera.lookAt(cam.target);
  camera.updateProjectionMatrix(); camera.updateMatrixWorld();
}
const v3 = new THREE.Vector3();
function toScreen(x, y, z) { v3.set(x, y, z).project(camera); return [(v3.x + 1) / 2 * innerWidth, (1 - v3.y) / 2 * innerHeight]; }

// ---------- buổi trong ngày ----------
const TIME_ORDER = ["sang", "ngay", "chieu", "dem"], TIME_ICON = { sang: "🌅", ngay: "☀️", chieu: "🌇", dem: "🌙" };
const SKY = { sang: 0xFFD6DE, ngay: 0xBFE3FA, chieu: 0xFFC2A0, dem: 0x2A3D6E };
const hex = n => "#" + n.toString(16).padStart(6, "0");
function applyTime() {
  const T = TIMES[S.time];
  amb.color.set(T.amb); amb.intensity = T.ai; key.color.set(T.key); key.intensity = T.ki; fill.color.set(T.fill); fill.intensity = T.fi;
  document.documentElement.style.setProperty("--sky1", hex(T.sky[0]));
  document.documentElement.style.setProperty("--sky2", hex(T.sky[1]));
  $("#btn-time").textContent = TIME_ICON[S.time];
  for (const it of S.layout.items) if (it.type === "cuaSo") refreshView(it);
}

// ---------- vỏ phòng ----------
let shell = null, grid = null;
function buildShell() {
  if (shell) scene.remove(shell);
  const wc = (WALL_COLORS.find(c => c.id === S.layout.wall) || WALL_COLORS[0]).wall;
  const fc = FLOOR_COLORS.find(c => c.id === S.layout.floor) || FLOOR_COLORS[0];
  shell = F.roomShell({ n: W, d: D, h: ROOM.wallH, wallL: wc, wallR: wc, floor: fc.floor, plank: fc.plank });
  scene.add(shell);
}
function buildGrid() {
  const pts = [];
  for (let i = 0; i <= ROOM.w; i++) pts.push(-W / 2 + i * CELL, 0.045, -D / 2, -W / 2 + i * CELL, 0.045, D / 2);
  for (let j = 0; j <= ROOM.d; j++) pts.push(-W / 2, 0.045, -D / 2 + j * CELL, W / 2, 0.045, -D / 2 + j * CELL);
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
  grid = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: C.navy, transparent: true, opacity: 0.16 }));
  grid.visible = false; scene.add(grid);
}

// ---------- đồ đạc ----------
const col = k => (typeof k === "string" ? C[k] : k);
const BUILDERS = {
  "F.sofa": () => F.sofa(), "F.coffeeTable": () => F.coffeeTable(), "F.cushion": () => F.cushion(C.pink),
  "F.bookshelfLow": () => F.bookshelfLow(), "F.jar": () => F.jar("day"), "F.radio": s => F.radio(!!s),
  "F.floorLamp": s => F.floorLamp(!!s), "F.pothos": () => F.pothos(), "F.petBed": () => F.petBed(), "F.rug": () => F.rug(),
  "F.windowW": () => F.windowW({ sky: SKY[S.time], stars: S.time === "dem", moon: S.time === "dem", cloud: S.time === "ngay" || S.time === "sang" }),
  "F.photoFrame": () => F.photoFrame(), "F.corkboard": (s, a) => F.corkboard(...(a || [])), "F.calendar": () => F.calendar(),
  plantPot: () => plantPot(), rugRound: (s, a) => rugRound(a[0], col(a[1]), col(a[2])), rugRect: (s, a) => rugRect(a[0], a[1], col(a[2]), col(a[3]))
};
for (const k of Object.keys(OBJ)) BUILDERS["OBJ." + k] = s => OBJ[k](s ?? "");

export function makeModel(type, state) {
  const def = CATALOG[type], sc = def.scale ?? 1;
  const st = state !== undefined ? state : (def.states ? def.states[0] : undefined);
  const m = BUILDERS[def.model](st, def.args);
  const g = new THREE.Group();
  m.scale.multiplyScalar(sc);
  if (def.off) m.position.set(m.position.x + def.off[0] * sc, m.position.y, m.position.z + def.off[1] * sc);
  g.add(m);
  return g;
}
const itemsG = new THREE.Group(); scene.add(itemsG);
const views = new Map(); // uid -> { root, height }
function stateOf(it) { return S.transient.has(it.uid) ? S.transient.get(it.uid) : it.state; }
function placeView(view, it, lift = 0) {
  const p = E.itemPose(it), def = CATALOG[it.type];
  const inset = def.kind === "wall" ? 0.05 : 0;
  view.root.position.set(p.x + (it.wall === "L" ? inset : 0), p.y + lift, p.z + (it.wall === "R" ? inset : 0));
  view.root.rotation.y = p.ry;
}
function refreshView(it) {
  const old = views.get(it.uid);
  if (old) itemsG.remove(old.root);
  const root = makeModel(it.type, stateOf(it));
  root.userData.uid = it.uid;
  root.traverse(o => { o.userData.uid = it.uid; });
  const view = { root };
  placeView(view, it);
  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root);
  view.height = box.max.y;
  itemsG.add(root); views.set(it.uid, view);
}
function rebuildAll() {
  for (const v of views.values()) itemsG.remove(v.root);
  views.clear();
  for (const it of S.layout.items) refreshView(it);
  S.G = E.blockGrid(S.layout);
}
const itemByUid = uid => S.layout.items.find(i => i.uid === uid);

// ---------- nhân vật ----------
const ARM0 = [-0.32, 0.32];
class Actor {
  constructor(who) {
    this.who = who; this.root = new THREE.Group(); scene.add(this.root);
    this.x = 0; this.z = 0; this.face = 0; this.path = []; this.onArrive = null; this.speed = 1.75;
    this.mode = "idle"; this.seat = null; this.walk = 0; this.phase = 0; this.t = 0; this.act = null; this.actT = 0; this.expr = "vui";
    this.build();
  }
  build() {
    if (this.R) this.root.remove(this.R.root);
    this.R = buildAvatar(S.looks[this.who], this.expr);
    this.R.root.traverse(o => { o.userData.actor = this; });
    this.root.add(this.R.root);
    if (this.mode === "sit") this.applySitPose();
  }
  setFace(ex) { this.expr = ex; this.R.setFace(ex); }
  place(x, z, face = this.face) { this.x = x; this.z = z; this.face = face; }
  goTo(x, z, cb) {
    this.standUp();
    const p = E.worldPath(S.G, this.x, this.z, x, z);
    if (!p) { this.path = []; this.onArrive = null; return false; }
    this.path = p.slice(1); this.onArrive = cb || null; return true;
  }
  stop() { this.path = []; this.onArrive = null; }
  sitOn(item, seat) {
    this.stop(); this.mode = "sit"; this.seat = { uid: item.uid, k: seat.k };
    S.seats.set(item.uid + ":" + seat.k, this);
    this.place(seat.x, seat.z, seat.a); this.seatH = seat.h; this.applySitPose();
  }
  applySitPose() {
    const R = this.R;
    R.legs.forEach(l => { l.rotation.x = -1.45; });
    R.arms.forEach((a, i) => { a.rotation.set(-0.55, 0, ARM0[i] * 0.6); });
    R.root.position.y = this.seatH - 0.28;
  }
  standUp() {
    if (this.mode === "sleep") wake(this);
    if (this.mode !== "sit") return;
    const it = itemByUid(this.seat.uid);
    S.seats.delete(this.seat.uid + ":" + this.seat.k);
    this.mode = "idle"; this.R.root.position.y = 0;
    this.R.legs.forEach(l => { l.rotation.x = 0; });
    if (it) {
      const seat = E.seatsOf(it)[this.seat.k];
      const ap = seat && E.approachPoint(S.G, it, seat);
      if (ap) this.place(ap.x, ap.z, seat.a);
    }
    this.seat = null;
  }
  emote(kind, dur = 1.8) { this.act = kind; this.actT = dur; }
  update(dt) {
    this.t += dt;
    let moving = false;
    if (this.mode !== "sit" && this.mode !== "sleep" && this.path.length) {
      const goal = this.path[0], dx = goal.x - this.x, dz = goal.z - this.z, dist = Math.hypot(dx, dz), step = this.speed * dt;
      if (dist <= step) {
        this.x = goal.x; this.z = goal.z; this.path.shift();
        if (!this.path.length && this.onArrive) { const cb = this.onArrive; this.onArrive = null; cb(); }
      } else {
        this.x += dx / dist * step; this.z += dz / dist * step;
        this.turnTo(Math.atan2(dx, dz), dt);
      }
      moving = true;
    }
    if (this.joy) { moving = true; }
    this.walk += ((moving ? 1 : 0) - this.walk) * Math.min(1, dt * 10);
    this.animate(dt);
    this.root.position.set(this.x, 0, this.z);
    this.root.rotation.y = this.face;
  }
  turnTo(a, dt) {
    let d = a - this.face; d = Math.atan2(Math.sin(d), Math.cos(d));
    this.face += d * Math.min(1, dt * 14);
  }
  animate(dt) {
    const R = this.R;
    if (this.mode === "sit") {
      if (this.act) this.doAct(dt);
      return;
    }
    const w = this.walk;
    this.phase += dt * 10 * w;
    const s = Math.sin(this.phase);
    R.legs[0].rotation.x = s * 0.6 * w; R.legs[1].rotation.x = -s * 0.6 * w;
    R.arms.forEach((a, i) => a.rotation.set((i ? s : -s) * 0.5 * w, 0, ARM0[i]));
    R.root.position.y = reduced() ? 0 : Math.abs(s) * 0.035 * w;
    R.head.rotation.z = reduced() ? 0 : Math.sin(this.t * 1.7) * 0.025 * (1 - w);
    if (this.act) this.doAct(dt);
  }
  doAct(dt) {
    const R = this.R; this.actT -= dt;
    if (this.act === "wave") R.arms[1].rotation.set(-0.95, 0, 2.2 + Math.sin(this.t * 13) * 0.3);
    if (this.act === "hug") R.arms.forEach((a, i) => a.rotation.set(-1.25, 0, (i ? -1 : 1) * 0.25));
    if (this.act === "five") R.arms[1].rotation.set(-1.6, 0, 0.6);
    if (this.actT <= 0) { this.act = null; if (this.mode === "sit") this.applySitPose(); }
  }
}

function sleepIn(actor, item) {
  actor.stop(); actor.mode = "sleep"; actor.sleepUid = item.uid; actor.root.visible = false;
  S.transient.set(item.uid, "ngu"); refreshView(item);
  toast(NAMES[actor.who] + " đi ngủ rồi · chạm hoặc đẩy cần điều khiển để dậy");
}
function wake(actor) {
  const it = itemByUid(actor.sleepUid);
  actor.mode = "idle"; actor.root.visible = true;
  if (it) {
    S.transient.delete(it.uid); refreshView(it);
    const ap = E.approachPoint(S.G, it);
    if (ap) actor.place(ap.x, ap.z, ap.face + Math.PI);
  }
  actor.sleepUid = null;
}

// ---------- mèo ----------
const cat = { root: new THREE.Group(), x: -2.9, z: 0.9, face: 0.6, path: [], pose: "ngoi", t: 0, wait: 3, rest: 0 };
function buildCatModel(pose) {
  while (cat.root.children.length) cat.root.remove(cat.root.children[0]);
  const m = buildCat("trang", pose); m.scale.setScalar(0.8);
  m.traverse(o => { o.userData.cat = true; });
  cat.root.add(m); cat.pose = pose;
}
scene.add(cat.root);

// ---------- nhãn tên, bong bóng, tim ----------
const labels = $("#labels");
const tags = {};
function makeTag(who) { const el = document.createElement("div"); el.className = "nametag"; labels.appendChild(el); tags[who] = el; }
function bubble(x, y, z, text, ms = 2200) {
  const el = document.createElement("div"); el.className = "bubble"; el.textContent = text; labels.appendChild(el);
  const b = { el, x, y, z, until: performance.now() + ms }; bubbles.push(b); return b;
}
const bubbles = [];
function floatAt(x, y, z, char = "💗", n = 3) {
  const [sx, sy] = toScreen(x, y, z);
  for (let i = 0; i < n; i++) {
    const el = document.createElement("div"); el.className = "float"; el.textContent = char;
    el.style.left = sx + (i - (n - 1) / 2) * 16 + "px"; el.style.top = sy + "px"; el.style.setProperty("--dx", (Math.random() * 30 - 15) + "px");
    el.style.animationDelay = i * 0.18 + "s"; labels.appendChild(el); setTimeout(() => el.remove(), 2200);
  }
}
function ring(x, z) {
  const [sx, sy] = toScreen(x, 0.05, z); const el = document.createElement("div"); el.className = "ring";
  el.style.left = sx + "px"; el.style.top = sy + "px"; labels.appendChild(el); setTimeout(() => el.remove(), 800);
}
let toastTimer;
function toast(t) { const el = $("#toast"); el.textContent = t; el.classList.add("show"); clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove("show"), 2600); }

// ---------- dựng thế giới ----------
buildShell(); buildGrid(); rebuildAll(); buildCatModel("ngoi");
const actors = { anh: new Actor("anh"), em: new Actor("em") };
makeTag("anh"); makeTag("em");
function spawn() {
  const spots = [[1.25, 2.6], [2.0, 2.6]];
  ["anh", "em"].forEach((w, k) => {
    const c = E.worldToCell(...spots[k]), n = E.nearestFreeCell(S.G, c.i, c.j) || { i: 8, j: 12 };
    const p = E.cellCenter(n.i, n.j); actors[w].place(p.x + (k ? 0.12 : -0.12), p.z, k ? -0.6 : 0.6);
  });
}
spawn();
const me = () => actors[S.me];
const partner = () => actors[S.me === "anh" ? "em" : "anh"];
function updateMe() {
  $("#me-name").textContent = NAMES[S.me];
  tags.anh.textContent = NAMES.anh; tags.em.textContent = NAMES.em;
  tags[S.me].classList.add("me"); tags[S.me === "anh" ? "em" : "anh"].classList.remove("me");
}
updateMe(); applyTime(); resize();

// ---------- người kia tự sinh hoạt ----------
const rand = E.rng(Date.now() & 0xffff);
const AI = { timer: 2.5 };
const freeCell = () => {
  for (let k = 0; k < 40; k++) {
    const i = Math.floor(rand() * ROOM.w), j = Math.floor(rand() * ROOM.d);
    if (E.cellFree(S.G, i, j)) return E.cellCenter(i, j);
  }
  return null;
};
function freeSeats(item) { return E.seatsOf(item).filter(s => !S.seats.has(item.uid + ":" + s.k)); }
function goSit(actor, item, seat, say) {
  const ap = E.approachPoint(S.G, item, seat);
  if (!ap) return false;
  return actor.goTo(ap.x, ap.z, () => {
    if (S.seats.has(item.uid + ":" + seat.k)) return;
    actor.sitOn(item, seat);
    if (say) bubble(actor.x, 1.5, actor.z, say);
  });
}
function partnerThink(dt) {
  const p = partner(), m = me();
  if (p.mode === "sleep") return;
  AI.timer -= dt;
  if (AI.timer > 0 || p.path.length) return;
  AI.timer = 4 + rand() * 6;
  // Đang ngồi cạnh nhau → ngồi yên, thỉnh thoảng thả tim
  if (p.mode === "sit" && m.mode === "sit" && p.seat.uid === m.seat.uid) { if (rand() < 0.3) floatAt(p.x, p.seatH + 1.0, p.z, "💗", 2); return; }
  // Mình đang ngồi ở món có ghế trống → sang ngồi cạnh
  if (m.mode === "sit" && p.mode !== "sit") {
    const it = itemByUid(m.seat.uid), fs = it && freeSeats(it);
    if (fs && fs.length) { goSit(p, it, fs[0], "Cho " + NAMES[p.who].toLowerCase() + " ngồi cùng!"); return; }
  }
  if (p.mode === "sit" && rand() < 0.55) return; // ngồi thêm chút
  const r = rand();
  if (r < 0.45) { const c = freeCell(); if (c) p.goTo(c.x, c.z); }
  else if (r < 0.7) {
    const items = S.layout.items.filter(i => CATALOG[i.type].use?.type === "sit" && freeSeats(i).length);
    const it = items[Math.floor(rand() * items.length)];
    if (it) goSit(p, it, freeSeats(it)[0]);
  } else if (r < 0.85) {
    const c = E.worldToCell(m.x + 0.6, m.z + 0.3), n = E.nearestFreeCell(S.G, c.i, c.j);
    if (n) { const q = E.cellCenter(n.i, n.j); p.goTo(q.x, q.z, () => { p.face = Math.atan2(m.x - p.x, m.z - p.z); p.emote("wave"); }); }
  } else { p.emote("wave"); const ex = ["vui", "cuoi", "ngung", "nho"][Math.floor(rand() * 4)]; p.setFace(ex); }
}
function catThink(dt) {
  cat.t += dt;
  if (cat.rest > 0) { cat.rest -= dt; if (cat.rest <= 0) buildCatModel("ngoi"); return; }
  if (cat.path.length) {
    const g = cat.path[0], dx = g.x - cat.x, dz = g.z - cat.z, d = Math.hypot(dx, dz), st = 0.7 * dt;
    if (d <= st) { cat.x = g.x; cat.z = g.z; cat.path.shift(); if (!cat.path.length && cat.toBed) { cat.toBed = false; buildCatModel("nam"); cat.rest = 8 + rand() * 8; } }
    else { cat.x += dx / d * st; cat.z += dz / d * st; cat.face = Math.atan2(dx, dz); }
    return;
  }
  cat.wait -= dt;
  if (cat.wait > 0) return;
  cat.wait = 3 + rand() * 5;
  const bed = S.layout.items.find(i => i.type === "oMeo");
  let target = null;
  if (bed && rand() < 0.3) { const p = E.itemPose(bed); target = { x: p.x, z: p.z }; cat.toBed = true; }
  else target = freeCell();
  if (!target) return;
  const path = E.worldPath(bed && cat.toBed ? E.blockGrid({ items: S.layout.items.filter(i => i.uid !== bed.uid) }) : S.G, cat.x, cat.z, target.x, target.z);
  cat.path = path ? path.slice(1) : [];
  if (!cat.path.length) cat.toBed = false;
}

// ---------- điều khiển: cần gạt ----------
const joy = { el: $("#joy"), knob: $(".joy-knob"), id: null, x: 0, y: 0 };
joy.el.addEventListener("pointerdown", e => {
  joy.id = e.pointerId; joy.el.setPointerCapture(e.pointerId); joy.el.classList.add("active"); joyMove(e); hideActions();
  const m = me(); if (m.mode !== "idle") m.standUp(); m.stop();
});
joy.el.addEventListener("pointermove", e => { if (e.pointerId === joy.id) joyMove(e); });
const joyEnd = e => { if (e.pointerId !== joy.id) return; joy.id = null; joy.x = joy.y = 0; joy.knob.style.transform = ""; joy.el.classList.remove("active"); me().joy = false; };
joy.el.addEventListener("pointerup", joyEnd); joy.el.addEventListener("pointercancel", joyEnd);
function joyMove(e) {
  const r = joy.el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2, R = r.width / 2 - 14;
  let dx = e.clientX - cx, dy = e.clientY - cy; const l = Math.hypot(dx, dy);
  if (l > R) { dx *= R / l; dy *= R / l; }
  joy.knob.style.transform = `translate(${dx}px,${dy}px)`;
  joy.x = dx / R; joy.y = -dy / R;
}
const keys = new Set();
addEventListener("keydown", e => { if (e.target.closest?.("button,input")) return; keys.add(e.key.toLowerCase()); });
addEventListener("keyup", e => keys.delete(e.key.toLowerCase()));
function joyStep(dt) {
  let jx = joy.x, jy = joy.y;
  if (keys.has("arrowleft") || keys.has("a")) jx -= 1; if (keys.has("arrowright") || keys.has("d")) jx += 1;
  if (keys.has("arrowup") || keys.has("w")) jy += 1; if (keys.has("arrowdown") || keys.has("s")) jy -= 1;
  const m = me(), mag = Math.min(1, Math.hypot(jx, jy));
  m.joy = mag > 0.12 && S.mode === "play";
  if (!m.joy) return;
  if (m.mode === "sit" || m.mode === "sleep") m.standUp();
  m.stop();
  const dx = (RIGHT.x * jx + UPG.x * jy), dz = (RIGHT.z * jx + UPG.z * jy), l = Math.hypot(dx, dz) || 1, sp = m.speed * mag * dt;
  const n = E.slideMove(S.G, m.x, m.z, dx / l * sp, dz / l * sp);
  m.x = n.x; m.z = n.z; m.turnTo(Math.atan2(dx, dz), dt);
}

// ---------- chạm / kéo trên cảnh ----------
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
function setRay(cx, cy) { ndc.set(cx / innerWidth * 2 - 1, -(cy / innerHeight) * 2 + 1); ray.setFromCamera(ndc, camera); }
function floorPoint(cx, cy) { setRay(cx, cy); const p = new THREE.Vector3(); return ray.ray.intersectPlane(floorPlane, p) ? p : null; }
function pickAt(cx, cy) {
  setRay(cx, cy);
  const objs = [itemsG];
  if (S.mode === "play") objs.push(actors.anh.root, actors.em.root, cat.root);
  const hits = ray.intersectObjects(objs, true);
  for (const h of hits) {
    if (!h.object.visible) continue;
    const ud = h.object.userData;
    if (ud.actor && ud.actor.root.visible) return { actor: ud.actor };
    if (ud.cat) return { cat: true };
    if (ud.uid) return { uid: ud.uid, point: h.point };
  }
  return null;
}
function wallPoint(cx, cy) {
  setRay(cx, cy);
  const out = [];
  const pl = new THREE.Plane(new THREE.Vector3(1, 0, 0), W / 2), pr = new THREE.Plane(new THREE.Vector3(0, 0, 1), D / 2);
  const a = new THREE.Vector3(), b = new THREE.Vector3();
  if (ray.ray.intersectPlane(pl, a) && a.y > 0 && a.y < ROOM.wallH + 0.6 && Math.abs(a.z) <= D / 2 + 0.2) out.push({ wall: "L", along: a.z + D / 2, d: a.distanceTo(ray.ray.origin) });
  if (ray.ray.intersectPlane(pr, b) && b.y > 0 && b.y < ROOM.wallH + 0.6 && Math.abs(b.x) <= W / 2 + 0.2) out.push({ wall: "R", along: b.x + W / 2, d: b.distanceTo(ray.ray.origin) });
  out.sort((p, q) => p.d - q.d);
  return out[0] || null;
}

const ptrs = new Map();
let gesture = null; // {kind:'tap'|'pan'|'drag'|'pinch', ...}
canvas.addEventListener("pointerdown", e => {
  canvas.setPointerCapture(e.pointerId);
  ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY });
  if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; gesture = { kind: "pinch", d0: Math.hypot(a.x - b.x, a.y - b.y), ppm0: cam.goalPpm }; cancelDrag(); return; }
  gesture = { kind: "tap", x0: e.clientX, y0: e.clientY, t0: performance.now() };
  if (S.mode === "edit") {
    const hit = pickAt(e.clientX, e.clientY);
    if (hit && hit.uid) { startDrag(hit.uid, e.clientX, e.clientY); gesture.kind = "maybeDrag"; gesture.uid = hit.uid; }
  }
});
canvas.addEventListener("pointermove", e => {
  const p = ptrs.get(e.pointerId); if (!p) return;
  const px = p.x, py = p.y; p.x = e.clientX; p.y = e.clientY;
  if (!gesture) return;
  if (gesture.kind === "pinch" && ptrs.size >= 2) {
    const [a, b] = [...ptrs.values()];
    cam.goalPpm = THREE.MathUtils.clamp(gesture.ppm0 * Math.hypot(a.x - b.x, a.y - b.y) / gesture.d0, 26, 150); cam.ppm = cam.goalPpm; return;
  }
  const moved = Math.hypot(e.clientX - gesture.x0, e.clientY - gesture.y0) > 8;
  if (gesture.kind === "maybeDrag" && moved) gesture.kind = "drag";
  if (gesture.kind === "tap" && moved) gesture.kind = "pan";
  if (gesture.kind === "drag") dragTo(e.clientX, e.clientY);
  if (gesture.kind === "pan") {
    const dx = e.clientX - px, dy = e.clientY - py;
    cam.goal.addScaledVector(RIGHT, -dx / cam.ppm).addScaledVector(UPG, dy / cam.ppm * GROUND_STRETCH);
    cam.goal.x = THREE.MathUtils.clamp(cam.goal.x, -W / 2, W / 2); cam.goal.z = THREE.MathUtils.clamp(cam.goal.z, -D / 2, D / 2);
    cam.target.copy(cam.goal); cam.panned = performance.now();
  }
});
const endPtr = e => {
  ptrs.delete(e.pointerId);
  if (!gesture) return;
  if (gesture.kind === "pinch") { if (ptrs.size === 0) gesture = null; return; }
  if (gesture.kind === "drag") endDrag();
  else if (gesture.kind === "maybeDrag") { cancelDrag(); select(gesture.uid); }
  else if (gesture.kind === "tap" && e.type === "pointerup") onTap(e.clientX, e.clientY);
  gesture = null;
};
canvas.addEventListener("pointerup", endPtr); canvas.addEventListener("pointercancel", endPtr);
canvas.addEventListener("wheel", e => { e.preventDefault(); cam.goalPpm = THREE.MathUtils.clamp(cam.goalPpm * Math.exp(-e.deltaY * 0.0015), 26, 150); }, { passive: false });

function onTap(cx, cy) {
  hideActions();
  if (S.mode === "edit") { const hit = pickAt(cx, cy); if (hit && hit.uid) select(hit.uid); else select(null); return; }
  const m = me();
  if (m.mode === "sleep") { m.standUp(); return; }
  const hit = pickAt(cx, cy);
  if (hit && hit.actor) return actorMenu(hit.actor, cx, cy);
  if (hit && hit.cat) { floatAt(cat.x, 0.9, cat.z, "💗", 2); bubble(cat.x, 1.0, cat.z, "Meo~", 1400); return; }
  if (hit && hit.uid) return itemMenu(itemByUid(hit.uid), cx, cy);
  const p = floorPoint(cx, cy);
  if (!p || Math.abs(p.x) > W / 2 || Math.abs(p.z) > D / 2) return;
  if (m.goTo(p.x, p.z)) ring(p.x, p.z); else toast("Chỗ đó chưa tới được");
}

// ---------- menu hành động ----------
const actionsEl = $("#actions");
function showActions(title, list, wx, wy, wz) {
  actionsEl.innerHTML = "";
  const t = document.createElement("div"); t.className = "title"; t.textContent = title; actionsEl.appendChild(t);
  for (const [label, fn] of list) {
    const b = document.createElement("button"); b.textContent = label;
    b.addEventListener("click", () => { hideActions(); fn(); }); actionsEl.appendChild(b);
  }
  actionsEl.hidden = false; actionsEl._anchor = [wx, wy, wz]; positionFloating(actionsEl);
  actionsEl.querySelector("button")?.focus({ preventScroll: true });
}
function hideActions() { actionsEl.hidden = true; actionsEl._anchor = null; }
function positionFloating(el) {
  if (!el._anchor || el.hidden) return;
  const [sx, sy] = toScreen(...el._anchor), r = el.getBoundingClientRect();
  el.style.left = THREE.MathUtils.clamp(sx, r.width / 2 + 8, innerWidth - r.width / 2 - 8) + "px";
  el.style.top = THREE.MathUtils.clamp(sy - 8, r.height + 70, innerHeight - 160) + "px";
}
function itemMenu(it, cx, cy) {
  const def = CATALOG[it.type], view = views.get(it.uid), p = E.itemPose(it), m = me(), use = def.use;
  const anchor = [p.x, (view?.height || 1) + 0.15, p.z];
  if (!use) { bubble(...anchor, def.name, 1600); return; }
  const list = [];
  if (use.type === "sit") {
    list.push(["Ngồi", () => doSit(m, it)]);
    if (E.seatsOf(it).length > 1) list.push(["Ngồi cùng " + NAMES[partner().who], () => { doSit(m, it); setTimeout(() => { const fs = freeSeats(it); if (fs.length) goSit(partner(), it, fs[0], "Tới liền!"); }, 400); }]);
    if (use.toggle) list.push([stateOf(it) === use.toggle ? "Tắt máy" : "Bật máy", () => useItem(m, it, () => toggleState(it, use.toggle))]);
  }
  if (use.type === "sleep") list.push(["Đi ngủ", () => useItem(m, it, () => sleepIn(m, it))]);
  if (use.type === "toggle") {
    const on = stateOf(it) === use.on;
    list.push([on ? use.label.replace(/^(Mở|Bật)/, w => (w === "Mở" ? "Đóng" : "Tắt")).replace("Nấu ăn", "Tắt bếp").replace("Viết thư", "Cất thư") : use.label, () => useItem(m, it, () => toggleState(it, use.on))]);
  }
  if (use.type === "cycle") list.push([use.label, () => useItem(m, it, () => cycleState(it, use.states))]);
  if (use.type === "wardrobe") list.push([use.label, () => useItem(m, it, () => openWardrobe(it))]);
  if (use.type === "date") list.push([use.label, () => useItem(m, it, () => openDate())]);
  showActions(def.name, list, ...anchor);
}
function actorMenu(a, cx, cy) {
  const m = me(), anchor = [a.x, 1.45, a.z];
  if (a === m) { showActions(NAMES[a.who], [["Vẫy tay", () => a.emote("wave")], ["Thả tim", () => heart(a)]], ...anchor); return; }
  showActions(NAMES[a.who], [
    ["Ôm một cái", () => hug(m, a)],
    ["Đập tay", () => highFive(m, a)],
    ["Gọi lại đây", () => callOver(a)]
  ], ...anchor);
}
function useItem(actor, it, done) {
  const ap = E.approachPoint(S.G, it);
  if (!ap) { toast("Không có chỗ đứng để dùng món này"); return; }
  if (!actor.goTo(ap.x, ap.z, () => { actor.face = ap.face; done(); })) toast("Chưa đi tới được");
}
function doSit(actor, it) {
  const fs = freeSeats(it);
  if (!fs.length) { toast("Hết chỗ ngồi rồi"); return; }
  const best = fs.sort((a, b) => Math.hypot(a.x - actor.x, a.z - actor.z) - Math.hypot(b.x - actor.x, b.z - actor.z))[0];
  if (!goSit(actor, it, best)) toast("Chưa đi tới chỗ ngồi được");
}
function toggleState(it, on) {
  const def = CATALOG[it.type], cur = stateOf(it);
  it.state = cur === on ? def.states[0] : on; saveLayout(); refreshView(it);
  const p = E.itemPose(it), h = views.get(it.uid).height;
  const SAY = { tuLanh: ["Có bánh flan nè 🍮", "Còn hộp dâu 🍓", "Sữa chua nè!"], bepNau: ["Thơm quá!", "Món trứng chiên 🍳", "Nấu canh chua nha"], radio: ["♪ ♫"], mayDanhChu: ["Viết thư cho người thương…"], ruong: ["Toàn kỷ niệm…"] };
  if (it.state === on && SAY[it.type]) bubble(p.x, h + 0.2, p.z, SAY[it.type][Math.floor(rand() * SAY[it.type].length)]);
  if (it.type === "radio" && it.state === true) floatAt(p.x, h + 0.2, p.z, "♪", 3);
}
function cycleState(it, states) {
  const i = states.indexOf(stateOf(it)); it.state = states[(i + 1) % states.length]; saveLayout(); refreshView(it);
}
function heart(a) { a.emote("wave", 1.2); floatAt(a.x, 1.35, a.z, "💗", 4); }
function faceEachOther(a, b) { a.face = Math.atan2(b.x - a.x, b.z - a.z); b.face = Math.atan2(a.x - b.x, a.z - b.z); }
function meetFront(a, b, then) {
  b.standUp(); b.stop();
  const ox = Math.sin(b.face) * 0.55, oz = Math.cos(b.face) * 0.55;
  let c = E.worldToCell(b.x + ox, b.z + oz), n = E.nearestFreeCell(S.G, c.i, c.j);
  const tx = n && E.cellFree(S.G, c.i, c.j) && !E.circleBlocked(S.G, b.x + ox, b.z + oz) ? { x: b.x + ox, z: b.z + oz } : n && E.cellCenter(n.i, n.j);
  if (!tx || !a.goTo(tx.x, tx.z, () => { faceEachOther(a, b); then(); })) toast("Chưa tới gần được");
}
function hug(a, b) {
  AI.timer = 6;
  meetFront(a, b, () => { a.emote("hug", 2.4); b.emote("hug", 2.4); a.setFace("ngung"); b.setFace("cuoi"); floatAt((a.x + b.x) / 2, 1.4, (a.z + b.z) / 2, "💗", 5); setTimeout(() => { a.setFace("vui"); b.setFace("vui"); }, 2600); });
}
function highFive(a, b) {
  AI.timer = 5;
  meetFront(a, b, () => { a.emote("five", 1.2); b.emote("five", 1.2); floatAt((a.x + b.x) / 2, 1.3, (a.z + b.z) / 2, "✨", 2); bubble(b.x, 1.5, b.z, "Đập tay!", 1400); });
}
function callOver(b) {
  AI.timer = 8; const a = me();
  const c = E.worldToCell(a.x + Math.sin(a.face) * 0.6, a.z + Math.cos(a.face) * 0.6), n = E.nearestFreeCell(S.G, c.i, c.j);
  if (!n) return; const p = E.cellCenter(n.i, n.j);
  bubble(b.x, 1.5, b.z, "Đây đây!", 1400);
  b.goTo(p.x, p.z, () => { faceEachOther(b, a); b.emote("wave"); });
}

// ---------- biểu cảm & đổi người ----------
document.querySelectorAll("[data-emote]").forEach(b => b.addEventListener("click", () => {
  const m = me(); if (b.dataset.emote === "wave") m.emote("wave"); else heart(m);
}));
const facesEl = $("#faces");
for (const [k, name] of Object.entries(EXPRS)) {
  const b = document.createElement("button"); b.textContent = name;
  b.addEventListener("click", () => { me().setFace(k); facesEl.hidden = true; }); facesEl.appendChild(b);
}
$("#btn-face").addEventListener("click", () => { facesEl.hidden = !facesEl.hidden; });
$("#btn-me").addEventListener("click", () => {
  S.me = S.me === "anh" ? "em" : "anh"; store.set(KEY.me, S.me); updateMe();
  me().stop(); toast("Giờ mình là " + NAMES[S.me]);
});
$("#btn-time").addEventListener("click", () => {
  S.time = TIME_ORDER[(TIME_ORDER.indexOf(S.time) + 1) % 4]; store.set(KEY.time, S.time); applyTime();
});

// ---------- tủ đồ ----------
const WD_TABS = [["hair", "Kiểu tóc", HAIRS], ["hc", "Màu tóc", HAIR_COLORS], ["top", "Áo", TOPS], ["bot", "Quần & giày", BOTS], ["hat", "Mũ", HATS], ["acc", "Phụ kiện", ACCS]];
let wdTab = "hair", wdItem = null;
function openWardrobe(it) {
  wdItem = it; S.transient.set(it.uid, "mo"); refreshView(it);
  $("#wd-who").textContent = NAMES[S.me]; renderWardrobe(); openSheet("#wardrobe");
}
function renderWardrobe() {
  const tabs = $("#wd-tabs"), chips = $("#wd-chips"); tabs.innerHTML = ""; chips.innerHTML = "";
  for (const [k, label] of WD_TABS) {
    const b = document.createElement("button"); b.textContent = label; b.setAttribute("role", "tab"); b.setAttribute("aria-selected", String(k === wdTab));
    b.addEventListener("click", () => { wdTab = k; renderWardrobe(); }); tabs.appendChild(b);
  }
  const [, , opts] = WD_TABS.find(t => t[0] === wdTab), look = S.looks[S.me];
  for (const [id, v] of Object.entries(opts)) {
    const b = document.createElement("button"); b.setAttribute("aria-pressed", String(look[wdTab] === id));
    if (wdTab === "hc") { const d = document.createElement("span"); d.className = "dot"; d.style.background = hex(v[1]); b.appendChild(d); b.append(v[0]); }
    else b.textContent = v;
    b.addEventListener("click", () => { look[wdTab] = id; store.set(KEY.looks, JSON.stringify(S.looks)); me().build(); renderWardrobe(); });
    chips.appendChild(b);
  }
}
function closeWardrobe() { if (wdItem) { S.transient.delete(wdItem.uid); refreshView(wdItem); wdItem = null; me().emote("wave", 1); } }

// ---------- hũ hẹn hò (gợi ý tại chỗ, chưa nối dữ liệu thật) ----------
const DATES = ["Nấu một món chưa từng nấu, chấm điểm cho nhau", "Đi bộ 20 phút, mỗi người chọn một ngã rẽ", "Xem lại ảnh cũ, kể một chuyện chưa kể",
  "Picnic trong phòng khách, trải thảm ăn vặt", "Vẽ chân dung nhau trong 5 phút", "Cùng làm một ly trà sữa tự chế", "Viết cho nhau một lá thư ba dòng",
  "Chọn ngẫu nhiên một quán chưa đi", "Tắt điện thoại, chơi một ván cờ", "Hát karaoke một bài của người kia chọn", "Trồng chung một chậu cây nhỏ", "Ngắm trời tối, kể ba điều biết ơn"];
let lastDate = -1;
function openDate() {
  let i; do { i = Math.floor(rand() * DATES.length); } while (i === lastDate && DATES.length > 1);
  lastDate = i; $("#date-text").textContent = DATES[i]; openSheet("#date");
}
$("#btn-redraw").addEventListener("click", openDate);

// ---------- bảng nổi chung ----------
function openSheet(sel) { document.querySelectorAll(".sheet:not(.mini)").forEach(s => { s.hidden = true; }); const el = $(sel); el.hidden = false; el.querySelector("button")?.focus({ preventScroll: true }); }
document.querySelectorAll("[data-close]").forEach(b => b.addEventListener("click", () => {
  const s = b.closest(".sheet"); s.hidden = true; if (s.id === "wardrobe") closeWardrobe();
}));
addEventListener("keydown", e => {
  if (e.key !== "Escape") return;
  hideActions(); facesEl.hidden = true;
  document.querySelectorAll(".sheet").forEach(s => { if (!s.hidden) { s.hidden = true; if (s.id === "wardrobe") closeWardrobe(); } });
  if (S.mode === "edit") select(null);
});

// ---------- CHẾ ĐỘ TRANG TRÍ ----------
const tilesG = new THREE.Group(); scene.add(tilesG);
const tileGeo = new THREE.PlaneGeometry(CELL * 0.92, CELL * 0.92); tileGeo.rotateX(-Math.PI / 2);
const tileOk = new THREE.MeshBasicMaterial({ color: C.leaf, transparent: true, opacity: 0.45, depthWrite: false });
const tileBad = new THREE.MeshBasicMaterial({ color: C.pinkD, transparent: true, opacity: 0.55, depthWrite: false });
function showTiles(it, ok) {
  while (tilesG.children.length) tilesG.remove(tilesG.children[0]);
  if (!it) return;
  const m = ok ? tileOk : tileBad, def = CATALOG[it.type];
  if (def.kind === "wall") {
    const g = new THREE.PlaneGeometry(def.w * CELL, 1.4), t = new THREE.Mesh(g, m), p = E.itemPose(it);
    t.position.set(p.x + (it.wall === "L" ? 0.02 : 0), p.y, p.z + (it.wall === "R" ? 0.02 : 0)); t.rotation.y = p.ry; tilesG.add(t); return;
  }
  for (const [i, j] of E.footprint(it)) {
    const c = E.cellCenter(i, j), t = new THREE.Mesh(tileGeo, m); t.position.set(c.x, def.kind === "rug" ? 0.075 : 0.05, c.z); tilesG.add(t);
  }
}
const toolsEl = $("#item-tools");
function select(uid) {
  if (S.selected && S.selected !== uid) { const it = itemByUid(S.selected), v = views.get(S.selected); if (it && v) placeView(v, it); }
  S.selected = uid;
  const it = uid && itemByUid(uid);
  showTiles(it || null, true);
  toolsEl.hidden = !it;
  if (it) { const p = E.itemPose(it), v = views.get(uid); toolsEl._anchor = [p.x, (v?.height || 1) + 0.3, p.z]; positionFloating(toolsEl); $("#btn-rot").focus({ preventScroll: true }); }
}
let drag = null;
function startDrag(uid, cx, cy) {
  const it = itemByUid(uid); if (!it) return;
  const def = CATALOG[it.type];
  const p = E.itemPose(it), fp = def.kind === "wall" ? null : floorPoint(cx, cy);
  drag = { uid, orig: E.clone(it), cand: E.clone(it), ok: true, before: E.clone(S.layout), grab: fp ? { x: fp.x - p.x, z: fp.z - p.z } : { x: 0, z: 0 } };
}
function dragTo(cx, cy) {
  if (!drag) return;
  if (S.selected !== drag.uid) select(drag.uid);
  const it = itemByUid(drag.uid), def = CATALOG[it.type];
  let cand;
  if (def.kind === "wall") {
    const wp = wallPoint(cx, cy); if (!wp) return;
    const len = wp.wall === "L" ? ROOM.d : ROOM.w;
    cand = { ...it, wall: wp.wall, at: THREE.MathUtils.clamp(Math.round(wp.along / CELL - def.w / 2), 0, len - def.w) };
  } else {
    const fp = floorPoint(cx, cy); if (!fp) return;
    const { w, d } = E.dims(def, it.r);
    cand = { ...it, gx: THREE.MathUtils.clamp(Math.round((fp.x - drag.grab.x + W / 2) / CELL - w / 2), 0, ROOM.w - w), gz: THREE.MathUtils.clamp(Math.round((fp.z - drag.grab.z + D / 2) / CELL - d / 2), 0, ROOM.d - d) };
  }
  drag.cand = cand; drag.ok = E.validatePlacement(S.layout, cand).ok;
  placeView(views.get(it.uid), cand, 0.08); showTiles(cand, drag.ok);
  toolsEl._anchor = null; toolsEl.hidden = true;
}
function endDrag() {
  if (!drag) return;
  const it = itemByUid(drag.uid), res = E.validatePlacement(S.layout, drag.cand);
  if (res.ok && JSON.stringify(drag.cand) !== JSON.stringify(drag.orig)) {
    S.history.push(drag.before); Object.assign(it, drag.cand); commit();
  } else if (!res.ok) toast(res.reason + " — để lại chỗ cũ");
  drag = null; select(it.uid); placeView(views.get(it.uid), it);
}
function cancelDrag() { drag = null; }
function commit() { S.G = E.blockGrid(S.layout); saveLayout(); $("#btn-undo").disabled = !S.history.canUndo(); }

$("#btn-rot").addEventListener("click", () => {
  const it = itemByUid(S.selected); if (!it) return;
  const def = CATALOG[it.type];
  let cand;
  if (def.kind === "wall") {
    const other = it.wall === "L" ? "R" : "L", len = other === "L" ? ROOM.d : ROOM.w;
    cand = { ...it, wall: other, at: Math.min(it.at, len - def.w) };
    if (!E.validatePlacement(S.layout, cand).ok) { const s = E.findSpot({ items: S.layout.items.filter(i => i.uid !== it.uid) }, it.type); if (s && s.wall === other) cand = { ...it, wall: other, at: s.at }; }
  } else {
    const a = E.dims(def, it.r), r = (it.r + 1) & 3, b = E.dims(def, r);
    cand = { ...it, r, gx: Math.round(it.gx + a.w / 2 - b.w / 2), gz: Math.round(it.gz + a.d / 2 - b.d / 2) };
    cand.gx = THREE.MathUtils.clamp(cand.gx, 0, ROOM.w - b.w); cand.gz = THREE.MathUtils.clamp(cand.gz, 0, ROOM.d - b.d);
  }
  const res = E.validatePlacement(S.layout, cand);
  if (!res.ok) { toast("Không đủ chỗ để xoay: " + res.reason.toLowerCase()); return; }
  S.history.push(S.layout); Object.assign(it, cand); placeView(views.get(it.uid), it); commit(); select(it.uid);
});
$("#btn-store").addEventListener("click", () => {
  const it = itemByUid(S.selected); if (!it) return;
  S.history.push(S.layout);
  S.layout.items = S.layout.items.filter(i => i.uid !== it.uid);
  itemsG.remove(views.get(it.uid).root); views.delete(it.uid);
  for (const [k, a] of S.seats) if (k.startsWith(it.uid + ":")) { a.standUp(); }
  select(null); commit(); toast("Đã cất " + CATALOG[it.type].name + " vào kho");
});
$("#btn-ok").addEventListener("click", () => select(null));
$("#btn-undo").addEventListener("click", () => {
  const prev = S.history.undo(); if (!prev) return;
  S.layout = E.sanitizeLayout(prev).layout; select(null); buildShell(); rebuildAll(); commit(); paintSwatches();
});

// kho đồ
let trayCat = CATEGORIES[0].id;
function renderTray() {
  const tabs = $("#tabs"), cards = $("#cards"); tabs.innerHTML = ""; cards.innerHTML = "";
  for (const c of CATEGORIES) {
    const b = document.createElement("button"); b.textContent = c.name; b.setAttribute("role", "tab"); b.setAttribute("aria-selected", String(c.id === trayCat));
    b.addEventListener("click", () => { trayCat = c.id; renderTray(); }); tabs.appendChild(b);
  }
  for (const [id, def] of Object.entries(CATALOG)) {
    if (def.cat !== trayCat) continue;
    const b = document.createElement("button"); b.className = "card"; b.dataset.type = id; b.setAttribute("aria-label", "Thêm " + def.name);
    const img = document.createElement("img"); img.alt = ""; img.src = thumb(id); b.appendChild(img);
    const s = document.createElement("span"); s.textContent = def.name; b.appendChild(s);
    b.addEventListener("click", () => addItem(id)); cards.appendChild(b);
  }
}
function addItem(type) {
  const c = E.worldToCell(cam.target.x, cam.target.z);
  const spot = E.findSpot(S.layout, type, { gx: c.i - 1, gz: c.j - 1 });
  if (!spot) { toast("Phòng hết chỗ cho " + CATALOG[type].name); return; }
  S.history.push(S.layout);
  const it = { ...spot, uid: E.newUid() };
  S.layout.items.push(it); refreshView(it); commit(); select(it.uid);
  toast("Kéo " + CATALOG[type].name + " tới chỗ muốn đặt");
}

// ảnh nhỏ cho kho đồ (dựng một lần, cùng phong cách)
let thumbR = null; const thumbs = {};
function thumb(type) {
  if (thumbs[type]) return thumbs[type];
  const w = 148, h = 132;
  if (!thumbR) { thumbR = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true }); thumbR.outputColorSpace = THREE.SRGBColorSpace; thumbR.setSize(w, h, false); }
  const sc = new THREE.Scene(); sc.add(new THREE.AmbientLight(0xffffff, 1.75));
  const k = new THREE.DirectionalLight(0xFFF4E6, 0.9); k.position.set(-5, 12, 1.2); sc.add(k);
  const f = new THREE.DirectionalLight(0xD8EEFF, 0.36); f.position.set(8, 5, -6); sc.add(f);
  const m = makeModel(type); sc.add(m); m.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(m), ctr = box.getCenter(new THREE.Vector3()), sz = box.getSize(new THREE.Vector3());
  const r = Math.max(sz.x, sz.y, sz.z) * 0.62 + 0.1, c = new THREE.OrthographicCamera(-r * w / h, r * w / h, r, -r, -50, 50);
  c.position.copy(ctr).addScaledVector(CAMDIR, 20); c.lookAt(ctr); c.updateProjectionMatrix();
  setOutline(2, w, h); thumbR.render(sc, c); setOutline(2.2 * DPR, innerWidth * DPR, innerHeight * DPR);
  return (thumbs[type] = thumbR.domElement.toDataURL("image/png"));
}

// màu phòng
function paintSwatches() {
  const sw = $("#sw-wall"), sf = $("#sw-floor"); sw.innerHTML = ""; sf.innerHTML = "";
  for (const c of WALL_COLORS) {
    const b = document.createElement("button"); b.style.background = hex(c.wall); b.textContent = c.name; b.setAttribute("aria-pressed", String(S.layout.wall === c.id));
    b.addEventListener("click", () => { S.history.push(S.layout); S.layout.wall = c.id; buildShell(); commit(); paintSwatches(); }); sw.appendChild(b);
  }
  for (const c of FLOOR_COLORS) {
    const b = document.createElement("button"); b.style.background = hex(c.floor); b.textContent = c.name; b.setAttribute("aria-pressed", String(S.layout.floor === c.id));
    b.addEventListener("click", () => { S.history.push(S.layout); S.layout.floor = c.id; buildShell(); commit(); paintSwatches(); }); sf.appendChild(b);
  }
}
$("#btn-paint").addEventListener("click", () => { paintSwatches(); openSheet("#paint"); });
$("#btn-reset").addEventListener("click", () => {
  S.history.push(S.layout); S.layout = E.clone(DEFAULT_LAYOUT); select(null); buildShell(); rebuildAll(); commit(); paintSwatches(); toast("Đã bày lại như mới · bấm ↶ để quay lại");
});

function setMode(mode) {
  S.mode = mode; document.body.dataset.mode = mode; hideActions(); facesEl.hidden = true;
  document.querySelectorAll(".sheet").forEach(s => { s.hidden = true; });
  grid.visible = mode === "edit";
  if (mode === "edit") {
    for (const a of Object.values(actors)) { a.standUp(); a.stop(); }
    renderTray(); requestAnimationFrame(editFit);
  } else {
    select(null); cam.shift = 0; cam.goalPpm = Math.max(58, Math.min(80, innerWidth / 6));
    // ai đứng trong đồ vừa đặt thì bước ra ô trống gần nhất
    for (const a of Object.values(actors)) if (E.circleBlocked(S.G, a.x, a.z, E.AVATAR_R * 0.7)) { const c = E.worldToCell(a.x, a.z), n = E.nearestFreeCell(S.G, c.i, c.j, 16); if (n) { const p = E.cellCenter(n.i, n.j); a.place(p.x, p.z); } }
    if (E.circleBlocked(S.G, cat.x, cat.z, 0.1)) { const c = E.worldToCell(cat.x, cat.z), n = E.nearestFreeCell(S.G, c.i, c.j, 16); if (n) { const p = E.cellCenter(n.i, n.j); cat.x = p.x; cat.z = p.z; } cat.path = []; }
    S.history = new E.History(40); $("#btn-undo").disabled = true;
  }
}
$("#btn-edit").addEventListener("click", () => setMode("edit"));
$("#btn-done").addEventListener("click", () => setMode("play"));

// ---------- vòng lặp ----------
let last = performance.now();
cam.goalPpm = cam.ppm = Math.max(58, Math.min(80, innerWidth / 6));
let simClock = 0;
function step(dt) {
  simClock += dt;
  if (S.mode === "play") { joyStep(dt); partnerThink(dt); }
  catThink(dt);
  for (const a of Object.values(actors)) a.update(dt);
  cat.root.position.set(cat.x, cat.path.length && !reduced() ? Math.abs(Math.sin(simClock * 11)) * 0.05 : 0, cat.z); cat.root.rotation.y = cat.face;
}
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  step(dt);
  // camera
  if (S.mode === "play" && !(cam.panned && now - cam.panned < 1500)) { const m = me(); cam.goal.set(m.x, 0.55, m.z); }
  const k = reduced() ? 1 : Math.min(1, dt * 5);
  cam.target.lerp(cam.goal, k); cam.ppm += (cam.goalPpm - cam.ppm) * k;
  updateCamera();
  // lift món đang chọn
  if (S.mode === "edit" && S.selected && !drag) { const it = itemByUid(S.selected), v = views.get(S.selected); if (it && v) placeView(v, it, 0.04 + (reduced() ? 0 : Math.sin(now / 160) * 0.025)); }
  renderer.render(scene, camera);
  // nhãn
  for (const a of Object.values(actors)) {
    const el = tags[a.who]; el.hidden = !a.root.visible;
    const [sx, sy] = toScreen(a.x, a.mode === "sit" ? a.seatH + 1.0 : 1.32, a.z); el.style.left = sx + "px"; el.style.top = sy + "px";
  }
  for (let i = bubbles.length - 1; i >= 0; i--) {
    const b = bubbles[i]; if (now > b.until) { b.el.remove(); bubbles.splice(i, 1); continue; }
    const [sx, sy] = toScreen(b.x, b.y, b.z); b.el.style.left = sx + "px"; b.el.style.top = sy + "px";
  }
  positionFloating(actionsEl); positionFloating(toolsEl);
  requestAnimationFrame(frame);
}
addEventListener("resize", resize);
requestAnimationFrame(t => { last = t; frame(t); $("#loading").classList.add("gone"); setTimeout(() => toast("Bản thử: nhà chỉ lưu trên máy này, chưa đồng bộ với người kia"), 600); });

// Móc cho test tự động (chỉ đọc + vài thao tác như người dùng); không chứa dữ liệu thật.
window.__NHA3D__ = {
  ready: true,
  layout: () => E.clone(S.layout),
  mode: () => S.mode,
  me: () => ({ who: S.me, x: me().x, z: me().z, mode: me().mode }),
  partner: () => ({ x: partner().x, z: partner().z, mode: partner().mode }),
  screenOfItem(uid, yFrac = 0.6) { const it = itemByUid(uid), p = E.itemPose(it), v = views.get(uid); return toScreen(p.x, (v.height || 1) * yFrac, p.z); },
  screenOfWorld: (x, y, z) => toScreen(x, y, z),
  pickAt: (x, y) => { const h = pickAt(x, y); return h && (h.uid || (h.actor && h.actor.who) || (h.cat && "cat")); },
  info: () => ({ calls: renderer.info.render.calls, triangles: renderer.info.render.triangles, ppm: cam.ppm }),
  pauseAI(on) { AI.timer = on ? 1e9 : 1; cat.wait = on ? 1e9 : 1; },
  // Tua nhanh logic (không vẽ) để test không phụ thuộc tốc độ GPU của máy chạy CI.
  tick(sec) { for (let t = 0; t < sec; t += 1 / 30) step(1 / 30); }
};
