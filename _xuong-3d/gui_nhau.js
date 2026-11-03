// Bản 12: tab Gửi nhau — "Góc gửi nhau". Cùng khung 1170, cùng camera và ppm với khu vườn.
// Ba vật chạm được, mỗi vật là một tab con: tủ lạnh nhắn nhủ, hộp thư (thư hẹn giờ), lọ ước mơ.
// Trạng thái vật đổi theo dữ liệu: giấy trên tủ lạnh, cờ hộp thư dựng lên khi có thư, sao trong lọ nhiều dần.
import { THREE, C, piece, rbox, sphere, rcyl, lathe, torus, tube, leafGeo, makeScene, isoCamera, shoot, shadowCatcher, toPx } from './lib.js';
import { sea, ripples, fence, lampPost, tree, bush, stone, tuft, grass } from './garden.js';
const G = () => new THREE.Group();
const at = (o, x, y, z, ry = 0) => { o.position.set(x, y, z); o.rotation.y = ry; return o; };
const W = 1170, PPM = 112, GY = 0.12, FACE = Math.PI / 4; // FACE: mặt trước hướng về camera
const MINT = 0xCDEFE3, MINTD = 0x9FD8C6;

const star = (r = 0.05) => { const s = new THREE.OctahedronGeometry(r, 0); s.scale(1, 1.5, 0.45); return s; };
let seed = 11; const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;

