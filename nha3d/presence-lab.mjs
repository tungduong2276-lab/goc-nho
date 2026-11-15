// Opt-in, same-browser two-tab presence LAB. Pure contract: no network, Firebase, or persistence.
// Transport (e.g. BroadcastChannel) is provided by the view and is NOT authenticated.
// Never use this protocol as Firestore authorization or a remote-user identity.
export const PRESENCE_VERSION = 1;
export const PEER_TTL_MS = 8_000;
export const MAX_PACKET_AGE_MS = 12_000;
const TYPES = new Set(["hello", "state", "bye"]);
const ID_PATTERN = /^[a-zA-Z0-9_-]{16,96}$/;

export function createPresenceProtocol({ selfId, now = Date.now, canOccupy }) {
  if (!ID_PATTERN.test(selfId ?? "")) throw new TypeError("Invalid ephemeral tab identifier");
  if (typeof now !== "function" || typeof canOccupy !== "function") throw new TypeError("Missing validation callbacks");
  let sequence = 0;
  let peer = null;

  function current() {
    if (peer && now() - peer.receivedAt > PEER_TTL_MS) peer = null;
    return peer && { id: peer.id, seq: peer.seq, room: peer.room,
      cell: { ...peer.cell }, receivedAt: peer.receivedAt };
  }

  function packet(type, location = null) {
    if (!TYPES.has(type)) throw new TypeError("Unknown presence packet type");
    const outgoing = { v: PRESENCE_VERSION, type, id: selfId, seq: ++sequence, at: now() };
    if (type === "state") {
      if (!location || !canOccupy(location.room, location.cell)) {
        throw new TypeError("Local avatar state must use a walkable room tile");
      }
      outgoing.room = location.room;
      outgoing.cell = { i: location.cell.i, j: location.cell.j };
    }
    return outgoing;
  }

  function receive(message) {
    if (!message || typeof message !== "object" || Array.isArray(message) ||
        message.v !== PRESENCE_VERSION || !TYPES.has(message.type) ||
        !ID_PATTERN.test(message.id ?? "") || message.id === selfId ||
        !Number.isSafeInteger(message.seq) || message.seq < 1 ||
        !Number.isSafeInteger(message.at) ||
        message.at > now() + 2_000 || message.at < now() - MAX_PACKET_AGE_MS) {
      return { kind: "ignored" };
    }
    if (message.type === "hello") return { kind: "hello" };
    const existing = current();
    if (message.type === "bye") {
      if (!existing || existing.id !== message.id || message.seq <= existing.seq) return { kind: "ignored" };
      peer = null;
      return { kind: "left" };
    }
    if (!canOccupy(message.room, message.cell)) return { kind: "ignored" };
    // Only the first live peer is tracked; future authenticated transport will
    // enforce membership server-side rather than trusting client-chosen IDs.
    if (existing && (existing.id !== message.id || message.seq <= existing.seq)) return { kind: "ignored" };
    peer = { id: message.id, seq: message.seq, room: message.room,
      cell: { i: message.cell.i, j: message.cell.j }, receivedAt: now() };
    return { kind: "updated", peer: current() };
  }

  function reset() { peer = null; }
  return { packet, receive, current, reset };
}
