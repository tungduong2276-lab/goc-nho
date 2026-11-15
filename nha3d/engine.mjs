// Lõi logic của bản thử nhà 3D: lưới, dấu chân đồ, kiểm tra đặt hợp lệ, ô đi được, tìm đường,
// điểm ngồi/điểm tiếp cận, lưu/nạp bố cục, hoàn tác. Không phụ thuộc three.js, không ghi Firebase.
import { CELL, ROOM, CATALOG, WALL_COLORS, FLOOR_COLORS, DEFAULT_LAYOUT } from "./catalog.mjs";

export const LAYOUT_VERSION = 1;
export const AVATAR_R = 0.2;

// ---------- toạ độ ----------
export const roomSize = (room = ROOM) => ({ W: room.w * CELL, D: room.d * CELL });
export function cellCenter(i, j, room = ROOM) {
  const { W, D } = roomSize(room);
  return { x: -W / 2 + (i + 0.5) * CELL, z: -D / 2 + (j + 0.5) * CELL };
}
export function worldToCell(x, z, room = ROOM) {
  const { W, D } = roomSize(room);
  return { i: Math.floor((x + W / 2) / CELL), j: Math.floor((z + D / 2) / CELL) };
}
// Xoay một vector cục bộ theo r lần 90° (khớp với three.js rotation.y = r·π/2).
export function rotLocal(x, z, r) {
  const t = (r & 3) * Math.PI / 2, c = Math.round(Math.cos(t)), s = Math.round(Math.sin(t));
  return { x: x * c + z * s, z: -x * s + z * c };
}
export function dims(def, r) { return (r & 1) ? { w: def.d, d: def.w } : { w: def.w, d: def.d }; }

// Tâm và vị trí thế giới của một món đồ (m).
export function itemPose(item, room = ROOM) {
  const def = CATALOG[item.type];
  const { W, D } = roomSize(room);
  if (def.kind === "wall") {
    const half = def.w * CELL / 2, along = item.at * CELL + half;
    if (item.wall === "L") return { x: -W / 2, y: def.y, z: -D / 2 + along, ry: Math.PI / 2 };
    return { x: -W / 2 + along, y: def.y, z: -D / 2, ry: 0 };
  }
  const { w, d } = dims(def, item.r);
  return { x: -W / 2 + (item.gx + w / 2) * CELL, y: 0, z: -D / 2 + (item.gz + d / 2) * CELL, ry: (item.r & 3) * Math.PI / 2 };
}

export function footprint(item) {
  const def = CATALOG[item.type];
  if (def.kind === "wall") return [];
  const { w, d } = dims(def, item.r), out = [];
  for (let i = 0; i < w; i++) for (let j = 0; j < d; j++) out.push([item.gx + i, item.gz + j]);
  return out;
}

// ---------- kiểm tra đặt ----------
export function validatePlacement(layout, item, room = ROOM) {
  const def = CATALOG[item.type];
  if (!def) return { ok: false, reason: "Món đồ không có trong danh mục" };
  if (def.kind === "wall") {
    if (item.wall !== "L" && item.wall !== "R") return { ok: false, reason: "Chỉ treo được lên tường" };
    const len = item.wall === "L" ? room.d : room.w;
    if (!Number.isInteger(item.at) || item.at < 0 || item.at + def.w > len) return { ok: false, reason: "Ra ngoài tường" };
    for (const o of layout.items) {
      if (o.uid === item.uid) continue;
      const od = CATALOG[o.type];
      if (!od || od.kind !== "wall" || o.wall !== item.wall) continue;
      if (item.at < o.at + od.w && o.at < item.at + def.w) return { ok: false, reason: "Chồng lên " + od.name, with: o.uid };
    }
    return { ok: true };
  }
  if (![0, 1, 2, 3].includes(item.r)) return { ok: false, reason: "Góc xoay không hợp lệ" };
  const { w, d } = dims(def, item.r);
  if (!Number.isInteger(item.gx) || !Number.isInteger(item.gz) || item.gx < 0 || item.gz < 0 || item.gx + w > room.w || item.gz + d > room.d)
    return { ok: false, reason: "Ra ngoài phòng" };
  for (const o of layout.items) {
    if (o.uid === item.uid) continue;
    const od = CATALOG[o.type];
    if (!od || od.kind === "wall") continue;
    // Thảm chỉ đụng thảm; đồ đặc chỉ đụng đồ đặc.
    if ((od.kind === "rug") !== (def.kind === "rug")) continue;
    const o2 = dims(od, o.r);
    if (item.gx < o.gx + o2.w && o.gx < item.gx + w && item.gz < o.gz + o2.d && o.gz < item.gz + d)
      return { ok: false, reason: "Chồng lên " + od.name, with: o.uid };
  }
  return { ok: true };
}

