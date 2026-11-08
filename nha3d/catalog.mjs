// Danh mục đồ cho bản thử nhà 3D. Dữ liệu thuần (không phụ thuộc three.js) để test được bằng Node.
// Kích thước ô (w × d, mỗi ô 0,5 m) lấy từ hộp bao thật của mô hình trong _xuong-3d (đo ngày 2026-11-08);
// tests/staging/nha3d-engine.test.mjs và tests/browser/nha3d.spec.mjs kiểm tra lại cho khớp.
//
// kind: "floor" (vật đặc, chặn đường đi), "rug" (thảm, đi qua được, chỉ không chồng thảm khác),
//       "wall" (treo tường trái "L" hoặc phải "R", y = độ cao tâm).
// off: dịch mô hình (m) để hộp bao nằm giữa ô; scale: thu nhỏ nhẹ cho vừa ô.
// use: tương tác khi chạm ở chế độ Chơi.
//   sit   → seats: [{x, z, a, h}] toạ độ cục bộ (m), a = hướng mặt (0 = nhìn +z), h = cao mặt ghế
//   sleep → đổi sang trạng thái "ngu" (mô hình giường đã có người nằm)
//   toggle→ on: trạng thái khi bật, label: chữ trên nút
//   cycle → states: [...] vòng trạng thái
//   wardrobe → mở tủ phối đồ

export const CELL = 0.5;
export const ROOM = { w: 16, d: 14, wallH: 2.7 }; // 8 m × 7 m

export const CATEGORIES = [
  { id: "ghe", name: "Ghế & bàn" },
  { id: "ngu", name: "Giường & tủ" },
  { id: "bep", name: "Bếp" },
  { id: "choi", name: "Sở thích" },
  { id: "cay", name: "Cây & thảm" },
  { id: "tuong", name: "Treo tường" }
];

