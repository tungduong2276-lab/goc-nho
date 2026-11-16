// Navigation-only prototype for a multi-room house. No DOM, network, storage or Firebase.
// Door endpoints are interior cells: crossing a door is an explicit state transition.
import { ROOM, DEFAULT_LAYOUT } from "./catalog.mjs";
import { blockGrid, cellFree, findPath, clone } from "./engine.mjs";

export const HOUSE_ROOMS = Object.freeze({
  khach: { name: "Phòng khách", size: ROOM },
  bep: { name: "Phòng bếp", size: { w: 16, d: 14 } },
  ngu: { name: "Phòng ngủ", size: { w: 16, d: 14 } }
});
export const HOUSE_DOORS = Object.freeze([
  { id: "khach-bep", a: { room: "khach", cell: { i: 15, j: 10 } }, b: { room: "bep", cell: { i: 0, j: 10 } } },
  { id: "khach-ngu", a: { room: "khach", cell: { i: 8, j: 13 } }, b: { room: "ngu", cell: { i: 8, j: 0 } } }
]);

export function makeHouse(layouts = {}) {
  const rooms = {};
  for (const [id, def] of Object.entries(HOUSE_ROOMS)) {
    // Each room owns an independent layout. Legacy single-room layout is copied, never migrated.
    const layout = clone(layouts[id] ?? (id === "khach" ? DEFAULT_LAYOUT : { v: 1, wall: "may", floor: "go", items: [] }));
    rooms[id] = { size: def.size, layout };
  }
  return { rooms, doors: clone(HOUSE_DOORS) };
}

export function doorEndpoints(house, door) {
  if (!door || !door.a || !door.b || door.a.room === door.b.room) return null;
  const a = house.rooms[door.a.room], b = house.rooms[door.b.room];
  if (!a || !b) return null;
  const ga = blockGrid(a.layout, a.size), gb = blockGrid(b.layout, b.size);
  if (!cellFree(ga, door.a.cell?.i, door.a.cell?.j) || !cellFree(gb, door.b.cell?.i, door.b.cell?.j)) return null;
  return { ga, gb };
}

// Returns a plan of walkable paths and explicit door transitions; never teleports through a blocked door.
export function routeHouse(house, start, goal) {
  if (!house?.rooms?.[start?.room] || !house.rooms[goal?.room]) return null;
  const grids = Object.fromEntries(Object.entries(house.rooms).map(([id, r]) => [id, blockGrid(r.layout, r.size)]));
  const key = p => p.room + ":" + p.cell.i + "," + p.cell.j;
  const nodes = [{ room: start.room, cell: start.cell }, { room: goal.room, cell: goal.cell }];
  const links = [];
  for (const door of house.doors ?? []) {
    if (!doorEndpoints(house, door)) continue;
    const ai = nodes.push(door.a) - 1, bi = nodes.push(door.b) - 1;
    links.push({ from: ai, to: bi, door: door.id }, { from: bi, to: ai, door: door.id });
  }
  const edges = nodes.map(() => []);
  for (let i = 0; i < nodes.length; i++) for (let j = 0; j < nodes.length; j++) {
    if (i === j || nodes[i].room !== nodes[j].room) continue;
    const p = findPath(grids[nodes[i].room], nodes[i].cell, nodes[j].cell);
    if (p) edges[i].push({ to: j, cost: p.length - 1, path: p });
  }
  for (const l of links) edges[l.from].push({ to: l.to, cost: 1, door: l.door });
  const dist = nodes.map(() => Infinity), prev = new Map(), visited = new Set();
  dist[0] = 0;
  while (true) {
    let u = -1;
    for (let i = 0; i < nodes.length; i++) if (!visited.has(i) && (u < 0 || dist[i] < dist[u])) u = i;
    if (u < 0 || !Number.isFinite(dist[u])) return null;
    if (u === 1) break;
    visited.add(u);
    for (const e of edges[u]) if (dist[u] + e.cost < dist[e.to]) {
      dist[e.to] = dist[u] + e.cost; prev.set(e.to, { from: u, edge: e });
    }
  }
  const steps = [];
  for (let at = 1; at !== 0;) {
    const p = prev.get(at); if (!p) return null;
    if (p.edge.door) steps.push({ type: "door", id: p.edge.door, from: nodes[p.from], to: nodes[at] });
    else steps.push({ type: "walk", room: nodes[at].room, cells: p.edge.path });
    at = p.from;
  }
  return steps.reverse();
}

export function transitionAtDoor(house, position, doorId) {
  const door = (house?.doors ?? []).find(d => d.id === doorId);
  if (!door || !doorEndpoints(house, door)) return null;
  const equal = (p, q) => p.room === q.room && p.cell.i === q.cell.i && p.cell.j === q.cell.j;
  if (equal(position, door.a)) return clone(door.b);
  if (equal(position, door.b)) return clone(door.a);
  return null;
}
