import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { Script } from "node:vm";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const html = readFileSync(resolve(root, "index.html"), "utf8");
const scene = JSON.parse(readFileSync(resolve(root, "assets/3d/scene.json"), "utf8"));
const room = scene.rooms.khu_vuon;
const scriptTag = html.lastIndexOf("<script");
const scriptOpen = html.indexOf(">", scriptTag) + 1;
const scriptClose = html.indexOf("</script>", scriptOpen);
assert.ok(scriptTag >= 0 && scriptClose > scriptOpen, "inline application script exists");
const appCode = html.slice(scriptOpen, scriptClose);
new Script(appCode, { filename: "index.html inline application" });

const resolverMatch = appCode.match(/function nearestGardenHit\(x,y,targets\)\{[\s\S]*?\n\}/);
assert.ok(resolverMatch, "nearest-target resolver is present");
const nearestGardenHit = new Function(`${resolverMatch[0]}; return nearestGardenHit;`)();

const layers = room.layers;
const targets = [
  { key: "binhtuoi", x: (layers.binhtuoi_nghi[0] + layers.binhtuoi_nghi[2]) / 2, y: (layers.binhtuoi_nghi[1] + layers.binhtuoi_nghi[3]) / 2 },
  { key: "hopgiong", x: (layers.hopgiong_dong[0] + layers.hopgiong_dong[2]) / 2, y: (layers.hopgiong_dong[1] + layers.hopgiong_dong[3]) / 2 },
  { key: "ghe", x: 321, y: 570 },
  { key: "ke", x: (layers.ke_trong[0] + layers.ke_trong[2]) / 2, y: (layers.ke_trong[1] + layers.ke_trong[3]) / 2 },
  { key: "bang", x: (layers.bang_trong[0] + layers.bang_trong[2]) / 2, y: (layers.bang_trong[1] + layers.bang_trong[3]) / 2 },
  ...room.spots.luong.map((p, i) => ({ key: "flower" + (i + 1), x: p[0], y: p[1] })),
  { key: "cay", x: room.spots.cay[0][0], y: room.spots.cay[0][1] - 55 }
].map(t => ({ dataset: {
  hitX: String(t.x), hitY: String(t.y),
  gi: ["binhtuoi", "hopgiong", "ghe", "ke", "bang", "cay"].includes(t.key) ? t.key : undefined,
  gs: t.key.startsWith("flower") ? t.key.slice(6) : undefined
}}));

function expectTarget(name, x, y, expected) {
  const got = nearestGardenHit(x, y, targets);
  const key = got?.dataset.gi || (got?.dataset.gs ? "flower" + got.dataset.gs : null);
  assert.equal(key, expected, name + " resolves to the intended garden object");
  console.log("PASS tap routing: " + name + " -> " + expected);
}

expectTarget("center of season bed 1", ...room.spots.luong[0], "flower1");
expectTarget("center of season bed 2", ...room.spots.luong[1], "flower2");
expectTarget("center of seed box", (layers.hopgiong_dong[0] + layers.hopgiong_dong[2]) / 2, (layers.hopgiong_dong[1] + layers.hopgiong_dong[3]) / 2, "hopgiong");
expectTarget("center of swing seat", 321, 570, "ghe");
expectTarget("center of watering can", (layers.binhtuoi_nghi[0] + layers.binhtuoi_nghi[2]) / 2, (layers.binhtuoi_nghi[1] + layers.binhtuoi_nghi[3]) / 2, "binhtuoi");

function pxAt390(width, height) { return [width * 390 / 1170, height * 390 / 1170]; }
function checkMinTarget(label, width, height) {
  const [w, h] = pxAt390(width, height);
  assert.ok(w >= 44 && h >= 44, label + " target must be at least 44x44 CSS px at 390px viewport");
  console.log(`PASS touch size: ${label} ${w.toFixed(1)}x${h.toFixed(1)} CSS px at 390px`);
}
const flowerSize = 256 * (room.ppm / scene.flower.ppm) * 1.7;
checkMinTarget("flower", flowerSize * .70, flowerSize * .87);
const careSize = 256 * (room.ppm / scene.flower.ppm) * 3;
checkMinTarget("daily care plant", careSize * .39, careSize * .41);
const box = (key) => layers[key];
const dims = key => [box(key)[2] - box(key)[0], box(key)[3] - box(key)[1]];
const [waterW, waterH] = dims("binhtuoi_nghi");
checkMinTarget("watering can", waterW * 2.10, waterH * 1.50);
const [seedW, seedH] = dims("hopgiong_dong");
checkMinTarget("seed box", seedW * 1.44, seedH * 1.70);
const [swingW, swingH] = dims("ghe_trong");
checkMinTarget("swing seat", swingW * .60, swingH * .50);
const [shelfW, shelfH] = dims("ke_trong");
checkMinTarget("plant shelf", shelfW * .92, shelfH * .92);
const [boardW, boardH] = dims("bang_trong");
checkMinTarget("season board", boardW, boardH);

assert.ok(!html.includes(".garden3d .lay.hot::before{content:\"\u0022\u0022"), "old floating-dot pseudo element is removed");
assert.ok(!html.includes("right:-7px;top:-7px;width:16px"), "floating pink dots are removed");
assert.ok(/let gardenGuideOpen=false/.test(appCode), "guide starts collapsed");
assert.ok(/root\.insertAdjacentHTML\("beforeend",guideHTML\)/.test(appCode), "guide is placed after scene and care card");
assert.ok(/gardenGalleryOpen=true/.test(appCode) && /key===\"mua\"\|\|key===\"bang\"/.test(appCode), "board opens seasonal gallery");
assert.ok(/if\(key===\"ke\"\)\{toast\(/.test(appCode), "plant shelf no longer opens seasonal gallery");
assert.ok(/A3\(\"hoa_\"\+\(BLOOM_FL\[f\.kind\]\|\|\"anhdao\"\)\+\"_gd5\"\)/.test(appCode), "gallery uses existing 3D flower assets");
assert.ok(!/root\.querySelectorAll\(\"\[data-gchar\]\"\)\.forEach\(b=>b\.onclick/.test(appCode), "character action is not bound twice");
assert.ok(/else if\(hit\.dataset\.gchar\)[\s\S]*?sendTap\(\"hug\"\)/.test(appCode), "character tap still uses existing TAPS workflow");
assert.ok(/touchPresence=function\([\s\S]*?\{quiet:true\}\)/.test(appCode), "automatic presence heartbeat is excluded from save indicator");
assert.ok(/failedDbWrites=new Map\(\)/.test(appCode) && /retryFailedDbWrites\(\)/.test(appCode), "failed writes have an explicit retry path");
assert.ok(/DB\.collection\(col\)\.doc\(obj\.id\)\.set\(data\)/.test(appCode), "existing collection/document write path is retained");
assert.ok(/DB\.doc\(\"meta\/main\"\)\.set\(data\)/.test(appCode), "existing meta document path is retained");

console.log("PASS guide/gallery/Firebase wiring assertions");
console.log("PASS inline JavaScript syntax");
console.log("Note: geometry tests exercise the real resolver and configured design coordinates; they do not replace real browser/device hit-testing.");