export const CATALOG = {
  sofa:        { name: "Sofa mây",        cat: "ghe",  kind: "floor", w: 5, d: 2, model: "F.sofa",
                 use: { type: "sit", seats: [{ x: -0.43, z: 0.12, a: 0, h: 0.62 }, { x: 0.43, z: 0.12, a: 0, h: 0.62 }] } },
  banTra:      { name: "Bàn trà tròn",    cat: "ghe",  kind: "floor", w: 2, d: 2, model: "F.coffeeTable", scale: 0.9 },
  banAn:       { name: "Bàn ăn hai ghế",  cat: "ghe",  kind: "floor", w: 5, d: 2, model: "OBJ.banan", states: ["", "baymon"],
                 use: { type: "sit", seats: [{ x: -0.85, z: 0, a: Math.PI / 2, h: 0.48 }, { x: 0.85, z: 0, a: -Math.PI / 2, h: 0.48 }] } },
  dem:         { name: "Đệm ngồi",        cat: "ghe",  kind: "floor", w: 1, d: 1, model: "F.cushion", scale: 0.78,
                 use: { type: "sit", seats: [{ x: 0, z: 0, a: 0, h: 0.11 }] } },
  banLamViec:  { name: "Bàn làm việc",    cat: "choi", kind: "floor", w: 3, d: 3, model: "OBJ.banlamviec", off: [-0.025, -0.245], states: ["", "sang"],
                 use: { type: "sit", seats: [{ x: 0.075, z: 0.355, a: Math.PI, h: 0.48 }], toggle: "sang" } },
  giuong:      { name: "Giường xanh",     cat: "ngu",  kind: "floor", w: 3, d: 4, model: "OBJ.giuong", scale: 0.96, off: [0, 0.035], states: ["", "ngu"],
                 use: { type: "sleep" } },
  tuDo:        { name: "Tủ quần áo",      cat: "ngu",  kind: "floor", w: 2, d: 2, model: "OBJ.tudo", scale: 0.9, off: [0, -0.03], states: ["", "mo"],
                 use: { type: "wardrobe", label: "Thay đồ" } },
  banTrangDiem:{ name: "Bàn trang điểm",  cat: "ngu",  kind: "floor", w: 2, d: 2, model: "OBJ.bantrangdiem", off: [0, -0.25],
                 use: { type: "sit", seats: [{ x: 0, z: 0.3, a: Math.PI, h: 0.44 }] } },
  ruong:       { name: "Rương kỷ niệm",   cat: "ngu",  kind: "floor", w: 2, d: 2, model: "OBJ.ruong", scale: 0.97, states: ["", "mo"],
                 use: { type: "toggle", on: "mo", label: "Mở rương" } },
  keSach:      { name: "Kệ sách thấp",    cat: "ngu",  kind: "floor", w: 3, d: 1, model: "F.bookshelfLow" },
  tuLanh:      { name: "Tủ lạnh",         cat: "bep",  kind: "floor", w: 2, d: 2, model: "OBJ.tulanh", states: ["", "mo"],
                 use: { type: "toggle", on: "mo", label: "Mở tủ lạnh" } },
  bepNau:      { name: "Bếp nấu",         cat: "bep",  kind: "floor", w: 2, d: 2, model: "OBJ.bepnau", scale: 0.97, states: ["", "nau"],
                 use: { type: "toggle", on: "nau", label: "Nấu ăn" } },
  huHenHo:     { name: "Hũ hẹn hò",       cat: "bep",  kind: "floor", w: 1, d: 1, model: "F.jar",
                 use: { type: "date", label: "Bốc thăm hẹn hò" } },
  giaVe:       { name: "Giá vẽ",          cat: "choi", kind: "floor", w: 2, d: 2, model: "OBJ.giave", off: [0, 0.27], states: ["trang", "ve", "xong"],
                 use: { type: "cycle", states: ["trang", "ve", "xong"], label: "Vẽ tiếp" } },
  mayDanhChu:  { name: "Máy đánh chữ",    cat: "choi", kind: "floor", w: 2, d: 2, model: "OBJ.maydanhchu", states: ["", "giay"],
                 use: { type: "toggle", on: "giay", label: "Viết thư" } },
  hopMau:      { name: "Bàn màu vẽ",      cat: "choi", kind: "floor", w: 2, d: 1, model: "OBJ.hopmau" },
  radio:       { name: "Đài nhỏ",         cat: "choi", kind: "floor", w: 1, d: 1, model: "F.radio", states: [false, true],
                 use: { type: "toggle", on: true, label: "Bật nhạc" } },
  tuKinh:      { name: "Tủ kính",         cat: "choi", kind: "floor", w: 3, d: 1, model: "OBJ.tukinh" },
  denCay:      { name: "Đèn cây",         cat: "cay",  kind: "floor", w: 1, d: 1, model: "F.floorLamp", states: [false, true],
                 use: { type: "toggle", on: true, label: "Bật đèn" } },
  trauBa:      { name: "Chậu trầu bà",    cat: "cay",  kind: "floor", w: 2, d: 2, model: "F.pothos" },
  chauLuoiHo:  { name: "Chậu lưỡi hổ",    cat: "cay",  kind: "floor", w: 2, d: 1, model: "plantPot", scale: 0.97 },
  keCay:       { name: "Kệ trắng ba tầng",          cat: "cay",  kind: "floor", w: 3, d: 1, model: "OBJ.kecay" },
  oMeo:        { name: "Ổ mèo",           cat: "cay",  kind: "floor", w: 2, d: 2, model: "F.petBed" },
  thamTron:    { name: "Thảm tròn hồng",  cat: "cay",  kind: "rug",   w: 4, d: 4, model: "rugRound", args: [1, "pinkL", "petal"] },
  thamVuong:   { name: "Thảm sọc xanh",   cat: "cay",  kind: "rug",   w: 4, d: 3, model: "rugRect", args: [2, 1.4, "sky2", "white"] },
  thamLon:     { name: "Thảm hoa lớn",    cat: "cay",  kind: "rug",   w: 6, d: 6, model: "F.rug", scale: 0.98 },
  cuaSo:       { name: "Cửa sổ mây",      cat: "tuong",kind: "wall",  w: 3, y: 1.55, model: "F.windowW", scale: 0.97 },
  khungAnh:    { name: "Khung ảnh",       cat: "tuong",kind: "wall",  w: 2, y: 1.5,  model: "F.photoFrame" },
  bangGhim:    { name: "Bảng ghim",       cat: "tuong",kind: "wall",  w: 2, y: 1.45, model: "F.corkboard", args: [true], scale: 0.9 },
  lich:        { name: "Lịch hẹn",        cat: "tuong",kind: "wall",  w: 2, y: 1.45, model: "F.calendar" },
  banDo:       { name: "Bản đồ thế giới", cat: "tuong",kind: "wall",  w: 3, y: 1.5,  model: "OBJ.bandogioi" }
};

