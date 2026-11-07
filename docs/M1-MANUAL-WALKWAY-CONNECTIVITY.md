# M1 — Kiểm tra kết nối lối đi và cửa vẽ thủ công (chưa nghiệm thu)

Mục tiêu: sau khi sáu phòng được tăng kích thước **thực trong Three.js**, bổ sung bộ kiểm toán kết nối giữa các đa giác do người kiểm tra tự vẽ trên ảnh **1170×1170**. Không được suy ra cửa hoặc chỗ đặt đồ hợp lệ chỉ vì một đoạn đường trên ảnh giao với nhau.

## Thành phần đã triển khai
- `src/house-floor-walkway-connectivity.mjs`: chỉ đọc `buildFloorReviewBundle` và đúng `scene.json` đang được mở; tái kiểm tra dấu hiệu giả mạo, lấy điểm đứng trong `scene.room.dung` hoặc `scene.rooms.<id>.spots.dung` của cả sáu phòng.
- Đánh dấu các vùng `floor`, `walkway`, `doorway`, `fixed_contact` **do người dùng vẽ thủ công**. Tìm những vùng lối đi kề nhau bằng phép giao/tiếp giáp đa giác kể cả đường biên chung; truy ngược những chuỗi lối đi có thể nối tới đa giác cửa được vẽ.
- Mỗi điểm đứng có báo cáo: có nằm trên sàn đề xuất, có thuộc vùng lối đi được vẽ, có chuỗi lối đi tiếp giáp tới cửa *đề xuất*, có thể nằm trong một vùng chân đồ đã chú thích.
- Cảnh báo nếu thiếu lớp vùng, lối đi/cửa ra ngoài sàn, điểm đứng không nối tới cửa vẽ, lối đi chạm chân đồ cố định, chân đồ có phần nằm ngoài sàn đề xuất. Kiểm tra toàn bộ đường viền chân đồ với sàn lõm, **không chỉ đỉnh**.
- `experiments/house-floor-review-ui.mjs`: màn hình kiểm toán hiển thị số điểm đứng có đường kết nối **ứng viên** và các cảnh báo; JSON export bổ sung `manualConnectivity`, giữ nguyên nguồn SHA-256 và provenance ánh sáng hiện có. Chưa lưu localStorage/Firestore.
- Sáu bài kiểm thử staging mới bao gồm cửa/vùng đường giả lập, sàn lõm, rời rạc, giao với chân đồ, dữ liệu giả mạo, sáu phòng thật; Playwright xác minh export và cảnh báo chưa có cửa thực.

## Giới hạn an toàn chưa được vượt qua
1. **Mô hình Three.js hiện không chứa hình học cửa/ngưỡng cửa đã được phê duyệt.** Đa giác `doorway` tự vẽ *chỉ là một chú thích*. Hai cạnh mở của hình isometric không được tự động coi là cửa.
2. Phép tiếp giáp đa giác 2D, kể cả hai vùng chạm ở đúng một điểm, **không chứng minh chiều rộng đường đi đủ cho người hoặc nhân vật**. Không có phép quét capsule, kiểm tra cao độ, kiểm tra vật cản dựng sẵn ẩn, bậc thang, hay tất cả trạng thái nội thất.
3. Các điểm đứng trong `scene.json` chỉ là tọa độ hiển thị/đứng dự kiến, không phải bằng chứng người thật đã đi qua được. Một tuyến có thể kết nối trên ảnh nhưng bị chặn trong không gian 3D thực.
4. Toàn bộ nhãn `UNAPPROVED`, `canPersist:false`, `actualDoorGeometryVerified:false`, `actualWalkwayVerified:false`, `physicalAvatarClearanceVerified:false`. Không mở quyền đặt hoặc lưu đồ. `requireApprovedFloorEvidence` vẫn từ chối.

## Điều kiện cho bước kế tiếp
- Người kiểm tra dựng đủ mặt sàn, chân đồ, ngưỡng cửa thực và hành lang của sáu phòng với đa giác chuẩn xác, kiểm tra tất cả điều kiện nêu trên và ảnh cả bốn thời điểm.
- Sau đó xây hình học cửa thực trong nguồn Three.js, kiểm tra multi-height 4/8/22/45 cm và bản đồ điều hướng với bán kính avatar; xem xét phòng nào còn chật sau khi dời đồ, trước khi cho phép trang trí.
- Cần CI trên final HEAD, kiểm tra 360/390/430/1300 px và hai điện thoại thật. M0 staging backup/restore và Auth/Rules/App Check/IAM vẫn là gate của PR #9 → main.

**Phạm vi nhánh này:** chỉ bổ sung báo cáo, kiểm thử và UI kiểm toán opt-in. Không đụng `assets/3d/*.webp`, dữ liệu Firebase, `main`, hoặc bật sản phẩm trang trí dùng chung.
