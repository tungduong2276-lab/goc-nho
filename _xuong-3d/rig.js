// Nhân vật phối đồ theo lớp (mục 4 của brief): mỗi bộ phận là một lớp PNG riêng,
// render cùng khung, cùng tư thế, đã bị che khuất sẵn bởi một "ma-nơ-canh" vô hình.
// Ghép trong app theo thứ tự: than → quan → ao → mat → toc → mu → phukien.
import { THREE, C, piece, rbox, sphere, capsule, rcyl, lathe, torus, tube, leafGeo, mat } from './lib.js';

export const HEAD_R = 0.25, HIP = 0.30, NECK = 0.58;
const SKIN = C.skin;
const OCC = new THREE.MeshBasicMaterial({ colorWrite: false });
let MODE = 'show'; // 'show' | 'occ'
function P(geo, color, o = {}) {
  if (MODE === 'occ') { const g = piece(geo, 0, Object.assign({}, o, { material: OCC, noOutline: true, cast: false })); g.traverse(m => { if (m.isMesh) m.renderOrder = -10; }); return g; }
  return piece(geo, color, o);
}

export const HAIR_COLORS = { dennau: ['Đen nâu', 0x4B3A3A], hatde: ['Nâu hạt dẻ', 0x8A5A3C], nausua: ['Nâu sữa', 0xC9A27E], hongphan: ['Hồng phấn', 0xFFB6CF], xanhpastel: ['Xanh pastel', 0x9CCFF0] };
export const HAIRS = { nganxu: 'Ngắn xù', maibang: 'Mái bằng', buocduoi: 'Buộc đuôi', buicao: 'Búi cao', daixoa: 'Dài xõa', xoan: 'Xoăn' };
export const TOPS = { hoodie: 'Hoodie', aolen: 'Áo len cổ lọ', aothun: 'Áo thun', vayyem: 'Váy yếm', aomua: 'Áo mưa vàng', dongu: 'Đồ ngủ', tapde: 'Tạp dề làm bếp', aodai: 'Áo dài', aonoel: 'Áo Noel', dolamvuon: 'Đồ làm vườn' };
export const BOTS = { quandai: 'Quần dài', short: 'Quần short', quanyem: 'Quần yếm', depbong: 'Dép bông', ungmua: 'Ủng mưa', giayvai: 'Giày vải', chantran: 'Chân trần' };
export const HATS = { khong: 'Không đội', mulen: 'Mũ len tai gấu', murom: 'Mũ rơm', mubep: 'Mũ đầu bếp', musinhnhat: 'Mũ sinh nhật', munoel: 'Mũ Noel', noto: 'Nơ to' };
export const ACCS = { khong: 'Không', kinh: 'Kính tròn', tainghe: 'Tai nghe', khan: 'Khăn quàng', tui: 'Túi đeo chéo', binhtuoi: 'Bình tưới', cove: 'Cọ vẽ', sach: 'Sách', trasua: 'Cốc trà sữa', kepla: 'Kẹp tóc lá' };
export const EXPRS = { vui: 'Vui', cuoi: 'Cười to', ngung: 'Ngượng', nho: 'Nhớ', doi: 'Dỗi', ngac: 'Ngạc nhiên', buonngu: 'Buồn ngủ', ngu: 'Ngủ' };
export const POSES = ['dung', 'vaytay', 'ngoi'];

// ---------- khung xương: vị trí tay chân theo tư thế ----------
function rig(pose) {
  const R = { root: new THREE.Group(), pose };
  const g = R.root;
  R.head = new THREE.Group(); R.head.position.set(0, NECK + HEAD_R * 0.9, 0); g.add(R.head);
  R.arms = [-1, 1].map(side => {
    const a = new THREE.Group(); a.position.set(side * 0.155, NECK - 0.07, 0); g.add(a);
    let rz = side * 0.32, rx = 0;
    if (pose === 'vaytay' && side === 1) { rz = 2.2; rx = -0.95; }
    if (pose === 'ngoi') { rx = -0.7; rz = side * 0.2; }
    a.rotation.set(rx, 0, rz); a.userData.side = side; return a;
  });
  R.legs = [-1, 1].map(side => { const l = new THREE.Group(); l.position.set(side * 0.07, HIP - 0.02, 0); if (pose === 'ngoi') l.rotation.x = -1.45; g.add(l); return l; });
  if (pose === 'ngoi') g.position.y = -0.2;
  return R;
}
const HAND = [0, -0.21, 0];

