# Khu vườn — kiểm thử trước khi merge

## Phạm vi và nhánh sửa lỗi

Các thay đổi được thực hiện trực tiếp trên nhánh `feature/garden-interactions` của PR #3. Phạm vi lần này xử lý các lỗi được phát hiện khi chạy Chromium thật:

- Tránh lỗi temporal dead zone của `$` làm dừng toàn bộ script khi tải trang.
- Khôi phục nút **Tưới cây** trong thẻ chăm cây bên dưới cảnh.
- Chỉ dùng bộ phân giải tọa độ cho thao tác chuột/chạm; Enter/Space phải kích hoạt đúng nút đang focus.
- Chỉ so sánh những vùng hit thực sự chứa điểm chạm, không chọn nhầm vật thể ở xa.
- Mở rộng vùng hit xích đu quanh vị trí ghế thực trong `assets/3d/scene.json`.
- Ưu tiên vùng chạm chậu chăm cây hơn hộp hạt giống khi hai vùng giao nhau; mở rộng vùng chạm vào thân chậu.

## An toàn dữ liệu

- Không chạy thao tác ghi trên tài khoản Firebase đang chứa dữ liệu thật của hai người.
- Bộ kiểm thử trình duyệt chạy ở chế độ local-only: server kiểm thử bỏ qua lời gọi khởi tạo Firebase, chặn tải Firebase SDK từ CDN và không đăng nhập tài khoản.
- Không xóa collection, tài liệu, tài khoản, hoặc thay đổi Security Rules.
- Không deploy production. Không merge cho tới khi hoàn tất kiểm thử và được chủ dự án chấp thuận.

## Kiểm thử tự động

Cài dependencies và Chromium:

```sh
npm install
npx playwright install chromium
npm test
```

`npm test` chạy hai lớp:

1. `npm run test:static` — kiểm tra cú pháp JavaScript nội tuyến và các điều kiện hồi quy quan trọng. Phần này không giả lập hình học hay sự kiện trình duyệt.
2. `npm run test:browser` — Playwright chạy Chromium trên ứng dụng thực với viewport 390 × 844 CSS px; riêng kiểm thử nhân vật và bảng gỗ lặp lại ở 360px, kiểm tra:
   - Trang khởi động và không phát sinh `pageerror`.
   - Thẻ chăm cây có nút **Tưới cây** hoạt động.
   - Chạm vào vùng bảng gỗ mở đúng bộ sưu tập.
   - Chạm tâm ghế xích đu kích hoạt xích đu.
   - Chạm vào thân nhân vật gửi đúng một cái ôm ở viewport 390px và 360px.
   - Chạm lưới 9 điểm trên bảng gỗ ở cả hai viewport vẫn mở đúng gallery, không bị bình tưới chiếm sự kiện.
   - Nhấn Enter trên nút bảng gỗ kích hoạt chính nút đó, không bị chuyển thành xích đu.
   - Chạm vào vùng giao nhau giữa chậu lớn và hộp hạt giống tại 390px và 360px phải tưới cây, không mở hộp hạt giống.

Server kiểm thử chỉ thay đổi nội dung HTML trong bộ nhớ khi phục vụ `index.html`, bỏ qua `cloudInit();initDb();`. File production không bị sửa bởi bước này. Workflow GitHub Actions `.github/workflows/garden-browser.yml` cài Chromium và chạy `npm test` cho các thay đổi liên quan.

## Kiểm thử hai điện thoại (Firebase staging)

Dùng hai điện thoại thật, tốt nhất một iPhone Safari và một Android Chrome; kết nối hai mạng khác nhau nếu có thể. Chỉ dùng Firebase project thử nghiệm riêng với hai tài khoản thử nghiệm khác nhau.

