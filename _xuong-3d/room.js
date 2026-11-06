// Phòng khách — trang chủ (mục 6.1). Nền theo 4 buổi + vật tương tác là lớp rời.
import { THREE, C, piece, makeScene, isoCamera, shoot, shadowCatcher, toPx, TIMES } from './lib.js';
import * as F from './furn.js';
import {SPACIOUS_SCENE_PILOT} from './spacious-layout.js';
import { buildChar } from './chars.js';
import { buildCat } from './pet.js';

export const ROOM = { w: 1170, h: 1170, ppm: 112, target: [0, 1.05, 0] };
const SKY = { sang: 0xFFD6DE, ngay: 0xBFE3FA, chieu: 0xFFC2A0, dem: 0x2A3D6E };

function scene(time) {
  const s = makeScene(time, { shadowSize: 6, shadowRes: 2048, shadowBlur: 5 });
  const shell = F.roomShell({ n: 6, h: 2.7 }); s.add(shell);
  const L = {}; // vật tương tác
  // nền: cầu thang, kệ thấp, đèn cây, chậu trầu bà, thảm, bàn trà, gối ngồi
  const st = F.stairs(7); st.rotation.y = Math.PI / 2; st.position.set(-2.45 + 2.0, 0, -2.45); // dọc tường phải, lên về góc trong
  st.rotation.y = 0; st.position.set(-2.5, 0, -0.55);
  const bg = [F.rug(1.5), F.coffeeTable(), F.bookshelfLow(), F.floorLamp(time === 'dem' || time === 'chieu'), F.pothos(), F.cushion(C.pink), F.petBed()];
  // Pilot: bring the coffee table/rug closer to the sofa, clear center floor.
  // Regenerate all four backgrounds; do not move cropped sprite boxes by CSS.
  const spacious=SPACIOUS_SCENE_PILOT["phong-khach"].next;
  bg[0].position.set(spacious.rug[0],0,spacious.rug[1]);
  bg[1].position.set(spacious.coffeeTable[0],0,spacious.coffeeTable[1]);
  bg[2].position.set(1.9, 0, -2.55);
  bg[3].position.set(-2.55, 0, 2.55);
  bg[4].position.set(2.55, 0, 2.45 - 4.9); bg[4].position.set(2.6, 0, -1.6);
  bg[5].position.set(-0.6, 0, 2.2);
  bg[6].position.set(1.6, 0, 2.2);
  const win = F.windowW({ sky: SKY[time], stars: time === 'dem', moon: time === 'dem', cloud: time === 'ngay' || time === 'sang' });
  F.onWall(win, 'R', -1.2, 1.55);
  const bgAll = [st, ...bg, win]; bgAll.forEach(o => s.add(o));
  // vật tương tác (lớp rời)
  L.sofa = F.sofa(); F.onWall(L.sofa, 'L', 1.25, 0); L.sofa.position.x = -2.45; s.add(L.sofa);
  L.khunganh = F.photoFrame(); F.onWall(L.khunganh, 'L', 1.25, 1.75); s.add(L.khunganh);
  L.lich = F.calendar(); F.onWall(L.lich, 'R', 0.45, 1.7); s.add(L.lich);
  L.bangghim = F.corkboard(false); F.onWall(L.bangghim, 'R', 1.95, 1.7); s.add(L.bangghim);
  L.radio = F.radio(false); L.radio.position.set(2.15, 0.79, -2.55); s.add(L.radio);
  L.hu = F.jar('day');
  // The jar sits on the coffee table, so it must follow the real 3D table.
  L.hu.position.set(spacious.coffeeTable[0],0.53,spacious.coffeeTable[1]);
  s.add(L.hu);
  s.userData.L = L; s.userData.bg = [shell, ...bgAll];
  return s;
}

const cam = () => isoCamera(ROOM.w, ROOM.h, ROOM.ppm, ROOM.target);

/** Source-only introspection; room.js still produces identical shipped renders.
 * Default-state living-room inspection, NOT approval of alternate item states.
 */
export function inspectLivingSource() {
  const source=scene("ngay"), L=source.userData.L, bg=source.userData.bg;
  return {
    source,camera:cam(),n:6,d:6,
    items:[
      {itemId:"sofa",state:"default",layerId:"pk_sofa",object:L.sofa},
      {itemId:"khunganh",state:"default",layerId:"pk_khung_anh",object:L.khunganh},
      {itemId:"lich",state:"default",layerId:"pk_lich",object:L.lich},
      {itemId:"bangghim",state:"trong",layerId:"pk_bang_ghim_trong",object:L.bangghim},
      {itemId:"radio",state:"tat",layerId:"pk_radio_tat",object:L.radio},
      {itemId:"hu",state:"day",layerId:"pk_hu_day",object:L.hu},
    ],
    backgrounds:[
      {id:"stairs",kind:"UNCLASSIFIED_SOURCE_PROP",object:bg[1]},
      {id:"rug",kind:"FLOOR_COVERING_NOT_BLOCKER",object:bg[2]},
      {id:"coffee_table",kind:"UNCLASSIFIED_SOURCE_PROP",object:bg[3]},
      {id:"low_bookshelf",kind:"UNCLASSIFIED_SOURCE_PROP",object:bg[4]},
      {id:"floor_lamp",kind:"UNCLASSIFIED_SOURCE_PROP",object:bg[5]},
      {id:"pothos",kind:"UNCLASSIFIED_SOURCE_PROP",object:bg[6]},
      {id:"floor_cushion",kind:"UNCLASSIFIED_SOURCE_PROP",object:bg[7]},
      {id:"pet_bed",kind:"UNCLASSIFIED_SOURCE_PROP",object:bg[8]},
      {id:"window",kind:"WALL_OR_RAISED_DECOR",object:bg[9]},
    ],
  };
}

