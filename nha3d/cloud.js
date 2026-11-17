// W2 — nối đảo 3D với Firebase của Góc Nhỏ (SDK compat 10.12.2 nạp trong index.html, cùng bản với app chính).
// Dùng lại phiên đăng nhập của app (cùng trang web nên Firebase Auth đã nhớ). Không đăng nhập được thì trả null
// và đảo chạy như bản thử chỉ lưu trên máy.
import { COLLECTION, itemId, metaId, presenceId, encodeItem, encodeWater } from "./sync.mjs";
import { MEMORY_COLLECTIONS } from "./appdata.mjs";

function waitForUser(auth, ms = 8000) {
  return new Promise(resolve => {
    let done = false;
    const stop = auth.onAuthStateChanged(u => { if (done) return; done = true; stop(); resolve(u); });
    setTimeout(() => { if (!done) { done = true; stop(); resolve(null); } }, ms);
  });
}

export async function connectCloud() {
  const fb = window.firebase, cfg = window.FIREBASE_CONFIG;
  if (!fb || !cfg || !cfg.apiKey || /DAN-|PASTE/i.test(cfg.apiKey)) return { ok: false, why: "config" };
  try { if (!fb.apps.length) fb.initializeApp(cfg); } catch (e) { return { ok: false, why: "init", error: e }; }
  const fs = fb.firestore();
  try { await fs.enablePersistence({ synchronizeTabs: true }); } catch { /* đã bật ở tab khác hoặc không hỗ trợ: vẫn chạy online */ }
  const user = await waitForUser(fb.auth());
  if (!user) return { ok: false, why: "login" };
  let cid = null;
  try { const us = await fs.doc("users/" + user.uid).get(); cid = us.exists ? us.data().couple : null; }
  catch (e) { return { ok: false, why: "read", error: e }; }
  if (!cid) return { ok: false, why: "pair" };

  const col = fs.collection(`couples/${cid}/${COLLECTION}`);
  const ts = () => fb.firestore.FieldValue.serverTimestamp();
  const swallow = p => p.catch(e => { console.warn("Đảo 3D: chưa ghi được lên Firebase", e); });
  return {
    ok: true, uid: user.uid, cid,
    async getAll() { const snap = await col.get(); return snap.docs.map(d => ({ id: d.id, data: d.data() })); },
    // Chỉ báo thay đổi đã lưu trên máy chủ (bỏ qua bản ghi đang chờ của chính máy này).
    listen(cb) {
      return col.onSnapshot(snap => {
        const changes = snap.docChanges().filter(c => !c.doc.metadata.hasPendingWrites)
          .map(c => ({ id: c.doc.id, data: c.type === "removed" ? null : c.doc.data() }));
        if (changes.length) cb(changes);
      }, e => console.warn("Đảo 3D: mất kết nối đồng bộ", e));
    },
    setItem(scene, it, withWater) {
      const d = { ...encodeItem(scene, it, withWater), ts: ts() };
      return swallow(col.doc(itemId(scene, it.uid)).set(d, withWater ? {} : { merge: true }));
    },
    delItem(scene, uid) { return swallow(col.doc(itemId(scene, uid)).delete()); },
    addWater(scene, uid, entry) {
      return swallow(col.doc(itemId(scene, uid)).update({ w: fb.firestore.FieldValue.arrayUnion(encodeWater(entry)), ts: ts() }));
    },
    setMeta(scene, wall, floor) { return swallow(col.doc(metaId(scene)).set({ k: "meta", scene, wall, floor, ts: ts() })); },
    setPresence(who, data) { return swallow(col.doc(presenceId(who)).set({ ...data, k: "presence", who, ts: ts() })); },
    // W3: chỉ ĐỌC dữ liệu của app (thư, tủ lạnh, hũ) để đồ vật 3D hiện đúng trạng thái. Không ghi gì vào đây.
    watchApp(cb) {
      const base = `couples/${cid}/`, data = { letters: {}, fridge: {}, history: {}, meta: null, wishes: {}, drawings: {}, story: {}, rules: {}, ...Object.fromEntries(MEMORY_COLLECTIONS.map(k => [k, {}])) };
      const asMap = snap => { const o = {}; snap.docs.forEach(d => { o[d.id] = d.data(); }); return o; };
      const warn = e => console.warn("Đảo 3D: không đọc được dữ liệu app", e);
      const offs = [
        fs.collection(base + "letters").onSnapshot(s => { data.letters = asMap(s); cb(data); }, warn),
        fs.collection(base + "fridge").orderBy("date", "desc").limit(12).onSnapshot(s => { data.fridge = asMap(s); cb(data); }, warn),
        fs.collection(base + "history").onSnapshot(s => { data.history = asMap(s); cb(data); }, warn),
        ...["wishes", "drawings", "story", "rules", ...MEMORY_COLLECTIONS].map(name => fs.collection(base + name).onSnapshot(s => { data[name] = asMap(s); cb(data); }, warn)),
        fs.doc(base + "meta/main").onSnapshot(s => { data.meta = s.exists ? s.data() : null; cb(data); }, warn)
      ];
      return () => offs.forEach(f => f());
    }
  };
}