| ID | Thiết bị A | Thiết bị B | Kết quả mong đợi |
|---|---|---|---|
| DUAL-01 | Đăng nhập tài khoản thử nghiệm A, chọn đúng danh tính | Đăng nhập tài khoản thử nghiệm B, chọn danh tính còn lại | Hai người thấy trạng thái hiện diện của nhau khi trực tuyến |
| DUAL-02 | Mở Khu vườn lần đầu | Mở Khu vườn lần đầu | Hướng dẫn ở dạng một dòng thu gọn; có thể mở ra ở từng thiết bị |
| DUAL-03 | Chạm bình tưới / chậu lớn | Quan sát cây và trạng thái tưới | A nhận phản hồi; B nhận cập nhật realtime; không thể tưới lần hai cùng ngày |
| DUAL-04 | Chạm xích đu để ngồi | Quan sát, sau đó chạm xích đu | Trạng thái ngồi cập nhật; hai nhân vật ngồi cạnh nhau; đứng dậy được |
| DUAL-05 | Chạm một trong hai nhân vật | Quan sát hộp thoại TAPS | B nhận đúng một thông điệp ôm; không gửi trùng |
| DUAL-06 | Chạm tâm luống mùa 1 và mùa 2 | Quan sát phần mùa bên dưới | Mỗi lần mở đúng mùa tương ứng, không kích hoạt tưới cây hoặc mùa kế bên |
| DUAL-07 | Chạm bảng gỗ, sau đó kệ chậu | Quan sát gallery và chậu | Bảng mở gallery mùa; kệ chỉ trưng chậu chăm hằng ngày, không mở gallery mùa |
| DUAL-08 | Thực hiện một thao tác ghi trên staging khi mạng ổn định | Quan sát trạng thái đồng bộ | Hiện đang lưu, sau xác nhận trở về đã lưu/đồng bộ; heartbeat chỉ ghi hiện diện khoảng 110 giây một lần khi cần |
| DUAL-09 | Ngắt mạng A, thực hiện một thao tác ghi thử trên staging, rồi nối mạng lại | Quan sát trạng thái của cả hai | Không tự retry chỉ vì có mạng trở lại; người dùng chủ động chạm trạng thái đồng bộ. Khi retry `meta/main`, thao tác phải đọc tài liệu mới nhất trong transaction và chỉ áp dụng các trường thực sự thay đổi; dữ liệu mới của B không bị mất |
| DUAL-10 | Chạm các mục ở cạnh nhau trên màn hình 360 CSS px trở lên | Lặp lại trên B | Chọn đúng vật thể dưới ngón tay; không có vùng chạm chồng lấn gây kích hoạt nhầm |

## Tiêu chí chấp nhận

- Tất cả kiểm thử static và Chromium đều PASS trên GitHub Actions.
- Không có thao tác gallery hoặc hướng dẫn nào ghi lên Firestore.
- Không có thay đổi schema, collection, document ID, hoặc Security Rules.
- Các thao tác ghi hiển thị trạng thái đang chờ / lỗi thay vì luôn báo đồng bộ thành công.
- Retry `meta/main` dùng transaction đọc dữ liệu mới nhất, hợp nhất patch thay đổi; mảng `custom` được hợp nhất để không làm mất trò mới từ thiết bị kia. Các mục hồ sơ không thay đổi trong lần thao tác không bị ghi đè.
- Khi có mạng trở lại, ứng dụng không tự retry các ghi thất bại; người dùng chủ động bấm trạng thái đồng bộ.
- Hai điện thoại nhận được thay đổi qua snapshot realtime và không tạo bản ghi trùng khi thao tác tưới cùng ngày.
- Các kịch bản DUAL-01…DUAL-10 được thực hiện bằng Firebase staging, không dùng production.

## Trạng thái rà soát

- GitHub Actions run #18 trên `ubuntu-24.04`: `npm test` PASS; static checks PASS và Playwright Chromium **7/7 PASS** (head trước các sửa đổi mới).
- Các sửa đổi mới về transaction, vùng chạm chậu và cache đang chờ CI xác nhận trên head mới.
- Bộ kiểm thử trình duyệt không kết nối Firebase và không thể thay thế kiểm thử iOS Safari / Android Chrome trên thiết bị thật.
- Chưa thực hiện DUAL-01…DUAL-10 trên hai điện thoại và Firebase staging. Chưa coi PR là sẵn sàng merge.
