import { COZY, ROOM_MOODS } from "./cozy-palette.mjs";

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
// reserved: ô lối ra sân (thảm cửa ở mép trước), không đặt đồ đặc lên được.
export const ROOM = { id: "nha", w: 16, d: 14, wallH: 2.7, reserved: [[7, 13], [8, 13]] }; // 8 m × 7 m

export const CATEGORIES = [
  { id: "ghe", name: "Ghế & bàn" },
  { id: "ngu", name: "Giường & tủ" },
  { id: "bep", name: "Bếp" },
  { id: "choi", name: "Sở thích" },
  { id: "cay", name: "Cây & thảm" },
  { id: "vuon", name: "Vườn" },
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
  keSach:      { name: "Kệ sách thấp",    cat: "ngu",  kind: "floor", w: 3, d: 1, model: "F.bookshelfLow",
                 use: { type: "app", tab: "tu-dien", label: "Từ điển riêng" } },
  tuLanh:      { name: "Tủ lạnh",         cat: "bep",  kind: "floor", w: 2, d: 2, model: "OBJ.tulanh", states: ["", "mo"],
                 use: { type: "toggle", on: "mo", label: "Mở tủ lạnh" } },
  bepNau:      { name: "Bếp nấu",         cat: "bep",  kind: "floor", w: 2, d: 2, model: "OBJ.bepnau", scale: 0.97, states: ["", "nau"],
                 use: { type: "toggle", on: "nau", label: "Nấu ăn" } },
  huHenHo:     { name: "Hũ hẹn hò",       cat: "bep",  kind: "floor", w: 1, d: 1, model: "F.jar",
                 use: { type: "app", tab: "hom-nay", label: "Bốc thăm hẹn hò" } },
  loUocMo:     { name: "Lọ ước mơ",      cat: "choi", kind: "floor", w: 1, d: 1, model: "F.jar",
                 use: { type: "app", tab: "uoc-mo", label: "Ước mơ cùng nhau" } },
  giaVe:       { name: "Giá vẽ",          cat: "choi", kind: "floor", w: 2, d: 2, model: "OBJ.giave", off: [0, 0.27], states: ["trang", "ve", "xong"],
                 use: { type: "app", tab: "ve", label: "Vẽ tiếp sức" } },
  mayDanhChu:  { name: "Máy đánh chữ",    cat: "choi", kind: "floor", w: 2, d: 2, model: "OBJ.maydanhchu", states: ["", "giay"],
                 use: { type: "app", tab: "truyen", label: "Viết truyện nối" } },
  hopMau:      { name: "Bàn màu vẽ",      cat: "choi", kind: "floor", w: 2, d: 1, model: "OBJ.hopmau" },
  radio:       { name: "Đài nhỏ",         cat: "choi", kind: "floor", w: 1, d: 1, model: "F.radio", states: [false, true],
                 use: { type: "toggle", on: true, label: "Bật nhạc" } },
  tuKinh:      { name: "Tủ kính",         cat: "choi", kind: "floor", w: 3, d: 1, model: "OBJ.tukinh",
                 use: { type: "app", tab: "bao-tang", label: "Bảo tàng kỷ niệm" } },
  denCay:      { name: "Đèn cây",         cat: "cay",  kind: "floor", w: 1, d: 1, model: "F.floorLamp", states: [false, true],
                 use: { type: "toggle", on: true, label: "Bật đèn" } },
  trauBa:      { name: "Chậu trầu bà",    cat: "cay",  kind: "floor", w: 2, d: 2, model: "F.pothos" },
  chauLuoiHo:  { name: "Chậu lưỡi hổ",    cat: "cay",  kind: "floor", w: 2, d: 1, model: "plantPot", scale: 0.97 },
  keCay:       { name: "Kệ trắng ba tầng",          cat: "cay",  kind: "floor", w: 3, d: 1, model: "OBJ.kecay" },
  oMeo:        { name: "Ổ mèo",           cat: "cay",  kind: "floor", w: 2, d: 2, model: "F.petBed" },
  thamTron:    { name: "Thảm tròn hồng",  cat: "cay",  kind: "rug",   w: 4, d: 4, model: "rugRound", args: [1, "pinkL", "petal"] },
  thamVuong:   { name: "Thảm sọc xanh",   cat: "cay",  kind: "rug",   w: 4, d: 3, model: "rugRect", args: [2, 1.4, "sky2", "white"] },
  thamLon:     { name: "Thảm hoa lớn",    cat: "cay",  kind: "rug",   w: 6, d: 6, model: "F.rug", scale: 0.98 },
  // ---- ngoài sân (cat "ngoai": không hiện trong kho đồ trong nhà; xem world.mjs) ----
  nhaNgoai:    { name: "Ngôi nhà",        cat: "ngoai", kind: "floor", w: 14, d: 10, model: "W.house", use: { type: "enter", label: "Vào nhà" } },
  cayXanh:     { name: "Cây xanh",        cat: "ngoai", kind: "floor", w: 2, d: 2, model: "W.tree" },
  cayHoa:      { name: "Cây hoa anh đào", cat: "ngoai", kind: "floor", w: 2, d: 2, model: "W.blossom",
                 use: { type: "app", tab: "gifts", label: "Hộp quà dưới gốc cây" } },
  buiHoa:      { name: "Bụi hoa",         cat: "ngoai", kind: "floor", w: 1, d: 1, model: "W.flowers", args: ["pink"] },
  buiHoaVang:  { name: "Bụi hoa vàng",    cat: "ngoai", kind: "floor", w: 1, d: 1, model: "W.flowers", args: ["butter"] },
  bui:         { name: "Bụi cây",         cat: "ngoai", kind: "floor", w: 1, d: 1, model: "W.bush" },
  denDuong:    { name: "Đèn đường",       cat: "ngoai", kind: "floor", w: 1, d: 1, model: "W.lamp", states: [false, true],
                 use: { type: "toggle", on: true, label: "Bật đèn" } },
  hopThu:      { name: "Hộp thư",         cat: "ngoai", kind: "floor", w: 1, d: 1, model: "W.mailbox", states: [false, true],
                 use: { type: "app", tab: "thu", label: "Mở hộp thư" } },
  xichDu:      { name: "Xích đu",         cat: "ngoai", kind: "floor", w: 4, d: 2, model: "W.swing",
                 use: { type: "sit", seats: [{ x: -0.22, z: 0.02, a: 0, h: 0.58 }, { x: 0.22, z: 0.02, a: 0, h: 0.58 }] } },
  gheDa:       { name: "Ghế dài",         cat: "ngoai", kind: "floor", w: 3, d: 1, model: "W.bench",
                 use: { type: "sit", seats: [{ x: -0.35, z: 0.02, a: 0, h: 0.46 }, { x: 0.35, z: 0.02, a: 0, h: 0.46 }] } },
  quayCafe:    { name: "Quầy cà phê",     cat: "ngoai", kind: "floor", w: 4, d: 2, model: "W.kiosk", use: { type: "cafe", label: "Gọi đồ uống" } },
  duongDa:     { name: "Đá lát đường",    cat: "ngoai", kind: "rug",   w: 2, d: 2, model: "W.stone" },
  benThuyen:   { name: "Bến thuyền",      cat: "ngoai", kind: "rug",   w: 3, d: 6, model: "W.dock", use: { type: "app", tab: "vuong-quoc", label: "Ghé Vương quốc" } },
  bangTen:     { name: "Bảng tên",        cat: "ngoai", kind: "floor", w: 3, d: 1, model: "W.sign" },
  // garden: gieo hạt, tưới, cây lớn theo giờ thật (xem garden.mjs); trạng thái cây nằm ở item.plant.
  luongTrong:  { name: "Luống trồng",     cat: "vuon", kind: "floor", w: 3, d: 2, model: "gardenBed", use: { type: "garden" } },
  chauTrong:   { name: "Chậu trồng",      cat: "vuon", kind: "floor", w: 1, d: 1, model: "gardenPot", use: { type: "garden" } },
  cuaSo:       { name: "Cửa sổ mây",      cat: "tuong",kind: "wall",  w: 3, y: 1.55, model: "F.windowW", scale: 0.97 },
  khungAnh:    { name: "Khung ảnh",       cat: "tuong",kind: "wall",  w: 2, y: 1.5,  model: "F.photoFrame",
                  use: { type: "app", tab: "bao-tang", label: "📸 Thêm ảnh và kỷ vật" } },
  bangGhim:    { name: "Bảng ghim",       cat: "tuong",kind: "wall",  w: 2, y: 1.45, model: "F.corkboard", scale: 0.9,
                 use: { type: "app", tab: "bo-luat", label: "Bộ luật của hai đứa" } },
  lich:        { name: "Lịch hẹn",        cat: "tuong",kind: "wall",  w: 2, y: 1.45, model: "F.calendar" },
  banDo:       { name: "Bản đồ thế giới", cat: "tuong",kind: "wall",  w: 3, y: 1.5,  model: "OBJ.bandogioi",
                 use: { type: "app", tab: "ban-do", label: "Bản đồ kỷ niệm" } }
};