const ITEMS = {
  // Tủ lạnh: giấy nhớ dán trên cửa, càng nhiều tin càng nhiều giấy
  tulanh(st) { const g = G(); g.scale.setScalar(1.2);
    piece(rbox(0.9, 1.9, 0.75, 0.13), MINT, { pos: [0, 0.95, 0], parent: g });
    piece(rbox(0.86, 0.025, 0.02, 0.01, 1), MINTD, { noOutline: true, pos: [0, 1.3, 0.38], parent: g });          // khe cửa ngăn đá
    piece(rbox(0.04, 0.42, 0.05, 0.02), C.stoneD, { pos: [0.33, 1.58, 0.4], parent: g });                          // tay nắm trên
    piece(rbox(0.04, 0.55, 0.05, 0.02), C.stoneD, { pos: [0.33, 0.8, 0.4], parent: g });                           // tay nắm dưới
    for (const x of [-0.3, 0.3]) piece(rbox(0.12, 0.05, 0.12, 0.02), C.navy, { noOutline: true, pos: [x, 0.03, 0.2], parent: g });
    const notes = [[-0.2, 1.62, C.butter, 0.1, C.pink], [0.08, 1.52, C.petal, -0.12, C.leaf], [-0.18, 1.0, 0xD8EEFF, -0.06, C.butter], [0.14, 0.82, 0xE5DAFB, 0.14, C.sky],
      [-0.22, 0.62, C.petal, -0.1, C.pink], [0.1, 1.15, C.butter, 0.08, C.leaf], [-0.02, 0.4, 0xD8F3E2, 0.05, C.sky]];
    const n = st === 'trong' ? 0 : st === 'it' ? 3 : 7;
    notes.slice(0, n).forEach(([x, y, c, r, mc]) => { piece(rbox(0.24, 0.24, 0.012, 0.006, 1), c, { pos: [x, y, 0.385], rot: [0, 0, r], parent: g });
      for (const dy of [-0.03, 0.02]) piece(new THREE.BoxGeometry(0.15, 0.012, 0.004), C.navy, { noOutline: true, cast: false, pos: [x, y + dy, 0.394], rot: [0, 0, r], parent: g });
      piece(sphere(0.03, 10, 8).scale(1, 1, 0.6), mc, { pos: [x + Math.sin(r) * -0.1, y + 0.11, 0.4], parent: g }); });
    if (st !== 'trong') { const h = G(); h.position.set(0.18, 1.6, 0.4); h.scale.set(1, 1, 0.5); g.add(h);
      for (const s of [-1, 1]) piece(sphere(0.06, 12, 8).scale(1, 1.2, 0.7), C.pink, { pos: [s * 0.04, 0.03, 0], parent: h });
      piece(new THREE.ConeGeometry(0.095, 0.12, 12).rotateX(Math.PI), C.pink, { pos: [0, -0.04, 0], parent: h, noOutline: true }); }
    return g; },
  // Hộp thư: cờ dựng lên và thư thò ra khi có thư mới
  hopthu(st) { const g = G(); g.scale.setScalar(1.25);
    piece(rbox(0.14, 1.1, 0.14, 0.04), C.woodD, { pos: [0, 0.55, 0], parent: g });
    piece(rbox(0.5, 0.1, 0.5, 0.04), C.woodDD, { pos: [0, 0.05, 0], parent: g });
    const box = G(); box.position.set(0, 1.25, 0); g.add(box);
    piece(rbox(0.86, 0.5, 0.6, 0.2), C.pink, { pos: [0, 0, 0], parent: box });
    piece(rbox(0.88, 0.1, 0.62, 0.05), C.pinkD, { pos: [0, 0.27, 0], parent: box });
    piece(rbox(0.52, 0.08, 0.02, 0.02, 1), C.navy, { noOutline: true, pos: [0, 0.05, 0.305], parent: box });          // khe thư
    piece(sphere(0.045, 10, 8), C.butter, { pos: [0.3, -0.08, 0.31], parent: box });
    const flag = G(); flag.position.set(-0.45, -0.02, 0); box.add(flag);
    piece(rcyl(0.022, 0.022, 0.5, 0.01, 8), C.navy, { pos: [0, 0.22, 0], parent: flag });
    const pl = G(); pl.position.set(0, st === 'thu' ? 0.4 : 0.1, 0); flag.add(pl);
    piece(rbox(0.04, 0.2, 0.3, 0.015, 1), st === 'thu' ? C.butter : C.stoneD, { pos: [0, 0, 0.14], parent: pl });
    if (st === 'thu') {
      const env = G(); env.position.set(0.02, 0.1, 0.38); env.rotation.set(-0.5, 0, -0.08); box.add(env);
      piece(rbox(0.4, 0.28, 0.025, 0.012, 1), C.white, { parent: env });
      piece(new THREE.BoxGeometry(0.4, 0.012, 0.006), C.stoneD, { noOutline: true, cast: false, pos: [0, 0.04, 0.016], parent: env });
      for (const s of [-1, 1]) piece(sphere(0.04, 10, 8).scale(1, 1.2, 0.5), C.pink, { noOutline: true, pos: [s * 0.03, -0.02, 0.02], parent: env });
      for (let i = 0; i < 3; i++) piece(star(0.04), C.butter, { pos: [-0.38 + i * 0.5, 0.52 + (i % 2) * 0.12, 0.35], parent: box, emissive: C.butter, ei: 0.6, noOutline: true, cast: false }); }
    return g; },
  // Lọ ước mơ: sao bỏ vào lọ, nhiều ước mơ thì lọ đầy sao
  lo(st) { const g = G(); g.scale.setScalar(1.45);
    piece(rcyl(0.36, 0.42, 0.34, 0.05, 28), C.wood, { pos: [0, 0.17, 0], parent: g });
    for (const y of [0.1, 0.24]) piece(new THREE.TorusGeometry(0.4, 0.012, 4, 36).rotateX(Math.PI / 2), C.woodDD, { noOutline: true, cast: false, pos: [0, y, 0], parent: g });
    const jar = G(); jar.position.set(0, 0.34, 0); g.add(jar);
    const H = 0.8, R = 0.4, n = { it: 3, nua: 9, day: 17 }[st], cols = [C.butter, C.pinkL, C.butter, C.lilac, C.sky];
    seed = 23; for (let i = 0; i < n; i++) { const a = rnd() * 6.28, r = rnd() * (R - 0.14), y = 0.08 + (i / n) * H * 0.62 + rnd() * 0.04;
      piece(star(0.085), cols[i % cols.length], { pos: [Math.cos(a) * r, y, Math.sin(a) * r], rot: [rnd(), rnd() * 3, rnd() * 0.6], parent: jar, emissive: cols[i % cols.length], ei: 0.5 }); }
    const glass = lathe([[0, 0], [R - 0.05, 0], [R, 0.05], [R + 0.02, H * 0.5], [R - 0.02, H - 0.08], [R - 0.1, H - 0.02], [R - 0.1, H], [0, H]]);
    piece(glass, 0xD8EEFF, { opacity: 0.4, parent: jar, cast: false, noOutline: true });
    piece(torus(R - 0.1, 0.014, Math.PI * 2, 6, 36).rotateX(Math.PI / 2), C.navy, { noOutline: true, cast: false, pos: [0, H - 0.01, 0], parent: jar });
    piece(torus(R + 0.005, 0.012, Math.PI * 2, 6, 36).rotateX(Math.PI / 2), C.navy, { noOutline: true, cast: false, pos: [0, 0.04, 0], parent: jar });
    piece(new THREE.PlaneGeometry(0.05, H * 0.55), C.white, { noOutline: true, basic: true, opacity: 0.7, pos: [-0.14, H * 0.5, 0.33], rot: [0, -0.5, 0], parent: jar });
    const lid = G(); lid.position.set(0, H + 0.04, 0); jar.add(lid);
    piece(rcyl(R - 0.06, R - 0.06, 0.1, 0.04, 28), C.sky, { parent: lid });
    for (const s of [-1, 1]) piece(sphere(0.08, 14, 10).scale(1.2, 0.7, 0.55), C.pink, { pos: [s * 0.08, 0.09, 0.18], rot: [0, 0, s * 0.35], parent: lid });
    piece(sphere(0.04, 12, 8), C.pinkD, { pos: [0, 0.085, 0.19], parent: lid });
    return g; }
};
const SCENE = { id: 'gui_nhau', title: 'Góc gửi nhau',
  base(g, t) { const night = t === 'dem';
    g.add(sea(t, -0.5)); ripples(g, -0.5);
    piece(rbox(6.4, 0.7, 6.4, 0.2), C.earth, { pos: [0, -0.35, 0], parent: g });
    piece(rbox(6.46, 0.14, 6.46, 0.07), C.grass, { pos: [0, 0.05, 0], parent: g, receive: true });
    g.add(at(fence(6.0, 'x'), 0, GY, -3.0)); g.add(at(fence(6.0, 'z'), -3.0, GY, 0));
    g.add(at(tree(0.8), -2.5, GY, -2.5));
    // sân lát đá phía trước ba vật
    piece(rcyl(1.75, 1.8, 0.07, 0.03, 48), C.stone, { pos: [0.1, GY + 0.035, 0.1], parent: g, receive: true, cast: false });
    piece(new THREE.TorusGeometry(1.5, 0.018, 4, 64).rotateX(Math.PI / 2), C.stoneD, { noOutline: true, cast: false, pos: [0.1, GY + 0.075, 0.1], parent: g });
    [[2.0, 2.2, 0.26], [1.55, 1.8, 0.22]].forEach(([x, z, r]) => g.add(at(stone(r), x, GY, z)));
    // ghế dài
    const bench = G(); piece(rbox(1.3, 0.1, 0.42, 0.04), C.wood, { pos: [0, 0.46, 0], parent: bench });
    for (const s of [-1, 1]) piece(rbox(0.08, 0.42, 0.36, 0.03), C.woodD, { pos: [s * 0.55, 0.21, 0], parent: bench });
    piece(rbox(1.3, 0.36, 0.07, 0.03), C.wood, { pos: [0, 0.78, -0.2], rot: [-0.12, 0, 0], parent: bench });
    piece(rcyl(0.16, 0.16, 0.12, 0.05, 20), C.pinkL, { pos: [-0.3, 0.58, 0.02], parent: bench }); piece(rcyl(0.16, 0.16, 0.12, 0.05, 20), C.lilac, { pos: [0.3, 0.58, 0.02], parent: bench });
    g.add(at(bench, 2.35, GY, 0.75, FACE));
    g.add(at(lampPost(night || t === 'chieu'), 2.9, GY, 2.9));
    [[-1.2, 2.8, C.lilac], [0.9, 2.85, C.white], [2.85, 1.2, C.pinkL], [-2.6, 0.3, C.butter], [0.6, -2.7, C.pinkL]].forEach(([x, z, c]) => g.add(at(tuft(c), x, GY, z)));
    g.add(at(bush(0.32), 1.9, GY, 2.95)); g.add(at(bush(0.26, C.leaf), -2.85, GY, 2.85)); g.add(at(bush(0.3, C.leaf), 0.4, GY, -2.85));
    [[1.0, -0.2], [-1.3, 0.6], [0.2, 2.2], [2.3, -1.0], [-0.6, -1.9]].forEach(([x, z]) => grass(g, x, z));
    if (!night) { const p = G(); piece(new THREE.ConeGeometry(0.1, 0.42, 3).rotateX(Math.PI / 2), C.white, { parent: p }); piece(new THREE.BoxGeometry(0.34, 0.015, 0.2), C.sky2, { noOutline: true, pos: [0, -0.04, -0.04], parent: p }); at(p, 1.2, 2.1, 0.9, 2.2); p.rotation.z = 0.25; g.add(p); }
  },
  items: {
    tulanh: { st: ['trong', 'it', 'nhieu'], place: o => at(o, -1.7, GY, 1.7, FACE), go: 'tu-lanh', label: 'Tủ lạnh nhắn nhủ' },
    hopthu: { st: ['dong', 'thu'], place: o => at(o, 1.75, GY, -1.75, FACE), go: 'thu', label: 'Hộp thư hẹn giờ' },
    lo: { st: ['it', 'nua', 'day'], place: o => at(o, -0.55, GY, -0.55, FACE), go: 'uoc-mo', label: 'Lọ ước mơ' }
  },
  tags: { tulanh: [-1.7, GY + 2.5, 1.7], hopthu: [1.75, GY + 2.15, -1.75], lo: [-0.55, GY + 2.3, -0.55] },
  spots: { dung: [[1.8, GY + 0.06, 0.2], [0.2, GY + 0.06, 1.8]] }
};
function build(time) {
  const s = makeScene(time, { shadowSize: 6, shadowBlur: 5 }); const base = G(); SCENE.base(base, time); s.add(base); const items = {};
  for (const [k, it] of Object.entries(SCENE.items)) { items[k] = {}; for (const st of it.st) { const o = ITEMS[k](st); it.place(o, st); o.visible = false; s.add(o); items[k][st] = o; } }
  s.userData = Object.assign(s.userData, { base, items }); return s;
}
const cam = () => isoCamera(W, W, PPM, [0, 0.6, 0]);
// Nền không có ba vật; mỗi vật và mỗi trạng thái là một ảnh lớp riêng để app xếp lên.
export const jobs = { gui_nhau: async () => {
  const out = [], id = SCENE.id;
  for (const t of ['sang', 'ngay', 'chieu', 'dem']) {
    const s = build(t);
    out.push({ file: `${id}_${t}@3x.png`, data: shoot(s, cam()) }); }
  const s = build('ngay'), c = cam(); s.userData.base.visible = false; s.add(shadowCatcher(7, 7, GY + 0.002));
  for (const [k, sts] of Object.entries(s.userData.items)) for (const [st, o] of Object.entries(sts)) { o.visible = true; out.push({ file: `${id}_${k}_${st}@3x.png`, data: shoot(s, c) }); o.visible = false; }
  const spots = {}; for (const [k, v] of Object.entries(SCENE.spots)) spots[k] = v.map(p => toPx(c, ...p));
  spots.tag = Object.fromEntries(Object.entries(SCENE.tags).map(([k, p]) => [k, toPx(c, ...p)]));
  out.push({ file: `${id}_meta`, meta: { title: SCENE.title, ppm: PPM, size: [W, W], items: Object.fromEntries(Object.entries(SCENE.items).map(([k, it]) => [k, { st: it.st, go: it.go, label: it.label }])), spots } });
  return out;
} };
