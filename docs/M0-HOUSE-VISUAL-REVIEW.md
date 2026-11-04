# M0 — Duyệt trực quan sáu phòng Nhà 3D

**Phạm vi:** chỉ ảnh chụp UI chạy cục bộ với dữ liệu mặc định/giả lập trong CI. Không truy cập hoặc kiểm tra dữ liệu thật của hai người. Ảnh không được commit vào repo.

## Cách lấy ảnh sau khi CI xanh

1. Mở PR #9 > **Checks**, chọn lượt **Garden browser regressions** vừa chạy trên SHA mới nhất.
2. Trong trang **Actions** của lượt chạy, tìm phần **Artifacts** cuối trang, tải `house-six-room-review-<run-id>` (giữ trong 7 ngày).
3. Mở `review-manifest.json`. Thư mục có **13 ảnh PNG**: `00-overview-mobile-390.png`; sáu `room-<id>-390.png` chỉ có sân khấu; sáu `page-<id>-390.png` bao gồm giao diện.
4. Xem lần lượt phòng khách, bếp, phòng Anh, phòng Em, góc sáng tạo, gác kỷ niệm. So sánh phần sàn/trần với khung ảnh vuông sau khi bỏ cắt ảnh 150 px.
5. Ghi rõ mỗi phòng **Đạt / Cần sửa** và lý do: đồ đạc che nhau; trần/sàn trống quá nhiều; vật thể ngoài tầm nhìn; thanh điều hướng khó dùng trên điện thoại; bố cục không đủ không gian để trang trí sau này.
6. Chỉ đóng cổng visual khi đã có người kiểm tra ảnh thực tế và xác nhận; **CI xanh không thay thế nghiệm thu mỹ thuật**.

## Giới hạn

- Ảnh được chụp ở viewport 390×844 với chế độ giảm chuyển động; kiểm thử tương tác 360/390/430 và ảnh nguồn 1170×1170 tiếp tục chạy riêng.
- Lượt CI chỉ chụp các phòng hiển thị bằng tài nguyên local; không chụp màn hình Firebase Console hoặc nội dung riêng tư.
- Kết quả `AUTOMATED_CAPTURE_NOT_VISUAL_SIGNOFF` trong manifest là cảnh báo có chủ đích.
- Nếu thiếu artifact hoặc ảnh không tải, coi cổng nghiệm thu **chưa đạt**, kiểm tra workflow và chạy lại trên mã mới.
- PR #9 vẫn Draft cho đến khi kiểm tra ảnh và xác minh Rules/backup staging. Không dùng screenshot làm bằng chứng đã khôi phục Cloud Firestore.
