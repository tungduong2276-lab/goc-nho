// Cây và hoa theo giai đoạn — mục 9 của brief. 5 giai đoạn + héo + bó hoa, cùng điểm neo đáy.
// Không có hoa hồng, không có hoa hướng dương.
import { THREE, C, piece, rbox, sphere, capsule, rcyl, lathe, torus, tube, leafGeo, makeScene, isoCamera, shoot, shadowCatcher } from './lib.js';
import * as F from './furn.js';

const G = () => new THREE.Group();
export const FLOWERS = {
  tulip:    { name: 'Tulip', color: 0xFF8DB4, deep: C.pink, leaf: C.leaf, rare: false },
  cuc:      { name: 'Cúc họa mi', color: C.white, deep: C.butter, leaf: C.leaf, rare: false },
  camtucau: { name: 'Cẩm tú cầu', color: 0x8EC8F5, deep: 0xA99BEA, leaf: C.leaf, rare: false },
  oaihuong: { name: 'Oải hương', color: 0xB49BEA, deep: 0x8E74D9, leaf: 0x7FB98E, rare: false },
  sen:      { name: 'Hoa sen', color: 0xFFB8D2, deep: C.pink, leaf: C.leaf, rare: true },
  anhdao:   { name: 'Anh đào', color: 0xFFC9DC, deep: C.pinkL, leaf: C.leaf, rare: true }
};
const FADE = c => { const k = new THREE.Color(c); const hsl = {}; k.getHSL(hsl); k.setHSL(hsl.h, hsl.s * 0.35, Math.min(0.85, hsl.l * 1.05)); return k.getHex(); };

function soil(g, r = 0.16) { piece(sphere(r, 16, 10).scale(1, 0.35, 1), C.earth, { pos: [0, 0.0, 0], parent: g }); }
function marker(g, col) { piece(rbox(0.035, 0.32, 0.02, 0.01), C.wood, { pos: [0.1, 0.16, 0.0], parent: g }); piece(rbox(0.13, 0.1, 0.025, 0.02), C.white, { pos: [0.1, 0.33, 0.01], parent: g }); piece(sphere(0.03, 10, 8), col, { noOutline: true, pos: [0.1, 0.33, 0.03], parent: g }); }
function sprout(g, h = 0.12, sc = 1) { piece(rcyl(0.014, 0.016, h, 0.005, 8), C.leaf, { pos: [0, h / 2, 0], parent: g }); const lf = leafGeo(0.15 * sc, 0.085 * sc, 0.025); for (const s of [-1, 1]) piece(lf, C.leafL, { pos: [0, h, 0], rot: [-0.95, s * Math.PI / 2 + 0.6, 0], parent: g }); }
function stem(g, h, col = C.leaf, bend = 0) { piece(tube([[0, 0, 0], [bend * 0.3, h * 0.5, 0], [bend, h, 0]], 0.018, 12, 6), col, { parent: g }); }
function leaves(g, n, h, len = 0.22, col = C.leaf) { const lf = leafGeo(len, len * 0.42, 0.025); for (let i = 0; i < n; i++) { const a = i * 2.4; piece(lf, i % 2 ? col : C.leafL, { pos: [0, 0.03 + (i / n) * h * 0.5, 0], rot: [-1.05 + (i % 3) * 0.12, a, 0], parent: g }); } }
function sparkles(g, h) { [[0.2, h + 0.05, 0.05], [-0.18, h - 0.05, 0.1], [0.05, h + 0.2, -0.05]].forEach(p => { const st = new THREE.OctahedronGeometry(0.035, 0); st.scale(1, 1.6, 0.4); piece(st, C.butter, { pos: p, parent: g, emissive: C.butter, ei: 0.4 }); }); }

