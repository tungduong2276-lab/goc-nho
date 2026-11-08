// Isolated, static-only staging package. Never copies index.html, Firebase config, or user data.
import { cpSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const out = resolve(root, "dist-nha3d-staging");
const files = [
  "nha3d/multiroom-preview.html",
  "nha3d/multiroom-preview.js",
  "nha3d/multiroom-preview-layout.mjs",
  "nha3d/multiroom-activities.mjs",
  "nha3d/multiroom.mjs",
  "nha3d/catalog.mjs",
  "nha3d/engine.mjs",
  "nha3d/xuong/furn.js",
  "nha3d/xuong/rooms2.js",
  "nha3d/xuong/lib.js",
  "nha3d/xuong/rig.js",
  "nha3d/xuong/pet.js"
];
rmSync(out, { recursive: true, force: true });
for (const name of files) {
  const dest = resolve(out, name);
  mkdirSync(dirname(dest), { recursive: true });
  cpSync(resolve(root, name), dest);
}
writeFileSync(resolve(out, "index.html"), '<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="robots" content="noindex"><title>Góc Nhỏ · Nhà 3D thử nghiệm</title><p><a href="/nha3d/multiroom-preview.html">Mở Nhà 3D thử nghiệm (không Firebase)</a></p></html>');
console.log("Staging-only static bundle built:", files.length, "assets. No Firebase config or live app copied.");
