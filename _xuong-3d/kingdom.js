// Đảo vương quốc 3D — mục 10 của brief. Lưới 8 × 8 ô, 17 công trình × (đang xây, cấp 1, cấp 2).
import { THREE, C, piece, rbox, sphere, capsule, rcyl, lathe, torus, tube, leafGeo, makeScene, isoCamera, shoot, shadowCatcher, toPx, mat } from './lib.js';
const G = () => new THREE.Group();
const at = (o, x, y, z, ry = 0) => { o.position.set(x, y, z); o.rotation.y = ry; return o; };
export const KG = { n: 8, ppm: 88, w: 1170, h: 1060, target: [4, -0.2, 4], shift: [0, 10] };
const SP = { w: 240, h: 300, ax: 120, ay: 236 }; // khung công trình, neo = tâm ô
const SPB = { w: 340, h: 400, ax: 170, ay: 320 }; // công trình lớn (rạp, lâu đài)

// ---------- công trình ----------
function roof(w, d, h, col) { const g = G(); for (const s of [-1, 1]) piece(rbox(w + 0.08, 0.07, Math.hypot(d / 2, h) + 0.08, 0.03), col, { pos: [0, h / 2, s * d / 4], rot: [s * Math.atan2(h, d / 2), 0, 0], parent: g }); const gb = new THREE.Shape(); gb.moveTo(-d / 2, 0); gb.lineTo(d / 2, 0); gb.lineTo(0, h); gb.lineTo(-d / 2, 0); for (const s of [-1, 1]) piece(new THREE.ExtrudeGeometry(gb, { depth: 0.02, bevelEnabled: false }), C.white, { pos: [s * w / 2 - (s > 0 ? 0.02 : 0), 0, 0], rot: [0, Math.PI / 2, 0], parent: g, noOutline: true }); return g; }
function win(g, x, y, z, ry = 0, lit) { const w = G(); w.position.set(x, y, z); w.rotation.y = ry; g.add(w); piece(rbox(0.16, 0.18, 0.03, 0.01), lit ? C.butter : 0xBFE3FA, { parent: w, emissive: lit ? C.butter : 0, ei: lit ? 1 : 0 }); }
function treeBall(g, x, z, r, col = C.leaf, h = 0.35) { piece(rcyl(0.04, 0.06, h, 0.02, 8), C.woodD, { pos: [x, h / 2, z], parent: g }); piece(sphere(r, 14, 10), col, { pos: [x, h + r * 0.7, z], parent: g }); }
function flowersRow(g, x, z, n, cols) { for (let i = 0; i < n; i++) { piece(sphere(0.05, 8, 6), cols[i % cols.length], { pos: [x + (i % 3) * 0.12 - 0.12, 0.13, z + Math.floor(i / 3) * 0.12], parent: g }); piece(sphere(0.06, 8, 6).scale(1, 0.6, 1), C.leaf, { noOutline: true, pos: [x + (i % 3) * 0.12 - 0.12, 0.07, z + Math.floor(i / 3) * 0.12], parent: g }); } }

