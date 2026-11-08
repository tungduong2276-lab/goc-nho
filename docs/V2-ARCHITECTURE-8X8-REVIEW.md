# Góc Nhỏ V2 — M1.A: sáu bản mẫu kiến trúc phòng thật 8m (Three.js)

**Phạm vi:** xây dựng và thẩm định **kiến trúc 3D mới từ mã nguồn**, chưa thay thế nội thất/ảnh WebP trong ứng dụng thật. PR này cố ý không sửa `index.html`, `assets/3d/scene.json`, Firestore hoặc trạng thái người dùng. Bản V2 chỉ được mở khi `?world2=1` và hiện dùng ảnh cũ — không được coi bản mẫu là tính năng đã phát hành.

## 1. Lý do không dùng CSS zoom

Mã hiện tại ở `_xuong-3d/room.js` / `rooms2.js` dựng năm cảnh 6×6 đơn vị thế giới và Gác 6×4; `F.roomShell` tạo các khối tường đặc. Trước đây lối ra hành lang là thành phần HTML được gắn vào mép sàn, **không phải một khoảng trống được chừa trong tường 3D**.

Bản kiến trúc riêng `_xuong-3d/architecture.js` tạo lại sàn, tường, cửa, đồ vật bằng hình khối thật (Three.js) và dùng một hệ tọa độ thế giới nhất quán, không phóng đại sprite gốc.

| Không gian | Sàn hiện tại | Sàn 3D mẫu | Tăng diện tích |
|---|---:|---:|---:|
| Phòng khách | 6×6 = 36 | 8×8 = 64 | +77,8% |
| Bếp | 6×6 = 36 | 8×8 = 64 | +77,8% |
| Phòng Anh | 6×6 = 36 | 8×8 = 64 | +77,8% |
| Phòng Em | 6×6 = 36 | 8×8 = 64 | +77,8% |
| Góc sáng tạo | 6×6 = 36 | 8×8 = 64 | +77,8% |
| Gác kỷ niệm | 6×4 = 24 | 8×7 = 56 | +133,3% |

Đơn vị này là mét mô hình / diện tích mặt bằng lý thuyết để so sánh nhất quán, **không phải đo đạc nhà thật**. Diện tích trống cho nhân vật nhỏ hơn sau khi trừ nội thất/cửa.

## 2. Một cửa thật được chừa trên tường

- Tường phía trái tại `x = -4` **không phải một khối đặc**: được chia thành hai đoạn ngang và một đoạn trên (lintel), để trống chính giữa 1,5 đơn vị chiều rộng và 2,25 đơn vị chiều cao.
- Cửa có hai khung đứng, thanh ngang và lá cửa mở 90° lệch khỏi lối đi.
- Sàn hành lang nằm phía ngoài tường, chồng khớp 0,06 đơn vị vào cạnh sàn bên trong; có viền, đèn và thảm nối qua khe cửa.
- Dòng di chuyển hình học `hall → outside → threshold → inside` dùng tọa độ 3D, không phải tọa độ nút `#nha`. Vùng hành lang có chiều sâu 2,35, chiều ngang 2,5.
- Bộ kiểm thử xác minh lối đi đủ thoáng giữa nội thất và cửa; không chỉ kiểm tra hình ảnh cánh cửa.

**Lưu ý:** Đây là một đoạn hành lang nhỏ ngay ngoài từng phòng, chưa phải bản vẽ tổng thể liên thông có sáu cửa, cầu thang nối tầng, góc quay camera hay avatar đi xuyên mô hình tại runtime. Phải giải quyết việc ghép các phòng vào cùng hệ tọa độ toàn nhà trước khi chuyển app sang loại cảnh mới.

## 3. Nội thất thật, không thu phóng đồ cũ

Mỗi phòng có tối thiểu bốn khu đồ riêng, dựng lại bằng hình học (sofa, tủ, bếp, giường, bàn làm việc, giá vẽ, rương...). `_xuong-3d/architecture-plan.js` lưu kích thước/footprint để thẩm định va chạm và giữ trống hành lang trong toàn bộ sáu phòng. Các vật mẫu có thể khác về chi tiết so với đồ đang dùng: đây là **bản dựng kỹ thuật để chốt diện tích và cấu trúc**, chưa phải bộ asset nghệ thuật cuối.

Bản render sử dụng camera isometric đồng bộ; mỗi phòng có ảnh `ngay` và `dem`. Đầu ra `out_arch/meta.json` ghi world-floor, cửa, tọa độ chiếu ảnh, footprint vật dụng để đối chiếu.

## 4. Cách xem bản dựng

Nhánh `feature/world-v2-architecture-8x8`: GitHub Actions -> job `Garden browser regressions` -> artifact `world-v2-architecture-3d-review`. Nó gồm 12 PNG và `meta.json`; **không tự động commit ảnh vào app**. Bước dựng:
- three@0.169.0 + Chromium SwiftShader qua `_xuong-3d/run.js`.
- `node _xuong-3d/run.cjs architecture.js out_arch`.
- `node scripts/check-architecture-preview.mjs out_arch` kiểm tra ảnh thật đã render, số đo diện tích, chiếu cửa còn trong khung, bản ngày/đêm và ảnh không rỗng.

## 5. Điều kiện kiểm duyệt trước khi dùng trong app

- [ ] CI toàn bộ V2 xanh, kể cả Playwright 360/390/430px, Firebase Emulator và staging tests.
- [ ] 12/12 ảnh kiến trúc có thật và không clipping, đúng màu/ngày đêm.
- [ ] Xem độc lập ảnh sáu phòng: lỗ cửa nhìn rõ, khung cửa không bị vật cản, đồ vật không đè nhau hoặc lộ bóng sai.
- [ ] Có bản đồ tọa độ tổng thể cho sáu phòng và Gác (cầu thang/đường lên tầng), không nối các thế giới bằng nút ảo.
- [ ] Chốt metadata mới, floorwalk và hitbox với ảnh mới; giữ chức năng tủ lạnh, giường, bàn ăn, giá vẽ, album và Khu vườn.
- [ ] Chỉ sau khi test mobile kiểm thử và review hình học mới xuất WebP đúng asset namespace và đưa vào V2 behind independent flag. Không thay `scene.json` của production bây giờ.

## 6. Firebase và M0

Không thêm code Firebase, không đụng schema, không ghi dữ liệu hai người. Các cổng M0 vẫn mở: Managed Cloud Firestore export/restore từ dự án staging sang restore test có xác nhận, kiểm tra Rules/Auth/App Check/IAM deployed, rollback thật và 2 thiết bị. Không nhập PR #79/#9 vào `main` trước khi các cổng này đạt.

**Bước kỹ thuật tiếp theo:** từ bộ ảnh và `meta.json` render đã duyệt, liên kết tọa độ cửa với floor-mesh V2; ghép hành lang sáu phòng thành một mặt bằng chung và thay lối ra HTML bằng cửa 3D thực sự, đồng thời tạo chế độ camera kéo/di chuyển trên sàn diện tích mới.
