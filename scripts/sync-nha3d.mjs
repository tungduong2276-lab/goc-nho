// Chép các module dựng hình từ _xuong-3d/ sang nha3d/xuong/ để bản thử nhà 3D chạy được trên GitHub Pages
// (Jekyll bỏ qua thư mục bắt đầu bằng "_"). Nguồn thật vẫn là _xuong-3d/; đừng sửa tay bản chép.
//   node scripts/sync-nha3d.mjs          → chép lại
//   node scripts/sync-nha3d.mjs --check  → chỉ kiểm tra, thoát mã 1 nếu lệch
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const NHA3D_MODULES = ["lib.js", "rig.js", "furn.js", "rooms2.js", "pet.js"];
const HEADER = "// TỰ SINH từ _xuong-3d/ bởi scripts/sync-nha3d.mjs — đừng sửa tay.\n";

const check = process.argv.includes("--check");
const out = resolve(root, "nha3d/xuong");
let drift = [];
if (!check) mkdirSync(out, { recursive: true });
for (const f of NHA3D_MODULES) {
  const want = HEADER + readFileSync(resolve(root, "_xuong-3d", f), "utf8");
  const dest = resolve(out, f);
  const have = existsSync(dest) ? readFileSync(dest, "utf8") : null;
  if (have === want) continue;
  if (check) drift.push(f); else writeFileSync(dest, want);
}
if (check && drift.length) {
  console.error("nha3d/xuong lệch với _xuong-3d: " + drift.join(", ") + " — chạy node scripts/sync-nha3d.mjs");
  process.exit(1);
}
console.log(check ? "nha3d/xuong khớp _xuong-3d" : "đã chép " + NHA3D_MODULES.length + " module vào nha3d/xuong");
