// Quán cà phê ven biển + bến thuyền (mục 7 của brief), cùng khung 1170 như các phòng.
import { THREE, C, piece, rbox, sphere, capsule, rcyl, lathe, torus, tube, leafGeo, makeScene, isoCamera, shoot, shadowCatcher, toPx, mat } from './lib.js';
import * as RG from './rig.js';
const G = () => new THREE.Group();
const at = (o, x, y, z, ry = 0) => { o.position.set(x, y, z); o.rotation.y = ry; return o; };
const W = 1170, PPM = 112;

function fullChar(who, pose) { const g = G(), L = RG.DEFAULT_LOOK[who];
  g.add(RG.layer('than', null, pose)); g.add(RG.layer('quan', L.bot, pose)); g.add(RG.layer('ao', L.top, pose)); g.add(RG.layer('mat', who === 'anh' ? 'cuoi' : 'vui', pose));
  g.add(RG.layer('toc', { style: L.hair, color: L.hc }, pose)); if (L.acc !== 'khong') g.add(RG.layer('phukien', L.acc, pose)); return g; }
function sea(time, y = -0.35) { const m = new THREE.Mesh(new THREE.CircleGeometry(14, 80), mat(time === 'dem' ? 0x34558F : C.sea)); m.rotation.x = -Math.PI / 2; m.position.y = y; m.receiveShadow = true; return m; }
function ripples(g, y) { for (let i = 0; i < 6; i++) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.4 + (i % 3) * 0.25, 0.025, 4, 30, Math.PI), mat(C.white, { basic: true, opacity: 0.5 })); r.rotation.x = Math.PI / 2; r.position.set(-2 + i * 1.1, y + 0.01, 2.2 - (i % 2) * 3.4); g.add(r); } }
function stool() { const g = G(); piece(rcyl(0.2, 0.2, 0.08, 0.03, 18), C.pink, { pos: [0, 0.78, 0], parent: g }); piece(rcyl(0.035, 0.035, 0.75, 0.01, 8), C.navy, { pos: [0, 0.38, 0], parent: g }); piece(torus(0.13, 0.015, Math.PI * 2, 6, 18), C.navy, { pos: [0, 0.3, 0], rot: [Math.PI / 2, 0, 0], parent: g }); piece(rcyl(0.16, 0.18, 0.03, 0.01, 16), C.navy, { pos: [0, 0.015, 0], parent: g }); return g; }
function cups() { const g = G(); piece(rcyl(0.07, 0.055, 0.2, 0.02, 14), 0xE8D2B8, { pos: [0, 0.1, 0], parent: g }); piece(rcyl(0.075, 0.075, 0.03, 0.01, 14), C.pink, { pos: [0, 0.21, 0], parent: g }); piece(rcyl(0.01, 0.01, 0.14, 0.004, 6), C.pinkD, { noOutline: true, pos: [0.02, 0.28, 0], parent: g });
  piece(rcyl(0.07, 0.06, 0.13, 0.02, 14), C.white, { pos: [0.22, 0.065, 0.05], parent: g }); piece(torus(0.04, 0.012, Math.PI * 2, 6, 12), C.white, { pos: [0.3, 0.07, 0.05], parent: g }); piece(rcyl(0.06, 0.06, 0.01, 0.003, 12), C.woodD, { noOutline: true, pos: [0.22, 0.13, 0.05], parent: g });
  piece(rcyl(0.06, 0.05, 0.18, 0.02, 14), C.butter, { opacity: 0.9, pos: [-0.2, 0.09, 0.06], parent: g }); piece(sphere(0.04, 8, 6).scale(1, 0.5, 1), C.orange, { pos: [-0.2, 0.19, 0.06], parent: g }); return g; }

