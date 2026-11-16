// Generates the flat "chibi" character layers and pet sprites as SVG into assets/chibi/.
// File names mirror the 3D sprites in assets/3d (nv_* layers, thu_* pets) so the app can
// switch art style by changing only the asset path. Every file is a full 512x512 frame
// with the feet anchored at (256,464), the same frame the 3D rig uses.
// Run: node scripts/gen-chibi-art.mjs          (writes files)
//      node scripts/gen-chibi-art.mjs --check  (fails if files on disk are stale)
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const out = resolve(root, "assets/chibi");
const scene = JSON.parse(readFileSync(resolve(root, "assets/3d/scene.json"), "utf8"));

const SKIN = "#FFE0C2", SKIN_D = "#F5C6A0", INK = "#3B2A26", BLUSH = "#FFB3B3", WHITE = "#FFFFFF";
const r1 = n => Math.round(n * 10) / 10;
const el = (cx, cy, rx, ry, fill, rot = 0, extra = "") =>
  `<ellipse cx="${r1(cx)}" cy="${r1(cy)}" rx="${rx}" ry="${ry}" fill="${fill}"${rot ? ` transform="rotate(${rot} ${r1(cx)} ${r1(cy)})"` : ""}${extra}/>`;
const ci = (cx, cy, r, fill, extra = "") => `<circle cx="${r1(cx)}" cy="${r1(cy)}" r="${r}" fill="${fill}"${extra}/>`;
const rc = (x, y, w, h, rx, fill, extra = "") => `<rect x="${r1(x)}" y="${r1(y)}" width="${w}" height="${h}" rx="${rx}" fill="${fill}"${extra}/>`;
const pa = (d, fill, extra = "") => `<path d="${d}" fill="${fill}"${extra}/>`;
const ln = (d, stroke, w = 4) => `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
const svg = body => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">${body}</svg>\n`;

// ---------- character skeleton per pose ----------
// dy: how far head and torso sit below the standing position. Hands: L = screen left.
const POSE = {
  dung:   { dy: 0,  sit: false, armL: { cx: 196, cy: 350, rot: 12 },  armR: { cx: 316, cy: 350, rot: -12 }, handL: [190, 384], handR: [322, 384] },
  vaytay: { dy: 0,  sit: false, armL: { cx: 196, cy: 350, rot: 12 },  armR: { cx: 332, cy: 304, rot: -140 }, handL: [190, 384], handR: [354, 276] },
  ngoi:   { dy: 56, sit: true,  armL: { cx: 200, cy: 402, rot: 16 },  armR: { cx: 312, cy: 402, rot: -16 }, handL: [200, 436], handR: [312, 436] }
};
const head = p => [256, 214 + p.dy];
const torso = p => (p.sit ? { x: 204, y: 352, w: 104, h: 92 } : { x: 204, y: 296, w: 104, h: 110 });
const legs = p => (p.sit
  ? { L: { cx: 226, cy: 448, rx: 23, ry: 30 }, R: { cx: 286, cy: 448, rx: 23, ry: 30 }, footL: [222, 474], footR: [290, 474] }
  : { L: { x: 224, y: 392, w: 28, h: 62 }, R: { x: 260, y: 392, w: 28, h: 62 }, footL: [236, 456], footR: [276, 456] });
const armShape = (a, fill, len = 34) => el(a.cx, a.cy, 15, len, fill, a.rot);
// short sleeve: only the half of the arm nearest the shoulder
const sleeveShort = (a, p, side, fill) => {
  const sh = side === "L" ? [208, 318 + p.dy] : [304, 318 + p.dy];
  return el((a.cx + sh[0]) / 2, (a.cy + sh[1]) / 2, 19, 22, fill, a.rot);
};

function body(p) {
  const [hx, hy] = head(p), t = torso(p), l = legs(p);
  let s = el(256, p.sit ? 480 : 466, p.sit ? 104 : 88, p.sit ? 18 : 16, "rgba(70,45,30,.16)");
  if (p.sit) s += el(l.L.cx, l.L.cy, l.L.rx, l.L.ry, SKIN, 8) + el(l.R.cx, l.R.cy, l.R.rx, l.R.ry, SKIN, -8);
  else s += rc(l.L.x, l.L.y, l.L.w, l.L.h, 13, SKIN) + rc(l.R.x, l.R.y, l.R.w, l.R.h, 13, SKIN);
  s += el(l.footL[0], l.footL[1], 20, 11, SKIN) + el(l.footR[0], l.footR[1], 20, 11, SKIN);
  s += armShape(p.armL, SKIN) + armShape(p.armR, SKIN);
  s += rc(t.x, t.y, t.w, t.h, 40, SKIN);
  s += ci(p.handL[0], p.handL[1], 13, SKIN) + ci(p.handR[0], p.handR[1], 13, SKIN);
  s += ci(hx - 97, hy + 12, 15, SKIN) + ci(hx + 97, hy + 12, 15, SKIN) + ci(hx - 97, hy + 12, 7, SKIN_D) + ci(hx + 97, hy + 12, 7, SKIN_D);
  s += ci(hx, hy, 100, SKIN);
  return s;
}

