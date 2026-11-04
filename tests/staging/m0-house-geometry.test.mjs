import { test } from "node:test";
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import {
  validateHouseGeometry, signedArea, containsPoint,
} from "../../scripts/check-house-geometry.mjs";

const original = JSON.parse(readFileSync("assets/3d/scene.json", "utf8"));
const clone = () => structuredClone(original);

test("all actual isometric zones and six room floor anchors are valid", () => {
  const report = validateHouseGeometry(original);
  assert.equal(report.zoneCount, 11);
  assert.equal(report.floorAnchors, 6);
  assert.deepEqual(report.mapSize, [1170, 1960]);
  assert.deepEqual(report.roomSize, [1170, 1170]);
});

test("validates each polygon region and includes its own floor anchor", () => {
  for (const [id, z] of Object.entries(original.map.zones)) {
    assert.ok(signedArea(z.poly) > 50, `${id} should have sufficient area`);
    if (z.floor) assert.ok(containsPoint(z.poly, z.floor),
      `${id} floor anchor should be within polygon`);
  }
});

test("rejects self-intersections even when signed area is nonzero", () => {
  const data = clone();
  data.map.zones.khach.poly = [
    [100, 100], [300, 100], [100, 300], [300, 300], [200, 50],
  ];
  assert.throws(() => validateHouseGeometry(data), /self-intersect/);
});

test("rejects room anchors outside their own floor polygons", () => {
  const data = clone();
  data.map.zones.gac.floor = [1, 1];
  assert.throws(() => validateHouseGeometry(data), /gac: floor anchor outside/);
});

test("rejects coordinates outside the real map image", () => {
  const data = clone();
  data.map.zones.bep.poly[0] = [-1, 100];
  assert.throws(() => validateHouseGeometry(data), /bep: polygon point outside/);
});

test("rejects invalid and duplicate points", () => {
  const nan = clone();
  nan.map.zones.anh.poly[2] = [Infinity, 100];
  assert.throws(() => validateHouseGeometry(nan), /anh: invalid polygon/);
  const duplicate = clone();
  duplicate.map.zones.em.poly[1] = [...duplicate.map.zones.em.poly[0]];
  assert.throws(() => validateHouseGeometry(duplicate), /em: repeated/);
});

test("rejects missing zones and degenerate geometry", () => {
  const missing = clone();
  delete missing.map.zones.dao;
  assert.throws(() => validateHouseGeometry(missing), /eleven supported zones/);
  const degenerate = clone();
  degenerate.map.zones.hopthu.poly = [[1, 1], [2, 2], [3, 3]];
  assert.throws(() => validateHouseGeometry(degenerate), /degenerate/);
});

test("rejects nonsensical independent room image dimensions", () => {
  const data = clone();
  data.room.size = [1170, 0];
  assert.throws(() => validateHouseGeometry(data), /independent room canvas/);
});

test("map with intentional zone overlap remains valid", () => {
  const data = clone();
  // Overview rooms already overlap in the isometric rendering; no false
  // rejection merely because one floor projects over another floor.
  data.map.zones.cafe.poly = structuredClone(data.map.zones.hopthu.poly);
  assert.equal(validateHouseGeometry(data).zoneCount, 11);
});
