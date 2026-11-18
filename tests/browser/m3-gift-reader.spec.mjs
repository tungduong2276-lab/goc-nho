import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { deleteApp, initializeApp } from "firebase/app";
import { connectAuthEmulator, createUserWithEmailAndPassword, getAuth } from "firebase/auth";
import { Bytes, doc, setDoc, Timestamp } from "firebase/firestore";
import { initializeTestEnvironment } from "@firebase/rules-unit-testing";

const enabled = /^(127\.0\.0\.1|localhost):8080$/.test(process.env.FIRESTORE_EMULATOR_HOST || "")
  && /^(127\.0\.0\.1|localhost):9099$/.test(process.env.FIREBASE_AUTH_EMULATOR_HOST || "");
if (process.env.M3_GIFT_BROWSER_REQUIRED === "1" && !enabled) {
  throw new Error("Gift UI test requires local Firestore and Auth Emulators");
}
test.skip(!enabled, "Requires local Firestore and Auth Emulators");
test.describe.configure({ timeout: 95000 });

const config = {
  projectId: "demo-goc-nho-safety", apiKey: "local-emulator-only",
  authDomain: "localhost", appId: "1:123:web:local-only",
};
const cid = "fixture-gift-ui";
const password = "fixture-password";
const email = who => who + "-gift-ui@example.invalid";
const closedNote = "Fixture still sealed";
const readyNote = "Fixture ready to open";
const openedNote = "Fixture history from v1";
const photo = "/9j/2Q==";

async function account(who) {
  const app = initializeApp(config, "gift-" + who);
  try {
    const auth = getAuth(app);
    connectAuthEmulator(auth, "http://127.0.0.1:9099");
    return (await createUserWithEmailAndPassword(auth, email(who), password)).user.uid;
  } finally {
    await deleteApp(app);
  }
}

