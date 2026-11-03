// Bản đồ ngôi nhà — mục 6 của brief. Nhà búp bê 2 tầng cắt mái trên đảo đất nổi giữa biển.
// Khung dọc 1170 × 2532. Vùng chạm mỗi khu được xuất ra meta để app dùng.
import { THREE, C, piece, rbox, sphere, capsule, rcyl, lathe, torus, tube, leafGeo, makeScene, isoCamera, shoot, shadowCatcher, toPx, mat } from './lib.js';
import * as F from './furn.js';
import { buildChar } from './chars.js';
import { buildCat } from './pet.js';

export const MAP = { w: 1170, h: 2532, ppm: 57, target: [0.2, 1.2, 0.6], shift: [0, -40] };
const FH = 3.2;           // chiều cao tầng
const HZ0 = -5.7, HZ1 = -2.5; // nhà nằm z ∈ [HZ0, HZ1]
const ROOMS = {
  sangtao: { x0: -6, x1: -3, y: 0, wall: 0xFFF3C9, floor: C.wood, name: 'Góc sáng tạo', go: 'truyen' },
  khach:   { x0: -3, x1: 0.6, y: 0, wall: C.white, floor: C.wood, name: 'Phòng khách', go: 'phong-khach' },
  bep:     { x0: 0.6, x1: 3.6, y: 0, wall: 0xE4F3FF, floor: 0xF4F7FB, tiles: true, name: 'Bếp', go: 'tu-lanh' },
  anh:     { x0: -6, x1: -1.2, y: FH, wall: C.sky2, floor: 0xD8EEFF, name: 'Phòng Anh', go: 'phong-anh' },
  em:      { x0: -1.2, x1: 3.6, y: FH, wall: C.petal, floor: C.wood, name: 'Phòng Em', go: 'phong-em' },
  gac:     { x0: -4.6, x1: 0.8, y: FH * 2, wall: 0xF3DDBF, floor: C.woodD, name: 'Gác kỷ niệm', go: 'tu-dien' }
};

function G() { return new THREE.Group(); }
const at = (o, x, y, z, ry = 0) => { o.position.set(x, y, z); o.rotation.y = ry; return o; };

