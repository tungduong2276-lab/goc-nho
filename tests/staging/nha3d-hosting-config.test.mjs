import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const config = JSON.parse(readFileSync(new URL("../../firebase.nha3d-staging.json", import.meta.url), "utf8"));
test("staging hosting config is static-only and points to isolated build", () => {
  assert.equal(config.hosting?.public, "dist-nha3d-staging");
  assert.equal(Object.keys(config).join(","), "hosting", "no Firestore, Functions, Storage or other deploy targets");
  assert.equal(config.hosting?.rewrites, undefined, "no rewrite into production app");
  assert.equal(config.hosting?.redirects, undefined, "no redirects into production app");
  assert.equal(config.hosting?.predeploy, undefined, "no predeploy side effects");
  assert.equal(config.hosting?.postdeploy, undefined, "no postdeploy side effects");
  assert.ok(config.hosting?.headers?.some(h => h.headers?.some(v => v.key === "X-Robots-Tag" && v.value.includes("noindex"))));
});
test("staging instructions never set a default Firebase project alias", () => {
  const text = readFileSync(new URL("../../docs/NHA3D-STAGING-ACCEPTANCE.md", import.meta.url), "utf8");
  assert.match(text, /VERIFIED_STAGING_PROJECT_ID/);
  assert.match(text, /--config firebase\.nha3d-staging\.json/);
  assert.match(text, /--project VERIFIED_STAGING_PROJECT_ID/);
});