// ---------- các lớp ----------
// thân trần: đầu, tay, chân (màu da)
function base(R) {
  const h = sphere(HEAD_R, 32, 20); h.scale(1.05, 0.95, 0.95); P(h, SKIN, { parent: R.head });
  for (const s of [-1, 1]) P(sphere(0.045, 12, 8).scale(0.6, 1, 0.8), SKIN, { pos: [s * 0.262, -0.02, -0.01], parent: R.head }); // tai
  P(rcyl(0.06, 0.07, 0.08, 0.02, 14), SKIN, { pos: [0, NECK - 0.02, 0], parent: R.root });
  R.arms.forEach(a => { P(capsule(0.045, 0.14, 4, 12), SKIN, { pos: [0, -0.1, 0], parent: a }); P(sphere(0.052, 14, 10), SKIN, { pos: HAND, parent: a }); });
  R.legs.forEach(l => { P(capsule(0.052, 0.12, 4, 12), SKIN, { pos: [0, -0.1, 0], parent: l }); P(sphere(0.06, 14, 10).scale(1, 0.65, 1.3), SKIN, { pos: [0, -0.205, 0.02], parent: l }); });
  P(rbox(0.25, 0.32, 0.18, 0.08), SKIN, { pos: [0, NECK - 0.17, 0], parent: R.root }); // thân
}
// khối thân "dày nhất" dùng để che tóc phía sau
function bulk(R) {
  P(rbox(0.33, 0.3, 0.24, 0.1), 0, { pos: [0, NECK - 0.14, 0], parent: R.root });
  R.arms.forEach(a => P(capsule(0.06, 0.14, 4, 10), 0, { pos: [0, -0.1, 0], parent: a }));
  P(lathe([[0, -0.22], [0.2, -0.22], [0.13, 0]]), 0, { pos: [0, NECK - 0.15, 0], parent: R.root });
}
function sleeves(R, col, len = 'dai', cuff = null) {
  R.arms.forEach(a => {
    if (len === 'dai') P(capsule(0.054, 0.14, 4, 12), col, { pos: [0, -0.1, 0], parent: a });
    else P(capsule(0.056, 0.05, 4, 12), col, { pos: [0, -0.04, 0], parent: a });
    if (cuff) P(torus(0.05, 0.016, Math.PI * 2, 6, 16), cuff, { pos: [0, -0.17, 0], rot: [Math.PI / 2, 0, 0], parent: a });
  });
}
function torsoBox(R, col, h = 0.27, w = 0.31) { P(rbox(w, h, 0.22, 0.09), col, { pos: [0, NECK - 0.135, 0], parent: R.root }); }
function skirt(R, col, len = 0.215, flare = 0.2) { P(lathe([[0, -len], [flare - 0.01, -len], [flare + 0.005, -len + 0.015], [flare, -len + 0.045], [0.135, 0.02], [0.13, 0], [0, 0]]), col, { pos: [0, NECK - 0.15, 0], parent: R.root }); }