// ---------- bottoms and footwear ----------
function bottoms(kind, p) {
  const l = legs(p), t = torso(p);
  const pelvis = fill => rc(t.x + 6, t.y + t.h - 34, t.w - 12, 40, 18, fill);
  const fullLegs = fill => (p.sit
    ? el(l.L.cx, l.L.cy, l.L.rx + 2, l.L.ry + 1, fill, 8) + el(l.R.cx, l.R.cy, l.R.rx + 2, l.R.ry + 1, fill, -8)
    : rc(l.L.x - 2, l.L.y, l.L.w + 4, l.L.h - 4, 12, fill) + rc(l.R.x - 2, l.R.y, l.R.w + 4, l.R.h - 4, 12, fill));
  const shoe = (f, fill, sole, extra = "") => el(f[0], f[1], 23, 13, fill) + rc(f[0] - 23, f[1] + 5, 46, 9, 4.5, sole) + extra;
  switch (kind) {
    case "quandai": return pelvis("#5B7DB1") + fullLegs("#5B7DB1");
    case "short": return pelvis("#F2B56B") + (p.sit
      ? el(l.L.cx + 1, l.L.cy - 16, l.L.rx + 2, 16, "#F2B56B", 8) + el(l.R.cx - 1, l.R.cy - 16, l.R.rx + 2, 16, "#F2B56B", -8)
      : rc(l.L.x - 2, l.L.y, l.L.w + 4, 26, 10, "#F2B56B") + rc(l.R.x - 2, l.R.y, l.R.w + 4, 26, 10, "#F2B56B"));
    case "quanyem": {
      const cuff = p.sit
        ? el(l.footL[0] + 1, l.footL[1] - 10, 24, 8, "#BFD6F2", 8) + el(l.footR[0] - 1, l.footR[1] - 10, 24, 8, "#BFD6F2", -8)
        : rc(l.L.x - 3, l.L.y + l.L.h - 16, l.L.w + 6, 12, 6, "#BFD6F2") + rc(l.R.x - 3, l.R.y + l.R.h - 16, l.R.w + 6, 12, 6, "#BFD6F2");
      return pelvis("#7FA8DC") + fullLegs("#7FA8DC") + cuff;
    }
    case "depbong": return [l.footL, l.footR].map(f => el(f[0], f[1], 24, 14, "#F7A8C4") + el(f[0], f[1] - 7, 20, 8, WHITE) + ci(f[0] - 7, f[1] + 3, 2.5, INK) + ci(f[0] + 7, f[1] + 3, 2.5, INK)).join("");
    case "ungmua": return [l.footL, l.footR].map(f => rc(f[0] - 17, f[1] - 34, 34, 36, 10, "#F7C948") + el(f[0], f[1], 24, 13, "#F7C948") + rc(f[0] - 19, f[1] - 37, 38, 9, 4.5, "#E5A91F")).join("");
    case "giayvai": return [l.footL, l.footR].map(f => shoe(f, "#F06A6A", WHITE, ci(f[0], f[1] - 3, 4, WHITE))).join("");
    default: throw new Error("unknown bottom " + kind);
  }
}

// ---------- tops ----------
function tops(kind, p) {
  const t = torso(p), [hx, hy] = head(p), cx = 256, top = t.y, bot = t.y + t.h;
  const shirt = (fill, h = t.h - 8) => rc(t.x - 2, top, t.w + 4, h, 38, fill);
  const long = fill => armShape(p.armL, fill, 30) + armShape(p.armR, fill, 30);
  const short = fill => sleeveShort(p.armL, p, "L", fill) + sleeveShort(p.armR, p, "R", fill);
  // a dress/coat that flares from the shoulders down to hemY
  const flare = (fill, hem, spread) => pa(`M${t.x + 8} ${top + 26} Q${cx} ${top - 4} ${t.x + t.w - 8} ${top + 26} L${cx + spread} ${hem - 14} Q${cx + spread} ${hem} ${cx + spread - 16} ${hem} L${cx - spread + 16} ${hem} Q${cx - spread} ${hem} ${cx - spread} ${hem - 14} Z`, fill);
  const hemLong = p.sit ? 458 : 432, hemMid = p.sit ? 452 : 418;
  switch (kind) {
    case "hoodie": return long("#6CC5B0") + shirt("#6CC5B0") + pa(`M${cx - 46} ${top + 6} Q${cx} ${top + 38} ${cx + 46} ${top + 6} Q${cx} ${top - 8} ${cx - 46} ${top + 6} Z`, "#4FAE98")
      + rc(cx - 30, bot - 46, 60, 26, 12, "#4FAE98") + ln(`M${cx - 10} ${top + 22} v18`, WHITE, 4) + ln(`M${cx + 10} ${top + 22} v18`, WHITE, 4);
    case "aolen": return long("#E8B4A0") + shirt("#E8B4A0") + rc(cx - 34, top - 4, 68, 24, 12, "#D99A84")
      + [0, 1, 2].map(i => ln(`M${t.x + 14} ${top + 44 + i * 18} h${t.w - 28}`, "#D99A84", 3)).join("");
    case "aothun": return short("#FFD166") + shirt("#FFD166") + pa(`M${cx} ${top + 46} c-9 -13 -30 -4 -22 12 c5 10 22 20 22 20 c0 0 17 -10 22 -20 c8 -16 -13 -25 -22 -12 Z`, "#FF8FAB");
    case "vayyem": return short("#8ED49C") + shirt("#8ED49C", 60) + flare("#F27FA5", hemMid, 72)
      + rc(cx - 40, top + 14, 14, 34, 7, "#F27FA5") + rc(cx + 26, top + 14, 14, 34, 7, "#F27FA5") + ci(cx - 33, top + 44, 5, WHITE) + ci(cx + 33, top + 44, 5, WHITE);
    case "aomua": return long("#F7C948") + flare("#F7C948", hemMid + 8, 70) + pa(`M${cx - 50} ${top + 8} Q${cx} ${top + 40} ${cx + 50} ${top + 8} Q${cx} ${top - 10} ${cx - 50} ${top + 8} Z`, "#E5A91F")
      + ln(`M${cx} ${top + 30} V${hemMid}`, "#E5A91F", 4) + [0, 1, 2].map(i => ci(cx + 10, top + 48 + i * 24, 4.5, "#B7791F")).join("");
    case "dongu": return long("#BFD6F2") + shirt("#BFD6F2") + pa(`M${cx - 30} ${top + 4} L${cx} ${top + 34} L${cx + 30} ${top + 4} Q${cx} ${top - 8} ${cx - 30} ${top + 4} Z`, WHITE)
      + [[-30, 50], [26, 44], [-14, 76], [34, 78], [-36, 88]].map(([dx, dy]) => ci(cx + dx, top + dy, 5, WHITE)).join("") + ci(cx, top + 52, 4, "#7FA8DC") + ci(cx, top + 74, 4, "#7FA8DC");
    case "tapde": return short(WHITE) + shirt("#FDFBF7") + ln(`M${cx - 28} ${top + 40} Q${cx} ${top - 6} ${cx + 28} ${top + 40}`, "#E76F51", 7)
      + pa(`M${cx - 30} ${top + 36} h60 l12 ${t.h - 30} q-42 16 -84 0 Z`, "#F4A261") + rc(cx - 18, top + 64, 36, 22, 8, "#E76F51");
    case "aodai": return long("#CDBDF5") + flare("#CDBDF5", hemLong, 60) + rc(cx - 22, top - 4, 44, 18, 9, "#A892E6")
      + ln(`M${cx - 6} ${top + 14} Q${cx - 34} ${top + 30} ${t.x + 12} ${top + 60}`, "#A892E6", 4) + ci(cx - 22, top + 30, 4, "#FFD166") + ci(cx - 34, top + 44, 4, "#FFD166")
      + ln(`M${cx + 36} ${top + 70} V${hemLong - 6}`, "#A892E6", 3);
    case "aonoel": return long("#D94B4B") + shirt("#D94B4B")
      + rc(t.x - 4, bot - 34, t.w + 8, 22, 11, WHITE) + rc(cx - 9, top + 8, 18, t.h - 36, 9, WHITE) + rc(cx - 40, top - 2, 80, 20, 10, WHITE) + ci(cx, top + 36, 5, "#3F8F5F");
    case "dolamvuon": return short("#F7E9C8") + shirt("#F7E9C8") + pa(`M${cx - 34} ${top + 44} h68 l10 ${t.h - 46} q-44 14 -88 0 Z`, "#6FA86A")
      + rc(cx - 40, top + 10, 12, 44, 6, "#6FA86A") + rc(cx + 28, top + 10, 12, 44, 6, "#6FA86A") + rc(cx - 20, top + 62, 40, 26, 8, "#5B9157") + ci(cx - 34, top + 50, 4.5, "#F7C948") + ci(cx + 34, top + 50, 4.5, "#F7C948");
    default: throw new Error("unknown top " + kind);
  }
}

