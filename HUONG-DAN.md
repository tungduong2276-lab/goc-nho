# Cập nhật bản mới (đã cài app từ trước)

Làm 2 việc, khoảng 5 phút:

1. **Dán lại Rules.** Vào Firebase → Firestore → tab **Rules** → xoá hết → dán toàn bộ nội dung file `firestore.rules` mới → bấm **Publish**. Thiếu bước này thì nút Rời nhà và Chuyển nhà sẽ báo "Firebase từ chối".
2. **Tải code mới lên GitHub.** Trong repo `goc-nho`, bấm **Add file → Upload files**, kéo vào: `index.html`, `sw.js`, `HUONG-DAN.md`, `firestore.rules` và **cả thư mục `assets`** → **Commit changes**. Đợi 1–2 phút, rồi đóng hẳn app trên điện thoại và mở lại 1–2 lần.

Không cần sửa `firebase-config.js`, dữ liệu cũ giữ nguyên.

---

# Cài "Góc Nhỏ" thành app riêng trên điện thoại

Mất khoảng 20–30 phút, làm trên máy tính sẽ dễ nhất. Tất cả đều miễn phí.

Thư mục này gồm:

| File | Dùng để |
|---|---|
| `index.html` | Toàn bộ app |
| `firebase-config.js` | Nơi bạn dán cấu hình Firebase (bước 1) |
| `firestore.rules` | Quy tắc bảo mật, dán vào Firebase (bước 1) |
| thư mục `assets` | Hình nhân vật và căn phòng |
| `manifest.webmanifest`, `sw.js`, các file `.png` | Giúp app cài được lên màn hình chính và mở được khi mạng yếu |

---

## Bước 0. Sao lưu dữ liệu ở bản cũ

1. Mở app Hũ Hẹn Hò trên claude.ai.
2. Bấm **Cài đặt** → **Tải bản sao lưu** → đồng ý lưu file.
3. Giữ file `hu-hen-ho-sao-luu-....json` này lại. Bước 4 sẽ dùng đến.

## Bước 1. Tạo Firebase (nơi lưu và đồng bộ dữ liệu)

1. Vào **console.firebase.google.com**, đăng nhập bằng Gmail.
2. **Create a project** (Tạo dự án), đặt tên ví dụ `hu-hen-ho`. Google Analytics có thể tắt.
3. Trong dự án, bấm biểu tượng **Web `</>`** để thêm app web. Đặt tên gì cũng được, **không** cần tích Firebase Hosting. Bấm Register.
4. Firebase hiện ra một đoạn `const firebaseConfig = { ... }`. Mở file `firebase-config.js` trong thư mục này và chép từng giá trị vào đúng chỗ (`apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`). Lưu file.
   - Lỡ đóng mất đoạn đó thì xem lại ở: bánh răng **Project settings** → **General** → kéo xuống **Your apps**.
5. Menu bên trái: **Build → Authentication** → **Get started** → tab **Sign-in method** → chọn **Email/Password** → bật **Enable** → **Save**.
6. Menu bên trái: **Build → Firestore Database** → **Create database**.
   - Vị trí (location): chọn **asia-southeast1 (Singapore)** cho nhanh ở Việt Nam.
   - Chế độ: chọn **production mode**.
7. Vẫn trong Firestore, mở tab **Rules**. Xoá hết nội dung cũ, dán toàn bộ nội dung file `firestore.rules`, rồi bấm **Publish**.

Gói miễn phí (Spark) dư sức cho hai người dùng.

## Bước 2. Đưa app lên mạng (chọn một cách)

### Cách A: GitHub Pages (không cần cài gì)

1. Tạo tài khoản ở **github.com** nếu chưa có.
2. Bấm **New repository**, đặt tên ví dụ `hu-hen-ho`, chọn **Public**, bấm **Create repository**.
3. Bấm **uploading an existing file**, kéo thả **tất cả file trong thư mục này** (không kéo cả thư mục), rồi bấm **Commit changes**.
4. Vào **Settings → Pages**. Ở mục Branch chọn **main** và thư mục **/ (root)**, bấm **Save**.
5. Đợi 1–2 phút, trang sẽ hiện địa chỉ dạng `https://ten-ban.github.io/hu-hen-ho/`. Đó là địa chỉ app của hai bạn.

> Cấu hình Firebase nằm công khai trên GitHub là bình thường, vì nó không phải mật khẩu. Dữ liệu được bảo vệ bằng quy tắc ở bước 1.7: chỉ hai người trong nhà mới đọc và ghi được.

### Cách B: Firebase Hosting (nếu máy đã có Node.js)

Mở Terminal trong thư mục này rồi chạy lần lượt:

