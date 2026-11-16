// Mô hình ngoài sân cho thế giới mở: đảo, biển, nhà nhìn từ ngoài, cây, hộp thư, xích đu, quầy cà phê, bến thuyền.
// Dựa trên các hình trong _xuong-3d/map.js (cùng luật toon + viền), viết lại gọn để không kéo theo chars.js.
import { THREE, C, piece, rbox, sphere, rcyl, lathe, torus, mat } from "./xuong/lib.js";

const G = () => new THREE.Group();

// ---------- nền đảo + biển ----------
export function island(W, D, time) {
  const g = G(), night = time === "dem";
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(W + 60, D + 60), mat(night ? 0x34558F : C.sea));
  sea.rotation.x = -Math.PI / 2; sea.position.y = -0.42; sea.receiveShadow = true; g.add(sea);
  for (let i = 0; i < 10; i++) {
    const r = new THREE.Mesh(new THREE.TorusGeometry(0.5 + (i % 3) * 0.3, 0.03, 4, 30, Math.PI), mat(C.white, { basic: true, opacity: 0.45 }));
    r.rotation.x = -Math.PI / 2; r.position.set((i % 2 ? 1 : -1) * (W / 2 + 1.5 + (i % 4)), -0.38, -D / 2 + i * D / 10); g.add(r);
  }
  piece(rbox(W + 0.6, 0.5, D + 0.6, 0.25), C.earth, { pos: [0, -0.25, 0], parent: g, receive: true });
  const grass = piece(rbox(W + 0.4, 0.12, D + 0.4, 0.06), night ? 0x5E9E6A : C.grass, { pos: [0, -0.04, 0], parent: g, receive: true, cast: false });
  grass.traverse(o => { if (o.isMesh) o.receiveShadow = true; });
  // đốm cỏ cho đỡ phẳng
  for (let i = 0; i < 60; i++) {
    const x = ((i * 37) % 97) / 97 * W - W / 2, z = ((i * 61) % 89) / 89 * D - D / 2;
    piece(sphere(0.12, 8, 6).scale(1, 0.25, 1), C.grassD, { noOutline: true, pos: [x, 0.025, z], parent: g, cast: false });
  }
  // thuyền buộc cạnh bến (bến ở mép trước bên phải)
  const b = boat(); b.position.set(W / 2 - 5.2, -0.35, D / 2 + 1.4); b.rotation.y = Math.PI / 2; g.add(b);
  return g;
}

