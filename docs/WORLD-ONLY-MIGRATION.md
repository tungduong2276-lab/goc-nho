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
| Hũ và các nghi thức hẹn hò, `meta/history` | Hũ hẹn hò | Lắc hũ bốc lá ngay trong cảnh (dùng `drawNow()` cũ), tên lá hiện trên đảo; nghi thức/đổi lá vẫn trên phiếu |
| Nhật ký, `history` | Sổ bên hũ | Phiếu đọc; sau đó gắn dấu vết vào địa điểm/đồ vật |
| Lời hứa, `rules` | Bảng ghim | Phiếu nhập dùng dữ liệu cũ |
| Thư hẹn giờ, `letters` | Hộp thư | Phong bì bay ra, chạm từng lá (niêm phong giữ kín); đọc/viết trên phiếu, mở đúng lá |
| Giấy nhắn, giọng nói, sticker, `fridge` | Tủ lạnh | Chạm từng giấy trên cửa: đọc chữ, thả tim (ghi bằng hàm cũ), đáp lại mở đúng giấy; dán giấy mới trên phiếu |
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
| Trạng thái lưu và gửi lại khi lỗi | HUD và phiếu đồ dùng | Giữ nguyên nút đồng bộ/gửi lại thủ công hiện có, không tự gửi lại |
| Thời tiết và bài hát đã chọn | Cài đặt ngôi nhà | Giữ lựa chọn; ngày/đêm đã 3D, adapter thời tiết/âm nhạc cần chuyển tiếp |
| Tài khoản, ghép đôi, bản sao lưu | Sổ tay → Tài khoản và ngôi nhà | Luồng cũ giữ nguyên, không tự chạy thao tác quản trị |

## Đợt B — Nhà nhiều phòng (nhánh thử nghiệm, chưa phát hành)

Yêu cầu mới 2026-11-17: giữ một đảo 3D, nhưng bên trong nhà phải có các không gian riêng phục vụ đời sống và hoạt động của hai người. Trước đây scene `nha` là **một phòng duy nhất** chứa cả sofa/giường/bếp; không chuyển hay xoá các món đã lưu trong đó. Trong đợt B, scene `nha` vẫn giữ nguyên id và toàn bộ furniture, được gọi là **Phòng khách cũ** để đảm bảo tương thích; khi chủ nhà chuyển đồ sang các phòng mới trong các đợt sau mới được phép sửa.

Không gian mới: **Hành lang** (không cho trang trí chắn cửa), **Phòng ngủ** (giường, tủ, góc thú cưng), **Bếp** (tủ lạnh, bếp, bàn ăn), **Bảo tàng** (tủ trưng bày kỷ niệm, bản đồ, sách), **Xưởng sáng tạo** (vẽ, viết truyện, ước mơ, lời hứa), **Phòng hoạt động** (hũ hẹn hò, sofa, đài). Các phòng dùng mô hình 3D và đặt nội thất trực tiếp trong scene; đi từ sân → phòng khách → hành lang → phòng khác bằng cửa; nút la bàn tự đi theo từng chặng.

- Lưu cảnh mới dưới các key riêng `gocnho.nha3d.room.<scene>.v1`; dữ liệu `nha` và `san` không đổi key.
- Firebase tiếp tục dùng `couples/{cid}/world/` với id scene mới (không migration; không xóa/đọc bản ghi riêng tư trong quá trình triển khai). Seed phòng mới khi vào lần đầu; scene có meta dù không còn nội thất sẽ không bị gieo lại mặc định.
- Presence hai người phải phân biệt đúng từng phòng, và không hiển thị avatar của người khác khi khác phòng; hiện tại vẫn cần test Emulator + hai máy thật.
- Tủ kính bảo tàng đang kết nối đến **cùng dữ liệu `museum` cũ**, chưa phải hệ thống sắp xếp kỷ vật tự do bằng kéo-thả. Không được ghi là bảo tàng bản hoàn chỉnh.
- Bộ ghế/giường/bếp cũ trong phòng khách giữ nguyên: tránh chuyển tự động làm mất nội thất đã được hai người sắp xếp; bổ sung luồng “chuyển đồ giữa phòng” ở đợt sau với xác nhận và rollback.

**Cổng phát hành:** test static/staging/browser/Firestore Emulator; quan sát ảnh 360/390/430px, cửa ra/vào và vùng chạm; nghiệm thu hai điện thoại. Chỉ merge khi đạt và không phát sinh xóa dữ liệu. PR thử nghiệm: xem branch `feature/world-multiroom-museum-20261117`; chưa có xác nhận hoàn tất tại thời điểm viết.

## Thứ tự sau đợt A

1. ~~Tủ lạnh, hộp thư, hũ: tương tác vật thể rõ hơn, vẫn dùng id/schema cũ.~~ Xong 2026-11-17: chạm từng giấy trên cửa tủ (đọc, thả tim, đáp), phong bì bay ra từ hộp thư, lắc hũ bốc lá hiện tên ngay trong cảnh. Đảo hẹn hò đã gỡ theo yêu cầu người dùng.
2. Vườn: đưa cây và bộ sưu tập cũ lên mô hình, dùng tham chiếu/idempotency; không tự gộp hay xoá bản ghi.
3. Đảo vương quốc và khu bảo tàng: đi tới được, xây/trưng bày bằng thao tác trong cảnh.
4. Studio viết/vẽ, kho báu và thêm hoạt động phối hợp; hoàn thành rồi có thứ ở lại trong thế giới.
5. Nghiệm thu trên hai điện thoại và kiểm tra FPS/pin/xoay màn hình xuyên suốt từng đợt.

Kiểm thử bắt buộc cho đợt A: mở mặc định không có tab cũ; link cũ mở đúng phiếu; đúng nhân vật; tài khoản đăng nhập còn truy cập được; mở/đóng phiếu không đổi cảnh/bố cục/dữ liệu; gõ dở không mất khi cập nhật; mọi nhóm chức năng có điểm vào; thông điệp sai nguồn/id bị bỏ qua; phiên chưa xác minh không gửi dữ liệu chung; 360/390/430px. Bộ kiểm thử thành phần cũ tiếp tục chạy bằng URL tương thích rõ ràng để kiểm tra hàm nghiệp vụ giữ nguyên.