// ---------- đồ nhỏ dùng trên bản đồ ----------
function bed(col, voan) {
  const g = G();
  piece(rbox(1.0, 0.32, 1.7, 0.08), C.wood, { pos: [0, 0.2, 0], parent: g });
  piece(rbox(0.94, 0.16, 1.6, 0.07), C.white, { pos: [0, 0.42, 0], parent: g });
  piece(rbox(0.96, 0.12, 1.0, 0.06), col, { pos: [0, 0.5, 0.3], parent: g });
  piece(rbox(0.5, 0.12, 0.3, 0.06), C.white, { pos: [0, 0.55, -0.55], parent: g });
  piece(rbox(1.0, 0.7, 0.12, 0.05), C.wood, { pos: [0, 0.5, -0.86], parent: g });
  if (voan) { piece(lathe([[0, 1.5], [0.12, 1.45], [0.5, 0.6], [0.52, 0.4], [0.5, 0.38], [0.11, 1.42], [0, 1.47]].reverse()), C.white, { opacity: 0.55, pos: [0, 0.1, -0.5], parent: g, cast: false }); }
  return g;
}
function desk(laptop) {
  const g = G();
  piece(rbox(1.2, 0.08, 0.6, 0.03), C.white, { pos: [0, 0.72, 0], parent: g });
  for (const s of [-1, 1]) piece(rbox(0.06, 0.7, 0.55, 0.02), C.white, { pos: [s * 0.55, 0.36, 0], parent: g });
  if (laptop) { piece(rbox(0.42, 0.03, 0.3, 0.01), C.stoneD, { pos: [0, 0.78, 0.05], parent: g }); piece(rbox(0.42, 0.28, 0.03, 0.01), C.navy, { pos: [0, 0.92, -0.1], rot: [-0.25, 0, 0], parent: g }); }
  piece(rcyl(0.18, 0.18, 0.08, 0.03, 16), col2(), { pos: [0.1, 0.46, 0.55], parent: g });
  return g;
}
const col2 = () => C.sky;
function wardrobe(col) { const g = G(); piece(rbox(1.0, 1.7, 0.55, 0.06), col, { pos: [0, 0.85, 0], parent: g }); piece(rbox(0.02, 1.5, 0.02, 0.01), C.navy, { noOutline: true, pos: [0, 0.9, 0.285], parent: g }); for (const s of [-1, 1]) piece(sphere(0.035, 8, 6), C.butter, { pos: [s * 0.08, 0.95, 0.29], parent: g }); return g; }
function fridge() { const g = G(); piece(rbox(0.8, 1.75, 0.7, 0.12), C.white, { pos: [0, 0.875, 0], parent: g }); piece(rbox(0.04, 0.4, 0.04, 0.02), C.stoneD, { pos: [0.3, 1.2, 0.36], parent: g }); [[-0.15, 1.3, C.butter], [0.05, 1.05, C.petal], [-0.1, 0.75, C.sky2]].forEach(([x, y, c]) => piece(rbox(0.22, 0.2, 0.01, 0.005, 1), c, { pos: [x, y, 0.36], rot: [0, 0, x * 0.8], parent: g })); return g; }
function counter(len = 1.6) { const g = G(); piece(rbox(len, 0.85, 0.65, 0.05), C.wood, { pos: [0, 0.425, 0], parent: g }); piece(rbox(len + 0.04, 0.07, 0.69, 0.02), C.white, { pos: [0, 0.88, 0], parent: g }); piece(rcyl(0.18, 0.15, 0.22, 0.04, 16), C.pink, { pos: [-len / 4, 1.02, 0], parent: g }); piece(rcyl(0.12, 0.12, 0.03, 0.01, 12), C.navy, { pos: [len / 4, 0.93, 0], parent: g }); return g; }
function table2() { const g = G(); piece(rcyl(0.45, 0.45, 0.07, 0.03, 24), C.white, { pos: [0, 0.72, 0], parent: g }); piece(rcyl(0.06, 0.06, 0.7, 0.02, 10), C.woodD, { pos: [0, 0.36, 0], parent: g }); for (const s of [-1, 1]) piece(rbox(0.38, 0.45, 0.38, 0.08), C.pink, { pos: [s * 0.7, 0.23, 0], parent: g }); return g; }
function easel() { const g = G(); for (const s of [-1, 1]) piece(rbox(0.05, 1.5, 0.05, 0.02), C.woodD, { pos: [s * 0.3, 0.75, 0], rot: [0, 0, s * 0.12], parent: g }); piece(rbox(0.8, 0.6, 0.04, 0.02), C.white, { pos: [0, 1.05, 0.05], parent: g }); piece(sphere(0.12, 10, 8).scale(1.3, 1, 0.2), C.pink, { noOutline: true, pos: [-0.1, 1.08, 0.08], parent: g }); piece(sphere(0.1, 10, 8).scale(1.2, 1, 0.2), C.leaf, { noOutline: true, pos: [0.15, 0.98, 0.08], parent: g }); return g; }
function typewriterDesk() { const g = desk(false); piece(rbox(0.45, 0.16, 0.32, 0.05), C.sky, { pos: [0, 0.84, 0], parent: g }); piece(rbox(0.36, 0.26, 0.02, 0.005), C.white, { pos: [0, 1.0, -0.08], rot: [-0.3, 0, 0], parent: g }); return g; }
function chest(open) { const g = G(); piece(rbox(0.8, 0.45, 0.5, 0.06), C.woodD, { pos: [0, 0.23, 0], parent: g }); piece(rbox(0.82, 0.18, 0.52, 0.08), C.wood, { pos: [0, 0.52, open ? -0.2 : 0], rot: [open ? -1.1 : 0, 0, 0], parent: g }); piece(rbox(0.1, 0.12, 0.04, 0.02), C.butter, { pos: [0, 0.42, 0.26], parent: g }); return g; }
function vitrine() { const g = G(); piece(rbox(1.1, 1.5, 0.45, 0.05), C.white, { pos: [0, 0.75, 0], parent: g }); for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) piece(rbox(0.28, 0.32, 0.02, 0.01), 0xCFE8FA, { noOutline: true, opacity: 0.8, pos: [-0.33 + j * 0.33, 0.3 + i * 0.45, 0.23], parent: g }); return g; }
function armchair() { const g = G(); piece(rbox(0.8, 0.4, 0.75, 0.15), C.pinkL, { pos: [0, 0.3, 0], parent: g }); piece(rbox(0.8, 0.6, 0.22, 0.12), C.pinkL, { pos: [0, 0.6, -0.28], parent: g }); return g; }
function lampPost(on) { const g = G(); piece(rcyl(0.05, 0.07, 1.6, 0.02, 10), C.white, { pos: [0, 0.8, 0], parent: g }); piece(sphere(0.16, 14, 10), on ? C.butter : C.white, { pos: [0, 1.72, 0], parent: g, emissive: on ? C.butter : 0, ei: on ? 1 : 0 }); piece(rcyl(0.12, 0.18, 0.08, 0.03, 12), C.sky, { pos: [0, 1.88, 0], parent: g }); return g; }
function fence(len, axis = 'x') { const g = G(); const n = Math.round(len / 0.45); for (let i = 0; i <= n; i++) { const p = -len / 2 + i * len / n; piece(rbox(0.12, 0.55, 0.08, 0.03), C.white, { pos: axis === 'x' ? [p, 0.28, 0] : [0, 0.28, p], parent: g }); } piece(rbox(axis === 'x' ? len : 0.05, 0.07, axis === 'x' ? 0.05 : len, 0.02), C.white, { pos: [0, 0.38, 0], parent: g }); return g; }
function mailbox(flag) { const g = G(); piece(rbox(0.08, 0.9, 0.08, 0.03), C.woodD, { pos: [0, 0.45, 0], parent: g }); piece(rbox(0.3, 0.3, 0.5, 0.12), C.sky, { pos: [0, 1.0, 0], parent: g }); piece(rbox(0.04, flag ? 0.3 : 0.06, flag ? 0.06 : 0.25, 0.015), C.pink, { pos: [0.17, flag ? 1.2 : 1.0, -0.05], parent: g }); return g; }
function tree(r = 1.0, col = C.leaf, blossom = false) { const g = G(); piece(rcyl(0.14, 0.2, 1.1, 0.05, 12), C.woodD, { pos: [0, 0.55, 0], parent: g }); [[0, 1.55, 0, r], [0.45 * r, 1.3, 0.2 * r, r * 0.7], [-0.4 * r, 1.35, -0.1, r * 0.7], [0.1, 1.9, -0.25 * r, r * 0.6]].forEach(([x, y, z, rr]) => piece(sphere(rr, 18, 12), blossom ? C.pinkL : col, { pos: [x, y, z], parent: g })); if (blossom) for (let i = 0; i < 8; i++) piece(sphere(0.07, 8, 6), C.white, { noOutline: true, pos: [Math.cos(i) * r * 0.8, 1.5 + Math.sin(i * 3) * 0.4, Math.sin(i) * r * 0.8], parent: g }); return g; }
// Cây cảnh riêng biệt theo loài, có thể tái dùng làm asset khi mở chế độ custom.
function floweringTree(kind, size = 1) {
  const g = G();
  const palettes = {
    hoagiay: [0xD74F96, 0xF48CB5, 0xFFFFFF],
    hoasua: [0xF7F2D7, 0xFFFFFF, 0xD9E6A4],
    anhdao: [0xF6A7CA, 0xFFD2E2, 0xFFF1F6],
    phuong: [0xF46D4B, 0xFFB06D, 0xFFDD91]
  };
  const colors = palettes[kind] || palettes.anhdao;
  piece(rcyl(0.11, 0.19, 1.7, 0.035, 10), C.woodD, { pos: [0, 0.85, 0], parent: g });
  for (let i = 0; i < 5; i++) {
    const a = i * 2.399, radius = 0.52 + (i % 2) * 0.19;
    const x = Math.cos(a) * radius, z = Math.sin(a) * radius;
    piece(rcyl(0.055, 0.075, 0.95, 0.025, 7), C.woodD, { pos: [x * 0.43, 1.52, z * 0.43], rot: [Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.52], parent: g });
    piece(sphere(0.68, 14, 10), kind === 'hoasua' ? C.leaf : C.leafL, { pos: [x, 1.85 + (i % 3) * 0.17, z], parent: g });
    for (let j = 0; j < 7; j++) {
      const theta = j * 2.4 + i, u = Math.cos(theta), v = Math.sin(theta);
      piece(sphere(kind === 'hoasua' ? 0.10 : 0.17, 8, 6), colors[(i+j)%3], {
        pos: [x + u * 0.55, 1.86 + (i%3)*0.17 + v*0.37, z + Math.sin(theta*1.3)*0.48],
        parent: g, noOutline: true
      });
    }
  }
  g.scale.setScalar(size);
  return g;
}
function bush(r = 0.35, col = C.leafL) { const g = G(); piece(sphere(r, 14, 10).scale(1, 0.8, 1), col, { pos: [0, r * 0.7, 0], parent: g }); return g; }
function stone(r = 0.3) { const g = G(); piece(rcyl(r, r, 0.06, 0.03, 16), C.stone, { pos: [0, 0.03, 0], parent: g, cast: false }); return g; }
function flowerTuft(col) { const g = G(); for (let i = 0; i < 5; i++) { const a = i * 1.3; piece(rcyl(0.01, 0.01, 0.28, 0.004, 4), C.leafD, { noOutline: true, pos: [Math.cos(a) * 0.15, 0.14, Math.sin(a) * 0.15], parent: g }); piece(sphere(0.07, 10, 8), col, { pos: [Math.cos(a) * 0.15, 0.3, Math.sin(a) * 0.15], parent: g }); } return g; }
function bedPlot(state) { const g = G(); piece(rbox(1.0, 0.28, 1.0, 0.06), C.wood, { pos: [0, 0.14, 0], parent: g }); piece(rbox(0.86, 0.04, 0.86, 0.02), state === 'uot' ? C.earthD : C.earth, { noOutline: true, pos: [0, 0.29, 0], parent: g }); return g; }
function swing() { const g = G(); for (const s of [-1, 1]) piece(rbox(0.1, 1.8, 0.1, 0.04), C.white, { pos: [s * 0.8, 0.9, 0], parent: g }); piece(rbox(1.8, 0.1, 0.12, 0.04), C.white, { pos: [0, 1.8, 0], parent: g }); for (const s of [-1, 1]) piece(rcyl(0.012, 0.012, 1.1, 0.005, 4), C.navy, { noOutline: true, pos: [s * 0.35, 1.2, 0], parent: g }); piece(rbox(0.9, 0.08, 0.35, 0.04), C.pink, { pos: [0, 0.62, 0], parent: g }); return g; }
function kiosk() { const g = G(); piece(rbox(1.8, 1.0, 0.8, 0.08), C.wood, { pos: [0, 0.5, 0], parent: g }); piece(rbox(1.9, 0.08, 0.9, 0.03), C.white, { pos: [0, 1.04, 0], parent: g });
  for (const s of [-1, 1]) piece(rbox(0.08, 1.9, 0.08, 0.03), C.white, { pos: [s * 0.88, 1.0, 0.42], parent: g }); for (const s of [-1, 1]) piece(rbox(0.08, 2.0, 0.08, 0.03), C.white, { pos: [s * 0.88, 1.0, -0.42], parent: g });
  for (let i = 0; i < 6; i++) piece(rbox(0.33, 0.06, 1.2, 0.02), i % 2 ? C.white : C.sky, { pos: [-0.83 + i * 0.33, 2.05, 0.15], rot: [-0.22, 0, 0], parent: g });
  piece(rbox(0.7, 0.45, 0.05, 0.02), C.navy, { pos: [0.4, 1.45, -0.42], parent: g }); piece(rcyl(0.18, 0.22, 0.5, 0.06, 16), 0xBFE3FA, { opacity: 0.6, pos: [-0.5, 1.33, 0], parent: g });
  for (const s of [-1, 1]) piece(rcyl(0.18, 0.18, 0.07, 0.03, 14), C.pink, { pos: [s * 0.5, 0.75, 0.75], parent: g }); for (const s of [-1, 1]) piece(rcyl(0.04, 0.04, 0.72, 0.01, 8), C.navy, { pos: [s * 0.5, 0.36, 0.75], parent: g });
  return g; }