// ---------- ô đi được ----------
export function blockGrid(layout, room = ROOM) {
  const g = new Uint8Array(room.w * room.d);
  for (const it of layout.items) {
    const def = CATALOG[it.type];
    if (!def || def.kind !== "floor") continue;
    for (const [i, j] of footprint(it)) if (i >= 0 && j >= 0 && i < room.w && j < room.d) g[j * room.w + i] = 1;
  }
  return { g, w: room.w, d: room.d };
}
export const cellFree = (G, i, j) => i >= 0 && j >= 0 && i < G.w && j < G.d && !G.g[j * G.w + i];

// Hình tròn bán kính r tại (x, z) có chạm ô bị chặn hoặc tường không?
export function circleBlocked(G, x, z, r = AVATAR_R, room = ROOM) {
  const { W, D } = roomSize(room);
  if (x - r < -W / 2 || x + r > W / 2 || z - r < -D / 2 || z + r > D / 2) return true;
  const a = worldToCell(x - r, z - r, room), b = worldToCell(x + r, z + r, room);
  for (let i = a.i; i <= b.i; i++) for (let j = a.j; j <= b.j; j++) {
    if (cellFree(G, i, j)) continue;
    const c = cellCenter(i, j, room), h = CELL / 2;
    const dx = Math.max(Math.abs(x - c.x) - h, 0), dz = Math.max(Math.abs(z - c.z) - h, 0);
    if (dx * dx + dz * dz < r * r) return true;
  }
  return false;
}

// Bước đi liên tục có trượt dọc vật cản (cho cần điều khiển).
export function slideMove(G, x, z, dx, dz, r = AVATAR_R, room = ROOM) {
  if (!circleBlocked(G, x + dx, z + dz, r, room)) return { x: x + dx, z: z + dz };
  if (!circleBlocked(G, x + dx, z, r, room)) return { x: x + dx, z };
  if (!circleBlocked(G, x, z + dz, r, room)) return { x, z: z + dz };
  return { x, z };
}

export function nearestFreeCell(G, i, j, maxR = 6) {
  if (cellFree(G, i, j)) return { i, j };
  let best = null, bd = Infinity;
  for (let r = 1; r <= maxR; r++) {
    for (let a = -r; a <= r; a++) for (let b = -r; b <= r; b++) {
      if (Math.max(Math.abs(a), Math.abs(b)) !== r || !cellFree(G, i + a, j + b)) continue;
      const dd = a * a + b * b;
      if (dd < bd) { bd = dd; best = { i: i + a, j: j + b }; }
    }
    if (best) return best;
  }
  return null;
}

