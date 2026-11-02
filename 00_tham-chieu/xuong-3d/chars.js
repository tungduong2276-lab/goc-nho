// Nhân vật chibi Anh và Em — mục 4 của brief.
// Tỉ lệ đầu : thân = 1 : 1.2, cao ~1.1 ô sàn, mắt hạt đậu, má hồng, không mũi.
import { THREE, C, piece, rbox, sphere, capsule, rcyl, lathe, torus, tube, leafGeo, mat } from './lib.js';

const HEAD_R = 0.25;          // đầu cao ~0.5
const HIP = 0.30, NECK = 0.58; // thân 0.6 (gồm chân)

function face(g, who, expr = 'vui') {
  // mắt hạt đậu
  const eyeGeo = sphere(0.034, 14, 10); eyeGeo.scale(0.85, 1.25, 0.6);
  const ey = NECK + HEAD_R * 0.92, ez = HEAD_R * 0.93;
  for (const s of [-1, 1]) {
    if (expr === 'ngu') { const lid = torus(0.03, 0.009, Math.PI, 6, 12); piece(lid, C.navy, { noOutline: true, pos: [s * 0.085, ey, ez + 0.01], rot: [0, 0, Math.PI], parent: g }); continue; }
    const e = piece(eyeGeo, C.navy, { noOutline: true, pos: [s * 0.085, ey, ez], parent: g, emissive: C.navy, ei: 0.0 });
    piece(sphere(0.011, 8, 6), C.white, { noOutline: true, pos: [s * 0.085 + 0.01, ey + 0.015, ez + 0.022], parent: g, basic: true });
  }
  // má hồng
  const bl = sphere(0.045, 14, 8); bl.scale(1.1, 0.6, 0.35);
  for (const s of [-1, 1]) piece(bl, who === 'em' ? 0xFF8DB4 : C.blush, { noOutline: true, pos: [s * 0.15, ey - 0.07, ez - 0.035], rot: [0, s * 0.5, 0], parent: g, basic: true, opacity: 0.85 });
  // miệng
  if (who === 'anh') { // cười lộ răng
    const m = new THREE.SphereGeometry(0.04, 16, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2); m.scale(1, 0.75, 0.4);
    piece(m, 0xC2456F, { noOutline: true, pos: [0, ey - 0.075, ez + 0.0], parent: g, basic: true });
    const t = new THREE.BoxGeometry(0.05, 0.012, 0.01); piece(t, C.white, { noOutline: true, pos: [0, ey - 0.079, ez + 0.012], parent: g, basic: true });
  } else {
    piece(torus(0.026, 0.008, Math.PI, 6, 14), C.navy, { noOutline: true, pos: [0, ey - 0.06, ez + 0.012], rot: [0, 0, Math.PI], parent: g, basic: true });
  }
}

function hairAnh(g) {
  const top = NECK + HEAD_R;
  // mũ tóc ngắn xù
  const cap = new THREE.SphereGeometry(HEAD_R * 1.07, 28, 16, 0, Math.PI * 2, 0, Math.PI * 0.56);
  piece(cap, C.hairA, { pos: [0, NECK + HEAD_R * 0.98, -0.01], rot: [-0.18, 0, 0], parent: g });
  // phần sau gáy
  const back = sphere(HEAD_R * 1.02, 24, 14); back.scale(1, 0.85, 0.9);
  piece(back, C.hairA, { pos: [0, NECK + HEAD_R * 0.85, -0.05], parent: g });
  // mái lởm chởm
  const tuft = sphere(0.075, 14, 10); tuft.scale(1, 0.8, 0.7);
  [[-0.13, 0.08, 0.17, 0.4], [-0.045, 0.1, 0.2, 0.1], [0.05, 0.1, 0.2, -0.15], [0.14, 0.08, 0.16, -0.45]].forEach(([x, y, z, rz]) =>
    piece(tuft, C.hairA, { pos: [x, NECK + HEAD_R + y - 0.03, z], rot: [0.5, 0, rz], parent: g }));
  // cọng tóc vểnh
  piece(tube([[0, top + 0.02, -0.02], [0.02, top + 0.09, 0.0], [0.07, top + 0.11, 0.04]], 0.016, 12, 6), C.hairA, { parent: g });
}
function hairEm(g) {
  const cap = new THREE.SphereGeometry(HEAD_R * 1.08, 28, 16, 0, Math.PI * 2, 0, Math.PI * 0.58);
  piece(cap, C.hairE, { pos: [0, NECK + HEAD_R * 0.98, -0.01], rot: [-0.2, 0, 0], parent: g });
  const back = sphere(HEAD_R * 1.05, 24, 14); back.scale(1.02, 0.95, 0.9);
  piece(back, C.hairE, { pos: [0, NECK + HEAD_R * 0.8, -0.06], parent: g });
  // tóc dài xõa sau vai
  const drape = capsule(0.1, 0.28, 6, 14); drape.scale(1.25, 1, 0.7);
  for (const s of [-1, 1]) piece(drape, C.hairE, { pos: [s * 0.17, NECK + 0.02, -0.08], rot: [0.12, 0, s * -0.12], parent: g });
  piece(capsule(0.15, 0.22, 6, 16).scale(1.2, 1, 0.55), C.hairE, { pos: [0, NECK - 0.0, -0.15], parent: g });
  // mái bằng
  const fr = sphere(0.09, 16, 10); fr.scale(1.1, 0.65, 0.6);
  [-0.11, 0, 0.11].forEach((x, i) => piece(fr, C.hairE, { pos: [x, NECK + HEAD_R + 0.05, 0.17 - Math.abs(x) * 0.25], rot: [0.6, 0, -x * 2], parent: g }));
  // kẹp tóc hình chiếc lá
  const lf = leafGeo(0.13, 0.06, 0.03);
  piece(lf, C.leaf, { pos: [0.16, NECK + HEAD_R + 0.08, 0.09], rot: [-0.6, 0.9, 0.5], parent: g });
  piece(lf, C.leafL, { pos: [0.15, NECK + HEAD_R + 0.08, 0.1], rot: [-0.9, 2.1, 0.2], parent: g, scale: 0.8 });
}

