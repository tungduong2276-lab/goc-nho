# M1 — Đề xuất vùng sàn nội thất, chưa phê duyệt

Đã kiểm tra ảnh tĩnh sáu phòng từ GitHub Actions (390px) và thiết kế hai điểm đề xuất trên sàn cho mỗi phòng, thay cho **tọa độ đứng của nhân vật** trong phần thử nghiệm riêng biệt. Dữ liệu nằm ở `src/house-floor-review.mjs`, **không sửa `assets/3d/scene.json`**, không dùng Firebase. Chỉ `experiments/house-placement-ui.mjs` sử dụng dữ liệu này, không có liên kết trên app chính.

## Tọa độ xem xét (1170×1170 source px)

| Phòng | Đề xuất 1 | Đề xuất 2 | Nhận xét |
|---|---|---|---|
| Phòng khách | (300,705) | (855,765) | Bên trái sát khu ghế/đệm, bên phải cần tránh đồ sẵn có |
| Bếp | (300,725) | (640,910) | Đề xuất khu sàn trái và phía trước bàn ăn |
| Phòng Anh | (270,740) | (825,765) | Hai phía quanh nhân vật, cần kiểm tra đồ lớn |
| Phòng Em | (315,750) | (825,765) | Hai bên sàn thay vì hai điểm đứng liền nhau |
| Góc sáng tạo | (300,755) | (480,855) | Điểm phía trước sàn; vật dụng lớn có thể chồng khu vẽ |
| Gác kỷ niệm | (270,730) | (840,765) | Tránh tâm nhân vật; chướng ngại ảnh tĩnh chưa có mesh |

**Chỉ là vị trí trung tâm ước lượng từ ảnh. Không coi là vùng an toàn, không chứng minh được footprint hoặc va chạm với đồ được render sẵn.** Phải duyệt lại từng vị trí theo loại vật dụng và ảnh ở nhiều thời điểm trước phát hành.

## Chốt an toàn đã có

- `makeFloorProposalPreview()` xác minh đủ chính xác 6 phòng và 2 điểm/phòng, điểm hữu hạn và nằm trong ảnh gốc.
- Chặn khoảng cách dưới **160 source px giữa hai điểm trong cùng phòng**, dưới **120 source px từ bất kỳ điểm đứng nhân vật** (đây chỉ là kiểm tra tâm, không phải mesh collision).
- Mỗi điểm gắn `PROPOSED_NOT_APPROVED`; `canPersist:false`, giao diện chỉ lưu ở RAM; kiểm tra negative trong `tests/staging/m1-floor-review.test.mjs`.
- Không thay đổi Security Rules, backend, sản phẩm hiện đang dùng hoặc triển khai sản xuất.

## Hạng mục còn thiếu

1. Nghiệm thu thủ công cả sáu phòng và đánh dấu polygon vùng sàn/footprint cho từng nhóm vật dụng, tính chồng lấn với sofa, tủ, bàn, thảm và nhân vật.
2. Tạo review ảnh của từng loại vật dụng theo tỉ lệ/tầng vẽ/z-order; nếu sai phải sửa tọa độ trên nhánh riêng.
3. Vẫn phải hoàn tất M0: staging managed export/restore độc lập, kiểm tra deployed Rules/Auth/App Check/IAM/rollback. Không phát hành hoặc lưu M1 lên Firebase trước khi đạt.
