import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, rmSync } from "node:fs";
import { resolve } from "node:path";
const out = resolve("dist-nha3d-staging");
test("staging bundle includes three-room preview but excludes production Firebase app", () => {
  try {
    execFileSync(process.execPath, ["scripts/build-nha3d-staging.mjs"]);
    for (const p of ["index.html", "nha3d/multiroom-preview.html", "nha3d/multiroom-preview.js", "nha3d/xuong/lib.js"]) {
      assert.ok(existsSync(resolve(out, p)), p);
    }
    for (const p of ["firebase.json", ".firebaserc", "firestore.rules", "assets", "sw.js", "nha3d/app.js"]) {
      assert.equal(existsSync(resolve(out, p)), false, p);
    }
    const page = readFileSync(resolve(out, "index.html"), "utf8");
    assert.match(page, /multiroom-preview\.html/);
    assert.doesNotMatch(page, /cloudInit|initDb|firebase\.initializeApp/);
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
});
