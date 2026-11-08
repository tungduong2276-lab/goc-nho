// Đợt 2–3: bếp, phòng Anh, phòng Em, góc sáng tạo, gác kỷ niệm (mục 6 của brief).
// Mỗi phòng: nền 4 buổi (không có vật tương tác) + từng vật tương tác ở mọi trạng thái là lớp rời cùng khung.
import { THREE, C, piece, rbox, sphere, capsule, rcyl, lathe, torus, tube, leafGeo, makeScene, isoCamera, shoot, shadowCatcher, toPx } from './lib.js';
import * as F from './furn.js';

const G = () => new THREE.Group();
const at = (o, x, y, z, ry = 0) => { o.position.set(x, y, z); o.rotation.y = ry; return o; };
const SKY = { sang: 0xFFD6DE, ngay: 0xBFE3FA, chieu: 0xFFC2A0, dem: 0x2A3D6E };
const W = 1170, PPM = 112;

// ---------- đồ dùng chung ----------
function plantPot(col = C.white, kind = 'luoiho') {
  const g = F.pot(col, 0.2, 0.28, false);
  if (kind === 'luoiho') for (let i = 0; i < 6; i++) piece(leafGeo(0.5, 0.09, 0.03), i % 2 ? C.leaf : 0x4FB97A, { pos: [Math.cos(i) * 0.05, 0.27, Math.sin(i) * 0.05], rot: [-1.45 + (i % 3) * 0.08, i * 1.05, 0], parent: g });
  if (kind === 'monstera') for (let i = 0; i < 5; i++) piece(sphere(0.16, 14, 8).scale(1, 0.25, 1.3), C.leaf, { pos: [Math.cos(i * 1.3) * 0.15, 0.45 + (i % 2) * 0.12, Math.sin(i * 1.3) * 0.15], rot: [0.4, i * 1.3, 0], parent: g });
  if (kind === 'treo') for (let i = 0; i < 4; i++) { const s = i % 2 ? 1 : -1; piece(tube([[s * 0.1, 0.25, 0], [s * 0.2, 0.0, 0.05], [s * 0.18, -0.3 - i * 0.05, 0.08]], 0.012, 8, 4), C.leafD, { noOutline: true, parent: g }); piece(leafGeo(0.12, 0.08, 0.02), C.leaf, { pos: [s * 0.18, -0.25 - i * 0.05, 0.08], rot: [0.3, s, 0], parent: g }); }
  return g;
}
function wallTiles(g, n, d, h, col) { // gạch ô trắng-xanh
  for (let i = 0; i < n * 2; i++) for (let j = 0; j < 4; j++) if ((i + j) % 2) piece(new THREE.BoxGeometry(0.46, 0.46, 0.01), col, { noOutline: true, pos: [-n / 2 + 0.25 + i * 0.5, 0.95 + j * 0.5, -d / 2 + 0.006], parent: g, receive: true, cast: false });
  for (let i = 0; i < d * 2; i++) for (let j = 0; j < 4; j++) if ((i + j) % 2) piece(new THREE.BoxGeometry(0.01, 0.46, 0.46), col, { noOutline: true, pos: [-n / 2 + 0.006, 0.95 + j * 0.5, -d / 2 + 0.25 + i * 0.5], parent: g, receive: true, cast: false });
}
function checkerFloor(g, n, d, col) { for (let i = 0; i < n * 2; i++) for (let j = 0; j < d * 2; j++) if ((i + j) % 2) piece(new THREE.PlaneGeometry(0.5, 0.5), col, { noOutline: true, pos: [-n / 2 + 0.25 + i * 0.5, 0.034, -d / 2 + 0.25 + j * 0.5], rot: [-Math.PI / 2, 0, 0], parent: g, receive: true, cast: false }); }
function rugRound(r, c1, c2) { const g = G(); piece(rcyl(r, r, 0.04, 0.02, 40), c1, { pos: [0, 0.02, 0], parent: g, receive: true, cast: false }); if (c2) piece(rcyl(r * 0.7, r * 0.7, 0.045, 0.02, 40), c2, { noOutline: true, pos: [0, 0.025, 0], parent: g, receive: true, cast: false }); return g; }
function rugRect(w, d, c1, c2) { const g = G(); piece(rbox(w, 0.04, d, 0.02), c1, { pos: [0, 0.02, 0], parent: g, receive: true, cast: false }); if (c2) for (let i = 0; i < 4; i++) piece(new THREE.BoxGeometry(w * 0.9, 0.005, 0.06), c2, { noOutline: true, pos: [0, 0.042, -d / 2 + (i + 1) * d / 5], parent: g, cast: false }); return g; }
function windowBox(time, o = {}) { const w = F.windowW({ sky: SKY[time], stars: time === 'dem', moon: time === 'dem', cloud: time === 'ngay' || time === 'sang' }); if (o.checker) w.traverse(m => { }); return w; }
function curtainsChecker(win) { for (const s of [-1, 1]) { const c = G(); c.position.set(s * 0.67, 0.02, 0.1); win.add(c); for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) piece(new THREE.BoxGeometry(0.1, 0.3, 0.02), (i + j) % 2 ? C.pink : C.white, { noOutline: true, pos: [-0.05 + j * 0.1, 0.45 - i * 0.3, 0.04], parent: c }); } }
function bookStack(n = 4) { const g = G(); const cols = [C.sky, C.pink, C.leaf, C.butter, C.lilac]; for (let i = 0; i < n; i++) piece(rbox(0.36 - i * 0.02, 0.08, 0.26, 0.02, 1), cols[i % 5], { pos: [0, 0.04 + i * 0.085, 0], rot: [0, i * 0.2, 0], parent: g }); return g; }
function fairyLights(g, from, to, n = 9) { const pts = []; for (let i = 0; i <= n; i++) { const t = i / n, sag = Math.sin(t * Math.PI) * 0.25; pts.push([from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t - sag, from[2] + (to[2] - from[2]) * t]); }
  piece(tube(pts, 0.008, 40, 4), C.navy, { noOutline: true, parent: g, cast: false });
  pts.forEach((p, i) => { if (i % 1 === 0 && i > 0 && i < n) { const st = new THREE.OctahedronGeometry(0.045, 0); st.scale(1, 1.2, 0.5); piece(st, C.butter, { pos: [p[0], p[1] - 0.05, p[2]], parent: g, emissive: C.butter, ei: 0.8, noOutline: true, cast: false }); } }); }

