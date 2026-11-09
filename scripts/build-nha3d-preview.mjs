// Gói riêng trang bản thử nhà 3D để đưa lên Firebase Hosting Preview Channel của project STAGING.
// Chỉ chép nha3d/ (không kèm index.html của app chính, vốn trỏ vào Firebase thật).
//   node scripts/build-nha3d-preview.mjs   → tạo dist/nha3d-preview/
import { cpSync, mkdirSync, rmSync, writeFileSync, readdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const out = resolve(root, "dist/nha3d-preview");

execFileSync(process.execPath, [resolve(root, "scripts/sync-nha3d.mjs"), "--check"], { stdio: "inherit" });

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
cpSync(resolve(root, "nha3d"), resolve(out, "nha3d"), { recursive: true });

writeFileSync(resolve(out, "index.html"), `<!doctype html>
<html lang="vi"><head><meta charset="utf-8"><meta name="robots" content="noindex">
<meta http-equiv="refresh" content="0; url=/nha3d/"><title>Nhà 3D · bản thử</title></head>
<body><p><a href="/nha3d/">Mở bản thử nhà 3D</a></p></body></html>
`);

const files = readdirSync(resolve(out, "nha3d"), { recursive: true }).length;
console.log(`dist/nha3d-preview sẵn sàng (${files} mục trong nha3d/)`);
