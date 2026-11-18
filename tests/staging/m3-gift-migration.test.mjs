import assert from "node:assert/strict";
import test from "node:test";
import { projectSharedSnapshot, rehearseLegacyGiftMigration } from "../../scripts/m3-gift-migration.mjs";

const house = { members: ["fixture-b", "fixture-a"], roles: { "fixture-a": 0, "fixture-b": 1 } };
const note = "fixture gift message";
const photo = "/9j/2Q==";
const gift = {
  id: "scheduled", from: 0, to: 1, key: "2026-12-25", date: "2026-11-18T05:00:00.000Z",
  note, photos: ["data:image/jpeg;base64," + photo], label: "fixture holiday", opened: false,
};
const copied = {
  envelope: { fromUid: "fixture-a", toUid: "fixture-b", createdAt: gift.date, unlockAt: "2026-12-24T17:00:00.000Z" },
  payload: { note, photos: [photo] },
};
const plan = (gifts = { [gift.id]: gift }, destinations) =>
  rehearseLegacyGiftMigration({ house, gifts, destinations });

test("one source yields a redacted report and an exact destination is recognized on retry", () => {
  const first = plan();
  assert.deepEqual(first, [{ id: gift.id, status: "READY_TO_COPY" }]);
  assert.equal(JSON.stringify(first).includes(note), false);
  assert.equal(JSON.stringify(first).includes(photo), false);
  assert.equal(plan(undefined, { [gift.id]: copied })[0].status, "ALREADY_COPIED");
});

test("wrong deadline, missing payload and edited bytes all block copying over an existing destination", () => {
  const candidates = [
    { ...copied, envelope: { ...copied.envelope, unlockAt: "2026-12-25T00:00:00.000Z" } },
    { envelope: copied.envelope },
    { ...copied, payload: { ...copied.payload, photos: ["AAAA"] } },
  ];
  for (const destination of candidates) {
    assert.equal(plan(undefined, { [gift.id]: destination })[0].status, "DESTINATION_CONFLICT");
  }
});

test("opened history and invalid source records are left for review", () => {
  const withFields = fields => ({ ...gift, ...fields });
  for (const [fields, status] of [
    [{ opened: true, openedAt: gift.date }, "KEEP_OPENED_HISTORY"],
    [{ key: "2026-02-30" }, "INVALID_DATE"],
    [{ date: "2026-11-18" }, "INVALID_DATE"],
    [{ from: 1 }, "INVALID_LEGACY_RECORD"],
    [{ note: "", photos: [] }, "INVALID_PAYLOAD"],
    [{ photos: ["data:image/jpeg;base64,invalid="] }, "UNSUPPORTED_PHOTO"],
    [{ photos: ["data:image/jpeg;base64," + Buffer.alloc(300001).toString("base64")] }, "UNSUPPORTED_PHOTO"],
  ]) assert.equal(plan({ [gift.id]: withFields(fields) })[0].status, status);
});

test("an unconfirmed role mapping and a mismatched document ID are rejected", () => {
  assert.throws(() => rehearseLegacyGiftMigration({ house: { ...house, roles: {} }, gifts: {} }),
    /UNCONFIRMED_ROLES/);
  assert.throws(() => plan({ otherId: gift }), /INVALID_GIFT_ID/);
});

test("shared projection omits all gifts and private option groups while keeping v1 source intact", () => {
  const legacy = {
    app: "hu-hen-ho", v: 1, exported: gift.date, meta: { names: ["A", "B"] },
    data: {
      gifts: { scheduled: gift, opened: { ...gift, id: "opened", opened: true } },
      giftEnvelopes: { [gift.id]: copied }, giftPayloads: { [gift.id]: copied.payload },
      fridge: { id1: { id: "id1", text: "Note to keep" } },
    },
  };
  const before = structuredClone(legacy);
  const shared = projectSharedSnapshot(legacy);
  assert.deepEqual(JSON.parse(shared), {
    app: "goc-nho-shared", v: 1, exported: gift.date, meta: legacy.meta, data: { fridge: legacy.data.fridge },
  });
  assert.equal(shared.includes(note), false);
  assert.equal(shared.includes(photo), false);
  assert.deepEqual(legacy, before);
  assert.throws(() => projectSharedSnapshot({ ...legacy, v: 2 }), /INVALID_V1_BACKUP/);
});