function boat(rowing) { const g = G(); piece(lathe([[0, -0.3], [0.45, -0.25], [0.6, 0.0], [0.62, 0.05], [0, 0.05]]).scale(1, 1, 2.1), C.white, { pos: [0, 0.3, 0], parent: g }); piece(rbox(1.0, 0.06, 2.2, 0.03), C.sky, { pos: [0, 0.34, 0], parent: g, noOutline: true }); piece(rbox(1.0, 0.08, 0.25, 0.03), C.wood, { pos: [0, 0.3, 0.2], parent: g }); return g; }
function dock(len = 3) { const g = G(); for (let i = 0; i < len / 0.4; i++) piece(rbox(1.3, 0.12, 0.36, 0.03), i % 2 ? C.wood : 0xE0BE92, { pos: [0, 0.3, i * 0.4], parent: g }); for (const s of [-1, 1]) for (const z of [0.4, len - 0.2]) piece(rcyl(0.08, 0.08, 1.0, 0.03, 10), C.woodD, { pos: [s * 0.62, 0.1, z], parent: g }); const lamp = G(); lamp.position.set(0.62, 0.6, len - 0.2); g.add(lamp); piece(rbox(0.22, 0.28, 0.22, 0.06), C.butter, { pos: [0, 0.2, 0], parent: lamp, emissive: C.butter, ei: 0.2 }); return g; }
function chimney() { const g = G(); piece(rbox(0.6, 1.1, 0.6, 0.06), C.pink, { pos: [0, 0.55, 0], parent: g }); piece(rbox(0.72, 0.15, 0.72, 0.05), C.pinkD, { pos: [0, 1.12, 0], parent: g }); const h = new THREE.Shape(); h.moveTo(0, -0.12); h.bezierCurveTo(-0.3, 0.1, -0.12, 0.3, 0, 0.14); h.bezierCurveTo(0.12, 0.3, 0.3, 0.1, 0, -0.12); piece(new THREE.ExtrudeGeometry(h, { depth: 0.06, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 2 }), C.white, { pos: [0, 0.62, 0.3], scale: 1.1, parent: g }); return g; }
function nameSign() { const g = G(); for (const s of [-1, 1]) piece(rbox(0.08, 0.8, 0.08, 0.03), C.woodD, { pos: [s * 0.45, 0.4, 0], parent: g }); piece(rbox(1.2, 0.42, 0.08, 0.05), C.wood, { pos: [0, 0.75, 0], parent: g }); return g; }
function islet(level = 1) { // đảo vương quốc xa
  const g = G(); piece(rbox(3.2, 0.9, 3.2, 0.35), C.earth, { pos: [0, -0.45, 0], parent: g }); piece(rbox(3.3, 0.22, 3.3, 0.12), C.grass, { pos: [0, 0.05, 0], parent: g, receive: true });
  piece(rbox(0.9, 0.7, 0.9, 0.1), C.white, { pos: [-0.3, 0.5, -0.4], parent: g }); for (const s of [-1, 1]) piece(rcyl(0.22, 0.24, 1.3, 0.05, 14), C.white, { pos: [-0.3 + s * 0.45, 0.8, -0.4 + s * -0.0], parent: g });
  for (const s of [-1, 1]) piece(new THREE.ConeGeometry(0.3, 0.5, 16), s > 0 ? C.pink : C.sky, { pos: [-0.3 + s * 0.45, 1.7, -0.4], parent: g });
  const t = tree(0.4); t.position.set(0.9, 0, 0.8); t.scale.setScalar(0.7); g.add(t);
  return g;
}

