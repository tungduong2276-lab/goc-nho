// Icon app + màn hình chờ (mục 11 của brief)
import { THREE, C, piece, rbox, sphere, rcyl, makeScene, isoCamera, shoot, shadowCatcher } from './lib.js';
import * as F from './furn.js';
import { buildChar } from './chars.js';
const G = () => new THREE.Group();
function miniHouse() {
  const g = G();
  piece(rbox(2.2, 0.35, 2.2, 0.15), C.grass, { pos: [0, -0.17, 0], parent: g, receive: true });
  piece(rbox(1.5, 1.2, 1.4, 0.12), C.white, { pos: [0, 0.6, -0.1], parent: g, emissive: C.white, ei: 0.25 });
  // mái xanh hai dốc
  for (const s of [-1, 1]) piece(rbox(1.75, 0.16, 1.0, 0.07), C.sky, { pos: [0, 1.45, -0.1 + s * 0.36], rot: [s * 0.72, 0, 0], parent: g });
  const gab = new THREE.Shape(); gab.moveTo(-0.7, 0); gab.lineTo(0.7, 0); gab.lineTo(0, 0.6); gab.lineTo(-0.7, 0);
  piece(new THREE.ExtrudeGeometry(gab, { depth: 1.3, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 2 }), C.white, { pos: [-0.66, 1.18, -0.1], rot: [0, Math.PI / 2, 0], parent: g, emissive: C.white, ei: 0.25 });
  piece(rbox(0.42, 0.7, 0.08, 0.06), C.pink, { pos: [0.25, 0.37, 0.62], parent: g });
  piece(sphere(0.035, 8, 6), C.butter, { pos: [0.38, 0.37, 0.67], parent: g });
  piece(rbox(0.4, 0.38, 0.06, 0.04), 0xBFE3FA, { pos: [-0.38, 0.72, 0.62], parent: g });
  piece(rbox(0.06, 0.42, 0.07, 0.02), C.white, { pos: [-0.38, 0.72, 0.65], parent: g, noOutline: true });
  for (const s of [1]) { const w = rbox(0.06, 0.38, 0.38, 0.03); }
  piece(rbox(0.06, 0.4, 0.42, 0.04), 0xBFE3FA, { pos: [0.76, 0.75, -0.25], parent: g });
  // ống khói hồng có tim
  piece(rbox(0.26, 0.5, 0.26, 0.05), C.pink, { pos: [0.45, 1.7, -0.35], parent: g });
  // chậu cây hồng trước cửa
  const p = F.pot(C.pink, 0.15, 0.2, true); p.position.set(-0.3, 0, 0.82); g.add(p);
  for (let i = 0; i < 3; i++) piece(sphere(0.09, 12, 8).scale(1, 0.6, 1), C.leaf, { pos: [-0.3 + Math.cos(i * 2.1) * 0.07, 0.27, 0.82 + Math.sin(i * 2.1) * 0.07], parent: g });
  piece(sphere(0.07, 12, 8), 0xFF8DB4, { pos: [-0.3, 0.36, 0.82], parent: g });
  return g;
}
export const jobs = {
  icon: async () => {
    const out = [];
    for (const n of [1024, 512, 192, 180]) {
      const s = makeScene('ngay', { shadowSize: 3, keyPos: [-4, 12, 2] }); const h = miniHouse(); h.rotation.y = 0; s.add(h); s.add(shadowCatcher(4, 4, -0.34));
      // phần chính nằm trong vòng tròn 80%
      out.push({ file: `icon-${n}.png`, data: shoot(s, isoCamera(n, n, n / 4.4, [0.0, 0.62, 0]), { bg: C.sky, outline: Math.max(2.2, n / 140) }) });
    }
    return out;
  },
  cho: async () => { // màn hình chờ: nhà + hai nhân vật vẫy tay, chừa 1/3 trên cho chữ
    const s = makeScene('ngay', { shadowSize: 4, keyPos: [-4, 12, 2] }); const h = miniHouse(); s.add(h);
    const a = buildChar('anh', 'vaytay'); a.rotation.y = Math.PI / 4; a.position.set(0.2, 0, 1.75); a.scale.setScalar(0.95); s.add(a);
    const e = buildChar('em', 'vaytay'); e.rotation.y = Math.PI / 4; e.position.set(1.6, 0, 0.55); e.scale.setScalar(0.95); s.add(e);
    return [{ file: 'man_hinh_cho@3x.png', data: shoot(s, isoCamera(1170, 2532, 330, [0.35, 0.75, 0.35], [0, 260])) }];
  }
};
