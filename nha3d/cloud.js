// W2 — nối đảo 3D với Firebase của Góc Nhỏ (SDK compat 10.12.2 nạp trong index.html, cùng bản với app chính).
// Dùng lại phiên đăng nhập của app (cùng trang web nên Firebase Auth đã nhớ). Không đăng nhập được thì trả null
// và đảo chạy như bản thử chỉ lưu trên máy.
import { COLLECTION, itemId, metaId, presenceId, encodeItem, encodeWater, decodeItem as decodeCrop } from "./sync.mjs";
import { MEMORY_COLLECTIONS } from "./appdata.mjs";
import { status as cropStatus } from "./garden.mjs";
import { sanitizeLife, applyLife } from "./life.mjs";
import { key as creativeKey,painter,draft,artId,bookId,validId,title,cleanStrokes,combinePainting,canPublishPainting,cleanLines,canPublishBook } from "./creative.mjs";

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
    // Hoạt động sinh hoạt dùng tài liệu riêng trong collection world vốn đã được phân quyền cho cặp đôi.
    // Đảm bảo không mất nguyên liệu nếu hai máy nấu/thu hoạch cùng lúc.
    watchLife(cb) {
      return col.doc("l_home").onSnapshot(s => cb(sanitizeLife(s.exists ? s.data().state : null)),
        e => console.warn("Kho chung chưa đồng bộ", e));
    },
    actLife(op, who, at = Date.now()) {
      const ref = col.doc("l_home");
      return fs.runTransaction(async tx => {
        const snap = await tx.get(ref);
        const result = applyLife(snap.exists ? snap.data().state : null, op, who, at);
        if(result.ok) tx.set(ref, { k:"life", state:result.next, ts:ts() });
        return result;
      });
    },
    harvestLife(scene, uid, who, at = Date.now()) {
      if(!["san","nha"].includes(scene)||!/^[\\w-]{1,64}$/.test(uid)) return Promise.resolve({ok:false,message:"Luống không hợp lệ"});
      const ref = col.doc(itemId(scene, uid)), life = col.doc("l_home");
      return fs.runTransaction(async tx => {
        const [cropSnap, lifeSnap] = await Promise.all([tx.get(ref), tx.get(life)]);
        if(!cropSnap.exists) return {ok:false,message:"Cây chưa được đồng bộ lên vườn chung"};
        const it = decodeCrop(cropSnap.data());
        if(!it || !["luongTrong","chauTrong"].includes(it.type) || !it.plant) return {ok:false,message:"Luống đang trống"};
        const status = cropStatus(it.plant, at);
        if(!status.ripe) return {ok:false,message:"Cây chưa chín, hai đứa tưới thêm nhé"};
        const result = applyLife(lifeSnap.exists ? lifeSnap.data().state : null,
          {type:"harvest",sp:status.sp,amount:it.type==="luongTrong"?3:1},who,at);
        if(!result.ok)return result;
        tx.set(life, {k:"life",state:result.next,ts:ts()});
        tx.set(ref, {...encodeItem(scene,{...it,plant:undefined},true),ts:ts()});
        return {...result, uid, sp:status.sp};
      });
    },
    // Hai người sáng tác trên cùng khung: tách các lượt nét vẽ và nháp theo người để không ghi đè nhau.
    startCreative(kind, label, who, id, at = Date.now()) {
      if(!["paint","story"].includes(kind)||!["anh","em"].includes(who)||!validId(id)||!title(label))
        return Promise.resolve({ok:false,message:"Tên tác phẩm chưa hợp lệ"});
      const ref=col.doc(creativeKey(kind));
      return fs.runTransaction(async tx=>{
        const snap=await tx.get(ref),current=snap.exists?snap.data():null;
        if(current&&validId(current.id))return {ok:true,session:current.id};
        tx.set(ref,{k:"creative-meta",kind,id,title:title(label),by:who,at,lines:kind==="story"?[]:null,ts:ts()});
        return {ok:true,session:id};
      });
    },
    savePaint(session,who,strokes,at=Date.now()){
      if(!validId(session)||!["anh","em"].includes(who))return Promise.resolve(false);
      const clean=cleanStrokes(strokes,who);
      return col.doc(painter(who)).set({k:"creative-paint",session,who,strokes:clean,at,ts:ts()}).then(()=>true);
    },
    publishPainting(session,at=Date.now()){
      if(!validId(session))return Promise.resolve({ok:false,message:"Bức tranh chưa hợp lệ"});
      const meta=col.doc(creativeKey("paint")),a=col.doc(painter("anh")),b=col.doc(painter("em")),out=col.doc(artId(session));
      return fs.runTransaction(async tx=>{
        const [m,aa,bb]=await Promise.all([tx.get(meta),tx.get(a),tx.get(b)]);
        if(!m.exists||m.data().id!==session)return {ok:false,message:"Bức tranh đã được cất hoặc thay đổi"};
        const A=aa.exists&&aa.data().session===session?aa.data().strokes:[],
          B=bb.exists&&bb.data().session===session?bb.data().strokes:[];
        if(!canPublishPainting(A,B))return {ok:false,message:"Cần cả hai người cùng vẽ ít nhất một nét"};
        tx.set(out,{k:"creative-art",id:session,title:title(m.data().title),strokes:combinePainting(A,B),at,ts:ts()});
        tx.delete(meta);
        // Không xoá bản phác: nếu máy kia còn gửi một nét chậm, session cũ vẫn được nhận ra và bỏ qua.
        return {ok:true,message:"Bức tranh chung đã vào bảo tàng 🖼️",id:session};
      });
    },
    saveStoryDraft(session,who,text,at=Date.now()){
      if(!validId(session)||!["anh","em"].includes(who))return Promise.resolve(false);
      return col.doc(draft(who)).set({k:"creative-draft",session,who,text:String(text||"").slice(0,300),at,ts:ts()}).then(()=>true);
    },
    appendStory(session,who,text,at=Date.now()){
      if(!validId(session)||!["anh","em"].includes(who)||!String(text||"").trim())
        return Promise.resolve({ok:false,message:"Hãy viết một đoạn trước nhé"});
      const meta=col.doc(creativeKey("story"));
      return fs.runTransaction(async tx=>{
        const snap=await tx.get(meta);
        if(!snap.exists||snap.data().id!==session)return {ok:false,message:"Truyện đã được xuất bản hoặc đổi phiên"};
        const lines=cleanLines(snap.data().lines);
        if(lines.length>=80)return {ok:false,message:"Truyện đã đủ dài, hãy xuất bản nhé"};
        lines.push({by:who,text:String(text).trim().slice(0,300),at});
        tx.update(meta,{lines,ts:ts()});
        return {ok:true,message:"Đã thêm đoạn mới. Người kia thấy ngay trong xưởng! 📖"};
      });
    },
    publishStory(session,at=Date.now()){
      if(!validId(session))return Promise.resolve({ok:false,message:"Truyện không hợp lệ"});
      const meta=col.doc(creativeKey("story")),out=col.doc(bookId(session));
      return fs.runTransaction(async tx=>{
        const snap=await tx.get(meta);
        if(!snap.exists||snap.data().id!==session)return {ok:false,message:"Truyện đã được cất hoặc đổi phiên"};
        const lines=cleanLines(snap.data().lines);
        if(!canPublishBook(lines))return {ok:false,message:"Cả hai cần cùng viết ít nhất một đoạn trước khi kết truyện"};
        tx.set(out,{k:"creative-book",id:session,title:title(snap.data().title),lines,at,ts:ts()});
        tx.delete(meta);
        return {ok:true,message:"Truyện hoàn thành đã vào kệ sách phòng ngủ 📚",id:session};
      });
    },
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