// ---------- vỏ nhà và phòng ----------
function roomBox(g, r, key) {
  const x0 = r.x0, x1 = r.x1, y = r.y, w = x1 - x0, d = HZ1 - HZ0, cx = (x0 + x1) / 2, cz = (HZ0 + HZ1) / 2;
  piece(rbox(w, 0.06, d, 0.02), r.floor, { noOutline: true, pos: [cx, y + 0.03, cz], parent: g, receive: true, emissive: r.floor, ei: 0.18 });
  if (r.tiles) for (let i = 0; i < w / 0.5; i++) for (let j = 0; j < d / 0.5; j++) if ((i + j) % 2) piece(new THREE.PlaneGeometry(0.5, 0.5), C.sky2, { noOutline: true, basic: false, pos: [x0 + 0.25 + i * 0.5, y + 0.065, HZ0 + 0.25 + j * 0.5], rot: [-Math.PI / 2, 0, 0], parent: g, receive: true, cast: false });
  // tường sau (z = HZ0) màu riêng của phòng
  const H = key === 'gac' ? 0.5 : FH - 0.12;
  piece(rbox(w, H, 0.16, 0.04), r.wall, { pos: [cx, y + H / 2 + 0.06, HZ0 - 0.08], parent: g, receive: true, emissive: r.wall, ei: 0.3 });
}
// Kiến trúc nhà búp bê: cửa thật, khung sổ và đường đi giữa các phòng.
// Các vị trí phòng và vùng chạm không thay đổi để giữ tương thích scene.json.
function doorway(g, x, y, z, accent = C.woodD) {
  const w = 0.95, h = 1.9, thick = 0.13;
  for (const side of [-1, 1]) piece(rbox(thick, h, 0.16, 0.035), C.white, { pos: [x + side * w / 2, y + h / 2, z], parent: g });
  piece(rbox(w + thick, 0.15, 0.19, 0.035), C.white, { pos: [x, y + h, z], parent: g });
  piece(rbox(w - 0.12, 0.07, 0.35, 0.02), accent, { pos: [x, y + 0.045, z + 0.07], parent: g, receive: true });
  // Cánh cửa hé mở tạo cảm giác có thể bước qua, không chắn tầm nhìn căn phòng.
  piece(rbox(0.08, 1.72, 0.68, 0.04), accent, { pos: [x - w / 2 + 0.08, y + 0.88, z - 0.18], rot: [0, -0.36, 0], parent: g });
  piece(sphere(0.055, 10, 8), C.butter, { pos: [x - w / 2 + 0.12, y + 0.95, z + 0.14], parent: g });
}
function houseWindow(g, x, y, z, glow) {
  piece(rbox(1.22, 1.12, 0.14, 0.07), C.white, { pos: [x, y, z], parent: g });
  piece(rbox(1.0, 0.9, 0.04, 0.025), glow, { pos: [x, y, z + 0.085], parent: g, noOutline: true });
  piece(rbox(0.085, 0.98, 0.1, 0.02), C.woodD, { pos: [x, y, z + 0.11], parent: g });
  piece(rbox(1.08, 0.085, 0.1, 0.02), C.woodD, { pos: [x, y, z + 0.12], parent: g });
  piece(rbox(1.4, 0.12, 0.35, 0.045), C.white, { pos: [x, y - 0.61, z + 0.2], parent: g });
}
function housePorch(g, x, z, night) {
  piece(rbox(2.5, 0.16, 1.12, 0.06), C.wood, { pos: [x, 0.11, z], parent: g, receive: true });
  for (const side of [-1, 1]) {
    piece(rbox(0.14, 2.3, 0.14, 0.04), C.white, { pos: [x + side * 1.08, 1.23, z + 0.42], parent: g });
    piece(rbox(0.34, 0.3, 0.34, 0.08), C.woodD, { pos: [x + side * 1.08, 0.28, z + 0.42], parent: g });
  }
  piece(rbox(2.62, 0.18, 1.35, 0.07), C.sky, { pos: [x, 2.42, z], parent: g });
  for (const side of [-1, 1]) piece(rbox(0.08, 0.3, 0.08, 0.025), C.navy, { pos: [x + side * 0.84, 2.22, z + 0.5], parent: g });
  piece(sphere(0.14, 12, 10), night ? C.butter : C.white, { pos: [x, 2.25, z + 0.48], parent: g, emissive: night ? C.butter : 0, ei: night ? 0.7 : 0 });
  for (let i = 0; i < 3; i++) piece(rbox(2.1 - i * 0.2, 0.08, 0.25, 0.03), C.woodD, { pos: [x, 0.06 - i * 0.035, z + 0.63 + i * 0.23], parent: g });
}

