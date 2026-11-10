// Local-only companion route helper. No storage, Firebase, network or user identity.
import { blockGrid, cellFree, findPath } from "./engine.mjs";

const OFFSETS = Object.freeze([
  [1, 0], [-1, 0], [0, 1], [0, -1],
  [1, 1], [-1, -1], [1, -1], [-1, 1]
]);
const equal = (a, b) => a.i === b.i && a.j === b.j;

export function companionSpawn(room, player) {
  if (!room || !player) return null;
  const grid = blockGrid(room.layout, room.size);
  if (!cellFree(grid, player.i, player.j)) return null;
  for (let radius = 1; radius <= Math.max(grid.w, grid.d); radius++) {
    for (const [dx, dz] of OFFSETS) {
      const cell = { i: player.i + dx * radius, j: player.j + dz * radius };
      if (cellFree(grid, cell.i, cell.j) && findPath(grid, cell, player)) return cell;
    }
  }
  return null;
}

export function routeCompanionToPlayer(room, from, player) {
  if (!room || !from || !player || equal(from, player)) return null;
  const grid = blockGrid(room.layout, room.size);
  if (!cellFree(grid, from.i, from.j) || !cellFree(grid, player.i, player.j)) return null;
  let best = null;
  for (const [dx, dz] of OFFSETS) {
    const cell = { i: player.i + dx, j: player.j + dz };
    if (!cellFree(grid, cell.i, cell.j) || equal(cell, from) && best) continue;
    const path = findPath(grid, from, cell);
    if (path && (!best || path.length < best.length)) best = path;
  }
  return best;
}
