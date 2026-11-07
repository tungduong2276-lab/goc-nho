# M1 — Đánh dấu vùng chân nội thất (floor-contact) và chuẩn bị bố cục phòng rộng hơn

## Vì sao không lấy `alphaBounds` làm vật cản

PR #58 đã có alpha silhouette của sprite: phần ảnh thật có màu. Nhưng vùng chân đồ tiếp xúc sàn không đồng nhất với hình ảnh, ví dụ tủ cao có biên ảnh lớn, giá vẽ chỉ vài chân nhỏ và các tranh treo không hề chạm sàn. `scene.json` cung cấp hình chữ nhật hiển thị của từng lớp, chưa có chân collider thực.

## Deliverable trong PR này

Nhánh: `feature/m1-contact-polygon-review-editor` → PR #9 `feature/spacious-house-weather-botany` (vẫn Draft).

- `src/house-floor-contact-atlas.mjs`
  - `sourceLayerForContact(scene,roomId,layerId)`: xác thực ảnh và tọa độ `scene.json` cho sáu phòng, không dựng lớp giả.
  - `validateContactPolygon(vertices)`: ít nhất ba đỉnh, không vượt 1170×1170, diện tích đủ lớn, không tự giao, không đỉnh trùng liền nhau.
  - `createContactProposal(scene,{roomId,layerId,vertices})`: ghi lại đa giác chân đồ **do người xem vẽ**, trạng thái `VISUAL_APPROVAL_REQUIRED`, `contactVerified:false`, `canPersist:false`.
  - `buildReviewExport(proposals)`: chuyển đề xuất hợp lệ thành JSON để đối chiếu. Không cho dữ liệu được tự tuyên bố `VERIFIED` vào JSON.
  - `requireApprovedContact(input)`: fail-closed kể cả input bị gán `contactVerified:true`.
- `experiments/house-contact-review.html` và `experiments/house-contact-review-ui.mjs`: giao diện lựa chọn sáu phòng, từng lớp furniture sprite dựng từ nguồn ảnh, thêm đỉnh bằng chạm hoặc nhập X/Y, undo, xóa, lưu đề xuất trong RAM và xuất JSON thủ công. Cảnh bao gồm nền + lớp nội thất ở tọa độ nguồn; thứ tự/chiều sâu chưa được duyệt. Khi reload mất mọi đề xuất; không có SDK Firebase hay localStorage.
- `tests/staging/m1-floor-contact-atlas.test.mjs`: polygon lỗi, tự cắt, vượt biên, giả mạo duyệt, metadata layer không tồn tại, bản xuất an toàn.
- `tests/browser/house-contact-review.spec.mjs`: nhập 3 đỉnh cho từng phòng, xuất JSON, 6 ảnh ở 390px, không gọi Firebase, reset/reload và không tràn ngang ở 360/390/430.
- Workflow bắt buộc đủ 6 ảnh `review-artifacts/house-contact/` trong artifact trước khi CI được xem là xanh.

## Quy tắc review

Đây là bộ công cụ **thu thập dữ liệu hình học cần người duyệt**, không tự động xác nhận vùng chạm sàn. Đường viền vẽ bằng mắt có thể sai lệch theo phối cảnh và thứ tự các sprite; chỉ dùng làm ứng viên. Phải đối chiếu ảnh 1170px đã ghép đầy đủ, xác định rõ chân/chân đế vật dụng, mặt sàn, lối cửa, đường đi và ảnh nguồn của từng trạng thái. Kiểm tra riêng trạng thái mở/đóng/đổi chế độ của nội thất và ảnh alpha gốc.

D1 — Làm **sàn phòng rộng thật**: sau khi bản đồ chân đồ được chấp nhận, bố trí lại những nội thất cố định nằm giữa sàn theo lối sát tường, tạo khoảng trống trung tâm, cập nhật đồng bộ mã sinh ảnh, sprites, các trạng thái/hitbox và cảnh nguồn. Không dịch chuyển image box trong CSS làm giả chiều sâu và tránh sửa sprite mà không sửa phần nền. Làm qua PR riêng, chụp trước/sau sáu phòng trên mobile và desktop, yêu cầu review hình ảnh.

## Merge gates

Chỉ merge PR nhỏ này vào nhánh thử nghiệm PR #9 sau khi 3 nhóm test CI và 6 ảnh bằng chứng thành công. Không merge PR #9 vào main; không ghi dữ liệu Firebase production. M0 backup/restore trên staging, kiểm tra deployed Rules/Auth/App Check/IAM và rollback vẫn bắt buộc trước khi dùng chung.