function house(time) {
  const g = G(), night = time === 'dem' || time === 'chieu';
  const X0 = -6, X1 = 3.6, d = HZ1 - HZ0, cz = (HZ0 + HZ1) / 2;
  // sàn các tầng
  piece(rbox(X1 - X0 + 0.2, 0.3, d + 0.2, 0.06), C.woodD, { pos: [(X0 + X1) / 2, -0.12, cz], parent: g, receive: true });
  piece(rbox(X1 - X0 + 0.2, 0.26, d + 0.2, 0.06), C.white, { pos: [(X0 + X1) / 2, FH - 0.1, cz], parent: g, receive: true, emissive: C.white, ei: 0.2 });
  piece(rbox(5.6, 0.24, d + 0.2, 0.06), C.white, { pos: [-1.9, FH * 2 - 0.1, cz], parent: g, receive: true, emissive: C.white, ei: 0.2 });
  for (const [k, r] of Object.entries(ROOMS)) roomBox(g, r, k);
  // tường đầu hồi trái (x = X0) cả 2 tầng
  piece(rbox(0.22, FH * 2, d + 0.36, 0.05), C.white, { pos: [X0 - 0.11, FH, cz - 0.0], parent: g, receive: true, emissive: C.white, ei: 0.25 });
  // vách ngăn thấp giữa phòng + cột trước
  for (const x of [-3, 0.6]) { piece(rbox(0.14, 0.5, d, 0.04), C.white, { pos: [x, 0.25, cz], parent: g }); piece(rbox(0.2, FH, 0.2, 0.05), C.white, { pos: [x, FH / 2, HZ1 - 0.1], parent: g }); }
  piece(rbox(0.14, 0.5, d, 0.04), C.white, { pos: [-1.2, FH + 0.25, cz], parent: g });
  piece(rbox(0.2, FH, 0.2, 0.05), C.white, { pos: [X1 - 0.1, FH / 2, HZ1 - 0.1], parent: g });
  piece(rbox(0.2, FH, 0.2, 0.05), C.white, { pos: [X1 - 0.1, FH * 1.5, HZ1 - 0.1], parent: g });
  // Khung cửa sổ chia ô và bậu cửa cùng chất liệu với các phòng.
  const glow = night ? C.butter : 0xCFE8FA;
  [[-4.4, 1.7], [2.1, 1.8], [-3.7, FH + 1.7], [1.4, FH + 1.7]].forEach(([x, y]) => houseWindow(g, x, y, HZ0 + 0.02, glow));
  // Lối đi ở mặt cắt trước, không làm kín mặt tiền để vẫn nhìn thấy nội thất.
  for (const [x, y] of [[-3, 0], [0.6, 0], [-1.2, FH]]) doorway(g, x, y, HZ1 - 0.04);
  // Cửa chính và hiên nằm trước phòng khách, nhìn rõ từ bản đồ ngoài trời.
  housePorch(g, -1.2, HZ1 + 0.52, night);
  doorway(g, -1.2, 0, HZ1 + 0.04, C.wood);
  // mái gác: dốc sau + đầu hồi trái, cắt mặt trước
  const rw = 5.7, rcx = -1.9, ry0 = FH * 2, rise = 2.4, run = 1.4, ang = Math.atan2(rise, run), len = Math.hypot(rise, run) + 0.2;
  // mái chéo ngả ra sau: thấy mặt trong bằng gỗ, mép trên lợp xanh trời
  const roofC = [rcx, ry0 + rise / 2, HZ0 - run / 2];
  piece(rbox(rw, 0.16, len, 0.05), C.wood, { pos: roofC, rot: [ang, 0, 0], parent: g, receive: true, emissive: C.wood, ei: 0.15 });
  piece(rbox(rw + 0.4, 0.2, len + 0.25, 0.08), C.sky, { pos: [roofC[0], roofC[1] + 0.06, roofC[2] - 0.12], rot: [ang, 0, 0], parent: g });
  for (let i = 1; i < 6; i++) piece(rbox(0.1, 0.12, len - 0.2, 0.03), C.woodD, { noOutline: true, pos: [rcx - rw / 2 + i * rw / 6, roofC[1] + 0.06, roofC[2] + 0.05], rot: [ang, 0, 0], parent: g });
  piece(rbox(0.22, 1.5, d + 0.2, 0.05), C.white, { pos: [-4.75, ry0 + 0.75, cz], parent: g, emissive: C.white, ei: 0.25 });
  piece(rcyl(0.32, 0.32, 0.1, 0.05, 24), glow, { pos: [-4.62, ry0 + 0.85, cz], rot: [0, 0, Math.PI / 2], parent: g, emissive: night ? C.butter : 0, ei: night ? 0.9 : 0 });
  const ch = chimney(); ch.position.set(-0.6, ry0 + 1.75, HZ0 - 1.25); g.add(ch);
  // nội thất
  const R = ROOMS;
  // góc sáng tạo
  g.add(at(easel(), -4.7, 0.05, -4.5, 0.4)); g.add(at(typewriterDesk(), -3.9, 0.05, -5.25)); g.add(at(F.cushion(C.butter), -5.2, 0.05, -3.4));
  // phòng khách
  const so = F.sofa(); so.scale.setScalar(0.85); g.add(at(so, -1.2, 0.05, -5.25)); const tb = F.coffeeTable(); tb.scale.setScalar(0.8); g.add(at(tb, -1.0, 0.05, -3.85)); const j = F.jar('day'); j.scale.setScalar(0.9); g.add(at(j, -1.0, 0.48, -3.85)); g.add(at(F.rug(1.15), -1.1, 0.05, -3.6)); const pt = F.pothos(); g.add(at(pt, 0.1, 0.05, -5.3));
  // bếp
  g.add(at(fridge(), 1.1, 0.05, -5.3)); g.add(at(counter(1.5), 2.6, 0.05, -5.3)); g.add(at(table2(), 2.1, 0.05, -3.6));
  // phòng Anh
  g.add(at(bed(C.sky, false), -5.3, FH, -4.5)); g.add(at(desk(true), -3.2, FH, -5.3)); g.add(at(wardrobe(C.white), -2.0, FH, -5.3));
  // phòng Em
  g.add(at(bed(C.pink, true), 2.8, FH, -4.5)); g.add(at(wardrobe(C.petal), -0.4, FH, -5.3)); const pl = F.pothos(); g.add(at(pl, 0.9, FH, -5.3)); const bear = G(); piece(sphere(0.22, 14, 10), C.woodD, { pos: [0, 0.22, 0], parent: bear }); piece(sphere(0.17, 14, 10), C.woodD, { pos: [0, 0.55, 0], parent: bear }); for (const s of [-1, 1]) piece(sphere(0.07, 8, 6), C.woodD, { pos: [s * 0.13, 0.7, 0], parent: bear }); g.add(at(bear, 0.3, FH, -3.4));
  // gác kỷ niệm
  g.add(at(chest(false), -3.6, FH * 2, -4.5)); g.add(at(vitrine(), -1.6, FH * 2, -5.3)); g.add(at(armchair(), -0.2, FH * 2, -3.7, -0.4));
  // cầu thang (góc sáng tạo lên)
  const st = F.stairs(8); st.scale.set(0.8, 0.95, 0.85); g.add(at(st, -5.45, 0.05, -2.8)); // dọc tường trái
  // Nới rộng mặt bằng nhà, giữ chiều cao và đồ nội thất nguyên kích thước.
  // Tăng diện tích trống thực sự, không phóng to mọi đồ vật.
  const midX = (X0 + X1) / 2, midZ = cz;
  for (const child of g.children) {
    child.position.x = midX + (child.position.x - midX) * 1.16;
    child.position.z = midZ + (child.position.z - midZ) * 1.24;
    child.scale.x *= 1.16;
    child.scale.z *= 1.24;
  }
  return g;
}

