// Thú lớn còn lại (mục 5): chó, thỏ, chim cánh cụt, ếch, gấu trúc đỏ. Tư thế: ngồi, vui, nằm ngủ.
import { THREE, C, piece, rbox, sphere, capsule, rcyl, torus, tube, leafGeo, makeScene, isoCamera, shoot, shadowCatcher } from './lib.js';
const G = () => new THREE.Group();
export const SPECIES = {
  cho: { name: 'Chó Shiba', colors: { camkem: ['Cam kem', 0xF5B26B, 0xFFF4E6], denkem: ['Đen kem', 0x4B3A3A, 0xFFF4E6] } },
  tho: { name: 'Thỏ', colors: { trang: ['Trắng', 0xFFFFFF, 0xFFE6F0], nausua: ['Nâu sữa', 0xD9B48F, 0xFFF4E6] } },
  canhcut: { name: 'Chim cánh cụt', colors: { xanhthan: ['Xanh than', 0x2F3F6B, 0xFFFFFF] } },
  ech: { name: 'Ếch', colors: { xanhla: ['Xanh lá', 0x6FCF8C, 0xE9F8D9], xanhhong: ['Xanh hồng', 0x8EDDBA, 0xFFD6E5] } },
  gautruc: { name: 'Gấu trúc đỏ', colors: { camdo: ['Cam đỏ', 0xE9824B, 0xFFF4E6] } }
};
function eyes(g, y, z, sleep, happy, sep = 0.075, sc = 1) {
  for (const s of [-1, 1]) {
    if (sleep || happy) piece(torus(0.03 * sc, 0.009, Math.PI, 6, 12), C.navy, { noOutline: true, basic: true, pos: [s * sep, y, z], rot: [0, 0, sleep ? Math.PI : 0], parent: g });
    else { piece(sphere(0.03 * sc, 12, 8).scale(0.85, 1.2, 0.5), C.navy, { noOutline: true, basic: true, pos: [s * sep, y, z], parent: g }); piece(sphere(0.01 * sc, 6, 4), C.white, { noOutline: true, basic: true, pos: [s * sep + 0.008, y + 0.014, z + 0.012], parent: g }); }
    piece(sphere(0.034, 10, 6).scale(1.1, 0.6, 0.3), C.blush, { noOutline: true, basic: true, opacity: 0.8, pos: [s * (sep + 0.06), y - 0.045, z - 0.02], parent: g });
  }
}
export function buildPet(sp, col, pose) {
  const [, c1, c2] = SPECIES[sp].colors[col], g = G(), sleep = pose === 'nam', happy = pose === 'vui';
  const lie = sleep ? 1 : 0;
  if (sp === 'cho') {
    piece(sphere(0.2, 20, 14).scale(1, lie ? 0.7 : 1.05, 1.15), c1, { pos: [0, lie ? 0.14 : 0.2, -0.04], parent: g }); piece(sphere(0.12, 14, 10).scale(1, 1.1, 0.6), c2, { noOutline: true, pos: [0, lie ? 0.14 : 0.2, 0.13], parent: g });
    if (!lie) for (const s of [-1, 1]) piece(capsule(0.05, 0.06, 4, 10), c1, { pos: [s * 0.08, 0.06, 0.12], parent: g });
    piece(tube([[0, 0.25, -0.22], [0.0, 0.42, -0.28], [0.08, 0.45, -0.18]], 0.06, 14, 8), c1, { parent: g });
    const h = G(); h.position.set(0, lie ? 0.24 : 0.48, lie ? 0.16 : 0.04); g.add(h); piece(sphere(0.2, 24, 16).scale(1.12, 0.92, 0.95), c1, { parent: h });
    piece(sphere(0.11, 14, 10).scale(1.1, 0.8, 0.8), c2, { pos: [0, -0.06, 0.13], parent: h }); piece(sphere(0.025, 8, 6), C.navy, { pos: [0, -0.02, 0.21], parent: h });
    for (const s of [-1, 1]) { piece(new THREE.ConeGeometry(0.08, 0.13, 4), c1, { pos: [s * 0.13, 0.17, -0.02], rot: [0, Math.PI / 4, s * -0.3], parent: h }); }
    eyes(h, 0.03, 0.18, sleep, happy); if (happy) piece(sphere(0.03, 8, 6).scale(1, 0.6, 1.3), C.pink, { pos: [0, -0.11, 0.2], parent: h });
  } else if (sp === 'tho') {
    piece(sphere(0.2, 20, 14).scale(1.05, lie ? 0.7 : 1, 1.1), c1, { pos: [0, lie ? 0.14 : 0.19, -0.03], parent: g }); piece(sphere(0.07, 10, 8), C.white, { pos: [0, 0.14, -0.24], parent: g });
    if (!lie) for (const s of [-1, 1]) piece(sphere(0.07, 10, 8).scale(1, 0.7, 1.4), c1, { pos: [s * 0.1, 0.05, 0.12], parent: g });
    const h = G(); h.position.set(0, lie ? 0.25 : 0.45, lie ? 0.15 : 0.04); g.add(h); piece(sphere(0.19, 24, 16).scale(1.1, 0.95, 0.95), c1, { parent: h });
    for (const s of [-1, 1]) { const e = G(); e.position.set(s * 0.08, 0.14, -0.02); e.rotation.set(sleep ? -1.2 : -0.15, 0, s * (happy ? -0.35 : -0.15)); h.add(e); piece(capsule(0.055, 0.2, 4, 10), c1, { pos: [0, 0.15, 0], parent: e }); piece(capsule(0.03, 0.16, 4, 8), c2, { noOutline: true, pos: [0, 0.15, 0.03], parent: e }); }
    eyes(h, 0.0, 0.17, sleep, happy); piece(sphere(0.02, 8, 6), C.pinkD, { pos: [0, -0.05, 0.18], parent: h });
  } else if (sp === 'canhcut') {
    piece(sphere(0.24, 22, 16).scale(1, lie ? 0.65 : 1.3, 0.95), c1, { pos: [0, lie ? 0.15 : 0.3, 0], parent: g }); piece(sphere(0.19, 18, 12).scale(1, lie ? 0.6 : 1.25, 0.6), c2, { noOutline: true, pos: [0, lie ? 0.14 : 0.25, 0.135], parent: g });
    for (const s of [-1, 1]) piece(sphere(0.08, 10, 8).scale(0.4, 1.4, 0.8), c1, { pos: [s * 0.23, lie ? 0.15 : 0.3, 0], rot: [0, 0, s * (happy ? -0.8 : -0.2)], parent: g });
    for (const s of [-1, 1]) piece(sphere(0.06, 10, 8).scale(1, 0.4, 1.4), C.orange, { pos: [s * 0.08, 0.02, 0.08], parent: g });
    const fy = lie ? 0.22 : 0.48; eyes(g, fy, 0.2, sleep, happy, 0.07); piece(new THREE.ConeGeometry(0.035, 0.08, 8), C.orange, { pos: [0, fy - 0.045, 0.23], rot: [Math.PI / 2, 0, 0], parent: g });
  } else if (sp === 'ech') {
    piece(sphere(0.24, 22, 14).scale(1.1, lie ? 0.6 : 0.85, 1), c1, { pos: [0, lie ? 0.13 : 0.2, 0], parent: g }); piece(sphere(0.17, 16, 10).scale(1.1, 0.7, 0.6), c2, { noOutline: true, pos: [0, lie ? 0.11 : 0.15, 0.12], parent: g });
    for (const s of [-1, 1]) { piece(sphere(0.09, 12, 10), c1, { pos: [s * 0.11, lie ? 0.27 : 0.4, 0.06], parent: g }); piece(sphere(0.07, 10, 8).scale(1.2, 0.5, 1.4), c1, { pos: [s * 0.17, 0.04, 0.14], parent: g }); }
    for (const s of [-1, 1]) { const ey = lie ? 0.28 : 0.41; if (sleep || happy) piece(torus(0.03, 0.009, Math.PI, 6, 12), C.navy, { noOutline: true, basic: true, pos: [s * 0.11, ey, 0.14], rot: [0, 0, sleep ? Math.PI : 0], parent: g }); else piece(sphere(0.035, 10, 8).scale(1, 1.1, 0.5), C.navy, { noOutline: true, basic: true, pos: [s * 0.11, ey, 0.14], parent: g }); piece(sphere(0.035, 8, 6).scale(1.2, 0.6, 0.3), C.blush, { noOutline: true, basic: true, opacity: 0.8, pos: [s * 0.17, lie ? 0.16 : 0.24, 0.2], parent: g }); }
    piece(torus(0.07, 0.01, Math.PI, 6, 14), C.navy, { noOutline: true, basic: true, pos: [0, lie ? 0.18 : 0.26, 0.23], rot: [0, 0, Math.PI], parent: g });
    piece(rcyl(0.16, 0.16, 0.02, 0.008, 20), C.leaf, { pos: [0, lie ? 0.42 : 0.55, -0.06], rot: [-0.2, 0, 0.1], parent: g }); piece(rcyl(0.012, 0.012, 0.08, 0.004, 6), C.leafD, { pos: [0, lie ? 0.47 : 0.6, -0.06], parent: g });
  } else if (sp === 'gautruc') {
    piece(sphere(0.2, 20, 14).scale(1, lie ? 0.7 : 1.05, 1.1), c1, { pos: [0, lie ? 0.14 : 0.2, -0.03], parent: g }); piece(sphere(0.12, 14, 10).scale(1, 1.1, 0.6), 0x6B3A2A, { noOutline: true, pos: [0, lie ? 0.13 : 0.18, 0.12], parent: g });
    if (!lie) for (const s of [-1, 1]) piece(capsule(0.05, 0.06, 4, 10), 0x6B3A2A, { pos: [s * 0.08, 0.06, 0.12], parent: g });
    const tp = [[0, 0.12, -0.22], [0.2, 0.18, -0.35], [0.32, 0.4, -0.25]]; piece(tube(tp, 0.085, 20, 10), c1, { parent: g }); for (let i = 1; i < 4; i++) { const t = i / 4; piece(torus(0.085, 0.02, Math.PI * 2, 6, 14), C.butter, { noOutline: true, pos: [tp[0][0] * (1 - t) + tp[2][0] * t + (i === 2 ? 0.07 : 0), tp[0][1] * (1 - t) + tp[2][1] * t, tp[0][2] * (1 - t) + tp[2][2] * t - (i === 2 ? 0.07 : 0)], rot: [0.6, 0.6 + t, 0], parent: g }); }
    const h = G(); h.position.set(0, lie ? 0.24 : 0.48, lie ? 0.16 : 0.04); g.add(h); piece(sphere(0.2, 24, 16).scale(1.15, 0.92, 0.95), c1, { parent: h });
    for (const s of [-1, 1]) { piece(sphere(0.05, 10, 8).scale(1, 0.8, 0.5), C.white, { noOutline: true, pos: [s * 0.1, 0.06, 0.17], parent: h }); piece(sphere(0.07, 12, 8).scale(1, 1, 0.6), c1, { pos: [s * 0.14, 0.16, -0.02], parent: h }); piece(sphere(0.045, 10, 6).scale(1, 1, 0.5), C.white, { noOutline: true, pos: [s * 0.14, 0.16, 0.01], parent: h }); }
    piece(sphere(0.08, 12, 8).scale(1.2, 0.8, 0.8), C.white, { pos: [0, -0.07, 0.14], parent: h }); piece(sphere(0.022, 8, 6), C.navy, { pos: [0, -0.04, 0.21], parent: h }); eyes(h, 0.0, 0.18, sleep, happy, 0.08);
  }
  if (!sleep) { piece(torus(0.12, 0.02, Math.PI * 2, 8, 24), C.pink, { pos: [0, sp === 'canhcut' ? 0.44 : 0.35, 0.01], rot: [Math.PI / 2 - 0.15, 0, 0], parent: g, noOutline: sp === 'ech' }); }
  if (sleep) g.rotation.y = 0.4;
  return g;
}
export const jobs = {
  thu2: async () => { const out = [];
    for (const [sp, d] of Object.entries(SPECIES)) for (const col of Object.keys(d.colors)) for (const pose of ['ngoi', 'vui', 'nam']) {
      const s = makeScene('ngay', { shadowSize: 1.5, shadowBlur: 4, keyPos: [-2.2, 12, 0.9] }); s.add(shadowCatcher(3, 3)); const p = buildPet(sp, col, pose); p.rotation.y += Math.PI / 4; s.add(p);
      out.push({ file: `thu_${sp}_${col}_${pose}@3x.png`, data: shoot(s, isoCamera(512, 512, 380, [0, 0, 0], [0, 256 - 48])) }); }
    out.push({ file: 'thu2_meta', meta: Object.fromEntries(Object.entries(SPECIES).map(([k, v]) => [k, { name: v.name, colors: Object.fromEntries(Object.entries(v.colors).map(([c, a]) => [c, a[0]])) }])) });
    return out; }
};
