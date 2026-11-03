# Khu vườn — kiểm thử trước khi merge

## Phạm vi

Các thay đổi giao diện Khu vườn trong nhánh `feature/garden-interactions`. Bộ kiểm tra tự động chỉ xác nhận cú pháp JavaScript nội tuyến và các điểm nối quan trọng; nó **không thay thế kiểm thử trình duyệt hoặc kiểm thử đồng bộ Firebase giữa hai thiết bị**.

## An toàn dữ liệu

- Không chạy thử thao tác ghi trên tài khoản Firebase đang chứa dữ liệu thật của hai người.
- Tạo Firebase project / couple thử nghiệm riêng, đăng nhập hai tài khoản thử nghiệm khác nhau trên hai điện thoại.
- Không xóa collection, tài liệu, tài khoản, hoặc thay đổi Security Rules trong quá trình kiểm thử.
- Không deploy production từ nhánh này. Không dùng nút Merge cho tới khi hoàn tất kiểm thử và được chủ dự án chấp thuận.

## Kiểm tra tự động

Chạy tại thư mục gốc repository:

```sh
node scripts/check-garden.mjs
```

Kỳ vọng: tất cả mục PASS, bao gồm cú pháp JavaScript nội tuyến, hit-target, hướng dẫn, gallery, luồng TAPS hiện có, trạng thái xích đu và đường dẫn Firestore hiện hữu.

## Kiểm thử hai điện thoại (staging)

Dùng hai điện thoại thật, tốt nhất một iPhone Safari và một Android Chrome; kết nối hai mạng khác nhau nếu có thể.

| ID | Thiết bị A | Thiết bị B | Kết quả mong đợi |
|---|---|---|---|
| DUAL-01 | Đăng nhập tài khoản thử nghiệm A, chọn đúng danh tính | Đăng nhập tài khoản thử nghiệm B, chọn danh tính còn lại | Hai người thấy trạng thái hiện diện của nhau khi trực tuyến |
| DUAL-02 | Mở Khu vườn lần đầu | Mở Khu vườn lần đầu | Hướng dẫn hiện; đóng hướng dẫn ở A không tự đóng ở B |
| DUAL-03 | Chạm bình tưới / chậu lớn | Quan sát cây và trạng thái tưới | A nhận phản hồi; B nhận cập nhật realtime; không thể tưới lần hai cùng ngày |
| DUAL-04 | Chạm xích đu để ngồi | Quan sát, sau đó chạm xích đu | Trạng thái ngồi cập nhật; hai nhân vật ngồi cạnh nhau; đứng dậy được |
| DUAL-05 | Chạm một trong hai nhân vật | Quan sát hộp thoại TAPS | B nhận đúng thông điệp ôm; thông điệp được đánh dấu đã xem sau khi nhận |
| DUAL-06 | Chạm một bông hoa trên luống | Quan sát phần mùa bên dưới | Mở đúng mùa tương ứng, không thay đổi dữ liệu |
| DUAL-07 | Chạm kệ hoa | Duyệt gallery và mở một mùa | Hiển thị các mùa đã hoàn thành; gallery không tạo/ghi tài liệu |
| DUAL-08 | Thực hiện một thao tác ghi trên staging khi mạng ổn định | Quan sát trạng thái đồng bộ | Hiện đang lưu, sau xác nhận trở về đã lưu/đồng bộ |
| DUAL-09 | Ngắt mạng A, thực hiện thao tác ghi thử trên staging, rồi nối mạng lại | Quan sát trạng thái của cả hai | Không báo đã lưu trước khi Firebase xác nhận; lỗi/kết nối lại được thể hiện rõ; xác minh dữ liệu cuối cùng trên Firestore |
| DUAL-10 | Chạm các mục ở cạnh nhau trên màn hình 360–390 CSS px | Lặp lại trên B | Không cần chạm chính xác vào pixel của hình; không có vùng chạm chồng lấn gây kích hoạt nhầm |

## Tiêu chí chấp nhận

- Vùng chạm các vật thể nhỏ đạt khoảng 44 × 44 CSS px trở lên trên viewport điện thoại thông dụng; xác nhận bằng thiết bị thật, không chỉ dựa vào kích thước thiết kế 1170 px.
- Không có thao tác gallery hoặc hướng dẫn nào ghi lên Firestore.
- Không có thay đổi schema, collection, document ID, hoặc Security Rules.
- Các thao tác ghi hiển thị trạng thái đang chờ / lỗi thay vì luôn báo đồng bộ thành công.
- Hai điện thoại nhận được thay đổi qua snapshot realtime và không tạo bản ghi trùng khi thao tác tưới cùng ngày.

## Trạng thái lần rà soát mã nguồn

- Đã kiểm tra cú pháp JavaScript nội tuyến bằng bộ phân tích JavaScript V8 sau khi chỉnh sửa.
- Chưa chạy trình duyệt thật trên iOS/Android và chưa có hai thiết bị Firebase staging để xác nhận DUAL-01…DUAL-10. Các mục này vẫn cần thực hiện trước khi merge.