// ---------- faces ----------
function face(kind, p) {
  const [hx, hy] = head(p), ex = 36, ey = hy + 22, my = hy + 50;
  const eye = (x, rx = 7, ry = 10) => el(x, ey, rx, ry, INK) + ci(x + 2.5, ey - 4, 2.8, WHITE);
  const blush = (o = 1) => el(hx - 60, hy + 46, 15, 9, BLUSH, 0, ` opacity="${o}"`) + el(hx + 60, hy + 46, 15, 9, BLUSH, 0, ` opacity="${o}"`);
  const smile = (w = 12, d = 9) => ln(`M${hx - w} ${my - 4} Q${hx} ${my + d} ${hx + w} ${my - 4}`, INK, 4);
  switch (kind) {
    case "vui": return blush() + eye(hx - ex) + eye(hx + ex) + smile();
    case "cuoi": return blush() + ln(`M${hx - ex - 11} ${ey + 3} Q${hx - ex} ${ey - 12} ${hx - ex + 11} ${ey + 3}`, INK, 5) + ln(`M${hx + ex - 11} ${ey + 3} Q${hx + ex} ${ey - 12} ${hx + ex + 11} ${ey + 3}`, INK, 5)
      + pa(`M${hx - 17} ${my - 8} Q${hx} ${my + 24} ${hx + 17} ${my - 8} Z`, "#B5475B") + pa(`M${hx - 9} ${my + 5} Q${hx} ${my + 14} ${hx + 9} ${my + 5} Q${hx} ${my - 1} ${hx - 9} ${my + 5} Z`, "#FF8FAB");
    case "ngung": return el(hx - 60, hy + 44, 20, 12, "#FF9FA8") + el(hx + 60, hy + 44, 20, 12, "#FF9FA8")
      + [-1, 1].map(s => [0, 1, 2].map(i => ln(`M${hx + s * 60 - 10 + i * 8} ${hy + 49} l5 -10`, "#F0707F", 2.5)).join("")).join("")
      + el(hx - ex + 4, ey + 2, 6, 8, INK) + el(hx + ex + 4, ey + 2, 6, 8, INK) + ci(hx - ex + 6, ey - 1, 2.4, WHITE) + ci(hx + ex + 6, ey - 1, 2.4, WHITE)
      + ln(`M${hx - 10} ${my} q5 -6 10 0 q5 6 10 0`, INK, 3.5);
    case "nho": return blush(.7) + el(hx - ex, ey, 8, 11, INK) + el(hx + ex, ey, 8, 11, INK) + ci(hx - ex + 3, ey - 4, 3.6, WHITE) + ci(hx + ex + 3, ey - 4, 3.6, WHITE) + ci(hx - ex - 3, ey + 4, 2, WHITE) + ci(hx + ex - 3, ey + 4, 2, WHITE)
      + ln(`M${hx - ex - 12} ${ey - 20} l20 -5`, INK, 3.5) + ln(`M${hx + ex + 12} ${ey - 20} l-20 -5`, INK, 3.5) + ln(`M${hx - 9} ${my + 3} Q${hx} ${my - 5} ${hx + 9} ${my + 3}`, INK, 3.5)
      + pa(`M${hx + ex + 14} ${ey + 12} q-6 10 0 14 q6 -4 0 -14 Z`, "#8FD3F4");
    case "doi": return el(hx - 60, hy + 46, 17, 11, "#FF9FA8") + el(hx + 60, hy + 46, 17, 11, "#FF9FA8")
      + ln(`M${hx - ex - 12} ${ey - 22} l22 8`, INK, 4.5) + ln(`M${hx + ex + 12} ${ey - 22} l-22 8`, INK, 4.5)
      + pa(`M${hx - ex - 8} ${ey - 2} a8 9 0 0 0 16 0 Z`, INK) + pa(`M${hx + ex - 8} ${ey - 2} a8 9 0 0 0 16 0 Z`, INK)
      + ln(`M${hx - 8} ${my - 6} q12 4 0 8 q12 4 0 8`, INK, 3.5);
    case "ngac": return blush(.8) + ci(hx - ex, ey, 13, WHITE) + ci(hx + ex, ey, 13, WHITE) + ci(hx - ex, ey, 7, INK) + ci(hx + ex, ey, 7, INK) + ci(hx - ex + 2.5, ey - 3, 2.4, WHITE) + ci(hx + ex + 2.5, ey - 3, 2.4, WHITE)
      + ln(`M${hx - ex - 10} ${ey - 26} q10 -7 20 0`, INK, 3.5) + ln(`M${hx + ex - 10} ${ey - 26} q10 -7 20 0`, INK, 3.5) + el(hx, my + 2, 8, 11, "#B5475B");
    case "buonngu": return blush(.7) + pa(`M${hx - ex - 9} ${ey} a9 8 0 0 0 18 0 Z`, INK) + pa(`M${hx + ex - 9} ${ey} a9 8 0 0 0 18 0 Z`, INK)
      + ln(`M${hx - ex - 12} ${ey - 1} h24`, INK, 4) + ln(`M${hx + ex - 12} ${ey - 1} h24`, INK, 4) + el(hx, my, 7, 9, "#B5475B")
      + pa(`M${hx + 64} ${hy - 6} q-7 12 0 17 q7 -5 0 -17 Z`, "#8FD3F4");
    case "ngu": return blush(.8) + ln(`M${hx - ex - 11} ${ey - 2} Q${hx - ex} ${ey + 10} ${hx - ex + 11} ${ey - 2}`, INK, 4.5) + ln(`M${hx + ex - 11} ${ey - 2} Q${hx + ex} ${ey + 10} ${hx + ex + 11} ${ey - 2}`, INK, 4.5)
      + el(hx, my, 5, 6, "#B5475B") + ln(`M${hx + 96} ${hy - 96} h18 l-18 20 h18`, "#7FA8DC", 4.5) + ln(`M${hx + 124} ${hy - 126} h12 l-12 14 h12`, "#7FA8DC", 3.5);
    default: throw new Error("unknown face " + kind);
  }
}

