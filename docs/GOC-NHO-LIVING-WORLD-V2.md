# GÓC NHỎ V2 — MỘT THẾ GIỚI SỐNG CỦA HAI NGƯỜI

**Loại tài liệu:** Tuyên ngôn sản phẩm, thiết kế trải nghiệm và phân rã kỹ thuật.
**Cập nhật:** 2026-11-07.
**Trạng thái:** Từng bước triển khai trên nhánh thử nghiệm; **chưa phát hành**.
**Quyền sở hữu thiết kế:** Giữ thế giới đáng yêu, thân mật, sáng tạo và những dữ liệu/kỷ niệm riêng của hai người; **không biến thành Play Together clone hoặc menu 3D nặng**.

## 1. Chẩn đoán: vì sao bản hiện tại chưa phải thế giới riêng

Các phòng là hình nền dựng sẵn và các khu vực nhấp chuyển sang những tab cũ. Nhân vật có sprite, biểu cảm, trạng thái và hiệu ứng nhưng chưa thể tự nhiên đi lại và tương tác đồng thời với nhau. Tủ lạnh có giấy nhắn, sticker và trả lời, nhưng phần lớn tương tác diễn ra ở trang riêng. Các mini-game trong Hũ hẹn hò phần lớn ở dạng văn bản; dù có biến thể, chúng thiếu hệ thống ván, phản hồi, kết quả, phần thưởng vật lý và cách chơi lại khác biệt. Sticker đang có một số họ nhân vật và đồ vật, nhưng chưa thành một thư viện đa chủ đề có cùng phong cách đồ họa.

**Nguyên tắc V2:** Mỗi lần chạm vào một đồ vật, người dùng phải thấy và hành động trên đồ vật ấy **ngay trong bối cảnh**; sau đó có một dấu vết hoặc phản hồi có ý nghĩa trong thế giới.

**Chất riêng phải giữ:** Tên Góc Nhỏ, hai nhân vật Anh/Em và cách gọi tùy chỉnh, các kỷ niệm đã có, cây/hoa và sự phát triển chậm rãi, tủ lạnh giấy nhắn, thú cưng, phòng tranh, truyện tiếp sức, quà, ngày hẹn, album. Cảm giác chủ đạo: ấm áp, tinh nghịch, nhiều bất ngờ và dễ thương, không cạnh tranh căng thẳng hoặc ép làm nhiệm vụ hàng ngày.

## 2. Tiêu chuẩn «thế giới chứ không phải danh sách tính năng»

1. **Có mặt cùng nhau:** mỗi avatar ở một phòng, có khả năng đi đến vị trí trên sàn hợp lệ; trạng thái có mặt phản ánh kết nối thật, không giả online.
2. **Tương tác ngay trong cảnh:** click object -> camera cận cảnh / cửa mở / ngăn kéo kéo ra -> chọn đồ con -> đọc/viết/trao đổi -> quay lại vị trí cũ, không đổi tab giữa luồng.
3. **Các thứ có hậu quả trong thế giới:** lời nhắn dán lên tủ, tranh được treo, cây lớn, quà đặt lên kệ, sticker nằm trên đồ, món ăn hiện trên bàn.
4. **Hai người có vai trò:** game và vật thể cần đưa ra quyết định hợp tác / đối kháng nhẹ, không chỉ nút «nhận thông báo».
5. **Chơi lại thực sự khác:** kết hợp nhiệm vụ, vai, luật, thời gian, bản đồ, tình huống, điều kiện thắng và phần thưởng bằng seed/pack; không chỉ thay từ khóa trong cùng một câu hỏi.
6. **Không gây áp lực:** không phạt offline, không bêu xấu/trừng phạt ngoài đồng ý, có nút bỏ qua, kết quả chơi vẫn đáng yêu kể cả thua.
7. **Không lấy 3D làm mục tiêu:** 2.5D với sprites tách rời, lớp vẽ và hotspot thông minh là lựa chọn hợp lý cho mobile cho đến khi realtime 3D chứng minh tốt hơn.

## 3. Vùng nhà có hành vi thật

