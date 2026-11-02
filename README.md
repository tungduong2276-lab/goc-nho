# Góc Nhỏ 3D · bộ hình đợt 0 + đợt 1

Bộ hình này làm theo tài liệu "Góc Nhỏ · Yêu cầu thiết kế 3D". Toàn bộ đều render bằng code (three.js r169), không vẽ tay. Vì vậy muốn sửa màu, đổi vị trí đồ, hay thêm biến thể thì sửa vài dòng rồi render lại. Mọi file sẽ giữ đúng camera và đúng điểm neo.

## Luật chung đã áp dụng (mục 2)

| Mục | Giá trị |
|---|---|
| Camera | Trực giao, xoay ngang 45°, nghiêng 35.26°, luôn nhìn từ góc trước-phải |
| Lưới | 1 ô sàn = 1 đơn vị = 1 m |
| Viền | Vỏ lật (inverted hull) màu #1D2B4F, dày 7.5 px ở ảnh @3x (= 2.5 px ở 1×) |
| Bóng | Bóng mềm xanh than, độ mờ 18%, lệch về góc dưới-phải |
| Shading | Toon 3 bậc sáng, giữ cố định cho mọi asset |
| Đèn | Đèn chính ấm #FFF4E6 từ trên-trái, đèn phụ #D8EEFF từ phải bằng ~40% đèn chính |
| Màu | Chỉ dùng bảng màu mục 2. Riêng da và tóc dùng thêm vài tông nâu, hồng da |
| Không có | Hoa hồng, hoa hướng dương, nhân vật có bản quyền |

## Kích thước và điểm neo

| Thư mục | Kích thước @3x | Điểm neo (tâm đáy chạm sàn) | Tỉ lệ |
|---|---|---|---|
| 01_nhan-vat, 02_thu-cung | 512 × 512 | x = 256, y = 464 (cách đáy 48 px) | 380 px / đơn vị |
| 06_cay-hoa | 256 × 256 | x = 128, y = 222 | 230 px / đơn vị |
| 04_phong/phong-khach | 1170 × 1170, phòng chiếm giữa ~85% | toạ độ thế giới → pixel nằm trong `00_tham-chieu/scene.json` | 112 px / đơn vị |
| 03_ban-do | 1170 × 2532 (app dùng bản cắt 1170 × 1960) | vùng chạm từng khu nằm trong `scene.json` | 64 px / đơn vị |

Khi đặt nhân vật vào một cảnh, phóng theo tỉ lệ: `tỉ lệ cảnh / 380`. Ví dụ phòng khách là 112 / 380.

Các lớp rời của phòng khách (`pk_*`) đều render cùng khung với ảnh nền. Đặt chồng đúng vị trí là khớp. Toạ độ cắt sát từng lớp có trong `scene.json → room.layers`.

## Đã có trong bộ này

- **01 Nhân vật:** Anh (hoodie trắng mũ xanh, quần xanh nhạt, tai nghe), Em (áo thun xanh lá nhạt, váy yếm hồng, kẹp tóc lá, hay nghiêng đầu). Có các tư thế đứng, vẫy tay, ngồi, tưới cây, ôm, nhìn từ sau và ngủ, kèm chân dung 512.
- **02 Thú cưng:** mèo 3 màu lông (trắng, cam mướp, xám xanh) × 3 trạng thái hình (ngồi, vui, cuộn tròn ngủ). Bong bóng trạng thái (đói, bẩn, buồn, ngủ, chờ thư, vui) vẽ bằng SVG trong app.
- **03 Bản đồ ngôi nhà:** nhà búp bê 2 tầng + gác mái chéo, trên đảo đất nổi giữa biển. Có sân trước lát đá, hộp thư, hàng rào trắng, bảng tên (để trống chữ), cột đèn, vườn 4 × 3 luống, xích đu, quán cà phê mái sọc, bến thuyền, thuyền và đảo vương quốc xa. Đủ 4 buổi: bình minh, ngày, hoàng hôn, đêm (cửa sổ sáng đèn). Mây là 3 file rời để trôi.
- **04 Phòng khách:** nền đủ 4 buổi. Lớp rời gồm sofa đôi, khung ảnh, lịch (để trống số), bảng ghim (trống / có giấy), radio (tắt / đang phát), hũ hẹn hò (đầy / vơi nửa / sắp hết / nắp mở) và cửa sổ mưa.
- **06 Cây hoa:** 6 loại đợt 1 (tulip, cúc họa mi, cẩm tú cầu, oải hương, sen chậu nước, anh đào), mỗi loại đủ gd1–gd5 + héo + bó hoa = 42 file. Thêm 4 chậu.
- **10 Giao diện 2D:** icon app 1024/512/192/180, màn hình chờ, 6 icon điều hướng × 3 trạng thái (thường, đang chọn của Anh, đang chọn của Em).

## Chưa có (các đợt sau trong brief)

- File `.blend`: môi trường này không có Blender. Mã nguồn trong `00_tham-chieu/xuong-3d` chính là "file gốc". Khi cần, có thể xuất GLB bằng GLTFExporter của three.js.
- Chuyển động dạng sprite sheet 12 khung/giây: app hiện dùng ảnh tĩnh + nhún nhẹ bằng CSS.
- Phối đồ (6 kiểu tóc, 10 áo...), 8 biểu cảm, thú lớn loài khác, thú nhỏ.
- Bếp, phòng Anh, phòng Em, góc sáng tạo, gác kỷ niệm dạng phóng to riêng. Trên bản đồ đã có các phòng này, chạm vào thì mở đúng chức năng.
- Đảo vương quốc 3D + 17 công trình, lễ hội (trừ tuyết dịp Noel), 54 món nội thất, sticker và huy hiệu vẽ lại.

## Render lại

Cần Chromium (Playwright) và three.js r169 đặt ở `./three`. Chạy một máy chủ tĩnh trong thư mục `xuong-3d`, rồi:

```
node run.js charjobs.js out_ch      # nhân vật + mèo
node run.js room.js out_room        # phòng khách: nền + lớp rời
node run.js map.js out_map          # bản đồ 4 buổi + mây
node run.js flora.js out_fl         # hoa 6 loại × 7 giai đoạn + chậu
node run.js brand.js out_brand      # icon app + màn hình chờ
python3 pack.py                     # đổi sang WebP cho app + ghi scene.json
```