function layerShot(s, keep, extra = []) {
  // chỉ hiện các vật trong keep + mặt hứng bóng
  const vis = [];
  s.traverse(o => { if (o.isMesh || o.isGroup) vis.push([o, o.visible]); });
  s.userData.bg.forEach(o => o.visible = false);
  Object.values(s.userData.L).forEach(o => o.visible = keep.includes(o));
  const catchers = [(() => { const m = shadowCatcher(5.6, 5.6, 0.035); m.position.x = 0.2; m.position.z = 0.2; return m; })(), (() => { const m = shadowCatcher(5.6, 2.2, 0, 0.14); m.rotation.set(0, Math.PI / 2, 0); m.position.set(-2.99, 1.5, 0.2); return m; })(),
    (() => { const m = shadowCatcher(5.6, 2.2, 0, 0.14); m.rotation.set(0, 0, 0); m.position.set(0.2, 1.5, -2.99); return m; })()];
  catchers.forEach(c => s.add(c)); extra.forEach(e => s.add(e));
  const d = shoot(s, cam());
  catchers.forEach(c => s.remove(c)); extra.forEach(e => s.remove(e));
  vis.forEach(([o, v]) => o.visible = v);
  return d;
}

function quad(c, obj, w, h, dy = 0) { // 4 góc (trên-trái, trên-phải, dưới-phải, dưới-trái) của mặt phẳng cục bộ
  obj.updateMatrixWorld(true);
  return [[-w / 2, h / 2], [w / 2, h / 2], [w / 2, -h / 2], [-w / 2, -h / 2]].map(([x, y]) => {
    const v = new THREE.Vector3(x, y + dy, 0.075).applyMatrix4(obj.matrixWorld); return toPx(c, v.x, v.y, v.z);
  });
}

export const jobs = {
  nen: async () => {
    const out = [];
    for (const t of ['sang', 'ngay', 'chieu', 'dem']) {
      const s = scene(t); Object.values(s.userData.L).forEach(o => o.visible = false);
      out.push({ file: `phong_khach_${t}@3x.png`, data: shoot(s, cam()) });
    }
    const s = scene('ngay'), c = cam(), L = s.userData.L;
    const meta = {
      size: [ROOM.w, ROOM.h], ppm: ROOM.ppm,
      origin: toPx(c, 0, 0, 0), ex: toPx(c, 1, 0, 0), ez: toPx(c, 0, 0, 1), ey: toPx(c, 0, 1, 0),
      lichQuad: quad(c, L.lich, F.CAL_FACE.w, F.CAL_FACE.h, F.CAL_FACE.y),
      anhQuad: quad(c, L.khunganh, F.FRAME_FACE.w, F.FRAME_FACE.h),
      cuasoQuad: (() => { const w = F.windowW(); F.onWall(w, 'R', -1.2, 1.55); return quad(c, w, 1.0, 1.1); })(),
      ghe: [toPx(c, -2.25, 0.42, 0.75), toPx(c, -2.25, 0.42, 1.75)],
      dung: [toPx(c, -0.85, 0, -0.05), toPx(c, 1.95, 0, 0.95), toPx(c, 0.6, 0, 2.1)],
      thu: toPx(c, 1.6, 0.1, 2.2),
      radioTop: toPx(c, 2.15, 1.25, -2.55)
    };
    out.push({ file: 'phong_khach_meta', meta });
    return out;
  },
  lop: async () => {
    const out = [], s = scene('ngay'), L = s.userData.L;
    const one = (name, obj) => out.push({ file: name, data: layerShot(s, [obj]) });
    one('pk_sofa@3x.png', L.sofa); one('pk_khung_anh@3x.png', L.khunganh); one('pk_lich@3x.png', L.lich);
    one('pk_bang_ghim_trong@3x.png', L.bangghim);
    const cb = F.corkboard(true); F.onWall(cb, 'R', 1.95, 1.7); s.remove(L.bangghim); L.bangghim = cb; s.add(cb); one('pk_bang_ghim_giay@3x.png', cb);
    one('pk_radio_tat@3x.png', L.radio);
    const r2 = F.radio(true); r2.position.copy(L.radio.position); s.remove(L.radio); L.radio = r2; s.add(r2); one('pk_radio_phat@3x.png', r2);
    for (const st of ['day', 'nua', 'it', 'mo']) { const j = F.jar(st); j.position.copy(L.hu.position); s.remove(L.hu); L.hu = j; s.add(j); one(`pk_hu_${st}@3x.png`, j); }
    // cửa sổ mưa: chỉ lớp kính + giọt
    const w = F.windowW({ sky: 0xA9BFD6, rain: true }); F.onWall(w, 'R', -1.2, 1.55); L.mua = w; s.add(w); one('pk_cuaso_mua@3x.png', w);
    return out;
  }
};
