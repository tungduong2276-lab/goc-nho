# M1 — Sáu lối đi tham chiếu, kiểm toán cửa và biên sàn (1170px)

## Kết quả dựa trên mã nguồn

- `scene.json` có tọa độ đứng nhân vật `room.dung` hoặc `rooms[...].spots.dung` cho đúng sáu phòng hiện tại; tọa độ nguồn 1170×1170.
- Không có thông tin đáng tin cậy về đa giác sàn đi lại, tọa độ ngưỡng cửa, hình học va chạm 3D của tường và nội thất cố định ở định dạng đang dùng.
- `src/house-walkway-audit.mjs` lập một **đoạn nối hai điểm đứng**, bán kính quét 32px nguồn, và kiểm tra có giao/tới sát 12 hình bao vật cản **ước lượng chưa duyệt** trong `src/house-obstacle-atlas.mjs` không.
- Đoạn nối **không** phải đường đi thật, pathfinding, navmesh hay quy hoạch doorway. Các tầng dữ liệu độc lập: `path` (scene-derived), `blockingIds` (approximate 2D artwork), `doorway:null`, `floorPolygon:null`, `status:UNVERIFIED` và `canPersist:false`.
- Đường Bếp cắt hình bao bàn ăn ước lượng và bị báo `BLOCKED_BY_UNAPPROVED_ESTIMATE`; các phòng còn lại được tính bằng cùng phép kiểm tra, không mặc định thông thoáng chỉ vì hai điểm có tọa độ hợp lệ.

## Trực quan và kiểm thử

Trang duyệt nội bộ `/experiments/house-placement.html` hiển thị dải đường nối màu xanh lam nếu **chưa phát hiện** vật cản theo hình bao hiện có, cam nếu **phát hiện giao**, cùng chấm hai đầu. Vùng xanh là ô sàn đặt đồ được đề xuất, vùng đỏ là hình bao vật dụng chưa duyệt. Mọi phần hiển thị đều được gắn `aria-hidden`, `pointer-events:none`; không cản thao tác người dùng và không được tích hợp vào app chính.

`tests/staging/m1-walkway-audit.test.mjs` kiểm tra nguồn dữ liệu từng phòng, đường xuyên/tiếp xúc/cận biên đa giác, từ chối metadata lỗi và từ chối cả các báo cáo giả mạo trạng thái đã duyệt. Bài browser review tạo sáu ảnh mới và manifest có `doorwayStatus:UNTRACED`, `floorStatus:UNTRACED`. Chỉ đánh giá tích hợp khi CI thực sự xanh.

## Công việc cần kiểm tra thực tế tiếp

1. Rà bản ảnh gốc **có đầy đủ các lớp composited** của từng phòng, không chỉ backdrop. Chụp kết quả giao diện thực và ảnh lớp mặt nạ đặt cạnh nhau.
2. Vẽ đa giác đường viền sàn, tường, ngưỡng cửa, khoảng hở tối thiểu và các đường đi cần giữ cho nhân vật; ghi ảnh đối chứng/phiên bản tài nguyên; kiểm tra từng đồ vật và bản quay 90°.
3. Đánh dấu riêng vị trí không rõ là **UNTRACED**, không được thay `null` bằng tọa độ phỏng đoán để vượt kiểm thử.
4. Chỉ sau khi review độc lập hình học, trải nghiệm trên điện thoại và các cổng M0 (managed export/restore sang staging riêng, deployed Rules/Auth/App Check/IAM, rollback), mới được đề xuất đồng bộ nội thất cho hai người.

**Quy tắc an toàn:** CI xanh ở bước này không đồng nghĩa đã xác nhận hành lang thông suốt, cửa đúng vị trí hoặc được phép ghi vào Firebase. Không đụng dữ liệu thật, không mở tính năng trên `index.html`, PR #9 vẫn Draft.
