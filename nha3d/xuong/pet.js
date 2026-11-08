// TỰ SINH từ _xuong-3d/ bởi scripts/sync-nha3d.mjs — đừng sửa tay.
// Thú cưng lớn — mèo chibi (mục 5). Cao ~0.6 ô, đầu to chân ngắn.
import { THREE, C, piece, rbox, sphere, capsule, rcyl, torus, tube, mat } from './lib.js';

export const CAT_COLORS = {
  trang: { body: 0xFFFFFF, patch: 0xFFC48A, ear: 0xFFC2D6 },
  cam:   { body: 0xFFB36B, patch: 0xF08A4B, ear: 0xFFC2D6 },
  xam:   { body: 0xB9C8DA, patch: 0x8EA3C4, ear: 0xFFC2D6 }
};

function face(g, y, z, sleep, happy) {
  for (const s of [-1, 1]) {
    if (sleep || happy) piece(torus(0.03, 0.009, Math.PI, 6, 12), C.navy, { noOutline: true, basic: true, pos: [s * 0.075, y + 0.01, z], rot: [0, 0, sleep ? Math.PI : 0], parent: g });
    else { const e = sphere(0.03, 12, 8); e.scale(0.85, 1.2, 0.5); piece(e, C.navy, { noOutline: true, basic: true, pos: [s * 0.075, y + 0.01, z], parent: g });
      piece(sphere(0.01, 6, 4), C.white, { noOutline: true, basic: true, pos: [s * 0.075 + 0.008, y + 0.025, z + 0.012], parent: g }); }
    const b = sphere(0.035, 10, 6); b.scale(1.1, 0.6, 0.3); piece(b, C.blush, { noOutline: true, basic: true, opacity: 0.8, pos: [s * 0.13, y - 0.04, z - 0.02], parent: g });
    for (const k of [-1, 1]) piece(new THREE.CylinderGeometry(0.004, 0.004, 0.09, 4), C.navy, { noOutline: true, basic: true, pos: [s * 0.2, y - 0.03 + k * 0.015, z - 0.03], rot: [0, 0, Math.PI / 2 + k * 0.15 * s], parent: g });
  }
  // mõm chữ ω
  for (const s of [-1, 1]) piece(torus(0.016, 0.006, Math.PI, 6, 10), C.navy, { noOutline: true, basic: true, pos: [s * 0.016, y - 0.04, z + 0.005], rot: [0, 0, Math.PI], parent: g });
  piece(sphere(0.012, 8, 6).scale(1.3, 0.8, 0.6), C.pinkD, { noOutline: true, basic: true, pos: [0, y - 0.018, z + 0.01], parent: g });
}

// pose: 'ngoi' | 'nam' (cuộn tròn ngủ) | 'dung'
export function buildCat(color = 'trang', pose = 'ngoi', o = {}) {
  const P = CAT_COLORS[color] || CAT_COLORS.trang, g = new THREE.Group();
  const HR = 0.21;
  if (pose === 'nam') {
    const b = sphere(0.24, 24, 16); b.scale(1.15, 0.62, 1.0); piece(b, P.body, { pos: [0, 0.15, 0], parent: g });
    piece(tube([[0.25, 0.08, -0.05], [0.18, 0.1, 0.22], [-0.05, 0.1, 0.3], [-0.22, 0.08, 0.2]], 0.055, 20, 8), P.patch, { parent: g });
    const hg = new THREE.Group(); hg.position.set(-0.12, 0.22, 0.12); g.add(hg);
    const h = sphere(HR, 24, 16); h.scale(1.12, 0.9, 0.95); piece(h, P.body, { parent: hg });
    for (const s of [-1, 1]) { piece(new THREE.ConeGeometry(0.075, 0.13, 12), P.body, { pos: [s * 0.13, 0.17, -0.02], rot: [0, 0, s * -0.35], parent: hg }); }
    face(hg, 0, HR * 0.9, true);
    hg.rotation.set(0.35, 0.3, 0.2);
    return g;
  }
  // thân ngồi
  const body = sphere(0.2, 24, 16); body.scale(1.0, 1.05, 1.1); piece(body, P.body, { pos: [0, 0.2, -0.03], parent: g });
  piece(sphere(0.12, 16, 12).scale(1, 1.1, 0.6), C.white, { pos: [0, 0.2, 0.13], parent: g, noOutline: true });
  for (const s of [-1, 1]) piece(capsule(0.05, 0.06, 4, 10), P.body, { pos: [s * 0.08, 0.06, 0.12], rot: [pose === 'dung' ? 0.2 : 0, 0, 0], parent: g });
  for (const s of [-1, 1]) piece(sphere(0.085, 14, 10).scale(1, 0.7, 1.3), P.body, { pos: [s * 0.15, 0.07, -0.05], parent: g });
  // đuôi cong
  piece(tube([[0, 0.08, -0.22], [0.18, 0.12, -0.3], [0.28, 0.3, -0.22], [0.25, 0.45, -0.12]], 0.045, 20, 8), P.patch, { parent: g });
  // đầu to
  const hg = new THREE.Group(); hg.position.set(0, 0.5, 0.03); g.add(hg);
  const h = sphere(HR, 28, 18); h.scale(1.15, 0.92, 0.95); piece(h, P.body, { parent: hg });
  const patch = new THREE.SphereGeometry(HR * 1.01, 20, 12, 0, Math.PI * 0.8, 0, Math.PI * 0.45); patch.scale(1.15, 0.92, 0.95);
  piece(patch, P.patch, { parent: hg, noOutline: true, rot: [0, 1.5, 0] });
  for (const s of [-1, 1]) {
    piece(new THREE.ConeGeometry(0.08, 0.14, 14), s > 0 ? P.patch : P.body, { pos: [s * 0.14, 0.18, -0.02], rot: [0, 0, s * -0.38], parent: hg });
    piece(new THREE.ConeGeometry(0.045, 0.08, 10), P.ear, { pos: [s * 0.135, 0.17, 0.02], rot: [0, 0, s * -0.38], parent: hg, noOutline: true });
  }
  face(hg, 0, HR * 0.88, false, o.happy);
  if (o.collar !== false) { piece(torus(0.12, 0.022, Math.PI * 2, 8, 24), C.pink, { pos: [0, 0.36, 0.01], rot: [Math.PI / 2 - 0.15, 0, 0], parent: g }); piece(sphere(0.03, 10, 8), C.butter, { pos: [0, 0.32, 0.13], parent: g }); }
  return g;
}
