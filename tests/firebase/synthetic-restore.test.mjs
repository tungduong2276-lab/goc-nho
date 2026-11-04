import { before, after, test } from "node:test";
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { initializeTestEnvironment, assertSucceeds, assertFails } from "@firebase/rules-unit-testing";
import { collection, doc, getDoc, getDocs, setDoc, Timestamp } from "firebase/firestore";

// This is a SYNTHETIC document snapshot round-trip, NOT an actual Cloud Firestore
// managed export/import and NOT a backup of any real couple's data.
const address = process.env.FIRESTORE_EMULATOR_HOST || "";
if (!/^(127[.]0[.]0[.]1|localhost):[0-9]+$/.test(address)) {
  throw new Error("Refusing non-loopback Firestore endpoint");
}
const projectId = "demo-goc-nho-safety";
const [host, port] = address.split(":");
let env;
before(async () => {
  env = await initializeTestEnvironment({
    projectId,
    firestore: { host, port: Number(port), rules: readFileSync("firestore.rules", "utf8") },
  });
});
after(async () => { if (env) await env.cleanup(); });

test("synthetic nested documents survive isolated snapshot and restore with permissions intact", async () => {
  await env.clearFirestore();
  const source = "couples/fixture-backup-source";
  const destination = "couples/fixture-backup-restored";
  const members = ["fixture-alice", "fixture-bob"];
  const meta = { members, roles: { "fixture-alice": 0, "fixture-bob": 1 }, code: "FIXTURE-ONLY" };
  const stamp = Timestamp.fromMillis(1730000000123);
  const paths = ["notes/n1", "plants/p1", "memories/m1"];
  const data = [
    { body: "synthetic-only", when: stamp },
    { species: "hoa-giay", stage: 2, when: stamp },
    { title: "fixture", tags: ["test", "restore"], when: stamp },
  ];
  await env.withSecurityRulesDisabled(async ctx => {
    const db = ctx.firestore();
    await setDoc(doc(db, source), meta);
    for (let i = 0; i < paths.length; i++) await setDoc(doc(db, source + "/" + paths[i]), data[i]);
  });
  // withSecurityRulesDisabled does not forward the callback's return value.
  // Capture the synthetic snapshot explicitly before restoring it.
  let snapshot;
  await env.withSecurityRulesDisabled(async ctx => {
    const db = ctx.firestore();
    const root = (await getDoc(doc(db, source))).data();
    const nested = [];
    for (const relative of paths) {
      const snap = await getDoc(doc(db, source + "/" + relative));
      assert(snap.exists());
      nested.push({ relative, data: snap.data() });
    }
    snapshot = { root, nested };
  });
  assert(snapshot, "synthetic snapshot must exist before restore");
  // Restore to a distinct synthetic ID; never overwrite the source.
  await env.withSecurityRulesDisabled(async ctx => {
    const db = ctx.firestore();
    await setDoc(doc(db, destination), snapshot.root);
    for (const entry of snapshot.nested) {
      await setDoc(doc(db, destination + "/" + entry.relative), entry.data);
    }
  });
  await env.withSecurityRulesDisabled(async ctx => {
    const db = ctx.firestore();
    assert.deepEqual((await getDoc(doc(db, destination))).data(), snapshot.root);
    for (const entry of snapshot.nested) {
      assert.deepEqual((await getDoc(doc(db, destination + "/" + entry.relative))).data(), entry.data);
    }
    assert.equal((await getDocs(collection(db, destination + "/notes"))).size, 1);
    assert.equal((await getDocs(collection(db, destination + "/plants"))).size, 1);
    assert.equal((await getDocs(collection(db, destination + "/memories"))).size, 1);
  });
  for (const uid of members) {
    const ctx = env.authenticatedContext(uid).firestore();
    await assertSucceeds(getDoc(doc(ctx, destination)));
    await assertSucceeds(getDoc(doc(ctx, destination + "/notes/n1")));
  }
  const outsider = env.authenticatedContext("fixture-eve").firestore();
  await assertFails(getDoc(doc(outsider, destination)));
  await assertFails(getDoc(doc(outsider, destination + "/plants/p1")));
  const anonymous = env.unauthenticatedContext().firestore();
  await assertFails(getDoc(doc(anonymous, destination)));
});
