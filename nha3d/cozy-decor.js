// Trang trí thuần hình ảnh trên vỏ phòng. Không vào item/layout/grid/Firestore,
// không cản raycast, không chiếm lối đi và không thay đổi màu tường mà hai người đã sơn.
import * as THREE from "three";
import { COZY, ROOM_MOODS } from "./cozy-palette.mjs";

export const COZY_DECOR_NAME = "cozy-pastels";

export function decorateCozyRoom(shell, scene, width, depth, height) {
  const root = new THREE.Group();
  root.name = COZY_DECOR_NAME;
  if (!ROOM_MOODS[scene] || width < 2 || depth < 2) return root;

  const colors = [COZY.mint, COZY.pink, COZY.blue];
  const mood = ROOM_MOODS[scene].accent;
  const mats = colors.map(color => new THREE.MeshToonMaterial({ color, side: THREE.DoubleSide }));
  const cream = new THREE.MeshToonMaterial({ color: COZY.cream });
  const addBox = (w, h, d, x, y, z, material) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
    mesh.position.set(x, y, z);
    root.add(mesh);
  };

  // Gờ trên và dưới: luôn có cả ba tông, kể cả phòng cũ đã chọn màu tường khác.
  const xWall = -width / 2 + 0.16, zWall = -depth / 2 + 0.16;
  addBox(width - 0.35, 0.06, 0.045, 0, height - 0.19, zWall, mats[(mood + 2) % 3]);
  addBox(0.045, 0.06, depth - 0.35, xWall, height - 0.19, 0, mats[mood]);
  addBox(width - 0.35, 0.065, 0.04, 0, 0.28, zWall, mats[mood]);
  addBox(0.04, 0.065, depth - 0.35, xWall, 0.28, 0, mats[(mood + 2) % 3]);

  // Dây cờ tam giác nằm cao hơn khung ảnh/tủ: không che giấy nhắn, đồ dùng hay cửa.
  const triangle = new THREE.Shape();
  triangle.moveTo(-0.11, 0.08);
  triangle.lineTo(0.11, 0.08);
  triangle.lineTo(0, -0.17);
  triangle.lineTo(-0.11, 0.08);
  const flagGeo = new THREE.ShapeGeometry(triangle);
  const flags = (length, position) => {
    const count = Math.min(11, Math.max(3, Math.floor((length - 1) / 0.72)));
    for (let i = 0; i < count; i++) {
      const flag = new THREE.Mesh(flagGeo, mats[(i + mood) % 3]);
      position(flag, -length / 2 + 0.65 + (length - 1.3) * i / (count - 1));
      root.add(flag);
    }
  };
  flags(width, (flag, at) => flag.position.set(at, height - 0.52, zWall + 0.015));
  flags(depth, (flag, at) => {
    flag.rotation.y = Math.PI / 2;
    flag.position.set(xWall + 0.015, height - 0.52, at);
  });

  // Mây bông nhỏ ở góc tường, làm bằng khối mềm; không thêm ánh sáng/GPU animation.
  const puff = new THREE.SphereGeometry(1, 12, 8);
  for (const [x, y, radius, material] of [
    [-width / 2 + 0.48, height - 0.86, 0.14, cream],
    [-width / 2 + 0.63, height - 0.81, 0.19, mats[(mood + 2) % 3]],
    [-width / 2 + 0.82, height - 0.86, 0.13, cream]
  ]) {
    const cloud = new THREE.Mesh(puff, material);
    cloud.scale.set(radius * 1.3, radius * 0.7, 0.035);
    cloud.position.set(x, y, zWall + 0.025);
    root.add(cloud);
  }
  shell.add(root);
  return root;
}

// Chỉ giải phóng mesh phụ của chủ đề; không dispose vật liệu/model dùng chung của nội thất.
export function disposeCozyRoom(shell) {
  const root = shell?.getObjectByName(COZY_DECOR_NAME);
  if (!root) return;
  const geometries = new Set(), materials = new Set();
  root.traverse(child => {
    if (child.isMesh) {
      if (child.geometry) geometries.add(child.geometry);
      for (const m of Array.isArray(child.material) ? child.material : [child.material]) if (m) materials.add(m);
    }
  });
  root.removeFromParent();
  for (const g of geometries) g.dispose();
  for (const m of materials) m.dispose();
}