// ---------- vật tương tác ----------
const OBJ = {
  // BẾP
  tulanh(st) { const g = G(); piece(rbox(0.9, 1.9, 0.75, 0.13), C.white, { pos: [0, 0.95, 0], parent: g });
    if (st === 'mo') { piece(rbox(0.8, 1.7, 0.05, 0.03), 0xEAF5FF, { noOutline: true, pos: [0, 0.98, 0.36], parent: g }); [0.5, 0.95, 1.4].forEach(y => piece(rbox(0.76, 0.03, 0.6, 0.01), C.sky2, { noOutline: true, pos: [0, y, 0.08], parent: g }));
      [[-0.2, 0.6, C.pink], [0.15, 0.62, C.butter], [-0.1, 1.05, C.leafL], [0.2, 1.08, C.white], [0, 1.5, C.orange]].forEach(([x, y, c]) => piece(rbox(0.2, 0.18, 0.2, 0.05), c, { pos: [x, y, 0.15], parent: g }));
      const door = G(); door.position.set(-0.45, 0, 0.38); door.rotation.y = -1.9; g.add(door); piece(rbox(0.9, 1.85, 0.08, 0.05), C.white, { pos: [0.45, 0.95, 0], parent: door }); }
    else { piece(rbox(0.04, 0.5, 0.05, 0.02), C.stoneD, { pos: [0.34, 1.25, 0.39], parent: g }); piece(rbox(0.86, 0.02, 0.02, 0.01), C.stone, { noOutline: true, pos: [0, 1.32, 0.38], parent: g });
      // nam châm + giấy nhớ
      [[-0.18, 1.62, C.butter, 0.1, C.pink], [0.12, 1.5, C.petal, -0.12, C.leaf], [-0.15, 0.95, C.sky2, -0.06, C.butter], [0.15, 0.78, 0xD8F3E2, 0.14, C.sky]].forEach(([x, y, c, r, mc]) => { piece(rbox(0.24, 0.24, 0.012, 0.006, 1), c, { pos: [x, y, 0.385], rot: [0, 0, r], parent: g }); piece(sphere(0.03, 10, 8).scale(1, 1, 0.6), mc, { pos: [x, y + 0.1, 0.4], parent: g }); }); }
    return g; },
  bepnau(st) { const g = G(); piece(rbox(1.0, 0.88, 0.7, 0.05), C.white, { pos: [0, 0.44, 0], parent: g }); piece(rbox(1.02, 0.06, 0.72, 0.02), C.stoneD, { pos: [0, 0.9, 0], parent: g });
    for (const x of [-0.25, 0.25]) piece(rcyl(0.14, 0.14, 0.02, 0.008, 20), C.navy, { pos: [x, 0.94, 0.05], parent: g, noOutline: true });
    piece(rbox(0.6, 0.3, 0.03, 0.02), C.navy, { noOutline: true, pos: [0, 0.45, 0.355], parent: g }); for (const x of [-0.3, -0.1, 0.1, 0.3]) piece(sphere(0.03, 8, 6), C.stoneD, { pos: [x, 0.75, 0.36], parent: g });
    const pot = G(); pot.position.set(-0.25, 0.95, 0.05); g.add(pot); piece(rcyl(0.17, 0.15, 0.2, 0.04, 22), C.pink, { pos: [0, 0.1, 0], parent: pot }); piece(rcyl(0.18, 0.18, 0.04, 0.02, 22), C.pinkD, { pos: [0, 0.22, 0], parent: pot }); piece(sphere(0.03, 8, 6), C.white, { pos: [0, 0.26, 0], parent: pot });
    if (st === 'nau') { piece(rcyl(0.14, 0.14, 0.025, 0.008, 20), C.orange, { pos: [-0.25, 0.945, 0.05], parent: g, emissive: C.orange, ei: 0.8, noOutline: true }); [[0, 0.42, 0.11], [0.08, 0.6, 0.09], [-0.05, 0.78, 0.08]].forEach(([x, y, r]) => piece(sphere(r, 14, 10), C.white, { pos: [x - 0.25, 0.95 + y, 0.05], parent: g, opacity: 0.85, cast: false })); }
    return g; },
  banan(st) { const g = G(); piece(rbox(1.2, 0.08, 0.8, 0.04), C.wood, { pos: [0, 0.72, 0], parent: g }); for (const x of [-0.5, 0.5]) for (const z of [-0.3, 0.3]) piece(rcyl(0.04, 0.04, 0.7, 0.015, 10), C.woodD, { pos: [x, 0.36, z], parent: g });
    for (const s of [-1, 1]) { const ch = G(); ch.position.set(s * 0.85, 0, 0); g.add(ch); piece(rbox(0.42, 0.06, 0.42, 0.03), C.pink, { pos: [0, 0.45, 0], parent: ch }); piece(rbox(0.06, 0.5, 0.42, 0.03), C.white, { pos: [s * 0.2, 0.7, 0], parent: ch }); for (const x of [-0.17, 0.17]) for (const z of [-0.17, 0.17]) piece(rcyl(0.025, 0.025, 0.45, 0.01, 8), C.woodD, { pos: [x, 0.22, z], parent: ch }); }
    if (st === 'baymon') { for (const s of [-1, 1]) { piece(rcyl(0.17, 0.12, 0.05, 0.02, 22), C.white, { pos: [s * 0.32, 0.79, 0], parent: g }); piece(sphere(0.11, 14, 8).scale(1, 0.5, 1), s > 0 ? C.butter : C.orange, { pos: [s * 0.32, 0.83, 0], parent: g }); } piece(rcyl(0.06, 0.05, 0.14, 0.02, 14), C.sky, { pos: [0, 0.83, 0.2], parent: g }); piece(sphere(0.06, 10, 8), C.pink, { pos: [0, 0.82, -0.15], parent: g }); }
    return g; },
  // PHÒNG ANH / EM
  giuong(st, o = {}) { const g = G(), col = o.col ?? C.sky;
    piece(rbox(1.2, 0.34, 2.0, 0.08), C.wood, { pos: [0, 0.22, 0], parent: g }); piece(rbox(1.14, 0.18, 1.9, 0.08), C.white, { pos: [0, 0.46, 0], parent: g });
    piece(rbox(1.24, 0.9, 0.14, 0.06), C.wood, { pos: [0, 0.6, -1.0], parent: g }); piece(rbox(0.62, 0.14, 0.36, 0.07), C.white, { pos: [0, 0.6, -0.68], parent: g });
    if (st === 'ngu') { piece(rbox(1.16, 0.26, 1.3, 0.12), col, { pos: [0, 0.6, 0.25], parent: g }); const h = sphere(0.2, 20, 14); piece(h, C.skin, { pos: [0, 0.7, -0.52], parent: g }); const hair = new THREE.SphereGeometry(0.215, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.55); piece(hair, o.hair ?? C.hairA, { pos: [0, 0.72, -0.56], rot: [-1.1, 0, 0], parent: g });
      for (const s of [-1, 1]) piece(torus(0.025, 0.007, Math.PI, 6, 10), C.navy, { noOutline: true, basic: true, pos: [s * 0.07, 0.76, -0.38], rot: [-0.7, 0, Math.PI], parent: g }); piece(sphere(0.03, 8, 6).scale(1.2, 0.6, 0.3), C.blush, { noOutline: true, basic: true, pos: [0.12, 0.72, -0.37], parent: g }); }
    else piece(rbox(1.16, 0.12, 1.2, 0.06), col, { pos: [0, 0.57, 0.32], parent: g });
    if (o.voan) piece(lathe([[0, 2.0], [0.12, 1.95], [0.62, 0.7], [0.66, 0.4], [0.64, 0.38], [0.11, 1.92], [0, 1.97]].reverse()), 0xFFF4F8, { opacity: 0.5, emissive: 0xFFF4F8, ei: 0.6, pos: [0, 0.0, -0.6], parent: g, cast: false, noOutline: true });
    return g; },
  banlamviec(st) { const g = G(); piece(rbox(1.3, 0.08, 0.65, 0.03), C.white, { pos: [0, 0.76, 0], parent: g }); for (const s of [-1, 1]) piece(rbox(0.06, 0.74, 0.6, 0.02), C.white, { pos: [s * 0.6, 0.38, 0], parent: g });
    piece(rbox(0.5, 0.03, 0.34, 0.01), C.stoneD, { pos: [0, 0.81, 0.08], parent: g }); const sc = G(); sc.position.set(0, 0.82, -0.09); sc.rotation.x = -0.3; g.add(sc);
    piece(rbox(0.5, 0.34, 0.03, 0.01), C.stoneD, { pos: [0, 0.17, 0], parent: sc }); piece(rbox(0.44, 0.28, 0.01, 0.005), st === 'sang' ? C.sky : C.navy, { noOutline: true, pos: [0, 0.17, 0.017], parent: sc, emissive: st === 'sang' ? C.sky : 0, ei: st === 'sang' ? 0.7 : 0 });
    if (st === 'sang') { piece(rbox(0.25, 0.02, 0.005, 0.003, 1), C.white, { noOutline: true, basic: true, pos: [-0.05, 0.22, 0.025], parent: sc }); piece(rbox(0.18, 0.02, 0.005, 0.003, 1), C.white, { noOutline: true, basic: true, pos: [-0.08, 0.17, 0.025], parent: sc }); }
    const lamp = G(); lamp.position.set(0.45, 0.8, -0.15); g.add(lamp); piece(rcyl(0.08, 0.09, 0.03, 0.01, 14), C.navy, { parent: lamp }); piece(tube([[0, 0, 0], [0, 0.25, 0], [0.1, 0.35, 0.05]], 0.012, 8, 4), C.navy, { parent: lamp }); piece(lathe([[0.03, 0.08], [0.1, 0], [0.09, -0.01], [0.02, 0.07]]), C.sky, { pos: [0.12, 0.33, 0.06], rot: [0, 0, -0.6], parent: lamp });
    piece(rcyl(0.2, 0.2, 0.06, 0.02, 18), C.sky, { pos: [0.1, 0.45, 0.6], parent: g }); piece(rbox(0.38, 0.4, 0.06, 0.04), C.sky, { pos: [0.1, 0.68, 0.78], parent: g }); piece(rcyl(0.03, 0.03, 0.42, 0.01, 8), C.navy, { pos: [0.1, 0.22, 0.6], parent: g });
    return g; },
  tudo(st, o = {}) { const g = G(), col = o.col ?? C.white; piece(rbox(1.1, 1.8, 0.6, 0.06), col, { pos: [0, 0.9, 0], parent: g });
    if (st === 'mo') { piece(rbox(1.0, 1.6, 0.04, 0.02), 0xF3F7FC, { noOutline: true, pos: [0, 0.92, 0.29], parent: g }); piece(rcyl(0.012, 0.012, 0.95, 0.005, 6), C.navy, { noOutline: true, pos: [0, 1.5, 0.15], rot: [0, 0, Math.PI / 2], parent: g });
      [C.sky, C.pink, C.butter, C.leafL, C.white].forEach((c, i) => piece(rbox(0.13, 0.55, 0.3, 0.04), c, { pos: [-0.36 + i * 0.18, 1.22, 0.12], parent: g }));
      for (const s of [-1, 1]) { const d = G(); d.position.set(s * 0.55, 0, 0.3); d.rotation.y = s * 1.9; g.add(d); piece(rbox(0.55, 1.75, 0.05, 0.03), col, { pos: [-s * 0.275, 0.9, 0], parent: d }); } }
    else { piece(rbox(0.015, 1.6, 0.02, 0.008), C.navy, { noOutline: true, pos: [0, 0.92, 0.31], parent: g }); for (const s of [-1, 1]) piece(sphere(0.035, 8, 6), C.butter, { pos: [s * 0.08, 0.95, 0.32], parent: g }); }
    return g; },
  kesuutap() { const g = G(); for (let i = 0; i < 2; i++) { piece(rbox(1.2, 0.06, 0.28, 0.02), C.wood, { pos: [0, i * 0.45, 0], parent: g }); for (let j = 0; j < 3; j++) { piece(rcyl(0.11, 0.11, 0.03, 0.01, 18), 0xE5EEF8, { noOutline: true, pos: [-0.38 + j * 0.38, i * 0.45 + 0.18, 0.02], rot: [Math.PI / 2, 0, 0], parent: g }); piece(rbox(0.1, 0.06, 0.1, 0.02), C.woodD, { pos: [-0.38 + j * 0.38, i * 0.45 + 0.06, 0.02], parent: g }); } } return g; },
  bantrangdiem() { const g = G(); piece(rbox(1.0, 0.07, 0.5, 0.03), C.white, { pos: [0, 0.72, 0], parent: g }); for (const x of [-0.42, 0.42]) for (const z of [-0.18, 0.18]) piece(rcyl(0.03, 0.025, 0.7, 0.01, 8), C.white, { pos: [x, 0.36, z], parent: g });
    piece(rbox(0.9, 0.12, 0.42, 0.03), C.petal, { pos: [0, 0.62, 0], parent: g }); const m = G(); m.position.set(0, 1.2, -0.18); g.add(m); piece(sphere(0.38, 26, 16).scale(1, 1.2, 0.08), C.pinkL, { parent: m }); piece(sphere(0.32, 26, 16).scale(1, 1.2, 0.05), 0xDCEEFB, { noOutline: true, pos: [0, 0, 0.02], parent: m, emissive: 0xDCEEFB, ei: 0.3 });
    [[-0.3, C.pink], [-0.18, C.lilac], [0.3, C.leafL]].forEach(([x, c]) => piece(rcyl(0.04, 0.04, 0.12, 0.015, 12), c, { pos: [x, 0.82, 0.08], parent: g }));
    piece(rcyl(0.2, 0.2, 0.08, 0.03, 18), C.pinkL, { pos: [0, 0.4, 0.55], parent: g }); return g; },
  kecay() { const g = G(); for (const s of [-1, 1]) piece(rbox(0.06, 1.6, 0.36, 0.02), C.white, { pos: [s * 0.62, 0.8, 0], parent: g }); for (let i = 0; i < 3; i++) piece(rbox(1.2, 0.05, 0.36, 0.02), C.white, { pos: [0, 0.3 + i * 0.55, 0], parent: g }); return g; },
  hopnhatky(st) { const g = G(); piece(rbox(0.5, 0.5, 0.42, 0.04), C.white, { pos: [0, 0.25, 0], parent: g }); const b = G(); b.position.set(0, 0.5, 0); g.add(b);
    piece(rbox(0.36, 0.08, 0.26, 0.03), C.pink, { pos: [0, 0.04, 0], parent: b }); piece(rbox(0.06, 0.09, 0.27, 0.01), C.butter, { noOutline: true, pos: [0.09, 0.045, 0], parent: b });
    if (st === 'mo') { const lid = G(); lid.position.set(0, 0.08, -0.13); lid.rotation.x = -1.3; b.add(lid); piece(rbox(0.36, 0.03, 0.26, 0.01), C.pinkD, { pos: [0, 0, 0.13], parent: lid }); piece(rbox(0.3, 0.03, 0.2, 0.01), C.white, { pos: [0, 0.09, 0], parent: b }); piece(sphere(0.06, 10, 8).scale(1, 0.6, 1), C.pink, { pos: [0.05, 0.12, 0.03], parent: b }); }
    else piece(sphere(0.035, 8, 6), C.butter, { pos: [0, 0.06, 0.14], parent: b });
    return g; },
  // GÓC SÁNG TẠO
  giave(st) { const g = G(); for (const s of [-1, 1]) piece(rbox(0.06, 1.7, 0.06, 0.02), C.woodD, { pos: [s * 0.36, 0.85, 0], rot: [0, 0, s * 0.12], parent: g }); piece(rbox(0.06, 1.5, 0.06, 0.02), C.woodD, { pos: [0, 0.75, -0.35], rot: [0.35, 0, 0], parent: g });
    piece(rbox(0.9, 0.06, 0.1, 0.02), C.wood, { pos: [0, 0.68, 0.05], parent: g }); piece(rbox(0.85, 0.65, 0.04, 0.02), C.white, { pos: [0, 1.05, 0.06], parent: g });
    if (st !== 'trang') { piece(sphere(0.15, 14, 8).scale(1.3, 1, 0.1), C.sky, { noOutline: true, pos: [-0.15, 1.15, 0.09], parent: g }); piece(sphere(0.1, 14, 8).scale(1, 1, 0.1), C.pink, { noOutline: true, pos: [0.15, 1.18, 0.09], parent: g }); }
    if (st === 'xong') { piece(sphere(0.12, 14, 8).scale(1.6, 0.6, 0.1), C.leaf, { noOutline: true, pos: [0.05, 0.85, 0.09], parent: g }); piece(sphere(0.06, 10, 8).scale(1, 1, 0.1), C.butter, { noOutline: true, pos: [0.28, 1.27, 0.09], parent: g }); }
    return g; },
  maydanhchu(st) { const g = G(); piece(rbox(1.0, 0.07, 0.6, 0.03), C.wood, { pos: [0, 0.72, 0], parent: g }); for (const x of [-0.42, 0.42]) for (const z of [-0.22, 0.22]) piece(rcyl(0.03, 0.03, 0.7, 0.01, 8), C.woodD, { pos: [x, 0.36, z], parent: g });
    piece(rbox(0.5, 0.18, 0.36, 0.06), C.sky, { pos: [0, 0.85, 0.05], parent: g }); for (let i = 0; i < 3; i++) for (let j = 0; j < 5; j++) piece(rcyl(0.02, 0.02, 0.02, 0.006, 8), C.white, { noOutline: true, pos: [-0.16 + j * 0.08, 0.95, 0.15 - i * 0.07], parent: g });
    piece(rcyl(0.04, 0.04, 0.55, 0.015, 12), C.navy, { pos: [0, 0.97, -0.1], rot: [0, 0, Math.PI / 2], parent: g });
    if (st === 'giay') piece(rbox(0.36, 0.42, 0.01, 0.005), C.white, { pos: [0, 1.17, -0.14], rot: [-0.25, 0, 0], parent: g });
    const bs = bookStack(3); bs.scale.setScalar(0.7); bs.position.set(0.35, 0.76, 0.1); g.add(bs);
    return g; },
  hopmau() { const g = G(); piece(rbox(0.8, 0.06, 0.5, 0.03), C.white, { pos: [0, 0.62, 0], parent: g }); for (const x of [-0.32, 0.32]) for (const z of [-0.18, 0.18]) piece(rcyl(0.025, 0.025, 0.6, 0.01, 8), C.white, { pos: [x, 0.3, z], parent: g });
    piece(rbox(0.4, 0.08, 0.26, 0.03), C.butter, { pos: [-0.1, 0.69, 0.02], parent: g }); [C.pink, C.sky, C.leaf, C.lilac, C.orange].forEach((c, i) => piece(rbox(0.06, 0.03, 0.18, 0.01), c, { noOutline: true, pos: [-0.24 + i * 0.07, 0.74, 0.02], parent: g }));
    const pal = sphere(0.14, 18, 10); pal.scale(1.2, 0.12, 1); piece(pal, C.wood, { pos: [0.22, 0.66, 0.1], parent: g }); [C.pink, C.sky, C.leaf].forEach((c, i) => piece(sphere(0.03, 8, 6).scale(1, 0.4, 1), c, { noOutline: true, pos: [0.15 + i * 0.07, 0.68, 0.06 + (i % 2) * 0.06], parent: g }));
    const cup = G(); cup.position.set(0.3, 0.65, -0.12); g.add(cup); piece(rcyl(0.06, 0.05, 0.16, 0.02, 14), C.pink, { pos: [0, 0.08, 0], parent: cup }); for (let i = 0; i < 3; i++) piece(rcyl(0.01, 0.01, 0.26, 0.004, 6), C.wood, { pos: [Math.cos(i * 2) * 0.02, 0.2, Math.sin(i * 2) * 0.02], rot: [0.15 * Math.cos(i), 0, 0.15 * Math.sin(i)], parent: cup });
    return g; },
  dayphoi() { const g = G(); for (const s of [-1, 1]) piece(sphere(0.04, 8, 6), C.woodD, { pos: [s * 1.25, 0, 0], parent: g }); const pts = []; for (let i = 0; i <= 20; i++) { const t = i / 20; pts.push([-1.25 + 2.5 * t, -Math.sin(t * Math.PI) * 0.12, 0]); } piece(tube(pts, 0.01, 40, 4), C.navy, { noOutline: true, parent: g });
    for (let i = 0; i < 5; i++) { const t = (i + 0.5) / 5; piece(rbox(0.035, 0.09, 0.04, 0.01), [C.pink, C.sky, C.butter, C.leaf, C.lilac][i], { pos: [-1.25 + 2.5 * t, -Math.sin(t * Math.PI) * 0.12, 0.02], parent: g }); }
    return g; },
  // GÁC KỶ NIỆM
  ruong(st) { const g = G(); piece(rbox(1.0, 0.5, 0.6, 0.08), C.woodD, { pos: [0, 0.25, 0], parent: g }); for (const x of [-0.35, 0.35]) piece(rbox(0.07, 0.52, 0.62, 0.02), C.butterD, { pos: [x, 0.25, 0], parent: g, noOutline: true });
    const lid = G(); lid.position.set(0, 0.5, -0.3); g.add(lid); if (st === 'mo') lid.rotation.x = -1.2; piece(rbox(1.02, 0.2, 0.62, 0.1), C.wood, { pos: [0, 0.1, 0.3], parent: lid });
    piece(rbox(0.14, 0.16, 0.05, 0.03), C.butter, { pos: [0, 0.45, 0.31], parent: g });
    if (st === 'mo') { piece(rbox(0.86, 0.06, 0.48, 0.03), C.butter, { pos: [0, 0.48, 0], parent: g, emissive: C.butter, ei: 0.9 }); [[-0.2, 0.55, 0.05], [0.15, 0.56, -0.08], [0.0, 0.58, 0.1]].forEach(p => piece(rcyl(0.08, 0.08, 0.03, 0.01, 16), C.butter, { pos: p, rot: [0.5, 0, 0.3], parent: g, emissive: C.butter, ei: 0.5 })); for (let i = 0; i < 4; i++) { const s = new THREE.OctahedronGeometry(0.05, 0); s.scale(1, 1.6, 0.4); piece(s, C.butter, { pos: [-0.3 + i * 0.2, 0.85 + (i % 2) * 0.15, 0.1], parent: g, emissive: C.butter, ei: 1, cast: false }); } }
    return g; },
  album(st) { const g = G(); piece(rcyl(0.3, 0.3, 0.06, 0.02, 20), C.wood, { pos: [0, 0.6, 0], parent: g }); piece(rcyl(0.05, 0.07, 0.58, 0.02, 10), C.woodD, { pos: [0, 0.3, 0], parent: g });
    if (st === 'mo') { for (const s of [-1, 1]) { piece(rbox(0.26, 0.04, 0.34, 0.015), C.white, { pos: [s * 0.13, 0.66, 0], rot: [0, 0, s * 0.08], parent: g }); piece(rbox(0.12, 0.012, 0.14, 0.005), [C.sky, C.pink][s > 0 ? 1 : 0], { noOutline: true, pos: [s * 0.13, 0.69, -0.05], rot: [0, 0, s * 0.08], parent: g }); } }
    else { piece(rbox(0.36, 0.1, 0.42, 0.03), C.pink, { pos: [0, 0.68, 0], parent: g }); const st2 = new THREE.OctahedronGeometry(0.06, 0); st2.scale(1, 0.3, 1); piece(st2, C.butter, { pos: [0, 0.74, 0], parent: g }); }
    return g; },
  tukinh() { const g = G(); piece(rbox(1.2, 1.7, 0.45, 0.05), C.white, { pos: [0, 0.85, 0], parent: g }); for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) piece(rbox(0.34, 0.42, 0.02, 0.01), 0xCFE8FA, { noOutline: true, opacity: 0.75, pos: [-0.38 + j * 0.38, 0.35 + i * 0.52, 0.23], parent: g, cast: false }); return g; },
  bandogioi() { const g = G(); piece(rbox(1.3, 0.85, 0.05, 0.03), C.wood, { parent: g }); piece(rbox(1.2, 0.75, 0.03, 0.01), C.sky2, { noOutline: true, pos: [0, 0, 0.02], parent: g });
    [[-0.35, 0.1, 0.22, 0.16], [0.05, 0.12, 0.2, 0.14], [0.35, -0.05, 0.18, 0.2], [-0.1, -0.2, 0.12, 0.1], [0.4, 0.22, 0.1, 0.07]].forEach(([x, y, w, h]) => piece(sphere(1, 12, 8).scale(w, h, 0.01), C.leafL, { noOutline: true, pos: [x, y, 0.04], parent: g })); return g; },
  hopthoigian(st) { const g = G(); piece(rbox(0.5, 0.4, 0.4, 0.06), C.sky, { pos: [0, 0.2, 0], parent: g });
    if (st === 'niemphong') { piece(rbox(0.52, 0.06, 0.42, 0.02), C.pink, { pos: [0, 0.2, 0], parent: g, noOutline: true }); piece(rcyl(0.08, 0.08, 0.03, 0.01, 16), C.pinkD, { pos: [0, 0.2, 0.215], rot: [Math.PI / 2, 0, 0], parent: g }); piece(rbox(0.52, 0.08, 0.42, 0.04), C.sky, { pos: [0, 0.42, 0], parent: g }); }
    else { const lid = G(); lid.position.set(0, 0.4, -0.2); lid.rotation.x = -1.4; g.add(lid); piece(rbox(0.52, 0.06, 0.42, 0.03), C.sky, { pos: [0, 0, 0.21], parent: lid }); for (let i = 0; i < 3; i++) piece(rbox(0.3, 0.02, 0.2, 0.01), [C.white, C.petal, C.butter][i], { pos: [0, 0.38 + i * 0.025, 0], rot: [0, i * 0.3, 0], parent: g }); }
    return g; },
  tudien(st) { const g = G(); piece(rbox(0.6, 0.06, 0.45, 0.02), C.woodD, { pos: [0, 0.9, 0], rot: [0.3, 0, 0], parent: g }); piece(rcyl(0.05, 0.08, 0.88, 0.02, 10), C.woodD, { pos: [0, 0.44, 0], parent: g }); piece(rcyl(0.22, 0.25, 0.05, 0.02, 16), C.woodD, { pos: [0, 0.02, 0], parent: g });
    const b = G(); b.position.set(0, 0.95, 0); b.rotation.x = 0.3; g.add(b);
    if (st === 'mo') { for (const s of [-1, 1]) piece(rbox(0.26, 0.04, 0.36, 0.015), C.white, { pos: [s * 0.13, 0.03, 0], rot: [0, 0, s * 0.1], parent: b }); piece(rbox(0.16, 0.01, 0.02, 0.003, 1), C.pink, { noOutline: true, pos: [-0.13, 0.055, -0.08], parent: b }); }
    else { piece(rbox(0.42, 0.14, 0.36, 0.03), C.pinkD, { pos: [0, 0.07, 0], parent: b }); piece(rbox(0.4, 0.1, 0.34, 0.01), C.white, { noOutline: true, pos: [0.01, 0.07, 0], parent: b }); piece(sphere(0.05, 10, 6).scale(1, 0.4, 1), C.butter, { pos: [0, 0.15, 0], parent: b }); }
    return g; }
};