```
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

Khi `init` hỏi: chọn dự án vừa tạo, thư mục public gõ `.`, câu "single-page app" trả lời **No**, và **không** ghi đè `index.html`. Địa chỉ app sẽ là `https://ten-du-an.web.app`.

## Bước 3. Cài lên điện thoại

Mở địa chỉ app trên điện thoại:

- **iPhone:** bắt buộc mở bằng **Safari**. Bấm nút **Chia sẻ** (ô vuông có mũi tên) → **Thêm vào MH chính** → **Thêm**.
- **Android:** mở bằng **Chrome**. Bấm menu **⋮** → **Cài đặt ứng dụng** (hoặc **Thêm vào màn hình chính**).

Từ giờ mở app bằng biểu tượng chậu cây trên màn hình chính. App chạy toàn màn hình như app thật.

> Trên iPhone, app trên màn hình chính có bộ nhớ riêng với Safari. Vì vậy hãy đăng nhập **bên trong app** sau khi cài, không đăng nhập ở Safari rồi mới cài.

## Bước 4. Ghép đôi và chuyển dữ liệu

1. **Người thứ nhất** mở app → **Tạo tài khoản** (email + mật khẩu) → **Tạo nhà mới**. App hiện một **mã nhà 6 chữ**.
2. Người thứ nhất vào **Cài đặt** → **Nhập bản sao lưu** → chọn file đã tải ở bước 0 → **Nhập dữ liệu**. Toàn bộ buổi hẹn, ảnh, vườn, vương quốc… sẽ về đủ.
3. Gửi mã nhà cho **người thứ hai**. Người này cài app, **Tạo tài khoản** bằng email của mình → chọn **Vào nhà** → nhập mã.
4. Xong. Hai máy đồng bộ với nhau ngay lập tức. App tự biết ai là ai, không cần chọn "Điện thoại này của ai" nữa.
5. Nếu tên hai người đang hiện "Anh & Em", vào **Cài đặt** đổi tên lại.

---

## Khi gặp trục trặc

- **App báo "Chưa kết nối Firebase":** file `firebase-config.js` chưa được điền, hoặc chưa được tải lên cùng `index.html`.
- **Báo "Firebase từ chối truy cập":** chưa dán quy tắc ở bước 1.7, hoặc dán chưa xong mà quên bấm Publish.
- **Đăng nhập báo lỗi ngay:** kiểm tra lại bước 1.5 (bật Email/Password).
- **Sửa code xong mà điện thoại chưa thấy bản mới:** đóng hẳn app rồi mở lại 1–2 lần.
- **Quên mật khẩu:** ở màn hình đăng nhập, gõ email rồi bấm **Quên mật khẩu?**. Firebase sẽ gửi thư đặt lại mật khẩu.

## Ghép nhà: các tình huống hay gặp

- **Cả hai lỡ cùng tạo nhà:** chỉ một người cần chuyển, nên là người chưa thêm gì nhiều. Ở trang Nhà, dưới mã nhà, bấm **"Bạn ấy cũng lỡ tạo nhà rồi? Vào nhà của bạn ấy"**, nhập mã nhà của người kia, rồi bấm **Chuyển nhà**. Không cần tạo tài khoản mới. Muốn mang dữ liệu theo, bấm **Tải bản sao lưu** trước khi chuyển, sang nhà mới thì vào **Cài đặt → Nhập bản sao lưu**.
- **Muốn rời nhà:** vào **Cài đặt → Rời nhà**. Người kia vẫn ở lại và giữ toàn bộ dữ liệu. Muốn quay lại thì nhập lại đúng mã nhà cũ; app tự nhận lại đúng vai của bạn, không bị lẫn với người kia.
- **Nhà chỉ còn một người mà người đó rời đi:** nhà bị bỏ trống, mã nhà bị xoá luôn để không ai khác vào được. Dữ liệu trong đó không lấy lại được, nên nhớ tải bản sao lưu trước.
- **Một người mất tài khoản (quên email, mất mật khẩu không lấy lại được):** người còn lại vào **Cài đặt** → bấm **"... mất tài khoản?"** → **Mời tài khoản cũ ra**. Người kia tạo tài khoản mới, nhập mã nhà là vào lại đúng chỗ cũ, dữ liệu còn nguyên.
- **Nhập mã báo "không tìm thấy":** kiểm tra lại từng chữ. Mã không phân biệt chữ hoa/thường, có dấu cách cũng được.
- **Nhập mã báo "đã đủ hai người":** nhà đó đã có hai người. Một người phải Rời nhà trước.
- **Đổi ai là cậu bé, ai là cô bé trong căn phòng:** **Cài đặt → Nhân vật trong nhà**.
