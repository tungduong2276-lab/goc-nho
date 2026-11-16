import test from "node:test";
import assert from "node:assert/strict";
import * as AD from "../../nha3d/appdata.mjs";

const NOW = new Date("2026-11-16T10:00:00");
const hist = n => Object.fromEntries(Array.from({ length: n }, (_, i) => ["h" + i, { id: "h" + i, no: i + 1, closed: true }]));

test("hộp thư: chỉ đếm thư gửi mình, đã tới hạn mở và chưa xem", () => {
  const letters = {
    a: { id: "a", from: 1, to: 0, unlockDate: "2026-11-16" },          // mở hôm nay
    b: { id: "b", from: 1, to: 0, unlockDate: "2026-11-17" },          // còn niêm phong
    c: { id: "c", from: 1, to: 0, unlockSeason: 1 },                   // mở khi hết mùa 1
    d: { id: "d", from: 0, to: 1, unlockDate: "2020-01-01" },          // thư mình gửi đi
    e: { id: "e", from: 1, to: 0, unlockDate: "2020-01-01" }           // đã xem
  };
  assert.deepEqual(AD.mailboxState(letters, hist(9), 0, ["e"], NOW), { unread: 1, sealed: 2, total: 4 });
  assert.deepEqual(AD.mailboxState(letters, hist(10), 0, ["e"], NOW), { unread: 2, sealed: 1, total: 4 });
  assert.deepEqual(AD.mailboxState(letters, {}, null, [], NOW), { unread: 0, sealed: 0, total: 0 });
});

test("tủ lạnh: giấy mới nhất lên trước, màu đúng bảng màu app, đếm tin mới của người kia", () => {
  const notes = {
    x: { id: "x", by: 1, color: 2, date: "2026-11-10T00:00:00Z", hearts: [false, false], replies: [{ by: 1, date: "2026-11-15T00:00:00Z" }] },
    y: { id: "y", by: 0, color: 9, date: "2026-11-14T00:00:00Z", voice: "data:audio" },
    z: { id: "z", by: 1, color: 0, date: "2026-11-12T00:00:00Z", hearts: [true, false] }
  };
  const st = AD.fridgeState(notes, 0, "2026-11-11T00:00:00Z");
  assert.equal(st.count, 3);
  assert.equal(st.fresh, 2); // z + câu trả lời trên x
  assert.deepEqual(st.shown.map(n => n.id), ["y", "z", "x"]);
  assert.equal(st.shown[0].color, AD.NOTE_COLORS[0]); // màu lạ → về màu đầu
  assert.equal(st.shown[0].voice, true);
  assert.equal(st.shown[1].heart, true);
  assert.equal(AD.fridgeState(notes, 0, "", 2).shown.length, 2);
});

test("hũ: biết lá đang chờ và buổi hẹn đang mở", () => {
  assert.deepEqual(AD.jarState({ pending: { n: 3 } }, hist(2)), { pending: true, openNo: null, done: 2 });
  const h = hist(2); h.h2 = { id: "h2", no: 3, closed: false };
  assert.deepEqual(AD.jarState({ pending: null }, h), { pending: false, openNo: 3, done: 2 });
  assert.deepEqual(AD.jarState(null, {}), { pending: false, openNo: null, done: 0 });
});