function island(time) {
  const g = G(), night = time === 'dem';
  // đảo đất: nhiều lớp vách
  piece(rbox(13.2, 0.7, 13.2, 0.4), C.grassD, { pos: [0, -0.35, 0], parent: g, receive: true });
  piece(rbox(13, 1.1, 13, 0.45), C.earth, { pos: [0, -1.2, 0], parent: g });
  piece(rbox(11.6, 1.0, 11.6, 0.45), C.earthD, { pos: [0, -2.1, 0], parent: g });
  piece(rbox(9, 0.9, 9, 0.45), 0x7A5238, { pos: [0, -2.9, 0], parent: g });
  piece(rbox(13.05, 0.08, 13.05, 0.04), C.grass, { noOutline: true, pos: [0, 0.0, 0], parent: g, receive: true });
  // lối đi đá từ cửa ra cổng
  [[-1.2, -1.8, 0.32], [-1.0, -0.9, 0.28], [-1.3, 0.1, 0.34], [-1.0, 1.1, 0.28], [-1.3, 2.1, 0.32], [-1.05, 3.1, 0.3], [-1.3, 4.1, 0.33], [-1.1, 5.1, 0.28]].forEach(([x, z, r]) => g.add(at(stone(r), x, 0.04, z)));
  // hàng rào trước + cổng
  const f1 = fence(4.0); g.add(at(f1, -3.9, 0.04, 6.2)); const f2 = fence(5.2); g.add(at(f2, 2.0, 0.04, 6.2));
  g.add(at(mailbox(true), -0.2, 0.04, 6.0)); g.add(at(nameSign(), -2.4, 0.04, 5.6)); g.add(at(lampPost(night || time === 'chieu'), -0.15, 0.04, 2.6));
  // vườn chung 4 × 3 luống (bên phải)
  for (let i = 0; i < 4; i++) for (let k = 0; k < 3; k++) { const x = 1.3 + i * 1.25, z = 0.2 + k * 1.25; g.add(at(bedPlot(), x, 0.04, z)); }
  g.add(at(swing(), 4.9, 0.04, 4.6, 0));
  g.add(at(floweringTree('anhdao', 0.72), 5.35, 0.04, -4.6));
  g.add(at(floweringTree('hoasua', 0.68), -5.35, 0.04, -0.6));
  g.add(at(floweringTree('hoagiay', 0.58), -5.4, 0.04, 1.1));
  g.add(at(floweringTree('phuong', 0.52), 5.5, 0.04, -1.8));
  [[5.6, -2.2], [-5.6, 2.4], [3.2, -1.6], [5.7, 2.9]].forEach(([x, z]) => g.add(at(bush(0.38), x, 0.04, z)));
  [[-3.0, -1.6, C.lilac], [-4.3, -1.9, C.pinkL], [0.5, -1.7, C.white]].forEach(([x, z, c]) => g.add(at(flowerTuft(c), x, 0.04, z)));
  // quán cà phê ven biển (trước-trái)
  g.add(at(kiosk(), -4.9, 0.04, 3.4, 0));
  g.scale.set(1.18, 1, 1.18);
  return g;
}

