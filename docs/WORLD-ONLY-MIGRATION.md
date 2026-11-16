# Góc Nhỏ: một thế giới 3D, giữ nguyên dữ liệu

Quyết định người dùng ngày 2026-11-16: bỏ giao diện điều hướng bằng các tab cũ, mở app thẳng vào đảo và tích hợp toàn bộ chức năng trong thế giới này. Quyết định này đưa W5 lên trước lịch cũ; không đồng nghĩa đã kiểm thử trên hai điện thoại thật.

## Đợt A — màn chính và công cụ gắn với đồ vật

`index.html` mặc định là host toàn màn hình cho thế giới Three.js. Đăng nhập, ghép đôi, khôi phục mật khẩu và cài đặt vẫn dùng luồng hiện có. Đảo chỉ kết nối Firebase sau khi host xác định đúng nhà và nhân vật; trước đó không tự gửi presence hoặc seed nhà chung. Bộ định tuyến chỉ nhận id trong `src/world-features.mjs`, kiểm tra đúng nguồn và đúng cửa sổ con.

Các phiếu viết/đọc/chọn ảnh dùng lại thành phần và hàm ghi dữ liệu hiện có, mở trực tiếp trên host với nút Về đảo, không tạo thêm iframe app và không hiện thanh tab cũ. Đóng phiếu giữ cảnh, vị trí và dữ liệu. Chỉ thành phần đang mở được render để tránh dựng toàn bộ cảnh 2D ở nền. `?classic=1` giữ cho kiểm thử thành phần và rollback; không có nút chuyển chế độ này trong giao diện người dùng. `?embed=1` vẫn phục vụ liên kết nội bộ cũ, không tự lồng thêm đảo.

**Đợt A không phải tuyên bố mọi cơ chế cũ đã thành game 3D.** Các phiếu hiện còn dùng lại một phần giao diện nhập liệu. Những cảnh cần dựng lại được ghi rõ dưới đây.

| Chức năng / dữ liệu cũ | Điểm vào trong đảo | Trạng thái / việc tiếp theo |
|---|---|---|
| Nhà, di chuyển, trang trí | Cửa nhà, nút Trang trí | Đang là 3D; mở rộng các phòng sau |
| Presence, ôm, đập tay, biểu cảm | Chạm nhân vật | Đang là 3D; còn nghiệm thu hai điện thoại |
| Hũ và các nghi thức hẹn hò, `meta/history` | Hũ hẹn hò | Phiếu bốc/lưu giữ nguyên; tiếp theo làm sâu hoạt ảnh và lượt chơi |
| Nhật ký, `history` | Sổ bên hũ | Phiếu đọc; sau đó gắn dấu vết vào địa điểm/đồ vật |
| Lời hứa, `rules` | Bảng ghim | Phiếu nhập dùng dữ liệu cũ |
| Thư hẹn giờ, `letters` | Hộp thư | Phiếu đọc/viết; tiếp theo phong bì và bàn viết tương tác |
| Giấy nhắn, giọng nói, sticker, `fridge` | Tủ lạnh | Phiếu dán/đáp/thả tim/gỡ; tiếp theo chọn trực tiếp từng giấy trên cửa |
| Ước mơ, `wishes` | Lọ ước mơ | Phiếu giữ nguyên |
| Truyện, `story` | Máy đánh chữ / bàn viết | Phiếu nối truyện; tiếp theo giấy trên bàn và phản hồi trong cảnh |
| Vẽ, `drawings` | Giá vẽ | Canvas nhập liệu giữ nguyên; tiếp theo tranh trên giá trong cảnh |
| Vương quốc, `kingdom/realm` | Bến thuyền | Phiếu quản lý giữ nguyên; **chưa có đảo xây dựng 3D riêng** |
| Từ điển, `dict` | Kệ sách | Phiếu đọc/viết; tiếp theo sách lật và chọn trên kệ |
| Kỷ vật, `museum` | Tủ kính | Phiếu giữ nguyên; **chưa có phòng bảo tàng 3D riêng** |
| Địa điểm, `places` | Bản đồ treo tường | Phiếu giữ nguyên; tiếp theo ghim ảnh/kỷ niệm trong cảnh |
| Cây cũ, mùa hoa, `care/history/meta` | Khu vườn | Phiếu mùa/cây cũ giữ nguyên; **chưa gộp với cây trồng mới trong `world`** |
| Cây mới trong `world` | Luống và chậu ngoài sân | Đang là 3D; cần adapter tham chiếu tiến độ cũ, không ghi đè hai hệ thống |
| Quà, `gifts` | Cây anh đào | Phiếu gói/mở giữ nguyên; bảo mật bí mật M3 vẫn chưa hoàn thành |
| Thú nuôi, `pet` | Góc của bé / sổ tay | Phiếu chăm giữ nguyên; cần đồng bộ loài/tên/trạng thái lên mô hình 3D |
| Ngày kỷ niệm, huy hiệu, việc chung, kho báu | Lịch/tủ kính/sổ tay | Các thành phần cũ còn truy cập được; săn kho báu trong cảnh là đợt sau |
| Trang phục và tâm trạng | Tủ đồ / biểu cảm | Mô hình mới đã có; chưa tự chuyển trang phục cũ sang lựa chọn mới |
| Pha nước, câu cá, picnic | Đảo hẹn hò | Đang chơi trực tiếp trong 3D (PR #118) |
| Tài khoản, ghép đôi, bản sao lưu | Sổ tay → Tài khoản và ngôi nhà | Luồng cũ giữ nguyên, không tự chạy thao tác quản trị |

## Thứ tự sau đợt A

1. Tủ lạnh, hộp thư, hũ: tương tác vật thể rõ hơn, vẫn dùng id/schema cũ.
2. Vườn: đưa cây và bộ sưu tập cũ lên mô hình, dùng tham chiếu/idempotency; không tự gộp hay xoá bản ghi.
3. Đảo vương quốc và khu bảo tàng: đi tới được, xây/trưng bày bằng thao tác trong cảnh.
4. Studio viết/vẽ, kho báu và thêm hoạt động phối hợp; hoàn thành rồi có thứ ở lại trong thế giới.
5. Nghiệm thu trên hai điện thoại và kiểm tra FPS/pin/xoay màn hình xuyên suốt từng đợt.

Kiểm thử bắt buộc cho đợt A: mở mặc định không có tab cũ; link cũ mở đúng phiếu; đúng nhân vật; tài khoản đăng nhập còn truy cập được; mở/đóng phiếu không đổi cảnh/bố cục/dữ liệu; gõ dở không mất khi cập nhật; mọi nhóm chức năng có điểm vào; thông điệp sai nguồn/id bị bỏ qua; phiên chưa xác minh không gửi dữ liệu chung; 360/390/430px. Bộ kiểm thử thành phần cũ tiếp tục chạy bằng URL tương thích rõ ràng để kiểm tra hàm nghiệp vụ giữ nguyên.