const B = {
  cay(lv) { const g = G(); if (lv === 1) treeBall(g, 0, 0, 0.32, C.leaf, 0.35); else { treeBall(g, -0.12, -0.1, 0.32, C.leaf, 0.4); treeBall(g, 0.2, 0.15, 0.24, C.pinkL, 0.3); piece(sphere(0.18, 12, 8), C.leafL, { pos: [0.22, 0.12, -0.25], parent: g }); } return g; },
  den(lv, lit) { const g = G(); const n = lv === 1 ? 1 : 2; for (let i = 0; i < n; i++) { const x = n === 1 ? 0 : (i ? 0.22 : -0.22); piece(rcyl(0.035, 0.05, 0.8, 0.015, 10), C.white, { pos: [x, 0.4, 0], parent: g }); piece(rbox(0.16, 0.2, 0.16, 0.05), lit ? C.butter : 0xFFF1C4, { pos: [x, 0.88, 0], parent: g, emissive: lit ? C.butter : 0, ei: lit ? 1 : 0 }); piece(new THREE.ConeGeometry(0.13, 0.1, 4), C.navy, { pos: [x, 1.03, 0], rot: [0, Math.PI / 4, 0], parent: g }); } if (lv === 2) flowersRow(g, 0, 0.25, 3, [C.pink, C.white]); return g; },
  vuon(lv) { const g = G(); piece(rbox(0.8, 0.12, 0.8, 0.04), C.earth, { pos: [0, 0.06, 0], parent: g }); flowersRow(g, -0.05, -0.25, lv === 1 ? 6 : 9, [C.pink, C.butter, C.lilac, C.white]); for (let i = 0; i < 6; i++) piece(rbox(0.04, 0.2, 0.04, 0.01), C.white, { pos: [-0.38 + i * 0.152, 0.1, 0.4], parent: g }); if (lv === 2) { const arch = G(); arch.position.set(0, 0, -0.42); g.add(arch); piece(torus(0.28, 0.035, Math.PI, 8, 20), C.white, { pos: [0, 0.3, 0], parent: arch }); for (let i = 0; i < 5; i++) piece(sphere(0.05, 8, 6), C.pink, { pos: [Math.cos(i / 4 * Math.PI) * 0.28, 0.3 + Math.sin(i / 4 * Math.PI) * 0.28, 0], parent: arch }); } return g; },
  ruong(lv) { const g = G(); piece(rbox(0.85, 0.08, 0.85, 0.03), 0x9ED7E8, { pos: [0, 0.04, 0], parent: g }); const col = lv === 1 ? C.leafL : C.butter; for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) piece(rcyl(0.025, 0.04, lv === 1 ? 0.16 : 0.24, 0.01, 6), col, { pos: [-0.3 + i * 0.2, lv === 1 ? 0.12 : 0.16, -0.3 + j * 0.2], parent: g }); if (lv === 2) { piece(rcyl(0.03, 0.03, 0.5, 0.01, 6), C.woodD, { pos: [0.3, 0.25, 0.3], parent: g }); piece(new THREE.ConeGeometry(0.18, 0.12, 14), 0xF2D48A, { pos: [0.3, 0.55, 0.3], parent: g }); } return g; },
  nha(lv, lit) { const g = G(), roofC = lv === 1 ? C.sky : C.pink; piece(rbox(0.6, 0.45, 0.55, 0.05), C.white, { pos: [0, 0.23, 0], parent: g }); const r = roof(0.6, 0.6, 0.32, roofC); r.position.y = 0.45; g.add(r); piece(rbox(0.14, 0.24, 0.03, 0.02), C.woodD, { pos: [0.1, 0.12, 0.28], parent: g }); win(g, -0.15, 0.27, 0.28, 0, lit); win(g, 0.31, 0.27, 0.0, Math.PI / 2, lit);
    if (lv === 2) { piece(rbox(0.5, 0.35, 0.45, 0.05), C.white, { pos: [0, 0.62, -0.02], parent: g }); const r2 = roof(0.5, 0.5, 0.28, roofC); r2.position.y = 0.8; g.add(r2); r.visible = false; win(g, 0.0, 0.62, 0.21, 0, lit); piece(rbox(0.12, 0.22, 0.12, 0.03), C.pinkD, { pos: [0.17, 0.98, -0.1], parent: g }); flowersRow(g, -0.25, 0.36, 3, [C.pink, C.butter]); } return g; },
  ho(lv) { const g = G(); piece(rcyl(0.42, 0.44, 0.1, 0.04, 30), C.stone, { pos: [0, 0.05, 0], parent: g }); piece(rcyl(0.36, 0.36, 0.02, 0.01, 30), C.sky, { pos: [0, 0.1, 0], parent: g, noOutline: true }); [[0.15, -0.1], [-0.12, 0.15]].forEach(([x, z]) => piece(rcyl(0.08, 0.08, 0.02, 0.01, 14), C.leaf, { pos: [x, 0.115, z], parent: g })); piece(sphere(0.05, 10, 8), C.pink, { pos: [0.15, 0.15, -0.1], parent: g });
    if (lv === 2) { piece(sphere(0.06, 10, 8).scale(1.6, 0.8, 0.6), C.orange, { pos: [-0.1, 0.25, -0.05], rot: [0, 0, 0.6], parent: g }); piece(new THREE.ConeGeometry(0.04, 0.08, 6), C.orange, { pos: [-0.2, 0.31, -0.05], rot: [0, 0, 1.4], parent: g }); for (let i = 0; i < 4; i++) piece(sphere(0.06, 8, 6), C.stoneD, { pos: [Math.cos(i * 1.6) * 0.42, 0.12, Math.sin(i * 1.6) * 0.42], parent: g }); } return g; },
  tra(lv, lit) { const g = G(); piece(rbox(0.6, 0.5, 0.5, 0.05), C.petal, { pos: [0, 0.25, -0.05], parent: g }); for (let i = 0; i < 5; i++) piece(rbox(0.13, 0.04, 0.3, 0.015), i % 2 ? C.white : C.pink, { pos: [-0.26 + i * 0.13, 0.5, 0.24], rot: [-0.3, 0, 0], parent: g }); piece(rbox(0.2, 0.28, 0.03, 0.02), C.woodD, { pos: [-0.12, 0.14, 0.21], parent: g }); win(g, 0.15, 0.28, 0.21, 0, lit); piece(rcyl(0.06, 0.05, 0.14, 0.02, 12), 0xE8D2B8, { pos: [0, 0.6, -0.05], parent: g }); piece(rcyl(0.065, 0.065, 0.03, 0.01, 12), C.pink, { pos: [0, 0.68, -0.05], parent: g });
    if (lv === 2) { piece(rcyl(0.15, 0.15, 0.03, 0.01, 16), C.white, { pos: [0.25, 0.3, 0.42], parent: g }); piece(rcyl(0.02, 0.02, 0.3, 0.01, 6), C.white, { pos: [0.25, 0.15, 0.42], parent: g }); piece(new THREE.ConeGeometry(0.25, 0.12, 12), C.sky, { pos: [0.25, 0.62, 0.42], parent: g }); piece(rcyl(0.01, 0.01, 0.35, 0.004, 6), C.white, { pos: [0.25, 0.47, 0.42], parent: g }); } return g; },
  banh(lv, lit) { const g = G(); piece(rbox(0.6, 0.5, 0.5, 0.05), 0xFFF1D6, { pos: [0, 0.25, -0.05], parent: g }); for (let i = 0; i < 5; i++) piece(rbox(0.13, 0.04, 0.3, 0.015), i % 2 ? C.white : C.butter, { pos: [-0.26 + i * 0.13, 0.5, 0.24], rot: [-0.3, 0, 0], parent: g }); piece(rbox(0.2, 0.28, 0.03, 0.02), C.woodD, { pos: [0.12, 0.14, 0.21], parent: g }); win(g, -0.15, 0.28, 0.21, 0, lit); piece(rcyl(0.07, 0.07, 0.25, 0.02, 12), C.stoneD, { pos: [-0.18, 0.62, -0.15], parent: g });
    const cake = G(); cake.position.set(0.15, 0.52, -0.1); g.add(cake); piece(rcyl(0.1, 0.1, 0.08, 0.03, 16), C.petal, { parent: cake }); piece(sphere(0.03, 8, 6), C.pinkD, { pos: [0, 0.06, 0], parent: cake });
    if (lv === 2) [[-0.18, 0.78], [-0.13, 0.92], [-0.2, 1.05]].forEach(([x, y], i) => piece(sphere(0.06 + i * 0.02, 10, 8), C.white, { pos: [x, y, -0.15], parent: g, opacity: 0.9, cast: false })); return g; },
  cho(lv) { const g = G(); const n = lv === 1 ? 2 : 3, cols = [C.pink, C.sky, C.butter]; for (let i = 0; i < n; i++) { const s = G(); const x = n === 2 ? (i ? 0.2 : -0.2) : -0.27 + i * 0.27, z = i % 2 ? 0.15 : -0.12; s.position.set(x, 0, z); g.add(s); piece(rbox(0.22, 0.22, 0.2, 0.03), C.wood, { pos: [0, 0.11, 0], parent: s }); for (const a of [-1, 1]) for (const b of [-1, 1]) piece(rcyl(0.012, 0.012, 0.42, 0.004, 6), C.white, { pos: [a * 0.11, 0.21, b * 0.1], parent: s }); piece(rbox(0.3, 0.04, 0.28, 0.02), cols[i], { pos: [0, 0.43, 0], rot: [0.2, 0, 0], parent: s }); [C.orange, C.leaf, C.pink].forEach((c, k) => piece(sphere(0.035, 8, 6), c, { pos: [-0.06 + k * 0.06, 0.25, 0.03], parent: s })); } return g; },
  coixay(lv) { const g = G(); piece(lathe([[0, 0], [0.25, 0], [0.16, 0.85], [0, 0.85]]), C.white, { parent: g }); piece(new THREE.ConeGeometry(0.2, 0.2, 14), lv === 1 ? C.sky : C.pink, { pos: [0, 0.94, 0], parent: g }); piece(rbox(0.1, 0.18, 0.02, 0.01), C.woodD, { pos: [0.0, 0.1, 0.22], rot: [0, 0, 0], parent: g });
    const bl = G(); bl.position.set(0, 0.72, 0.2); bl.rotation.z = 0.3; g.add(bl); for (let i = 0; i < 4; i++) { const a = G(); a.rotation.z = i * Math.PI / 2; bl.add(a); piece(rbox(0.08, 0.38, 0.015, 0.01), i % 2 ? C.white : 0xFFE6F0, { pos: [0.03, 0.22, 0], parent: a }); } piece(sphere(0.04, 8, 6), C.navy, { parent: bl });
    if (lv === 2) flowersRow(g, -0.2, 0.25, 3, [C.butter, C.pink]); return g; },
  thuvien(lv) { const g = G(); piece(rbox(0.75, 0.42, 0.6, 0.05), C.white, { pos: [0, 0.21, 0], parent: g }); for (let i = 0; i < 4; i++) piece(rcyl(0.035, 0.035, 0.4, 0.01, 8), C.stone, { pos: [-0.27 + i * 0.18, 0.2, 0.32], parent: g }); piece(sphere(0.28, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), lv === 1 ? C.sky : C.lilac, { pos: [0, 0.42, 0], parent: g }); piece(rcyl(0.08, 0.08, 0.02, 0.01, 16), 0xBFE3FA, { pos: [0, 0.3, 0.31], rot: [Math.PI / 2, 0, 0], parent: g });
    if (lv === 2) { piece(rcyl(0.02, 0.02, 0.25, 0.01, 6), C.white, { pos: [0, 0.8, 0], parent: g }); piece(rbox(0.14, 0.09, 0.01, 0.005), C.pink, { pos: [0.07, 0.88, 0], parent: g }); for (const s of [-1, 1]) piece(rbox(0.16, 0.12, 0.08, 0.02), [C.pink, C.leaf][s > 0 ? 1 : 0], { pos: [s * 0.4, 0.06, 0.42], parent: g }); } return g; },
  phunnuoc(lv) { const g = G(); piece(rcyl(0.4, 0.42, 0.14, 0.05, 30), C.stone, { pos: [0, 0.07, 0], parent: g }); piece(rcyl(0.34, 0.34, 0.02, 0.01, 30), C.sky, { pos: [0, 0.14, 0], parent: g, noOutline: true }); piece(rcyl(0.05, 0.07, 0.35, 0.02, 10), C.stone, { pos: [0, 0.3, 0], parent: g }); piece(rcyl(0.16, 0.12, 0.06, 0.02, 18), C.stone, { pos: [0, 0.48, 0], parent: g });
    const jets = lv === 1 ? 4 : 8; for (let i = 0; i < jets; i++) { const a = i / jets * Math.PI * 2; piece(tube([[0, 0.52, 0], [Math.cos(a) * 0.12, 0.7, Math.sin(a) * 0.12], [Math.cos(a) * 0.26, 0.2, Math.sin(a) * 0.26]], 0.02, 10, 4), 0xBFE3FA, { noOutline: true, parent: g, opacity: 0.85, cast: false }); }
    if (lv === 2) piece(sphere(0.08, 12, 8), C.butter, { pos: [0, 0.62, 0], parent: g }); return g; },
  cong(lv) { const g = G(); for (const s of [-1, 1]) piece(rbox(0.12, 0.75, 0.12, 0.04), C.white, { pos: [s * 0.32, 0.37, 0], parent: g }); piece(torus(0.32, 0.06, Math.PI, 10, 24), C.white, { pos: [0, 0.72, 0], parent: g });
    const n = lv === 1 ? 7 : 13; for (let i = 0; i < n; i++) { const t = i / (n - 1) * Math.PI; piece(sphere(0.07, 10, 8), [C.pink, 0xFF9DC2, C.pinkL][i % 3], { pos: [Math.cos(t) * 0.32, 0.72 + Math.sin(t) * 0.32, 0.04], parent: g }); }
    if (lv === 2) for (const s of [-1, 1]) for (let j = 0; j < 3; j++) piece(sphere(0.06, 8, 6), C.leaf, { pos: [s * 0.32 + 0.04, 0.2 + j * 0.2, 0.06], parent: g }); return g; },
  rap(lv) { const g = G(); piece(new THREE.ConeGeometry(0.62, 0.55, 12), C.pink, { pos: [0, 0.82, 0], parent: g }); piece(rcyl(0.58, 0.58, 0.55, 0.04, 24), C.white, { pos: [0, 0.28, 0], parent: g }); for (let i = 0; i < 12; i++) piece(rbox(0.06, 0.53, 0.02, 0.01), C.pink, { noOutline: true, pos: [Math.cos(i / 12 * Math.PI * 2) * 0.58, 0.28, Math.sin(i / 12 * Math.PI * 2) * 0.58], rot: [0, -i / 12 * Math.PI * 2 + Math.PI / 2, 0], parent: g });
    piece(rbox(0.3, 0.38, 0.05, 0.05), C.navy, { pos: [0.0, 0.2, 0.57], parent: g }); piece(rcyl(0.012, 0.012, 0.4, 0.005, 6), C.white, { pos: [0, 1.25, 0], parent: g }); piece(rbox(0.2, 0.12, 0.01, 0.005), C.butter, { pos: [0.1, 1.38, 0], parent: g });
    if (lv === 2) { for (let i = 0; i < 6; i++) piece(sphere(0.04, 8, 6), C.butter, { pos: [Math.cos(i * 0.5 - 0.7) * 0.62, 0.6, Math.sin(i * 0.5 - 0.7) * 0.62 + 0.0], parent: g, emissive: C.butter, ei: 0.5 }); for (const s of [-1, 1]) piece(rcyl(0.012, 0.012, 0.3, 0.005, 6), C.white, { pos: [s * 0.45, 0.95, 0.2], parent: g }); } return g; },
  thap(lv, lit) { const g = G(); piece(lathe([[0, 0], [0.22, 0], [0.16, 1.1], [0, 1.1]]), C.white, { parent: g }); for (let i = 0; i < 3; i++) piece(rcyl(0.21 - i * 0.02, 0.21 - i * 0.02, 0.08, 0.02, 16), C.pink, { pos: [0, 0.2 + i * 0.35, 0], parent: g, noOutline: true });
    piece(rcyl(0.15, 0.15, 0.22, 0.04, 16), lit ? C.butter : 0xBFE3FA, { pos: [0, 1.22, 0], parent: g, emissive: lit ? C.butter : 0, ei: lit ? 1 : 0, opacity: 0.9 }); piece(new THREE.ConeGeometry(0.2, 0.22, 16), C.navy, { pos: [0, 1.44, 0], parent: g }); piece(rcyl(0.24, 0.24, 0.04, 0.015, 18), C.white, { pos: [0, 1.11, 0], parent: g });
    if (lit) piece(new THREE.ConeGeometry(0.3, 1.0, 16, 1, true), 0xFFF1C4, { noOutline: true, opacity: 0.35, emissive: C.butter, ei: 0.8, pos: [0.5, 1.22, 0.2], rot: [0, 0, Math.PI / 2], parent: g, cast: false, side: THREE.DoubleSide });
    if (lv === 2) piece(rbox(0.18, 0.2, 0.05, 0.03), C.woodD, { pos: [0, 0.1, 0.2], parent: g }); return g; },
  lau(lv) { const g = G(); piece(rbox(0.9, 0.6, 0.7, 0.06), C.white, { pos: [0, 0.3, 0], parent: g });
    const tw = (x, z, h, col) => { piece(rcyl(0.17, 0.18, h, 0.04, 18), C.white, { pos: [x, h / 2, z], parent: g }); piece(new THREE.ConeGeometry(0.22, 0.38, 18), col, { pos: [x, h + 0.19, z], parent: g }); piece(rcyl(0.008, 0.008, 0.2, 0.004, 6), C.navy, { pos: [x, h + 0.48, z], parent: g }); const hs = new THREE.Shape(); hs.moveTo(0, -0.05); hs.bezierCurveTo(-0.1, 0.02, -0.04, 0.09, 0, 0.04); hs.bezierCurveTo(0.04, 0.09, 0.1, 0.02, 0, -0.05); piece(new THREE.ExtrudeGeometry(hs, { depth: 0.015, bevelEnabled: false }), C.pink, { pos: [x + 0.06, h + 0.55, z], parent: g }); };
    tw(-0.42, -0.25, 0.95, C.sky); tw(0.42, -0.25, 0.95, C.pink); if (lv === 2) { tw(-0.42, 0.32, 0.8, C.pink); tw(0.42, 0.32, 0.8, C.sky); }
    piece(rbox(0.5, 0.45, 0.4, 0.05), C.white, { pos: [0, 0.82, -0.1], parent: g }); piece(new THREE.ConeGeometry(0.34, 0.4, 4), C.pink, { pos: [0, 1.25, -0.1], rot: [0, Math.PI / 4, 0], parent: g });
    piece(rbox(0.2, 0.32, 0.03, 0.08), C.woodD, { pos: [0, 0.16, 0.36], parent: g }); for (let i = 0; i < 5; i++) piece(rbox(0.1, 0.08, 0.1, 0.02), C.white, { pos: [-0.36 + i * 0.18, 0.64, 0.3], parent: g });
    if (lv === 2) flowersRow(g, -0.25, 0.48, 6, [C.pink, C.butter, C.white]); return g; },
  duong() { return G(); }
};
// giàn giáo dùng chung khi đang xây
function scaffold(big) { const g = G(), s = big ? 1.3 : 1; for (const a of [-1, 1]) for (const b of [-1, 1]) piece(rbox(0.04, 0.8 * s, 0.04, 0.01), C.wood, { pos: [a * 0.32 * s, 0.4 * s, b * 0.3 * s], parent: g }); for (const y of [0.3, 0.65]) { piece(rbox(0.7 * s, 0.04, 0.04, 0.01), C.wood, { pos: [0, y * s, 0.3 * s], parent: g }); piece(rbox(0.04, 0.04, 0.64 * s, 0.01), C.wood, { pos: [0.32 * s, y * s, 0], parent: g }); }
  piece(rbox(0.55 * s, 0.5 * s, 0.03, 0.02), C.sky2, { pos: [-0.05, 0.42 * s, -0.25 * s], parent: g }); for (let i = 0; i < 3; i++) piece(rbox(0.16, 0.08, 0.1, 0.02), C.orangeD, { pos: [0.2 * s - i * 0.05, 0.04 + i * 0.08, 0.15 * s], parent: g }); piece(rbox(0.14, 0.08, 0.1, 0.02), C.orangeD, { pos: [0.05, 0.04, 0.22 * s], parent: g }); return g; }

