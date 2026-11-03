// Khu vườn (tab Khu vườn) — cùng khung 1170, cùng camera và ppm với các phòng.
// Nền: mảnh vườn có hàng rào, hai luống chữ L (10 ô cho hoa mỗi mùa hẹn hò), chậu lớn giữa vườn (cây chăm hằng ngày),
// kệ chậu đã nở, bảng gỗ ghi mùa, xích đu, hộp hạt giống, bình tưới. Cây và hoa do app đặt lên bằng ảnh hoa sẵn có.
import { THREE, C, piece, rbox, sphere, rcyl, lathe, torus, tube, leafGeo, makeScene, isoCamera, shoot, shadowCatcher, toPx, mat } from './lib.js';
import * as F from './furn.js';
const G = () => new THREE.Group();
const at = (o, x, y, z, ry = 0) => { o.position.set(x, y, z); o.rotation.y = ry; return o; };
const W = 1170, PPM = 112, GY = 0.12; // mặt cỏ

function sea(time, y) { const m = new THREE.Mesh(new THREE.CircleGeometry(14, 80), mat(time === 'dem' ? 0x34558F : C.sea)); m.rotation.x = -Math.PI / 2; m.position.y = y; m.receiveShadow = true; return m; }
function ripples(g, y) { for (let i = 0; i < 6; i++) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.4 + (i % 3) * 0.25, 0.025, 4, 30, Math.PI), mat(C.white, { basic: true, opacity: 0.5 })); r.rotation.x = Math.PI / 2; r.position.set(-2.4 + i * 1.2, y + 0.01, 3.9 - (i % 2) * 0.4); g.add(r); } }
function fence(len, axis = 'x') { const g = G(); const n = Math.round(len / 0.45); for (let i = 0; i <= n; i++) { const p = -len / 2 + i * len / n; piece(rbox(0.12, 0.55, 0.08, 0.03), C.white, { pos: axis === 'x' ? [p, 0.28, 0] : [0, 0.28, p], parent: g }); }
  for (const y of [0.18, 0.4]) piece(rbox(axis === 'x' ? len : 0.05, 0.06, axis === 'x' ? 0.05 : len, 0.02), C.white, { pos: [0, y, 0], parent: g }); return g; }
function lampPost(on) { const g = G(); piece(rcyl(0.05, 0.07, 1.6, 0.02, 10), C.white, { pos: [0, 0.8, 0], parent: g }); piece(sphere(0.16, 14, 10), on ? C.butter : C.white, { pos: [0, 1.72, 0], parent: g, emissive: on ? C.butter : 0, ei: on ? 1 : 0 }); piece(rcyl(0.12, 0.18, 0.08, 0.03, 12), C.sky, { pos: [0, 1.88, 0], parent: g }); return g; }
function tree(r = 0.8) { const g = G(); piece(rcyl(0.12, 0.17, 1.0, 0.05, 12), C.woodD, { pos: [0, 0.5, 0], parent: g });
  [[0, 1.45, 0, r], [0.4 * r, 1.2, 0.25 * r, r * 0.7], [-0.4 * r, 1.25, -0.1, r * 0.7], [0.1, 1.8, -0.2 * r, r * 0.6]].forEach(([x, y, z, rr]) => piece(sphere(rr, 18, 12), C.pinkL, { pos: [x, y, z], parent: g }));
  for (let i = 0; i < 9; i++) piece(sphere(0.06, 8, 6), C.white, { noOutline: true, pos: [Math.cos(i) * r * 0.85, 1.4 + Math.sin(i * 3) * 0.35, Math.sin(i) * r * 0.85], parent: g }); return g; }
