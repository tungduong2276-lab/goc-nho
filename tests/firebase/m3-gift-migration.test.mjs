import { after, before, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { isDeepStrictEqual } from "node:util";
import { readFileSync } from "node:fs";
import { assertFails, initializeTestEnvironment } from "@firebase/rules-unit-testing";
import {
  Bytes, collection, doc, getDoc, getDocs, query, runTransaction, setDoc, Timestamp, where,
} from "firebase/firestore";
import { prepareLegacyGift } from "../../scripts/m3-gift-migration.mjs";

const endpoint = /^(127\.0\.0\.1|localhost):([0-9]+)$/.exec(process.env.FIRESTORE_EMULATOR_HOST || "");
if (!endpoint) throw new Error("Gift migration requires a loopback Firestore Emulator");

const alice = "fixture-alice";
const bob = "fixture-bob";
const house = { members: [bob, alice], roles: { [alice]: 0, [bob]: 1 } };
const root = "couples/fixture-couple";
const oldRef = (db, id) => doc(db, root, "gifts", id);
const envelopeRef = (db, id) => doc(db, root, "giftEnvelopes", id);
const payloadRef = (db, id) => doc(db, root, "giftEnvelopes", id, "private", "content");
const photo = "/9j/2Q==";
const gift = {
  id: "scheduled", from: 0, to: 1, key: "2099-12-25", date: "2026-11-18T05:00:00.000Z",
  note: "fixture message", photos: ["data:image/jpeg;base64," + photo],
  label: "fixture holiday", opened: false,
};
let env, sender, recipient;
const fixtureAdmin = fn => env.withSecurityRulesDisabled(ctx => fn(ctx.firestore()));

before(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-goc-nho-safety",
    firestore: {
      host: endpoint[1], port: Number(endpoint[2]),
      rules: readFileSync(new URL("./fixtures/m3-gifts.rules", import.meta.url), "utf8"),
    },
  });
  sender = env.authenticatedContext(alice).firestore();
  recipient = env.authenticatedContext(bob).firestore();
});
after(async () => { await env?.cleanup(); });
beforeEach(async () => {
  await env.clearFirestore();
  await fixtureAdmin(async db => {
    await setDoc(doc(db, root), house);
    await setDoc(oldRef(db, gift.id), gift);
  });
});

// Privileged fixture operation. Only this test supplies a rules-disabled
// context. The exact archived source and historical UID mapping are inputs.
function migrate(db, archivedGift, confirmedHouse) {
  const id = archivedGift.id;
  const toEnvelope = envelopeRef(db, id);
  const toPayload = payloadRef(db, id);
  return runTransaction(db, async tx => {
    const [liveHouse, source, envelope, payload] = await Promise.all([
      tx.get(doc(db, root)), tx.get(oldRef(db, id)), tx.get(toEnvelope), tx.get(toPayload),
    ]);
    const current = liveHouse.data();
    const sameRoles = current?.members?.length === 2 && confirmedHouse.members.every(
      uid => current.members.includes(uid) && current.roles?.[uid] === confirmedHouse.roles[uid],
    );
    if (!sameRoles) return "ROLE_MISMATCH";
    if (!isDeepStrictEqual(source.data(), archivedGift)) return "SOURCE_CHANGED";

    const expected = prepareLegacyGift(archivedGift, confirmedHouse);
    if (expected.issue) return expected.issue;
    const createdAt = Timestamp.fromDate(new Date(expected.envelope.createdAt));
    const unlockAt = Timestamp.fromDate(new Date(expected.envelope.unlockAt));
    if (envelope.exists() || payload.exists()) {
      const actualEnvelope = envelope.data();
      const actualPayload = payload.data();
      const exact = actualEnvelope && actualPayload && isDeepStrictEqual({
        envelope: {
          ...actualEnvelope,
          createdAt: actualEnvelope.createdAt instanceof Timestamp && actualEnvelope.createdAt.isEqual(createdAt)
            ? expected.envelope.createdAt : null,
          unlockAt: actualEnvelope.unlockAt instanceof Timestamp && actualEnvelope.unlockAt.isEqual(unlockAt)
            ? expected.envelope.unlockAt : null,
        },
        payload: {
          ...actualPayload,
          photos: Array.isArray(actualPayload.photos)
            ? actualPayload.photos.map(bytes => bytes instanceof Bytes ? bytes.toBase64() : null) : null,
        },
      }, expected);
      return exact ? "ALREADY_COPIED" : "DESTINATION_CONFLICT";
    }

    tx.set(toEnvelope, { ...expected.envelope, createdAt, unlockAt });
    tx.set(toPayload, { note: expected.payload.note, photos: expected.payload.photos.map(Bytes.fromBase64String) });
    return "COPIED";
  });
}

