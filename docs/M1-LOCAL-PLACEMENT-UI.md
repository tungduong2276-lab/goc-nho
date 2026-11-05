# M1 — Giao diện xem trước đặt nội thất, hoàn toàn cục bộ

Trang thử độc lập: `/experiments/house-placement.html`, chỉ tải khi truy cập đường dẫn trực tiếp và người xem bấm **Bắt đầu thử**. Không có liên kết từ app đang dùng, không kích hoạt trên production UI.

- Dựa trên `src/house-placement-preview.mjs` đã có trên PR #9; sáu phòng, mỗi phòng hai vị trí ứng viên, bốn kiểu vật dụng tượng trưng.
- Cho chọn phòng, chọn điểm, đặt/chuyển/xoay/cất đồ, hoàn tác và xóa nháp. Ảnh nền dùng tài nguyên 3D hiện có, không sửa asset hay sơ đồ.
- Không khởi tạo Firebase, không import SDK, không dùng localStorage, service worker hay IndexedDB. CSP chỉ cho phép tải tài nguyên cùng nguồn, `connect-src 'self'`; trạng thái biến mất sau khi tải lại.
- **Chưa xác nhận vị trí hợp lệ:** các điểm đến từ metadata đứng của nhân vật; icon 2D minh họa có thể chồng lên vật thể prerender. Không kết luận đã kiểm soát va chạm hay là tính năng 3D thật.
- Browser test kiểm tra bật mặc định tắt, ảnh sáu phòng trên 360/390/430 px, thao tác, reset, reload và không phát sinh request Firebase.

## Chặn phát hành
Chưa nghiệm thu trực quan sáu phòng, xác nhận sàn trống/vị trí đồ, thực hiện staging export/restore thật hay kiểm toán deployed Rules/Auth/App Check/IAM. Không merge PR #9 vào main hoặc nối luồng ghi Firebase dựa riêng trên thử nghiệm này.
