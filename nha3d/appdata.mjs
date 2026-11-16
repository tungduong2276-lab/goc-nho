// W3 đợt 1 — đọc dữ liệu có sẵn của app Góc Nhỏ (chỉ đọc) để đồ vật 3D phản ánh đúng trạng thái:
// hộp thư dựng cờ khi có thư mới, tủ lạnh dán đúng các mẩu giấy, hũ hẹn hò biết có lá đang chờ.
// Quy tắc giống hệt index.html (letterUnlocked, completedSeasons, seen-markers trong localStorage cùng trang).
// Việc ghi (viết thư, dán giấy, bốc thăm) vẫn do màn hình gốc của app làm, mở trong khung nổi.

export const NOTE_COLORS = [0xFFD9E6, 0xD8F1DF, 0xFFF1BD, 0xE8DFFF]; // --n0..--n3 trong index.html

const dayStart = d => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const parseDay = s => (s ? dayStart(new Date(s + "T12:00:00")) : null);

export function completedSeasons(history) {
  return Math.floor(Object.values(history || {}).filter(h => h && h.closed).length / 10);
}
export function letterUnlocked(l, history, now = new Date()) {
  if (l.unlockSeason) return completedSeasons(history) >= l.unlockSeason;
  if (l.unlockDate) return dayStart(now) >= parseDay(l.unlockDate);
  return true;
}

// me: chỉ số 0/1 của người cầm máy (localStorage "hu-hen-ho-me"); seenIds: "v3-letter-seen".
export function mailboxState(letters, history, me, seenIds = [], now = new Date()) {
  const toMe = Object.values(letters || {}).filter(l => l && l.to === me);
  const unread = toMe.filter(l => letterUnlocked(l, history, now) && !seenIds.includes(l.id)).length;
  const sealed = toMe.filter(l => !letterUnlocked(l, history, now)).length;
  return { unread, sealed, total: toMe.length };
}

// Các mẩu giấy mới nhất để dán lên cửa tủ (tối đa max), và số tin mới của người kia kể từ lần xem cuối.
export function fridgeState(notes, me, seenAt = "", max = 8) {
  const all = Object.values(notes || {}).filter(n => n && n.date).sort((a, b) => (a.date < b.date ? 1 : -1));
  const other = me === null || me === undefined ? null : 1 - me;
  let fresh = 0;
  for (const n of all) {
    if (n.by === other && n.date > seenAt) fresh++;
    for (const r of n.replies || []) if (r.by === other && r.date > seenAt) fresh++;
  }
  const shown = all.slice(0, max).map(n => ({ id: n.id, color: NOTE_COLORS[Number.isInteger(n.color) && n.color >= 0 && n.color < 4 ? n.color : 0], voice: !!n.voice, heart: Array.isArray(n.hearts) && n.hearts.some(Boolean) }));
  return { count: all.length, fresh, shown };
}

// Hũ: có lá đang chờ (đã bốc chưa chơi) hoặc buổi hẹn đang diễn ra không.
export function jarState(meta, history) {
  const hs = Object.values(history || {}).filter(Boolean).sort((a, b) => a.no - b.no);
  const last = hs[hs.length - 1];
  const open = last && !last.closed ? last : null;
  return { pending: !!(meta && meta.pending), openNo: open ? open.no : null, done: hs.filter(h => h.closed).length };
}