async function openHost(browser, who, uid) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: "block" });
  try {
    await context.route("**/*", async route => {
      const url = new URL(route.request().url());
      if (url.hostname === "127.0.0.1" && ["4173", "8080", "9099"].includes(url.port)) {
        if (url.pathname === "/firebase-config.js") {
          return route.fulfill({ contentType: "text/javascript", body: "window.FIREBASE_CONFIG=" + JSON.stringify(config) });
        }
        // Host gift panel is real. Rendering and cloud access by the island
        // iframe are outside this test and covered separately.
        if (url.pathname === "/nha3d/index.html") {
          return route.fulfill({ contentType: "text/html", body:
            '<script>parent.postMessage({type:"gocnho:ready"},location.origin)</script>' });
        }
        return route.continue();
      }
      const sdk = /^\/firebasejs\/10\.12\.2\/(firebase-(?:app|auth|firestore)-compat\.js)$/.exec(url.pathname);
      if (url.hostname === "www.gstatic.com" && sdk) {
        return route.fulfill({ contentType: "text/javascript", path: resolve("node_modules/firebase", sdk[1]) });
      }
      return route.abort("blockedbyclient");
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto("/index.html?m3GiftPreview=1");
    await page.waitForFunction(() => typeof CLOUD !== "undefined" && CLOUD.fs);
    await page.evaluate(({ email, password }) => firebase.auth().signInWithEmailAndPassword(email, password)
      .then(credential => credential.user.uid), { email: email(who), password });
    await expect.poll(() => page.evaluate(() => ({ uid: CLOUD.uid, ready: dbReady }))).toEqual({ uid, ready: true });
    await page.evaluate(() => { location.hash = "gifts"; });
    await expect(page.locator("#world-surface")).toBeVisible();
    await expect(page.locator("#gift-envelopes [data-gift-envelope]")).toHaveCount(2);
    return { context, page, errors };
  } catch (error) {
    await context.close();
    throw error;
  }
}

test("gift panel keeps opened history, defers sealed content to the server and excludes gifts from shared export", async ({ browser }) => {
  const env = await initializeTestEnvironment({
    projectId: config.projectId,
    firestore: { host: "127.0.0.1", port: 8080, rules: readFileSync("tests/firebase/fixtures/m3-gifts.rules", "utf8") },
  });
  const clients = [];
  try {
    const [alice, bob] = await Promise.all([account("alice"), account("bob")]);
    await env.withSecurityRulesDisabled(async ctx => {
      const db = ctx.firestore();
      await Promise.all([
        setDoc(doc(db, "users", alice), { couple: cid }),
        setDoc(doc(db, "users", bob), { couple: cid }),
        setDoc(doc(db, "couples", cid), { members: [alice, bob], roles: { [alice]: 0, [bob]: 1 }, code: "FIXTURE" }),
        setDoc(doc(db, "couples", cid, "meta", "main"), { names: ["A", "B"] }),
        setDoc(doc(db, "couples", cid, "gifts", "archived"), {
          id: "archived", from: 0, to: 1, key: "2020-01-01", label: "Dịp cũ",
          date: "2019-12-01T05:00:00.000Z", opened: true, note: openedNote, photos: [],
        }),
        setDoc(doc(db, "couples", cid, "gifts", "legacy-pending"), {
          id: "legacy-pending", from: 0, to: 1, key: "2099-01-01", label: "Dịp phải ẩn",
          date: "2020-01-01T05:00:00.000Z", opened: false, note: closedNote, photos: [],
        }),
      ]);
      for (const [id, year, note] of [["sealed", 2099, closedNote], ["ready", 2020, readyNote]]) {
        const base = doc(db, "couples", cid, "giftEnvelopes", id);
        await setDoc(base, { fromUid: alice, toUid: bob, createdAt: Timestamp.fromMillis(0),
          unlockAt: Timestamp.fromDate(new Date(year + "-01-01T00:00:00Z")) });
        await setDoc(doc(db, base.path, "private", "content"), { note, photos: [Bytes.fromBase64String(photo)] });
      }
    });

    const recipient = await openHost(browser, "bob", bob);clients.push(recipient);
    const p = recipient.page;
    await expect(p.locator("#gifts")).toContainText("Dịp cũ");
    await expect(p.locator("#gifts")).not.toContainText("Dịp phải ẩn");
    await expect(p.locator("#giftForm")).toHaveCount(0);
    await p.locator('[data-gopen="archived"]').click();
    await expect(p.locator("#v3modal")).toContainText(openedNote);
    await p.locator("#v3ok").click();

    await p.locator('[data-gopen-envelope="sealed"]').click();
    await expect(p.locator(".toast")).toContainText("chưa đến giờ mở");
    await expect(p.locator("#v3modal")).toHaveCount(0);
    await p.locator('[data-gopen-envelope="ready"]').click();
    await expect(p.locator("#v3modal")).toContainText(readyNote);
    await expect(p.locator("#v3modal img")).toHaveAttribute("src", "data:image/jpeg;base64," + photo);
    await p.locator("#v3ok").click();

    await p.evaluate(() => CLOUD.fs.disableNetwork());
    await p.locator('[data-gopen-envelope="ready"]').click();
    await expect(p.locator(".toast")).toContainText("Cần kết nối");
    await expect(p.locator("#v3modal")).toHaveCount(0);
    await p.evaluate(() => CLOUD.fs.enableNetwork());

    const sender = await openHost(browser, "alice", alice);clients.push(sender);
    await sender.page.locator('[data-gopen-envelope="sealed"]').click();
    await expect(sender.page.locator("#v3modal")).toContainText(closedNote);
    for (const client of clients) {
      const json = await client.page.evaluate(() => backupJSON());
      expect(JSON.parse(json).app).toBe("goc-nho-shared");
      expect(Object.hasOwn(JSON.parse(json).data, "gifts")).toBe(false);
      for (const secret of [openedNote, closedNote, readyNote, photo]) expect(json).not.toContain(secret);
      expect(client.errors).toEqual([]);
    }
  } finally {
    await Promise.all(clients.map(client => client.context.close()));
    await env.cleanup();
  }
});
