import { ROOM_PRESETS } from "./rooms.mjs";
// W2 — đồng bộ đảo 3D giữa hai điện thoại (xem "PRODUCT DIRECTION V3" trong roadmap).
// Lõi thuần, không phụ thuộc Firebase: mã hoá/giải mã document, so khác bố cục, gộp thay đổi từ máy kia.
// Mọi document nằm trong couples/{cid}/world/ (Rules hiện tại cho thành viên đọc/ghi mọi subcollection của nhà):
//   i_<cảnh>_<uid>  một món đồ:   { k:"item", scene, uid, it:{type,gx,gz,r,wall,at,state}, plant:{sp,at,by}|null, w:[{t,by}], ts }
//   m_<cảnh>        màu tường/sàn: { k:"meta", scene, wall, floor, ts }
//   p_<anh|em>      vị trí một người: { k:"presence", who, scene, x, z, tx, tz, face, mode, seat, ev, look, at, ts }
// Lần tưới (w) chỉ được THÊM bằng arrayUnion để hai người cùng tưới không ghi đè nhau.

export const COLLECTION = "world";
export const PRESENCE_STALE_MS = 45e3;      // quá lâu không cập nhật → coi như đã rời đảo
export const PRESENCE_MOVE_MS = 1200;       // ghi vị trí khi đang đi tối đa ~1 lần / 1,2 giây
export const PRESENCE_HEARTBEAT_MS = 15e3;  // đứng yên vẫn báo "còn ở đây"

export const itemId = (scene, uid) => `i_${scene}_${uid}`;
export const metaId = scene => `m_${scene}`;
export const presenceId = who => `p_${who}`;
const WHO = new Set(["anh", "em"]);

function itemCore(it) {
  const o = { type: it.type };
  for (const k of ["gx", "gz", "r", "wall", "at"]) if (it[k] !== undefined) o[k] = it[k];
  if (it.state !== undefined) o.state = it.state;
  return o;
}
const plantMeta = p => (p ? { sp: p.sp, at: p.at, by: p.by } : null);
export const encodeWater = ([t, by]) => ({ t, by });

// Document cho một món đồ. Ghi kèm w (toàn bộ lần tưới) chỉ khi cây vừa đổi (gieo mới/thu hoạch).
export function encodeItem(scene, it, withWater = true) {
  const doc = { k: "item", scene, uid: it.uid, it: itemCore(it), plant: plantMeta(it.plant) };
  if (withWater) doc.w = it.plant ? it.plant.w.map(encodeWater) : [];
  return doc;
}

// Món đồ từ document; trả null nếu document hỏng.
export function decodeItem(d) {
  if (!d || d.k !== "item" || typeof d.uid !== "string" || !d.it || typeof d.it.type !== "string") return null;
  const it = { uid: d.uid, ...d.it };
  if (d.plant && typeof d.plant.sp === "string" && Number.isFinite(d.plant.at)) {
    const seen = new Set(), w = [];
    for (const e of Array.isArray(d.w) ? d.w : []) {
      if (!e || !Number.isFinite(e.t) || !WHO.has(e.by) || e.t < d.plant.at) continue;
      const key = e.t + e.by; if (seen.has(key)) continue; seen.add(key); w.push([e.t, e.by]);
    }
    w.sort((a, b) => a[0] - b[0]);
    it.plant = { sp: d.plant.sp, at: d.plant.at, by: WHO.has(d.plant.by) ? d.plant.by : "anh", w };
  }
  return it;
}

// Dấu vân tay để biết món đồ có đổi không (không tính lần tưới — lần tưới đi đường riêng).
export const fingerprint = it => JSON.stringify([itemCore(it), plantMeta(it.plant)]);

// So bố cục hiện tại với lần đồng bộ trước. last: Map uid → fingerprint.
// upserts: [{it, withWater}] — withWater khi cây đổi (gieo/thu hoạch/nhổ); removes: [uid].
export function diffLayout(last, layout) {
  const upserts = [], removes = [], now = new Set();
  for (const it of layout.items) {
    now.add(it.uid);
    const fp = fingerprint(it), prev = last.get(it.uid);
    if (prev === fp) continue;
    const prevPlant = prev ? JSON.parse(prev)[1] : undefined;
    const plantChanged = JSON.stringify(prevPlant ?? null) !== JSON.stringify(plantMeta(it.plant));
    upserts.push({ it, withWater: !prev || plantChanged });
  }
  for (const uid of last.keys()) if (!now.has(uid)) removes.push(uid);
  return { upserts, removes };
}
export function remember(last, layout) { last.clear(); for (const it of layout.items) last.set(it.uid, fingerprint(it)); }

// Gộp thay đổi từ máy kia vào bố cục của một cảnh. changes: [{id, data|null}] (data null = đã xoá).
// Trả về các uid đã đổi để vẽ lại.
export function applyItemChanges(layout, scene, changes) {
  const touched = [];
  for (const { id, data } of changes) {
    const pre = `i_${scene}_`;
    if (!id.startsWith(pre)) continue;
    const uid = id.slice(pre.length), idx = layout.items.findIndex(i => i.uid === uid);
    if (!data) { if (idx >= 0) { layout.items.splice(idx, 1); touched.push(uid); } continue; }
    const it = decodeItem(data); if (!it || it.uid !== uid) continue;
    if (idx >= 0) {
      if (JSON.stringify(layout.items[idx]) === JSON.stringify(it)) continue;
      layout.items[idx] = it;
    } else layout.items.push(it);
    touched.push(uid);
  }
  return touched;
}

// Vị trí người kia: chỉ nhận document hợp lệ, còn mới.
export function readPresence(d, now = Date.now()) {
  if (!d || d.k !== "presence" || !WHO.has(d.who) || !(d.scene === "san" || d.scene === "nha" || Object.hasOwn(ROOM_PRESETS,d.scene))) return null;
  if (!Number.isFinite(d.x) || !Number.isFinite(d.z) || !Number.isFinite(d.at)) return null;
  return { ...d, fresh: now - d.at < PRESENCE_STALE_MS };
}

// Quyết định có nên ghi vị trí lúc này không (tiết kiệm lượt ghi của gói Firebase miễn phí).
export function shouldSendPresence(prev, next, now) {
  if (!prev) return true;
  if (prev.scene !== next.scene || prev.mode !== next.mode || JSON.stringify(prev.seat) !== JSON.stringify(next.seat)) return true;
  if (next.ev && (!prev.ev || prev.ev.id !== next.ev.id)) return true;
  if (prev.tx !== next.tx || prev.tz !== next.tz) return true;           // vừa chạm đi tới chỗ mới
  const moved = Math.hypot(prev.x - next.x, prev.z - next.z) > 0.15;
  if (moved && now - prev.sentAt >= PRESENCE_MOVE_MS) return true;
  if (!moved && prev.moving) return true;                                  // vừa dừng lại
  return now - prev.sentAt >= PRESENCE_HEARTBEAT_MS;
}
