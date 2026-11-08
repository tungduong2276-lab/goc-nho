// TỰ SINH từ _xuong-3d/ bởi scripts/sync-nha3d.mjs — đừng sửa tay.
// Đồ nội thất và vật tương tác — mục 6 của brief. Mỗi món quay mặt về +z;
// treo lên tường trái (x = -3) thì xoay y = +90°, tường phải (z = -3) giữ nguyên.
import { THREE, C, piece, rbox, sphere, capsule, rcyl, lathe, torus, tube, leafGeo, mat } from './lib.js';

const G = () => new THREE.Group();

export function sofa(o = {}) {
  const g = G(), col = o.color ?? C.sky, colD = 0x63ACE0;
  piece(rbox(2.1, 0.32, 0.95, 0.12), colD, { pos: [0, 0.3, 0], parent: g });           // đế
  piece(rbox(2.15, 0.62, 0.32, 0.14), col, { pos: [0, 0.68, -0.34], parent: g });       // lưng
  for (const s of [-1, 1]) piece(rbox(0.3, 0.5, 0.98, 0.13), col, { pos: [s * 1.0, 0.55, 0.01], parent: g }); // tay vịn
  for (const s of [-1, 1]) piece(rbox(0.84, 0.2, 0.7, 0.09), C.white, { pos: [s * 0.43, 0.54, 0.08], parent: g }); // nệm
  for (const [x, c] of [[-0.55, C.pink], [0.6, C.petal]]) { const p = sphere(0.22, 18, 12); p.scale(1, 0.85, 0.45); piece(p, c, { pos: [x, 0.84, -0.12], rot: [-0.25, 0, x > 0 ? -0.2 : 0.2], parent: g }); }
  for (const s of [-1, 1]) for (const z of [-1, 1]) piece(rcyl(0.05, 0.04, 0.16, 0.02, 12), C.woodD, { pos: [s * 0.95, 0.08, z * 0.35], parent: g });
  return g;
}
export function coffeeTable() {
  const g = G();
  piece(rcyl(0.55, 0.55, 0.1, 0.045, 36), C.wood, { pos: [0, 0.48, 0], parent: g });
  piece(rcyl(0.07, 0.09, 0.42, 0.03, 16), C.woodD, { pos: [0, 0.22, 0], parent: g });
  piece(rcyl(0.3, 0.33, 0.06, 0.03, 28), C.woodD, { pos: [0, 0.03, 0], parent: g });
  return g;
}
// hũ hẹn hò: state = 'day' | 'nua' | 'it' | 'mo'
export function jar(state = 'day') {
  const g = G(), H = 0.52, R = 0.2;
  const n = { day: 26, nua: 13, it: 4, mo: 13 }[state];
  const cols = [C.pink, C.leaf, C.sky, C.butter, C.pinkL, C.lilac];
  let seed = 7; const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  const fillH = H * 0.86 * n / 26;
  for (let i = 0; i < n; i++) {
    const a = rnd() * Math.PI * 2, r = 0.04 + rnd() * 0.1, y = 0.06 + (i / n) * fillH;
    piece(rbox(0.11, 0.025, 0.06, 0.012, 2), cols[i % cols.length], { noOutline: true, pos: [Math.cos(a) * r, y, Math.sin(a) * r], rot: [rnd() * 0.8, rnd() * 3, rnd() * 0.8], parent: g });
  }
  const glass = lathe([[0, 0], [R - 0.04, 0], [R, 0.04], [R + 0.01, H * 0.5], [R - 0.01, H - 0.06], [R - 0.06, H - 0.02], [R - 0.06, H], [0, H]]);
  piece(glass, 0xBFE3FA, { opacity: 0.38, parent: g, cast: false });
  piece(new THREE.PlaneGeometry(0.035, H * 0.6), C.white, { noOutline: true, basic: true, opacity: 0.7, pos: [-0.1, H * 0.5, 0.17], rot: [0, -0.5, 0], parent: g });
  const lid = G(); lid.position.set(0, H + 0.03, 0); g.add(lid);
  piece(rcyl(R - 0.03, R - 0.03, 0.08, 0.03, 28), C.sky, { parent: lid });
  // nơ hồng
  for (const s of [-1, 1]) { const b = sphere(0.06, 14, 10); b.scale(1.2, 0.7, 0.55); piece(b, C.pink, { pos: [s * 0.065, 0.075, 0.12], rot: [0, 0, s * 0.35], parent: lid }); }
  piece(sphere(0.03, 12, 8), C.pinkD, { pos: [0, 0.07, 0.13], parent: lid });
  if (state === 'mo') { lid.position.set(0.3, 0.04, 0.14); lid.rotation.set(0.25, 0, -1.25); }
  return g;
}
export function calendar() { // để trống số — app tự in
  const g = G();
  piece(rbox(0.72, 0.84, 0.06, 0.04), C.white, { pos: [0, 0, 0], parent: g });
  piece(rbox(0.72, 0.22, 0.08, 0.04), C.pink, { pos: [0, 0.31, 0.01], parent: g });
  for (const s of [-1, 1]) piece(torus(0.04, 0.014, Math.PI * 2, 6, 14), C.navy, { noOutline: true, pos: [s * 0.18, 0.43, 0.05], parent: g });
  piece(rbox(0.5, 0.03, 0.02, 0.01), C.sky2, { noOutline: true, pos: [0, -0.31, 0.035], parent: g });
  return g;
}
export const CAL_FACE = { w: 0.6, h: 0.46, y: -0.05 }; // vùng in số (toạ độ cục bộ)
export function corkboard(withNotes = false) {
  const g = G();
  piece(rbox(1.1, 0.78, 0.07, 0.035), C.woodD, { parent: g });
  piece(rbox(0.98, 0.66, 0.05, 0.02), 0xE3B887, { pos: [0, 0, 0.02], parent: g, noOutline: true });
  if (withNotes) {
    [[-0.28, 0.12, C.butter, 0.15], [0.05, -0.1, C.petal, -0.1], [0.3, 0.13, 0xD8F3E2, 0.08], [-0.3, -0.17, C.sky2, -0.2]].forEach(([x, y, c, r]) => {
      piece(rbox(0.26, 0.24, 0.015, 0.008, 2), c, { pos: [x, y, 0.055], rot: [0, 0, r], parent: g });
      piece(sphere(0.025, 10, 8), [C.pink, C.leaf, C.sky, C.pinkD][Math.abs(Math.round(x * 10)) % 4], { pos: [x, y + 0.09, 0.075], parent: g, noOutline: true });
    });
  }
  return g;
}
export function photoFrame() {
  const g = G();
  piece(rbox(0.86, 0.66, 0.07, 0.04), C.wood, { parent: g });
  piece(rbox(0.7, 0.5, 0.04, 0.012), C.white, { pos: [0, 0, 0.03], parent: g, noOutline: true });
  const h = sphere(0.06, 12, 8); h.scale(1, 1, 0.5);
  return g;
}
export const FRAME_FACE = { w: 0.66, h: 0.46 };
export function radio(on = false) {
  const g = G();
  piece(rbox(0.5, 0.32, 0.22, 0.07), C.pink, { pos: [0, 0.16, 0], parent: g });
  piece(rcyl(0.09, 0.09, 0.03, 0.012, 20), C.white, { pos: [-0.1, 0.16, 0.11], rot: [Math.PI / 2, 0, 0], parent: g });
  for (let i = 0; i < 3; i++) piece(rbox(0.12, 0.016, 0.01, 0.005, 1), C.pinkD, { noOutline: true, pos: [-0.1, 0.12 + i * 0.04, 0.13], parent: g });
  piece(rbox(0.13, 0.08, 0.02, 0.01), on ? C.butter : C.sky2, { pos: [0.13, 0.2, 0.11], parent: g, emissive: on ? C.butter : 0, ei: on ? 0.6 : 0 });
  piece(rcyl(0.025, 0.025, 0.03, 0.01, 12), C.white, { pos: [0.1, 0.09, 0.115], rot: [Math.PI / 2, 0, 0], parent: g });
  piece(rcyl(0.025, 0.025, 0.03, 0.01, 12), C.white, { pos: [0.17, 0.09, 0.115], rot: [Math.PI / 2, 0, 0], parent: g });
  piece(tube([[-0.18, 0.31, 0], [-0.12, 0.42, 0], [0.12, 0.42, 0], [0.18, 0.31, 0]], 0.018, 16, 6), C.pinkD, { parent: g });
  return g;
}
// cửa sổ: sky = màu trời theo buổi; rain = giọt nước
export function windowW(o = {}) {
  const g = G(), W = 1.0, H = 1.1;
  piece(rbox(W + 0.14, H + 0.14, 0.1, 0.04), C.white, { parent: g });
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(W, H), new THREE.MeshBasicMaterial({ color: o.sky ?? C.sky2 }));
  sky.position.z = 0.051; g.add(sky);
  if (o.stars) for (let i = 0; i < 6; i++) piece(sphere(0.018, 6, 4), C.butter, { noOutline: true, basic: true, pos: [-0.35 + (i * 0.37) % 0.8, 0.4 - (i * 0.23) % 0.7, 0.06], parent: g });
  if (o.moon) piece(sphere(0.09, 16, 10).scale(1, 1, 0.2), C.butter, { noOutline: true, basic: true, pos: [0.25, 0.3, 0.06], parent: g });
  if (o.cloud) for (const [x, y, r] of [[-0.2, 0.25, 0.1], [-0.08, 0.28, 0.13], [0.06, 0.25, 0.1]]) piece(sphere(r, 12, 8).scale(1, 0.8, 0.2), C.white, { noOutline: true, basic: true, pos: [x, y, 0.06], parent: g });
  piece(rbox(0.07, H, 0.06, 0.02), C.white, { pos: [0, 0, 0.06], parent: g });
  piece(rbox(W, 0.07, 0.06, 0.02), C.white, { pos: [0, 0.05, 0.06], parent: g });
  piece(rbox(W + 0.3, 0.08, 0.24, 0.035), C.white, { pos: [0, -H / 2 - 0.08, 0.08], parent: g }); // bậu
  // rèm hồng hai bên
  for (const s of [-1, 1]) piece(rbox(0.2, H + 0.1, 0.07, 0.05), C.petal, { pos: [s * (W / 2 + 0.17), 0.02, 0.09], parent: g });
  if (o.rain) {
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(W, H), new THREE.MeshBasicMaterial({ color: 0x8FA9C6, transparent: true, opacity: 0.35 }));
    glass.position.z = 0.055; g.add(glass);
    for (let i = 0; i < 14; i++) piece(sphere(0.022, 8, 6).scale(0.8, 1.3, 0.3), C.white, { noOutline: true, basic: true, opacity: 0.85, pos: [-0.42 + ((i * 0.31) % 0.86), 0.45 - ((i * 0.57) % 0.92), 0.07], parent: g });
  }
  return g;
}
export function stairs(n = 7) {
  const g = G();
  for (let i = 0; i < n; i++) piece(rbox(0.95, 0.3 * (i + 1), 0.36, 0.05), i % 2 ? C.wood : 0xEFD6B4, { pos: [0, 0.15 * (i + 1), -i * 0.34], parent: g, receive: true });
  piece(rbox(0.06, 2.4, 0.06, 0.025), C.woodD, { pos: [0.48, 1.3, -1.0], rot: [0.72, 0, 0], parent: g });
  return g;
}
export function floorLamp(on = false) {
  const g = G();
  piece(rcyl(0.2, 0.22, 0.05, 0.02, 24), C.navy, { pos: [0, 0.03, 0], parent: g });
  piece(rcyl(0.025, 0.025, 1.3, 0.01, 10), C.white, { pos: [0, 0.68, 0], parent: g });
  piece(lathe([[0.12, 0.25], [0.25, 0], [0.24, -0.02], [0.11, 0.23]]), C.butter, { pos: [0, 1.25, 0], parent: g, emissive: on ? C.butter : 0, ei: on ? 0.9 : 0 });
  return g;
}
export function bookshelfLow() {
  const g = G();
  piece(rbox(1.3, 0.75, 0.42, 0.05), C.white, { pos: [0, 0.375, 0], parent: g });
  piece(rbox(1.18, 0.04, 0.36, 0.01), 0xE5EEF8, { noOutline: true, pos: [0, 0.38, 0.03], parent: g });
  const cols = [C.sky, C.pink, C.leaf, C.butter, C.lilac, C.sky2, C.pinkL];
  let x = -0.5;
  for (let i = 0; i < 7; i++) { const w = 0.08 + (i % 3) * 0.02, h = 0.24 + (i % 2) * 0.05; piece(rbox(w, h, 0.28, 0.015, 1), cols[i], { pos: [x, 0.42 + h / 2, 0.02], rot: [0, 0, i === 5 ? 0.25 : 0], parent: g }); x += w + 0.02; }
  for (let i = 0; i < 4; i++) piece(rbox(0.09, 0.22, 0.28, 0.015, 1), cols[(i + 3) % 7], { pos: [-0.45 + i * 0.11, 0.14, 0.02], parent: g });
  return g;
}
export function pot(color = C.white, r = 0.22, h = 0.3, face = false) {
  const g = G();
  piece(lathe([[0, 0], [r * 0.75, 0], [r, h * 0.9], [r * 1.08, h * 0.9], [r * 1.08, h], [0, h]]), color, { parent: g });
  piece(rcyl(r * 0.95, r * 0.95, 0.03, 0.01, 24), C.earthD, { pos: [0, h - 0.005, 0], parent: g, noOutline: true });
  if (face) {
    for (const s of [-1, 1]) piece(sphere(0.022, 8, 6), C.navy, { noOutline: true, pos: [s * 0.06, h * 0.55, r * 0.9], parent: g });
    piece(torus(0.03, 0.009, Math.PI, 6, 10), C.navy, { noOutline: true, pos: [0, h * 0.42, r * 0.92], rot: [0, 0, Math.PI], parent: g });
  }
  return g;
}
export function pothos() { // chậu trầu bà
  const g = pot(C.white, 0.24, 0.36, true);
  const lf = leafGeo(0.22, 0.13, 0.03);
  for (let i = 0; i < 11; i++) { const a = i * 2.4, r = 0.08 + (i % 3) * 0.08; piece(lf, i % 3 ? C.leaf : C.leafL, { pos: [Math.cos(a) * r * 0.5, 0.42 + (i % 4) * 0.09, Math.sin(a) * r * 0.5], rot: [-0.9 + (i % 3) * 0.3, a, 0], parent: g }); }
  // dây rủ
  for (const s of [-1, 1]) { const t = [[s * 0.2, 0.38, 0.05], [s * 0.3, 0.2, 0.12], [s * 0.28, -0.05, 0.2]]; piece(tube(t, 0.012, 10, 5), C.leafD, { noOutline: true, parent: g }); t.forEach((p, i) => i && piece(lf, C.leaf, { pos: p, rot: [0.4, s, 0], scale: 0.6, parent: g })); }
  return g;
}
export function rug(r1 = 1.45) {
  const g = G();
  piece(rcyl(r1, r1, 0.04, 0.02, 48), C.sky2, { pos: [0, 0.02, 0], parent: g, receive: true, cast: false });
  piece(rcyl(r1 * 0.72, r1 * 0.72, 0.045, 0.02, 48), C.petal, { pos: [0, 0.025, 0], parent: g, receive: true, cast: false, noOutline: true });
  piece(torus(r1 * 0.86, 0.025, Math.PI * 2, 6, 64), C.pink, { pos: [0, 0.045, 0], rot: [Math.PI / 2, 0, 0], parent: g, noOutline: true, cast: false });
  return g;
}
export function cushion(color = C.pink) { const g = G(); piece(rcyl(0.32, 0.32, 0.14, 0.06, 28), color, { pos: [0, 0.07, 0], parent: g }); return g; }
export function petBed() {
  const g = G();
  piece(torus(0.36, 0.11, Math.PI * 2, 12, 32), C.pink, { pos: [0, 0.1, 0], rot: [Math.PI / 2, 0, 0], parent: g });
  piece(rcyl(0.33, 0.33, 0.08, 0.03, 28), C.petal, { pos: [0, 0.05, 0], parent: g, noOutline: true });
  return g;
}

