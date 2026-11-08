# Góc Nhỏ V2 — M1.B: xem thử sáu phòng 3D rộng trong ứng dụng

**Trạng thái:** chế độ xem riêng, chỉ khi mở `?world2=1&archpreview=1`. Không thay thế phòng sống, không đồng bộ vị trí, không thay Firestore. Mục đích là duyệt ảnh và metadata thật trước khi thay hệ tọa độ đi lại.

## Truy cập và sử dụng

1. Mở một phòng thuộc sáu phòng trong Nhà, ví dụ `index.html?world2=1&archpreview=1#bep`.
2. Ngay phía dưới cảnh 3D cũ có nút **🏠 Xem thử phòng 3D rộng hơn**. Nhấn để xem ảnh dựng Three.js thực sự.
3. Chuyển sáu phòng qua thanh chọn; đổi **Ban ngày / Ban đêm**. Bấm **Hiện kích thước** để xem ranh giới sàn, vị trí cửa và tâm đồ vật chiếu lên ảnh 1170×1170.
4. Dùng Escape hoặc **Đóng** để quay về cảnh gốc. Trạng thái hiện hành của app (tủ lạnh, bếp, đồ đạc, game, dữ liệu) không bị đổi.
5. Không có `world2=1` và `archpreview=1` đồng thời: UI xem thử không tồn tại. Không bật mặc định.

## Kiến trúc dữ liệu và bảo vệ dữ liệu thật

- 12 WebP dựng từ mã `_xuong-3d/architecture.js`, 6 phòng × `ngay/dem` qua Chromium/Three.js và Pillow; nằm **duy nhất** dưới `assets/3d/v2arch/`, không ghi đè `assets/3d/bep_ngay.webp` và các ảnh gốc.
- `preview.json`: phòng, diện tích (64 cho năm phòng, 56 cho Gác), ranh giới sàn, vị trí cửa 1,5×2,25 và nội thất đo theo camera 3D. Không chứa ID người dùng, email, ảnh cá nhân, bí mật hay Firestore state.
- `scripts/pack-architecture-preview.py` lưu SHA-256 theo bộ nguồn Three.js; `--check` chỉ tái dựng ảnh khi mã nguồn/đầu ra đổi. `scripts/check-architecture-gallery.mjs` kiểm tra dấu vân tay, đủ 12 ảnh WebP thật, metadata và RIFF; `tests/staging/world-v2-architecture-gallery.test.mjs` xác thực phạm vi an toàn.
- CI chỉ commit 12 file hình mẫu và metadata vào nhánh riêng `feature/world-v2-architecture-preview` **sau khi toàn bộ npm test xanh**. Không có deploy hay ghi Firebase.
- PWA cache v19 có module và manifest; 12 ảnh chỉ tải khi người dùng chủ động mở xem, tránh tăng kích thước download cho người đang dùng legacy.

## Kiểm thử và thẩm định

- [ ] CI HEAD: static, staging Node, Playwright 360/390/430px và Firebase Emulator xanh.
- [ ] Chụp thật 12 ảnh hiển thị trong app và kiểm tra từng phòng, cả ngày/đêm.
- [ ] Camera chứa đầy đủ sàn và khung cửa; ranh giới đo đặt đúng nền ảnh.
- [ ] Modal không đè viewport, hỗ trợ bàn phím/Escape, giảm chuyển động và quay lại đúng nơi.
- [ ] Sau khi xem, thử lại Bếp hỗn loạn, tủ lạnh, chat và đổi phòng kiểu cũ; đối chiếu số vùng chạm nội thất vẫn không đổi.
- [ ] Chỉ cho phép xem, không có nút đặt hoặc kéo đồ trên ảnh mới trước khi có engine room-state mới.
- [ ] Không sửa `scene.json`, `index.html` legacy render logic, Firestore Rules/schema/collections, hoặc `main`.

## Giới hạn kỹ thuật

Cảnh lớn mới vẫn là **ảnh dựng tĩnh với metadata chiếu**, không phải nhân vật đang di chuyển trên mặt bằng mới; việc chạm đồ trong cảnh cũ vẫn dùng sprite cũ. Ngưỡng cửa V2 trước đây tại mép trước của sàn không thể chuyển thẳng sang ảnh mới, vì cửa kiến trúc thực nằm trên **tường trái** của hệ tọa độ 3D. Không được chỉ hoán đổi WebP nền trong `roomSceneHTML()` — sẽ phá vị trí nhân vật, click hitbox và các trạng thái nội thất.

**Bước tiếp theo:** xây dựng phép chiếu `(world x,z) → (canvas px,py)` và mô hình chuyển động theo footprint/cửa mới; kiểm chứng đoạn hành lang và cầu thang nối các tầng, chuyển các state/layer và sprite đang có trên cảnh cũ sang vị trí mới, rồi mới bật scene mới để người dùng điều khiển, tất cả trong V2 và kiểm thử trên hai thiết bị staging.

M0 vẫn chưa hoàn thành: managed Cloud Firestore staging export/restore, deployed Rules/Auth/App Check/IAM, rollback và kiểm thử staging thật trên hai thiết bị. Không đưa V2 lên `main`.
