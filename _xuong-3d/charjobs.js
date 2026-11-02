import { THREE, C, makeScene, isoCamera, shoot, shadowCatcher, toPx } from './lib.js';
import { buildChar } from './chars.js';
import { buildCat, CAT_COLORS } from './pet.js';
export const CH = { size: 512, ppm: 380, anchorY: 48 };
function shotOne(obj, ppm = CH.ppm, size = CH.size, anchor = CH.anchorY, sh = 2) {
  const s = makeScene('ngay', { shadowSize: sh, shadowBlur: 4, keyPos: [-2.2, 12, 0.9] }); s.add(shadowCatcher(4, 4)); s.add(obj);
  // khung: điểm chạm sàn (0,0,0) nằm giữa ngang, cách đáy anchor px
  const cam = isoCamera(size, size, ppm, [0, 0, 0], [0, size / 2 - anchor]);
  return shoot(s, cam);
}
export const jobs = {
  nhanvat: async () => {
    const out = [];
    for (const who of ['anh', 'em']) for (const pose of ['dung', 'vaytay', 'ngoi', 'tuoi', 'om']) for (const dir of ['truoc', 'sau']) {
      if (dir === 'sau' && pose !== 'dung') continue;
      const c = buildChar(who, pose, pose === 'ngoi' ? {} : {}); c.rotation.y = Math.PI / 4 + (dir === 'sau' ? Math.PI : 0);
      out.push({ file: `nv_${who}_${pose}${dir === 'sau' ? '_sau' : ''}@3x.png`, data: shotOne(c) });
    }
    const c1 = buildChar('anh', 'dung', { expr: 'ngu' }); c1.rotation.y = Math.PI / 4; out.push({ file: 'nv_anh_ngu@3x.png', data: shotOne(c1) });
    const c2 = buildChar('em', 'dung', { expr: 'ngu' }); c2.rotation.y = Math.PI / 4; out.push({ file: 'nv_em_ngu@3x.png', data: shotOne(c2) });
    out.push({ file: 'nhan_vat_meta', meta: { size: CH.size, ppm: CH.ppm, anchor: [CH.size / 2, CH.size - CH.anchorY] } });
    return out;
  },
  chandung: async () => { // ảnh đại diện bán thân 512
    const out = [];
    for (const who of ['anh', 'em']) {
      const s = makeScene('ngay', { shadowSize: 2 }); const c = buildChar(who, 'dung'); c.rotation.y = Math.PI / 4 - 0.2; s.add(c);
      out.push({ file: `chan_dung_${who}@3x.png`, data: shoot(s, isoCamera(512, 512, 700, [0, 0.72, 0])) });
    }
    return out;
  },
  thu: async () => {
    const out = [];
    for (const col of Object.keys(CAT_COLORS)) for (const pose of ['ngoi', 'nam', 'vui']) {
      const c = buildCat(col, pose === 'vui' ? 'ngoi' : pose, { happy: pose === 'vui' }); c.rotation.y = Math.PI / 4;
      out.push({ file: `thu_meo_${col}_${pose}@3x.png`, data: shotOne(c, CH.ppm, CH.size, CH.anchorY, 1.5) });
    }
    return out;
  }
};