// Màu tường / sàn (giá trị số để Node và three.js dùng chung).
export const WALL_COLORS = [
  { id: "may",   name: "Mây",       wall: 0xEAF5FF },
  { id: "hong",  name: "Hồng phấn", wall: 0xFFE6F0 },
  { id: "bo",    name: "Bơ",        wall: 0xFFF3C9 },
  { id: "la",    name: "Lá non",    wall: 0xDDF3E4 },
  { id: "oaihuong", name: "Oải hương", wall: 0xE9E0FA }
];
export const FLOOR_COLORS = [
  { id: "go",    name: "Gỗ sáng",   floor: 0xE8C9A0, plank: 0xDDB98C },
  { id: "godam", name: "Gỗ trầm",   floor: 0xC99B6D, plank: 0xB58758 },
  { id: "da",    name: "Đá trắng",  floor: 0xF4F7FB, plank: 0xDCE6F2 },
  { id: "hong",  name: "Gạch hồng", floor: 0xFFD9E6, plank: 0xF7C2D5 }
];

// Bố cục mặc định: một phòng 8 × 7 m có góc khách, góc ngủ, góc bếp, góc sáng tạo.
// gx, gz = ô góc trên-trái của dấu chân sau khi xoay; r = số lần xoay 90°.
export const DEFAULT_LAYOUT = {
  v: 1,
  wall: "may",
  floor: "go",
  items: [
    { uid: "a1", type: "thamTron",    gx: 6,  gz: 7,  r: 0 },
    { uid: "a2", type: "sofa",        gx: 5,  gz: 6,  r: 0 },
    { uid: "a3", type: "banTra",      gx: 7,  gz: 9,  r: 0 },
    { uid: "a4", type: "denCay",      gx: 4,  gz: 6,  r: 0 },
    { uid: "a5", type: "trauBa",      gx: 10, gz: 6,  r: 0 },
    { uid: "b1", type: "giuong",      gx: 0,  gz: 0,  r: 0 },
    { uid: "b2", type: "tuDo",        gx: 3,  gz: 0,  r: 0 },
    { uid: "b3", type: "oMeo",        gx: 0,  gz: 5,  r: 0 },
    { uid: "c1", type: "tuLanh",      gx: 14, gz: 0,  r: 0 },
    { uid: "c2", type: "bepNau",      gx: 12, gz: 0,  r: 0 },
    { uid: "c3", type: "banAn",       gx: 11, gz: 4,  r: 0 },
    { uid: "c4", type: "huHenHo",     gx: 10, gz: 0,  r: 0 },
    { uid: "d1", type: "giaVe",       gx: 7,  gz: 0,  r: 0 },
    { uid: "d2", type: "keSach",      gx: 0,  gz: 9,  r: 1 },
    { uid: "d3", type: "radio",       gx: 9,  gz: 1,  r: 0 },
    { uid: "d4", type: "dem",         gx: 2,  gz: 12, r: 0 },
    { uid: "w1", type: "cuaSo",       wall: "R", at: 5, r: 0 },
    { uid: "w2", type: "khungAnh",    wall: "L", at: 6, r: 0 },
    { uid: "w3", type: "lich",        wall: "R", at: 10, r: 0 },
    { uid: "w4", type: "bangGhim",    wall: "L", at: 11, r: 0 }
  ]
};
