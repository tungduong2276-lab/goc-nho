import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { creativeState, readCreativeDocs } from "../../nha3d/creative.mjs";
import { applyLife, INITIAL_LIFE, sanitizeLife } from "../../nha3d/life.mjs";
import { decodeItem, encodeItem, itemId, metaId } from "../../nha3d/sync.mjs";
import { compareSyntheticRestore, createSyntheticManifest } from "../../scripts/m0-restore-manifest.mjs";
import {
  encodeSyntheticWorldBackup, planSyntheticWorldRestore, readSyntheticWorldBackup,
} from "../../scripts/m0-world-backup.mjs";

const timestamp = { __firestoreType: "timestamp", seconds: 1730000000, nanoseconds: 123456789 };
const row = (id, fields) => ({ path: "couples/fixture-couple/world/" + id, fields });
const at = 1730000000000;
const plant = { sp: "xalach", at, by: "anh", w: [[at + 1000, "em"]] };
const layout = [
  row(itemId("san", "crop"), {
    ...encodeItem("san", { uid: "crop", type: "luongTrong", gx: 2, gz: 3, plant }),
    ts: timestamp,
  }),
  row(metaId("nha"), { k: "meta", scene: "nha", wall: "#ABCDEF", floor: "#123456" }),
];
const pending = { recipe: "salad", by: "anh", at };
const life = row("l_home", { k: "life", state: { ...INITIAL_LIFE, pending } });
const stroke = (id, by) => ({ id, by, at, color: "#1D2B4F", width: 5, points: [{ x: 0.1, y: 0.2 }] });
const lines = [{ by: "anh", at, text: "Mở đầu." }, { by: "em", at, text: "Đoạn tiếp." }];
const creative = [
  row("cc_paint_meta", { k: "creative-meta", kind: "paint", id: "paint", title: "Buổi sáng" }),
  row("cc_paint_anh", { k: "creative-paint", who: "anh", session: "paint", strokes: [stroke("s1", "anh")] }),
  row("cc_paint_em", { k: "creative-paint", who: "em", session: "paint", strokes: [stroke("s2", "em")] }),
  row("cc_story_meta", { k: "creative-meta", kind: "story", id: "story", title: "Câu chuyện", lines }),
  row("cc_draft_em", { k: "creative-draft", who: "em", session: "story", text: "Đang viết." }),
  row("cc_art_finished", { k: "creative-art", id: "finished", title: "Màu nắng", strokes: [stroke("s3", "em")] }),
  row("cc_book_finished", { k: "creative-book", id: "finished", title: "Một ngày", lines }),
];
const durable = [...layout, life, ...creative];
const source = [...durable, row("p_anh", { k: "presence" }), row("a_date_old", { k: "activity" })];

test("serialized 3D backup restores to a separate fixture and loads through the app data readers", async t => {
  const dir = await mkdtemp(join(tmpdir(), "goc-nho-world-backup-"));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const destinationFile = join(dir, "synthetic-destination.json");

  const json = encodeSyntheticWorldBackup(source);
  const backup = readSyntheticWorldBackup(json);
  assert.equal(backup.status, "VERIFIED_WORLD");
  assert.deepEqual(backup.counts, { layout: 2, life: 1, creative: 7 });
  assert.deepEqual(backup.absentGroups, []);
  const plan = planSyntheticWorldRestore(json, []);
  assert.equal(plan.status, "READY");
  await writeFile(destinationFile, JSON.stringify(plan.create), { flag: "wx" });
  const restored = JSON.parse(await readFile(destinationFile, "utf8"));

  const verification = compareSyntheticRestore(createSyntheticManifest(durable), restored);
  assert.equal(verification.status, "SYNTHETIC_MANIFEST_MATCH");
  assert.deepEqual(restored[0].fields.ts, timestamp);
  assert.deepEqual(decodeItem(restored[0].fields).plant, plant);
  const home = sanitizeLife(restored.find(doc => doc.path === life.path).fields.state);
  assert.deepEqual(home.pending, pending);
  const finished = applyLife(home, { type: "finishCook" }, "em", at + 2000);
  assert.equal(finished.ok, true);
  assert.equal(finished.next.stock.xalach, INITIAL_LIFE.stock.xalach - 2);
  const art = creativeState(readCreativeDocs(restored.map(doc => ({
    id: doc.path.split("/").at(-1), data: doc.fields,
  }))));
  assert.equal(art.painting.anh.length, 1);
  assert.equal(art.painting.em.length, 1);
  assert.equal(art.story.drafts.em, "Đang viết.");
  assert.deepEqual(art.artworks.map(work => work.title), ["Màu nắng"]);
  assert.deepEqual(art.books[0].lines, lines);
});

