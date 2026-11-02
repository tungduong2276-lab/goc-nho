// Lưu sẵn khung app để mở được cả khi mạng chập chờn. Dữ liệu do Firebase tự đồng bộ.
const CACHE = "goc-nho-v3";
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./firebase-config.js", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png"];
const CDN = ["www.gstatic.com", "fonts.googleapis.com", "fonts.gstatic.com"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  if (url.origin === location.origin) {
    // Trang của app: lấy bản mới nhất, mất mạng thì dùng bản đã lưu.
    e.respondWith(fetch(e.request).then(r => {
      const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return r;
    }).catch(() => caches.match(e.request).then(r => r || caches.match("./index.html"))));
  } else if (CDN.includes(url.hostname)) {
    // Thư viện Firebase và phông chữ: dùng bản đã lưu, cập nhật ngầm.
    e.respondWith(caches.match(e.request).then(hit => {
      const net = fetch(e.request).then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return r; }).catch(() => hit);
      return hit || net;
    }));
  }
});