function head(type, col, deep, open = 1) {
  const g = G();
  if (type === 'tulip') {
    for (let i = 0; i < 5; i++) { const p = sphere(0.075, 14, 10); p.scale(0.75, 1.45, 0.5); piece(p, i % 2 ? col : deep, { pos: [Math.cos(i * 1.256) * 0.045 * open, 0.08, Math.sin(i * 1.256) * 0.045 * open], rot: [Math.sin(i * 1.256) * 0.35 * open, 0, -Math.cos(i * 1.256) * 0.35 * open], parent: g }); }
  } else if (type === 'cuc') {
    for (let i = 0; i < 12; i++) { const p = sphere(0.05, 10, 6); p.scale(0.45, 0.18, 1.0); const a = i / 12 * Math.PI * 2; piece(p, col, { noOutline: i % 2 === 1, pos: [Math.cos(a) * 0.055, 0.0, Math.sin(a) * 0.055], rot: [0, -a + Math.PI / 2, 0], parent: g }); }
    piece(sphere(0.04, 12, 8).scale(1, 0.6, 1), deep, { pos: [0, 0.015, 0], parent: g }); g.rotation.x = 0.55;
  } else if (type === 'camtucau') {
    for (let i = 0; i < 26; i++) { const t = i / 26, phi = Math.acos(1 - t * 1.5), th = i * 2.4; piece(sphere(0.042, 8, 6), i % 3 ? col : deep, { noOutline: i % 2 === 1, pos: [Math.sin(phi) * Math.cos(th) * 0.12, 0.08 + Math.cos(phi) * 0.11, Math.sin(phi) * Math.sin(th) * 0.12], parent: g }); }
    piece(sphere(0.12, 14, 10), col, { pos: [0, 0.07, 0], parent: g });
  } else if (type === 'oaihuong') {
    for (let i = 0; i < 9; i++) for (let k = 0; k < 2; k++) piece(sphere(0.026, 8, 6).scale(1, 1.4, 1), k ? col : deep, { noOutline: k === 1, pos: [Math.cos(i * 2 + k * 3) * 0.022, i * 0.033, Math.sin(i * 2 + k * 3) * 0.022], parent: g });
  } else if (type === 'sen') {
    for (let r = 0; r < 2; r++) for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + r * 0.5; const p = sphere(0.07, 12, 8); p.scale(0.6, 1.4, 0.4); piece(p, r ? col : deep, { pos: [Math.cos(a) * 0.06 * (1 + r * 0.2) * open, 0.06, Math.sin(a) * 0.06 * (1 + r * 0.2) * open], rot: [Math.sin(a) * (0.7 - r * 0.35) * open, 0, -Math.cos(a) * (0.7 - r * 0.35) * open], parent: g }); }
    piece(rcyl(0.035, 0.035, 0.03, 0.01, 12), C.butter, { pos: [0, 0.06, 0], parent: g });
  }
  return g;
}