// ---------- hair ----------
const HAIR = { dennau: ["#4A342B", "#36251E"], hatde: ["#8A5A3C", "#6E452C"], nausua: ["#C49A76", "#A77E5C"], hongphan: ["#F4A6BD", "#E2819E"], xanhpastel: ["#9CCBE0", "#73AECB"] };
function hair(style, color, p) {
  const [hx, hy] = head(p), [c, d] = HAIR[color];
  const dome = `M${hx - 105} ${hy + 20} C${hx - 116} ${hy - 72} ${hx - 62} ${hy - 114} ${hx} ${hy - 114} C${hx + 62} ${hy - 114} ${hx + 116} ${hy - 72} ${hx + 105} ${hy + 20}`;
  const swept = ` Q${hx + 98} ${hy - 30} ${hx + 44} ${hy - 44} Q${hx - 28} ${hy - 56} ${hx - 70} ${hy - 14} Q${hx - 94} ${hy} ${hx - 105} ${hy + 20} Z`;
  const parted = ` Q${hx + 92} ${hy - 34} ${hx + 8} ${hy - 66} Q${hx - 90} ${hy - 34} ${hx - 105} ${hy + 20} Z`;
  switch (style) {
    case "nganxu": return ci(hx - 34, hy - 106, 20, c) + ci(hx + 4, hy - 116, 22, c) + ci(hx + 42, hy - 104, 19, c)
      + pa(dome + ` L${hx + 82} ${hy - 12} L${hx + 62} ${hy - 44} L${hx + 38} ${hy - 16} L${hx + 10} ${hy - 48} L${hx - 18} ${hy - 18} L${hx - 46} ${hy - 46} L${hx - 74} ${hy - 12} Z`, c, ' stroke-linejoin="round"')
      + ln(`M${hx - 20} ${hy - 96} q14 -10 30 -2`, d, 4);
    case "maibang": return rc(hx - 114, hy - 20, 30, 104, 15, c) + rc(hx + 84, hy - 20, 30, 104, 15, c)
      + pa(dome + ` L${hx + 92} ${hy - 14} Q${hx} ${hy - 28} ${hx - 92} ${hy - 14} Z`, c) + ln(`M${hx - 30} ${hy - 60} v34`, d, 3.5) + ln(`M${hx + 30} ${hy - 60} v34`, d, 3.5);
    case "buocduoi": return el(hx + 122, hy + 18, 25, 62, c, -16) + pa(dome + swept, c) + ci(hx + 102, hy - 44, 12, "#FF8FAB") + ln(`M${hx - 36} ${hy - 74} q30 -18 66 -6`, d, 4);
    case "buicao": return ci(hx, hy - 128, 40, c) + ln(`M${hx - 18} ${hy - 142} q18 -12 36 0`, d, 4) + pa(dome + swept, c) + rc(hx - 24, hy - 106, 48, 12, 6, "#FF8FAB");
    case "daixoa": return pa(`M${hx - 110} ${hy - 20} q-16 90 0 160 q20 14 36 -2 q-10 -80 0 -150 Z`, c) + pa(`M${hx + 110} ${hy - 20} q16 90 0 160 q-20 14 -36 -2 q10 -80 0 -150 Z`, c)
      + pa(dome + parted, c) + ln(`M${hx + 8} ${hy - 64} v-44`, d, 3.5);
    case "xoan": {
      let s = "";
      for (let i = 0; i <= 8; i++) { const a = Math.PI + (i / 8) * Math.PI; s += ci(hx + Math.cos(a) * 98, hy - 6 + Math.sin(a) * 98, 30, c); }
      s += ci(hx - 106, hy + 36, 26, c) + ci(hx + 106, hy + 36, 26, c) + pa(dome + ` L${hx + 92} ${hy - 20} Q${hx} ${hy - 40} ${hx - 92} ${hy - 20} Z`, c);
      for (let i = 0; i < 5; i++) s += ci(hx - 72 + i * 36, hy - 34, 22, c);
      return s + ln(`M${hx - 50} ${hy - 78} q10 -12 22 0`, d, 3.5) + ln(`M${hx + 20} ${hy - 86} q10 -12 22 0`, d, 3.5);
    }
    default: throw new Error("unknown hair " + style);
  }
}