const TOP = {
  hoodie(R) { torsoBox(R, C.white); sleeves(R, C.white);
    P(rbox(0.13, 0.06, 0.03, 0.015), C.sky2, { pos: [0, NECK - 0.21, 0.11], parent: R.root });
    const hood = sphere(0.14, 18, 12); hood.scale(1.25, 0.8, 0.8); P(hood, C.sky, { pos: [0, NECK - 0.02, -0.11], parent: R.root });
    for (const s of [-1, 1]) P(tube([[s * 0.035, NECK - 0.03, 0.105], [s * 0.04, NECK - 0.12, 0.12]], 0.008, 6, 6), C.sky, { noOutline: true, parent: R.root }); },
  aolen(R) { torsoBox(R, C.pinkL); sleeves(R, C.pinkL, 'dai', C.pinkL);
    P(rcyl(0.085, 0.09, 0.08, 0.03, 18), C.pinkL, { pos: [0, NECK + 0.005, 0], parent: R.root });
    for (let i = -1; i <= 1; i++) P(rbox(0.018, 0.22, 0.01, 0.005, 1), 0xFF9DC2, { noOutline: true, pos: [i * 0.07, NECK - 0.14, 0.111], parent: R.root }); },
  aothun(R) { torsoBox(R, C.leafL, 0.25, 0.29); sleeves(R, C.leafL, 'ngan');
    P(sphere(0.05, 14, 10).scale(1, 0.9, 0.3), C.white, { noOutline: true, pos: [0, NECK - 0.13, 0.112], parent: R.root }); },
  vayyem(R) { P(rbox(0.27, 0.2, 0.2, 0.08), C.leafL, { pos: [0, NECK - 0.1, 0], parent: R.root }); sleeves(R, C.leafL, 'ngan'); skirt(R, C.pink);
    P(rbox(0.2, 0.12, 0.05, 0.02), C.pink, { pos: [0, NECK - 0.09, 0.085], parent: R.root });
    for (const s of [-1, 1]) { P(rbox(0.035, 0.12, 0.03, 0.012), C.pink, { pos: [s * 0.075, NECK - 0.05, 0.095], parent: R.root }); P(sphere(0.018, 10, 8), C.white, { pos: [s * 0.075, NECK - 0.035, 0.115], parent: R.root }); } },
  aomua(R) { torsoBox(R, C.butter, 0.3, 0.33); sleeves(R, C.butter); skirt(R, C.butter, 0.12, 0.19);
    const hood = sphere(0.15, 18, 12); hood.scale(1.25, 0.8, 0.8); P(hood, C.butterD, { pos: [0, NECK - 0.02, -0.11], parent: R.root });
    for (let i = 0; i < 3; i++) P(sphere(0.016, 8, 6), C.navy, { noOutline: true, pos: [0, NECK - 0.07 - i * 0.07, 0.115], parent: R.root }); },
  dongu(R) { torsoBox(R, C.sky2); sleeves(R, C.sky2, 'dai', C.white);
    [[-0.08, 0.05], [0.07, 0.0], [-0.03, -0.09], [0.09, -0.1], [0.0, 0.08]].forEach(([x, y]) => P(sphere(0.016, 8, 6), C.white, { noOutline: true, pos: [x, NECK - 0.13 + y, 0.112], parent: R.root }));
    P(torus(0.08, 0.016, Math.PI, 6, 14), C.white, { pos: [0, NECK - 0.02, 0.06], rot: [-0.5, 0, Math.PI], parent: R.root }); },
  tapde(R) { torsoBox(R, C.white, 0.26, 0.29); sleeves(R, C.white, 'ngan');
    P(rbox(0.22, 0.3, 0.03, 0.03), C.pink, { pos: [0, NECK - 0.2, 0.115], parent: R.root }); P(rbox(0.1, 0.06, 0.015, 0.01), C.petal, { pos: [0, NECK - 0.26, 0.132], parent: R.root });
    P(torus(0.13, 0.012, Math.PI * 2, 6, 24), C.pink, { pos: [0, NECK - 0.13, 0], rot: [Math.PI / 2, 0, 0], parent: R.root }); },
  aodai(R) { torsoBox(R, C.pink, 0.27, 0.27); sleeves(R, C.pink); P(rcyl(0.07, 0.08, 0.07, 0.02, 16), C.pink, { pos: [0, NECK, 0], parent: R.root });
    for (const z of [1, -1]) P(rbox(0.22, 0.34, 0.03, 0.03), C.pink, { pos: [0, NECK - 0.38, z * 0.07], parent: R.root });
    P(sphere(0.02, 8, 6), C.butter, { pos: [0.06, NECK - 0.05, 0.11], parent: R.root }); },
  aonoel(R) { torsoBox(R, C.pinkD); sleeves(R, C.pinkD, 'dai', C.white);
    P(rbox(0.32, 0.05, 0.23, 0.025), C.white, { pos: [0, NECK - 0.27, 0], parent: R.root }); P(rbox(0.04, 0.27, 0.01, 0.01), C.white, { noOutline: true, pos: [0, NECK - 0.135, 0.112], parent: R.root });
    for (let i = 0; i < 3; i++) P(sphere(0.015, 8, 6), C.butter, { noOutline: true, pos: [0.03, NECK - 0.06 - i * 0.06, 0.12], parent: R.root }); },
  dolamvuon(R) { torsoBox(R, C.white, 0.26); sleeves(R, C.white, 'ngan'); P(rbox(0.3, 0.27, 0.23, 0.09), C.leaf, { pos: [0, NECK - 0.16, 0], scale: [1, 0.8, 1], parent: R.root });
    P(rbox(0.1, 0.07, 0.02, 0.01), C.leafD, { pos: [0.06, NECK - 0.2, 0.12], parent: R.root }); P(leafGeo(0.06, 0.03, 0.01), C.leafL, { pos: [0.06, NECK - 0.15, 0.13], rot: [-1.2, 0, 0], parent: R.root }); }
};

