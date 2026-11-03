import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { Script, runInNewContext } from "node:vm";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const html = readFileSync(resolve(root, "index.html"), "utf8");
const sw = readFileSync(resolve(root, "sw.js"), "utf8");
const scene = JSON.parse(readFileSync(resolve(root, "assets/3d/scene.json"), "utf8"));
const scriptTag = html.lastIndexOf("<script");
const scriptOpen = html.indexOf(">", scriptTag) + 1;
const scriptClose = html.indexOf("</script>", scriptOpen);
assert.ok(scriptTag >= 0 && scriptClose > scriptOpen, "inline application script exists");
const appCode = html.slice(scriptOpen, scriptClose);
new Script(appCode, { filename: "index.html inline application" });

// The sync listener is executed before the later const $ declaration.
// It must use the DOM API directly to avoid the temporal dead zone.
const syncListenerAt = appCode.indexOf('document.getElementById("syncBox").addEventListener("click",retryFailedDbWrites)');
const dollarDeclarationAt = appCode.indexOf("const $=id=>document.getElementById(id)");
assert.ok(syncListenerAt >= 0 && dollarDeclarationAt > syncListenerAt, "sync listener does not access $ before initialization");

assert.match(appCode, /root\.querySelectorAll\("\.gcare-card \[data-gi\]"\)\.forEach\(b=>b\.addEventListener\("click"/, "care-card watering button has its own click binding");
assert.match(appCode, /function nearestGardenHit\(clientX,clientY,targets,canvas\)/, "pointer resolver accepts browser coordinates and canvas");
assert.match(appCode, /targets\.filter\(el=>\{[\s\S]*?getBoundingClientRect\(\)/, "pointer resolver only compares actual hit areas containing the point");
assert.match(appCode, /const hit=ev\.detail===0\?origin:nearestGardenHit\(/, "keyboard activation uses the focused element rather than pointer coordinates");
assert.match(appCode, /data-hit-priority="4"[^>]*aria-label=/, "characters have a higher-priority hit target");
assert.match(appCode, /class="ghit gchar-hit" aria-hidden="true"/, "character body has a real DOM hit area");
assert.match(appCode, /priority>bestPriority\|\|\(priority===bestPriority&&d<bestD\)/, "overlapping hit areas use explicit priority before distance");
assert.match(html, /\.garden3d \.chr \.cstack \.gchar-hit\{position:absolute;display:block;left:16%;top:4%;width:68%;height:92%/, "character hit area is positioned relative to the rendered sprite");

assert.match(html, /\.garden3d \.gobj\[data-gi="ghe"\] \.ghit\{left:0;right:0;top:25%;bottom:0\}/, "swing target covers the seat area");

const seat = scene.rooms.khu_vuon.spots.ghe;
assert.ok(Array.isArray(seat) && seat.length === 2, "scene has two swing seat positions");
const seatCenter = [(seat[0][0] + seat[1][0]) / 2, (seat[0][1] + seat[1][1]) / 2];
assert.match(appCode, /Rm\.spots\.ghe\[0\]\[0\].*Rm\.spots\.ghe\[1\]\[0\]/, "swing target center derives from actual scene seat coordinates");
assert.ok(seatCenter[0] > 300 && seatCenter[0] < 400 && seatCenter[1] > 600 && seatCenter[1] < 700, "swing center is within the seat region");

const mergeStart=appCode.indexOf("function mergeMetaForWrite(latest,patch){");
const mergeEnd=appCode.indexOf("\nlet failedMetaPatch=null;",mergeStart);
assert.ok(mergeStart>=0&&mergeEnd>mergeStart,"meta merge helper exists");
const mergeSource=appCode.slice(mergeStart,mergeEnd);
const mergeMetaForWrite=runInNewContext(mergeSource+"; mergeMetaForWrite", { clone:v=>JSON.parse(JSON.stringify(v)) });
const mergedMeta=mergeMetaForWrite(
  {names:["Anh","Em"],bday:["2000-01-01","2001-02-02"],custom:[{n:8,name:"Cũ"},{n:9,name:"Trò của thiết bị kia"}],song:"remote"},
  {custom:[{n:8,name:"Cũ"},{n:9,name:"Trò mới trên máy này"}],pending:{n:9}}
);
assert.equal(mergedMeta.names[0],"Anh","unrelated remote profile fields survive retry");
const mergedNames=mergeMetaForWrite(
  {names:["Tên vừa đổi trên máy kia","Tên hai vừa đổi trên máy kia"]},
  {names:["Tên mới trên máy này","Tên thứ hai"],__base:{names:["Tên cũ","Tên thứ hai"]}}
);
assert.deepEqual(Array.from(mergedNames.names),["Tên mới trên máy này","Tên hai vừa đổi trên máy kia"],"unchanged profile-array entries do not overwrite remote values");
const mergedBirthdays=mergeMetaForWrite(
  {bday:["01-01","02-02"]},
  {bday:["01-01","03-03"],__base:{bday:["01-01","02-02"]}}
);
assert.deepEqual(Array.from(mergedBirthdays.bday),["01-01","03-03"],"only intentionally changed birthday slots are applied");
assert.equal(mergedMeta.song,"remote","unrelated remote metadata survives retry");
assert.ok(mergedMeta.custom.some(x=>x.name==="Trò của thiết bị kia"),"remote custom game is preserved");
assert.ok(mergedMeta.custom.some(x=>x.name==="Trò mới trên máy này"&&x.n!==9),"conflicting custom game receives a free number");
assert.equal(mergedMeta.pending.n,10,"pending draw follows the remapped custom game");
const resetMerge=mergeMetaForWrite(
  {custom:[{n:12,name:"Trò mới vừa thêm trên thiết bị kia"}]},
  {custom:[],__base:{custom:[]}}
);
assert.equal(resetMerge.custom[0].name,"Trò mới vừa thêm trên thiết bị kia","a stale reset retry does not erase a custom game added remotely");

assert.match(appCode,/DB\.runTransaction\(async tx=>\{[\s\S]*?tx\.get\(ref\)[\s\S]*?tx\.set\(ref,mergeMetaForWrite\(latest,payload\)\)/,"meta retry reads latest Firestore state inside a transaction");
assert.match(appCode,/window\.addEventListener\("online",refreshDbWriteStatus\)/,"network recovery does not automatically retry failed writes");
assert.match(appCode,/else if\(MODE==="db"\)\{if\(dbReady\)refreshDbWriteStatus\(\);else setSync\("Đang kết nối...",false);\}/,"online status refresh preserves a pending manual-retry warning");
assert.doesNotMatch(appCode,/window\.addEventListener\("online",\(\)=>\{retryFailedDbWrites\(\)/,"no automatic retry on online event");
assert.doesNotMatch(appCode,/có mạng sẽ tự đồng bộ/,"offline copy does not promise automatic retry of failed writes");
assert.match(appCode,/data-gi="cay"[^\x60]*data-hit-priority="3"/,"large daily pot has priority over overlapping seed-box hit region");
assert.match(appCode,/key==="hopgiong"\?1/,"seed box uses lower hit priority than the daily pot");
assert.match(appCode,/\.garden3d \.gcare \.ghit\{left:15%;right:15%;top:38%;bottom:4%\}/,"daily pot hit area covers the pot body");
assert.match(sw,/const CACHE = "goc-nho-v12"/,"service-worker cache version is bumped for the new app shell");

assert.match(appCode, /const ref=DB\.collection\(col\)\.doc\(obj\.id\)/, "existing collection/document write path is retained");
assert.match(appCode, /const ref=DB\.doc\("meta\/main"\)/, "existing meta document path is retained");
assert.match(appCode, /touchPresence=function\([\s\S]*?\{quiet:true\}\)/, "automatic presence heartbeat remains quiet");

console.log("PASS inline JavaScript syntax");
console.log("PASS startup temporal-dead-zone regression guard");
console.log("PASS care-card watering binding");
console.log("PASS pointer hit-region and keyboard activation guards");
console.log("PASS swing target geometry guard");
console.log("PASS latest-state transactional meta retry and merge preservation");
console.log("PASS manual-only retry and garden pot hit priority");
console.log("PASS existing Firebase write paths retained");
console.log("Note: actual browser event routing is covered by npm run test:browser; this static check does not simulate pointer events.");
