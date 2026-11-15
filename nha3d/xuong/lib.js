// TỰ SINH từ _xuong-3d/ bởi scripts/sync-nha3d.mjs — đừng sửa tay.
// Xưởng 3D Góc Nhỏ — luật chung theo mục 2 của brief.
// Camera trực giao, xoay ngang 45°, nghiêng 35.26°, nhìn từ góc trước-phải.
// Toon 3 bậc, viền ngoài #1D2B4F dày cố định theo pixel, bóng mềm xanh than 18%.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
export { THREE };

export const C = {
  white: 0xFFFFFF, cloud: 0xF6FAFF, sky: 0x7CC3F2, sky2: 0xD8EEFF, sky3: 0xEAF5FF,
  pink: 0xFF6FA5, pinkD: 0xD93A7B, petal: 0xFFE6F0, pinkL: 0xFFB8D2, leaf: 0x2FA463, leafL: 0x8FD6A5, leafD: 0x1F7D49,
  navy: 0x1D2B4F, wood: 0xE8C9A0, woodD: 0xC99B6D, woodDD: 0xA77B52, butter: 0xFFD66B, butterD: 0xF2B84B,
  skin: 0xFFE2CF, blush: 0xFF9DBE, hairA: 0x4A3328, hairE: 0x7A4E36, lilac: 0xC9B6F2, lilacD: 0x9C86E0,
  earth: 0xB98A62, earthD: 0x8E6446, grass: 0x8FD07A, grassD: 0x5DB06A, sand: 0xF5E2B8, sea: 0x7CC3F2, seaD: 0x4FA6E0,
  stone: 0xDCE6F2, stoneD: 0xB9C8DA, orange: 0xFFB36B, orangeD: 0xF08A4B
};

// ---------- vật liệu ----------
function gradientMap() {
  const d = new Uint8Array([90, 175, 255]); // 3 bậc sáng
  const t = new THREE.DataTexture(d, 3, 1, THREE.RedFormat);
  t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t;
}
const GRAD = gradientMap();
const mats = new Map();
export function mat(color, o = {}) {
  const k = color + '|' + [o.basic, o.opacity, o.emissive, o.ei, o.side].join(',');
  if (mats.has(k)) return mats.get(k);
  let m;
  if (o.basic) m = new THREE.MeshBasicMaterial({ color, transparent: o.opacity < 1, opacity: o.opacity ?? 1 });
  else m = new THREE.MeshToonMaterial({ color, gradientMap: GRAD, emissive: o.emissive ?? 0x000000, emissiveIntensity: o.ei ?? 1, transparent: o.opacity < 1, opacity: o.opacity ?? 1 });
  if (o.side) m.side = o.side;
  mats.set(k, m); return m;
}

// Viền ngoài dạng vỏ lật (inverted hull), dày cố định theo pixel ảnh.
export const OUT = { px: 7.5, res: new THREE.Vector2(1170, 1170) };
const outlineMat = new THREE.ShaderMaterial({
  uniforms: { uPx: { value: 7.5 }, uRes: { value: OUT.res }, uColor: { value: new THREE.Color(C.navy) } },
  vertexShader: `uniform float uPx; uniform vec2 uRes; attribute float wscale;
    void main(){ vec4 clip = projectionMatrix * modelViewMatrix * vec4(position,1.0);
      vec3 n = normalize(normalMatrix * normal); vec2 d = n.xy; float l = length(d);
      d = l > 1e-4 ? d / l : vec2(0.0);
      clip.xy += d * uPx * 2.0 / uRes * clip.w; clip.z += 0.0004 * clip.w; gl_Position = clip; }`,
  fragmentShader: `uniform vec3 uColor;
 void main(){ gl_FragColor = vec4(uColor,1.0);
 #include <colorspace_fragment>
 }`,
  side: THREE.BackSide
});
export function setOutline(px, w, h) { outlineMat.uniforms.uPx.value = px; OUT.res.set(w, h); }
const hullCache = new WeakMap();
function hullGeo(g) {
  if (hullCache.has(g)) return hullCache.get(g);
  let h = g.clone(); h.deleteAttribute('normal'); if (h.attributes.uv) h.deleteAttribute('uv');
  h = mergeVertices(h, 1e-3); h.computeVertexNormals(); hullCache.set(g, h); return h;
}