| Khu | Tương tác tại chỗ, không chuyển tab | Trạng thái lâu dài |
|---|---|---|
| Bếp | mở tủ lạnh, kéo giấy, trả lời trên giấy, dán sticker; chọn nguyên liệu, chơi nấu ăn hai vai | giấy nhắn thật, công thức, bữa ăn, món trưng bày |
| Phòng khách | di chuyển, ngồi cùng sofa, vẫy/ôm/thả tim, bàn uống nước, TV cùng chọn nội dung, chụp ảnh | khung ảnh, đồ trang trí, kỷ vật |
| Vườn | đi tới luống, lấy bình tưới, gieo/trồng, kéo vị trí chậu, chăm thú cưng, picnic | giai đoạn cây, hoa, bảng tên, cây gắn kỷ niệm |
| Phòng Anh/Em | tự chọn đồ, bật tắt đèn, mở tủ và ngăn kéo, đọc nhật ký được cho phép | bố cục và vật cá nhân |
| Góc sáng tạo | giá vẽ có canvas ngay trong phòng, máy đánh chữ mở giấy viết ngay trong cảnh | tranh phơi, truyện đóng sách |
| Gác kỷ niệm | mở rương, bì thư, album và khung ảnh theo chỗ đặt; chọn đồ trưng bày | bảo tàng vật thể có liên kết đến kỷ niệm gốc |
| Hiên/đảo/quán cà phê | cùng khám phá, tương tác ghế/bàn/đèn, gọi món, vào mini-game qua bàn chơi | ảnh, sticker, vật phẩm thắng được |

Mỗi vật thể cần metadata: id ổn định; room/coordinate/hitPolygon; trạng thái; animation; nội dung được phép hiển thị; thao tác liên quan; nguồn dữ liệu; quyền đọc/ghi; rollback.

## 4. Tủ lạnh V2 — vertical slice bắt buộc

Từ Bếp chạm **tủ lạnh**, camera mở tủ; thấy những giấy dán và sticker có vị trí. Chạm **một giấy** để đọc toàn văn, hiển thị lời đáp **trên giấy**, viết và gửi ngay đó, đóng quay về Bếp. Không điều hướng sang #tu-lanh trong luồng này. Có lối tắt xem danh sách đầy đủ nếu cần. Sau đó cho phép kéo giấy vào ô, dán sticker, chọn ảnh/voice khi đã có Storage và review bảo mật.

- Tái sử dụng dữ liệu legacy của collection fridge dưới couples/{cid}; **không tự di chuyển hoặc xóa**.
- Không dùng put("fridge", whole-document) cho các phản ứng đồng thời; prototype staging dùng arrayUnion / transaction trên field, chưa thay protocol production.
- Đảm bảo giấy thật đọc được, dữ liệu staging/demo không giả làm dữ liệu prod, hoạt ảnh không cản việc truy cập.
- **Hệ thống V2 thử nghiệm hiện tại:** bật bằng query param ?world2=1; ngoài Firebase staging của project goc-nho-staging-2026, mọi thao tác mới chỉ có hiệu lực trong phiên cục bộ và có nhãn rõ ràng.

## 5. Hai nhân vật và giao tiếp

Bốn lớp phát triển:
- **V2.1:** chat bong bóng/chữ theo phòng, emote, panel có lịch sử, tắt thông báo, chỉ hai UID thuộc nhà được quyền truy cập.
- **V2.2:** vị trí avatar cục bộ trên floor mask; pathfinding đơn giản với vật cản; hotspot tới điểm đứng trước đồ; camera theo nhân vật; không cần lập tức chuyển sang WebGL.
- **V2.3:** đồng bộ 2 avatar bằng presence/throttling, interpolation phía nhận, đồng bộ hành động ngồi, ôm, nấu và chơi; không ghi từng pixel/frame vào Firestore.
- **V2.4:** lời nhắn ngữ cảnh đặt vào vật thể/phòng, sự kiện bất ngờ chung và sticker trên môi trường.

Chat cần dữ liệu định danh từng message riêng, thứ tự server, pagination, quyền hạn hai người, chống spam, offline/reconnect, xóa theo quy tắc; không ghi lịch sử và vị trí bí mật. Không tái sử dụng presence docs để nhồi toàn bộ chat.

## 6. Hệ thống hẹn hò và mini-game cần đổi cách nghĩ

Tồn tại hai phân hệ khác nhau, không được nhầm:
- **Hũ hẹn hò ngoài đời:** Một lá phải có hook hấp dẫn, mục tiêu cụ thể, sự lựa chọn của cả hai, 1–3 biến số bốc ngẫu nhiên, gợi ý thay thế và kết quả mang về nhà. Không dùng thử thách làm người lạ bối rối, quay/chụp người khác trái ý họ hoặc hình phạt gây xấu hổ. V2 thử nghiệm mở rộng 24 lá mới (ID 31–54) lên tổng 54; ưu tiên cơ chế đấu giá, thám tử, cứu hộ, trao đổi thẻ và biên kịch thay vì «trả lời một câu hỏi».
- **Trò chơi trong app:** cần các *game engine* thật, có HUD, điểm/luật, turn, reveal, kết thúc, chơi lại, session state, reconnect và lựa chọn hợp tác/đối kháng nhẹ.

