// Isolated example furniture layouts for the 3-room WebGL preview. No Firebase or storage.
export const PREVIEW_LAYOUTS = {
  bep: { v: 1, wall: "bo", floor: "da", items: [
    { uid: "k1", type: "banAn", gx: 5, gz: 5, r: 0 },
    { uid: "k2", type: "tuLanh", gx: 13, gz: 1, r: 0 },
    { uid: "k3", type: "bepNau", gx: 10, gz: 1, r: 0 },
    { uid: "k4", type: "huHenHo", gx: 3, gz: 3, r: 0 },
    { uid: "k5", type: "chauLuoiHo", gx: 12, gz: 11, r: 0 }
  ] },
  ngu: { v: 1, wall: "hong", floor: "go", items: [
    { uid: "n1", type: "giuong", gx: 1, gz: 4, r: 0 },
    { uid: "n2", type: "tuDo", gx: 12, gz: 2, r: 0 },
    { uid: "n3", type: "banTrangDiem", gx: 11, gz: 7, r: 0 },
    { uid: "n4", type: "keSach", gx: 2, gz: 11, r: 0 },
    { uid: "n5", type: "oMeo", gx: 8, gz: 10, r: 0 },
    { uid: "n6", type: "denCay", gx: 14, gz: 11, r: 0 }
  ] }
};
export const PREVIEW_SPAWN = Object.freeze({ room: "khach", cell: { i: 8, j: 11 } });