// ---------- hats ----------
function hat(kind, p) {
  const [hx, hy] = head(p);
  const cap = (fill, y = hy - 40) => pa(`M${hx - 106} ${y} C${hx - 112} ${hy - 80} ${hx - 60} ${hy - 124} ${hx} ${hy - 124} C${hx + 60} ${hy - 124} ${hx + 112} ${hy - 80} ${hx + 106} ${y} Z`, fill);
  switch (kind) {
    case "mulen": return ci(hx - 72, hy - 108, 26, "#B98A62") + ci(hx + 72, hy - 108, 26, "#B98A62") + ci(hx - 72, hy - 108, 13, "#F3D9C0") + ci(hx + 72, hy - 108, 13, "#F3D9C0")
      + cap("#C99B72") + rc(hx - 112, hy - 62, 224, 30, 15, "#F3E3CF") + [0, 1, 2, 3, 4, 5].map(i => ln(`M${hx - 88 + i * 35} ${hy - 56} v18`, "#E2CDB2", 3)).join("");
    case "murom": return el(hx, hy - 58, 156, 34, "#E9C46A") + pa(`M${hx - 92} ${hy - 60} C${hx - 96} ${hy - 184} ${hx + 96} ${hy - 184} ${hx + 92} ${hy - 60} Z`, "#F1D58A") + rc(hx - 92, hy - 92, 184, 22, 11, "#E76F51")
      + ln(`M${hx - 120} ${hy - 52} q120 26 240 0`, "#D3AB4E", 3);
    case "mubep": return ci(hx - 46, hy - 138, 44, WHITE) + ci(hx + 46, hy - 138, 44, WHITE) + ci(hx, hy - 156, 48, WHITE) + rc(hx - 72, hy - 122, 144, 54, 14, WHITE, ' stroke="#E6DED6" stroke-width="3"')
      + ln(`M${hx - 28} ${hy - 112} v30`, "#E6DED6", 3) + ln(`M${hx + 28} ${hy - 112} v30`, "#E6DED6", 3);
    case "musinhnhat": return pa(`M${hx - 46} ${hy - 96} L${hx + 46} ${hy - 96} L${hx + 6} ${hy - 204} Z`, "#F27FA5", ' stroke-linejoin="round" stroke="#F27FA5" stroke-width="8"')
      + ln(`M${hx - 30} ${hy - 124} l52 -16`, "#FFD166", 7) + ln(`M${hx - 14} ${hy - 160} l32 -10`, "#8FD3F4", 7) + ci(hx + 6, hy - 206, 14, "#FFD166") + rc(hx - 54, hy - 104, 108, 16, 8, WHITE);
    case "munoel": return pa(`M${hx - 98} ${hy - 58} C${hx - 96} ${hy - 150} ${hx + 20} ${hy - 170} ${hx + 96} ${hy - 104} Q${hx + 128} ${hy - 74} ${hx + 118} ${hy - 30} Q${hx + 90} ${hy - 90} ${hx + 96} ${hy - 58} Z`, "#D94B4B")
      + rc(hx - 112, hy - 74, 224, 32, 16, WHITE) + ci(hx + 118, hy - 24, 18, WHITE);
    case "noto": return pa(`M${hx} ${hy - 108} L${hx - 70} ${hy - 148} Q${hx - 86} ${hy - 108} ${hx - 70} ${hy - 68} Z`, "#F27FA5", ' stroke="#F27FA5" stroke-width="10" stroke-linejoin="round"')
      + pa(`M${hx} ${hy - 108} L${hx + 70} ${hy - 148} Q${hx + 86} ${hy - 108} ${hx + 70} ${hy - 68} Z`, "#F27FA5", ' stroke="#F27FA5" stroke-width="10" stroke-linejoin="round"') + ci(hx, hy - 108, 18, "#E2557F");
    default: throw new Error("unknown hat " + kind);
  }
}

// ---------- accessories ----------
function acc(kind, p) {
  const [hx, hy] = head(p), t = torso(p), [rx, ry] = p.handR, [lx, ly] = p.handL;
  switch (kind) {
    case "kinh": return ci(hx - 36, hy + 22, 25, "rgba(255,255,255,.28)", ` stroke="${INK}" stroke-width="5"`) + ci(hx + 36, hy + 22, 25, "rgba(255,255,255,.28)", ` stroke="${INK}" stroke-width="5"`) + ln(`M${hx - 11} ${hy + 20} q11 -7 22 0`, INK, 5);
    case "tainghe": return ln(`M${hx - 104} ${hy + 4} C${hx - 112} ${hy - 150} ${hx + 112} ${hy - 150} ${hx + 104} ${hy + 4}`, "#5B6B8C", 12) + rc(hx - 122, hy - 16, 30, 58, 14, "#7FA8DC") + rc(hx + 92, hy - 16, 30, 58, 14, "#7FA8DC");
    case "khan": return rc(hx - 62, hy + 84, 124, 30, 15, "#E76F51") + rc(hx + 20, hy + 100, 26, 62, 10, "#E76F51") + ln(`M${hx + 24} ${hy + 146} h18`, "#F4A261", 4) + ln(`M${hx - 40} ${hy + 99} h60`, "#F4A261", 4);
    case "tui": return ln(`M${t.x + t.w - 14} ${t.y + 10} L${t.x + 6} ${t.y + t.h - 20}`, "#A0714F", 7) + rc(t.x - 22, t.y + t.h - 34, 50, 42, 12, "#C68B59") + rc(t.x - 22, t.y + t.h - 34, 50, 16, 8, "#A0714F") + ci(t.x + 3, t.y + t.h - 16, 4.5, "#F7C948");
    case "binhtuoi": return rc(rx - 6, ry - 2, 44, 36, 9, "#8FD3F4") + ln(`M${rx + 38} ${ry + 10} l22 -16`, "#8FD3F4", 9) + el(rx + 64, ry - 9, 10, 6, "#6BB8DE", -36) + ln(`M${rx} ${ry + 2} q-16 14 0 28`, "#6BB8DE", 6)
      + ci(rx, ry, 13, SKIN);
    case "cove": return ln(`M${rx + 2} ${ry + 14} L${rx + 26} ${ry - 44}`, "#C68B59", 7) + pa(`M${rx + 22} ${ry - 42} l12 4 l2 -22 q-10 -10 -16 4 Z`, "#F27FA5") + ci(rx, ry, 13, SKIN);
    case "sach": return rc(lx - 34, ly - 22, 50, 40, 6, "#E76F51", ` transform="rotate(-8 ${lx} ${ly})"`) + rc(lx - 28, ly - 17, 38, 30, 4, "#FFF6E8", ` transform="rotate(-8 ${lx} ${ly})"`) + ln(`M${lx - 22} ${ly - 8} h22`, "#E0CDB2", 3) + ci(lx, ly + 4, 13, SKIN);
    case "trasua": return pa(`M${rx - 4} ${ry - 44} h36 l-5 58 q-13 6 -26 0 Z`, "#F3D2B3") + rc(rx - 7, ry - 50, 42, 10, 5, WHITE) + ln(`M${rx + 18} ${ry - 50} l6 -22`, "#F27FA5", 5)
      + [[4, 6], [14, 2], [22, 7], [10, -6]].map(([dx, dy]) => ci(rx + dx, ry + dy, 3.5, "#5A3A2E")).join("") + ci(rx, ry + 2, 13, SKIN);
    case "kepla": return el(hx + 66, hy - 46, 22, 12, "#52B36B", -24) + ln(`M${hx + 50} ${hy - 38} l32 -16`, "#3A8F52", 3);
    default: throw new Error("unknown accessory " + kind);
  }
}

