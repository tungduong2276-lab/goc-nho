// Review evidence only: screenshots of the standalone Nhà 3D multi-room preview at
// phone sizes, plus the measured room/panel rectangles. It is NOT an acceptance gate:
// a person still has to look at the images. No Firebase, no network except the local
// test server; three.js is served from node_modules exactly like the browser tests.
import { chromium } from "@playwright/test";
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const out = resolve(root, "evidence-out/nha3d-room-view");
const origin = "http://127.0.0.1:4173";
const three = resolve(root, "node_modules/three");
const sha = process.env.EVIDENCE_SHA || "local";
const DOORS = { bep: "🚪 Phòng bếp", khach: "🚪 Phòng khách", ngu: "🚪 Phòng ngủ" };

if (!existsSync(three)) {
  console.error("node_modules/three is missing. Run `npm install` first; the preview cannot render without it.");
  process.exit(1);
}

async function serverUp() {
  try { return (await fetch(origin + "/nha3d/multiroom-preview.html")).ok; } catch { return false; }
}
let server = null;
if (!(await serverUp())) {
  server = spawn(process.execPath, [resolve(root, "scripts/serve-test.mjs")], { stdio: "ignore" });
  for (let i = 0; i < 50 && !(await serverUp()); i++) await new Promise(r => setTimeout(r, 200));
  if (!(await serverUp())) { server.kill(); console.error("Local test server did not start."); process.exit(1); }
}

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

const shots = [];
const browser = await chromium.launch();
let failed = false;

async function open(width, height, search = "") {
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 2, serviceWorkers: "block" });
  const page = await context.newPage();
  const errors = [], blocked = [];
  page.on("pageerror", e => errors.push(e.message));
  await page.route(url => url.origin !== origin, route => {
    const url = new URL(route.request().url());
    const prefix = "/npm/three@0.169.0/";
    if (url.host === "cdn.jsdelivr.net" && url.pathname.startsWith(prefix)) {
      const file = resolve(three, url.pathname.slice(prefix.length));
      if (file.startsWith(three) && existsSync(file)) return route.fulfill({ contentType: "text/javascript", body: readFileSync(file) });
    }
    blocked.push(url.origin + url.pathname);
    return route.abort();
  });
  await page.goto(origin + "/nha3d/multiroom-preview.html" + search);
  await page.waitForFunction(() => document.querySelector("#status")?.textContent.includes("Phòng khách"), null, { timeout: 60_000 });
  return { context, page, errors, blocked };
}

async function goRoom(page, room) {
  await page.getByRole("button", { name: DOORS[room], exact: true }).click();
  await page.waitForFunction(r => window.__NHA3D_PREVIEW_STATE__().room === r, room, { timeout: 30_000 });
}

async function snap(session, name, note) {
  const { page, errors, blocked } = session;
  await page.waitForTimeout(900); // let walking/door transitions and the next frames settle
  const measured = await page.evaluate(() => {
    const rect = el => { const r = el.getBoundingClientRect(); return { left: r.left, top: r.top, right: r.right, bottom: r.bottom }; };
    const state = window.__NHA3D_PREVIEW_STATE__();
    const panels = {};
    for (const [key, selector] of [["header", "header"], ["labHelp", "#lab-help"], ["status", ".status"], ["doors", "#doors"], ["activities", "#activities"]]) {
      const el = document.querySelector(selector);
      if (el && !el.hidden && el.getClientRects().length) panels[key] = rect(el);
    }
    return { room: state.room, view: state.view || null, panels, viewport: { width: innerWidth, height: innerHeight },
      statusText: document.querySelector("#status").textContent };
  });
  let roomRect = null, overlaps = [];
  if (measured.view?.bounds?.length) {
    const xs = measured.view.bounds.map(p => p.x), ys = measured.view.bounds.map(p => p.y);
    roomRect = { left: Math.min(...xs), top: Math.min(...ys), right: Math.max(...xs), bottom: Math.max(...ys) };
    // Conservative: uses the screen rectangle around the room's 3D bounding box, which is
    // larger than the drawn room. An entry here means "look at this image", not "defect".
    overlaps = Object.entries(measured.panels)
      .filter(([, p]) => p.left < roomRect.right && p.right > roomRect.left && p.top < roomRect.bottom && p.bottom > roomRect.top)
      .map(([key]) => key);
  }
  const file = name + ".png";
  await page.screenshot({ path: resolve(out, file) });
  const round = r => r && Object.fromEntries(Object.entries(r).map(([k, v]) => [k, Math.round(v)]));
  shots.push({ file, note, room: measured.room, viewport: measured.viewport, statusText: measured.statusText,
    safe: round(measured.view?.safe), roomRect: round(roomRect),
    panels: Object.fromEntries(Object.entries(measured.panels).map(([k, v]) => [k, round(v)])),
    roomBoxOverlapsPanels: overlaps, pageErrors: [...errors], blockedExternalRequests: [...new Set(blocked)] });
}