// đường đá theo 4 hướng nối (bit 1 = -z, 2 = +x, 4 = +z, 8 = -x)
function road(mask) { const g = G(); piece(rbox(0.36, 0.03, 0.36, 0.015), C.stone, { pos: [0, 0.015, 0], parent: g, cast: false }); const dirs = [[0, -1], [1, 0], [0, 1], [-1, 0]];
  dirs.forEach(([dx, dz], i) => { if (mask & (1 << i)) for (let k = 1; k <= 2; k++) piece(rcyl(0.11, 0.11, 0.03, 0.012, 14), k % 2 ? C.stone : C.stoneD, { pos: [dx * k * 0.2, 0.016, dz * k * 0.2], parent: g, cast: false }); });
  return g; }
// cư dân bánh bao, gà, vịt, thuyền buồm
function resident(col) { const g = G(); const b = sphere(0.16, 18, 12); b.scale(1, 0.95, 1); piece(b, col, { pos: [0, 0.15, 0], parent: g }); piece(sphere(0.06, 10, 8), col, { pos: [0, 0.32, 0], parent: g }); for (const s of [-1, 1]) { piece(sphere(0.02, 8, 6).scale(0.8, 1.2, 0.5), C.navy, { noOutline: true, basic: true, pos: [s * 0.05, 0.18, 0.15], parent: g }); piece(sphere(0.025, 8, 6).scale(1.2, 0.6, 0.3), C.blush, { noOutline: true, basic: true, pos: [s * 0.1, 0.13, 0.13], parent: g }); } return g; }
function chicken(duck) { const g = G(); piece(sphere(0.12, 14, 10).scale(1.2, 1, 1), duck ? C.butter : C.white, { pos: [0, 0.12, 0], parent: g }); piece(sphere(0.08, 12, 8), duck ? C.butter : C.white, { pos: [0, 0.24, 0.08], parent: g }); piece(new THREE.ConeGeometry(0.03, 0.06, 6), C.orange, { pos: [0, 0.23, 0.18], rot: [Math.PI / 2, 0, 0], parent: g }); if (!duck) piece(sphere(0.03, 8, 6), C.pinkD, { pos: [0, 0.32, 0.08], parent: g }); for (const s of [-1, 1]) piece(sphere(0.012, 6, 4), C.navy, { noOutline: true, basic: true, pos: [s * 0.04, 0.26, 0.15], parent: g }); return g; }
function sailboat() { const g = G(); piece(lathe([[0, -0.15], [0.25, -0.12], [0.32, 0.0], [0, 0.0]]).scale(1, 1, 2.2), C.white, { pos: [0, 0.12, 0], parent: g }); piece(rcyl(0.015, 0.015, 0.8, 0.005, 6), C.woodD, { pos: [0, 0.5, 0], parent: g }); const sail = new THREE.Shape(); sail.moveTo(0, 0); sail.lineTo(0.5, 0); sail.lineTo(0, 0.6); sail.lineTo(0, 0); piece(new THREE.ExtrudeGeometry(sail, { depth: 0.01, bevelEnabled: false }), C.pink, { pos: [0.01, 0.2, 0], rot: [0, -Math.PI / 2, 0], parent: g }); return g; }