function sea(time) {
  const g = G();
  const disc = new THREE.Mesh(new THREE.CircleGeometry(30, 96), mat(time === 'dem' ? 0x34558F : C.sea)); disc.rotation.x = -Math.PI / 2; disc.position.y = -1.7; disc.receiveShadow = true; g.add(disc);
  const rim = new THREE.Mesh(new THREE.RingGeometry(29.4, 30, 96), mat(C.white, { basic: true, opacity: 0.5 })); rim.rotation.x = -Math.PI / 2; rim.position.y = -1.68; g.add(rim);
  // gợn sóng quanh đảo
  for (const [r, o] of [[7.6, 0.55], [8.6, 0.35]]) { const m = new THREE.Mesh(new THREE.TorusGeometry(r, 0.05, 4, 120), mat(C.white, { basic: true, opacity: o })); m.rotation.x = Math.PI / 2; m.position.y = -1.66; m.scale.set(1.18, 1.18, 1); g.add(m); }
  return g;
}

export function mapScene(time) {
  const s = makeScene(time, { shadowSize: 12, shadowRes: 4096, shadowBlur: 4 });
  s.add(sea(time)); s.add(island(time)); s.add(house(time));
  const dk = dock(3.2); g_at(dk, 3.0, -1.55, 6.6); s.add(dk);
  const bt = boat(false); bt.position.set(3.0, -1.75, 10.6); bt.rotation.y = 0.15; s.add(bt);
  const isl = islet(1); isl.position.set(6.5, -1.45, 12.5); isl.scale.setScalar(1.0); s.add(isl);
  return s;
}
function g_at(o, x, y, z) { o.position.set(x, y, z); return o; }
const cam = () => isoCamera(MAP.w, MAP.h, MAP.ppm, MAP.target, MAP.shift);