// Đặt một khối: mesh toon + viền. Trả về group để xoay/dịch.
export function piece(geo, color, o = {}) {
  const g = new THREE.Group();
  const m = new THREE.Mesh(geo, o.material || mat(color, { basic: o.basic, opacity: o.opacity, emissive: o.emissive, ei: o.ei, side: o.side }));
  m.castShadow = o.cast !== false; m.receiveShadow = !!o.receive;
  g.add(m);
  if (!o.noOutline) { const h = new THREE.Mesh(hullGeo(geo), outlineMat); h.renderOrder = -1; g.add(h); }
  if (o.pos) g.position.set(...o.pos);
  if (o.rot) g.rotation.set(...o.rot);
  if (o.scale) typeof o.scale === 'number' ? g.scale.setScalar(o.scale) : g.scale.set(...o.scale);
  if (o.parent) o.parent.add(g);
  return g;
}

// ---------- hình khối bo tròn ----------
export const rbox = (w, h, d, r = 0.04, seg = 3) => new RoundedBoxGeometry(w, h, d, seg, Math.min(r, w / 2 - 1e-3, h / 2 - 1e-3, d / 2 - 1e-3));
export const sphere = (r, ws = 24, hs = 16, ...a) => new THREE.SphereGeometry(r, ws, hs, ...a);
export const capsule = (r, len, cs = 6, rs = 16) => new THREE.CapsuleGeometry(r, len, cs, rs);
// trụ bo mép (dùng lathe để pháp tuyến mượt)
export function rcyl(rTop, rBot, h, bevel = 0.03, seg = 28) {
  const b = Math.min(bevel, rTop * 0.9, rBot * 0.9, h / 2.2), pts = [];
  pts.push(new THREE.Vector2(0, -h / 2));
  for (let i = 0; i <= 4; i++) { const a = -Math.PI / 2 + i / 4 * Math.PI / 2; pts.push(new THREE.Vector2(rBot - b + Math.cos(a) * b, -h / 2 + b + Math.sin(a) * b)); }
  for (let i = 0; i <= 4; i++) { const a = i / 4 * Math.PI / 2; pts.push(new THREE.Vector2(rTop - b + Math.cos(a) * b, h / 2 - b + Math.sin(a) * b)); }
  pts.push(new THREE.Vector2(0, h / 2));
  return new THREE.LatheGeometry(pts, seg);
}
export const lathe = (pts, seg = 28) => new THREE.LatheGeometry(pts.map(p => new THREE.Vector2(p[0], p[1])), seg);
export const torus = (R, r, arc = Math.PI * 2, rs = 10, ts = 28) => new THREE.TorusGeometry(R, r, rs, ts, arc);
export const tube = (pts, r, seg = 24, rs = 10) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p))), seg, r, rs, false);
export function capTube(pts, r) { // ống có 2 đầu tròn
  const g = new THREE.Group();
  return g;
}
// lá: hình giọt dẹt
export function leafGeo(len = 0.2, wid = 0.09, thick = 0.025) {
  const g = new THREE.SphereGeometry(1, 16, 10); g.scale(wid, thick, len / 2); g.translate(0, 0, len / 2);
  const p = g.attributes.position; // nhọn đầu
  for (let i = 0; i < p.count; i++) { const z = p.getZ(i) / len; const k = z > 0.5 ? 1 - (z - 0.5) * 0.9 : 1; p.setX(i, p.getX(i) * k); }
  g.computeVertexNormals(); return g;
}