test("concurrent retries preserve one copy, the original archive, the release time and the exact image bytes", async () => {
  await fixtureAdmin(async db => {
    const results = await Promise.all([migrate(db, gift, house), migrate(db, gift, house)]);
    assert.deepEqual(results.sort(), ["ALREADY_COPIED", "COPIED"]);
    assert.deepEqual((await getDoc(oldRef(db, gift.id))).data(), gift);
  });
  const envelope = (await getDoc(envelopeRef(recipient, gift.id))).data();
  assert.equal(envelope.fromUid, alice);
  assert.equal(envelope.toUid, bob);
  assert.equal(envelope.createdAt.toDate().toISOString(), gift.date);
  assert.equal(envelope.unlockAt.toDate().toISOString(), "2099-12-24T17:00:00.000Z");
  const privateData = (await getDoc(payloadRef(sender, gift.id))).data();
  assert.equal(privateData.note, gift.note);
  assert.equal(privateData.photos[0].toBase64(), photo);
  await assertFails(getDoc(payloadRef(recipient, gift.id)));
  await assertFails(getDoc(oldRef(recipient, gift.id)));
});

test("incomplete destination is preserved and no second document is created", async () => {
  await fixtureAdmin(async db => {
    const conflict = { note: "Different fixture", photos: [] };
    await setDoc(payloadRef(db, gift.id), conflict);
    assert.equal(await migrate(db, gift, house), "DESTINATION_CONFLICT");
    assert.equal((await getDoc(envelopeRef(db, gift.id))).exists(), false);
    assert.deepEqual((await getDoc(payloadRef(db, gift.id))).data(), conflict);
  });
});

test("role drift or source drift prevents any copy", async () => {
  await fixtureAdmin(async db => {
    await setDoc(doc(db, root), { ...house, roles: { [alice]: 1, [bob]: 0 } });
    assert.equal(await migrate(db, gift, house), "ROLE_MISMATCH");
    await setDoc(doc(db, root), house);
    await setDoc(oldRef(db, gift.id), { ...gift, note: "Changed after archive" });
    assert.equal(await migrate(db, gift, house), "SOURCE_CHANGED");
    assert.equal((await getDoc(envelopeRef(db, gift.id))).exists(), false);
    assert.equal((await getDoc(payloadRef(db, gift.id))).exists(), false);
  });
});

test("cutover keeps opened history readable and blocks client writes and old unfiltered listeners", async () => {
  const opened = { ...gift, id: "opened", opened: true, openedAt: gift.date };
  await fixtureAdmin(db => setDoc(oldRef(db, opened.id), opened));
  for (const member of [sender, recipient]) {
    const history = collection(member, root, "gifts");
    const filtered = await getDocs(query(history, where("opened", "==", true)));
    assert.deepEqual(filtered.docs.map(snapshot => snapshot.data()), [opened]);
    await assertFails(getDocs(history));
    await assertFails(getDoc(oldRef(member, gift.id)));
    await assertFails(setDoc(oldRef(member, gift.id), { ...gift, opened: true }));
  }
});
