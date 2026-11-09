# Bản thử Nhà 3D kiểu Play Together (`nha3d/`)

> Trạng thái: **bản thử độc lập**, chưa nối vào app chính (`index.html`), **không đọc/ghi Firebase**. Bố cục, trang phục, buổi trong ngày chỉ lưu `localStorage` của trình duyệt đang mở. Ngày: 2026-11-08.

## Vì sao làm lại cơ chế nhà

Nhà hiện tại (và nhánh V2 #79) dùng **ảnh 3D dựng sẵn** + toạ độ chạm. Cách đó đẹp nhưng không thể kéo-thả-xoay đồ tự do, nhân vật chỉ trượt trên ảnh, đổi đồ nội thất phải dựng lại ảnh. Play Together làm được vì cảnh là **3D thật chạy trong máy**.

Toàn bộ hình của Góc Nhỏ vốn được dựng bằng three.js trong `_xuong-3d/` (toon 3 bậc, viền #1D2B4F, camera trực giao 45°/35,26°). Bản thử này **chạy chính bộ dựng đó trực tiếp trong trình duyệt**, nên giữ nguyên phong cách mà mở được cơ chế kiểu Play Together.

## Có gì

| Chế độ | Làm được |
|---|---|
| **Chơi** | Cần điều khiển (hoặc phím mũi tên/WASD); chạm sàn để tự tìm đường (A*, không cắt góc, trượt dọc vật cản); chạm đồ để Ngồi / Đi ngủ / Mở tủ lạnh / Nấu ăn / Bật đèn / Bật nhạc / Vẽ tiếp / Viết thư / Mở rương / Bốc hũ hẹn hò; chạm người kia để Ôm / Đập tay / Gọi lại; vẫy tay, thả tim, 8 biểu cảm; đổi người điều khiển Anh ↔ Em; 4 buổi trong ngày |
| **Người kia** | Tự đi dạo, tự ngồi, sang ngồi cạnh khi mình ngồi và ở lại; vẫy tay, đổi biểu cảm |
| **Mèo** | Đi dạo, về ổ nằm ngủ |
| **Trang trí** | Kho 31 món chia 6 nhóm (ảnh nhỏ dựng tại chỗ); kéo đồ theo lưới 0,5 m (ô xanh = hợp lệ, đỏ = vướng); xoay 90°; đồ treo tường kéo dọc tường, ↻ để chuyển tường; cất vào kho; hoàn tác; 5 màu tường × 4 màu sàn; bày lại như mới |
| **Tủ đồ** | 6 kiểu tóc × 5 màu, 10 áo, 7 quần/giày, 7 mũ, 10 phụ kiện (từ `rig.js`) |

Phòng 8 × 7 m (16 × 14 ô). Mở: `…/goc-nho/nha3d/` sau khi lên GitHub Pages, hoặc bản xem thử Claude đăng riêng.

## Cấu trúc

- `nha3d/catalog.mjs` — danh mục đồ: dấu chân ô lấy từ **hộp bao đo thật** của mô hình, ghế (toạ độ, hướng, độ cao), tương tác, bố cục mặc định.
- `nha3d/engine.mjs` — logic thuần (không three.js): kiểm tra đặt, lưới chặn, A*, đường đi rút gọn, trượt va chạm, ghế/điểm tiếp cận theo góc xoay, nạp bố cục bẩn an toàn, hoàn tác.
- `nha3d/app.js` — cảnh, nhân vật, điều khiển, giao diện.
- `nha3d/xuong/` — **bản chép tự sinh** từ `_xuong-3d/` bằng `node scripts/sync-nha3d.mjs` (GitHub Pages/Jekyll bỏ qua thư mục bắt đầu bằng `_`). `npm run test:static` báo lỗi nếu lệch.
- `_xuong-3d/rig.js` thêm `buildAvatar(look)`; `_xuong-3d/rooms2.js` thêm `export { OBJ, plantPot, rugRound, rugRect, bookStack }`. Chỉ thêm export, **không đổi hình đã dựng**.
- three.js r169 nạp từ jsDelivr (đúng bản xưởng 3D dùng); test trong CI chuyển sang `node_modules/three`.

## Xem thử trên Firebase Hosting Preview Channel (staging)

Chỉ dùng project **`goc-nho-staging-2026`** (không phải project thật). Cấu hình riêng `firebase.nha3d-preview.json` chỉ phát hành `dist/nha3d-preview/` = trang `nha3d/` + một trang chuyển hướng; **không** kèm `index.html` của app chính, không đụng Firestore Rules.

```bash
npm ci
npx firebase login            # tài khoản có quyền Hosting trên goc-nho-staging-2026
npm run preview:nha3d:staging # build + hosting:channel:deploy nha3d, hết hạn sau 7 ngày
```

Lệnh in ra đường dẫn dạng `https://goc-nho-staging-2026--nha3d-xxxx.web.app/`. Lần đầu có thể cần bấm *Get started* ở Hosting trong Firebase Console của staging. GitHub cố ý chưa giữ khoá deploy (xem `docs/M0-STAGING-GITHUB-SETUP.md`), nên lệnh chạy từ máy đã đăng nhập.

## Test

- `tests/staging/nha3d-engine.test.mjs` — 11 test Node: mọi mô hình vừa dấu chân (≤ 5 cm), bố cục mặc định hợp lệ, chặn chồng/ra ngoài/sai góc, đồ treo tường, xoay khớp three.js, A* không cắt góc và báo bị nhốt, đường rút gọn không xuyên đồ, trượt va chạm, ghế + điểm tiếp cận ở 4 góc xoay đều tới được, nạp dữ liệu hỏng/lạ, tìm chỗ trống, hoàn tác.
- `tests/browser/nha3d.spec.mjs` — 7 test Chromium: dựng không lỗi & **không có request Firebase**, ngồi sofa + rủ ngồi cùng + đứng dậy, trang trí (thêm, xoay, từ chối thả chồng, còn sau tải lại), tủ đồ nhớ sau tải lại, nút ≥ 44 px không chồng nhau ở 360/390/430 px.

## Giới hạn đã biết (chưa làm)

- **Chưa đồng bộ hai người.** Mỗi máy một bố cục. Muốn dùng thật phải có schema `rooms/{roomId}/objects/{objectId}` + ghi theo `revision` (đã có lõi `src/versioned-write.mjs` + Rules ứng viên trong M0), và qua các cổng M0 còn mở.
- Người kia là **nhân vật tự động**, chưa phải bạn ấy điều khiển từ máy khác (cần presence realtime).
- Một phòng duy nhất; chưa có cửa sang phòng khác, sân vườn.
- Chưa đo khung hình trên điện thoại thật (CI dùng SwiftShader). Lần đo đầu: ~385 lệnh vẽ, ~140k tam giác / khung.
- Hũ hẹn hò trong bản thử là 12 gợi ý cố định, chưa nối dữ liệu hũ thật.

## Bước tiếp theo đề xuất

1. Hai người mở thử trên điện thoại thật, ghi lại chỗ khó dùng / giật.
2. Nếu đi tiếp hướng này: thêm nhiều phòng nối cửa + sân; đồng bộ bố cục qua Firestore sau khi M0 xong; presence để thấy nhau đi lại thật.
3. Cân nhắc gộp dần với nhánh V2 (#79): giữ chat trong phòng, bếp hai vai, sticker của V2 nhưng chạy trên cảnh 3D trực tiếp này.
