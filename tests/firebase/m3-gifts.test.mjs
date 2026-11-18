import { after, before, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { assertFails, initializeTestEnvironment } from "@firebase/rules-unit-testing";
import {
  Bytes, collection, doc, getDoc, getDocs, serverTimestamp, setDoc, Timestamp, updateDoc, writeBatch,
} from "firebase/firestore";

const endpoint = /^(127\.0\.0\.1|localhost):([0-9]+)$/.exec(process.env.FIRESTORE_EMULATOR_HOST || "");
if (!endpoint) throw new Error("Gift privacy tests require a loopback Firestore Emulator");

const alice = "fixture-alice";
const bob = "fixture-bob";
const outsider = "fixture-outsider";
const cid = "fixture-couple";
const envelopes = "couples/" + cid + "/giftEnvelopes";
const photo = Bytes.fromUint8Array(new Uint8Array([255, 216, 255, 217]));
const payload = { note: "Synthetic gift message", photos: [photo] };
const envelope = (db, id) => doc(db, envelopes, id);
const content = (db, id) => doc(db, envelopes, id, "private", "content");
const metadata = delay => ({
  fromUid: alice, toUid: bob, createdAt: serverTimestamp(), unlockAt: Timestamp.fromMillis(Date.now() + delay),
});

let env, sender, recipient, other, anonymous;
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
  other = env.authenticatedContext(outsider).firestore();
  anonymous = env.unauthenticatedContext().firestore();
});
after(async () => { await env?.cleanup(); });
beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async ctx => {
    await setDoc(doc(ctx.firestore(), "couples", cid), { members: [alice, bob] });
  });
});

function wrap(db, id, meta, privateData = payload) {
  const batch = writeBatch(db);
  batch.set(envelope(db, id), meta);
  batch.set(content(db, id), privateData);
  return batch.commit();
}

test("sender can read a sealed gift; the recipient only receives metadata before the deadline", async () => {
  await wrap(sender, "later", metadata(60 * 60 * 1000));
  const boxes = await getDocs(collection(recipient, envelopes));
  assert.equal(boxes.size, 1);
  assert.deepEqual(Object.keys(boxes.docs[0].data()).sort(), ["createdAt", "fromUid", "toUid", "unlockAt"]);
  assert.deepEqual((await getDoc(content(sender, "later"))).data(), payload);
  await assertFails(getDoc(content(recipient, "later")));
  await assertFails(getDocs(collection(sender, envelopes, "later", "private")));
  await assertFails(getDocs(collection(recipient, envelopes, "later", "private")));
});

test("recipient can read message and image once the server deadline has passed", async () => {
  await wrap(sender, "ready", metadata(-60 * 1000));
  const opened = (await getDoc(content(recipient, "ready"))).data();
  assert.equal(opened.note, payload.note);
  assert.deepEqual(opened.photos[0].toUint8Array(), photo.toUint8Array());
  for (const db of [other, anonymous]) {
    await assertFails(getDoc(envelope(db, "ready")));
    await assertFails(getDoc(content(db, "ready")));
  }
});

test("gift creation requires both documents, valid members and payload confined to the private document", async () => {
  const future = metadata(60 * 60 * 1000);
  await assertFails(setDoc(envelope(sender, "meta-only"), future));
  await assertFails(setDoc(content(sender, "payload-only"), payload));
  await assertFails(wrap(sender, "leaky", { ...future, note: payload.note, photos: payload.photos }));
  await assertFails(wrap(sender, "wrong-recipient", { ...future, toUid: outsider }));
  await assertFails(wrap(recipient, "wrong-sender", future));
  await assertFails(wrap(sender, "external-url", future, { note: "", photos: ["https://example.invalid/image"] }));
});

test("release time and payload cannot be changed by either member", async () => {
  await wrap(sender, "immutable", metadata(60 * 60 * 1000));
  const now = Timestamp.fromMillis(Date.now() - 60 * 1000);
  for (const db of [sender, recipient]) {
    await assertFails(updateDoc(envelope(db, "immutable"), { unlockAt: now }));
    await assertFails(updateDoc(content(db, "immutable"), { note: "Different content" }));
  }
  await assertFails(getDoc(content(recipient, "immutable")));
});

test("the candidate keeps shared world and legacy gifts accessible through their existing paths", async () => {
  const world = doc(sender, "couples", cid, "world", "m_nha");
  await setDoc(world, { k: "meta", scene: "nha" });
  assert.equal((await getDoc(doc(recipient, world.path))).exists(), true);

  const legacy = doc(sender, "couples", cid, "gifts", "legacy-fixture");
  await setDoc(legacy, { id: "legacy-fixture", opened: true, key: "2020-01-01" });
  assert.equal((await getDoc(doc(recipient, legacy.path))).data().opened, true);
});