const ITEMS = {
  quay(st) { const g = G(); piece(rbox(2.4, 1.0, 0.8, 0.06), C.wood, { pos: [0, 0.5, 0], parent: g }); for (let i = 0; i < 6; i++) piece(rbox(0.02, 0.9, 0.02, 0.01), C.woodD, { noOutline: true, pos: [-1.0 + i * 0.4, 0.5, 0.41], parent: g });
    piece(rbox(2.5, 0.08, 0.95, 0.03), C.white, { pos: [0, 1.04, 0], parent: g });
    for (const s of [-1, 1]) { piece(rbox(0.08, 2.4, 0.08, 0.03), C.white, { pos: [s * 1.2, 1.2, 0.5], parent: g }); piece(rbox(0.08, 2.5, 0.08, 0.03), C.white, { pos: [s * 1.2, 1.25, -0.45], parent: g }); }
    for (let i = 0; i < 8; i++) piece(rbox(0.32, 0.06, 1.35, 0.02), i % 2 ? C.white : C.sky, { pos: [-1.12 + i * 0.32, 2.5, 0.2], rot: [-0.25, 0, 0], parent: g });
    for (let i = 0; i < 8; i++) piece(sphere(0.07, 10, 8).scale(1, 1, 0.4), i % 2 ? C.white : C.sky, { pos: [-1.12 + i * 0.32, 2.3, 0.86], parent: g, noOutline: true });
    piece(rbox(2.3, 0.9, 0.06, 0.03), C.white, { pos: [0, 1.6, -0.47], parent: g, emissive: C.white, ei: 0.2 });
    if (st === 'dong') for (let i = 0; i < 8; i++) piece(rbox(0.3, 1.25, 0.05, 0.02), i % 2 ? C.white : C.sky, { pos: [-1.05 + i * 0.3, 1.7, 0.5], parent: g });
    else { const c = cups(); c.position.set(0.55, 1.08, 0.1); g.add(c); for (let i = 0; i < 3; i++) piece(rbox(0.3, 0.04, 0.2, 0.02), C.white, { pos: [-0.4 + i * 0.35, 1.5, -0.38], parent: g }); }
    return g; },
  hu(st) { const g = G(), H = 0.8, R = 0.3, n = st === 'day' ? 30 : 9; const cols = [C.pink, C.leaf, C.sky, C.butter, C.lilac, C.orange];
    for (let i = 0; i < n; i++) piece(rbox(0.16, 0.035, 0.09, 0.015, 2), cols[i % 6], { noOutline: true, pos: [Math.cos(i * 2.3) * 0.15, 0.06 + i / 30 * H * 0.85, Math.sin(i * 2.3) * 0.15], rot: [i * 0.7, i * 1.3, i * 0.4], parent: g });
    piece(lathe([[0, 0], [R - 0.05, 0], [R, 0.05], [R + 0.01, H * 0.5], [R - 0.02, H - 0.08], [R - 0.08, H - 0.02], [R - 0.08, H], [0, H]]), 0xBFE3FA, { opacity: 0.38, parent: g, cast: false });
    piece(rcyl(R - 0.04, R - 0.04, 0.1, 0.04, 24), C.sky, { pos: [0, H + 0.04, 0], parent: g }); for (const s of [-1, 1]) piece(sphere(0.08, 12, 8).scale(1.2, 0.7, 0.5), C.pink, { pos: [s * 0.09, H + 0.12, 0.18], parent: g });
    return g; },
  menu() { const g = G(); for (const s of [-1, 1]) piece(rbox(0.06, 1.3, 0.06, 0.02), C.woodD, { pos: [s * 0.38, 0.65, 0], rot: [0.12, 0, 0], parent: g }); piece(rbox(0.86, 1.0, 0.06, 0.04), C.woodD, { pos: [0, 0.75, 0.03], rot: [0.12, 0, 0], parent: g }); piece(rbox(0.74, 0.88, 0.04, 0.01), 0x2F4A3F, { noOutline: true, pos: [0, 0.75, 0.07], rot: [0.12, 0, 0], parent: g }); return g; },
  ghe() { const g = G(); const a = stool(); a.position.set(-0.4, 0, 0); g.add(a); const b = stool(); b.position.set(0.4, 0, 0); g.add(b); return g; },
  thuyen(st) { const g = G(); piece(lathe([[0, -0.3], [0.55, -0.25], [0.72, 0.0], [0.74, 0.06], [0, 0.06]]).scale(1, 1, 1.9), C.white, { pos: [0, 0.3, 0], parent: g }); piece(rbox(1.25, 0.06, 2.4, 0.03), C.sky, { pos: [0, 0.35, 0], parent: g, noOutline: true }); for (const z of [-0.45, 0.45]) piece(rbox(1.25, 0.08, 0.28, 0.03), C.wood, { pos: [0, 0.38, z], parent: g });
    if (st === 'cheo') { const a = fullChar('anh', 'ngoi'); a.position.set(0, 0.42, 0.55); a.rotation.y = 0; g.add(a); const e = fullChar('em', 'ngoi'); e.position.set(0, 0.42, -0.35); e.rotation.y = 0; g.add(e);
      for (const s of [-1, 1]) piece(rbox(0.05, 0.05, 1.4, 0.02), C.woodD, { pos: [s * 0.75, 0.55, 0.45], rot: [0.5, s * 0.5, 0], parent: g });
      for (let i = 0; i < 3; i++) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.4 + i * 0.25, 0.025, 4, 30, Math.PI), mat(C.white, { basic: true, opacity: 0.6 - i * 0.15 })); r.rotation.x = Math.PI / 2; r.position.set(0, 0.0, 1.2 + i * 0.25); g.add(r); } }
    else { piece(tube([[0.6, 0.4, -1.1], [0.9, 0.3, -1.4], [1.2, 0.55, -1.6]], 0.02, 10, 5), 0xE8D2B8, { noOutline: true, parent: g }); }
    return g; },
  denlong(st) { const g = G(); piece(rcyl(0.05, 0.06, 1.6, 0.02, 10), C.woodD, { pos: [0, 0.8, 0], parent: g }); piece(rbox(0.4, 0.05, 0.05, 0.02), C.woodD, { pos: [0.18, 1.55, 0], parent: g }); piece(rbox(0.26, 0.32, 0.26, 0.08), C.butter, { pos: [0.32, 1.3, 0], parent: g, emissive: C.butter, ei: st === 'sang' ? 1 : 0.15 }); return g; }
};
const SCENES = {
  quan_ca_phe: { title: 'Quán cà phê ven biển',
    base(g, t) { piece(rbox(6.2, 0.5, 6.2, 0.15), C.sand, { pos: [0, -0.25, 0], parent: g, receive: true }); piece(rbox(5.0, 0.12, 4.0, 0.04), C.wood, { pos: [-0.3, 0.06, -0.6], parent: g, receive: true }); for (let i = 1; i < 10; i++) piece(new THREE.BoxGeometry(0.015, 0.004, 4.0), C.woodD, { noOutline: true, pos: [-2.8 + i * 0.5, 0.122, -0.6], parent: g, cast: false });
      g.add(sea(t, -0.45)); ripples(g, -0.45); for (const [x, z] of [[2.3, 2.3], [2.6, -2.2], [-2.5, 2.4]]) { const p = G(); piece(rcyl(0.06, 0.09, 1.4, 0.02, 8), C.woodD, { pos: [0, 0.7, 0], rot: [0, 0, 0.15], parent: p }); for (let i = 0; i < 6; i++) piece(leafGeo(0.7, 0.16, 0.03), C.leaf, { pos: [0.1, 1.4, 0], rot: [-0.25, i * 1.05, 0], parent: p }); p.position.set(x, 0, z); g.add(p); }
      piece(sphere(0.25, 12, 8).scale(1, 0.4, 1), C.pinkL, { pos: [2.0, 0.05, 0.9], parent: g }); piece(torus(0.25, 0.05, Math.PI * 2, 8, 20), C.butter, { pos: [1.6, 0.06, 1.8], rot: [Math.PI / 2, 0, 0], parent: g }); },
    items: { quay: { st: ['mo', 'dong'], place: o => at(o, -0.6, 0.12, -1.6), go: 'hom-nay', label: 'Quầy cà phê: vào khu trò chơi' }, hu: { st: ['day', 'voi'], place: o => at(o, -1.35, 1.2, -1.6), go: 'hom-nay', label: 'Hũ thẻ hẹn hò to: bốc thẻ' },
      menu: { st: ['trong'], place: o => at(o, 1.6, 0.12, -1.2, 0.55), go: 'menu', label: 'Bảng menu: tất cả các trò' }, ghe: { st: ['thuong'], place: o => at(o, -0.5, 0.12, -0.6), go: 'ngoi', label: 'Hai ghế cao' } },
    spots: { dung: [[0.6, 0.12, 0.6], [1.6, 0.12, 0.1]], ghe: [[-0.9, 0.9, -0.6], [-0.1, 0.9, -0.6]], menu: [[1.5, 0.82, -1.24]] } },
  ben_thuyen: { title: 'Bến thuyền',
    base(g, t) { g.add(sea(t, -0.2)); ripples(g, -0.2); piece(rbox(3.2, 0.6, 2.2, 0.2), C.grassD, { pos: [-1.6, -0.1, -2.2], parent: g, receive: true }); piece(rbox(3.2, 0.06, 2.2, 0.03), C.grass, { noOutline: true, pos: [-1.6, 0.21, -2.2], parent: g });
      for (let i = 0; i < 12; i++) piece(rbox(1.4, 0.12, 0.36, 0.03), i % 2 ? C.wood : 0xE0BE92, { pos: [0.4, 0.15, -2.6 + i * 0.4], parent: g, receive: true });
      for (const s of [-1, 1]) for (const z of [-2.2, -0.6, 1.0, 2.0]) piece(rcyl(0.08, 0.08, 1.0, 0.03, 10), C.woodD, { pos: [0.4 + s * 0.68, -0.2, z], parent: g });
      piece(rcyl(0.1, 0.1, 0.4, 0.03, 10), C.woodD, { pos: [1.15, 0.38, 1.6], parent: g }); piece(torus(0.12, 0.025, Math.PI * 2, 6, 14), 0xE8D2B8, { pos: [1.15, 0.45, 1.6], rot: [Math.PI / 2, 0, 0], parent: g });
      const isl = G(); piece(rbox(1.6, 0.5, 1.6, 0.2), C.earth, { pos: [0, -0.1, 0], parent: isl }); piece(rbox(1.65, 0.12, 1.65, 0.06), C.grass, { pos: [0, 0.2, 0], parent: isl }); piece(rcyl(0.18, 0.2, 0.7, 0.05, 12), C.white, { pos: [-0.2, 0.6, -0.2], parent: isl }); piece(new THREE.ConeGeometry(0.24, 0.35, 12), C.pink, { pos: [-0.2, 1.1, -0.2], parent: isl }); isl.position.set(3.0, 0, 3.4); isl.scale.setScalar(0.7); g.add(isl); },
    items: { thuyen: { st: ['dau', 'cheo'], place: o => at(o, -1.05, -0.2, 1.1, 0.08), go: 'cheo', label: 'Thuyền: chèo sang đảo vương quốc' }, denlong: { st: ['tat', 'sang'], place: o => at(o, 1.0, 0.2, 2.2), go: 'den', label: 'Đèn lồng' } },
    spots: { dung: [[0.3, 0.21, -0.4], [0.6, 0.21, 0.6]] } }
};
function build(id, time) {
  const R = SCENES[id], s = makeScene(time, { shadowSize: 6, shadowBlur: 5 }); const base = G(); R.base(base, time); s.add(base); const items = {};
  for (const [k, it] of Object.entries(R.items)) { items[k] = {}; for (const st of it.st) { const o = ITEMS[k](st); it.place(o); o.visible = false; s.add(o); items[k][st] = o; } }
  s.userData = Object.assign(s.userData, { base, items }); return s;
}
const cam = () => isoCamera(W, W, PPM, [0, 0.9, 0]);
export const jobs = Object.fromEntries(Object.keys(SCENES).map(id => [id, async () => {
  const out = [], R = SCENES[id];
  for (const t of ['sang', 'ngay', 'chieu', 'dem']) { const s = build(id, t); if (id === 'ben_thuyen' && t === 'dem') {} out.push({ file: `${id}_${t}@3x.png`, data: shoot(s, cam()) }); }
  const s = build(id, 'ngay'), c = cam(); s.userData.base.visible = false; const f = shadowCatcher(7, 7, id === 'ben_thuyen' ? 0.215 : 0.125); s.add(f);
  for (const [k, sts] of Object.entries(s.userData.items)) for (const [st, o] of Object.entries(sts)) { o.visible = true; out.push({ file: `${id}_${k}_${st}@3x.png`, data: shoot(s, c) }); o.visible = false; }
  const spots = {}; for (const [k, v] of Object.entries(R.spots)) spots[k] = v.map(p => toPx(c, ...p));
  out.push({ file: `${id}_meta`, meta: { title: R.title, ppm: PPM, size: [W, W], items: Object.fromEntries(Object.entries(R.items).map(([k, it]) => [k, { st: it.st, go: it.go, label: it.label }])), spots } });
  return out;
}]));