// ---------- cấu hình từng phòng ----------
const ROOMS = {
  bep: { title: 'Bếp', n: 6, d: 6, shell: { wallL: C.white, wallR: C.white, floor: 0xF4F7FB, planks: false, base: C.woodD },
    deco(g, t) { wallTiles(g, 6, 6, 2.7, C.sky2); checkerFloor(g, 6, 6, C.sky2);
      const cnt = G(); for (let i = 0; i < 3; i++) { piece(rbox(0.95, 0.88, 0.7, 0.05), C.wood, { pos: [i * 0.95, 0.44, 0], parent: cnt }); piece(rbox(0.95, 0.06, 0.72, 0.02), C.white, { pos: [i * 0.95, 0.9, 0], parent: cnt }); piece(sphere(0.03, 8, 6), C.butter, { pos: [i * 0.95, 0.75, 0.36], parent: cnt }); }
      cnt.position.set(0.55, 0, -2.6); g.add(cnt);
      // đồ trang trí: ấm trà, lọ gia vị, thớt, giỏ rau
      piece(rcyl(0.12, 0.14, 0.2, 0.05, 18), C.sky, { pos: [1.45, 1.05, -2.6], parent: g }); piece(tube([[1.57, 1.05, -2.6], [1.66, 1.12, -2.6]], 0.02, 6, 4), C.sky, { parent: g });
      [0.3, 0.45, 0.6].forEach((x, i) => piece(rcyl(0.05, 0.05, 0.14, 0.02, 12), [C.pink, C.butter, C.leafL][i], { pos: [x, 1.0, -2.75], parent: g }));
      piece(rbox(0.45, 0.04, 0.3, 0.02), C.woodD, { pos: [2.3, 0.95, -2.55], parent: g }); const bk = G(); bk.position.set(2.6, 0, -1.4); g.add(bk); piece(rcyl(0.25, 0.2, 0.25, 0.06, 18), C.wood, { pos: [0, 0.13, 0], parent: bk }); [C.orange, C.leaf, C.pink].forEach((c, i) => piece(sphere(0.09, 12, 8), c, { pos: [-0.08 + i * 0.08, 0.3, (i % 2) * 0.06], parent: bk }));
      const w = windowBox(t); curtainsChecker(w); F.onWall(w, 'L', -0.4, 1.6); g.add(w);
      const rg = rugRect(1.6, 1.0, C.petal, C.pinkL); rg.position.set(0.6, 0, 1.1); g.add(rg); },
    items: { tulanh: { st: ['dong', 'mo'], place: o => at(o, -2.2, 0, -2.5), go: 'tu-lanh', label: 'Tủ lạnh nhắn nhủ' },
      bepnau: { st: ['tat', 'nau'], place: o => at(o, -1.0, 0, -2.6), go: 'cook', label: 'Bếp: nấu cho nhau' },
      banan: { st: ['trong', 'baymon'], place: o => at(o, 0.6, 0, 1.1), go: 'banan', label: 'Bàn ăn' } },
    spots: { dung: [[-0.9, 0, -0.9], [1.9, 0, 0.0]], ghe: [[-0.25, 0.42, 1.1], [1.45, 0.42, 1.1]] } },
  phong_anh: { title: 'Phòng Anh', n: 6, d: 6, shell: { wallL: C.sky2, wallR: C.sky2, floor: 0xEEF4FA, plank: 0xDCE6F2, base: C.stoneD },
    deco(g, t) { const w = windowBox(t); F.onWall(w, 'R', 0.6, 1.6); g.add(w);
      const ps = G(); piece(rbox(0.8, 1.0, 0.04, 0.02), C.navy, { parent: ps }); for (let i = 0; i < 9; i++) piece(sphere(0.025, 6, 4), C.butter, { noOutline: true, basic: true, pos: [-0.3 + (i * 0.27) % 0.6, 0.38 - (i * 0.19) % 0.76, 0.03], parent: ps }); piece(sphere(0.1, 14, 8).scale(1, 1, 0.2), C.butter, { noOutline: true, basic: true, pos: [0.18, 0.25, 0.03], parent: ps }); F.onWall(ps, 'L', -0.9, 1.65); g.add(ps);
      const lh = plantPot(C.white, 'luoiho'); lh.position.set(2.55, 0, -2.5); g.add(lh); const rg = rugRect(2.0, 1.4, C.sky, C.white); rg.position.set(0.2, 0, 0.9); g.add(rg); },
    items: { giuong: { st: ['gon', 'ngu'], build: s => OBJ.giuong(s, { col: C.sky, hair: C.hairA }), place: o => at(o, -2.25, 0, -1.6), go: 'ngu', label: 'Giường: đi ngủ' },
      banlamviec: { st: ['tat', 'sang'], place: o => at(o, 1.9, 0, -2.6), go: 'ban', label: 'Bàn làm việc: đang bận' },
      tudo: { st: ['dong', 'mo'], place: o => at(o, -0.75, 0, -2.65), go: 'phoido', label: 'Tủ đồ: phối đồ' },
      kesuutap: { st: ['trong'], wall: 'L', place: o => (OBJ && o), go: 'vuong-quoc', label: 'Kệ huy hiệu' } },
    wall: { kesuutap: ['L', 1.4, 1.25] },
    spots: { dung: [[0.3, 0, 0.6], [1.6, 0, 1.4]] } },
  phong_em: { title: 'Phòng Em', n: 6, d: 6, shell: { wallL: C.petal, wallR: C.petal, floor: C.wood },
    deco(g, t) { const w = windowBox(t); F.onWall(w, 'R', -0.4, 1.6); g.add(w); const hp = plantPot(C.white, 'treo'); hp.position.set(0.55, 2.05, -2.8); hp.scale.setScalar(0.8); g.add(hp);
      fairyLights(g, [-2.9, 2.45, -2.9], [-2.9, 2.35, 2.6]); fairyLights(g, [-2.9, 2.45, -2.9], [2.7, 2.35, -2.9], 11);
      const rg = rugRound(1.0, C.white, C.pinkL); rg.position.set(0.4, 0, 0.8); g.add(rg);
      const bear = G(); piece(sphere(0.26, 16, 12), C.wood, { pos: [0, 0.26, 0], parent: bear }); piece(sphere(0.2, 16, 12), C.wood, { pos: [0, 0.62, 0.02], parent: bear }); for (const s of [-1, 1]) { piece(sphere(0.08, 10, 8), C.wood, { pos: [s * 0.15, 0.8, 0], parent: bear }); piece(sphere(0.08, 10, 8), C.wood, { pos: [s * 0.2, 0.3, 0.16], parent: bear }); } piece(sphere(0.07, 10, 8), C.white, { pos: [0, 0.6, 0.2], parent: bear }); for (const s of [-1, 1]) piece(sphere(0.022, 6, 4), C.navy, { noOutline: true, pos: [s * 0.07, 0.68, 0.19], parent: bear }); piece(torus(0.13, 0.03, Math.PI * 2, 6, 16), C.pink, { pos: [0, 0.47, 0.02], rot: [Math.PI / 2, 0, 0], parent: bear }); bear.position.set(1.9, 0, 1.6); bear.rotation.y = -0.4; g.add(bear);
      const mn = plantPot(C.pink, 'monstera'); mn.position.set(2.6, 0, -2.5); g.add(mn); },
    items: { giuong: { st: ['gon', 'ngu'], build: s => OBJ.giuong(s, { col: C.pink, hair: C.hairE, voan: true }), place: o => at(o, -2.25, 0, -1.7), go: 'ngu', label: 'Giường màn voan: đi ngủ' },
      bantrangdiem: { st: ['thuong'], place: o => at(o, 0.9, 0, -2.65), go: 'phoido', label: 'Bàn trang điểm: phối đồ' },
      kecay: { st: ['trong'], place: o => at(o, -2.62, 0, 1.25, Math.PI / 2), go: 'khu-vuon', label: 'Kệ cây' },
      hopnhatky: { st: ['dong', 'mo'], place: o => at(o, -1.25, 0, -2.6), go: 'nhat-ky', label: 'Hộp nhật ký' } },
    spots: { dung: [[0.3, 0, 0.4], [1.2, 0, 1.3]], kecay: [[-2.62, 0.33, 1.65], [-2.62, 0.33, 1.25], [-2.62, 0.33, 0.85], [-2.62, 0.88, 1.65], [-2.62, 0.88, 1.25], [-2.62, 0.88, 0.85]] } },
  sang_tao: { title: 'Góc sáng tạo', n: 6, d: 6, shell: { wallL: 0xFFF3C9, wallR: 0xFFF3C9, floor: C.wood },
    deco(g, t) { const w = windowBox(t); F.onWall(w, 'R', -1.6, 1.6); g.add(w);
      [[0.8, 0.5, 0.4, 0.3], [1.5, 0.3, -0.3, -0.5], [-0.5, 1.6, 0.9, 0.2], [2.1, 1.4, 0.2, 0.9]].forEach(([x, z, r, r2]) => piece(rbox(0.3, 0.008, 0.38, 0.004, 1), C.white, { pos: [x, 0.04, z], rot: [0, r, 0], parent: g, cast: false }));
      const rg = rugRound(1.2, C.butter, C.white); rg.position.set(0.3, 0, 0.5); g.add(rg); const cu = F.cushion(C.sky); cu.position.set(-0.6, 0, 1.6); g.add(cu); },
    items: { giave: { st: ['trang', 'do', 'xong'], place: o => at(o, -1.7, 0, 0.3, Math.PI / 2 - 0.5), go: 've', label: 'Giá vẽ: vẽ tiếp sức' },
      maydanhchu: { st: ['khong', 'giay'], place: o => at(o, 1.7, 0, -2.55), go: 'truyen', label: 'Máy đánh chữ: truyện tiếp sức' },
      hopmau: { st: ['thuong'], place: o => at(o, 0.3, 0, -2.6), go: 've', label: 'Hộp màu' },
      dayphoi: { st: ['trong'], go: 've', label: 'Dây phơi tranh' } },
    wall: { dayphoi: ['L', 0.2, 2.05] },
    spots: { dung: [[-0.5, 0, 0.9], [1.3, 0, -0.5]], tranh: [-0.8, -0.3, 0.2, 0.7, 1.2] } },
  gac: { title: 'Gác kỷ niệm', n: 6, d: 4, shell: { wallL: 0xF3DDBF, wallR: 0xF3DDBF, floor: C.woodD, plank: C.woodDD, base: C.woodDD, skirt: C.woodDD },
    deco(g, t) { // mái chéo gỗ + cửa sổ tròn + nắng xiên lấp lánh
      for (let i = 0; i < 6; i++) piece(rbox(0.1, 2.6, 0.05, 0.02), C.woodD, { noOutline: true, pos: [-2.5 + i, 1.35, -1.97], parent: g }); for (let i = 0; i < 4; i++) piece(rbox(0.05, 2.6, 0.1, 0.02), C.woodD, { noOutline: true, pos: [-2.97, 1.35, -1.5 + i], parent: g });
      const win = G(); piece(torus(0.38, 0.07, Math.PI * 2, 10, 32), C.white, { parent: win }); piece(rcyl(0.34, 0.34, 0.03, 0.01, 30), SKY[t], { rot: [Math.PI / 2, 0, 0], parent: win, noOutline: true, basic: true }); piece(rbox(0.04, 0.7, 0.04, 0.01), C.white, { pos: [0, 0, 0.03], parent: win }); piece(rbox(0.7, 0.04, 0.04, 0.01), C.white, { pos: [0, 0, 0.03], parent: win }); F.onWall(win, 'R', -0.2, 1.75, 6, 4); g.add(win);
      if (t !== 'dem') { const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.9, 3.0, 24, 1, true), new THREE.MeshBasicMaterial({ color: 0xFFF1C4, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false })); beam.position.set(0.2, 1.05, -0.6); beam.rotation.set(0.85, 0, 0.25); g.add(beam);
        for (let i = 0; i < 8; i++) { const s = new THREE.OctahedronGeometry(0.02, 0); piece(s, C.white, { noOutline: true, basic: true, pos: [0.0 + (i % 4) * 0.2, 0.6 + (i * 0.17) % 1.2, -0.8 + (i % 3) * 0.3], parent: g, cast: false }); } }
      const arm = G(); piece(rbox(0.85, 0.42, 0.8, 0.15), C.pinkL, { pos: [0, 0.32, 0], parent: arm }); piece(rbox(0.85, 0.65, 0.22, 0.12), C.pinkL, { pos: [0, 0.65, -0.3], parent: arm }); for (const s of [-1, 1]) piece(rbox(0.18, 0.5, 0.8, 0.09), 0xFF9DC2, { pos: [s * 0.42, 0.45, 0], parent: arm }); arm.position.set(-2.3, 0, 0.6); arm.rotation.y = Math.PI / 2 - 0.3; g.add(arm);
      const lamp = G(); piece(rcyl(0.12, 0.14, 0.12, 0.04, 14), C.butterD, { pos: [0, 0.06, 0], parent: lamp }); piece(sphere(0.11, 14, 10).scale(1, 1.3, 1), 0xFFF1C4, { pos: [0, 0.22, 0], parent: lamp, emissive: C.butter, ei: t === 'dem' ? 1 : 0.3, opacity: 0.85 }); lamp.position.set(2.5, 0, 1.5); g.add(lamp);
      const bs = bookStack(5); bs.position.set(-1.3, 0, 1.6); g.add(bs);
      const vase = G(); piece(lathe([[0, 0], [0.1, 0], [0.13, 0.15], [0.06, 0.3], [0.08, 0.34], [0, 0.34]]), C.sky, { parent: vase }); for (let i = 0; i < 5; i++) { piece(tube([[0, 0.3, 0], [Math.cos(i) * 0.08, 0.5, Math.sin(i) * 0.08], [Math.cos(i) * 0.14, 0.62, Math.sin(i) * 0.14]], 0.008, 8, 4), 0xB59A6B, { noOutline: true, parent: vase }); piece(sphere(0.035, 8, 6).scale(1, 1.6, 1), 0xC9B6F2, { pos: [Math.cos(i) * 0.14, 0.66, Math.sin(i) * 0.14], parent: vase }); } vase.position.set(2.0, 0, -1.6); g.add(vase); },
    items: { ruong: { st: ['khoa', 'mo'], place: o => at(o, 1.3, 0, 1.2), go: 'kho-bau', label: 'Rương kho báu' },
      album: { st: ['dong', 'mo'], place: o => at(o, -1.4, 0, 0.0), go: 'nhat-ky', label: 'Album kỷ niệm hẹn hò' },
      tukinh: { st: ['trong'], place: o => at(o, -2.4, 0, -1.25, Math.PI / 2), go: 'bao-tang', label: 'Tủ trưng bày: bảo tàng' },
      bandogioi: { st: ['trong'], go: 'ban-do', label: 'Bản đồ ghim tường' },
      hopthoigian: { st: ['niemphong', 'damo'], place: o => at(o, 2.4, 0, -1.4), go: 'thu', label: 'Hộp thời gian: thư hẹn giờ' },
      tudien: { st: ['dong', 'mo'], place: o => at(o, 0.3, 0, -1.25), go: 'tu-dien', label: 'Từ điển tình yêu' } },
    wall: { bandogioi: ['R', 1.6, 1.45] },
    spots: { dung: [[-0.2, 0, 1.3], [1.4, 0, 0.0]] } }
};

