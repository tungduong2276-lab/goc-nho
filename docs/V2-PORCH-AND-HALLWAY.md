# Góc Nhỏ Living World V2 — hiên trước và hành lang nối phòng

**Trạng thái:** bản thử nghiệm local-only, chỉ mở bằng `?world2=1`. Đây là một bước xây dựng sự liên tục giữa không gian, không phải phát hành lên Firebase thật.

## Hành trình đã được hiện thực

1. Trong một trong bảy cảnh có nhân vật, người chơi tìm thấy tấm thảm nhỏ `Lối ra hiên` **ngay trên mép trước của sàn vẽ**, không chỉ một nút điều hướng ở phần nội dung bên dưới.
2. Nhấn tấm thảm → nhân vật phải dùng cùng thuật toán A* đi từ vị trí hiện tại đến `ROOM_NAV[room].exit`, tránh các vùng chân nội thất. Khi có trạng thái đang ngồi hoặc ngủ, không thể đi ngay.
3. **Chỉ khi đến đúng điểm lối ra**, một cảnh hành lang chung được mở. Hành lang có bảy cửa ứng với Phòng khách, Bếp, Phòng Anh, Phòng Em, Góc sáng tạo, Gác kỷ niệm và Khu vườn.
4. Chạm/chọn bàn phím một cửa → nhân vật **đi qua lối hành lang** trên màn hình rồi mới vào phòng đích. Cảnh đích khởi tạo nhân vật tại mép trước của sàn phòng, không dùng tọa độ ngẫu nhiên.
5. Trước khi hoàn thành đường đi, thao tác di chuyển khác hủy hành trình; dựng lại DOM cùng phòng giữ được đích và callback; Escape hoặc `Quay lại` đóng hành lang mà không thay đổi URL.

**Giới hạn phải công khai:** ảnh phòng gốc vẫn là hình 1170×1170 prerendered, chưa vẽ các lỗ cửa vật lý xuyên tường. Tấm thảm ngoài rìa sàn là một **cửa chuyển cảnh nguyên mẫu**; hành lang sử dụng một bố cục minh họa riêng, **chưa khẳng định các phòng có vị trí liền kề đúng cấu trúc nhà**. Trước khi hoàn thiện 3D nhà cần thêm bản vẽ mặt bằng/hình học thực, cửa thông, hành lang có chiều sâu và kiểm tra góc nhìn nội thất. Không gọi đây là kết nối 3D hoàn chỉnh.

## Hướng dẫn thử nghiệm

- Mở `?world2=1#bep`; chạm `🚪 Lối ra hiên`.
- Quan sát nhân vật đi tới mép sàn trước rồi mới xuất hiện hành lang chung.
- Chọn `Phòng Em` → nhân vật đi qua hành lang, phòng được mở và nhân vật xuất hiện ở mép sàn Phòng Em.
- Dùng Escape hoặc `Quay lại` để hủy, thử các phòng khác.
- Thử `?world2=1&floormap=1#bep` để chồng bản đồ sàn/vùng cản từ PR #88 lên cảnh hiện tại.
- Không có `world2=1`: cả tấm hiên lẫn hành lang đều không được dựng.

## Kiểm tra và rủi ro

- `src/living-world-transitions.mjs`: định danh, vị trí lối ra, đường A* và tọa độ hành lang bất biến.
- `src/living-world-hallway.mjs`: cảnh local, chuyển cửa, hủy phím Escape, reduced-motion, khóa double-click.
- `src/living-world-avatar.mjs`: giữ callback đến hiên khi DOM dựng lại; hủy callback khi đổi lộ trình, sau khi đến nơi mới mở hành lang.
- Kiểm thử Node: đủ bảy cửa, tất cả đường từ nhân vật tới hiên an toàn và 49 cặp phòng, từ chối dữ liệu/đường không hợp lệ, không ghi Firebase.
- Kiểm thử trình duyệt: ảnh bảy hiên ở 390px; cảnh hành lang ở 360/390/430px; click, bàn phím/Escape, hoàn tất tới phòng mới, hủy đường đi, dựng lại giữa đường; chế độ tắt mặc định.
- PWA shell nâng lên v18 để offline import đủ module mới.

### Tiêu chí chỉ được nhập vào V2 Draft

- [ ] CI chính xác tại HEAD xanh: static, staging, Playwright Chromium, Firestore Emulator.
- [ ] Xem ảnh thực bảy phòng và hành lang; tấm hiên không che vật thể tương tác.
- [ ] Các cửa trong hành lang có nhãn, khả năng nhấn và vùng chạm trên mobile.
- [ ] Không mở hành lang khi chưa đến lối ra; không mở sau hủy/đổi phòng; không nhân đôi sự kiện sau dựng lại.
- [ ] Firebase production không bị đọc/ghi/migrate; `main` bất biến.

### Điều kiện chưa đạt để lên main

Cần duyệt bản vẽ cửa/tường/hành lang chính thức, mở rộng phòng **bằng nghệ thuật/hình học thực**, staging live hai thiết bị, cloud staging managed Firestore export/restore và audit Rules/Auth/App Check/IAM. Hành lang này chưa có đồng bộ avatar thời gian thực và cũng không thay thế hệ thống điều hướng của legacy app.

**Bước kế:** thiết kế mặt bằng gắn cửa thật trên từng hình phối cảnh; xác định tọa độ đi qua tường và hành lang có thể sử dụng liên tục, rồi thêm tương tác đồ vật nhiều bước (sofa, giá vẽ, album) tại vị trí nhân vật.
