# Xưởng 3D của Góc Nhỏ

Mã dựng toàn bộ hình 3D trong `assets/3d`. App không dùng thư mục này. Nó dành cho những lần làm tiếp, để hình mới giữ đúng phong cách cũ.

- **Phong cách:** theo "Góc Nhỏ · Yêu cầu thiết kế 3D". Camera trực giao 45° / 35.26°, toon 3 bậc, viền #1D2B4F dày 2.5 px (7.5 px ở ảnh @3x), bóng xanh than 18% lệch dưới-phải.
- **Cần có:** three.js r169 đặt ở `./three` (gồm `build/` và `examples/jsm/{geometries,utils}`), Playwright + Chromium, Python có Pillow.
- **Chạy:** mở một máy chủ tĩnh trong thư mục này (`python3 -m http.server 8901`), rồi chạy `node run.js <file.js> <thư-mục-ra> [tên-job]`.

| File | Dựng gì |
|---|---|
| `lib.js` | luật chung: vật liệu toon, viền, đèn 4 buổi, camera |
| `chars.js`, `rig.js`, `rigjobs.js` | nhân vật; phối đồ theo lớp |
| `pet.js`, `pets2.js` | mèo và 5 loài thú khác |
| `furn.js`, `room.js`, `rooms2.js`, `outdoor.js` | phòng khách, 5 phòng, quán cà phê, bến thuyền |
| `map.js` | bản đồ ngôi nhà |
| `flora.js` | 12 loại hoa × 7 trạng thái |
| `kingdom.js` | đảo vương quốc và 17 công trình |
| `garden.js` | khu vườn (tab Khu vườn) |
| `fest.js` | lớp phủ lễ hội |
| `stickers.js`, `emo.py` | sticker, huy hiệu, sticker cảm xúc |
| `brand.js` | icon app, màn hình chờ |
| `pack*.py` | đổi sang WebP và ghi `assets/3d/scene.json` |
| `v8_inject.js` … `v10_inject.js` | mã đã ghép vào `index.html` ở từng bản (để tham khảo) |

**Còn lại (4 tab):** Hẹn hò, Gửi nhau, Chơi cùng, Kỷ niệm. Mỗi tab cần một cảnh 3D làm sân khấu và giao diện vẽ lại cùng kiểu với tab Nhà.
