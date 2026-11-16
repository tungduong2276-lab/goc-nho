// Mô hình 3D cho luống trồng và chậu trồng, theo đúng luật xưởng (toon 3 bậc, viền xanh than).
// Hình cây đổi theo khoá "loài:giai đoạn:khat|am" do garden.mjs tính.
import { THREE, C, piece, rbox, sphere, rcyl, leafGeo, tube } from "./xuong/lib.js";
import { SPECIES } from "./garden.mjs";

const G = () => new THREE.Group();
const SOIL = 0x7A5236, SOIL_WET = 0x5A3A26;

function parseKey(key) {
  if (!key || key === "trong") return null;
  const [sp, st, wet] = key.split(":");
  return { sp, stage: +st, thirsty: wet === "khat" };
}

// Một khóm cây tại (x,z) trong khung cục bộ; s = độ lớn theo giai đoạn.
function sprout(g, x, z, plant) {
  const { sp, stage, thirsty } = plant, def = SPECIES[sp];
  const droop = thirsty ? 0.55 : 0;
  const leaf = thirsty ? 0x9BBF6A : C.leaf, leafL = thirsty ? 0xB8CF86 : C.leafL;
  if (stage === 0) { // hạt và mô đất nhỏ
    piece(sphere(0.06, 12, 8).scale(1, 0.45, 1), SOIL_WET, { pos: [x, 0.005, z], parent: g, noOutline: true });
    piece(sphere(0.022, 8, 6).scale(1, 0.7, 1), 0xF2D9A6, { pos: [x, 0.03, z], parent: g });
    return;
  }
  if (stage === 1) { // hai lá mầm
    piece(tube([[x, 0, z], [x, 0.08, z]], 0.012, 4, 5), C.leafD, { parent: g, noOutline: true });
    for (const s of [-1, 1]) piece(leafGeo(0.09, 0.06, 0.02), leafL, { pos: [x + s * 0.035, 0.085, z], rot: [-0.9 - droop, s > 0 ? 0 : Math.PI, 0], parent: g });
    return;
  }
  const h = stage === 2 ? 0.2 : 0.36;
  const nLeaf = stage === 2 ? 4 : 6;
  if (sp === "xalach") { // búp lá tròn
    const r = stage === 2 ? 0.08 : stage === 3 ? 0.12 : 0.15;
    for (let i = 0; i < 7; i++) piece(sphere(r * 0.7, 12, 8).scale(1, 0.55, 1.15), i % 2 ? leaf : leafL, { pos: [x + Math.cos(i * 0.9) * r * 0.45, r * 0.45 - droop * 0.03, z + Math.sin(i * 0.9) * r * 0.45], rot: [0.5 + droop, i * 0.9, 0], parent: g });
    piece(sphere(r * 0.65, 14, 10), leafL, { pos: [x, r * 0.6, z], parent: g });
    return;
  }
  // thân + lá cho các loài còn lại
  piece(tube([[x, 0, z], [x + 0.01, h * 0.5, z], [x, h, z]], stage === 2 ? 0.014 : 0.02, 8, 6), C.leafD, { parent: g, noOutline: true });
  for (let i = 0; i < nLeaf; i++) {
    const y = 0.05 + (i / nLeaf) * h * 0.8, a = i * 2.3;
    piece(leafGeo(stage === 2 ? 0.11 : 0.15, stage === 2 ? 0.06 : 0.08, 0.02), i % 2 ? leaf : leafL, { pos: [x + Math.cos(a) * 0.03, y, z + Math.sin(a) * 0.03], rot: [-1.1 - droop, a, 0], parent: g });
  }
  if (stage < 4) {
    if (stage === 3 && !thirsty) piece(sphere(0.035, 10, 8), sp === "huongduong" || sp === "tulip" || sp === "oaihuong" ? 0x9BD38A : 0xC9E7A8, { pos: [x, h + 0.03, z], parent: g });
    return;
  }
  // giai đoạn chín: quả hoặc hoa
  const col = def.color;
  if (sp === "dau") for (let i = 0; i < 4; i++) { const a = i * 1.6; const p = [x + Math.cos(a) * 0.09, 0.1 + (i % 2) * 0.08, z + Math.sin(a) * 0.09]; piece(sphere(0.045, 12, 10).scale(1, 1.25, 1), col, { pos: p, parent: g }); piece(leafGeo(0.04, 0.03, 0.01), C.leaf, { pos: [p[0], p[1] + 0.055, p[2]], rot: [-1.4, a, 0], parent: g, noOutline: true }); }
  else if (sp === "cachua") for (let i = 0; i < 6; i++) { const a = i * 1.1; piece(sphere(0.04, 12, 10), i === 5 ? 0xFFB347 : col, { pos: [x + Math.cos(a) * 0.08, 0.14 + (i % 3) * 0.07, z + Math.sin(a) * 0.08], parent: g }); }
  else if (sp === "tulip") { piece(sphere(0.07, 14, 10).scale(0.85, 1.25, 0.85), col, { pos: [x, h + 0.07, z], parent: g }); for (let i = 0; i < 3; i++) piece(sphere(0.045, 10, 8).scale(0.6, 1.3, 0.6), 0xFFB8D2, { pos: [x + Math.cos(i * 2.1) * 0.045, h + 0.09, z + Math.sin(i * 2.1) * 0.045], parent: g, noOutline: true }); }
  else if (sp === "huongduong") {
    const fy = h + 0.16, head = G(); head.position.set(x, fy, z + 0.02); head.rotation.x = -0.35; g.add(head);
    piece(tube([[x, h, z], [x, fy, z]], 0.02, 4, 6), C.leafD, { parent: g, noOutline: true });
    for (let i = 0; i < 12; i++) piece(sphere(0.05, 8, 6).scale(0.5, 0.18, 1), col, { pos: [Math.sin(i * 0.5236) * 0.1, Math.cos(i * 0.5236) * 0.1, 0], rot: [Math.PI / 2, 0, -i * 0.5236], parent: head });
    piece(rcyl(0.07, 0.07, 0.04, 0.015, 20), 0x7A4A22, { rot: [Math.PI / 2, 0, 0], parent: head });
  } else if (sp === "oaihuong") for (let i = 0; i < 5; i++) { const a = i * 1.26, px = x + Math.cos(a) * 0.06, pz = z + Math.sin(a) * 0.06; piece(tube([[x, 0.05, z], [px, h + 0.05, pz]], 0.008, 4, 4), C.leafD, { parent: g, noOutline: true }); for (let k = 0; k < 4; k++) piece(sphere(0.022, 8, 6), col, { pos: [px, h + 0.06 + k * 0.035, pz], parent: g }); }
}

