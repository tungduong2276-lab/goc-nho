import { isDeepStrictEqual } from "node:util";

// Read-only rehearsal on synthetic snapshots. No Firebase client or writes.
const MAX_PHOTO_BYTES = 300000;
const MAX_PHOTOS = 3;
const MAX_NOTE_CHARS = 800;
const ID = /^[A-Za-z0-9][A-Za-z0-9_-]{0,119}$/;
const SHARED_COLLECTIONS = [
  "history", "dict", "museum", "places", "wishes", "letters", "rules",
  "care", "taps", "presence", "fridge", "story", "drawings", "kingdom",
  "treasures", "realm", "medals", "pet",
];
const plain = value => value !== null && typeof value === "object" &&
  Object.getPrototypeOf(value) === Object.prototype;

function confirmedRoles(house) {
  if (!plain(house) || !Array.isArray(house.members) || house.members.length !== 2 ||
      !plain(house.roles) || house.members.some(uid => typeof uid !== "string" ||
        uid.length === 0 || !Object.hasOwn(house.roles, uid))) {
    throw new Error("UNCONFIRMED_ROLES");
  }
  const roles = house.members.map(uid => house.roles[uid]);
  if (!roles.includes(0) || !roles.includes(1)) throw new Error("UNCONFIRMED_ROLES");
  return [house.members[roles.indexOf(0)], house.members[roles.indexOf(1)]];
}

function unlockTime(key) {
  if (typeof key !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(key)) return null;
  const utcDate = new Date(key + "T00:00:00.000Z");
  if (!Number.isFinite(utcDate.getTime()) || !utcDate.toISOString().startsWith(key)) return null;
  return new Date(key + "T00:00:00+07:00").toISOString();
}

function photoBase64(value) {
  const prefix = "data:image/jpeg;base64,";
  if (typeof value !== "string" || !value.startsWith(prefix)) return null;
  const encoded = value.slice(prefix.length);
  if (!encoded || encoded.length > 4 * Math.ceil(MAX_PHOTO_BYTES / 3) ||
      !/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)) return null;
  const bytes = Buffer.from(encoded, "base64");
  return bytes.length <= MAX_PHOTO_BYTES && bytes.toString("base64") === encoded ? encoded : null;
}

function prepare(gift, roles) {
  if (!plain(gift) || ![0, 1].includes(gift.from) || ![0, 1].includes(gift.to) ||
      gift.from === gift.to || typeof gift.opened !== "boolean") return { issue: "INVALID_LEGACY_RECORD" };
  if (gift.opened) return { issue: "KEEP_OPENED_HISTORY" };
  const unlockAt = unlockTime(gift.key);
  const createdAt = typeof gift.date === "string" ? new Date(gift.date) : null;
  if (!unlockAt || !createdAt || !Number.isFinite(createdAt.getTime()) ||
      createdAt.toISOString() !== gift.date) return { issue: "INVALID_DATE" };
  const { note, photos } = gift;
  if (typeof note !== "string" || note.length > MAX_NOTE_CHARS || !Array.isArray(photos) ||
      photos.length > MAX_PHOTOS || (!note.trim() && photos.length === 0)) {
    return { issue: "INVALID_PAYLOAD" };
  }
  const encoded = Array.from(photos, photoBase64);
  if (encoded.includes(null)) return { issue: "UNSUPPORTED_PHOTO" };
  return {
    envelope: { fromUid: roles[gift.from], toUid: roles[gift.to], createdAt: createdAt.toISOString(), unlockAt },
    payload: { note, photos: encoded },
  };
}

// destinations is a fixture snapshot keyed by the original ID. A destination
// entry uses both documents, ISO timestamps and canonical base64 photo bytes.
export function rehearseLegacyGiftMigration({ house, gifts, destinations = {} }) {
  const roles = confirmedRoles(house);
  if (!plain(gifts) || !plain(destinations)) throw new Error("INVALID_FIXTURE");
  return Object.entries(gifts).map(([id, gift]) => {
    if (!ID.test(id) || gift?.id !== id) throw new Error("INVALID_GIFT_ID");
    const expected = prepare(gift, roles);
    if (expected.issue) return { id, status: expected.issue };
    const status = !Object.hasOwn(destinations, id) ? "READY_TO_COPY"
      : isDeepStrictEqual(expected, destinations[id]) ? "ALREADY_COPIED" : "DESTINATION_CONFLICT";
    return { id, status };
  });
}

// Synthetic v1 snapshot projection. Explicitly select known non-gift groups
// and use a distinct format ID so the output cannot enter the v1 importer.
export function projectSharedSnapshot(legacy) {
  if (!plain(legacy) || legacy.app !== "hu-hen-ho" || legacy.v !== 1 || !plain(legacy.data)) {
    throw new Error("INVALID_V1_BACKUP");
  }
  const data = Object.fromEntries(SHARED_COLLECTIONS
    .filter(name => Object.hasOwn(legacy.data, name))
    .map(name => [name, legacy.data[name]]));
  return JSON.stringify({ app: "goc-nho-shared", v: 1, exported: legacy.exported, meta: legacy.meta, data });
}