test("legacy backup reports the three missing groups without importing its payload", () => {
  const legacy = JSON.stringify({ app: "hu-hen-ho", v: 1, meta: {}, data: { gifts: { x: { body: "sealed" } } } });
  assert.deepEqual(planSyntheticWorldRestore(legacy, []), {
    status: "LEGACY_V1", missingGroups: ["layout", "life", "creative"], create: [],
  });
  assert.throws(() => readSyntheticWorldBackup(JSON.stringify({ app: "hu-hen-ho", v: 3, data: {} })),
    /UNSUPPORTED_BACKUP_FORMAT/);
});

test("an absent feature group is reported for valid partial source data", () => {
  const json = encodeSyntheticWorldBackup(layout);
  assert.deepEqual(planSyntheticWorldRestore(json, []).absentGroups, ["life", "creative"]);
});

test("different payload and missing or extra records block the whole restore", () => {
  const tampered = JSON.parse(encodeSyntheticWorldBackup(source));
  tampered.records.shift();
  tampered.records[0].fields.wall = "altered";
  const extra = row(metaId("san"), { k: "meta", scene: "san" });
  tampered.records.push(extra);
  const plan = planSyntheticWorldRestore(JSON.stringify(tampered), []);
  assert.equal(plan.status, "INVALID_CONTENT");
  assert.deepEqual(plan.verification.missing, [layout[0].path]);
  assert.deepEqual(plan.verification.changed, [layout[1].path]);
  assert.deepEqual(plan.verification.extra, [extra.path]);
  assert.deepEqual(plan.create, []);
});

test("matching records are skipped, unrelated destination records are preserved, and conflicts produce no writes", () => {
  const json = encodeSyntheticWorldBackup(source);
  const extra = row(metaId("san"), { k: "meta", scene: "san" });
  const partial = planSyntheticWorldRestore(json, [layout[0], extra]);
  assert.deepEqual(partial.matching, [layout[0].path]);
  assert.deepEqual(partial.create, durable.slice(1));
  const repeated = planSyntheticWorldRestore(json, [layout[0], extra, ...partial.create]);
  assert.equal(repeated.status, "ALREADY_RESTORED");
  assert.deepEqual(repeated.create, []);
  const edited = { ...layout[0], fields: { ...layout[0].fields, w: [] } };
  const conflict = planSyntheticWorldRestore(json, [edited]);
  assert.equal(conflict.status, "CONFLICT");
  assert.deepEqual(conflict.conflicts, [layout[0].path]);
  assert.deepEqual(conflict.create, []);
});

test("invalid JSON, path/ID mismatches, and duplicate records are rejected", () => {
  assert.throws(() => readSyntheticWorldBackup("{"), SyntaxError);
  assert.throws(() => encodeSyntheticWorldBackup([...source, life]), /DUPLICATE_DOCUMENT/);
  assert.throws(() => encodeSyntheticWorldBackup([row("cc_book_other", creative.at(-1).fields)]),
    /UNSUPPORTED_WORLD_DOCUMENT/);
  assert.throws(() => encodeSyntheticWorldBackup([{ ...life, path: "couples/another/world/l_home" }]),
    /INVALID_SYNTHETIC_WORLD_DOCUMENT/);
  assert.throws(() => encodeSyntheticWorldBackup([{ ...life, path: "couples/fixture-couple/gifts/private" }]),
    /INVALID_SYNTHETIC_WORLD_DOCUMENT/);
  const tampered = JSON.parse(encodeSyntheticWorldBackup(source));
  tampered.records.push(source.at(-1));
  assert.throws(() => readSyntheticWorldBackup(JSON.stringify(tampered)), /EXCLUDED_BACKUP_DOCUMENT/);
  assert.throws(() => planSyntheticWorldRestore(encodeSyntheticWorldBackup([life]), [life, life]),
    /DUPLICATE_DOCUMENT/);
});
