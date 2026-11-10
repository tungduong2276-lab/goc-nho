# Nhà 3D — Laboratory: đồng hiện diện giữa hai tab (không phải multiplayer)

> Phạm vi: PR #97 Draft, một nhánh staging-only. Đây là **proof of concept** để kiểm tra hợp đồng vị trí 2 client, **không** phải kết nối hai điện thoại và **không** có xác thực người dùng.

## Cách thử sau khi CI và staging deployment thành công

1. Mở trang `/nha3d/multiroom-preview.html?lab=two-tabs` trên **hai tab trong cùng một trình duyệt/profile**, cùng origin.
2. Nhấn **Kết nối hai tab** trên **cả hai tab**. Các tab sẽ bắt tay qua `BroadcastChannel`.
3. Khi ở cùng phòng, mỗi tab nhìn thấy nhân vật màu xanh đại diện cho tab kia. Dùng nút cửa để đưa một tab sang bếp/phòng ngủ: nhân vật ở tab thứ nhất phải biến mất khi khác phòng, và xuất hiện lại khi gặp nhau.
4. Nhấn **Ngắt kết nối tab** trên một tab: nhân vật ở tab còn lại biến mất. Bật lại để kết nối lại. Kiểm tra 360/390/430 px.
5. Đóng tab hoặc tải lại: nếu không nhận `bye`, peer tự hết hạn sau 8 giây. Không lưu phiên, không cố khôi phục dữ liệu cũ.

**Cần phân biệt:** `/nha3d/multiroom-preview.html` không có query giữ nguyên **bạn mô phỏng** đã được nghiệm thu. URL có `?lab=two-tabs` chuyển sang lab riêng; các nút gọi nhân vật mô phỏng/chạm tay cục bộ không hiện ở lab này.

## Kỹ thuật và bảo mật

- `nha3d/presence-lab.mjs`: hợp đồng thông điệp `v/type/id/seq/at/room/cell`, chỉ chấp nhận ô đi được thuộc một trong ba phòng; chặn seq lùi, gói quá hạn, tự echo và peer thứ ba khi peer đầu còn sống.
- `nha3d/two-tab-lab-browser.mjs`: adapter `BroadcastChannel`, ID tab ngẫu nhiên, bắt tay, gửi vị trí ô với giới hạn tần suất và heartbeat, xử lý disconnect và timeout.
- Không Firebase SDK, Firestore, Realtime Database, WebSocket, tài khoản thật, tracking, cookies hay `localStorage`. Không truy cập project production hoặc ghi bất kỳ dữ liệu khách hàng nào.
- **Không dùng ID tab làm định danh/tư cách thành viên thật.** Một tab khác cùng origin có thể giả mạo gói tin; đây là kênh browser không tin cậy. Validation chỉ có ý nghĩa chống lỗi UI, **không** thay thế Authentication, Firestore Security Rules hoặc server-authoritative room validation.
- Chỉ hiển thị coarse room+grid-cell; không truyền nội dung ghi chú, đồ vật, thông tin riêng hoặc tên người dùng.
- Preview không có cơ chế đồng bộ giữa browser profiles khác nhau hoặc điện thoại khác nhau. Không được quảng bá đây là live pair mode.

## Gates trước khi nâng lên 2 điện thoại thật

- Hoàn tất M0: **managed Cloud Firestore export/restore** trên hai project không-production tách biệt; kiểm tra deployed Rules/Auth/App Check/IAM/rollback; staging test accounts không dùng dữ liệu của hai người thật.
- Thiết kế và kiểm thử authorized presence channel: chỉ hai UID thành viên của đúng shared space đọc/ghi; ACL qua Rules, giới hạn tốc độ/TTL, reconnect, collision; không thể impersonate UID phía client.
- Emulator tests cho Alice/Bob/Eve, stale sequence, revocation, offline/reconnect, cửa phòng bị chặn; web two-client tests và UX điện thoại thực tế.
- Chỉ khi các gate này có bằng chứng mới xét bật Firestore transport ở staging; không merge PR #97 hoặc thay đổi production trước đó.

## Trạng thái nghiệm thu

- **Trước thay đổi này**, user báo **6/6** hạng mục nhân vật đồng hành mô phỏng trên staging đạt vào 2026-11-10, không ghi nhận lỗi. Kết quả đó không áp dụng tự động cho tính năng hai tab vừa thêm.
- Code lab và tests mới phải qua CI trên **head chính xác**, review artifact rồi mới được người dùng deploy lại trên Hosting Preview Channel `nha3d-review`; phải ghi lại URL, expiry và số tệp thực tế. **Không tự coi commit là deployed.**