function hull(pts) { // bao lồi 2D
  pts = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [], up = [];
  for (const p of pts) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
  for (const p of pts.slice().reverse()) { while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
  return lo.slice(0, -1).concat(up.slice(0, -1));
}
function zone(c, x0, x1, y0, y1, z0, z1) { const p = []; for (const x of [x0, x1]) for (const y of [y0, y1]) for (const z of [z0, z1]) p.push(toPx(c, x, y, z)); return hull(p); }

export const jobs = {
  thu1: async () => [{ file: 'ban_do_test.png', data: shoot(mapScene('ngay'), cam(), { bg: 0xBFE3FA }) }],
  bando: async () => {
    const out = [];
    for (const t of ['sang', 'ngay', 'chieu', 'dem']) out.push({ file: `ban_do_${t}@3x.png`, data: shoot(mapScene(t), cam()) });
    const c = cam(), Z = {};
    for (const [k, r] of Object.entries(ROOMS)) { const hx = x => -1.2 + (x + 1.2) * 1.16, hz = z => -4.1 + (z + 4.1) * 1.24; Z[k] = { name: r.name, go: r.go, poly: zone(c, hx(r.x0), hx(r.x1), r.y + 0.05, r.y + (k === 'gac' ? 2.2 : FH - 0.1), hz(HZ0), hz(HZ1)), floor: toPx(c, hx((r.x0 + r.x1) / 2), r.y + 0.06, hz((HZ0 + HZ1) / 2 + 0.6)) }; }
    Z.vuon = { name: 'Vườn chung', go: 'khu-vuon', poly: zone(c, 0.7, 5.7, 0, 0.5, -0.4, 3.3) };
    Z.hopthu = { name: 'Hộp thư', go: 'thu', poly: zone(c, -0.6, 0.3, 0, 1.4, 5.6, 6.4) };
    Z.cafe = { name: 'Quán cà phê', go: 'hom-nay', poly: zone(c, -5.9, -3.9, 0, 2.2, 2.9, 3.9) };
    Z.ben = { name: 'Bến thuyền', go: 'vuong-quoc', poly: zone(c, 2.3, 3.7, -1.6, -0.8, 6.6, 11.6) };
    Z.dao = { name: 'Đảo vương quốc', go: 'vuong-quoc', poly: zone(c, 4.7, 8.3, -2.4, 0.8, 10.7, 14.3) };
    const roomPos = (x, y, z) => toPx(c, -1.2 + (x + 1.2) * 1.16, y, -4.1 + (z + 4.1) * 1.24);
    out.push({ file: 'ban_do_meta', meta: { size: [MAP.w, MAP.h], ppm: MAP.ppm, zones: Z, sign: toPx(c, -2.4, 0.83, 5.65), anh: roomPos(-4.6, FH + 0.06, -3.4), em: roomPos(1.6, FH + 0.06, -3.4), khach: roomPos(-0.2, 0.06, -3.3), thu: roomPos(-2.2, 0.06, -3.0), pet_door: roomPos(-1.6, 0.04, -1.6), plots: (() => { const a = []; for (let k = 0; k < 3; k++) for (let i = 0; i < 4; i++) a.push(toPx(c, 1.3 + i * 1.25, 0.32, 0.2 + k * 1.25)); return a; })(), plotPpm: MAP.ppm } });
    return out;
  },
  may: async () => { // mây rời để trôi
    const out = [];
    for (let i = 0; i < 3; i++) {
      const s = makeScene('ngay', {}); const g = G(); const parts = [[0, 0, 0, 0.9], [0.9, -0.1, 0.2, 0.7], [-0.9, -0.15, 0.1, 0.65], [0.3, 0.45, 0, 0.6], [-0.4, 0.35, 0.3, 0.55]].slice(0, 3 + i);
      parts.forEach(([x, y, z, r]) => piece(sphere(r, 20, 14), C.white, { pos: [x, y, z], parent: g, emissive: C.white, ei: 0.35 })); s.add(g);
      out.push({ file: `may_${i + 1}@3x.png`, data: shoot(s, isoCamera(600, 360, 120, [0, 0.1, 0])) });
    }
    return out;
  }
};