// sàn gỗ + 2 tường sau; trả về group gồm các phần
export function roomShell(o = {}) {
  const g = G(), N = o.n ?? 6, D = o.d ?? N, H = o.h ?? 2.7, T = 0.2;
  const half = N / 2, halfD = D / 2;
  // bệ sàn
  piece(rbox(N + T, 0.45, D + T, 0.08), o.base ?? C.woodD, { pos: [-T / 2, -0.225, -T / 2], parent: g, receive: true });
  piece(rbox(N, 0.06, D, 0.02), o.floor ?? C.wood, { pos: [0, 0.0, 0], parent: g, receive: true, noOutline: true });
  if (o.planks !== false) for (let i = 1; i < N * 2; i++) piece(new THREE.BoxGeometry(0.018, 0.005, D), o.plank ?? 0xDDB98C, { noOutline: true, pos: [-half + i * 0.5, 0.032, 0], parent: g, receive: true, cast: false });
  // tường trái (x = -half) và phải (z = -halfD)
  piece(rbox(T, H, D + T, 0.06), o.wallL ?? C.sky3, { pos: [-half - T / 2, H / 2, -T / 2], parent: g, receive: true, emissive: o.wallL ?? C.sky3, ei: 0.42 });
  piece(rbox(N + T, H, T, 0.06), o.wallR ?? C.white, { pos: [-T / 2, H / 2, -halfD - T / 2], parent: g, receive: true, emissive: o.wallR ?? C.white, ei: 0.3 });
  // len chân tường
  piece(rbox(0.04, 0.14, D, 0.015), o.skirt ?? C.woodD, { noOutline: true, pos: [-half + 0.02, 0.1, 0], parent: g });
  piece(rbox(N, 0.14, 0.04, 0.015), o.skirt ?? C.woodD, { noOutline: true, pos: [0, 0.1, -halfD + 0.02], parent: g });
  return g;
}
// treo đồ lên tường: side 'L' (x=-3, nhìn +x) hoặc 'R' (z=-3, nhìn +z)
export function onWall(obj, side, along, y, n = 6, d = n) {
  if (side === 'L') { obj.rotation.y = Math.PI / 2; obj.position.set(-n / 2 + 0.05, y, along); }
  else { obj.position.set(along, y, -d / 2 + 0.05); }
  return obj;
}
