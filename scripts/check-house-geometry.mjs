/**
 * M0 geometry integrity check. Read-only local scene JSON; no Firebase,
 * rendering, image mutations or production-side behavior.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve, dirname } from "node:path";

export const HOUSE_ROOM_ZONES = Object.freeze(["sangtao", "khach", "bep", "anh", "em", "gac"]);
const EXPECTED_ZONES = Object.freeze([
  ...HOUSE_ROOM_ZONES, "vuon", "hopthu", "cafe", "ben", "dao",
]);
const finitePoint = p => Array.isArray(p) && p.length === 2 &&
  p.every(v => typeof v === "number" && Number.isFinite(v));

export function signedArea(poly) {
  return poly.reduce((sum, a, i) => {
    const b = poly[(i + 1) % poly.length];
    return sum + a[0] * b[1] - b[0] * a[1];
  }, 0) / 2;
}
function orientation(a, b, c) {
  const n = (b[0] - a[0]) * (c[1] - a[1]) -
            (b[1] - a[1]) * (c[0] - a[0]);
  return Math.abs(n) < 1e-7 ? 0 : n > 0 ? 1 : -1;
}
function onSegment(a, b, p) {
  return orientation(a, b, p) === 0 &&
    p[0] >= Math.min(a[0], b[0]) - 1e-7 &&
    p[0] <= Math.max(a[0], b[0]) + 1e-7 &&
    p[1] >= Math.min(a[1], b[1]) - 1e-7 &&
    p[1] <= Math.max(a[1], b[1]) + 1e-7;
}
function segmentsIntersect(a, b, c, d) {
  const o1 = orientation(a, b, c), o2 = orientation(a, b, d);
  const o3 = orientation(c, d, a), o4 = orientation(c, d, b);
  return (o1 !== o2 && o3 !== o4) ||
    (o1 === 0 && onSegment(a, b, c)) ||
    (o2 === 0 && onSegment(a, b, d)) ||
    (o3 === 0 && onSegment(c, d, a)) ||
    (o4 === 0 && onSegment(c, d, b));
}
export function containsPoint(poly, point) {
  if (poly.some((a, i) => onSegment(a, poly[(i + 1) % poly.length], point))) return true;
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i], b = poly[j];
    if ((a[1] > point[1]) !== (b[1] > point[1]) &&
      point[0] < (b[0] - a[0]) * (point[1] - a[1]) / (b[1] - a[1]) + a[0])
      inside = !inside;
  }
  return inside;
}
function ensure(condition, message) {
  if (!condition) throw new Error(`HOUSE_GEOMETRY: ${message}`);
}
export function validateHouseGeometry(scene) {
  const map = scene?.map;
  ensure(map && Array.isArray(map.size) && map.size.length === 2 &&
    map.size.every(n => Number.isInteger(n) && n > 0), "invalid map canvas size");
  const [width, height] = map.size;
  ensure(map.zones && typeof map.zones === "object" && !Array.isArray(map.zones),
    "missing map zones");
  ensure(EXPECTED_ZONES.every(id => Object.hasOwn(map.zones, id)) &&
    Object.keys(map.zones).length === EXPECTED_ZONES.length,
    "the map must contain exactly the eleven supported zones");

  for (const id of EXPECTED_ZONES) {
    const zone = map.zones[id], poly = zone.poly;
    ensure(Array.isArray(poly) && poly.length >= 3 && poly.length <= 32,
      `${id}: polygon must have 3–32 vertices`);
    ensure(poly.every(finitePoint), `${id}: invalid polygon point`);
    ensure(poly.every(([x, y]) => x >= 0 && y >= 0 && x <= width && y <= height),
      `${id}: polygon point outside map canvas`);
    ensure(Math.abs(signedArea(poly)) > 50, `${id}: empty or degenerate hit region`);
    ensure(poly.every((p, i) => {
      const next = poly[(i + 1) % poly.length];
      return Math.hypot(next[0] - p[0], next[1] - p[1]) > 0.5;
    }), `${id}: repeated or near-duplicate adjacent vertices`);
    for (let i = 0; i < poly.length; i++) {
      for (let j = i + 1; j < poly.length; j++) {
        if (j === i + 1 || (i === 0 && j === poly.length - 1)) continue;
        ensure(!segmentsIntersect(poly[i], poly[(i + 1) % poly.length],
          poly[j], poly[(j + 1) % poly.length]),
          `${id}: self-intersecting or touching nonadjacent edges`);
      }
    }
    if (HOUSE_ROOM_ZONES.includes(id)) {
      ensure(finitePoint(zone.floor), `${id}: room floor anchor missing`);
      ensure(containsPoint(poly, zone.floor), `${id}: floor anchor outside polygon`);
    }
  }
  // Zone overlap is intentionally allowed by the projected isometric model.
  // Browser pointer tests determine whether each zone is actually reachable.
  ensure(scene.room && Array.isArray(scene.room.size) &&
    scene.room.size.length === 2 &&
    scene.room.size.every(n => Number.isInteger(n) && n > 0),
    "invalid independent room canvas size");
  return Object.freeze({
    mapSize: [...map.size], roomSize: [...scene.room.size],
    zoneCount: EXPECTED_ZONES.length, floorAnchors: HOUSE_ROOM_ZONES.length,
  });
}

const self = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (self) {
  try {
    const path = resolve(dirname(fileURLToPath(import.meta.url)), "../assets/3d/scene.json");
    const scene = JSON.parse(readFileSync(path, "utf8"));
    process.stdout.write("PASS house map geometry: " + JSON.stringify(validateHouseGeometry(scene)) + "\n");
  } catch (error) {
    process.stderr.write(error.message + "\n");
    process.exitCode = 1;
  }
}