function shoe(l, col, o = {}) { const sh = sphere(0.068, 16, 10); sh.scale(1, 0.7, 1.35); P(sh, col, { pos: [0, -0.215, 0.025], parent: l }); if (o.sole) P(rcyl(0.065, 0.065, 0.02, 0.008, 16).scale(1, 1, 1.3), o.sole, { noOutline: true, pos: [0, -0.255, 0.025], parent: l }); }
const BOT = {
  quandai(R) { R.legs.forEach(l => { P(capsule(0.062, 0.12, 4, 12), C.sky2, { pos: [0, -0.1, 0], parent: l }); shoe(l, C.white, { sole: C.sky }); }); P(rbox(0.25, 0.1, 0.19, 0.05), C.sky2, { pos: [0, HIP + 0.02, 0], parent: R.root }); },
  short(R) { R.legs.forEach(l => { P(capsule(0.064, 0.04, 4, 12), C.sky, { pos: [0, -0.05, 0], parent: l }); shoe(l, C.white, { sole: C.pink }); }); P(rbox(0.25, 0.1, 0.19, 0.05), C.sky, { pos: [0, HIP + 0.02, 0], parent: R.root }); },
  quanyem(R) { R.legs.forEach(l => { P(capsule(0.062, 0.12, 4, 12), 0x7FA8D9, { pos: [0, -0.1, 0], parent: l }); shoe(l, C.woodD); }); P(rbox(0.25, 0.12, 0.19, 0.05), 0x7FA8D9, { pos: [0, HIP + 0.03, 0], parent: R.root }); P(rbox(0.16, 0.12, 0.03, 0.02), 0x7FA8D9, { pos: [0, HIP + 0.12, 0.1], parent: R.root }); },
  depbong(R) { R.legs.forEach(l => { const s = sphere(0.085, 16, 10); s.scale(1, 0.75, 1.3); P(s, C.petal, { pos: [0, -0.21, 0.03], parent: l }); for (const e of [-1, 1]) P(sphere(0.022, 8, 6), C.pinkL, { pos: [e * 0.035, -0.16, 0.12], parent: l }); }); },
  ungmua(R) { R.legs.forEach(l => { P(rcyl(0.07, 0.07, 0.15, 0.03, 16), C.butter, { pos: [0, -0.15, 0], parent: l }); shoe(l, C.butter); }); },
  giayvai(R) { R.legs.forEach(l => shoe(l, C.pink, { sole: C.white })); },
  chantran(R) { }
};