// ---------- pets ----------
const PET = {
  meo: { trang: { b: "#FFFDF9", d: "#EFE3D8", belly: "#FFFFFF", stroke: "#E5D6C8" }, cam: { b: "#F6A85C", d: "#E58A3A", belly: "#FFF6EA" }, xam: { b: "#A9B6C6", d: "#8997A9", belly: "#F4F7FA" } },
  cho: { camkem: { b: "#F0A860", d: "#DB8C40", belly: "#FFF1DC" }, denkem: { b: "#4E4847", d: "#383332", belly: "#FFF1DC" } },
  tho: { trang: { b: "#FFFDF9", d: "#EFE3D8", belly: "#FFFFFF", stroke: "#E5D6C8" }, nausua: { b: "#C9A27E", d: "#B0876A", belly: "#F6E7D6" } },
  canhcut: { xanhthan: { b: "#3D5A80", d: "#2E4666", belly: "#FFFFFF" } },
  ech: { xanhla: { b: "#8BCB6B", d: "#6FB150", belly: "#E6F5C9" }, xanhhong: { b: "#8ED1B0", d: "#6DB896", belly: "#FFD3DE" } },
  gautruc: { camdo: { b: "#D9693B", d: "#B9502A", belly: "#5A342A" } }
};
function pet(species, color, pose) {
  const c = PET[species][color], st = c.stroke ? ` stroke="${c.stroke}" stroke-width="3"` : "";
  const lying = pose === "nam", happy = pose === "vui";
  // geometry: sitting upright, hopping (vui), or curled up asleep (nam)
  const g = lying ? { bx: 276, by: 452, brx: 118, bry: 44, hx: 176, hy: 432, hr: 62 } : { bx: 256, by: 424 - (happy ? 16 : 0), brx: 76, bry: 68, hx: 256, hy: 330 - (happy ? 20 : 0), hr: 80 };
  const { bx, by, brx, bry, hx, hy, hr } = g, k = hr / 80;
  let s = el(256, 494, lying ? 150 : happy ? 70 : 96, lying ? 14 : 13, "rgba(70,45,30,.16)");
  const eyes = () => lying
    ? ln(`M${hx - 30 * k} ${hy + 8 * k} q${9 * k} ${9 * k} ${18 * k} 0`, INK, 4) + ln(`M${hx + 12 * k} ${hy + 8 * k} q${9 * k} ${9 * k} ${18 * k} 0`, INK, 4)
    : happy ? ln(`M${hx - 40} ${hy + 12} q10 -14 20 0`, INK, 5) + ln(`M${hx + 20} ${hy + 12} q10 -14 20 0`, INK, 5)
      : el(hx - 30, hy + 8, 7, 9, INK) + el(hx + 30, hy + 8, 7, 9, INK) + ci(hx - 27.5, hy + 4, 2.6, WHITE) + ci(hx + 32.5, hy + 4, 2.6, WHITE);
  const cheeks = (col = BLUSH) => el(hx - 50 * k, hy + 28 * k, 12 * k, 7 * k, col) + el(hx + 50 * k, hy + 28 * k, 12 * k, 7 * k, col);
  const mouth = (col = INK) => happy ? pa(`M${hx - 12} ${hy + 28} Q${hx} ${hy + 50} ${hx + 12} ${hy + 28} Z`, "#B5475B")
    : ln(`M${hx - 10 * k} ${hy + 30 * k} q${5 * k} ${6 * k} ${10 * k} 0 q${5 * k} ${6 * k} ${10 * k} 0`, col, 3.5);
  const paws = fill => lying ? el(bx - 60, by + 30, 22, 12, fill, 0, st) + el(bx + 70, by + 32, 24, 12, fill, 0, st)
    : happy ? el(bx - 74, by - 34, 15, 26, fill, 30, st) + el(bx + 74, by - 34, 15, 26, fill, -30, st) + el(bx - 30, by + 62, 24, 14, fill, 0, st) + el(bx + 30, by + 62, 24, 14, fill, 0, st)
      : el(bx - 34, by + 60, 24, 14, fill, 0, st) + el(bx + 34, by + 60, 24, 14, fill, 0, st);
  const zz = lying ? ln(`M${hx + 30} ${hy - 96} h18 l-18 20 h18`, "#7FA8DC", 4.5) + ln(`M${hx + 62} ${hy - 126} h12 l-12 14 h12`, "#7FA8DC", 3.5) : "";
  const spark = happy ? [[-112, -70], [112, -84], [-96, 10]].map(([dx, dy]) => pa(`M${hx + dx} ${hy + dy - 11} l3 8 l8 3 l-8 3 l-3 8 l-3 -8 l-8 -3 l8 -3 Z`, "#FFD166")).join("") : "";
  const bodyEl = fill => el(bx, by, brx, bry, fill, 0, st), headEl = fill => ci(hx, hy, hr, fill, st);
  const bellyEl = () => lying ? "" : el(bx, by + 12, 44, 42, c.belly);

  if (species === "meo") {
    const ear = sx => pa(`M${hx + sx * 68 * k} ${hy - 26 * k} L${hx + sx * 62 * k} ${hy - 96 * k} L${hx + sx * 16 * k} ${hy - 66 * k} Z`, c.b, ` stroke-linejoin="round" stroke="${c.stroke || c.b}" stroke-width="8"`)
      + pa(`M${hx + sx * 58 * k} ${hy - 42 * k} L${hx + sx * 56 * k} ${hy - 78 * k} L${hx + sx * 32 * k} ${hy - 62 * k} Z`, "#FFB7C5");
    s += lying ? ln(`M${bx + 96} ${by + 6} q46 -8 34 -52`, c.d === "#EFE3D8" ? "#E5D6C8" : c.d, 18) : ln(`M${bx + 62} ${by + 40} q62 -4 52 -70`, c.d === "#EFE3D8" ? "#E5D6C8" : c.d, 18);
    s += bodyEl(c.b) + bellyEl() + paws(c.b) + ear(-1) + ear(1) + headEl(c.b);
    if (color !== "trang") s += [-1, 0, 1].map(i => ln(`M${hx + i * 18 * k} ${hy - 74 * k} v${(i ? 14 : 20) * k}`, c.d, 6)).join("");
    s += eyes() + cheeks() + pa(`M${hx - 6 * k} ${hy + 20 * k} h${12 * k} l-${6 * k} ${7 * k} Z`, "#F27FA5") + mouth()
      + [-1, 1].map(sx => ln(`M${hx + sx * 62 * k} ${hy + 16 * k} h${sx * 22 * k}`, c.stroke ? "#CDBBAA" : c.d, 2.5) + ln(`M${hx + sx * 62 * k} ${hy + 28 * k} l${sx * 20 * k} ${6 * k}`, c.stroke ? "#CDBBAA" : c.d, 2.5)).join("");
  } else if (species === "cho") {
    const ear = sx => pa(`M${hx + sx * 70 * k} ${hy - 30 * k} L${hx + sx * 58 * k} ${hy - 90 * k} L${hx + sx * 24 * k} ${hy - 64 * k} Z`, c.d, ` stroke-linejoin="round" stroke="${c.d}" stroke-width="10"`);
    s += lying ? ci(bx + 104, by - 18, 24, c.belly) : ci(bx + 74, by + 6, 26, c.belly) + ci(bx + 74, by + 6, 12, c.b);
    s += bodyEl(c.b) + bellyEl() + paws(c.belly) + ear(-1) + ear(1) + headEl(c.b);
    s += el(hx - 34 * k, hy + 30 * k, 30 * k, 26 * k, c.belly) + el(hx + 34 * k, hy + 30 * k, 30 * k, 26 * k, c.belly) + el(hx, hy + 36 * k, 30 * k, 24 * k, c.belly);
    s += ci(hx - 30 * k, hy - 14 * k, 6 * k, c.belly) + ci(hx + 30 * k, hy - 14 * k, 6 * k, c.belly);
    s += eyes() + cheeks() + el(hx, hy + 22 * k, 9 * k, 6.5 * k, INK) + mouth() + (happy ? el(hx, hy + 46, 7, 9, "#FF8FAB") : "");
  } else if (species === "tho") {
    const ear = (sx, rot) => el(hx + sx * 34 * k, hy - 104 * k, 19 * k, 56 * k, c.b, rot, st) + el(hx + sx * 34 * k, hy - 100 * k, 9 * k, 40 * k, "#FFC2D1", rot);
    s += lying ? ci(bx + 112, by - 6, 20, c.belly, st) : ci(bx + 70, by + 30, 20, c.belly, st);
    s += bodyEl(c.b) + bellyEl() + paws(c.b) + (lying ? ear(-1, -62) + ear(1, -40) : ear(-1, -8) + ear(1, happy ? 22 : 8)) + headEl(c.b);
    s += eyes() + cheeks() + pa(`M${hx - 5 * k} ${hy + 20 * k} h${10 * k} l-${5 * k} ${6 * k} Z`, "#F27FA5") + mouth() + (lying ? "" : rc(hx - 6, hy + 36 + (happy ? 12 : 0), 12, 9, 3, WHITE, ' stroke="#E5D6C8" stroke-width="1.5"'));
  } else if (species === "canhcut") {
    s += lying ? el(bx, by, brx, bry, c.b) + el(bx - 6, by + 10, brx - 26, bry - 14, c.belly) : el(bx, by - 8, brx, bry + 10, c.b) + el(bx, by + 4, 50, 56, c.belly);
    s += lying ? el(bx + 30, by + 26, 34, 12, c.d) : el(bx - 78, by - (happy ? 40 : 6), 16, 40, c.d, happy ? 50 : 14) + el(bx + 78, by - (happy ? 40 : 6), 16, 40, c.d, happy ? -50 : -14);
    s += lying ? "" : el(bx - 28, by + 66, 24, 11, "#F4A261") + el(bx + 28, by + 66, 24, 11, "#F4A261");
    s += ci(hx, hy, hr, c.b) + el(hx - 28 * k, hy + 14 * k, 34 * k, 40 * k, c.belly) + el(hx + 28 * k, hy + 14 * k, 34 * k, 40 * k, c.belly);
    s += eyes() + cheeks() + pa(`M${hx - 13 * k} ${hy + 24 * k} h${26 * k} l-${13 * k} ${happy ? 20 : 14} Z`, "#F4A261", ' stroke="#F4A261" stroke-width="5" stroke-linejoin="round"');
  } else if (species === "ech") {
    s += bodyEl(c.b) + bellyEl() + (lying ? el(bx - 70, by + 28, 30, 13, c.d) + el(bx + 80, by + 28, 34, 13, c.d)
      : el(bx - 70, by + 50, 34, 18, c.d) + el(bx + 70, by + 50, 34, 18, c.d) + (happy ? el(bx - 76, by - 30, 14, 26, c.b, 34) + el(bx + 76, by - 30, 14, 26, c.b, -34) : el(bx - 26, by + 62, 18, 11, c.b) + el(bx + 26, by + 62, 18, 11, c.b)));
    s += ci(hx - 46 * k, hy - 56 * k, 30 * k, c.b) + ci(hx + 46 * k, hy - 56 * k, 30 * k, c.b) + el(hx, hy, hr + 8 * k, hr - 10 * k, c.b);
    const ex = 46 * k, ey = hy - 56 * k;
    s += lying ? ln(`M${hx - ex - 12} ${ey} q12 10 24 0`, INK, 4) + ln(`M${hx + ex - 12} ${ey} q12 10 24 0`, INK, 4)
      : ci(hx - ex, ey, 18, WHITE) + ci(hx + ex, ey, 18, WHITE) + (happy ? ln(`M${hx - ex - 9} ${ey + 3} q9 -12 18 0`, INK, 4.5) + ln(`M${hx + ex - 9} ${ey + 3} q9 -12 18 0`, INK, 4.5) : ci(hx - ex, ey, 9, INK) + ci(hx + ex, ey, 9, INK) + ci(hx - ex + 3, ey - 3, 3, WHITE) + ci(hx + ex + 3, ey - 3, 3, WHITE));
    s += cheeks(color === "xanhhong" ? "#FF9FB5" : BLUSH) + (happy ? pa(`M${hx - 30} ${hy + 6} Q${hx} ${hy + 46} ${hx + 30} ${hy + 6} Z`, "#B5475B") : ln(`M${hx - 30 * k} ${hy + 8 * k} Q${hx} ${hy + 30 * k} ${hx + 30 * k} ${hy + 8 * k}`, INK, 4));
  } else if (species === "gautruc") {
    const ear = sx => ci(hx + sx * 62 * k, hy - 56 * k, 26 * k, WHITE) + ci(hx + sx * 62 * k, hy - 56 * k, 14 * k, c.b);
    const tail = lying ? [bx + 104, by - 10, -30] : [bx + 86, by + 30, 40];
    s += el(tail[0], tail[1], 24, 50, c.b, tail[2]) + [-22, 2, 26].map(o => el(tail[0], tail[1] + o, 24, 5, "#F2B48C", tail[2])).join("");
    s += bodyEl(c.b) + (lying ? "" : el(bx, by + 16, 42, 40, c.belly)) + paws(c.belly) + ear(-1) + ear(1) + headEl(c.b);
    s += el(hx - 38 * k, hy + 30 * k, 26 * k, 20 * k, WHITE) + el(hx + 38 * k, hy + 30 * k, 26 * k, 20 * k, WHITE) + el(hx, hy + 34 * k, 26 * k, 20 * k, WHITE)
      + el(hx - 30 * k, hy - 16 * k, 10 * k, 7 * k, WHITE) + el(hx + 30 * k, hy - 16 * k, 10 * k, 7 * k, WHITE);
    s += eyes() + cheeks("#FFC2B0") + el(hx, hy + 22 * k, 8 * k, 6 * k, INK) + mouth();
  } else throw new Error("unknown pet " + species);
  return s + zz + spark;
}