function build(room, time) {
  const R = ROOMS[room], s = makeScene(time, { shadowSize: 6, shadowRes: 2048, shadowBlur: 5 });
  const shell = F.roomShell(Object.assign({ n: R.n, d: R.d, h: 2.7 }, R.shell)); s.add(shell);
  const deco = G(); R.deco(deco, time); s.add(deco);
  const items = {};
  for (const [k, it] of Object.entries(R.items)) {
    items[k] = {};
    for (const st of it.st) {
      const o = it.build ? it.build(st) : OBJ[k](st);
      if (R.wall && R.wall[k]) { const [side, along, y] = R.wall[k]; F.onWall(o, side, along, y, R.n, R.d); } else it.place(o);
      o.visible = false; s.add(o); items[k][st] = o;
    }
  }
  s.userData = Object.assign(s.userData, { shell, deco, items });
  return s;
}
const cam = room => { const R = ROOMS[room]; return isoCamera(W, W, PPM, [(R.n - 6) / 2 * 0.0, 1.05, (R.d - 6) / 2 * 0.5]); };
function catchers(R) {
  const f = shadowCatcher(R.n - 0.4, R.d - 0.4, 0.035); f.position.x = 0.2; f.position.z = 0.2;
  const l = shadowCatcher(R.d - 0.4, 2.2, 0, 0.14); l.rotation.set(0, Math.PI / 2, 0); l.position.set(-R.n / 2 + 0.01, 1.5, 0.2);
  const r = shadowCatcher(R.n - 0.4, 2.2, 0, 0.14); r.position.set(0.2, 1.5, -R.d / 2 + 0.01);
  return [f, l, r];
}
export const ROOM_IDS = Object.keys(ROOMS);
export function roomJobs(room) {
  const R = ROOMS[room];
  return async () => {
    const out = [];
    for (const t of ['sang', 'ngay', 'chieu', 'dem']) { const s = build(room, t); out.push({ file: `${room}_${t}@3x.png`, data: shoot(s, cam(room)) }); }
    const s = build(room, 'ngay'), c = cam(room);
    s.userData.shell.visible = false; s.userData.deco.visible = false; const cs = catchers(R); cs.forEach(x => s.add(x));
    const layers = {};
    for (const [k, sts] of Object.entries(s.userData.items)) for (const [st, o] of Object.entries(sts)) {
      o.visible = true; out.push({ file: `${room}_${k}_${st}@3x.png`, data: shoot(s, c) }); o.visible = false; layers[k] = layers[k] || [];
      layers[k].push(st);
    }
    const spots = {}; for (const [k, v] of Object.entries(R.spots || {})) spots[k] = Array.isArray(v[0]) ? v.map(p => toPx(c, ...p)) : v;
    if (room === 'sang_tao') { // 5 kẹp trên dây phơi, mặt phẳng tường trái
      spots.tranh = R.spots.tranh.map((z, i) => { const t = (i + 0.5) / 5; return toPx(c, -2.95, 2.05 - Math.sin(t * Math.PI) * 0.12 - 0.05, -1.25 + 2.5 * t + 0.2); });
      spots.tranhEx = [toPx(c, -2.95, 0, 0), toPx(c, -2.95, 0, 1), toPx(c, -2.95, 1, 0)];
    }
    out.push({ file: `${room}_meta`, meta: { title: R.title, ppm: PPM, size: [W, W], items: Object.fromEntries(Object.entries(R.items).map(([k, it]) => [k, { st: it.st, go: it.go, label: it.label }])), spots } });
    return out;
  };
}
export const jobs = Object.fromEntries(ROOM_IDS.map(r => [r, roomJobs(r)]));

// Dùng lại trong bản thử nhà 3D trực tiếp (nha3d/). Chỉ thêm export, không đổi hình đã dựng.
export { OBJ, plantPot, rugRound, rugRect, bookStack };
