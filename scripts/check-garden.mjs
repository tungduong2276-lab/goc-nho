import { readFileSync } from "node:fs";
import { Script } from "node:vm";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const tag = html.lastIndexOf("<script");
const open = html.indexOf(">", tag) + 1;
const close = html.indexOf("</script>", open);
if (tag < 0 || close < 0) throw new Error("Cannot find the inline application script");

new Script(html.slice(open, close), { filename: "index.html inline application" });

const checks = [
  ["touch target expansion for watering can and seed box", /key==="binhtuoi"\?34:key==="hopgiong"\?26/.test(html)],
  ["first-use guide has a local-only dismissal flag", /gn-garden-guide-v1/.test(html)],
  ["flower collection is rendered from completed seasons", /Array\.from\(\{length:seasonCount\}/.test(html)],
  ["flower collection opens the selected season", /data-g-gallery-season/.test(html)],
  ["character touch uses the existing TAPS workflow", /data-gchar/.test(html) && /sendTap\("hug"\)/.test(html)],
  ["swing continues using the existing presence field", /setMine\(\{gsitAt:on\?nowIso\(\):null\}\)/.test(html)],
  ["Firebase collection/document path is unchanged", /DB\.collection\(col\)\.doc\(obj\.id\)\.set\(clone\(obj\)\)/.test(html)],
  ["Firebase metadata document path is unchanged", /DB\.doc\("meta\/main"\)\.set\(clone\(S\.meta\)\)/.test(html)],
  ["Firebase writes expose pending and failed states", /pendingDbWrites/.test(html) && /failedDbWrites/.test(html)]
];

let failed = 0;
for (const [name, ok] of checks) {
  console.log((ok ? "PASS " : "FAIL ") + name);
  if (!ok) failed++;
}
console.log("Inline JavaScript syntax: PASS");
if (failed) process.exitCode = 1;
