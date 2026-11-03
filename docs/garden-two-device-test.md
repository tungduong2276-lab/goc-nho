# Khu vườn — kiểm thử trước khi merge

## Phạm vi

Các thay đổi giao diện Khu vườn trong nhánh `feature/garden-interactions`. Bộ kiểm tra tự động hiện có kiểm thử hành vi của hàm chọn mục tiêu gần nhất bằng tọa độ lấy từ cấu hình cảnh thật, tính kích thước vùng chạm ở viewport 390px, kiểm tra đường dẫn ảnh hoa 3D, và xác nhận các luồng lưu hiện hữu. Đây vẫn chưa phải kiểm thử trình duyệt trên thiết bị thật.

## An toàn dữ liệu

- Không chạy thử thao tác ghi trên tài khoản Firebase đang chứa dữ liệu thật của hai người.
- Tạo Firebase project / couple thử nghiệm riêng, đăng nhập hai tài khoản thử nghiệm khác nhau trên hai điện thoại.
- Không xóa collection, tài liệu, tài khoản, hoặc thay đổi Security Rules trong quá trình kiểm thử.
- Không deploy production từ nhánh này. Không merge cho tới khi hoàn tất kiểm thử và được chủ dự án chấp thuận.

## Kiểm tra tự động

Chạy tại thư mục gốc repository:

```sh
node scripts/check-garden.mjs
```

Bài test gọi trực tiếp hàm `nearestGardenHit` lấy từ mã ứng dụng và xác nhận:
- Tâm luống mùa 1 chọn đúng mùa 1, không chọn cây chăm hằng ngày.
- Tâm luống mùa 2 chọn đúng mùa 2, không chọn mùa 3.
- Tâm hộp hạt giống chọn hộp hạt giống, không chọn xích đu.
- Tâm xích đu và bình tưới chọn đúng vật thể.
- Các vùng chạm hoa, chậu chăm hằng ngày, bình tưới, hộp hạt, xích đu, kệ và bảng đạt tối thiểu 44 × 44 CSS px ở viewport 390px theo cấu hình và tỷ lệ CSS.
- Hướng dẫn thu gọn, gallery mùa mở từ bảng/luống và dùng ảnh hoa 3D có sẵn; kệ chậu không mở gallery mùa.
- Heartbeat hiện diện không tham gia trạng thái lưu; lỗi ghi có đường dẫn thử lại.
- Cú pháp JavaScript nội tuyến hợp lệ và đường dẫn Firestore giữ nguyên.

Lưu ý: test tọa độ xác nhận logic phân giải điểm chạm theo mô hình hình học, không giả lập hoàn toàn event dispatch / stacking context / trình duyệt.

## Kiểm thử hai điện thoại (staging)

Dùng hai điện thoại thật, tốt nhất một iPhone Safari và một Android Chrome; kết nối hai mạng khác nhau nếu có thể.

| ID | Thiết bị A | Thiết bị B | Kết quả mong đợi |
|---|---|---|---|
| DUAL-01 | Đăng nhập tài khoản thử nghiệm A, chọn đúng danh tính | Đăng nhập tài khoản thử nghiệm B, chọn danh tính còn lại | Hai người thấy trạng thái hiện diện của nhau khi trực tuyến |
| DUAL-02 | Mở Khu vườn lần đầu | Mở Khu vườn lần đầu | Hướng dẫn ở dạng một dòng thu gọn; có thể mở ra ở từng thiết bị |
| DUAL-03 | Chạm bình tưới / chậu lớn | Quan sát cây và trạng thái tưới | A nhận phản hồi; B nhận cập nhật realtime; không thể tưới lần hai cùng ngày |
| DUAL-04 | Chạm xích đu để ngồi | Quan sát, sau đó chạm xích đu | Trạng thái ngồi cập nhật; hai nhân vật ngồi cạnh nhau; đứng dậy được |
| DUAL-05 | Chạm một trong hai nhân vật | Quan sát hộp thoại TAPS | B nhận đúng một thông điệp ôm; không gửi trùng |
| DUAL-06 | Chạm tâm luống mùa 1 và mùa 2 | Quan sát phần mùa bên dưới | Mỗi lần mở đúng mùa tương ứng, không kích hoạt tưới cây hoặc mùa kế bên |
| DUAL-07 | Chạm bảng gỗ, sau đó kệ chậu | Quan sát gallery và chậu | Bảng mở gallery mùa; kệ chỉ trưng chậu chăm hằng ngày, không mở gallery mùa |
| DUAL-08 | Thực hiện một thao tác ghi trên staging khi mạng ổn định | Quan sát trạng thái đồng bộ | Hiện đang lưu, sau xác nhận trở về đã lưu/đồng bộ; heartbeat 15 giây không làm nhấp nháy |
| DUAL-09 | Ngắt mạng A, thực hiện thao tác ghi thử trên staging, rồi nối mạng lại | Quan sát trạng thái của cả hai | Không báo đã lưu trước khi Firebase xác nhận; lỗi có thể chạm để thử lại; xác minh dữ liệu cuối cùng trên Firestore |
| DUAL-10 | Chạm các mục ở cạnh nhau trên màn hình 360–390 CSS px | Lặp lại trên B | Chọn mục gần tâm ngón chạm nhất; không có vùng chạm chồng lấn gây kích hoạt nhầm |

## Tiêu chí chấp nhận

- Tất cả các bài kiểm tra tự động ở trên đều PASS.
- Không có thao tác gallery hoặc hướng dẫn nào ghi lên Firestore.
- Không có thay đổi schema, collection, document ID, hoặc Security Rules.
- Các thao tác ghi hiển thị trạng thái đang chờ / lỗi thay vì luôn báo đồng bộ thành công.
- Hai điện thoại nhận được thay đổi qua snapshot realtime và không tạo bản ghi trùng khi thao tác tưới cùng ngày.
- Các kịch bản DUAL-01…DUAL-10 được thực hiện bằng Firebase staging, không dùng production.

## Trạng thái rà soát

- Đã phân tích cú pháp JavaScript nội tuyến bằng V8.
- Đã kiểm thử hàm chọn mục tiêu gần nhất với các tọa độ thực trong `scene.json`, gồm các trường hợp người dùng báo lỗi.
- Đã tính kích thước vùng chạm theo kích thước cấu hình và tỷ lệ viewport 390px.
- Chưa chạy trình duyệt thật trên iOS/Android và chưa có hai thiết bị Firebase staging để xác nhận DUAL-01…DUAL-10. Chưa coi PR là sẵn sàng merge.
