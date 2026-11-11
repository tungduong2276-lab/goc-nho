// Explicitly gated, operator-run preview-channel deployment. Never runs in CI.
import { execFileSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const project = "goc-nho-staging-2026";
if (process.argv.includes("--help")) {
  console.log("Run with NHA3D_STAGING_APPROVED=goc-nho-staging-2026 node scripts/deploy-nha3d-staging.mjs after reviewing Firebase Console project settings.");
  process.exit(0);
}
if (process.env.NHA3D_STAGING_APPROVED !== project) {
  console.error("STOP: explicit staging approval missing. Set NHA3D_STAGING_APPROVED=" + project + " only after confirming the separate project in Firebase Console.");
  process.exit(2);
}
const config = JSON.parse(readFileSync(resolve(root, "firebase.nha3d-staging.json"), "utf8"));
if (Object.keys(config).join(",") !== "hosting" || config.hosting.public !== "dist-nha3d-staging") {
  throw new Error("STOP: staging config must be Hosting-only and point to the isolated bundle.");
}
if (existsSync(resolve(root, ".firebaserc"))) {
  throw new Error("STOP: unexpected .firebaserc present. Inspect and remove any project alias ambiguity before proceeding.");
}
const run = (bin, args) => execFileSync(bin, args, { cwd: root, stdio: "inherit" });
run(process.execPath, ["--test", "tests/staging/nha3d-staging-bundle.test.mjs", "tests/staging/nha3d-hosting-config.test.mjs"]);
run(process.execPath, ["scripts/build-nha3d-staging.mjs"]);
console.log("Deploying only a Hosting preview channel to explicitly approved staging project:", project);
const require = createRequire(import.meta.url);
const firebasePkgPath = require.resolve("firebase-tools/package.json");
const firebasePkg = JSON.parse(readFileSync(firebasePkgPath, "utf8"));
const firebaseBin = typeof firebasePkg.bin === "string" ? firebasePkg.bin : firebasePkg.bin?.firebase;
if (!firebaseBin) throw new Error("STOP: installed firebase-tools does not declare the Firebase CLI entrypoint.");
// Node invokes the installed CLI directly, avoiding npx.cmd/.cmd spawn issues on Windows.
run(process.execPath, [resolve(dirname(firebasePkgPath), firebaseBin), "hosting:channel:deploy", "nha3d-review", "--project", project, "--config", "firebase.nha3d-staging.json", "--expires", "7d"]);
