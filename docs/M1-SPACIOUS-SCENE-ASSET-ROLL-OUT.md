# M1 — Áp dụng bản thiết kế 3D Phòng khách và Bếp vào bản thử

## Xuất phát
- Source pilot PR #60 đã duyệt bằng hai ảnh before/after và được squash-merge vào PR #9 ở `c8d3f8209c449eeb7ca93ea626d0e5c56d4eb341`.
- Đây là PR **đóng gói** toàn bộ asset mới cho hai phòng trong nhánh thử nghiệm `feature/spacious-house-weather-botany`, không thay đổi `main` hay Firebase.
- Đừng chỉnh `scene.json` bằng tay rồi dùng ảnh cũ: chân ghế/nhân vật và sprite cropping sẽ sai.

## Thực thi
1. `scripts/m1-pack-spacious-scenes.py`: đọc dữ liệu từ render nguồn 3D `_xuong-3d/room.js` và `_xuong-3d/rooms2.js`, tải metadata gốc + những ảnh nguyên khung 1170×1170 trong `out_spacious`.
2. Đóng gói **đủ 4 thời gian sáng/ngày/chiều/đêm** cho Phòng khách và Bếp.
3. Cắt lại theo alpha và lưu chính xác tất cả trạng thái tương tác:
   - Phòng khách: 12 lớp, gồm sofa, radio bật/tắt, lọ với các trạng thái, ảnh/bảng/lịch, cửa sổ mưa.
   - Bếp: 6 lớp, gồm tủ lạnh đóng/mở, bếp nấu tắt/nấu, bàn ăn trống/bày món.
4. Cập nhật đồng thời `scene.room` và `scene.rooms.bep` từ metadata render: mọi toạ độ `layers`, các điểm `spots.ghe` mới. Các phòng và phần `scene.json` khác giữ nguyên.
5. Chạy unit, browser và Firebase Emulator trên **những file đã đóng gói mới** trong CI, không phải bản ảnh cũ.
6. GitHub Actions chỉ commit WebP/scene đã kiểm thử vào **nhánh PR đóng gói**; `main` và PR #9 không bị ghi tự động. Bot push bằng `GITHUB_TOKEN` có thể không kích hoạt CI mới, vì vậy cần tạo một commit tài liệu nhỏ để khởi chạy lại CI trên HEAD chứa asset thật.
7. Đọc ảnh so sánh và manifest CI. Chỉ squash-merge PR vào nhánh thử nghiệm PR #9 sau khi CI trên HEAD có binary assets đạt và các tương tác trên điện thoại đạt.

## Cổng an toàn và tiêu chí
- Xác nhận chỉ **Phòng khách và Bếp** thay đổi: tất cả các phòng khác, Khu vườn, dữ liệu và Firestore Rules không thay đổi.
- Thể hiện khoảng sàn ở giữa thoáng hơn nhưng không có vật nổi, chồng tường, cắt mép, hoặc nhân vật ngồi sai ghế. Giữ đủ states, ảnh ngày/đêm, các hotspot tương tác.
- PR không hề bật tính năng đặt nội thất tự do. Bản alpha và floor-contact đã thực hiện vẫn là `UNAPPROVED`; không suy ra vùng sàn trang trí đã duyệt.
- Trước khi cho phép phát hành từ PR #9 lên main: phải hoàn tất M0 staging backup/restore, kiểm tra deployed Rules/Auth/App Check/IAM và rollback cho dữ liệu cặp đôi.
