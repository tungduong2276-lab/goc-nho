// Lưu sẵn khung app để mở được cả khi mạng chập chờn. Dữ liệu do Firebase tự đồng bộ.
// Mỗi lần sửa app, tăng số phiên bản dưới đây để điện thoại nhận bản mới.
const CACHE = "goc-nho-v8";
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
  "./assets/3d/hoa_anhdao_bo.webp",
  "./assets/3d/hoa_anhdao_gd1.webp",
  "./assets/3d/hoa_anhdao_gd2.webp",
  "./assets/3d/hoa_anhdao_gd3.webp",
  "./assets/3d/hoa_anhdao_gd4.webp",
  "./assets/3d/hoa_anhdao_gd5.webp",
  "./assets/3d/hoa_anhdao_heo.webp",
  "./assets/3d/hoa_camtucau_bo.webp",
  "./assets/3d/hoa_camtucau_gd1.webp",
  "./assets/3d/hoa_camtucau_gd2.webp",
  "./assets/3d/hoa_camtucau_gd3.webp",
  "./assets/3d/hoa_camtucau_gd4.webp",
  "./assets/3d/hoa_camtucau_gd5.webp",
  "./assets/3d/hoa_camtucau_heo.webp",
  "./assets/3d/hoa_cuc_bo.webp",
  "./assets/3d/hoa_cuc_gd1.webp",
  "./assets/3d/hoa_cuc_gd2.webp",
  "./assets/3d/hoa_cuc_gd3.webp",
  "./assets/3d/hoa_cuc_gd4.webp",
  "./assets/3d/hoa_cuc_gd5.webp",
  "./assets/3d/hoa_cuc_heo.webp",
  "./assets/3d/hoa_oaihuong_bo.webp",
  "./assets/3d/hoa_oaihuong_gd1.webp",
  "./assets/3d/hoa_oaihuong_gd2.webp",
  "./assets/3d/hoa_oaihuong_gd3.webp",
  "./assets/3d/hoa_oaihuong_gd4.webp",
  "./assets/3d/hoa_oaihuong_gd5.webp",
  "./assets/3d/hoa_oaihuong_heo.webp",
  "./assets/3d/hoa_sen_bo.webp",
  "./assets/3d/hoa_sen_gd1.webp",
  "./assets/3d/hoa_sen_gd2.webp",
  "./assets/3d/hoa_sen_gd3.webp",
  "./assets/3d/hoa_sen_gd4.webp",
  "./assets/3d/hoa_sen_gd5.webp",
  "./assets/3d/hoa_sen_heo.webp",
  "./assets/3d/hoa_tulip_bo.webp",
  "./assets/3d/hoa_tulip_gd1.webp",
  "./assets/3d/hoa_tulip_gd2.webp",
  "./assets/3d/hoa_tulip_gd3.webp",
  "./assets/3d/hoa_tulip_gd4.webp",
  "./assets/3d/hoa_tulip_gd5.webp",
  "./assets/3d/hoa_tulip_heo.webp",
  "./assets/3d/man_hinh_cho.webp",
  "./assets/3d/may_1.webp",
  "./assets/3d/may_2.webp",
  "./assets/3d/may_3.webp",
  "./assets/3d/nv_anh_dung.webp",
  "./assets/3d/nv_anh_dung_sau.webp",
  "./assets/3d/nv_anh_ngoi.webp",
  "./assets/3d/nv_anh_ngu.webp",
  "./assets/3d/nv_anh_om.webp",
  "./assets/3d/nv_anh_tuoi.webp",
  "./assets/3d/nv_anh_vaytay.webp",
  "./assets/3d/nv_em_dung.webp",
  "./assets/3d/nv_em_dung_sau.webp",
  "./assets/3d/nv_em_ngoi.webp",
  "./assets/3d/nv_em_ngu.webp",
  "./assets/3d/nv_em_om.webp",
  "./assets/3d/nv_em_tuoi.webp",
  "./assets/3d/nv_em_vaytay.webp",
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
  "./assets/3d/thu_meo_cam_nam.webp",
  "./assets/3d/thu_meo_cam_ngoi.webp",
  "./assets/3d/thu_meo_cam_vui.webp",
  "./assets/3d/thu_meo_trang_nam.webp",
  "./assets/3d/thu_meo_trang_ngoi.webp",
  "./assets/3d/thu_meo_trang_vui.webp",
  "./assets/3d/thu_meo_xam_nam.webp",
  "./assets/3d/thu_meo_xam_ngoi.webp",
  "./assets/3d/thu_meo_xam_vui.webp"
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