Các game đề xuất triển khai trong app, theo nhóm:
1. **Hai nửa mật mã** — hai người nhìn các mảnh bản đồ/thông tin khác nhau; hợp tác mở cửa trong 3–5 phút.
2. **Ai hiểu ai hơn?** — chọn bí mật đồng thời, chỉ lật sau khi cả hai khóa lựa chọn; đố không lặp.
3. **Bảo vệ chiếc bánh** — phối hợp đặt vật cản và sửa đường đi trong các đợt ngắn.
4. **Trộm kho báu** — người A điều hướng, người B nhìn camera/bản đồ và truyền chỉ dẫn.
5. **Bếp hỗn loạn** — hai vai chỉ huy và đầu bếp, cần trao đổi nguyên liệu theo thứ tự.
6. **Thám tử vô lý** — chia manh mối, liên kết 4 bằng chứng, tìm thủ phạm trong bộ kịch bản thay đổi.
7. **Đối kháng sticker** — đấu bài dễ thương có 3 hành động độc lập (đổi, chặn, bất ngờ) không pay-to-win.
8. **Vẽ mù** — mỗi người nhìn một nửa mẫu; cùng vẽ thành bức tranh lạ.
9. **Xây phòng trong 2 phút** — hai người luân phiên đặt 6 đồ theo đề bài, chấm hài, không cần mua đồ.
10. **Đảo một ô** — cùng khám phá hòn đảo bé, giải vật thể theo các quy tắc xen kẽ.
11. **Bản đồ cảm xúc** — đi tìm vật ẩn theo mô tả do người kia tạo.
12. **Đua cứu thú cưng** — một người sửa đường, người kia điều khiển nhân vật; điểm dựa vào hợp tác.

Mỗi minigame phải có từ 8–20 bộ bản đồ/mồi/ngữ cảnh, độ khó tăng nhẹ, seeded deterministic replay test, phép khôi phục trạng thái và lối chơi lại ngay.

## 7. Thư viện hình ảnh và cá nhân hóa

- Sticker chia chủ đề: biểu cảm Anh/Em, thú cưng, đồ ăn, hoa, mùa, tình cảm, quậy phá, chibi tình huống. Sau prototype emoji cần **atlas sticker tự thiết kế** (tối thiểu 60–100 mẫu) cùng nét viền/palette/biểu cảm, WebP/PNG có nền trong, lazy load; không dùng ảnh ngẫu nhiên lệch phong cách.
- Đồ nội thất: mở ra được, thay đổi được, treo/đặt được và có cận cảnh; một chiếc tủ chỉ đẹp mà không thao tác thì chưa đạt.
- Room geometry: walkable floor > hitbox hợp lệ; nhận diện cửa ra vào, vùng đặt đồ, va chạm, chiều sâu; không phóng to cả hình bằng CSS.
- Phong cách: pastel nhưng giàu chi tiết, ánh sáng dịu, chibi ấm áp; nhiều hoạt ảnh nhỏ; giảm chuyển động khi user chọn reduced motion; tôn trọng mobile 360/390/430.

## 8. Kế hoạch làm lần lượt (không coi tất cả đã xong)

| Sprint | Ưu tiên triển khai | Tiêu chí đi tiếp |
|---|---|---|
| S0 | M0 safety: staging độc lập, deployed Rules/Auth, export/restore và rollback, review PR #9 | có bằng chứng kiểm toán và test; không dùng production để thử |
| S1 | Tủ lạnh V2 theo luồng đúng, chat staging theo phòng, sticker/game catalog thử nghiệm | UX cận cảnh 0 điều hướng; test browser + 2 client + không ghi prod |
| S2 | Sàn đi được + avatar pathfinding / sync presence, chat bubble trong cảnh | di chuyển không lọt đồ, 2 client ổn định, không quá tải Firestore |
| S3 | Bếp, phòng khách, vườn có đồ vật thao tác nhiều bước và đồng bộ | 5–8 object loops thật và phản hồi của cả hai |
| S4 | Trang trí bền vững + đồ gắn kỷ niệm + cá nhân hóa phòng | transactional placement và undo, giữ dữ liệu cũ |
| S5 | Mini-game framework + 3 trò ra mắt; mở rộng dần 12 trò | hai người, reconnect, chơi lại thay đổi, không lộ đáp án sớm |
| S6 | Hẹn hò thành chuyến phiêu lưu có vật phẩm/kỷ niệm mang về; 60–100 sticker chuẩn | playtest cả hai thấy thích, tỷ lệ chơi lại cao |
| S7 | Bảo tàng, quà bí mật, album và hoạt động theo mùa nối vào cùng thế giới | bảo mật nội dung chưa mở, không mất tài liệu |

