import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { Script } from "node:vm";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const html = readFileSync(resolve(root, "index.html"), "utf8");
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

assert.match(appCode, /const ref=DB\.collection\(col\)\.doc\(obj\.id\)/, "existing collection/document write path is retained");
assert.match(appCode, /const ref=DB\.doc\("meta\/main"\)/, "existing meta document path is retained");
assert.match(appCode, /touchPresence=function\([\s\S]*?\{quiet:true\}\)/, "automatic presence heartbeat remains quiet");

console.log("PASS inline JavaScript syntax");
console.log("PASS startup temporal-dead-zone regression guard");
console.log("PASS care-card watering binding");
console.log("PASS pointer hit-region and keyboard activation guards");
console.log("PASS swing target geometry guard");
console.log("PASS existing Firebase write paths retained");
console.log("Note: actual browser event routing is covered by npm run test:browser; this static check does not simulate pointer events.");
