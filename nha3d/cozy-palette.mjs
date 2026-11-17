// Bảng màu duy nhất cho phần kiến trúc Góc Nhỏ 3D; không đụng vào dữ liệu đã lưu.
// Ba tông chủ đạo: mint nhẹ, hồng phấn, baby blue. Màu nhấn đậm hơn để nhìn rõ ở điện thoại.
export const COZY = Object.freeze({
  mintWall: 0xD9F8ED, pinkWall: 0xFFE6F0, blueWall: 0xDCEEFF,
  mint: 0xA4E6D0, pink: 0xF8B6D0, blue: 0xACD9FB,
  mintFloor: 0xEBFCF5, mintGrout: 0xCFEFE3,
  cream: 0xFFFDF7
});

// Chỉ là lựa chọn mặc định cho bố cục MỚI, không ép màu của phòng đã lưu.
export const ROOM_MOODS = Object.freeze({
  nha: { wall: "mint", floor: "go", accent: 0 },
  "hanh-lang": { wall: "mint", floor: "da", accent: 0 },
  ngu: { wall: "hong", floor: "hong", accent: 1 },
  bep: { wall: "babyblue", floor: "da", accent: 2 },
  "bao-tang": { wall: "mint", floor: "da", accent: 0 },
  xuong: { wall: "babyblue", floor: "mint", accent: 2 },
  "phong-choi": { wall: "hong", floor: "mint", accent: 1 }
});
