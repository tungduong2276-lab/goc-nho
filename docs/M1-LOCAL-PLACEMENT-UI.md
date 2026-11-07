# M1 — Giao diện xem trước đặt nội thất, hoàn toàn cục bộ

Trang thử độc lập: `/experiments/house-placement.html`, chỉ tải khi truy cập đường dẫn trực tiếp và người xem bấm **Bắt đầu thử**. Không có liên kết từ app đang dùng, không kích hoạt trên production UI.

- Dựa trên `src/house-placement-preview.mjs` đã có trên PR #9; sáu phòng, mỗi phòng hai vị trí ứng viên, bốn kiểu vật dụng tượng trưng.
- Cho chọn phòng, chọn điểm, đặt/chuyển/xoay/cất đồ, hoàn tác và xóa nháp. Ảnh nền dùng tài nguyên 3D hiện có, không sửa asset hay sơ đồ.
- Không khởi tạo Firebase, không import SDK, không dùng localStorage, service worker hay IndexedDB. CSP chỉ cho phép tải tài nguyên cùng nguồn, `connect-src 'self'`; trạng thái biến mất sau khi tải lại.
- **Chưa xác nhận vị trí hợp lệ:** các điểm đến từ metadata đứng của nhân vật; icon 2D minh họa có thể chồng lên vật thể prerender. Không kết luận đã kiểm soát va chạm hay là tính năng 3D thật.
- Browser test kiểm tra bật mặc định tắt, ảnh sáu phòng trên 360/390/430 px, thao tác, reset, reload và không phát sinh request Firebase.

## Chặn phát hành
Chưa nghiệm thu trực quan sáu phòng, xác nhận sàn trống/vị trí đồ, thực hiện staging export/restore thật hay kiểm toán deployed Rules/Auth/App Check/IAM. Không merge PR #9 vào main hoặc nối luồng ghi Firebase dựa riêng trên thử nghiệm này.

## Review ảnh thực tế 390px từ CI #41953137827

Đã xem bộ 13 ảnh (sáu ảnh room, sáu ảnh mobile page và ảnh tổng quan). Đối chiếu trực tiếp 12 điểm ứng viên trong `scene.json` với nền phòng, không đánh đồng kiểm tra tọa độ trong biên với vùng trống thực sự:

| Phòng | Đánh giá hình ảnh của hai điểm hiện có |
|---|---|
| Phòng khách | Điểm 1 gần nhân vật và bàn trà; điểm 2 gần nhân vật còn lại/thảm. Không đạt duyệt chỗ đặt đồ. |
| Bếp | Điểm 1 trùng nhân vật đứng; điểm 2 ở sàn nhưng chưa xác minh khoảng cách với bàn ăn. |
| Phòng Anh | Điểm 1 trùng nhân vật; điểm 2 rất gần điểm 1 (khoảng 35px trên stage 390px). |
| Phòng Em | Hai điểm gần nhau khoảng 27px trên stage 390px, một điểm chồng nhân vật. Đây là nguyên nhân lỗi pointer hitbox được CI chứng minh. |
| Góc sáng tạo | Điểm 1 trùng nhân vật ở giá vẽ; điểm 2 gần vùng thảm và bàn. |
| Gác kỷ niệm | Điểm 1 trùng nhân vật; điểm 2 sát đồ trang trí giữa phòng. |

**Phương án tạm thời:** giữ nguyên tọa độ để không ngụy tạo vùng sàn được duyệt; render đánh dấu đúng trên ảnh nhưng chuyển tương tác sang hai nút chọn độc lập ngoài ảnh, không tạo hitbox chồng lấn. Cần thiết kế footprint nội thất / polygon vùng sàn và duyệt từng phòng trước khi có tính năng shared placement.

CI run đầu tiên #41953137827: 35/35 staging đạt, 25/26 browser đạt; lỗi thực là hai nút marker trong Phòng Em chồng vùng click, không phải lỗi Firebase. Các commit sửa UI và test tiếp theo cần CI xanh trên HEAD trước khi merge nhánh thử nghiệm.