// stage: gd1..gd5 | heo | bo
export function plant(type, stage) {
  const P = FLOWERS[type], g = G();
  const col = stage === 'heo' ? FADE(P.color) : P.color, deep = stage === 'heo' ? FADE(P.deep) : P.deep, leafC = stage === 'heo' ? 0xA8B98A : P.leaf;
  if (stage === 'bo') return bouquet(type);
  if (stage === 'gd1') { soil(g); marker(g, P.deep); return g; }
  if (type === 'anhdao') { // cây nhỏ
    soil(g, 0.2);
    const H = { gd2: 0.12, gd3: 0.35, gd4: 0.5, gd5: 0.55, heo: 0.55 }[stage];
    if (stage === 'gd2') { sprout(g, 0.1); return g; }
    piece(tube([[0, 0, 0], [0.03, H * 0.6, 0], [-0.02, H, 0]], 0.03 + H * 0.03, 10, 6), C.woodD, { parent: g });
    const nc = stage === 'gd3' ? 2 : 4;
    for (let i = 0; i < nc; i++) piece(sphere(0.12 + (stage === 'gd3' ? 0 : 0.04), 14, 10), stage === 'gd5' ? (i % 2 ? col : deep) : stage === 'heo' ? 0xD9C7C9 : leafC, { pos: [Math.cos(i * 1.7) * 0.11, H + 0.06 + (i % 2) * 0.08, Math.sin(i * 1.7) * 0.11], parent: g });
    if (stage === 'gd4') for (let i = 0; i < 6; i++) piece(sphere(0.025, 8, 6), deep, { pos: [Math.cos(i) * 0.18, H + 0.08 + Math.sin(i * 3) * 0.06, Math.sin(i) * 0.15], parent: g });
    if (stage === 'gd5') { for (let i = 0; i < 8; i++) piece(sphere(0.022, 8, 6), C.white, { noOutline: true, pos: [Math.cos(i * 1.3) * 0.2, H + 0.1 + Math.sin(i * 2) * 0.08, Math.sin(i * 1.3) * 0.17], parent: g }); sparkles(g, H + 0.2); }
    if (stage === 'heo') g.rotation.z = -0.12;
    return g;
  }
  if (type === 'sen') { // chậu nước
    piece(lathe([[0, 0], [0.22, 0], [0.27, 0.16], [0.29, 0.16], [0.29, 0.19], [0, 0.19]]), 0x8EC8F5, { parent: g });
    piece(rcyl(0.26, 0.26, 0.02, 0.008, 28), 0xBFE3FA, { pos: [0, 0.18, 0], parent: g, noOutline: true });
    const pad = rcyl(0.11, 0.11, 0.02, 0.008, 20);
    if (stage !== 'gd2') [[0.12, 0.05], [-0.1, 0.1], [0.02, -0.13]].forEach(([x, z]) => piece(pad, leafC, { pos: [x, 0.2, z], parent: g }));
    if (stage === 'gd2') { const p2 = G(); p2.position.y = 0.19; sprout(p2, 0.05, 0.8); g.add(p2); return g; }
    if (stage === 'gd3') return g;
    const s = G(); s.position.y = 0.19; g.add(s); const h = 0.32;
    stem(s, h, leafC, stage === 'heo' ? 0.12 : 0);
    const hd = head('sen', col, deep, stage === 'gd4' ? 0.15 : 1); hd.position.set(stage === 'heo' ? 0.12 : 0, h, 0); if (stage === 'heo') hd.rotation.z = -1.0; if (stage === 'gd4') hd.scale.setScalar(0.85); s.add(hd);
    if (stage === 'gd5') sparkles(s, h + 0.1);
    return g;
  }
  soil(g);
  if (stage === 'gd2') { sprout(g, 0.12); return g; }
  const tall = type === 'oaihuong' ? 0.5 : 0.36;
  if (stage === 'gd3') { leaves(g, type === 'oaihuong' ? 6 : 5, 0.3, 0.2, leafC); stem(g, tall * 0.55, leafC); return g; }
  leaves(g, 6, 0.35, type === 'oaihuong' ? 0.18 : 0.24, leafC);
  const n = type === 'cuc' ? 3 : type === 'oaihuong' ? 4 : 1;
  for (let i = 0; i < n; i++) {
    const s = G(), dx = n > 1 ? Math.cos(i * 2.1) * 0.07 : 0, dz = n > 1 ? Math.sin(i * 2.1) * 0.07 : 0; s.position.set(dx, 0, dz); g.add(s);
    const h = tall * (1 - i * 0.12), bend = stage === 'heo' ? 0.13 : (n > 1 ? dx * 0.6 : 0);
    stem(s, h, leafC, bend);
    let hd;
    if (stage === 'gd4') {
      if (type === 'oaihuong') { hd = head('oaihuong', 0x9FC2A6, deep); hd.scale.set(1, 0.7, 1); }
      else { hd = G(); piece(sphere(0.055, 12, 8).scale(0.9, 1.35, 0.9), deep, { pos: [0, 0.05, 0], parent: hd }); }
    } else hd = head(type, col, deep);
    hd.position.set(bend, h, 0);
    if (stage === 'heo') hd.rotation.z = type === 'oaihuong' ? -0.6 : -1.2;
    s.add(hd);
  }
  if (stage === 'gd5') sparkles(g, tall + 0.1);
  return g;
}