function hairCap(R, col, open = 0.56, tilt = -0.18) { const cap = new THREE.SphereGeometry(HEAD_R * 1.07, 28, 16, 0, Math.PI * 2, 0, Math.PI * open); P(cap, col, { pos: [0, HEAD_R * 0.08, -0.01], rot: [tilt, 0, 0], parent: R.head }); }
function hairBack(R, col, sy = 0.85, z = -0.05, y = -0.05) { const b = sphere(HEAD_R * 1.03, 24, 14); b.scale(1, sy, 0.9); P(b, col, { pos: [0, y, z], parent: R.head }); }
function bangs(R, col, n = 3) { const fr = sphere(0.09, 16, 10); fr.scale(1.1, 0.65, 0.6); const xs = n === 3 ? [-0.11, 0, 0.11] : [-0.13, -0.045, 0.045, 0.13]; xs.forEach(x => P(fr, col, { pos: [x, HEAD_R + 0.05 - 0.23, 0.17 - Math.abs(x) * 0.25], rot: [0.6, 0, -x * 2], parent: R.head })); }
const HAIR = {
  nganxu(R, c) { hairCap(R, c); hairBack(R, c); const t = sphere(0.075, 14, 10); t.scale(1, 0.8, 0.7);
    [[-0.13, 0.08, 0.17, 0.4], [-0.045, 0.1, 0.2, 0.1], [0.05, 0.1, 0.2, -0.15], [0.14, 0.08, 0.16, -0.45]].forEach(([x, y, z, rz]) => P(t, c, { pos: [x, HEAD_R + y - 0.255, z], rot: [0.5, 0, rz], parent: R.head }));
    P(tube([[0, HEAD_R + 0.0, -0.02], [0.02, HEAD_R + 0.07, 0.0], [0.07, HEAD_R + 0.09, 0.04]], 0.016, 12, 6), c, { parent: R.head }); },
  maibang(R, c) { hairCap(R, c, 0.58, -0.2); hairBack(R, c, 0.95, -0.05, -0.07); bangs(R, c, 4);
    for (const s of [-1, 1]) P(capsule(0.07, 0.12, 4, 12).scale(1, 1, 0.8), c, { pos: [s * 0.22, -0.1, 0.02], parent: R.head }); },
  buocduoi(R, c) { hairCap(R, c, 0.58, -0.2); hairBack(R, c); bangs(R, c, 3);
    P(tube([[0, 0.12, -0.24], [0.02, 0.0, -0.36], [0.0, -0.2, -0.33], [-0.02, -0.3, -0.26]], 0.065, 20, 10), c, { parent: R.head });
    P(torus(0.05, 0.02, Math.PI * 2, 6, 14), C.pink, { pos: [0, 0.1, -0.26], rot: [0.3, 0, 0], parent: R.head }); },
  buicao(R, c) { hairCap(R, c, 0.58, -0.2); hairBack(R, c, 0.8); bangs(R, c, 3);
    P(sphere(0.12, 18, 12), c, { pos: [0, HEAD_R + 0.06, -0.06], parent: R.head }); P(torus(0.07, 0.022, Math.PI * 2, 6, 16), C.pink, { pos: [0, HEAD_R - 0.04, -0.04], rot: [Math.PI / 2 - 0.2, 0, 0], parent: R.head }); },
  daixoa(R, c) { hairCap(R, c, 0.58, -0.2); hairBack(R, c, 0.95, -0.06, -0.1); bangs(R, c, 3);
    const d = capsule(0.1, 0.28, 6, 14); d.scale(1.25, 1, 0.7); for (const s of [-1, 1]) P(d, c, { pos: [s * 0.17, -0.25, -0.08], rot: [0.12, 0, s * -0.12], parent: R.head });
    P(capsule(0.15, 0.22, 6, 16).scale(1.2, 1, 0.55), c, { pos: [0, -0.28, -0.15], parent: R.head }); },
  xoan(R, c) { hairBack(R, c, 0.9, -0.05, -0.04); const b = sphere(0.085, 12, 8);
    for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2, r = HEAD_R * 1.02; P(b, c, { pos: [Math.cos(a) * r * 0.95, 0.07 + Math.sin(i * 1.7) * 0.03 + (Math.sin(a) > 0.3 ? -0.02 : 0.05), Math.sin(a) * r * 0.85 - 0.04], parent: R.head }); }
    for (let i = 0; i < 7; i++) P(b, c, { pos: [Math.cos(i * 0.9) * 0.12, HEAD_R + 0.0, Math.sin(i * 0.9) * 0.1 - 0.03], parent: R.head });
    [-0.1, 0, 0.1].forEach(x => P(b, c, { pos: [x, HEAD_R - 0.06, 0.17], parent: R.head })); }
};
const HAT = {
  khong() { },
  mulen(R) { const cap = new THREE.SphereGeometry(HEAD_R * 1.12, 28, 14, 0, Math.PI * 2, 0, Math.PI * 0.5); P(cap, C.wood, { pos: [0, 0.03, -0.01], rot: [-0.18, 0, 0], parent: R.head });
    P(torus(HEAD_R * 1.09, 0.03, Math.PI * 2, 8, 30), C.woodD, { pos: [0, 0.05, 0.0], rot: [Math.PI / 2 - 0.18, 0, 0], parent: R.head });
    for (const s of [-1, 1]) { P(sphere(0.07, 12, 8).scale(1, 1, 0.6), C.wood, { pos: [s * 0.17, HEAD_R + 0.04, -0.03], parent: R.head }); P(sphere(0.04, 10, 6).scale(1, 1, 0.5), C.pinkL, { noOutline: true, pos: [s * 0.17, HEAD_R + 0.04, 0.0], parent: R.head }); } },
  murom(R) { P(rcyl(0.42, 0.42, 0.03, 0.012, 36), 0xF2D48A, { pos: [0, HEAD_R - 0.02, 0], rot: [-0.18, 0, 0], parent: R.head }); P(rcyl(0.18, 0.21, 0.14, 0.05, 28), 0xF2D48A, { pos: [0, HEAD_R + 0.05, -0.01], rot: [-0.18, 0, 0], parent: R.head });
    P(rcyl(0.212, 0.212, 0.04, 0.01, 28), C.pink, { pos: [0, HEAD_R + 0.0, 0.0], rot: [-0.18, 0, 0], parent: R.head }); },
  mubep(R) { P(rcyl(0.2, 0.2, 0.12, 0.03, 28), C.white, { pos: [0, HEAD_R + 0.0, -0.01], rot: [-0.15, 0, 0], parent: R.head });
    [[0, 0.17, 0, 0.15], [-0.1, 0.13, 0, 0.11], [0.1, 0.13, 0, 0.11], [0, 0.13, -0.08, 0.11]].forEach(([x, y, z, r]) => P(sphere(r, 16, 10), C.white, { pos: [x, HEAD_R + y, z - 0.03], parent: R.head })); },
  musinhnhat(R) { const g = new THREE.Group(); g.position.set(0.05, HEAD_R + 0.04, 0.0); g.rotation.z = -0.25; R.head.add(g);
    P(new THREE.ConeGeometry(0.1, 0.26, 20), C.butter, { pos: [0, 0.13, 0], parent: g }); for (let i = 0; i < 2; i++) P(torus(0.08 - i * 0.03, 0.012, Math.PI * 2, 6, 18), C.pink, { noOutline: true, pos: [0, 0.05 + i * 0.08, 0], rot: [Math.PI / 2, 0, 0], parent: g });
    P(sphere(0.04, 10, 8), C.pink, { pos: [0, 0.27, 0], parent: g }); },
  munoel(R) { const cap = new THREE.SphereGeometry(HEAD_R * 1.1, 28, 14, 0, Math.PI * 2, 0, Math.PI * 0.42); P(cap, C.pinkD, { pos: [0, 0.03, -0.01], rot: [-0.2, 0, 0], parent: R.head });
    P(tube([[0, HEAD_R + 0.0, -0.03], [0.04, HEAD_R + 0.12, -0.06], [0.16, HEAD_R + 0.14, -0.08], [0.24, HEAD_R + 0.04, -0.06]], 0.07, 16, 12), C.pinkD, { parent: R.head });
    P(torus(HEAD_R * 0.98, 0.045, Math.PI * 2, 8, 32), C.white, { pos: [0, 0.1, 0.0], rot: [Math.PI / 2 - 0.2, 0, 0], parent: R.head }); P(sphere(0.055, 12, 8), C.white, { pos: [0.25, HEAD_R + 0.01, -0.06], parent: R.head }); },
  noto(R) { const g = new THREE.Group(); g.position.set(0.1, HEAD_R + 0.03, -0.02); g.rotation.z = -0.3; R.head.add(g);
    for (const s of [-1, 1]) { const b = sphere(0.09, 14, 10); b.scale(1.25, 0.8, 0.5); P(b, C.pink, { pos: [s * 0.1, 0, 0], rot: [0, 0, s * 0.3], parent: g }); }
    P(sphere(0.045, 12, 8), C.pinkD, { parent: g }); }
};
function inHand(R, build) { const a = R.arms[1], g = new THREE.Group(); g.position.set(...HAND); g.rotation.set(-a.rotation.x, 0, -a.rotation.z); a.add(g); build(g); }
const ACC = {
  khong() { },
  kinh(R) { for (const s of [-1, 1]) P(torus(0.055, 0.01, Math.PI * 2, 6, 20), C.navy, { noOutline: true, pos: [s * 0.085, -0.0, HEAD_R * 0.98], parent: R.head }); P(tube([[-0.03, 0, HEAD_R * 1.0], [0, 0.012, HEAD_R * 1.01], [0.03, 0, HEAD_R * 1.0]], 0.008, 6, 4), C.navy, { noOutline: true, parent: R.head }); },
  tainghe(R) { P(torus(0.115, 0.022, Math.PI * 2, 10, 30), C.sky, { pos: [0, NECK, 0], rot: [Math.PI / 2 - 0.25, 0, 0], parent: R.root }); for (const s of [-1, 1]) P(rcyl(0.045, 0.045, 0.04, 0.015, 18), C.sky, { pos: [s * 0.1, NECK - 0.01, 0.07], rot: [Math.PI / 2, 0, 0], parent: R.root }); },
  khan(R) { P(torus(0.12, 0.04, Math.PI * 2, 10, 28), C.pinkL, { pos: [0, NECK - 0.02, 0.0], rot: [Math.PI / 2 - 0.2, 0, 0], parent: R.root }); P(rbox(0.07, 0.16, 0.03, 0.03), C.pinkL, { pos: [0.07, NECK - 0.12, 0.12], rot: [0, 0, 0.15], parent: R.root }); },
  tui(R) { P(tube([[-0.13, NECK - 0.03, 0.09], [0, NECK - 0.13, 0.13], [0.15, NECK - 0.25, 0.11]], 0.012, 12, 6), C.woodD, { noOutline: true, parent: R.root }); P(rbox(0.12, 0.1, 0.05, 0.03), C.butter, { pos: [0.16, NECK - 0.28, 0.1], parent: R.root }); },
  binhtuoi(R) { inHand(R, g => { P(rcyl(0.07, 0.08, 0.12, 0.03, 18), C.sky, { pos: [0, -0.07, 0.03], parent: g }); P(tube([[0.06, -0.08, 0.04], [0.14, -0.04, 0.06], [0.18, 0.0, 0.07]], 0.014, 8, 6), C.sky, { parent: g }); P(torus(0.045, 0.012, Math.PI, 6, 12), C.sky, { pos: [0, 0.0, 0.03], parent: g }); }); },
  cove(R) { inHand(R, g => { P(rcyl(0.012, 0.012, 0.2, 0.005, 8), C.wood, { pos: [0, 0.05, 0.04], rot: [0.3, 0, 0.2], parent: g }); P(sphere(0.024, 10, 8).scale(1, 1.6, 1), C.pink, { pos: [0.02, 0.16, 0.07], parent: g }); }); },
  sach(R) { inHand(R, g => { P(rbox(0.14, 0.18, 0.04, 0.015), C.leaf, { pos: [0, -0.04, 0.06], rot: [0, 0.4, 0], parent: g }); P(rbox(0.12, 0.16, 0.035, 0.01), C.white, { noOutline: true, pos: [0.006, -0.04, 0.062], rot: [0, 0.4, 0], parent: g }); }); },
  trasua(R) { inHand(R, g => { P(rcyl(0.05, 0.04, 0.14, 0.015, 16), 0xE8D2B8, { opacity: 1, pos: [0, -0.02, 0.05], parent: g }); P(rcyl(0.052, 0.052, 0.02, 0.008, 16), C.pink, { pos: [0, 0.06, 0.05], parent: g }); P(rcyl(0.008, 0.008, 0.1, 0.003, 6), C.pinkD, { noOutline: true, pos: [0.015, 0.11, 0.05], rot: [0, 0, -0.2], parent: g }); for (let i = 0; i < 3; i++) P(sphere(0.012, 6, 4), C.navy, { noOutline: true, pos: [-0.02 + i * 0.02, -0.07, 0.1], parent: g }); }); },
  kepla(R) { const lf = leafGeo(0.13, 0.06, 0.03); P(lf, C.leaf, { pos: [0.16, HEAD_R * 0.9 + 0.08 - 0.22, 0.09], rot: [-0.6, 0.9, 0.5], parent: R.head }); P(lf, C.leafL, { pos: [0.15, HEAD_R * 0.9 + 0.08 - 0.22, 0.1], rot: [-0.9, 2.1, 0.2], parent: R.head, scale: 0.8 }); }
};

