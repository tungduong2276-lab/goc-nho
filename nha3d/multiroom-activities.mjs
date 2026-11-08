import { CATALOG } from "./catalog.mjs";
import { blockGrid, cellFree, findPath } from "./engine.mjs";

// A room action can finish only after walking to a free cell next to its object.
// This pure module deliberately has no storage or Firebase dependencies.
const TARGETS = Object.freeze({
  khach: ["banTra", "sofa"],
  bep: ["bepNau", "banAn"],
  ngu: ["banTrangDiem", "giuong"]
});
export function routeToFurniture(room, start, roomId) {
  if (!room || !start || !TARGETS[roomId]) return null;
  const grid = blockGrid(room.layout, room.size);
  if (!cellFree(grid, start.i, start.j)) return null;
  let best = null;
  for (const type of TARGETS[roomId]) {
    for (const item of room.layout.items ?? []) {
      if (item.type !== type) continue;
      const def = CATALOG[item.type];
      if (!def || def.kind !== "floor") continue;
      const w = (item.r & 1) ? def.d : def.w;
      const d = (item.r & 1) ? def.w : def.d;
      for (let j = item.gz - 1; j <= item.gz + d; j++) {
        for (let i = item.gx - 1; i <= item.gx + w; i++) {
          if (!cellFree(grid, i, j)) continue;
          const near = (i >= item.gx && i < item.gx + w) ||
            (j >= item.gz && j < item.gz + d);
          if (!near) continue;
          const path = findPath(grid, start, { i, j });
          if (path && (!best || path.length < best.length)) best = path;
        }
      }
    }
    if (best) return best;
  }
  return null;
}
