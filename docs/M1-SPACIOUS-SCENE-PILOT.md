# M1 — Spacious Scene Redesign: pilot Phòng khách và Bếp (3D nguồn)

## Scope và sản phẩm thật của lượt này

Thay đổi **nguồn hình học 3D** thay vì CSS; tạo render trước/sau bằng đúng camera, khung hình 1170×1170 và asset chuẩn của Góc Nhỏ. Tránh thay ảnh production trước khi người duyệt xem ảnh chênh lệch.

- `_xuong-3d/spacious-layout.js`: hai bố cục nguồn `old`/`next`, tọa độ sàn X/Z theo mét (mỗi phòng shell 6×6), phép đo ước lượng phần vật thể chiếm vùng trung tâm; có metadata `SOURCE_LAYOUT_PROPOSAL`, `canPersist:false`.
- `_xuong-3d/room.js`: di chuyển đồng thời bàn trà và thảm về phía sofa (phòng khách), giữ nguyên sofa, tường, cửa sổ, ảnh, vị trí hai nhân vật và các lớp tương tác. Dự kiến bàn trà từ X=0.55,Z=0.45 → X=-1.15,Z=0.65. Thảm X=0.55,Z=0.55 → X=-1.15,Z=0.70.
- `_xuong-3d/rooms2.js`: di chuyển bàn ăn và thảm Bếp từ X=0.6,Z=1.1 → X=1.35,Z=1.55. **Cập nhật đồng thời cả hai vị trí ghế ngồi** từ `[-0.25,1.1]`, `[1.45,1.1]` sang `[0.5,1.55]`, `[2.2,1.55]`, để nhân vật không ngồi ở vị trí bàn cũ. Hai điểm đứng `dung`, tủ lạnh, bếp nấu và khu vực rửa giữ nguyên.
- `scripts/m1-spacious-preview.py`: ghép background và sprite đã render để tạo ảnh **before/after**. Existing được đọc từ `assets/3d` + `scene.json`; after từ cùng source thật render trong CI, không phải bản đồ 2D tưởng tượng. Xuất `review-artifacts/house-spacious/spacious-phong-khach-before-after.png` và `spacious-bep-before-after.png`, manifest `approved:false`.
- `.github/workflows/garden-browser.yml`: chỉ khi head branch là `feature/m1-spacious-scene-living-kitchen-pilot`, cài three.js, Pillow và render `room.js` (nen + lop) và `rooms2.js` (bep). Upload ảnh để con người review; **không commit ảnh hay scene.json vào repo** trong PR này.
- `tests/staging/m1-spacious-scene-pilot.test.mjs`: ràng buộc 6×6, thay đổi ghế cùng bàn, kiểm tra phép đo khoảng trống trung tâm và trạng thái chưa được duyệt.

## Tiêu chí hình ảnh trước khi cho phép thay asset production

1. Ảnh ghép không bị cắt đồ, chồng tường, sai phối cảnh, lộ khoảng trống sau vật cũ, đứt bóng hay sai nền ở sáng/ngày/chiều/đêm.
2. So sánh trước/sau: sàn trung tâm có rộng hơn rõ rệt, bàn trà vẫn hợp lý cạnh sofa, hai ghế ăn và bàn giữ khoảng cách đúng; lối đi của hai nhân vật không bị che.
3. Render đầy đủ mọi state: sofa/lọ/radio/ảnh/bảng, tủ lạnh mở/đóng, bếp nấu, bàn ăn trống/bày món. Tọa độ ảnh cắt từ PNG cần tính lại, không copy lớp bbox cũ.
4. Chỉ sau khi duyệt mới chạy trình pack lại `assets/3d` và `scene.json` trên PR riêng, cập nhật hitbox và chạy browser thật tại 360/390/430/1300 px, ghế ngồi, mở tủ, nấu ăn, điều hướng Nhà và hai thiết bị.
5. Kiểm chứng độc lập floor contact và sàn/cửa thật trước khi cho phép vật trang trí được lưu.

## Thước đo tham chiếu — không phải diện tích sàn đã kiểm chứng

`compareCenterClearance(roomId)` so sánh diện tích giao của *hình bao gần đúng của đồ chiếm sàn* với một hình chữ nhật vùng giữa phòng do người thiết kế đặt ra. `estimatedClearanceGainM2 > 0` biểu thị đề xuất giảm cản trong vùng tham chiếu đó, **không** chứng minh sàn thật tăng bao nhiêu, không phải phép đo collider chính xác hay tính toán đường đi hợp lệ. Cần human review ảnh/3D.

## Giới hạn phát hành

Không cập nhật `index.html`, production assets, `scene.json` hay Firebase. PR #9 vẫn Draft, `main` không thay đổi. M0 staging backup/restore, Rules/Auth/App Check/IAM và rollback vẫn là cổng bắt buộc trước khi bật trang trí chung.
