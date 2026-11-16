import { before, after, beforeEach, test } from "node:test";
import { readFileSync } from "node:fs";
import { strict as assert } from "node:assert";
import { initializeTestEnvironment, assertSucceeds, assertFails } from "@firebase/rules-unit-testing";
import { doc, getDoc, getDocs, setDoc, updateDoc, collection, arrayUnion, serverTimestamp, query, orderBy, limit } from "firebase/firestore";
import * as AD from "../../nha3d/appdata.mjs";
import * as SY from "../../nha3d/sync.mjs";

// W2 shared island: document shapes under couples/{cid}/world against the PRODUCTION firestore.rules.
if (!/^(127\.0\.0\.1|localhost):[0-9]+$/.test(process.env.FIRESTORE_EMULATOR_HOST || "")) {
  throw new Error("World sync tests require a loopback Firestore Emulator; refusing production access");
}
const projectId = "demo-goc-nho-safety", CID = "fixture-couple";
const ALICE = "fixture-alice", BOB = "fixture-bob", EVE = "fixture-outsider";
let env;
const fsOf = uid => (uid ? env.authenticatedContext(uid) : env.unauthenticatedContext()).firestore();
const world = uid => collection(fsOf(uid), `couples/${CID}/${SY.COLLECTION}`);
const wdoc = (uid, id) => doc(fsOf(uid), `couples/${CID}/${SY.COLLECTION}/${id}`);

before(async () => {
  const [host, port] = process.env.FIRESTORE_EMULATOR_HOST.split(":");
  env = await initializeTestEnvironment({ projectId, firestore: { host, port: Number(port), rules: readFileSync("firestore.rules", "utf8") } });
});
after(async () => { await env?.cleanup(); });
beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async ctx => {
    await setDoc(doc(ctx.firestore(), `couples/${CID}`), { members: [ALICE, BOB], code: "FIXTURE", roles: { [ALICE]: 0, [BOB]: 1 } });
  });
});

const bed = { uid: "y-g1", type: "luongTrong", gx: 4, gz: 14, r: 0 };

test("both members read and write the shared island; outsiders and signed-out users cannot", async () => {
  await assertSucceeds(setDoc(wdoc(ALICE, SY.itemId("san", bed.uid)), { ...SY.encodeItem("san", bed), ts: serverTimestamp() }));
  await assertSucceeds(getDoc(wdoc(BOB, SY.itemId("san", bed.uid))));
  await assertSucceeds(setDoc(wdoc(BOB, SY.presenceId("em")), { k: "presence", who: "em", scene: "san", x: 0, z: 0, face: 0, mode: "idle", at: Date.now(), ts: serverTimestamp() }));
  await assertFails(getDoc(wdoc(EVE, SY.itemId("san", bed.uid))));
  await assertFails(setDoc(wdoc(EVE, SY.presenceId("anh")), { k: "presence" }));
  await assertFails(getDocs(world(null)));
});

test("watering from both phones at once keeps both waterings (arrayUnion)", async () => {
  const T = Date.UTC(2026, 10, 16, 8);
  const planted = { ...bed, plant: { sp: "dau", at: T, by: "anh", w: [[T, "anh"]] } };
  await setDoc(wdoc(ALICE, SY.itemId("san", bed.uid)), SY.encodeItem("san", planted, true));
  await Promise.all([
    updateDoc(wdoc(ALICE, SY.itemId("san", bed.uid)), { w: arrayUnion(SY.encodeWater([T + 5000, "anh"])) }),
    updateDoc(wdoc(BOB, SY.itemId("san", bed.uid)), { w: arrayUnion(SY.encodeWater([T + 5001, "em"])) })
  ]);
  // A later move of the bed (merge, without water) must not wipe the waterings.
  await setDoc(wdoc(BOB, SY.itemId("san", bed.uid)), SY.encodeItem("san", { ...planted, gx: 5 }, false), { merge: true });
  const got = SY.decodeItem((await getDoc(wdoc(ALICE, SY.itemId("san", bed.uid)))).data());
  assert.equal(got.gx, 5);
  assert.deepEqual(got.plant.w, [[T, "anh"], [T + 5000, "anh"], [T + 5001, "em"]]);
});

test("a second phone loads the island the first phone seeded", async () => {
  const items = [bed, { uid: "y-m1", type: "hopThu", gx: 24, gz: 14, r: 0, state: true }];
  for (const it of items) await setDoc(wdoc(ALICE, SY.itemId("san", it.uid)), SY.encodeItem("san", it));
  const snap = await getDocs(world(BOB));
  const layout = { items: [] };
  SY.applyItemChanges(layout, "san", snap.docs.map(d => ({ id: d.id, data: d.data() })));
  assert.deepEqual(layout.items.map(i => i.uid).sort(), ["y-g1", "y-m1"]);
  assert.equal(layout.items.find(i => i.uid === "y-m1").state, true);
});

test("W3: the island reads the app's own letters, fridge notes, history and meta with the same queries as cloud.js", async () => {
  const base = `couples/${CID}/`;
  // Bob writes exactly as the main app's put()/putMeta() do.
  await setDoc(doc(fsOf(BOB), base + "letters/l1"), { id: "l1", from: 1, to: 0, body: "fixture", unlockSeason: null, unlockDate: "2020-01-01", date: "2026-11-01T00:00:00.000Z" });
  await setDoc(doc(fsOf(BOB), base + "fridge/f1"), { id: "f1", by: 1, text: "fixture", color: 3, sticker: null, voice: null, dur: 0, date: "2026-11-15T00:00:00.000Z", hearts: [false, true], replies: [] });
  await setDoc(doc(fsOf(BOB), base + "meta/main"), { names: ["Anh", "Em"], pending: { id: "p", n: 2 } });
  const asMap = snap => Object.fromEntries(snap.docs.map(d => [d.id, d.data()]));
  const letters = asMap(await assertSucceeds(getDocs(collection(fsOf(ALICE), base + "letters"))));
  const fridge = asMap(await assertSucceeds(getDocs(query(collection(fsOf(ALICE), base + "fridge"), orderBy("date", "desc"), limit(12)))));
  const history = asMap(await assertSucceeds(getDocs(collection(fsOf(ALICE), base + "history"))));
  const meta = (await assertSucceeds(getDoc(doc(fsOf(ALICE), base + "meta/main")))).data();
  assert.deepEqual(AD.mailboxState(letters, history, 0, []), { unread: 1, sealed: 0, total: 1 });
  const fr = AD.fridgeState(fridge, 0, "");
  assert.equal(fr.fresh, 1); assert.equal(fr.shown[0].color, AD.NOTE_COLORS[3]); assert.equal(fr.shown[0].heart, true);
  assert.equal(AD.jarState(meta, history).pending, true);
  await assertFails(getDocs(collection(fsOf(EVE), base + "letters")));
  await assertFails(getDocs(query(collection(fsOf(null), base + "fridge"), orderBy("date", "desc"), limit(12))));
});