export function bouquet(type) {
  const P = FLOWERS[type], g = G();
  // giấy gói hình nón + ruy băng
  piece(lathe([[0.02, 0], [0.06, 0.02], [0.2, 0.36], [0.22, 0.38], [0.2, 0.39], [0.05, 0.05], [0.0, 0.03]]), type === 'camtucau' || type === 'oaihuong' ? C.petal : C.sky2, { pos: [0, 0, 0], parent: g });
  piece(torus(0.085, 0.022, Math.PI * 2, 8, 20), C.pink, { pos: [0, 0.14, 0], rot: [Math.PI / 2, 0, 0], parent: g });
  for (const s of [-1, 1]) { const b = sphere(0.05, 12, 8); b.scale(1.3, 0.7, 0.5); piece(b, C.pink, { pos: [s * 0.07, 0.14, 0.09], rot: [0, 0, s * 0.4], parent: g }); }
  const n = type === 'anhdao' ? 5 : type === 'camtucau' ? 3 : 5;
  for (let i = 0; i < n; i++) {
    const a = i / n * Math.PI * 2, r = i === 0 ? 0 : 0.09;
    const hd = type === 'anhdao' ? (() => { const h = G(); piece(sphere(0.07, 12, 8), i % 2 ? P.color : C.white, { parent: h }); return h; })() : head(type, P.color, P.deep);
    hd.position.set(Math.cos(a) * r, 0.42 + (i === 0 ? 0.06 : 0), Math.sin(a) * r);
    if (type === 'cuc') hd.rotation.x = 0.3;
    hd.scale.setScalar(type === 'camtucau' ? 0.85 : 1);
    g.add(hd);
  }
  for (let i = 0; i < 4; i++) piece(leafGeo(0.16, 0.07, 0.02), C.leaf, { pos: [Math.cos(i * 1.6) * 0.1, 0.36, Math.sin(i * 1.6) * 0.1], rot: [-1.0, i * 1.6, 0], parent: g });
  return g;
}

export const FL = { size: 256, ppm: 230, anchorY: 34 };
function shotPlant(obj) {
  const s = makeScene('ngay', { shadowSize: 1, shadowBlur: 3, keyPos: [-2.2, 12, 0.9] }); s.add(shadowCatcher(2, 2)); s.add(obj);
  return shoot(s, isoCamera(FL.size, FL.size, FL.ppm, [0, 0, 0], [0, FL.size / 2 - FL.anchorY]), { outline: 4.5 });
}
export const jobs = {
  hoa: async () => {
    const out = [];
    for (const t of Object.keys(FLOWERS)) for (const st of ['gd1', 'gd2', 'gd3', 'gd4', 'gd5', 'heo', 'bo']) {
      const p = plant(t, st); p.rotation.y = Math.PI / 4; out.push({ file: `hoa_${t}_${st}@3x.png`, data: shotPlant(p) });
    }
    out.push({ file: 'hoa_meta', meta: { size: FL.size, ppm: FL.ppm, anchor: [FL.size / 2, FL.size - FL.anchorY], names: Object.fromEntries(Object.entries(FLOWERS).map(([k, v]) => [k, { name: v.name, rare: v.rare }])) } });
    return out;
  },
  chau: async () => {
    const out = [];
    for (const [k, c, f] of [['trang', C.white, false], ['xanh', C.sky, false], ['hong', C.pink, false], ['matcuoi', 0xFF9DC2, true]]) {
      const p = F.pot(c, 0.22, 0.28, f); p.rotation.y = Math.PI / 4; out.push({ file: `chau_${k}@3x.png`, data: shotPlant(p) });
    }
    return out;
  }
};
