// Thế giới mở (V3, xem đầu docs/GOC-NHO-MASTER-ROADMAP.md): đảo ngoài sân + trong nhà, nối bằng cửa trước.
// Dữ liệu thuần, không phụ thuộc three.js. Toạ độ ô giống catalog.mjs: mỗi ô 0,5 m, gốc ở giữa cảnh.
import { CELL, ROOM } from "./catalog.mjs";

// Sân 22 m × 18 m. Nhà (14 × 10 ô) nằm giữa phía sau; cửa trước ở giữa mặt trước.
export const HOUSE_AT = { gx: 15, gz: 2, w: 14, d: 10 };
export const DEFAULT_YARD = {
  v: 1, wall: "may", floor: "go",
  items: [
    { uid: "y-nha", type: "nhaNgoai", gx: 15, gz: 2, r: 0 },
    // lối đá từ cửa xuống bến
    { uid: "y-p1", type: "duongDa", gx: 21, gz: 13, r: 0 },
    { uid: "y-p2", type: "duongDa", gx: 21, gz: 16, r: 0 },
    { uid: "y-p3", type: "duongDa", gx: 21, gz: 19, r: 0 },
    { uid: "y-p4", type: "duongDa", gx: 23, gz: 22, r: 0 },
    { uid: "y-p5", type: "duongDa", gx: 26, gz: 25, r: 0 },
    { uid: "y-p6", type: "duongDa", gx: 29, gz: 28, r: 0 },
    { uid: "y-p7", type: "duongDa", gx: 18, gz: 22, r: 0 },
    { uid: "y-p8", type: "duongDa", gx: 14, gz: 24, r: 0 },
    // vườn bên trái trước nhà
    { uid: "y-g1", type: "luongTrong", gx: 4, gz: 14, r: 0 },
    { uid: "y-g2", type: "luongTrong", gx: 9, gz: 14, r: 0 },
    { uid: "y-g3", type: "luongTrong", gx: 4, gz: 18, r: 0 },
    { uid: "y-g4", type: "luongTrong", gx: 9, gz: 18, r: 0 },
    { uid: "y-g5", type: "chauTrong", gx: 14, gz: 15, r: 0 },
    { uid: "y-g6", type: "chauTrong", gx: 14, gz: 18, r: 0 },
    // hoa, cây quanh nhà
    { uid: "y-f1", type: "buiHoa", gx: 17, gz: 12, r: 0 },
    { uid: "y-f2", type: "buiHoaVang", gx: 26, gz: 12, r: 0 },
    { uid: "y-f3", type: "bui", gx: 14, gz: 11, r: 0 },
    { uid: "y-f4", type: "bui", gx: 29, gz: 11, r: 0 },
    { uid: "y-t1", type: "cayXanh", gx: 3, gz: 3, r: 0 },
    { uid: "y-t2", type: "cayHoa", gx: 9, gz: 5, r: 0 },
    { uid: "y-t3", type: "cayXanh", gx: 36, gz: 4, r: 0 },
    { uid: "y-t4", type: "cayHoa", gx: 39, gz: 14, r: 0 },
    { uid: "y-t5", type: "cayXanh", gx: 2, gz: 29, r: 0 },
    { uid: "y-m1", type: "hopThu", gx: 24, gz: 14, r: 0 },
    { uid: "y-l1", type: "denDuong", gx: 20, gz: 20, r: 0 },
    { uid: "y-l2", type: "denDuong", gx: 28, gz: 25, r: 0 },
    // góc chơi bên phải
    { uid: "y-s1", type: "xichDu", gx: 32, gz: 15, r: 0 },
    { uid: "y-b1", type: "gheDa", gx: 33, gz: 20, r: 0 },
    // quán cà phê nhỏ bên trái phía trước
    { uid: "y-c1", type: "quayCafe", gx: 6, gz: 24, r: 0 },
    { uid: "y-c2", type: "banAn", gx: 6, gz: 29, r: 0 },
    { uid: "y-n1", type: "bangTen", gx: 17, gz: 25, r: 0 },
    // bến thuyền ở mép trước bên phải
    { uid: "y-d1", type: "benThuyen", gx: 31, gz: 30, r: 0 }
  ]
};
export const YARD = { id: "san", w: 44, d: 36, wallH: 0, defaultLayout: DEFAULT_YARD };

const center = (room, gx, gz) => ({ x: -room.w * CELL / 2 + gx * CELL, z: -room.d * CELL / 2 + gz * CELL });

// Cửa trước nhà, nhìn từ ngoài sân: điểm ngay trước cửa và chỗ đứng khi vừa bước ra.
const front = center(YARD, HOUSE_AT.gx + HOUSE_AT.w / 2, HOUSE_AT.gz + HOUSE_AT.d);
export const DOOR_OUT = { x: front.x, z: front.z + 0.3 };
export const SPAWN_OUT = { x: front.x, z: front.z + 1.0, face: 0 };
// Thảm cửa trong nhà (ô dành riêng ở mép trước) và chỗ đứng khi vừa vào.
const mat = center(ROOM, 8, 13.5);
export const DOOR_IN = { x: mat.x, z: mat.z };
export const SPAWN_IN = { x: mat.x, z: mat.z - 0.9, face: Math.PI };

// Fixed new island; never migrates or overwrites saved home and yard layouts.
export const DATE_LAYOUT={v:1,wall:"may",floor:"go",items:[
 {uid:"h-return",type:"henPier",gx:13,gz:18,r:0},
 {uid:"h-cook",type:"banPhaChe",gx:4,gz:4,r:0},
 {uid:"h-fish",type:"diemCau",gx:23,gz:14,r:0},
 {uid:"h-picnic",type:"picnic",gx:12,gz:9,r:0},
 {uid:"h-fire",type:"luaTrai",gx:13,gz:5,r:0},
 {uid:"h-tree1",type:"cayHoa",gx:3,gz:12,r:0},
 {uid:"h-tree2",type:"cayXanh",gx:23,gz:3,r:0},
 {uid:"h-bench",type:"gheDa",gx:19,gz:8,r:0},
 {uid:"h-lamp1",type:"denDuong",gx:10,gz:15,r:0},
 {uid:"h-lamp2",type:"denDuong",gx:18,gz:15,r:0}
]};
export const DATE_ISLAND={id:"hen",w:28,d:24,wallH:0,defaultLayout:DATE_LAYOUT};
export const DATE_SPAWN={x:0,z:3.8,face:Math.PI};
export const SCENES = { nha: ROOM, san: YARD, hen:DATE_ISLAND };

// Bước qua cửa: đang ở gần cửa và đi về phía cửa. dir = hướng đi (x, z) trên sàn.
export function crossesDoor(scene, x, z, dirX, dirZ) {
  if(scene==="hen")return false;
  // Cửa rộng 1 m: chỉ cần đứng trước khung cửa, sát tường, và đang đi vào trong.
  if (scene === "san") return Math.abs(x - DOOR_OUT.x) < 0.55 && z < DOOR_OUT.z + 0.15 && dirZ < -0.3;
  return Math.abs(x - DOOR_IN.x) < 0.6 && z > DOOR_IN.z - 0.2 && dirZ > 0.3;
}
