// Lưu sẵn khung app để mở được cả khi mạng chập chờn. Dữ liệu do Firebase tự đồng bộ.
// Mỗi lần sửa app, tăng số phiên bản dưới đây để điện thoại nhận bản mới.
const CACHE = "goc-nho-v19";
const SHELL = [
  "./", "./index.html", "./manifest.webmanifest", "./firebase-config.js",
  "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png",
  "./assets/3d/ban_do_chieu.webp",
  "./assets/3d/ban_do_dem.webp",
  "./assets/3d/ban_do_ngay.webp",
  "./assets/3d/ban_do_sang.webp",
  "./assets/3d/chan_dung_anh.webp",
  "./assets/3d/chan_dung_em.webp",
  "./assets/3d/chau_hong.webp",
  "./assets/3d/chau_matcuoi.webp",
  "./assets/3d/chau_trang.webp",
  "./assets/3d/chau_xanh.webp",
  "./assets/3d/dao_chieu.webp",
  "./assets/3d/dao_dem.webp",
  "./assets/3d/dao_ngay.webp",
  "./assets/3d/dao_sang.webp",
  "./assets/3d/man_hinh_cho.webp",
  "./assets/3d/may_1.webp",
  "./assets/3d/may_2.webp",
  "./assets/3d/may_3.webp",
  "./assets/3d/phong_khach_chieu.webp",
  "./assets/3d/phong_khach_dem.webp",
  "./assets/3d/phong_khach_ngay.webp",
  "./assets/3d/phong_khach_sang.webp",
  "./assets/3d/pk_bang_ghim_giay.webp",
  "./assets/3d/pk_bang_ghim_trong.webp",
  "./assets/3d/pk_cuaso_mua.webp",
  "./assets/3d/pk_hu_day.webp",
  "./assets/3d/pk_hu_it.webp",
  "./assets/3d/pk_hu_mo.webp",
  "./assets/3d/pk_hu_nua.webp",
  "./assets/3d/pk_khung_anh.webp",
  "./assets/3d/pk_lich.webp",
  "./assets/3d/pk_radio_phat.webp",
  "./assets/3d/pk_radio_tat.webp",
  "./assets/3d/pk_sofa.webp",
  "./assets/3d/scene.json",
  "./assets/3d/living-motion.js",
  "./src/living-world-games.js", "./src/living-world-v2.js",
  "./src/living-world-v2.css", "./src/living-world-minigames.js",
  "./src/living-world-floor-geometry.mjs",
  "./src/living-world-transitions.mjs", "./src/living-world-hallway.mjs",
  "./src/living-world-nav.mjs", "./src/living-world-avatar.mjs",
  "./src/living-world-kitchen-engine.mjs", "./src/living-world-kitchen.mjs",
  "./src/living-world-architecture-preview.mjs", "./assets/3d/v2arch/preview.json"
];
const CDN = ["www.gstatic.com", "fonts.googleapis.com", "fonts.gstatic.com"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE)
    .then(c => Promise.all(SHELL.map(u => c.add(new Request(u, { cache: "reload" })).catch(() => {}))))
    .then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

const keep = (req, res) => {
  if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
  return res;
};

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  if (url.origin === location.origin) {
    // Hình ảnh, biểu tượng: dùng bản đã lưu cho nhanh, cập nhật ngầm.
    if (/\/assets\/|\.png$|\.webp$|\.json$/.test(url.pathname)) {
      e.respondWith(caches.match(req).then(hit => {
        const net = fetch(req).then(r => keep(req, r)).catch(() => hit);
        return hit || net;
      }));
      return;
    }
    // Trang và mã của app: luôn lấy bản mới nhất, mất mạng thì dùng bản đã lưu.
    const fresh = new Request(url.href, { cache: "no-cache", credentials: "same-origin" });
    e.respondWith(fetch(fresh).then(r => keep(req, r))
      .catch(() => caches.match(req, { ignoreSearch: true })
        .then(r => r || (req.mode === "navigate" ? caches.match("./index.html") : undefined))
        .then(r => r || new Response("", { status: 504 }))));
    return;
  }

  if (CDN.includes(url.hostname)) {
    // Thư viện Firebase và phông chữ: dùng bản đã lưu, cập nhật ngầm.
    e.respondWith(caches.match(req).then(hit => {
      const net = fetch(req).then(r => { if (r && (r.ok || r.type === "opaque")) { const c = r.clone(); caches.open(CACHE).then(x => x.put(req, c)); } return r; }).catch(() => hit);
      return hit || net;
    }));
  }
});
