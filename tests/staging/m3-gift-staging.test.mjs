import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { buildGiftStaging, PROJECT } from "../../scripts/build-m3-gift-staging.mjs";

const root = fileURLToPath(new URL("../../", import.meta.url));
const staging = {
  firebase: { projectId: PROJECT, authDomain: PROJECT + ".firebaseapp.com", apiKey: "AIza" + "a".repeat(35), appId: "1:123:web:aabb" },
  testerUids: ["fixture-alice", "fixture-bob"],
};
const tracked = ["nha3d/index.html", "src/world-home.js", "firebase-config.js", "sw.js", "tests/firebase/fixtures/m3-gifts.rules"];
const work = t => {
  const dir = mkdtempSync(join(tmpdir(), "m3-stage-test-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return join(dir, "output");
};
const read = (out, name) => readFileSync(join(out, name), "utf8");

test("staging package refuses another project, auth domain or repeated tester UID before writing", t => {
  const output = work(t);
  for (const settings of [
    { ...staging, firebase: { ...staging.firebase, projectId: "goc-nho" } },
    { ...staging, firebase: { ...staging.firebase, authDomain: "goc-nho.firebaseapp.com" } },
    { ...staging, testerUids: ["fixture-alice", "fixture-alice"] },
    { ...staging, testerUids: ['fixture-"bad', "fixture-bob"] },
  ]) {
    assert.throws(() => buildGiftStaging({ root, output, settings, tracked }));
    assert.equal(existsSync(output), false);
  }
});

test("artifact targets the staging preview only, separates rules and refuses to overwrite an existing output", t => {
  const output = work(t);
  assert.deepEqual(buildGiftStaging({ root, output, settings: staging, tracked }), { fileCount: 4, project: PROJECT });
  const config = read(output, "public/firebase-config.js");
  const loadConfig = new Function("location", "window", config + "\nreturn window.FIREBASE_CONFIG;");
  assert.equal(loadConfig({ protocol: "https:", hostname: PROJECT + "--m3-gifts-safe123.web.app" }, {}).projectId, PROJECT);
  for (const location of [
    { protocol: "http:", hostname: PROJECT + "--m3-gifts-safe123.web.app" },
    { protocol: "https:", hostname: PROJECT + "--another-safe123.web.app" },
    { protocol: "https:", hostname: "goc-nho.web.app" },
    { protocol: "https:", hostname: PROJECT + "--m3-gifts-safe123.web.app.example.invalid" },
  ]) assert.equal(loadConfig(location, {}), undefined);

  const html = read(output, "public/index.html");
  assert.match(html, /if\(!giftStaging\)\{showGate\("config"\);return;\}/);
  assert.doesNotMatch(html, /useEmulator|enablePersistence|serviceWorker\.register/);
  const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)];
  for (const [, attrs, script] of scripts) {
    if (!/\bsrc=|type=["']module/.test(attrs)) assert.doesNotThrow(() => new Function(script));
  }

  const rules = read(output, "firestore.staging.rules");
  assert.match(rules, /request\.auth\.uid in \["fixture-alice","fixture-bob"\]/);
  assert.equal(rules.match(/request\.auth != null/g)?.length, 1);
  assert.doesNotMatch(config, /fixture-alice|fixture-bob/);
  assert.equal(existsSync(join(output, "public", "firestore.staging.rules")), false);
  assert.equal(existsSync(join(output, "public", "sw.js")), false);
  assert.equal(JSON.parse(read(output, ".firebaserc")).projects.default, PROJECT);
  assert.equal(JSON.parse(read(output, "firebase.json")).hosting.site, PROJECT);
  assert.throws(() => buildGiftStaging({ root, output, settings: staging, tracked }), /EEXIST/);
});
