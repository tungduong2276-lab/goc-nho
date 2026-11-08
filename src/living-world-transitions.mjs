/**
 * Góc Nhỏ V2 — local room-to-room prototype.
 *
 * These are VALIDATED FLOOR THRESHOLDS, not architecturally approved doors:
 * the old pre-rendered room art has no visible wall openings. Room transitions
 * must first traverse the real walk mesh, then the depicted shared corridor.
 * No Firebase access and no private data.
 */
import {ROOM_NAV,walkable,walkPath} from "./living-world-nav.mjs";

const doors=[
  ["phong-khach","Phòng khách","🛋️",18,27],
  ["bep","Bếp","🍲",50,27],
  ["phong-anh","Phòng Anh","🛏️",82,27],
  ["phong-em","Phòng Em","🌷",18,58],
  ["goc-sang-tao","Góc sáng tạo","🎨",50,58],
  ["gac","Gác kỷ niệm","📚",82,58],
  ["khu-vuon","Khu vườn","🌿",50,85]
];
export const V2_DOORS=Object.freeze(doors.map(([id,label,emoji,x,y])=>
  Object.freeze({id,label,emoji,x,y})));
export const V2_SLUGS=Object.freeze(V2_DOORS.map(d=>d.id));
const byId=new Map(V2_DOORS.map(d=>[d.id,d]));

export function floorThreshold(room) {
  const spec=ROOM_NAV[room];
  return spec&&walkable(room,spec.exit)?spec.exit.slice():null;
}
export function pathToPorch(room,position) {
  const exit=floorThreshold(room);
  return exit&&walkable(room,position)?walkPath(room,position,exit):null;
}
export function arrivalFromCorridor(room) {
  // Spawn at the physically walkable room front edge, not at an arbitrary
  // "standing" anchor or stale position from a different visit.
  return floorThreshold(room);
}
export function hallRoute(source,target) {
  if(!byId.has(source)||!byId.has(target))return null;
  const door=byId.get(target);
  // Topological corridor in percentages. The avatar approaches a door at a
  // visible point on the open central passage, then enters that room.
  const path=[[50,93],[50,72],[door.x,72],[door.x,Math.min(door.y+12,91)]];
  return Object.freeze(path.map(point=>Object.freeze(point)));
}