// ---------- build the file set ----------
const files = new Map();
const R = scene.rig;
for (const pose of R.poses) {
  const p = POSE[pose];
  files.set(`nv_than_${pose}`, body(p));
  for (const k of Object.keys(R.bots)) if (k !== "chantran") files.set(`nv_quan_${k}_${pose}`, bottoms(k, p));
  for (const k of Object.keys(R.tops)) files.set(`nv_ao_${k}_${pose}`, tops(k, p));
  for (const k of Object.keys(R.exprs)) files.set(`nv_mat_${k}_${pose}`, face(k, p));
  for (const h of Object.keys(R.hairs)) for (const c of Object.keys(R.hairColors)) files.set(`nv_toc_${h}_${c}_${pose}`, hair(h, c, p));
  for (const k of Object.keys(R.hats)) if (k !== "khong") files.set(`nv_mu_${k}_${pose}`, hat(k, p));
  for (const k of Object.keys(R.accs)) if (k !== "khong") files.set(`nv_pk_${k}_${pose}`, acc(k, p));
}
for (const [species, colors] of Object.entries(PET)) for (const color of Object.keys(colors)) for (const pose of ["ngoi", "nam", "vui"]) files.set(`thu_${species}_${color}_${pose}`, pet(species, color, pose));

// Every 3D character layer and pet sprite must have a chibi twin, and nothing extra.
const expected = readdirSync(resolve(root, "assets/3d")).filter(f => /^(nv_|thu_).*\.webp$/.test(f)).map(f => f.replace(/\.webp$/, "")).sort();
const made = [...files.keys()].sort();
const missing = expected.filter(n => !files.has(n)), extra = made.filter(n => !expected.includes(n));
if (missing.length || extra.length) { console.error("Chibi set does not mirror assets/3d.", { missing, extra }); process.exit(1); }

if (process.argv.includes("--check")) {
  const stale = made.filter(n => { const f = resolve(out, n + ".svg"); return !existsSync(f) || readFileSync(f, "utf8") !== svg(files.get(n)); });
  const orphans = existsSync(out) ? readdirSync(out).filter(f => f.endsWith(".svg") && !files.has(f.replace(/\.svg$/, ""))) : [];
  if (stale.length || orphans.length) { console.error("assets/chibi is stale. Run: node scripts/gen-chibi-art.mjs", { stale: stale.slice(0, 8), orphans }); process.exit(1); }
  console.log(`assets/chibi is up to date (${made.length} files).`);
} else {
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });
  let bytes = 0;
  for (const n of made) { const text = svg(files.get(n)); bytes += text.length; writeFileSync(resolve(out, n + ".svg"), text); }
  console.log(`Wrote ${made.length} SVG files (${Math.round(bytes / 1024)} KB) to assets/chibi.`);
}
