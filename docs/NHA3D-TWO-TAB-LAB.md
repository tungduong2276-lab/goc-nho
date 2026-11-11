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


## Báo lỗi thực tế và bản khắc phục V2.2 — 2026-11-11

- **Operator report:** sau khi deploy Preview Channel 16 tệp (CLI thành công), nghiệm thu chế độ hai tab báo **0/6 đạt; chưa kết nối được hai tab**. Sáu mục được đánh dấu chưa đạt/chưa thử, vì vậy **không** suy diễn rằng cả sáu chức năng cùng lỗi độc lập; trở ngại đầu tiên là thiết lập kết nối. Bản trước đó **KHÔNG ĐẠT** nghiệm thu thủ công.
- **Giới hạn điều tra:** chưa có ảnh/DevTools/network log từ trình duyệt người dùng; chưa xác minh nguyên nhân gốc. Các giả thuyết phải kiểm chứng: URL thiếu `?lab=two-tabs` ở một tab, khác Chrome profile/ẩn danh/khác origin hoặc storage partition; cache JS cũ; tab nền bị throttling; UI báo bật kênh mà không xác nhận có peer.
- **Fixes implemented (code, không tự nhận deployed):**
  1. Hộp **Bản sửa V2.2** có trạng thái minh bạch: chưa bật / đang tìm peer / đã kết nối cùng phòng / đã kết nối ở phòng khác / API không khả dụng; các bộ đếm số tín hiệu gửi/nhận/bỏ qua. `#lab-help` hiện trên HTML ngay cả khi module JS tải lỗi và đưa ra nhắc kiểm tra sau 30s.
  2. Link **Mở tab thứ hai trong Chrome này** tự bật kết nối ở tab gốc (user click) và mở tab mới trên **chính cùng origin/profile** qua `?join=1`; tab mới chỉ tự kết nối khi user khởi tạo từ link đó. Vẫn có nút bật/tắt thủ công.
  3. Heartbeat của `BroadcastChannel` được tách khỏi `requestAnimationFrame` bằng interval và xử lý `hello` trực tiếp trong event. Do browser throttling ở nền, điều này cải thiện khả năng giữ phiên nhưng không bảo đảm tab đã bị OS sleep sẽ duy trì realtime.
  4. Versioned HTML URL và asset imports `rev=20261111b` nhằm tránh dùng JS cache cũ sau deploy. Gói staging vẫn **16 file** và không có Firebase.
  5. Browser tests cover manual pairing, one-click new-tab pairing/diagnostic text, isolated Chrome profiles DO NOT sync, mobile widths, and no Firebase network in existing suite. **CI trên head cuối phải được kiểm tra lại.**
- **Hướng dẫn nghiệm thu phiên bản V2.2:** sau khi CI và deploy mới thật sự hoàn thành, dùng **một cửa sổ Chrome thường** (không ẩn danh) mở đường dẫn `/nha3d/multiroom-preview.html?lab=two-tabs&rev=20261111b`, xác nhận nhìn thấy chữ **Bản sửa V2.2**, nhấn **Mở tab thứ hai trong Chrome này** tại trang này, không tự mở URL khác; quan sát hai panel từ `🟠 đang tìm` sang `🟢 đã kết nối`. Nếu không xanh, chụp *hai panel* kèm bộ đếm gửi/nhận để chẩn đoán; không yêu cầu ghi nhật ký chứa dữ liệu thật.
- Chỉ thử với cùng Chrome profile, top-level origin/partition. Theo tài liệu chuẩn web, `BroadcastChannel` **không hoạt động giữa hai điện thoại, các profile khác nhau hoặc hai partition khác nhau**. Không bật vận chuyển Firebase nếu M0 chưa được xác nhận.