// ---------- nhà nhìn từ ngoài (7 m × 5 m), mặt trước ở z = +2.5 ----------
export function houseOutside(time) {
  const g = G(), night = time === "dem" || time === "chieu";
  const w = 6.6, d = 4.6, h = 2.9, fz = d / 2;
  piece(rbox(w + 0.3, 0.25, d + 0.3, 0.06), C.stoneD, { pos: [0, 0.12, 0], parent: g, receive: true });
  piece(rbox(w, h, d, 0.08), 0xFFF6EC, { pos: [0, 0.25 + h / 2, 0], parent: g });
  // mái hai dốc
  const roofCol = 0xFF8FB8, roofD = C.pinkD;
  for (const s of [-1, 1]) piece(rbox(w + 0.7, 0.18, d / 2 + 0.75, 0.06), roofCol, { pos: [0, 0.25 + h + 0.55, s * (d / 4 + 0.15)], rot: [s * 0.52, 0, 0], parent: g });
  piece(rbox(w + 0.8, 0.16, 0.24, 0.06), roofD, { pos: [0, 0.25 + h + 1.12, 0], parent: g });
  for (const sx of [-1, 1]) { // đầu hồi
    const tri = new THREE.Shape(); tri.moveTo(-d / 2, 0); tri.lineTo(d / 2, 0); tri.lineTo(0, 1.05); tri.lineTo(-d / 2, 0);
    piece(new THREE.ExtrudeGeometry(tri, { depth: 0.08, bevelEnabled: false }), 0xFFF6EC, { pos: [sx * (w / 2 - 0.04), 0.25 + h, 0], rot: [0, Math.PI / 2, 0], parent: g });
  }
  const ch = G(); ch.position.set(w / 2 - 1.2, 0.25 + h + 0.6, -0.6); g.add(ch);
  piece(rbox(0.5, 1.0, 0.5, 0.05), C.pink, { pos: [0, 0.5, 0], parent: ch }); piece(rbox(0.62, 0.14, 0.62, 0.04), C.pinkD, { pos: [0, 1.02, 0], parent: ch });
  // cửa chính
  const doorCol = 0x8FC9F2;
  piece(rbox(1.25, 2.2, 0.16, 0.04), C.white, { pos: [0, 0.25 + 1.1, fz + 0.04], parent: g });
  piece(rbox(1.0, 2.0, 0.1, 0.05), doorCol, { pos: [0, 0.25 + 1.0, fz + 0.1], parent: g });
  piece(rbox(0.7, 0.55, 0.05, 0.03), 0xD6EEFF, { pos: [0, 0.25 + 1.5, fz + 0.16], parent: g, noOutline: true });
  piece(sphere(0.06, 10, 8), C.butter, { pos: [0.36, 0.25 + 1.0, fz + 0.18], parent: g });
  // hiên + bậc
  piece(rbox(2.2, 0.14, 0.9, 0.05), C.wood, { pos: [0, 0.18, fz + 0.45], parent: g, receive: true });
  piece(rbox(1.0, 0.03, 0.5, 0.02), C.pinkL, { pos: [0, 0.27, fz + 0.5], parent: g, noOutline: true });
  piece(rbox(2.4, 0.12, 0.2, 0.06), 0x9CC7EC, { pos: [0, 0.25 + 2.35, fz + 0.35], parent: g });
  piece(sphere(0.12, 12, 10), night ? C.butter : C.white, { pos: [0.85, 0.25 + 2.05, fz + 0.2], parent: g, emissive: night ? C.butter : 0, ei: night ? 0.8 : 0 });
  // cửa sổ hai bên
  const glow = night ? 0xFFE29A : 0xCFEAFF;
  for (const sx of [-1, 1]) {
    const x = sx * 2.05, y = 0.25 + 1.55;
    piece(rbox(1.2, 1.05, 0.12, 0.05), C.white, { pos: [x, y, fz + 0.04], parent: g });
    piece(rbox(1.0, 0.85, 0.04, 0.02), glow, { pos: [x, y, fz + 0.1], parent: g, noOutline: true, emissive: night ? glow : 0, ei: night ? 0.6 : 0 });
    piece(rbox(0.07, 0.9, 0.06, 0.02), C.woodD, { pos: [x, y, fz + 0.13], parent: g, noOutline: true });
    piece(rbox(1.0, 0.07, 0.06, 0.02), C.woodD, { pos: [x, y, fz + 0.13], parent: g, noOutline: true });
    piece(rbox(1.3, 0.22, 0.3, 0.05), C.woodD, { pos: [x, y - 0.66, fz + 0.18], parent: g });
    for (let i = 0; i < 4; i++) piece(sphere(0.08, 8, 6), [C.pink, C.butter, C.pinkL, C.white][i], { pos: [x - 0.45 + i * 0.3, y - 0.48, fz + 0.2], parent: g });
  }
  return g;
}

