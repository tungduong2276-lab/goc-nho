import { artId, bookId, draft, key, painter, validId } from "../nha3d/creative.mjs";
import { createSyntheticManifest, compareSyntheticRestore } from "./m0-restore-manifest.mjs";

// Offline fixture rehearsal. Records use the M0 tagged JSON representation.
const WORLD = "couples/fixture-couple/world/";
const FORMAT = "goc-nho-synthetic-world-backup";
const MANIFEST_OPTIONS = { maxDocumentBytes: 512 * 1024 };
const GROUPS = ["layout", "life", "creative"];
const ID = /^[\w-]{1,120}$/;
const role = value => value === "anh" || value === "em";
const plain = value => value !== null && typeof value === "object" &&
  Object.getPrototypeOf(value) === Object.prototype;

function groupOf(id, fields) {
  switch (fields.k) {
    case "item":
      if (typeof fields.scene === "string" && typeof fields.uid === "string" &&
          id === "i_" + fields.scene + "_" + fields.uid &&
          plain(fields.it) && typeof fields.it.type === "string") return "layout";
      break;
    case "meta":
      if (typeof fields.scene === "string" && id === "m_" + fields.scene) return "layout";
      break;
    case "life":
      if (id === "l_home" && plain(fields.state)) return "life";
      break;
    case "creative-meta":
      if (["paint", "story"].includes(fields.kind) && validId(fields.id) &&
          id === key(fields.kind)) return "creative";
      break;
    case "creative-paint":
      if (role(fields.who) && validId(fields.session) &&
          id === painter(fields.who) && Array.isArray(fields.strokes)) return "creative";
      break;
    case "creative-draft":
      if (role(fields.who) && validId(fields.session) &&
          id === draft(fields.who) && typeof fields.text === "string") return "creative";
      break;
    case "creative-art":
      if (validId(fields.id) && id === artId(fields.id) &&
          Array.isArray(fields.strokes)) return "creative";
      break;
    case "creative-book":
      if (validId(fields.id) && id === bookId(fields.id) &&
          Array.isArray(fields.lines)) return "creative";
      break;
  }
  throw new Error("UNSUPPORTED_WORLD_DOCUMENT");
}

function inspectRows(rows) {
  if (!Array.isArray(rows)) throw new Error("INVALID_WORLD_ROWS");
  const records = [];
  const counts = Object.fromEntries(GROUPS.map(group => [group, 0]));
  const paths = new Set();
  for (const row of rows) {
    if (!plain(row) || Object.keys(row).sort().join(",") !== "fields,path" ||
        typeof row.path !== "string" || !row.path.startsWith(WORLD) || !plain(row.fields)) {
      throw new Error("INVALID_SYNTHETIC_WORLD_DOCUMENT");
    }
    const id = row.path.slice(WORLD.length);
    if (!ID.test(id)) throw new Error("INVALID_SYNTHETIC_WORLD_DOCUMENT");
    if (paths.has(row.path)) throw new Error("DUPLICATE_DOCUMENT");
    paths.add(row.path);
    if (id === "p_anh" || id === "p_em" || id.startsWith("a_")) continue;
    counts[groupOf(id, row.fields)]++;
    records.push(row);
  }
  return { records, counts };
}

export function encodeSyntheticWorldBackup(sourceRows) {
  const { records } = inspectRows(sourceRows);
  const manifest = createSyntheticManifest(records, MANIFEST_OPTIONS);
  return JSON.stringify({ app: FORMAT, v: 2, records, manifest });
}

export function readSyntheticWorldBackup(json) {
  const backup = JSON.parse(json);
  if (plain(backup) && backup.app === "hu-hen-ho" && backup.v === 1 && plain(backup.data)) {
    return { status: "LEGACY_V1", missingGroups: [...GROUPS] };
  }
  if (!plain(backup) || backup.app !== FORMAT || backup.v !== 2) {
    throw new Error("UNSUPPORTED_BACKUP_FORMAT");
  }
  const { records, counts } = inspectRows(backup.records);
  if (records.length !== backup.records.length) throw new Error("EXCLUDED_BACKUP_DOCUMENT");
  const verification = compareSyntheticRestore(backup.manifest, records, MANIFEST_OPTIONS);
  if (verification.status !== "SYNTHETIC_MANIFEST_MATCH") {
    return { status: "INVALID_CONTENT", verification };
  }
  return {
    status: "VERIFIED_WORLD",
    records,
    manifest: backup.manifest,
    counts,
    absentGroups: GROUPS.filter(group => counts[group] === 0),
  };
}

// The caller supplies the complete offline destination. The result contains
// only records to create; an incompatible record blocks the entire rehearsal.
export function planSyntheticWorldRestore(json, destinationRows) {
  const backup = readSyntheticWorldBackup(json);
  if (backup.status !== "VERIFIED_WORLD") return { ...backup, create: [] };
  const { records } = inspectRows(destinationRows);
  const existing = new Map(records.length
    ? createSyntheticManifest(records, MANIFEST_OPTIONS).documents.map(doc => [doc.path, doc.hash])
    : []);
  const conflicts = [];
  const matching = [];
  const missing = new Set();
  for (const { path, hash } of backup.manifest.documents) {
    if (!existing.has(path)) missing.add(path);
    else if (existing.get(path) === hash) matching.push(path);
    else conflicts.push(path);
  }
  const create = conflicts.length ? [] : backup.records.filter(row => missing.has(row.path));
  return {
    status: conflicts.length ? "CONFLICT" : create.length ? "READY" : "ALREADY_RESTORED",
    create,
    matching,
    conflicts,
    absentGroups: backup.absentGroups,
  };
}