Chất lượng không chỉ đo bằng số chức năng: đo số lần phải rời cảnh để hoàn thành thao tác, tỷ lệ hai người muốn chơi lại một trò, thời lượng thao tác, khối lượng tài nguyên tải, FPS, tần suất Firestore đọc/ghi, số lỗi 2 client và cảm giác cá nhân hóa qua playtest.

## 9. Gate an toàn và tiêu chí release

- Mọi thay đổi trên nhánh riêng; CI, test Playwright, Firebase Emulator, staging-only, hai tài khoản/hai thiết bị, mất mạng và retry, backward compatibility.
- Không bật ghi production từ feature V2 khi chưa có Rules cho tin nhắn riêng, kiểm toán App Check và backup/rollback staging đủ điều kiện.
- Không tự động merge PR #9 hay PR V2 khi chưa chứng minh map/room geometry, và CI chỉ là một điều kiện, không phải chứng cứ trải nghiệm «mượt».
- Không phá dữ liệu fridge/games/story/drawings/pets hoặc xóa các tab legacy trước khi tính năng tương đương trong thế giới có đủ chức năng.
- Nhánh thử nghiệm V2 hiện tại **chỉ là vertical slice**, không được trình bày như thế giới hoàn chỉnh.

## 10. Handoff ngày 2026-11-07

- main tại lúc tạo nhánh: e79f97870c4ea1797ba22c8a6d7011c66e5c9d4a.
- code: src/living-world-v2.js, src/living-world-v2.css, src/living-world-games.js; test: tests/browser/living-world-v2.spec.mjs.
- Đã có code demo cục bộ cho fridge close-up và chat; Firebase staging-only code path dự kiến, chưa có kiểm chứng cloud. Trên môi trường project goc-nho production, feature module không được ghi dữ liệu mới.
- 24 trò hẹn hò mới + 24 hình phạt + 8 phần thưởng + 36 sticker dạng emoji placeholder; **chưa có 36 sticker art tự thiết kế** và **chưa có thêm mini-game engine realtime**.
- Chỉ mở feature với ?world2=1; default giữ UI cũ. Không deploy, không migrate, không merge main ở bước này.
- Next: xem kết quả CI PR thử nghiệm, sửa lỗi (không bỏ test), xác minh staging thực, review 2-client, sau đó làm avatar pathfinding và game framework theo S2/S5.


### Tiến độ bổ sung trên nhánh thử nghiệm ngày 2026-11-07

- Đã bổ sung `src/living-world-minigames.js` (không gọi mạng) với hai mini-game **chơi được trên một máy bằng cách chuyển lượt**: `Hai nửa mật mã` (vai A nhìn chuỗi từ, vai B nhận bàn phím biểu tượng, cùng giải khóa) và `Trùng sóng` (A/B chọn kín rồi cùng xem đáp án). Cả hai có nút chơi lại và tình huống sinh ngẫu nhiên.
- Trò chơi cắm vào tab `#vuong-quoc` dưới `?world2=1`; không giả nhận đã hoạt động hai thiết bị. Trước khi 2 thiết bị chơi cùng, phải có session protocol được Rules/Emulator xác minh, tránh lộ câu trả lời trước khi hai người xác nhận.
- Test: `tests/browser/living-world-games.spec.mjs`, bổ sung e2e chọn symbol, mở khóa, replay và lựa chọn kín. Phải xem kết quả CI cho HEAD mới nhất, không dùng kết quả commit cũ làm bằng chứng.


### Cổng bảo mật chat staging — đề xuất cần kiểm chứng

- `tests/firebase/fixtures/world-v2-chat.rules` là **candidate Rules cho Emulator**, mở rộng từ Rules candidate M0 và loại `worldChat` khỏi match legacy rộng. Không phải `firestore.rules` đã deploy.
- `tests/firebase/world-v2-chat-rules.test.mjs` kiểm tra hai thành viên đọc/gửi, người ngoài không truy cập, chống mạo danh UID/vai, chống sửa/xóa tin nhắn, giới hạn độ dài/phòng và tiếp tục sử dụng collection cũ. Cần chạy CI và review độc lập; chưa chứng minh Rules staging cloud đã áp dụng.
- Giao thức gửi dùng document ID ổn định trên mỗi lần submit để retry không thêm bản sao, lời đáp giấy sử dụng `arrayUnion` theo operation ID. Vẫn cần thử mất mạng thật và giới hạn tần suất / chi phí để lên production.