function bedFrame(w, d, wet) {
  const g = G(), h = 0.26;
  piece(rbox(w, h, d, 0.04), C.woodD, { pos: [0, h / 2, 0], parent: g });
  for (const s of [-1, 1]) piece(rbox(w + 0.02, 0.05, 0.06, 0.02), C.wood, { pos: [0, h, s * (d / 2 - 0.03)], parent: g, noOutline: true });
  for (const s of [-1, 1]) piece(rbox(0.06, 0.05, d, 0.02), C.wood, { pos: [s * (w / 2 - 0.03), h, 0], parent: g, noOutline: true });
  piece(new THREE.BoxGeometry(w - 0.1, 0.02, d - 0.1), wet ? SOIL_WET : SOIL, { pos: [0, h - 0.02, 0], parent: g, noOutline: true, receive: true });
  return { g, top: h - 0.01 };
}

// Luống 3 × 2 ô (1,5 m × 1 m): ba khóm cây cùng loài.
export function gardenBed(key) {
  const p = parseKey(key);
  const { g, top } = bedFrame(1.4, 0.9, p && !p.thirsty);
  if (p) { for (const x of [-0.42, 0, 0.42]) { const c = G(); c.position.set(x, top, 0); c.scale.setScalar(1.45); g.add(c); sprout(c, 0, 0, p); } }
  else for (const x of [-0.42, 0, 0.42]) piece(sphere(0.05, 10, 8).scale(1, 0.35, 1), SOIL_WET, { pos: [x, top + 0.01, 0], parent: g, noOutline: true });
  return g;
}

// Chậu trồng 1 × 1 ô: một khóm.
export function gardenPot(key) {
  const p = parseKey(key), g = G(), h = 0.24;
  piece(rcyl(0.17, 0.13, h, 0.03, 24), 0xE88A5E, { pos: [0, h / 2, 0], parent: g });
  piece(rcyl(0.185, 0.185, 0.05, 0.02, 24), 0xF0A27A, { pos: [0, h - 0.02, 0], parent: g });
  piece(rcyl(0.15, 0.15, 0.02, 0.01, 20), p && !p.thirsty ? SOIL_WET : SOIL, { pos: [0, h - 0.01, 0], parent: g, noOutline: true });
  if (p) { const c = G(); c.position.y = h; c.scale.setScalar(1.5); g.add(c); sprout(c, 0, 0, p); }
  return g;
}

// Bình tưới cầm tay hiện cạnh người đang tưới.
export function wateringCan() {
  const g = G();
  piece(rcyl(0.08, 0.09, 0.14, 0.02, 18), 0x7CC3F2, { pos: [0, 0.07, 0], parent: g });
  piece(tube([[0.07, 0.06, 0], [0.16, 0.13, 0], [0.2, 0.15, 0]], 0.014, 8, 6), 0x7CC3F2, { parent: g });
  piece(tube([[-0.06, 0.12, 0], [-0.1, 0.2, 0], [0.02, 0.21, 0]], 0.012, 8, 6), 0x4FA6E0, { parent: g });
  return g;
}