function bush(r = 0.3, col = C.leafL) { const g = G(); piece(sphere(r, 14, 10).scale(1, 0.8, 1), col, { pos: [0, r * 0.7, 0], parent: g }); return g; }
function stone(r = 0.28) { const g = G(); piece(rcyl(r, r, 0.06, 0.03, 16), C.stone, { pos: [0, 0.03, 0], parent: g, cast: false }); return g; }
function tuft(col) { const g = G(); for (let i = 0; i < 4; i++) { const a = i * 1.6; piece(rcyl(0.01, 0.01, 0.22, 0.004, 4), C.leafD, { noOutline: true, pos: [Math.cos(a) * 0.1, 0.11, Math.sin(a) * 0.1], parent: g }); piece(sphere(0.055, 10, 8), col, { pos: [Math.cos(a) * 0.1, 0.24, Math.sin(a) * 0.1], parent: g }); } return g; }
function grass(g, x, z) { for (let i = 0; i < 3; i++) piece(leafGeo(0.2, 0.05, 0.02), C.grassD, { noOutline: true, pos: [x + i * 0.05, GY, z], rot: [-1.2 + i * 0.3, i * 2.1, 0], parent: g }); }
// luống gỗ dài: len theo trục x (axis 'x') hoặc z
function planter(len, axis) { const g = G(), w = 0.9, h = 0.4, sx = axis === 'x' ? len : w, sz = axis === 'x' ? w : len;
  piece(rbox(sx, h, sz, 0.06), C.wood, { pos: [0, h / 2, 0], parent: g, receive: true });
  const n = Math.round(len / 0.4); for (let i = 1; i < n; i++) { const p = -len / 2 + i * len / n; piece(new THREE.BoxGeometry(axis === 'x' ? 0.012 : 0.004, h * 0.8, axis === 'x' ? 0.004 : 0.012), C.woodD, { noOutline: true, cast: false, pos: axis === 'x' ? [p, h / 2, w / 2 + 0.002] : [w / 2 + 0.002, h / 2, p], parent: g }); }
  piece(rbox(sx - 0.14, 0.05, sz - 0.14, 0.02), C.earthD, { noOutline: true, pos: [0, h - 0.01, 0], parent: g, receive: true }); return g; }
function shelf() { const g = G(); // kệ hai tầng, mặt trước nhìn +x
  for (const z of [-0.68, 0.68]) for (const x of [-0.17, 0.17]) piece(rbox(0.06, 1.2, 0.06, 0.02), C.woodD, { pos: [x, 0.6, z], parent: g });
  for (const y of [0.42, 0.92]) piece(rbox(0.46, 0.06, 1.48, 0.02), C.wood, { pos: [0, y, 0], parent: g });
  piece(rbox(0.06, 0.18, 1.48, 0.02), C.wood, { pos: [-0.2, 1.17, 0], parent: g }); return g; }

