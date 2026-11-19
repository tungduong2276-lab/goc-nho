import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, readFileSync, lstatSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const PROJECT = "goc-nho-staging-2026";
const ROOT = fileURLToPath(new URL("../", import.meta.url));
const RULES = "tests/firebase/fixtures/m3-gifts.rules";
const ROOT_ASSETS = new Set(["manifest.webmanifest", "icon-192.png", "icon-512.png", "apple-touch-icon.png"]);
const RUNTIME_PATH = /^(?:src|nha3d|assets)\/(?:[A-Za-z0-9_-]+\/)*[A-Za-z0-9_.-]+\.(?:css|html|js|mjs|json|png|svg|webp|jpe?g|woff2?)$/;
const UID = /^[A-Za-z0-9_-]{1,128}$/;
const STAGING_ORIGIN = String.raw`location.protocol==="https:" && /^goc-nho-staging-2026--m3-gifts-[a-z0-9-]+\.web\.app$/.test(location.hostname)`;
const STAGING_MODE = `const giftStaging=${STAGING_ORIGIN} && window.FIREBASE_CONFIG?.projectId==="${PROJECT}";\nconst giftPreview=giftStaging;`;

function validateTesterUids(testerUids) {
  if (!Array.isArray(testerUids) || testerUids.length !== 2 || testerUids[0] === testerUids[1] ||
      !testerUids.every(uid => typeof uid === "string" && UID.test(uid))) {
    throw new Error("Expected two distinct test account UIDs");
  }
}

function validatedSettings(options) {
  const { firebase, testerUids } = options ?? {};
  if (firebase?.projectId !== PROJECT || firebase.authDomain !== PROJECT + ".firebaseapp.com" ||
      !/^AIza[A-Za-z0-9_-]{30,}$/.test(firebase.apiKey ?? "") ||
      !/^1:\d+:web:[a-f0-9]+$/i.test(firebase.appId ?? "")) {
    throw new Error("Expected the Web app configuration for " + PROJECT);
  }
  validateTesterUids(testerUids);
  const { projectId, authDomain, apiKey, appId } = firebase;
  return { firebase: { projectId, authDomain, apiKey, appId }, testerUids };
}

function replaceRequired(source, before, after) {
  const changed = source.replace(before, () => after);
  if (changed === source) throw new Error("Staging source has changed: " + before);
  return changed;
}

function stagingHtml(source) {
  const localGate = /const giftPreview=\["localhost","127\.0\.0\.1"\]\.includes\(location\.hostname\)[\s\S]*?==="demo-goc-nho-safety";/;
  let html = replaceRequired(source, localGate, STAGING_MODE);
  html = replaceRequired(html, "function cloudInit(){", 'function cloudInit(){\n  if(!giftStaging){showGate("config");return;}');
  html = replaceRequired(html,
    /  if\(giftPreview\)\{firebase\.auth\(\)\.useEmulator[^\n]+\n  else try\{fs\.enablePersistence[^\n]+/,
    "  // Keep staging gift caches in memory.");
  return replaceRequired(html, /^if\("serviceWorker" in navigator\)window\.addEventListener\("load",[\s\S]*?^function netState\(/m,
    "function netState(");
}

export function stagingRules(source, testerUids) {
  validateTesterUids(testerUids);
  const header = "match /databases/{database}/documents {";
  if (!source.includes("request.auth != null")) throw new Error("Expected authenticated candidate Rules");
  return replaceRequired(source.replaceAll("request.auth != null", "isGiftTester()"), header,
    header + "\n    function isGiftTester() {\n      return request.auth != null && request.auth.uid in " +
    JSON.stringify(testerUids) + ";\n    }");
}

export function buildGiftStaging({ root = ROOT, output, settings, tracked }) {
  const { firebase, testerUids } = validatedSettings(settings);
  const html = stagingHtml(readFileSync(resolve(root, "index.html"), "utf8"));
  const rules = stagingRules(readFileSync(resolve(root, RULES), "utf8"), testerUids);
  const paths = tracked ?? execFileSync("git", ["ls-files", "-z"], { cwd: root, encoding: "utf8" }).split("\0");
  const files = paths.filter(file => RUNTIME_PATH.test(file) || ROOT_ASSETS.has(file));
  if (!files.includes("nha3d/index.html") || !files.includes("src/world-home.js")) {
    throw new Error("Expected the main island runtime");
  }
  for (const file of files) if (!lstatSync(resolve(root, file)).isFile()) throw new Error("Missing runtime file " + file);

  mkdirSync(output);
  const publicDir = resolve(output, "public");
  mkdirSync(publicDir);
  for (const file of files) {
    const dest = resolve(publicDir, file);
    mkdirSync(dirname(dest), { recursive: true });
    copyFileSync(resolve(root, file), dest);
  }
  writeFileSync(resolve(publicDir, "index.html"), html);
  writeFileSync(resolve(publicDir, "firebase-config.js"), `if (${STAGING_ORIGIN}) window.FIREBASE_CONFIG=${JSON.stringify(firebase)};\n`);
  writeFileSync(resolve(output, "firestore.staging.rules"), rules);
  writeFileSync(resolve(output, ".firebaserc"), JSON.stringify({ projects: { default: PROJECT } }, null, 2));
  writeFileSync(resolve(output, "firebase.json"), JSON.stringify({
    firestore: { rules: "firestore.staging.rules" },
    hosting: {
      site: PROJECT, public: "public",
      headers: [{ source: "**", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }] }],
    },
  }, null, 2));
  return { fileCount: files.length + 2, project: PROJECT };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const input = process.argv[2];
  if (!input || process.argv.length !== 3) throw new Error("Usage: node scripts/build-m3-gift-staging.mjs <staging-settings.json>");
  const result = buildGiftStaging({
    output: resolve(ROOT, "dist-m3-gift-staging"),
    settings: JSON.parse(readFileSync(resolve(input), "utf8")),
  });
  console.log("Staging package built:", result.fileCount, "public files for", result.project);
}
