import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, rmSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
const out = resolve("dist-nha3d-staging");
test("staging bundle includes three-room preview but excludes production Firebase app", () => {
  try {
    execFileSync(process.execPath, ["scripts/build-nha3d-staging.mjs"]);
    for (const p of ["index.html", "nha3d/multiroom-preview.html", "nha3d/multiroom-preview.js", "nha3d/xuong/lib.js", "nha3d/presence-lab.mjs", "nha3d/two-tab-lab-browser.mjs"]) {
      assert.ok(existsSync(resolve(out, p)), p);
    }
    for (const p of ["firebase.json", ".firebaserc", "firestore.rules", "assets", "sw.js", "nha3d/app.js"]) {
      assert.equal(existsSync(resolve(out, p)), false, p);
    }
    const countFiles = dir => readdirSync(dir, { withFileTypes: true }).reduce(
      (total, entry) => total + (entry.isDirectory() ? countFiles(resolve(dir, entry.name)) : 1), 0);
    assert.equal(countFiles(out), 16, "bundle must remain exactly 15 allowlisted assets + generated index");
    const source = readFileSync(resolve(out, "nha3d/two-tab-lab-browser.mjs"), "utf8");
    assert.match(source, /BroadcastChannel/);
    assert.doesNotMatch(source, /(?:firebase\.initializeApp|fetch\(|localStorage\.(?:getItem|setItem))/i);
    const labPage = readFileSync(resolve(out, "nha3d/multiroom-preview.html"), "utf8");
    assert.match(labPage, /id="lab-help"/);
    assert.match(labPage, /id="lab-open"/);
    assert.match(labPage, /multiroom-preview\\.js\\?rev=20261111b/);
    const preview = readFileSync(resolve(out, "nha3d/multiroom-preview.js"), "utf8");
    assert.match(preview, /two-tab-lab-browser\\.mjs\\?rev=20261111b/);
    const page = readFileSync(resolve(out, "index.html"), "utf8");
    assert.match(page, /multiroom-preview\.html/);
    assert.doesNotMatch(page, /cloudInit|initDb|firebase\.initializeApp/);
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
});
