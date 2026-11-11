import { test, expect } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { initializeTestEnvironment } from "@firebase/rules-unit-testing";
import { doc, setDoc } from "firebase/firestore";

// Browser push is tested ONLY inside a dedicated two-Emulator job.
// Default Playwright tests do not connect to any Firebase project.
const host = process.env.FIRESTORE_EMULATOR_HOST ?? "";
const authHost = process.env.FIREBASE_AUTH_EMULATOR_HOST ?? "";
const emulatorsReady = /^(localhost|127\.0\.0\.1):\d+$/.test(host) &&
  /^(localhost|127\.0\.0\.1):\d+$/.test(authHost);
if (process.env.NHA3D_EMULATOR_REALTIME_REQUIRED === "1" && !emulatorsReady) {
  throw new Error("REALTIME_GATE_NOT_RUN: required local Firestore+Auth Emulator host missing");
}
test.skip(!emulatorsReady, "Requires loopback Firestore and Auth Emulators");
test.describe.configure({ timeout: 120_000 });

const PROJECT = "demo-goc-nho-safety";
const CID = "fixture-couple";
const SESSION_A = "emulator_session_alice_01";
const SESSION_B = "emulator_session_bob_01";
const bundled = name => {
  const filename = resolve("node_modules/firebase", "firebase-" + name + "-compat.js");
  if (!existsSync(filename)) throw new Error("Missing local Firebase browser bundle: " + name);
  return filename;
};
async function start(browser, label) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }, serviceWorkers: "block",
  });
  const unexpected = [], blockedExternal = [];
  // Simulating browser network loss can trigger the Firebase SDK's own
  // connectivity probe against www.google.com. Block *every* non-loopback
  // request before transmission; only that known probe is tolerated.
  // A request to a real Firebase endpoint or unknown host still fails CI.
  await context.route("**/*", async route => {
    const u = new URL(route.request().url());
    const local = ["127.0.0.1", "localhost"].includes(u.hostname) &&
      [4173, Number(host.split(":")[1]), Number(authHost.split(":")[1])].includes(Number(u.port));
    if (local) return route.continue();
    blockedExternal.push(u.hostname);
    if (u.hostname !== "www.google.com")
      unexpected.push("Unexpected blocked external request: " + u.hostname);
    return route.abort("blockedbyclient");
  });
  const page = await context.newPage();
  page.on("pageerror", err => unexpected.push(err.message));
  await page.goto("/tests/browser/fixtures/nha3d-firestore-emulator.html");
  for (const module of ["app", "auth", "firestore"]) {
    await page.addScriptTag({ path: bundled(module) });
  }
  const uid = await page.evaluate(async ({ label, host, authHost, projectId }) => {
    const app = window.firebase.initializeApp({
      projectId, apiKey: "emulator-test-only", authDomain: "localhost",
      appId: "1:123456789:web:emulator-only",
    }, "test-" + label);
    const auth = app.auth();
    auth.useEmulator("http://" + authHost);
    const firestore = app.firestore();
    firestore.useEmulator(host.split(":")[0], Number(host.split(":")[1]));
    const credential = await auth.signInAnonymously();
    await credential.user.getIdToken();
    window.__nha3dLab = {
      app, firestore, uid: credential.user.uid,
      seen: [], errors: [], unsubscribe: null,
    };
    return credential.user.uid;
  }, { label, host, authHost, projectId: PROJECT });
  return { context, page, uid, unexpected, blockedExternal };
}
async function subscribe(page, partnerUid) {
  await page.evaluate(({ cid, partnerUid }) => {
    const lab = window.__nha3dLab;
    lab.unsubscribe = lab.firestore.doc(
      "couples/" + cid + "/nha3dPresence/" + partnerUid
    ).onSnapshot({ includeMetadataChanges: true }, snapshot => {
      if (snapshot.metadata.hasPendingWrites) return;
      const d = snapshot.exists ? snapshot.data() : null;
      lab.seen.push(d ? { uid: d.uid, room: d.room, seq: d.seq, i: d.i, j: d.j } : null);
    }, error => lab.errors.push(error.code));
  }, { cid: CID, partnerUid });
}
async function publish(page, room, i, j, seq, sessionId) {
  await page.evaluate(async ({ cid, room, i, j, seq, sessionId }) => {
    const lab = window.__nha3dLab;
    await lab.firestore.doc("couples/" + cid + "/nha3dPresence/" + lab.uid).set({
      v: 1, uid: lab.uid, room, i, j, seq, sessionId,
      updatedAt: window.firebase.firestore.FieldValue.serverTimestamp(),
      expiresAt: window.firebase.firestore.Timestamp.fromMillis(Date.now() + 10_000),
    });
  }, { cid: CID, room, i, j, seq, sessionId });
}
const received = (page, uid, seq, room) => page.evaluate(({ uid, seq, room }) =>
  window.__nha3dLab.seen.some(d => d?.uid === uid && d.seq === seq && d.room === room),
{ uid, seq, room });

