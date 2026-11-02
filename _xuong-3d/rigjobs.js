import { THREE, makeScene, isoCamera, shoot, shadowCatcher } from './lib.js';
import * as RG from './rig.js';
const S = 512, PPM = 380, AY = 48;
function shot(obj, withShadow) {
  const s = makeScene('ngay', { shadowSize: 2, shadowBlur: 4, keyPos: [-2.2, 12, 0.9] });
  if (withShadow) s.add(shadowCatcher(4, 4));
  obj.rotation.y = Math.PI / 4; s.add(obj);
  return shoot(s, isoCamera(S, S, PPM, [0, 0, 0], [0, S / 2 - AY]));
}
function all(filter) {
  const L = [];
  for (const p of RG.POSES) {
    L.push(['than', null, p, `nv_than_${p}`]);
    for (const k of Object.keys(RG.TOPS)) L.push(['ao', k, p, `nv_ao_${k}_${p}`]);
    for (const k of Object.keys(RG.BOTS)) L.push(['quan', k, p, `nv_quan_${k}_${p}`]);
    for (const k of Object.keys(RG.HATS)) if (k !== 'khong') L.push(['mu', k, p, `nv_mu_${k}_${p}`]);
    for (const k of Object.keys(RG.ACCS)) if (k !== 'khong') L.push(['phukien', k, p, `nv_pk_${k}_${p}`]);
    for (const k of Object.keys(RG.EXPRS)) L.push(['mat', k, p, `nv_mat_${k}_${p}`]);
    for (const st of Object.keys(RG.HAIRS)) for (const c of Object.keys(RG.HAIR_COLORS)) L.push(['toc', { style: st, color: c }, p, `nv_toc_${st}_${c}_${p}`]);
  }
  return filter ? L.filter(filter) : L;
}
async function run(list) { const out = []; for (const [k, o, p, f] of list) { if (k === 'chantran' ) continue; out.push({ file: f + '@3x.png', data: shot(RG.layer(k, o, p), k === 'than') }); } return out; }
const DL = RG.DEFAULT_LOOK;
const isDefaultish = ([k, o, p]) => p === 'dung' && (k === 'than' || k === 'mat' && ['vui', 'cuoi'].includes(o) || (k === 'toc' && ['dennau', 'hatde', 'hongphan'].includes(o.color)) || ['ao', 'quan', 'mu', 'phukien'].includes(k));
export const jobs = {
  thu: async () => run(all(isDefaultish)),
  dung: async () => run(all(x => x[2] === 'dung')),
  vaytay: async () => run(all(x => x[2] === 'vaytay')),
  ngoi: async () => run(all(x => x[2] === 'ngoi')),
  meta: async () => [{ file: 'rig_meta', meta: { size: S, ppm: PPM, anchor: [S / 2, S - AY], poses: RG.POSES, hairs: RG.HAIRS, hairColors: Object.fromEntries(Object.entries(RG.HAIR_COLORS).map(([k, v]) => [k, v[0]])), tops: RG.TOPS, bots: RG.BOTS, hats: RG.HATS, accs: RG.ACCS, exprs: RG.EXPRS, defaults: DL, order: ['than', 'quan', 'ao', 'mat', 'toc', 'mu', 'phukien'] } }]
};
