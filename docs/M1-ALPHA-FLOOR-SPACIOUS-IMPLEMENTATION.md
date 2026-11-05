# M1 — Kế hoạch kỹ thuật: alpha nội thất, mặt sàn, phòng rộng hơn

## Bối cảnh và quy tắc
- Nhánh triển khai thử: `feature/m1-alpha-floor-spacious-review`, base PR #9 (`feature/spacious-house-weather-botany`). Không sửa `main` và Firebase production.
- Dữ liệu gốc ảnh 1170×1170; `scene.json` chứa box ảnh sprite, **không** phải collider. Screenshot PR #57 chứng minh nhiều box chứa vùng trong suốt.
- Ba đối tượng độc lập: (A) visual-alpha silhouette có thể đo tự động; (B) *floor-contact footprint* cần ảnh/bố cục có kiểm chứng; (C) *walkable/decor floor* cần duyệt đường biên sàn, cửa và đường đi. Không suy B/C từ A.
- Chỉ được phép chạy trong bộ kiểm toán/preview tới khi M0 backup staging + khôi phục, deployed Rules/Auth/App Check/IAM, rollback và kiểm thử 2 client hoàn tất.

## Checklist triển khai và chủ thể mã

### [x] A1 — Tách alpha thật ở cấp pixel
- `src/house-alpha-footprint-review.mjs`
- `analyzeAlphaPixels({data,width,height,threshold,tileSize})`: validate toàn bộ shape; quét kênh A với alpha > threshold; tính `opaquePixels`, `alphaBounds` (biên phải/dưới exclusive), tỷ lệ opaque và ô alpha/tile đã tô; báo null khi ảnh trong suốt hoàn toàn.
- `sourceAlphaBounds(report,sourceBox)`: ánh xạ biên alpha từ toạ độ pixel sprite sang toạ độ scene.json 1170px, có scaling đúng khi ảnh được render khác kích thước nguồn.
- `assertDecorZoneApproved(candidate)`: từ chối sử dụng alpha review làm quyết định ghi dữ liệu, **kể cả khi input giả mạo trạng thái đã duyệt**.
- `tests/staging/m1-alpha-footprint.test.mjs`: transparent padding, ảnh trống, threshold ở biên, tile mask, mapping, invalid input và persist guard.

### [x] A2 — Chụp review alpha trực tiếp trên scene đã ghép
- `tests/browser/house-alpha-review.spec.mjs`
- Khởi tạo scene thật trong trình duyệt Playwright trên local test server (không Firebase), tải 3 layer state từ file WebP cho từng phòng; `canvas.getImageData` lấy alpha thật, tính boundary tại nguồn.
- Tô alpha thực với composite `source-in` lên canvas tạm, sau đó vẽ lên scene 1170px (màu hồng đỏ chỉ biểu diễn pixel có hình). Tuyệt đối không vẽ toàn hình chữ nhật opaque.
- Ghi 6 ảnh `alpha-<room>-390.png` và `alpha-review-manifest.json` vào `review-artifacts/house-alpha/`. Manifest để floor/door/contact = null/UNTRACED, `approved:false`.
- CI phải kiểm tra đúng sáu tệp và manifest trước khi báo xanh.

### [x] B1 — Làm phòng hiện thị rộng hơn trên PR #9 thử nghiệm
- `index.html`: CSS duy nhất ở `#tab-room .room3d,.room-tab .room3d`, stage rộng lên tới 960px desktop, gần hết màn hình mobile; giữ nguyên scene image 1170×1170 và hitbox tương ứng, giữ aspect-ratio 1.
- `tests/browser/house-spacious-view.spec.mjs`: đo bbox tại 360, 390, 430, 1300, sáu phòng, kiểm tra tràn ngang và stage đủ lớn.
- Đây là **rộng về hiển thị**. Chưa dịch chuyển/thu nhỏ sprite hay mở rộng sàn thật.

### [ ] C1 — Duyệt floor-contact của từng sprite trong scene
- Dự kiến `src/house-floor-contact-atlas.mjs`: `getFloorContact(roomId,itemState)`, `validateContactPolygon(...)`, metadata về nguồn/bằng chứng và trạng thái `PROPOSED/VERIFIED`.
- Cần người duyệt đối chiếu ảnh ghép 1170px và chân/đáy của sprite: giường, sofa, tủ, bàn, giá vẽ, rương; loại vật treo tường khỏi collider nhưng không loại khỏi occlusion.
- Bổ sung test không được đánh dấu là VERIFIED nếu thiếu tài liệu xác nhận; tránh dùng `alphaBounds` làm floor contact.

### [ ] C2 — Vẽ và nghiệm thu sàn/cửa/lối đi thật
- Dự kiến `src/house-floor-zones-v2.mjs`: `validateFloorPolygon`, `subtractVerifiedFootprints`, `reserveDoorwayClearance`, `reserveWalkways`, `measureContiguousDecorArea`.
- **Input bắt buộc:** polygon sàn thật có ảnh đối chứng; door thresholds; floor contacts đã duyệt; lane clearance; nguồn phiên bản asset. Thiếu bất kỳ thành phần nào → `decorFreeZones:[]`, `usableFloorAreaPx2:null`, `canPersist:false`.
- `tests/staging/m1-floor-zones-v2.test.mjs`: cạnh/lõm polygon, tiếp xúc/tangency, ảnh thiếu, footprint xoay 90°, vùng cửa không thể bị lấp, route giữa hai điểm nhân vật không bị cắt, không ghi Firebase.

### [ ] D1 — Bố cục rộng về **không gian thật**, nếu review C1/C2 cho thấy phòng vẫn chật
- Tạo **PR riêng** để đổi nguồn hình học/asset, không biến dạng bitmap bằng CSS.
- Sắp xếp lại built-in props về phía mép phòng, chỉnh phối cảnh isometric và góc camera; cập nhật tất cả state sprite, hitbox, spots và scene.json đồng bộ.
- Screenshot trước/sau ở 360/390/430/1300; không mất vùng chạm, không tràn và vẫn phù hợp điện thoại. Nghiệm thu độc lập.

## Tiêu chí merge từng PR
- PR vào **nhánh PR #9**, không merge PR #9 vào main. PR có test unit, Playwright, Firebase Emulator, CI trên HEAD và CI sau merge đều xanh.
- Artifact review đủ ảnh, filename/nội dung đúng; không suy quyền đặt đồ từ alpha.
- Browser mobile không tràn ngang và không mất vùng chạm. Nếu test fail, sửa rồi chạy lại; không skip/flaky-ignore.
- Không tạo Firestore collections mới, không gọi Firebase thật, không ghi localStorage cho preview.
- Bước C/D cần review ảnh thật riêng; chưa được phép tuyên bố sàn/cửa/floor contact APPROVED chỉ nhờ CI xanh.
- Cuối phiên cập nhật `docs/GOC-NHO-MASTER-ROADMAP.md` cùng SHA/PR/CI xác minh và bước chưa hoàn thành.
