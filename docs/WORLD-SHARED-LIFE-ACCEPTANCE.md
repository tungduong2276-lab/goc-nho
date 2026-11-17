# Góc Nhỏ — nghiệm thu 2 điện thoại: đời sống chung & xưởng sáng tác

**Trạng thái:** Checklist chưa hoàn thành. Không lấy test trình duyệt hoặc Emulator thay cho nghiệm thu máy thật. Các PR xếp chồng #123 → #124 → #125 → #126 vẫn là Draft; chưa merge/deploy.

## Phạm vi và ranh giới dữ liệu

- Dùng **hai điện thoại thật**, hai người đăng nhập vào cùng một cặp nhưng hai phiên riêng biệt. Trước khi động đến nhà thật phải có bản sao lưu/đường khôi phục staging, xác nhận rules theo cặp, tách staging khỏi production.
- Dữ liệu mới (cặp thử nghiệm): `couples/{cid}/world/l_home` (kho thức ăn, món đã nấu, thú cưng, hồ cá), `cc_paint_meta`, `cc_paint_anh`, `cc_paint_em`, `cc_story_meta`, `cc_draft_anh`, `cc_draft_em`, `cc_art_*`, `cc_book_*`.
- KHÔNG đổi/xóa `drawings`, `story`, `pet`, `care`, `fridge`, `museum`, `kingdom` cũ; không seed đè đồ `nha` và `san` đã lưu. Nếu hai người không thể thử staging riêng, **dừng trước khi dùng production**.

## Bảng nghiệm thu thực tế

| ID | Máy A | Máy B | Điều kiện đạt |
|---|---|---|---|
| L1 | A trồng và tưới cà chua ở sân | B mở cùng sân | B thấy giai đoạn cây đúng sau đồng bộ |
| L2 | A/B cùng chạm Thu hoạch trên một luống chín | Cả hai mở kho ở bếp | Chỉ cộng một lượt nguyên liệu, cây trống trên cả hai |
| L3 | A sơ chế Salad ở bếp | B đến bếp hoàn tất | Cả hai thấy một món ăn, trừ nguyên liệu một lần |
| L4 | A cho gà ăn, nhặt trứng | B nhìn kho và nấu trứng | Trứng vào cùng kho, không thể nhận trùng trong thời gian nghỉ |
| L5 | A câu cá; thả hoặc chế biến | B cho cá ăn/chạm hồ | Số cá và thực phẩm không mâu thuẫn |
| L6 | A đổi thú cưng/cho ăn | B mở ổ thú cưng | Loài và mốc chăm mới đồng bộ, dữ liệu pet cũ không mất |
| C1 | A tạo bức tranh và vẽ 3 nét | B vào giá vẽ, vẽ 3 nét màu khác | Hai bên nhìn **một canvas**, kể cả nét đối phương, đúng màu/vị trí |
| C2 | A đang vẽ, giữ ngón tay di chuyển | B quan sát | Nét đang vẽ xuất hiện theo nhịp mạng; không chờ “gửi nửa trên/dưới” |
| C3 | Hai bên đều đã vẽ | A xuất bản, B mở bảo tàng | Một bức tranh hoàn chỉnh, đúng nét của hai người, khung 3D có ảnh; không duplicate |
| C4 | A/B cùng mở truyện và gõ bản nháp | Đọc nháp đang gõ của nhau | Không mất chữ địa phương, cả hai thấy đoạn nháp đối phương |
| C5 | Hai bên thêm đoạn gần cùng lúc | B xuất bản, A vào phòng ngủ | Không mất đoạn; có sách ở kệ phòng ngủ, đọc được toàn truyện |
| N1 | B đang vẽ/viết thì ngắt mạng trên B | A vẫn nấu, viết, vẽ | B không hiện trạng thái “đã đồng bộ” sai; dữ liệu A không bị ghi đè |
| N2 | B nối lại mạng, tải lại phòng | A vẫn ở căn nhà | B nhận đủ tác phẩm, truyện và kho đã xác nhận; không nhân đôi |
| S1 | Đăng nhập tài khoản không cùng cặp | Thử đọc ID các doc mới | Firestore `permission-denied`, không lộ tranh/truyện/kho |
| M1 | Kiểm tra 360/390/430px | iOS Safari và Android Chrome | Không che nút Đóng, có thể vẽ bằng touch, không bị cuộn trang khi vẽ |
| P1 | 10 phút ở xưởng, 10 phút sang bảo tàng rồi về | Máy không nóng bất thường | Khung hình và pin ở mức chấp nhận được, không tăng liên tục GPU texture |

## Quy tắc dừng và bằng chứng

1. Chụp màn hình/ghi video **sau khi đã che tên thật và dữ liệu nhạy cảm** cho các bước C1, C3, C5, N2; ghi cấu hình hai máy, phiên bản trình duyệt và thời điểm thử.
2. Nếu mất mạng khiến nút treo hoặc thanh đồng bộ báo sai, không thử tiếp trên production; ghi console lỗi và trạng thái tài liệu rồi rollback **staging**.
3. Khi hoàn thành từng bước, đánh dấu vào checklist PR #126, dẫn bằng chứng. Không tự xác nhận test **hai máy thật** từ mô phỏng Playwright.
4. Chỉ khi: Node/staging/browser/Emulator **trên đúng SHA** đều xanh, rules đã xác nhận, bản sao lưu staging phục hồi được, toàn bộ L/C/N/S/M/P đạt thì mới xem xét merge từng PR từ dưới lên. Không force push/force merge.

## Hướng kiểm thử tự động độc lập

- `npm test` chứa unit và Firestore Emulator concurrency; `tests/browser/nha3d-life.spec.mjs` và `nha3d-creative.spec.mjs` kiểm tra UI 3D trên màn hình nhỏ.
- PR #126 có job `emulator-world-shared` chạy **hai Chromium context đăng nhập độc lập**, local Firestore+Auth Emulator + rules thật từ `firestore.rules`, chặn mọi kết nối ra internet. Kiểm tra hai chiều onSnapshot, hai đoạn truyện cập nhật đồng thời, mất mạng/nối lại và người ngoài bị từ chối.
- Job trên là **mô phỏng môi trường máy**. Chưa thể xác nhận độ mượt, góc chạm, FPS/pin iOS Safari và Android trên phần cứng thật.