test("two isolated Chromium profiles receive genuine authenticated onSnapshot updates", async ({ browser }) => {
  let env; const clients = [];
  try {
    env = await initializeTestEnvironment({
      projectId: PROJECT,
      firestore: {
        host: host.split(":")[0], port: Number(host.split(":")[1]),
        rules: readFileSync("tests/firebase/fixtures/m1-nha3d-presence.rules", "utf8"),
      },
    });
    await env.clearFirestore();
    const alice = await start(browser, "alice");
    clients.push(alice);
    const bob = await start(browser, "bob");
    clients.push(bob);
    expect(alice.uid).not.toBe(bob.uid);

    await env.withSecurityRulesDisabled(async admin => {
      await setDoc(doc(admin.firestore(), "couples/" + CID), {
        members: [alice.uid, bob.uid],
        roles: { [alice.uid]: 0, [bob.uid]: 1 },
        code: "SYNTHETIC",
      });
    });

    await subscribe(alice.page, bob.uid);
    await subscribe(bob.page, alice.uid);
    await publish(alice.page, "khach", 8, 11, 1, SESSION_A);
    await expect.poll(() => received(bob.page, alice.uid, 1, "khach"),
      { timeout: 15_000 }).toBe(true);
    await publish(bob.page, "khach", 8, 12, 1, SESSION_B);
    await expect.poll(() => received(alice.page, bob.uid, 1, "khach"),
      { timeout: 15_000 }).toBe(true);

    await alice.page.waitForTimeout(1300); // server Rules permit >=1s between writes
    await publish(alice.page, "bep", 0, 10, 2, SESSION_A);
    await expect.poll(() => received(bob.page, alice.uid, 2, "bep"),
      { timeout: 15_000 }).toBe(true);

    const eve = await start(browser, "eve");
    clients.push(eve);
    await subscribe(eve.page, alice.uid);
    await expect.poll(() => eve.page.evaluate(() =>
      window.__nha3dLab.errors.includes("permission-denied")),
    { timeout: 15_000 }).toBe(true);

    // Simulate loss of network on Alice's *entire isolated browser profile*.
    // Bob must still commit his next room state; Alice must not receive it
    // until her WebChannel reconnects and catches up from the Emulator.
    // Warm only the LOCAL source module before deliberately cutting network;
    // this test is about the offline guard, not whether offline import works.
    await alice.page.evaluate(async () => {
      const module = await import("/nha3d/emulator-presence-client.mjs");
      window.__createOfflinePresenceClient = module.createEmulatorPresenceClient;
    });
    await alice.context.setOffline(true);
    await expect.poll(() => alice.page.evaluate(() => navigator.onLine)).toBe(false);
    const blocked = await alice.page.evaluate(async ({ uid, partnerUid, host }) => {
      let writes = 0;
      const client = window.__createOfflinePresenceClient({
        projectId: "demo-goc-nho-safety",
        emulatorHost: host, cid: "fixture-couple",
        uid, partnerUid, sessionId: "offline_guard_test_01",
        canOccupy: () => true,
        isOnline: () => navigator.onLine,
        transport: {
          readOwn: async () => null,
          writeOwn: async () => { writes++; },
          subscribePartner: () => () => {},
          serverTimestamp: () => "sentinel",
          timestamp: ms => ({ toMillis: () => ms }),
        },
      });
      let code = null;
      try { await client.join("khach", { i: 8, j: 11 }); }
      catch (error) { code = error.code; }
      return { code, writes };
    }, { uid: alice.uid, partnerUid: bob.uid, host });
    expect(blocked).toEqual({ code: "OFFLINE_BLOCKED", writes: 0 });

    await publish(bob.page, "bep", 0, 9, 2, SESSION_B);
    await alice.page.waitForTimeout(250);
    expect(await received(alice.page, bob.uid, 2, "bep")).toBe(false);
    await alice.context.setOffline(false);
    await expect.poll(() => alice.page.evaluate(() => navigator.onLine)).toBe(true);
    await expect.poll(() => received(alice.page, bob.uid, 2, "bep"),
      { timeout: 15_000 }).toBe(true);

    // Disconnect the actual subscription and prove it cannot receive new
    // data until the user explicitly subscribes again.
    await bob.page.evaluate(() => {
      window.__nha3dLab.unsubscribe?.();
      window.__nha3dLab.unsubscribe = null;
    });
    await alice.page.waitForTimeout(1_300);
    await publish(alice.page, "ngu", 8, 0, 3, SESSION_A);
    await bob.page.waitForTimeout(250);
    expect(await received(bob.page, alice.uid, 3, "ngu")).toBe(false);
    await subscribe(bob.page, alice.uid);
    await expect.poll(() => received(bob.page, alice.uid, 3, "ngu"),
      { timeout: 15_000 }).toBe(true);

    for (const c of clients) {
      expect(c.unexpected).toEqual([]);
      expect(c.blockedExternal.every(hostname => hostname === "www.google.com")).toBe(true);
      if (c !== eve) expect(await c.page.evaluate(() => window.__nha3dLab.errors)).toEqual([]);
    }
  } finally {
    // Closing each browser context releases its actual WebChannel transport.
    // Never use force-exit or close arbitrary Node sockets to fake test success.
    for (const { page } of clients) {
      if (!page.isClosed()) {
        await page.evaluate(() => window.__nha3dLab?.unsubscribe?.()).catch(() => {});
      }
    }
    for (const c of clients) await c.context.close();
    await env?.cleanup();
  }
});