// A* 8 hướng, không cắt góc vật cản; trả về danh sách ô (gồm ô đầu và ô cuối) hoặc null.
export function findPath(G, from, to) {
  if (!cellFree(G, from.i, from.j) || !cellFree(G, to.i, to.j)) return null;
  const W = G.w, N = W * G.d, idx = (i, j) => j * W + i;
  const gS = new Float64Array(N).fill(Infinity), came = new Int32Array(N).fill(-1), closed = new Uint8Array(N);
  const h = (i, j) => { const dx = Math.abs(i - to.i), dz = Math.abs(j - to.j); return Math.max(dx, dz) + (Math.SQRT2 - 1) * Math.min(dx, dz); };
  const open = [[h(from.i, from.j), idx(from.i, from.j)]];
  gS[idx(from.i, from.j)] = 0;
  const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
  while (open.length) {
    let bi = 0; for (let k = 1; k < open.length; k++) if (open[k][0] < open[bi][0]) bi = k;
    const [, cur] = open.splice(bi, 1)[0];
    if (closed[cur]) continue; closed[cur] = 1;
    const ci = cur % W, cj = (cur - ci) / W;
    if (ci === to.i && cj === to.j) {
      const out = []; let c = cur;
      while (c !== -1) { out.push({ i: c % W, j: Math.floor(c / W) }); c = came[c]; }
      return out.reverse();
    }
    for (const [a, b] of DIRS) {
      const ni = ci + a, nj = cj + b;
      if (!cellFree(G, ni, nj)) continue;
      if (a && b && (!cellFree(G, ci + a, cj) || !cellFree(G, ci, cj + b))) continue;
      const n = idx(ni, nj), ng = gS[cur] + (a && b ? Math.SQRT2 : 1);
      if (ng < gS[n]) { gS[n] = ng; came[n] = cur; open.push([ng + h(ni, nj), n]); }
    }
  }
  return null;
}

// Đường đi trong thế giới từ (x,z) tới (tx,tz): A* trên ô rồi rút gọn bằng đường thẳng không vướng.
export function worldPath(G, x, z, tx, tz, room = ROOM) {
  const s = worldToCell(x, z, room), t0 = worldToCell(tx, tz, room);
  const s2 = nearestFreeCell(G, s.i, s.j), t = nearestFreeCell(G, t0.i, t0.j);
  if (!s2 || !t) return null;
  const cells = findPath(G, s2, t);
  if (!cells) return null;
  const pts = cells.map(c => cellCenter(c.i, c.j, room));
  const targetFree = cellFree(G, t0.i, t0.j) && !circleBlocked(G, tx, tz, AVATAR_R * 0.6, room);
  pts[pts.length - 1] = targetFree ? { x: tx, z: tz } : pts[pts.length - 1];
  // rút gọn
  const out = [{ x, z }];
  let k = 0;
  while (k < pts.length - 1) {
    let far = k + 1;
    for (let m = pts.length - 1; m > k + 1; m--) if (clearLine(G, out[out.length - 1], pts[m], room)) { far = m; break; }
    out.push(pts[far]); k = far;
  }
  if (out.length === 1) out.push(pts[pts.length - 1]);
  return out;
}
export function clearLine(G, a, b, room = ROOM) {
  const n = Math.ceil(Math.hypot(b.x - a.x, b.z - a.z) / (CELL / 4));
  for (let s = 1; s <= n; s++) {
    const t = s / n;
    if (circleBlocked(G, a.x + (b.x - a.x) * t, a.z + (b.z - a.z) * t, AVATAR_R * 0.9, room)) return false;
  }
  return true;
}

// ---------- tương tác ----------
// Ghế ngồi (toạ độ thế giới) của một món đồ.
export function seatsOf(item, room = ROOM) {
  const def = CATALOG[item.type];
  if (!def.use || def.use.type !== "sit") return [];
  const p = itemPose(item, room), sc = def.scale ?? 1;
  return def.use.seats.map((s, k) => {
    const v = rotLocal(s.x * sc, s.z * sc, item.r);
    return { k, x: p.x + v.x, z: p.z + v.z, a: s.a + (item.r & 3) * Math.PI / 2, h: s.h * sc };
  });
}
// Điểm đứng để dùng một món: trước ghế (theo hướng mặt) hoặc trước mặt món đồ; luôn là ô đi được gần nhất.
export function approachPoint(G, item, seat = null, room = ROOM) {
  const def = CATALOG[item.type], p = itemPose(item, room);
  let ax, az;
  if (seat) { ax = seat.x + Math.sin(seat.a) * 0.45; az = seat.z + Math.cos(seat.a) * 0.45; }
  else if (def.kind === "wall") {
    const n = item.wall === "L" ? { x: 1, z: 0 } : { x: 0, z: 1 };
    ax = p.x + n.x * 0.7; az = p.z + n.z * 0.7;
  } else {
    const f = rotLocal(0, def.d * CELL / 2 + 0.35, item.r);
    ax = p.x + f.x; az = p.z + f.z;
  }
  const c = worldToCell(ax, az, room), n = nearestFreeCell(G, c.i, c.j);
  if (!n) return null;
  const free = cellFree(G, c.i, c.j) && !circleBlocked(G, ax, az, AVATAR_R, room);
  const pt = free ? { x: ax, z: az } : cellCenter(n.i, n.j, room);
  const tx = seat ? seat.x : p.x, tz = seat ? seat.z : p.z;
  return { x: pt.x, z: pt.z, face: Math.atan2(tx - pt.x, tz - pt.z) };
}

