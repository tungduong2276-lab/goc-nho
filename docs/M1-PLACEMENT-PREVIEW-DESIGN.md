# M1 — Thử nghiệm đặt đồ nội thất trong bộ nhớ (CHƯA bật cho người dùng)

## Mục đích

`src/house-placement-preview.mjs` là mô hình trạng thái độc lập giúp thiết kế M1 mà không tác động app đang dùng. Mô hình hỗ trợ bốn loại đồ thử (`chair`, `lamp`, `plant`, `rug`), 6 phòng, tối đa hai **vị trí ứng viên** hiện có cho mỗi phòng, các thao tác đặt, di chuyển, xoay, cất đồ và hoàn tác tối đa 20 lần. Mọi phép biến đổi trả về một snapshot mới. Có kiểm tra ID trùng và không cho hai đồ chiếm cùng một vị trí.

**Cảnh báo quan trọng:** hai vị trí ứng viên của mỗi phòng hiện lấy từ metadata `dung` (điểm nhân vật đứng) trong `assets/3d/scene.json`. Chúng **KHÔNG phải** vị trí đồ nội thất được duyệt: nhân vật hoặc đồ đã vẽ sẵn có thể che khuất. Các vị trí được đánh dấu `VISUAL_APPROVAL_REQUIRED`. Không dùng nguyên trạng vào UI production, không khẳng định kiểm tra được va chạm với các vật thể đã có trong ảnh 3D prerender.

## Phạm vi an toàn

- Mọi trạng thái chỉ tồn tại trong đối tượng JavaScript; không có Firebase SDK, localStorage, network, service worker, writes hoặc migrations.
- Không thay đổi `index.html`, assets, kích thước phòng hay Firestore Rules.
- `protocol: "LOCAL_PREVIEW_ONLY"`, `canPersist: false` nhằm phân biệt bản nháp với phiên bản lưu thật.
- Thử nghiệm bằng `npm run test:staging`, gồm dữ liệu giả lập, từ chối room/slot/type sai, va chạm, ID trùng, hoàn tác/khôi phục trạng thái.

## Trước khi dùng trong trang trí Nhà 3D

1. Xem ảnh xem trước từng phòng ở `docs/M0-HOUSE-VISUAL-REVIEW.md`, thiết kế lại vị trí thực sự trống trên sàn (không lấy chỗ nhân vật), ghi rõ vùng và khoảng cách đồ.
2. Mở rộng hình học và tạo thêm các vị trí đã duyệt nếu cần. Phòng hiện là ảnh 1170×1170 được render sẵn, không phải thế giới 3D động.
3. Dựng giao diện preview local-only có nút bật riêng, không tự động sử dụng dữ liệu người dùng.
4. Xác minh staging managed export/restore thật, quyền Firebase production hiện triển khai, và giao thức M0 versioned-write có Rules đã rà soát, rồi mới thiết kế luồng lưu M1 bật bằng cờ mặc định tắt.
5. Test đồng thời hai client, offline/retry, revision stale, rollback và hiển thị trên 360/390/430px.

**Không được coi việc mô hình preview chạy qua CI là bằng chứng đã triển khai trang trí Nhà 3D hoặc dữ liệu đang được đồng bộ.**