// ---------- cảnh, đèn, camera ----------
export const TIMES = {
  ngay:  { key: 0xFFF4E6, ki: 0.9, fill: 0xD8EEFF, fi: 0.36, amb: 0xFFFFFF, ai: 1.75, sky: [0x9FD5F7, 0x7CC3F2], tint: null },
  sang:  { key: 0xFFC9A8, ki: 0.95, fill: 0xD8EEFF, fi: 0.36, amb: 0xFFE4EC, ai: 1.45, sky: [0xFFD6DE, 0xB9DEF7], tint: null },
  chieu: { key: 0xFFA877, ki: 1.0, fill: 0xC9B6F2, fi: 0.45, amb: 0xFFD6DE, ai: 1.25, sky: [0xFFB98A, 0x9C86E0], tint: null },
  dem:   { key: 0xA9BEF0, ki: 0.45, fill: 0x6F92D6, fi: 0.3, amb: 0x7F95CC, ai: 0.95, sky: [0x2A3D6E, 0x1D2B4F], tint: null }
};
export function makeScene(time = 'ngay', o = {}) {
  const s = new THREE.Scene(), T = TIMES[time];
  s.add(new THREE.AmbientLight(T.amb, T.ai));
  const key = new THREE.DirectionalLight(T.key, T.ki);
  // đèn chính từ trên-trái-sau: bóng đổ lệch về góc dưới-phải màn hình
  key.position.set(...(o.keyPos || [-5, 12, 1.2])); key.castShadow = true;
  const sz = o.shadowSize ?? 8;
  Object.assign(key.shadow.camera, { left: -sz, right: sz, top: sz, bottom: -sz, near: 0.1, far: 60 });
  key.shadow.mapSize.set(o.shadowRes ?? 2048, o.shadowRes ?? 2048); key.shadow.radius = o.shadowBlur ?? 6; key.shadow.blurSamples = 16; key.shadow.bias = -0.0005;
  key.target.position.set(...(o.target || [0, 0, 0])); key.position.add(key.target.position);
  s.add(key, key.target);
  const fill = new THREE.DirectionalLight(T.fill, T.fi); fill.position.set(8, 5, -6); s.add(fill);
  s.userData = { key, fill, T };
  return s;
}
// mặt hứng bóng (bóng xanh than 18%)
export function shadowCatcher(w = 20, d = 20, y = 0.001, opacity = 0.18) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.ShadowMaterial({ color: C.navy, opacity }));
  m.rotation.x = -Math.PI / 2; m.position.y = y; m.receiveShadow = true; return m;
}

const EL = Math.atan(1 / Math.SQRT2); // 35.264°
export function isoCamera(w, h, ppm, target = [0, 0, 0], shift = [0, 0]) {
  const cam = new THREE.OrthographicCamera(-w / 2 / ppm, w / 2 / ppm, h / 2 / ppm, -h / 2 / ppm, -200, 400);
  const t = new THREE.Vector3(...target), dir = new THREE.Vector3(1, 1, 1).normalize();
  cam.position.copy(t).addScaledVector(dir, 100); cam.up.set(0, 1, 0); cam.lookAt(t);
  // dịch khung hình (pixel) mà không đổi góc
  cam.left -= shift[0] / ppm; cam.right -= shift[0] / ppm; cam.top += shift[1] / ppm; cam.bottom += shift[1] / ppm;
  cam.updateProjectionMatrix(); cam.updateMatrixWorld(true); cam.userData = { w, h, ppm, target, shift };
  return cam;
}
// toạ độ thế giới -> pixel trên ảnh (để app đặt nhân vật, vùng chạm, chữ)
export function toPx(cam, x, y, z) {
  const v = new THREE.Vector3(x, y, z).project(cam), { w, h } = cam.userData;
  return [Math.round((v.x + 1) / 2 * w * 10) / 10, Math.round((1 - v.y) / 2 * h * 10) / 10];
}

let R = null;
export function renderer(w, h) {
  if (!R) {
    R = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    R.shadowMap.enabled = true; R.shadowMap.type = THREE.VSMShadowMap;
    R.outputColorSpace = THREE.SRGBColorSpace; R.setPixelRatio(1);
    document.body.appendChild(R.domElement);
  }
  R.setSize(w, h, false); R.setClearColor(0x000000, 0); return R;
}
export function shoot(scene, cam, o = {}) {
  const { w, h } = cam.userData; const r = renderer(w, h);
  setOutline(o.outline ?? OUT.px, w, h);
  if (o.bg != null) r.setClearColor(o.bg, 1);
  r.render(scene, cam);
  return r.domElement.toDataURL('image/png');
}