// khuôn mặt — 8 biểu cảm
function face(R, ex) {
  const g = R.head, ey = HEAD_R * 0.02, ez = HEAD_R * 0.93;
  const bean = (s, sc = 1) => { const e = sphere(0.034 * sc, 14, 10); e.scale(0.85, 1.25, 0.6); P(e, C.navy, { noOutline: true, basic: true, pos: [s * 0.085, ey, ez], parent: g }); P(sphere(0.011 * sc, 8, 6), C.white, { noOutline: true, basic: true, pos: [s * 0.085 + 0.01, ey + 0.015, ez + 0.022], parent: g }); };
  const arcEye = (s, up) => P(torus(0.03, 0.009, Math.PI, 6, 12), C.navy, { noOutline: true, basic: true, pos: [s * 0.085, ey + (up ? -0.01 : 0.01), ez + 0.01], rot: [0, 0, up ? 0 : Math.PI], parent: g });
  const blush = (k = 0.85, big = 1) => { const b = sphere(0.045 * big, 14, 8); b.scale(1.1, 0.6, 0.35); for (const s of [-1, 1]) P(b, 0xFF8DB4, { noOutline: true, basic: true, opacity: k, pos: [s * 0.15, ey - 0.07, ez - 0.035], rot: [0, s * 0.5, 0], parent: g }); };
  const smile = () => P(torus(0.026, 0.008, Math.PI, 6, 14), C.navy, { noOutline: true, basic: true, pos: [0, ey - 0.06, ez + 0.012], rot: [0, 0, Math.PI], parent: g });
  if (ex === 'vui') { bean(-1); bean(1); blush(); smile(); }
  if (ex === 'cuoi') { bean(-1); bean(1); blush(); const m = new THREE.SphereGeometry(0.042, 16, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2); m.scale(1, 0.8, 0.4); P(m, 0xC2456F, { noOutline: true, basic: true, pos: [0, ey - 0.072, ez], parent: g }); P(new THREE.BoxGeometry(0.05, 0.012, 0.01), C.white, { noOutline: true, basic: true, pos: [0, ey - 0.076, ez + 0.012], parent: g }); }
  if (ex === 'ngung') { arcEye(-1, true); arcEye(1, true); blush(1, 1.35); P(torus(0.018, 0.007, Math.PI, 6, 10), C.navy, { noOutline: true, basic: true, pos: [0, ey - 0.06, ez + 0.012], rot: [0, 0, Math.PI], parent: g }); }
  if (ex === 'nho') { bean(-1, 1.25); bean(1, 1.25); for (const s of [-1, 1]) P(sphere(0.007, 6, 4), C.white, { noOutline: true, basic: true, pos: [s * 0.085 - 0.01, ey - 0.012, ez + 0.024], parent: g }); blush(0.7); P(sphere(0.012, 8, 6).scale(1, 1.2, 0.5), C.navy, { noOutline: true, basic: true, pos: [0, ey - 0.07, ez + 0.01], parent: g }); }
  if (ex === 'doi') { bean(-1); bean(1); for (const s of [-1, 1]) P(new THREE.BoxGeometry(0.05, 0.01, 0.01), C.navy, { noOutline: true, basic: true, pos: [s * 0.09, ey + 0.055, ez - 0.01], rot: [0, 0, s * -0.35], parent: g }); blush(1, 1.3); P(torus(0.02, 0.007, Math.PI, 6, 10), C.navy, { noOutline: true, basic: true, pos: [0, ey - 0.075, ez + 0.012], parent: g }); }
  if (ex === 'ngac') { for (const s of [-1, 1]) { P(sphere(0.036, 14, 10).scale(1, 1, 0.5), C.white, { noOutline: true, basic: true, pos: [s * 0.085, ey, ez], parent: g }); P(sphere(0.02, 10, 8).scale(1, 1, 0.5), C.navy, { noOutline: true, basic: true, pos: [s * 0.085, ey, ez + 0.012], parent: g }); P(torus(0.036, 0.007, Math.PI * 2, 6, 16), C.navy, { noOutline: true, basic: true, pos: [s * 0.085, ey, ez + 0.006], parent: g }); }
    P(sphere(0.022, 10, 8).scale(1, 1.25, 0.4), C.navy, { noOutline: true, basic: true, pos: [0, ey - 0.075, ez + 0.005], parent: g }); blush(0.6); }
  if (ex === 'buonngu') { for (const s of [-1, 1]) { P(new THREE.BoxGeometry(0.06, 0.012, 0.01), C.navy, { noOutline: true, basic: true, pos: [s * 0.085, ey - 0.005, ez + 0.012], parent: g }); P(sphere(0.02, 10, 6).scale(1.4, 0.6, 0.4), C.navy, { noOutline: true, basic: true, pos: [s * 0.085, ey - 0.018, ez + 0.006], parent: g }); } blush(0.6); P(sphere(0.012, 8, 6).scale(1.4, 1, 0.5), C.navy, { noOutline: true, basic: true, pos: [0, ey - 0.07, ez + 0.01], parent: g }); }
  if (ex === 'ngu') { arcEye(-1, false); arcEye(1, false); blush(0.7); P(sphere(0.01, 8, 6).scale(1.5, 1, 0.5), C.navy, { noOutline: true, basic: true, pos: [0, ey - 0.07, ez + 0.01], parent: g }); }
}