// nền đảo: ô cỏ, vách đất nhiều lớp, biển quanh đảo
function island(time) {
  const g = G(), n = KG.n, c = n / 2, night = time === 'dem';
  piece(rbox(n + 0.3, 0.4, n + 0.3, 0.2), C.grassD, { pos: [c, -0.2, c], parent: g, receive: true });
  piece(rbox(n + 0.1, 0.8, n + 0.1, 0.3), C.earth, { pos: [c, -0.75, c], parent: g });
  piece(rbox(n - 1, 0.7, n - 1, 0.3), C.earthD, { pos: [c, -1.45, c], parent: g });
  piece(rbox(n - 3, 0.6, n - 3, 0.3), 0x7A5238, { pos: [c, -2.0, c], parent: g });
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) piece(new THREE.PlaneGeometry(0.98, 0.98), (i + j) % 2 ? 0xA6DC95 : 0xB3E3A2, { noOutline: true, pos: [i + 0.5, 0.005, j + 0.5], rot: [-Math.PI / 2, 0, 0], parent: g, receive: true, cast: false });
  for (const [x, z, r] of [[n + 0.6, 2, 0.35], [3, n + 0.7, 0.3], [n + 0.4, n + 0.3, 0.45]]) piece(sphere(r, 12, 8).scale(1.2, 0.8, 1), C.stoneD, { pos: [x, -2.1, z], parent: g });
  const sea = new THREE.Mesh(new THREE.CircleGeometry(16, 80), mat(night ? 0x34558F : C.sea)); sea.rotation.x = -Math.PI / 2; sea.position.set(c, -2.25, c); sea.receiveShadow = true; g.add(sea);
  for (const [r, o] of [[7.0, 0.5], [7.8, 0.3]]) { const m = new THREE.Mesh(new THREE.TorusGeometry(r, 0.05, 4, 100), mat(C.white, { basic: true, opacity: o })); m.rotation.x = Math.PI / 2; m.position.set(c, -2.23, c); g.add(m); }
  return g;
}

