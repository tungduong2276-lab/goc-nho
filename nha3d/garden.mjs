// Trồng cây trong nhà 3D: dữ liệu thuần, không phụ thuộc three.js, test được bằng Node.
// Cây chỉ lớn khi đất còn ẩm. Mỗi lần tưới giữ ẩm MOIST_H giờ. Nếu cả Anh và Em cùng tưới
// trong một lần ẩm, cây lớn nhanh gấp TOGETHER lần trong khoảng đó.
// Mọi mốc thời gian là mili-giây (Date.now()); không có gì lưu ngoài đối tượng plant.

export const HOUR = 3600e3;
export const MOIST_H = 24;
export const TOGETHER = 1.5;
export const MAX_WATER = 40; // giữ đủ lịch sử cho vài vụ, tránh phình bố cục

// grow: số giờ ẩm cần để chín/nở. yield: thứ nhận được khi thu hoạch.
export const SPECIES = {
  xalach:     { name: "Xà lách",     grow: 18, yield: "🥬", noun: "cây xà lách", color: 0x8FD6A5 },
  dau:        { name: "Dâu tây",     grow: 36, yield: "🍓", noun: "quả dâu",     color: 0xFF5A7A },
  cachua:     { name: "Cà chua bi",  grow: 48, yield: "🍅", noun: "quả cà chua", color: 0xFF6B4A },
  tulip:      { name: "Tulip hồng",  grow: 30, yield: "🌷", noun: "bông tulip",  color: 0xFF8FB8 },
  huongduong: { name: "Hướng dương", grow: 60, yield: "🌻", noun: "bông hướng dương", color: 0xFFD23F },
  oaihuong:   { name: "Oải hương",   grow: 42, yield: "💜", noun: "nhánh oải hương", color: 0xB79CE8 }
};
export const STAGES = ["Hạt giống", "Nảy mầm", "Cây non", "Đang lớn", "Chín rồi"];
// Ngưỡng tiến độ (0..1) để sang giai đoạn tiếp theo.
const STAGE_AT = [0, 0.12, 0.4, 0.75, 1];

export function newPlant(sp, who, now) {
  if (!SPECIES[sp]) throw new Error("unknown species " + sp);
  return { sp, at: now, w: [] , by: who === "em" ? "em" : "anh" };
}

export function water(plant, who, now) {
  const p = { ...plant, w: plant.w.concat([[now, who === "em" ? "em" : "anh"]]).slice(-MAX_WATER) };
  return p;
}

// Giờ tăng trưởng hiệu dụng từ lúc gieo tới `now`.
export function growHours(plant, now) {
  const ws = plant.w.filter(([t]) => t >= plant.at && t <= now).sort((a, b) => a[0] - b[0]);
  // Gộp các khoảng ẩm thành dải liên tục, mỗi dải biết ai đã tưới trong đó.
  let total = 0, i = 0;
  while (i < ws.length) {
    let start = ws[i][0], end = start + MOIST_H * HOUR;
    const who = new Set([ws[i][1]]);
    let j = i + 1;
    while (j < ws.length && ws[j][0] <= end) { end = ws[j][0] + MOIST_H * HOUR; who.add(ws[j][1]); j++; }
    const span = Math.max(0, Math.min(end, now) - start) / HOUR;
    total += span * (who.size > 1 ? TOGETHER : 1);
    i = j;
  }
  return total;
}

export function status(plant, now) {
  if (!plant) return { empty: true };
  const def = SPECIES[plant.sp];
  const h = growHours(plant, now), progress = Math.min(1, h / def.grow);
  let stage = 0; for (let s = 0; s < STAGE_AT.length; s++) if (progress >= STAGE_AT[s]) stage = s;
  const lastW = plant.w.length ? Math.max(...plant.w.map(x => x[0])) : null;
  const ripe = progress >= 1;
  const thirsty = !ripe && (lastW === null || now - lastW >= MOIST_H * HOUR);
  const moistLeft = lastW === null ? 0 : Math.max(0, lastW + MOIST_H * HOUR - now);
  // Ai đã tưới trong lần ẩm hiện tại (để gợi ý "cùng tưới").
  const recent = new Set(plant.w.filter(([t]) => now - t < MOIST_H * HOUR).map(x => x[1]));
  const hoursLeft = ripe ? 0 : Math.max(0, def.grow - h) / (recent.size > 1 ? TOGETHER : 1);
  return { empty: false, sp: plant.sp, name: def.name, stage, stageName: STAGES[stage], progress, ripe, thirsty, moistLeft, hoursLeft, wateredBy: [...recent] };
}

// Khoá hình ảnh: đổi khi cần vẽ lại mô hình.
export function visualKey(plant, now) {
  const s = status(plant, now);
  if (s.empty) return "trong";
  return `${s.sp}:${s.stage}:${s.thirsty ? "khat" : "am"}`;
}

export function sanitizePlant(raw) {
  if (!raw || typeof raw !== "object" || !SPECIES[raw.sp] || !Number.isFinite(raw.at)) return undefined;
  const w = Array.isArray(raw.w) ? raw.w.filter(x => Array.isArray(x) && Number.isFinite(x[0]) && (x[1] === "anh" || x[1] === "em")).map(x => [x[0], x[1]]).slice(-MAX_WATER) : [];
  return { sp: raw.sp, at: raw.at, w, by: raw.by === "em" ? "em" : "anh" };
}

// Giỏ thu hoạch: { [sp]: số lần }.
export function sanitizeBasket(raw) {
  const out = {};
  if (raw && typeof raw === "object") for (const k of Object.keys(SPECIES)) if (Number.isInteger(raw[k]) && raw[k] > 0) out[k] = Math.min(raw[k], 99999);
  return out;
}

export function fmtHours(h) {
  if (h <= 0) return "ngay bây giờ";
  if (h < 1) return Math.max(1, Math.round(h * 60)) + " phút";
  if (h < 48) return Math.round(h) + " giờ";
  return Math.round(h / 24) + " ngày";
}