// tay: vai -> bàn tay; tư thế bằng góc
function arm(g, side, color, pose, o_em = false) {
  const a = new THREE.Group(); a.position.set(side * 0.155, NECK - 0.07, 0); g.add(a);
  let rz = side * 0.32, rx = 0;
  if (pose === 'vaytay' && side === 1) { rz = o_em ? 1.85 : 2.4; rx = o_em ? -1.15 : -0.75; }
  if (pose === 'ngoi') { rx = -0.7; rz = side * 0.2; }
  if (pose === 'om' ) { rx = -1.2; rz = side * -0.25; }
  if (pose === 'tuoi' && side === 1) { rx = -1.15; rz = 0.15; }
  a.rotation.set(rx, 0, rz);
  piece(capsule(0.052, 0.14, 4, 12), color, { pos: [0, -0.1, 0], parent: a });
  piece(sphere(0.052, 14, 10), C.skin, { pos: [0, -0.21, 0], parent: a });
  return a;
}
function legs(g, pantsColor, shoeColor, pose, bare) {
  for (const s of [-1, 1]) {
    const l = new THREE.Group(); l.position.set(s * 0.07, HIP - 0.02, 0); g.add(l);
    if (pose === 'ngoi') l.rotation.x = -1.45;
    piece(capsule(0.058, 0.12, 4, 12), bare ? C.skin : pantsColor, { pos: [0, -0.1, 0], parent: l });
    const sh = sphere(0.068, 16, 10); sh.scale(1, 0.7, 1.35);
    piece(sh, shoeColor, { pos: [0, -0.215, 0.025], parent: l });
  }
}

export function buildChar(who, pose = 'dung', o = {}) {
  const g = new THREE.Group();
  const em = who === 'em';
  // thân
  if (em) {
    // áo thun xanh lá nhạt + váy yếm hồng xòe
    piece(rbox(0.27, 0.2, 0.2, 0.08), C.leafL, { pos: [0, NECK - 0.1, 0], parent: g });
    const skirt = lathe([[0, -0.215], [0.19, -0.215], [0.205, -0.2], [0.2, -0.17], [0.135, 0.02], [0.13, 0.0], [0, 0.0]].reverse().reverse());
    piece(skirt, C.pink, { pos: [0, NECK - 0.15, 0], parent: g });
    piece(rbox(0.2, 0.12, 0.05, 0.02), C.pink, { pos: [0, NECK - 0.09, 0.085], parent: g });
    for (const s of [-1, 1]) piece(rbox(0.035, 0.12, 0.03, 0.012), C.pink, { pos: [s * 0.075, NECK - 0.05, 0.095], parent: g });
    piece(sphere(0.018, 10, 8), C.white, { pos: [0.075, NECK - 0.035, 0.115], parent: g });
    piece(sphere(0.018, 10, 8), C.white, { pos: [-0.075, NECK - 0.035, 0.115], parent: g });
    legs(g, C.skin, C.pink, pose, true);
    arm(g, -1, C.leafL, pose, true); arm(g, 1, C.leafL, pose, true);
  } else {
    // hoodie trắng mũ xanh, quần xanh nhạt, tai nghe xanh trên cổ
    piece(rbox(0.31, 0.27, 0.22, 0.09), C.white, { pos: [0, NECK - 0.135, 0], parent: g });
    piece(rbox(0.13, 0.06, 0.03, 0.015), C.sky2, { pos: [0, NECK - 0.21, 0.11], parent: g }); // túi
    const hood = sphere(0.14, 18, 12); hood.scale(1.25, 0.8, 0.8);
    piece(hood, C.sky, { pos: [0, NECK - 0.02, -0.11], parent: g });
    for (const s of [-1, 1]) piece(tube([[s * 0.035, NECK - 0.03, 0.105], [s * 0.04, NECK - 0.12, 0.12]], 0.008, 6, 6), C.sky, { noOutline: true, parent: g });
    piece(torus(0.115, 0.022, Math.PI * 2, 10, 30), C.sky, { pos: [0, NECK + 0.0, 0.0], rot: [Math.PI / 2 - 0.25, 0, 0], parent: g });
    for (const s of [-1, 1]) piece(rcyl(0.045, 0.045, 0.04, 0.015, 18), C.sky, { pos: [s * 0.1, NECK - 0.01, 0.07], rot: [Math.PI / 2, 0, 0], parent: g });
    legs(g, C.sky2, C.white, pose, false);
    piece(rbox(0.25, 0.1, 0.19, 0.05), C.sky2, { pos: [0, HIP + 0.02, 0], parent: g });
    arm(g, -1, C.white, pose); arm(g, 1, C.white, pose);
  }
  // đầu
  const headG = new THREE.Group(); g.add(headG);
  const head = sphere(HEAD_R, 32, 20); head.scale(1.05, 0.95, 0.95);
  piece(head, C.skin, { pos: [0, NECK + HEAD_R * 0.9, 0], parent: headG });
  face(headG, who, o.expr);
  if (em) hairEm(headG); else hairAnh(headG);
  if (em) { headG.rotation.z = -0.1; headG.position.x = 0.03; } // hay nghiêng đầu
  if (pose === 'ngoi') { g.position.y = -0.2; }
  g.userData.height = NECK + HEAD_R * 2;
  return g;
}