// ---------- bố cục: lưu / nạp / làm sạch ----------
let uidN = 0;
export const newUid = () => "u" + Date.now().toString(36) + (uidN++).toString(36);

export function sanitizeLayout(raw, room = ROOM) {
  const dropped = [];
  const base = { v: LAYOUT_VERSION, wall: DEFAULT_LAYOUT.wall, floor: DEFAULT_LAYOUT.floor, items: [] };
  if (!raw || typeof raw !== "object" || raw.v !== LAYOUT_VERSION || !Array.isArray(raw.items)) return { layout: clone(DEFAULT_LAYOUT), dropped: ["(bố cục hỏng — dùng mặc định)"] };
  if (WALL_COLORS.some(c => c.id === raw.wall)) base.wall = raw.wall;
  if (FLOOR_COLORS.some(c => c.id === raw.floor)) base.floor = raw.floor;
  const seen = new Set();
  for (const it of raw.items.slice(0, 200)) {
    if (!it || typeof it !== "object" || typeof it.uid !== "string" || seen.has(it.uid) || !CATALOG[it.type]) { dropped.push(it && it.type); continue; }
    const def = CATALOG[it.type];
    const clean = def.kind === "wall"
      ? { uid: it.uid, type: it.type, wall: it.wall, at: it.at, r: 0 }
      : { uid: it.uid, type: it.type, gx: it.gx, gz: it.gz, r: it.r };
    if (it.state !== undefined && def.states && def.states.includes(it.state)) clean.state = it.state;
    if (!validatePlacement(base, clean, room).ok) { dropped.push(it.type); continue; }
    seen.add(it.uid); base.items.push(clean);
  }
  return { layout: base, dropped };
}
export const clone = o => JSON.parse(JSON.stringify(o));
export const serialize = layout => JSON.stringify(layout);
export function deserialize(text, room = ROOM) {
  try { return sanitizeLayout(JSON.parse(text), room); } catch { return sanitizeLayout(null, room); }
}

// Tìm chỗ trống gần (gx,gz) cho món mới (xoay r); trả về item hoặc null.
export function findSpot(layout, type, prefer = { gx: 6, gz: 6 }, room = ROOM) {
  const def = CATALOG[type];
  if (def.kind === "wall") {
    for (const wall of ["R", "L"]) {
      const len = wall === "L" ? room.d : room.w;
      for (let at = 0; at + def.w <= len; at++) {
        const it = { uid: "probe", type, wall, at, r: 0 };
        if (validatePlacement(layout, it, room).ok) return it;
      }
    }
    return null;
  }
  let best = null, bd = Infinity;
  for (const r of [0, 1]) for (let gx = 0; gx < room.w; gx++) for (let gz = 0; gz < room.d; gz++) {
    const it = { uid: "probe", type, gx, gz, r };
    if (!validatePlacement(layout, it, room).ok) continue;
    const dd = (gx - prefer.gx) ** 2 + (gz - prefer.gz) ** 2 + r * 0.5;
    if (dd < bd) { bd = dd; best = it; }
  }
  return best;
}

export class History {
  constructor(max = 30) { this.max = max; this.stack = []; }
  push(layout) { this.stack.push(serialize(layout)); if (this.stack.length > this.max) this.stack.shift(); }
  canUndo() { return this.stack.length > 0; }
  undo() { return this.stack.length ? JSON.parse(this.stack.pop()) : null; }
}

// Nhịp ngẫu nhiên có hạt giống (cho Em và mèo đi dạo, test lặp lại được).
export function rng(seed = 1) {
  let s = seed >>> 0 || 1;
  return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
}