// ---------- dựng một lớp: lớp được chọn hiện, các phần khác làm vật che vô hình ----------
export function layer(kind, opt, pose) {
  const R = rig(pose);
  const show = () => {
    if (kind === 'than') base(R);
    if (kind === 'ao') TOP[opt](R);
    if (kind === 'quan') BOT[opt](R);
    if (kind === 'toc') HAIR[opt.style](R, HAIR_COLORS[opt.color][1]);
    if (kind === 'mu') HAT[opt](R);
    if (kind === 'phukien') ACC[opt](R);
    if (kind === 'mat') face(R, opt);
  };
  MODE = 'show'; show();
  MODE = 'occ';
  if (kind !== 'than') base(R);
  if (kind === 'toc' || kind === 'mu' || kind === 'phukien') bulk(R);
  if (kind === 'quan') { /* áo nằm trên quần: không cần che */ }
  MODE = 'show';
  return R.root;
}
// ghép đủ bộ (dùng cho bản đồ, màn hình chờ, ảnh chân dung)
export const DEFAULT_LOOK = { anh: { hair: 'nganxu', hc: 'dennau', top: 'hoodie', bot: 'quandai', hat: 'khong', acc: 'tainghe' }, em: { hair: 'daixoa', hc: 'hatde', top: 'vayyem', bot: 'giayvai', hat: 'khong', acc: 'kepla' } };

// Ghép đủ bộ thành MỘT nhân vật sống (không lớp che) để dùng trong cảnh 3D trực tiếp (nha3d/).
// Trả về khung xương có head/arms/legs để app tự làm hoạt ảnh đi, ngồi, vẫy tay; setFace đổi biểu cảm tại chỗ.
export function buildAvatar(look, expr = 'vui') {
  MODE = 'show';
  const R = rig('dung');
  base(R);
  BOT[look.bot](R);
  TOP[look.top](R);
  HAIR[look.hair](R, HAIR_COLORS[look.hc][1]);
  HAT[look.hat](R);
  ACC[look.acc](R);
  const faceG = new THREE.Group(); R.head.add(faceG);
  R.setFace = ex => {
    while (faceG.children.length) faceG.remove(faceG.children[0]);
    face({ head: faceG }, ex); R.expr = ex;
  };
  R.setFace(expr);
  R.look = look;
  return R;
}