try {
  for (const width of [360, 390, 430]) {
    const session = await open(width, 844);
    await snap(session, `${width}x844-khach`, "Phòng khách khi vừa mở");
    await goRoom(session.page, "bep");
    await snap(session, `${width}x844-bep`, "Phòng bếp sau khi đi qua cửa");
    await goRoom(session.page, "khach");
    await goRoom(session.page, "ngu");
    await snap(session, `${width}x844-ngu`, "Phòng ngủ sau khi đi qua cửa");
    await session.context.close();
  }
  {
    const session = await open(390, 844);
    await session.page.getByRole("button", { name: "🧑‍🤝‍🧑 Gọi bạn mô phỏng" }).click();
    await snap(session, "390x844-khach-ban-mo-phong", "Sau khi gọi bạn mô phỏng: chữ trạng thái dài hơn, nút đổi tên");
    await session.page.setViewportSize({ width: 844, height: 390 });
    await snap(session, "844x390-khach-xoay-ngang", "Xoay ngang điện thoại");
    await session.page.setViewportSize({ width: 390, height: 844 });
    await snap(session, "390x844-khach-xoay-lai-doc", "Xoay lại màn hình dọc");
    await session.context.close();
  }
  {
    const session = await open(390, 844, "?lab=two-tabs");
    await session.page.waitForTimeout(2500); // lab status text settles after the module loads
    await snap(session, "390x844-khach-lab-hai-tab", "Chế độ thí nghiệm hai tab: có thêm bảng trạng thái phía trên");
    await session.context.close();
  }
  {
    const session = await open(360, 640);
    await snap(session, "360x640-khach-man-hinh-thap", "Điện thoại màn hình thấp 360×640");
    await session.context.close();
  }
} catch (error) {
  failed = true;
  console.error("Capture failed:", error.message);
} finally {
  await browser.close();
  server?.kill();
}

writeFileSync(resolve(out, "manifest.json"), JSON.stringify({ sha, generatedAt: new Date().toISOString(), complete: !failed, shots }, null, 2) + "\n");
const cell = s => String(s).replaceAll("|", "\\|");
const lines = [
  "# Nhà 3D — ảnh chụp khung phòng trên điện thoại",
  "",
  `Commit: \`${sha}\` · ${shots.length} ảnh · ${failed ? "**CHƯA ĐỦ — script dừng giữa chừng**" : "đủ bộ"}`,
  "",
  "Ảnh do CI chụp tự động từ `/nha3d/multiroom-preview.html` (không Firebase, không mạng ngoài).",
  "Đây là bằng chứng để người xem duyệt, **không phải** kết luận đạt/không đạt.",
  "Cột “Hộp phòng chạm bảng” dùng hình chữ nhật bao quanh hộp 3D của phòng nên rộng hơn phòng thật; có tên bảng nghĩa là cần nhìn kỹ ảnh đó.",
  "",
  "| Ảnh | Mô tả | Phòng | Màn hình | Hộp phòng chạm bảng | Lỗi trang |",
  "| --- | --- | --- | --- | --- | --- |",
  ...shots.map(s => `| [${s.file}](${s.file}) | ${cell(s.note)} | ${s.room} | ${s.viewport.width}×${s.viewport.height} | ${s.roomBoxOverlapsPanels.join(", ") || "—"} | ${s.pageErrors.length || "—"} |`),
  "",
  ...shots.flatMap(s => [`## ${s.file}`, "", s.note, "", `<img src="${s.file}" width="${Math.min(s.viewport.width, 430)}" alt="${s.note}">`, ""])
];
writeFileSync(resolve(out, "README.md"), lines.join("\n"));
console.log(`Wrote ${shots.length} screenshots to ${out}${failed ? " (INCOMPLETE)" : ""}`);
for (const s of shots) console.log(`- ${s.file}: room=${s.room} overlaps=[${s.roomBoxOverlapsPanels.join(",")}] errors=${s.pageErrors.length}`);
process.exit(failed ? 1 : 0);