const ITEMS = {
  binhtuoi(st) { const g = G(), can = G(); g.add(can);
    piece(lathe([[0, 0], [0.2, 0], [0.22, 0.04], [0.22, 0.3], [0.19, 0.34], [0, 0.34]], 24), C.sky, { parent: can });
    piece(rcyl(0.12, 0.12, 0.04, 0.015, 18), C.white, { pos: [0, 0.35, 0], parent: can });
    piece(tube([[0.18, 0.08, 0], [0.34, 0.24, 0], [0.48, 0.4, 0]], 0.03, 10, 8), C.sky, { parent: can });
    piece(rcyl(0.07, 0.035, 0.08, 0.01, 12), C.white, { pos: [0.51, 0.43, 0], rot: [0, 0, -0.75], parent: can });
    piece(torus(0.13, 0.025, Math.PI, 6, 16), C.navy, { pos: [-0.04, 0.34, 0], parent: can, noOutline: true });
    piece(sphere(0.05, 10, 8).scale(1.2, 0.7, 0.4), C.pink, { pos: [0, 0.18, 0.21], parent: can });
    if (st === 'tuoi') { can.rotation.z = -0.55; can.position.set(-0.2, 0, 0);
      for (let i = 0; i < 5; i++) { const d = sphere(0.035, 10, 8); d.scale(0.8, 1.4, 0.8); piece(d, 0x8EC8F5, { pos: [0.5 + i * 0.05 + (i % 2) * 0.04, 0.12 - i * 0.12, (i % 3 - 1) * 0.05], parent: g }); } }
    return g; },
  hopgiong(st) { const g = G(); piece(rbox(0.7, 0.36, 0.5, 0.05), C.woodD, { pos: [0, 0.18, 0], parent: g });
    for (const y of [0.1, 0.26]) piece(new THREE.BoxGeometry(0.71, 0.012, 0.004), C.woodDD, { noOutline: true, cast: false, pos: [0, y, 0.252], parent: g });
    piece(rbox(0.22, 0.12, 0.02, 0.02), C.white, { pos: [0, 0.2, 0.26], parent: g }); piece(sphere(0.025, 8, 6), C.leaf, { noOutline: true, pos: [0, 0.2, 0.275], parent: g });
    const pk = [[-0.2, C.pink], [-0.05, C.butter], [0.1, C.lilac], [0.22, C.sky]];
    if (st === 'mo') { const lid = piece(rbox(0.72, 0.05, 0.52, 0.02), C.wood, { parent: g }); lid.position.set(0, 0.5, -0.3); lid.rotation.x = -1.25;
      pk.forEach(([x, c], i) => { const p = G(); piece(rbox(0.13, 0.2, 0.025, 0.015), c, { pos: [0, 0.1, 0], parent: p }); piece(rbox(0.08, 0.06, 0.03, 0.01), C.white, { noOutline: true, pos: [0, 0.12, 0.005], parent: p }); p.position.set(x, 0.3, -0.05 + (i % 2) * 0.06); p.rotation.set(-0.15, 0, (i - 1.5) * 0.12); g.add(p); });
      [[0.32, 0.72, 0.1], [-0.3, 0.68, 0.15], [0.05, 0.85, 0.0]].forEach(p => { const s = new THREE.OctahedronGeometry(0.04, 0); s.scale(1, 1.6, 0.4); piece(s, C.butter, { pos: p, parent: g, emissive: C.butter, ei: 0.5 }); }); }
    else { piece(rbox(0.72, 0.05, 0.52, 0.02), C.wood, { pos: [0, 0.385, 0], parent: g }); piece(rbox(0.13, 0.2, 0.025, 0.015), C.pink, { pos: [0.24, 0.42, 0.16], rot: [-0.9, 0.3, 0], parent: g }); }
    return g; },
  ghe() { const g = G(); for (const s of [-1, 1]) { piece(rbox(0.1, 1.8, 0.1, 0.04), C.white, { pos: [s * 0.85, 0.9, 0], parent: g }); piece(rbox(0.09, 1.0, 0.09, 0.03), C.white, { pos: [s * 0.85, 0.45, 0.35], rot: [0.4, 0, 0], parent: g }); }
    piece(rbox(1.9, 0.1, 0.12, 0.04), C.white, { pos: [0, 1.8, 0], parent: g });
    for (const s of [-1, 1]) for (const z of [-0.1, 0.1]) piece(rcyl(0.012, 0.012, 1.1, 0.005, 4), C.navy, { noOutline: true, pos: [s * 0.55, 1.22, z], parent: g });
    piece(rbox(1.25, 0.08, 0.4, 0.04), C.pink, { pos: [0, 0.62, 0], parent: g }); piece(rbox(1.25, 0.32, 0.06, 0.03), C.pink, { pos: [0, 0.8, -0.18], rot: [-0.2, 0, 0], parent: g });
    for (let i = 0; i < 5; i++) { const h = G(); h.position.set(-0.6 + i * 0.3, 1.86, 0.05); g.add(h); piece(sphere(0.06, 10, 8), [C.pinkL, C.white, C.lilac, C.butter, C.pinkL][i], { parent: h }); piece(leafGeo(0.12, 0.05, 0.02), C.leaf, { pos: [0.05, -0.02, 0], rot: [-1, 1.2, 0], parent: h }); }
    return g; },
  ke() { return shelf(); },
  bang() { const g = G(); for (const s of [-1, 1]) piece(rbox(0.07, 1.25, 0.07, 0.02), C.woodD, { pos: [0, 0.62, s * 0.42], parent: g });
    piece(rbox(0.06, 0.62, 1.1, 0.04), C.wood, { pos: [0, 1.0, 0], parent: g }); piece(rbox(0.02, 0.5, 0.98, 0.02), 0xF6EAD6, { noOutline: true, pos: [0.035, 1.0, 0], parent: g });
    piece(sphere(0.06, 10, 8), C.pink, { pos: [0.04, 1.36, -0.5], parent: g }); piece(leafGeo(0.16, 0.06, 0.02), C.leaf, { pos: [0.04, 1.34, -0.45], rot: [-0.8, 1.6, 0], parent: g }); return g; }
};
const BANG = [2.55, 1.35]; // vị trí bảng (x, z) — mặt chữ nhìn +x
const SCENE = { id: 'khu_vuon', title: 'Khu vườn',
  base(g, t) { const night = t === 'dem';
    g.add(sea(t, -0.5)); ripples(g, -0.5);
    piece(rbox(6.4, 0.7, 6.4, 0.2), C.earth, { pos: [0, -0.35, 0], parent: g });
    piece(rbox(6.46, 0.14, 6.46, 0.07), C.grass, { pos: [0, 0.05, 0], parent: g, receive: true });
    // hàng rào hai cạnh sau
    g.add(at(fence(6.0, 'x'), 0, GY, -3.0)); g.add(at(fence(6.0, 'z'), -3.0, GY, 0));
    // hai luống chữ L
    g.add(at(planter(4.0, 'x'), 0.4, GY, -2.2)); g.add(at(planter(4.0, 'z'), -2.2, GY, 0.4));
    g.add(at(tree(0.75), -2.45, GY, -2.45));
    // chậu lớn giữa vườn trên bệ đá
    piece(rcyl(0.62, 0.66, 0.14, 0.05, 32), C.stone, { pos: [0.3, GY + 0.07, 0.3], parent: g, receive: true });
    const p = F.pot(C.pinkL, 0.42, 0.52, true); p.position.set(0.3, GY + 0.14, 0.3); p.rotation.y = Math.PI / 4; g.add(p);
    // lối đá
    [[2.55, 2.6, 0.3], [2.0, 2.05, 0.26], [1.45, 1.55, 0.28], [1.0, 1.1, 0.24]].forEach(([x, z, r]) => g.add(at(stone(r), x, GY, z)));
    g.add(at(lampPost(night || t === 'chieu'), 2.85, GY, -2.75));
    [[-1.3, 2.75, C.lilac], [0.9, 2.8, C.white], [2.85, -1.5, C.pinkL], [-0.6, -1.35, C.butter]].forEach(([x, z, c]) => g.add(at(tuft(c), x, GY, z)));
    g.add(at(bush(0.32), 2.85, GY, 2.85)); g.add(at(bush(0.26, C.leaf), -2.85, GY, 2.85));
    [[1.9, 0.4], [-0.8, 0.6], [0.6, -1.3], [2.3, -0.9], [-1.2, -1.4]].forEach(([x, z]) => grass(g, x, z));
    if (!night) { const b = G(); for (const s of [-1, 1]) piece(sphere(0.05, 8, 6).scale(1, 0.25, 1.4), C.white, { pos: [s * 0.05, 0, 0], rot: [0, 0, s * 0.5], parent: b }); at(b, 1.6, 1.6, -0.4); g.add(b); }
  },
  items: {
    binhtuoi: { st: ['nghi', 'tuoi'], place: (o, st) => st === 'tuoi' ? at(o, -0.12, GY + 0.82, 0.85, 0.93) : at(o, 1.35, GY, 0.95, 2.4), go: 'tuoi', label: 'Bình tưới: tưới cây hôm nay' },
    hopgiong: { st: ['dong', 'mo'], place: o => at(o, -1.2, GY, 0.0, Math.PI / 4), go: 'giong', label: 'Hộp hạt giống: lá thưởng cuối mùa' },
    ghe: { st: ['trong'], place: o => at(o, -0.55, GY, 2.45), go: 'xichdu', label: 'Xích đu: ngồi cạnh nhau' },
    ke: { st: ['trong'], place: o => at(o, 2.7, GY, -0.35), go: 'ke', label: 'Kệ chậu đã nở' },
    bang: { st: ['trong'], place: o => at(o, BANG[0], GY, BANG[1]), go: 'mua', label: 'Bảng mùa hẹn hò' }
  },
  spots: {
    cay: [[0.3, GY + 0.14 + 0.5, 0.3]],
    luong: [[-1.2, 0.52, -2.2], [-0.4, 0.52, -2.2], [0.4, 0.52, -2.2], [1.2, 0.52, -2.2], [2.0, 0.52, -2.2], [-2.2, 0.52, -1.2], [-2.2, 0.52, -0.4], [-2.2, 0.52, 0.4], [-2.2, 0.52, 1.2], [-2.2, 0.52, 2.0]],
    ke: [[2.7, GY + 0.95, -0.95], [2.7, GY + 0.95, -0.55], [2.7, GY + 0.95, -0.15], [2.7, GY + 0.95, 0.25], [2.7, GY + 0.45, -0.95], [2.7, GY + 0.45, -0.55], [2.7, GY + 0.45, -0.15], [2.7, GY + 0.45, 0.25]],
    dung: [[1.45, GY, -0.15], [-0.75, GY, 1.0]],
    ghe: [[-0.85, GY + 0.66, 2.45], [-0.25, GY + 0.66, 2.45]],
    giot: [[0.3, GY + 1.0, 0.3]]
  }
};
function build(time) {
  const s = makeScene(time, { shadowSize: 6, shadowBlur: 5 }); const base = G(); SCENE.base(base, time); s.add(base); const items = {};
  for (const [k, it] of Object.entries(SCENE.items)) { items[k] = {}; for (const st of it.st) { const o = ITEMS[k](st); it.place(o, st); o.visible = false; s.add(o); items[k][st] = o; } }
  s.userData = Object.assign(s.userData, { base, items }); return s;
}
const cam = () => isoCamera(W, W, PPM, [0, 0.6, 0]);
export const jobs = { khu_vuon: async () => {
  const out = [], id = SCENE.id;
  for (const t of ['sang', 'ngay', 'chieu', 'dem']) { const s = build(t); out.push({ file: `${id}_${t}@3x.png`, data: shoot(s, cam()) }); }
  const s = build('ngay'), c = cam(); s.userData.base.visible = false; s.add(shadowCatcher(7, 7, GY + 0.002));
  for (const [k, sts] of Object.entries(s.userData.items)) for (const [st, o] of Object.entries(sts)) { o.visible = true; out.push({ file: `${id}_${k}_${st}@3x.png`, data: shoot(s, c) }); o.visible = false; }
  const spots = {}; for (const [k, v] of Object.entries(SCENE.spots)) spots[k] = v.map(p => toPx(c, ...p));
  const [bx, bz] = BANG, fx = bx + 0.046, top = 1.25 + GY, bot = 0.75 + GY;
  spots.bangQuad = [[fx, top, bz + 0.49], [fx, top, bz - 0.49], [fx, bot, bz - 0.49], [fx, bot, bz + 0.49]].map(p => toPx(c, ...p));
  out.push({ file: `${id}_meta`, meta: { title: SCENE.title, ppm: PPM, size: [W, W], items: Object.fromEntries(Object.entries(SCENE.items).map(([k, it]) => [k, { st: it.st, go: it.go, label: it.label }])), spots } });
  return out;
} };

// Bản 12 dùng lại các món dựng sẵn này.
export { sea, ripples, fence, lampPost, tree, bush, stone, tuft, grass };