const cam = () => isoCamera(KG.w, KG.h, KG.ppm, KG.target, KG.shift);
function spriteShot(obj, big, lit) {
  const f = big ? SPB : SP, s = makeScene(lit ? 'dem' : 'ngay', { shadowSize: 1.5, shadowBlur: 3, keyPos: [-2.2, 12, 0.9] });
  s.add(shadowCatcher(1.4, 1.4)); s.add(obj);
  return shoot(s, isoCamera(f.w, f.h, KG.ppm, [0, 0, 0], [0, f.h / 2 - (f.h - f.ay)]), { outline: 5 });
}
const BIG = ['rap', 'lau'], LIT = ['den', 'thap', 'nha', 'tra', 'banh'];
export const jobs = {
  nen: async () => {
    const out = [];
    for (const t of ['sang', 'ngay', 'chieu', 'dem']) { const s = makeScene(t, { shadowSize: 8, target: [4, 0, 4] }); s.add(island(t)); out.push({ file: `dao_${t}@3x.png`, data: shoot(s, cam()) }); }
    const c = cam();
    out.push({ file: 'dao_meta', meta: { size: [KG.w, KG.h], ppm: KG.ppm, n: KG.n, o: toPx(c, 0, 0, 0), ex: toPx(c, 1, 0, 0), ez: toPx(c, 0, 0, 1), sp: SP, spb: SPB } });
    return out;
  },
  congtrinh: async () => {
    const out = [];
    for (const k of Object.keys(B)) { if (k === 'duong') continue;
      for (const lv of [1, 2]) { out.push({ file: `ct_${k}_capdo${lv}@3x.png`, data: spriteShot(B[k](lv, false), BIG.includes(k)) });
        if (LIT.includes(k)) out.push({ file: `ct_${k}_capdo${lv}_sang@3x.png`, data: spriteShot(B[k](lv, true), BIG.includes(k), true) }); } }
    out.push({ file: 'ct_dangxay@3x.png', data: spriteShot(scaffold(false), false) });
    out.push({ file: 'ct_dangxay_lon@3x.png', data: spriteShot(scaffold(true), true) });
    for (let m = 0; m < 16; m++) out.push({ file: `duong_${m}@3x.png`, data: spriteShot(road(m), false) });
    ['#7CC3F2', '#FF6FA5', '#FFFFFF', '#2FA463'].forEach((col, i) => out.push({ file: `cu_dan_${i + 1}@3x.png`, data: spriteShot(resident(parseInt(col.slice(1), 16)), false) }));
    out.push({ file: 'ga@3x.png', data: spriteShot(chicken(false), false) }); out.push({ file: 'vit@3x.png', data: spriteShot(chicken(true), false) });
    out.push({ file: 'thuyen_buom@3x.png', data: spriteShot(sailboat(), false) });
    // ô cỏ trang trí
    const deco = G(); flowersRow(deco, 0, -0.1, 5, [C.white, C.butter, C.pink]); out.push({ file: 'o_hoadai@3x.png', data: spriteShot(deco, false) });
    const rock = G(); piece(sphere(0.16, 12, 8).scale(1.3, 0.7, 1), C.stoneD, { pos: [0, 0.08, 0], parent: rock }); piece(sphere(0.1, 10, 8).scale(1.2, 0.7, 1), C.stone, { pos: [0.18, 0.05, 0.1], parent: rock }); out.push({ file: 'o_da@3x.png', data: spriteShot(rock, false) });
    return out;
  }
};
