import test from "node:test";
import assert from "node:assert/strict";
import * as GD from "../../nha3d/garden.mjs";

const H = GD.HOUR, T0 = Date.UTC(2026, 10, 16, 8);

test("cây chỉ lớn khi đất còn ẩm và khát sau một ngày không tưới", () => {
  let p = GD.water(GD.newPlant("dau", "anh", T0), "anh", T0);
  assert.equal(GD.status(p, T0).stage, 0);
  assert.equal(GD.status(p, T0 + 12 * H).thirsty, false);
  assert.equal(GD.growHours(p, T0 + 12 * H), 12);
  assert.equal(GD.growHours(p, T0 + 48 * H), 24, "không tưới thì dừng lớn sau 24 giờ");
  assert.equal(GD.status(p, T0 + 30 * H).thirsty, true);
  assert.equal(GD.visualKey(p, T0 + 30 * H), "dau:2:khat");
  p = GD.water(p, "anh", T0 + 30 * H);
  assert.equal(GD.status(p, T0 + 31 * H).thirsty, false);
  assert.equal(GD.growHours(p, T0 + 42 * H), 36);
  assert.equal(GD.status(p, T0 + 42 * H).ripe, true);
  assert.equal(GD.status(p, T0 + 42 * H).stageName, "Chín rồi");
});

test("cả hai cùng tưới trong một lần ẩm thì lớn nhanh gấp rưỡi", () => {
  let p = GD.water(GD.newPlant("cachua", "em", T0), "em", T0);
  p = GD.water(p, "anh", T0 + 2 * H);
  assert.equal(GD.growHours(p, T0 + 10 * H), 15);
  const st = GD.status(p, T0 + 10 * H);
  assert.deepEqual(st.wateredBy.sort(), ["anh", "em"]);
  assert.ok(Math.abs(st.hoursLeft - (48 - 15) / 1.5) < 1e-9);
});

test("các giai đoạn tăng dần tới khi chín", () => {
  const p = GD.water(GD.newPlant("xalach", "anh", T0), "anh", T0);
  const stages = [0, 3, 8, 14, 18].map(h => GD.status(p, T0 + h * H).stage);
  assert.deepEqual(stages, [0, 1, 2, 3, 4]);
});

test("dữ liệu cây và giỏ hỏng bị loại bỏ, không làm vỡ bố cục", () => {
  assert.equal(GD.sanitizePlant({ sp: "khongco", at: 1, w: [] }), undefined);
  assert.equal(GD.sanitizePlant(null), undefined);
  assert.deepEqual(GD.sanitizePlant({ sp: "tulip", at: 5, w: [[6, "em"], [7, "hacker"], ["x", "anh"], 3], extra: 1 }), { sp: "tulip", at: 5, w: [[6, "em"]], by: "anh" });
  const many = Array.from({ length: 90 }, (_, i) => [i, "anh"]);
  assert.equal(GD.sanitizePlant({ sp: "tulip", at: 0, w: many }).w.length, GD.MAX_WATER);
  assert.deepEqual(GD.sanitizeBasket({ dau: 3, tulip: -1, x: 4, cachua: 1.5 }), { dau: 3 });
});