// ---------- đồ ngoài sân (kích thước vừa dấu chân trong catalog.mjs) ----------
export function tree(blossom = false) {
  const g = G(), r = 0.62, col = blossom ? C.pinkL : C.leaf;
  piece(rcyl(0.12, 0.17, 1.1, 0.05, 12), C.woodD, { pos: [0, 0.55, 0], parent: g });
  [[0, 1.55, 0, r], [0.34, 1.3, 0.16, r * 0.72], [-0.32, 1.35, -0.08, r * 0.72], [0.06, 1.95, -0.16, r * 0.6]].forEach(([x, y, z, rr]) => piece(sphere(rr, 18, 12), col, { pos: [x, y, z], parent: g }));
  if (blossom) for (let i = 0; i < 8; i++) piece(sphere(0.06, 8, 6), C.white, { noOutline: true, pos: [Math.cos(i) * r * 0.75, 1.5 + Math.sin(i * 3) * 0.35, Math.sin(i) * r * 0.75], parent: g });
  return g;
}
export function bush() { const g = G(); piece(sphere(0.24, 14, 10).scale(1, 0.85, 1), C.leafL, { pos: [0, 0.2, 0], parent: g }); piece(sphere(0.15, 12, 8), C.leaf, { pos: [0.1, 0.32, 0.05], parent: g }); return g; }
export function flowers(colName) {
  const g = G(), col = C[colName] ?? C.pink;
  for (let i = 0; i < 6; i++) { const a = i * 1.05, rr = 0.1 + (i % 2) * 0.06; piece(rcyl(0.01, 0.01, 0.26, 0.004, 4), C.leafD, { noOutline: true, pos: [Math.cos(a) * rr, 0.13, Math.sin(a) * rr], parent: g }); piece(sphere(0.065, 10, 8), i === 5 ? C.white : col, { pos: [Math.cos(a) * rr, 0.28, Math.sin(a) * rr], parent: g }); }
  piece(sphere(0.18, 12, 8).scale(1, 0.4, 1), C.leaf, { pos: [0, 0.05, 0], parent: g, noOutline: true });
  return g;
}
export function lamp(on) {
  const g = G();
  piece(rcyl(0.05, 0.07, 1.6, 0.02, 10), C.white, { pos: [0, 0.8, 0], parent: g });
  piece(sphere(0.16, 14, 10), on ? C.butter : C.white, { pos: [0, 1.72, 0], parent: g, emissive: on ? C.butter : 0, ei: on ? 1 : 0 });
  piece(rcyl(0.12, 0.18, 0.08, 0.03, 12), C.sky, { pos: [0, 1.88, 0], parent: g });
  if (on) { const l = new THREE.PointLight(0xFFE29A, 1.4, 3.5, 1.6); l.position.set(0, 1.6, 0); g.add(l); }
  return g;
}
export function mailbox(open) {
  const g = G();
  piece(rbox(0.08, 0.9, 0.08, 0.03), C.woodD, { pos: [0, 0.45, 0], parent: g });
  piece(rbox(0.3, 0.3, 0.42, 0.12), C.sky, { pos: [0, 1.0, 0], parent: g });
  piece(rbox(0.04, open ? 0.3 : 0.06, open ? 0.06 : 0.22, 0.015), C.pink, { pos: [0.17, open ? 1.2 : 1.0, -0.05], parent: g });
  if (open) piece(rbox(0.2, 0.02, 0.14, 0.01), C.white, { pos: [0, 1.17, 0.22], rot: [0.4, 0, 0], parent: g });
  return g;
}
export function swing() {
  const g = G();
  for (const s of [-1, 1]) piece(rbox(0.1, 1.8, 0.1, 0.04), C.white, { pos: [s * 0.85, 0.9, 0], parent: g });
  piece(rbox(1.84, 0.1, 0.12, 0.04), C.white, { pos: [0, 1.8, 0], parent: g });
  for (const s of [-1, 1]) piece(rcyl(0.012, 0.012, 1.15, 0.005, 4), C.navy, { noOutline: true, pos: [s * 0.4, 1.2, 0], parent: g });
  piece(rbox(0.95, 0.08, 0.36, 0.04), C.pink, { pos: [0, 0.6, 0], parent: g });
  return g;
}
export function bench() {
  const g = G();
  piece(rbox(1.3, 0.08, 0.38, 0.04), C.wood, { pos: [0, 0.44, 0], parent: g });
  piece(rbox(1.3, 0.32, 0.07, 0.03), C.wood, { pos: [0, 0.68, -0.17], parent: g });
  for (const s of [-1, 1]) piece(rbox(0.08, 0.42, 0.34, 0.03), C.woodD, { pos: [s * 0.55, 0.21, 0], parent: g });
  return g;
}
export function kiosk() {
  const g = G();
  piece(rbox(1.8, 1.0, 0.8, 0.08), C.wood, { pos: [0, 0.5, 0], parent: g });
  piece(rbox(1.9, 0.08, 0.9, 0.03), C.white, { pos: [0, 1.04, 0], parent: g });
  for (const s of [-1, 1]) for (const z of [0.38, -0.38]) piece(rbox(0.08, 2.0, 0.08, 0.03), C.white, { pos: [s * 0.86, 1.0, z], parent: g });
  for (let i = 0; i < 6; i++) piece(rbox(0.32, 0.06, 1.1, 0.02), i % 2 ? C.white : C.sky, { pos: [-0.8 + i * 0.32, 2.05, 0.1], rot: [-0.22, 0, 0], parent: g });
  piece(rbox(0.7, 0.42, 0.05, 0.02), C.navy, { pos: [0.4, 1.45, -0.4], parent: g });
  piece(rcyl(0.17, 0.2, 0.46, 0.06, 16), 0xBFE3FA, { opacity: 0.6, pos: [-0.5, 1.31, 0], parent: g });
  // ly nước trên quầy
  piece(rcyl(0.06, 0.05, 0.16, 0.02, 12), 0xE8D2B8, { pos: [0.1, 1.16, 0.2], parent: g });
  piece(rcyl(0.065, 0.065, 0.025, 0.01, 12), C.pink, { pos: [0.1, 1.25, 0.2], parent: g });
  piece(rcyl(0.055, 0.05, 0.12, 0.02, 12), C.white, { pos: [0.35, 1.14, 0.22], parent: g });
  return g;
}
export function stone() {
  const g = G();
  piece(rcyl(0.38, 0.38, 0.05, 0.025, 18), C.stone, { pos: [-0.12, 0.025, -0.1], parent: g, cast: false, receive: true });
  piece(rcyl(0.24, 0.24, 0.05, 0.02, 14), C.stoneD, { pos: [0.3, 0.025, 0.28], parent: g, cast: false, receive: true });
  return g;
}
export function boat() {
  const g = G();
  piece(lathe([[0, -0.3], [0.45, -0.25], [0.6, 0.0], [0.62, 0.05], [0, 0.05]]).scale(1, 1, 2.1), C.white, { pos: [0, 0.3, 0], parent: g });
  piece(rbox(1.0, 0.06, 2.2, 0.03), C.sky, { pos: [0, 0.34, 0], parent: g, noOutline: true });
  piece(rbox(1.0, 0.08, 0.25, 0.03), C.wood, { pos: [0, 0.3, 0.2], parent: g });
  return g;
}
export function dock() { // 1,5 m × 3 m, nhô ra mép đảo
  const g = G(), len = 3;
  for (let i = 0; i < len / 0.4; i++) piece(rbox(1.3, 0.1, 0.36, 0.03), i % 2 ? C.wood : 0xE0BE92, { pos: [0, 0.05, -len / 2 + 0.2 + i * 0.4], parent: g, receive: true });
  for (const s of [-1, 1]) for (const z of [-len / 2 + 0.3, len / 2 - 0.15]) piece(rcyl(0.07, 0.07, 0.7, 0.03, 10), C.woodD, { pos: [s * 0.6, 0.0, z], parent: g });
  piece(rbox(0.2, 0.26, 0.2, 0.06), C.butter, { pos: [0.6, 0.48, len / 2 - 0.15], parent: g, emissive: C.butter, ei: 0.2 });
  return g;
}
export function sign() {
  const g = G();
  for (const s of [-1, 1]) piece(rbox(0.08, 0.8, 0.08, 0.03), C.woodD, { pos: [s * 0.55, 0.4, 0], parent: g });
  piece(rbox(1.3, 0.42, 0.08, 0.05), C.wood, { pos: [0, 0.78, 0], parent: g });
  piece(torus(0.1, 0.03, Math.PI * 2, 6, 16), C.pink, { pos: [0, 0.78, 0.06], parent: g, noOutline: true });
  return g;
}
// Thảm cửa trong nhà: đánh dấu lối ra sân ở mép trước phòng.
export function doorMat() {
  const g = G();
  piece(rbox(1.0, 0.04, 0.5, 0.02), C.sky, { pos: [0, 0.02, 0], parent: g, receive: true, cast: false });
  piece(rbox(0.8, 0.045, 0.32, 0.02), C.white, { pos: [0, 0.024, 0], parent: g, noOutline: true, cast: false });
  for (const s of [-1, 1]) piece(rbox(0.12, 0.05, 0.05, 0.01), C.sky, { pos: [s * 0.12, 0.03, 0.06], rot: [0, s * 0.7, 0], parent: g, noOutline: true });
  return g;
}
