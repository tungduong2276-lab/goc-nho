import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";

// M0 App Check preparation. The test server disables the real Firebase startup, so these
// tests drive startAppCheck() with a stub SDK: no reCAPTCHA, no Firebase project, no network.
// They do NOT prove App Check works against the live project; that needs Console metrics.

const stubSdk = () => {
  window.__calls = [];
  class ReCaptchaEnterpriseProvider { constructor(key) { this.kind = "enterprise"; this.key = key; } }
  class ReCaptchaV3Provider { constructor(key) { this.kind = "v3"; this.key = key; } }
  const appCheck = () => ({ activate: (provider, refresh) => { window.__calls.push({ kind: provider.kind, key: provider.key, refresh }); } });
  window.firebase = { appCheck: Object.assign(appCheck, { ReCaptchaEnterpriseProvider, ReCaptchaV3Provider }) };
};
const run = (page, config) => page.evaluate(cfg => {
  window.FIREBASE_APP_CHECK = cfg;
  const result = startAppCheck();
  return { result, state: appCheckState, calls: window.__calls };
}, config);

test("shipped config keeps App Check off and contacts no attestation service", async ({ page }) => {
  const attestation = [];
  page.on("request", req => { if (/recaptcha|firebaseappcheck/i.test(req.url())) attestation.push(req.url()); });
  await page.goto("/#nha");
  await expect(page.locator("nav.tabs")).toBeVisible();
  expect(await page.evaluate(() => window.FIREBASE_APP_CHECK)).toEqual({ provider: "recaptcha-enterprise", siteKey: "" });
  await page.evaluate(stubSdk);
  expect(await page.evaluate(() => ({ result: startAppCheck(), state: appCheckState, calls: window.__calls })))
    .toEqual({ result: "off", state: "off", calls: [] });
  expect(attestation).toEqual([]);
});

test("a configured site key activates the chosen provider once with auto refresh", async ({ page }) => {
  await page.goto("/#nha");
  await page.evaluate(stubSdk);
  expect(await run(page, { provider: "recaptcha-enterprise", siteKey: "  synthetic-site-key  " }))
    .toEqual({ result: "monitoring", state: "monitoring", calls: [{ kind: "enterprise", key: "synthetic-site-key", refresh: true }] });
  await page.evaluate(stubSdk);
  expect(await run(page, { provider: "recaptcha-v3", siteKey: "synthetic-v3-key" }))
    .toEqual({ result: "monitoring", state: "monitoring", calls: [{ kind: "v3", key: "synthetic-v3-key", refresh: true }] });
});

test("missing key, unknown provider, missing SDK and SDK errors never break startup", async ({ page }) => {
  const errors = [];
  page.on("pageerror", e => errors.push(e.message));
  await page.goto("/#nha");
  await page.evaluate(stubSdk);
  for (const config of [undefined, null, {}, { provider: "recaptcha-enterprise" }, { provider: "recaptcha-enterprise", siteKey: "   " }, { provider: "recaptcha-enterprise", siteKey: 42 }])
    expect(await run(page, config)).toEqual({ result: "off", state: "off", calls: [] });
  expect(await run(page, { provider: "something-else", siteKey: "synthetic" })).toEqual({ result: "error", state: "error", calls: [] });
  expect(await run(page, { siteKey: "synthetic" })).toEqual({ result: "error", state: "error", calls: [] });

  await page.evaluate(() => { window.firebase = {}; });
  expect((await run(page, { provider: "recaptcha-enterprise", siteKey: "synthetic" })).result).toBe("unavailable");

  await page.evaluate(() => {
    class ReCaptchaEnterpriseProvider {}
    window.firebase = { appCheck: Object.assign(() => ({ activate() { throw new Error("synthetic SDK failure"); } }), { ReCaptchaEnterpriseProvider }) };
  });
  expect((await run(page, { provider: "recaptcha-enterprise", siteKey: "synthetic" })).result).toBe("error");
  expect(errors).toEqual([]);
});

test("App Check starts after initializeApp and before any other Firebase service", () => {
  const html = readFileSync("index.html", "utf8");
  const versions = [...html.matchAll(/gstatic\.com\/firebasejs\/([\d.]+)\/firebase-([a-z-]+)-compat\.js/g)].map(m => [m[2], m[1]]);
  expect(versions.map(v => v[0])).toEqual(["app", "auth", "firestore", "app-check"]);
  expect(new Set(versions.map(v => v[1])).size).toBe(1);

  const start = html.indexOf("function cloudInit(){"), body = html.slice(start, html.indexOf("\n}", start));
  const init = body.indexOf("firebase.initializeApp(cfg)"), appCheck = body.indexOf("startAppCheck();");
  expect(init).toBeGreaterThan(-1);
  expect(appCheck).toBeGreaterThan(init);
  expect(appCheck).toBeLessThan(body.indexOf("firebase.firestore()"));
  expect(appCheck).toBeLessThan(body.indexOf("firebase.auth()"));
  // Enforcement is a Console decision; the client must never carry a debug token switch.
  expect(html).not.toContain("FIREBASE_APPCHECK_DEBUG_TOKEN");

  const config = readFileSync("firebase-config.js", "utf8");
  expect(config).toMatch(/window\.FIREBASE_APP_CHECK = \{ provider: "recaptcha-enterprise", siteKey: "" \};/);
});