// Màu tường / sàn (giá trị số để Node và three.js dùng chung).
export const WALL_COLORS = [
  { id: "may",   name: "Mây",       wall: 0xEAF5FF },
  { id: "mint",  name: "Xanh mint", wall: COZY.mintWall },
  { id: "babyblue", name: "Baby blue", wall: COZY.blueWall },
  { id: "hong",  name: "Hồng phấn", wall: 0xFFE6F0 },
  { id: "bo",    name: "Bơ",        wall: 0xFFF3C9 },
  { id: "la",    name: "Lá non",    wall: 0xDDF3E4 },
  { id: "oaihuong", name: "Oải hương", wall: 0xE9E0FA }
];
export const FLOOR_COLORS = [
  { id: "go",    name: "Gỗ sáng",   floor: 0xE8C9A0, plank: 0xDDB98C },
  { id: "mint",  name: "Gạch mint", floor: COZY.mintFloor, plank: COZY.mintGrout },
  { id: "godam", name: "Gỗ trầm",   floor: 0xC99B6D, plank: 0xB58758 },
  { id: "da",    name: "Đá trắng",  floor: 0xF4F7FB, plank: 0xDCE6F2 },
  { id: "hong",  name: "Gạch hồng", floor: 0xFFD9E6, plank: 0xF7C2D5 }
];

// Bố cục mặc định: một phòng 8 × 7 m có góc khách, góc ngủ, góc bếp, góc sáng tạo.
// gx, gz = ô góc trên-trái của dấu chân sau khi xoay; r = số lần xoay 90°.
export const DEFAULT_LAYOUT = {
  v: 1,
  wall: ROOM_MOODS.nha.wall,
  floor: ROOM_MOODS.nha.floor,
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
    { uid: "d5", type: "mayDanhChu",  gx: 5,  gz: 0,  r: 0 },
    { uid: "d6", type: "loUocMo",     gx: 9,  gz: 0,  r: 0 },
    { uid: "e1", type: "tuKinh",      gx: 0,  gz: 7,  r: 0 },
    { uid: "g2", type: "chauTrong",   gx: 14, gz: 12, r: 0 },
    { uid: "w1", type: "cuaSo",       wall: "R", at: 5, r: 0 },
    { uid: "w2", type: "khungAnh",    wall: "L", at: 6, r: 0 },
    { uid: "w3", type: "lich",        wall: "R", at: 10, r: 0 },
    { uid: "w4", type: "bangGhim",    wall: "L", at: 11, r: 0 },
    { uid: "w5", type: "banDo",       wall: "L", at: 0, r: 0 }
  ]
};

