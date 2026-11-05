/**
 * M1 prototype only. In-memory candidate-slot placement over the six existing
 * prerendered interiors; DOES NOT render or access Firebase.
 *
 * The anchor coordinates are reused from the existing "standing" spots solely
 * as candidate reference points. They are NOT visually approved for furniture:
 * the character or baked-in furniture may already occupy those positions.
 * Do not connect these slots to live UI or Firestore until visual review.
 */
export class PlacementPreviewError extends Error {
  constructor(code) {
    super(code);
    this.name = "PlacementPreviewError";
    this.code = code;
  }
}

export const ROOM_SOURCES = Object.freeze({
  "phong-khach": null,
  bep: "bep",
  "phong-anh": "phong_anh",
  "phong-em": "phong_em",
  "goc-sang-tao": "sang_tao",
  gac: "gac",
});
export const PREVIEW_ASSET_TYPES = Object.freeze(["chair", "lamp", "plant", "rug"]);
const ROTATIONS = Object.freeze([0, 90, 180, 270]);
const ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;
const MAX_PREVIEW_HISTORY = 20;

function reject(code) { throw new PlacementPreviewError(code); }
function finitePoint(point, width, height) {
  return Array.isArray(point) && point.length === 2 &&
    point.every(n => typeof n === "number" && Number.isFinite(n)) &&
    point[0] >= 0 && point[0] <= width && point[1] >= 0 && point[1] <= height;
}
const copyItems = items => items.map(item => ({ ...item }));

export function makePlacementPreview(scene) {
  if (!scene || typeof scene !== "object" || !scene.room || !scene.rooms)
    reject("INVALID_SCENE");
  const slots = [];
  for (const [roomId, sourceId] of Object.entries(ROOM_SOURCES)) {
    const source = sourceId === null ? scene.room : scene.rooms[sourceId];
    const size = source?.size;
    const candidateSpots = sourceId === null ? source?.dung?.slice(0, 2) : source?.spots?.dung;
    if (!Array.isArray(size) || size.length !== 2 ||
        !size.every(n => Number.isInteger(n) && n > 0) ||
        !Array.isArray(candidateSpots) || candidateSpots.length !== 2 ||
        !candidateSpots.every(p => finitePoint(p, size[0], size[1])))
      reject("INVALID_SCENE_ANCHORS");
    for (let i = 0; i < candidateSpots.length; i++) {
      slots.push(Object.freeze({
        id: `${roomId}-candidate-${i + 1}`,
        roomId,
        x: candidateSpots[i][0],
        y: candidateSpots[i][1],
        status: "VISUAL_APPROVAL_REQUIRED",
      }));
    }
  }
  return {
    protocol: "LOCAL_PREVIEW_ONLY",
    canPersist: false,
    slots: Object.freeze(slots),
    items: [],
    undoStack: [],
  };
}

function validateDraft(draft) {
  if (!draft || draft.protocol !== "LOCAL_PREVIEW_ONLY" ||
      draft.canPersist !== false || !Array.isArray(draft.slots) ||
      !Array.isArray(draft.items) || !Array.isArray(draft.undoStack))
    reject("INVALID_DRAFT");
}
function validType(type) {
  if (!PREVIEW_ASSET_TYPES.includes(type)) reject("UNKNOWN_ASSET");
}
function validRotation(degrees) {
  if (!ROTATIONS.includes(degrees)) reject("INVALID_ROTATION");
}
function slotFor(draft, roomId, slotId) {
  if (!Object.hasOwn(ROOM_SOURCES, roomId)) reject("UNKNOWN_ROOM");
  const slot = draft.slots.find(s => s.id === slotId && s.roomId === roomId);
  if (!slot) reject("UNKNOWN_SLOT");
  return slot;
}
function taken(draft, roomId, slotId, exceptId) {
  if (draft.items.some(x => x.roomId === roomId && x.slotId === slotId && x.id !== exceptId))
    reject("SLOT_OCCUPIED");
}
function snapshot(draft, items) {
  return {
    ...draft,
    items,
    undoStack: [...draft.undoStack.slice(-(MAX_PREVIEW_HISTORY - 1)), copyItems(draft.items)],
  };
}

/** Returns a new draft. A failed operation never mutates the original. */
export function applyPreviewAction(draft, action) {
  validateDraft(draft);
  if (!action || typeof action !== "object" || typeof action.kind !== "string")
    reject("INVALID_ACTION");
  if (action.kind === "undo") {
    if (!draft.undoStack.length) reject("NOTHING_TO_UNDO");
    return {
      ...draft,
      items: copyItems(draft.undoStack[draft.undoStack.length - 1]),
      undoStack: draft.undoStack.slice(0, -1),
    };
  }
  if (typeof action.id !== "string" || !ID_PATTERN.test(action.id))
    reject("INVALID_ITEM_ID");
  const index = draft.items.findIndex(x => x.id === action.id);
  if (action.kind === "place") {
    if (index >= 0) reject("DUPLICATE_ITEM_ID");
    validType(action.assetType);
    const slot = slotFor(draft, action.roomId, action.slotId);
    const rotation = action.rotation ?? 0;
    validRotation(rotation);
    taken(draft, slot.roomId, slot.id);
    return snapshot(draft, [...copyItems(draft.items), {
      id: action.id, assetType: action.assetType, roomId: slot.roomId,
      slotId: slot.id, x: slot.x, y: slot.y, rotation,
    }]);
  }
  if (index < 0) reject("UNKNOWN_ITEM");
  const existing = draft.items[index];
  if (action.kind === "remove") {
    return snapshot(draft, draft.items.filter(x => x.id !== action.id).map(x => ({ ...x })));
  }
  if (action.kind === "rotate") {
    validRotation(action.rotation);
    const items = copyItems(draft.items);
    items[index].rotation = action.rotation;
    return snapshot(draft, items);
  }
  if (action.kind === "move") {
    const slot = slotFor(draft, existing.roomId, action.slotId);
    taken(draft, existing.roomId, slot.id, action.id);
    const items = copyItems(draft.items);
    items[index] = { ...existing, slotId: slot.id, x: slot.x, y: slot.y };
    return snapshot(draft, items);
  }
  reject("UNKNOWN_ACTION");
}
