// Emulator-only, dependency-injected draft of authenticated two-user presence.
// Not imported by any shipped page. DO NOT point it at staging/production.
const ROOMS = new Set(["khach", "bep", "ngu"]);
const SESSION = /^[a-zA-Z0-9_-]{16,64}$/;
const TARGET_PROJECT = "demo-goc-nho-safety";
export const LEASE_MS = 10_000;
export const WRITE_INTERVAL_MS = 1_250;

const err = code => Object.assign(new Error(code), { code });
const textId = id => typeof id === "string" && /^[a-zA-Z0-9_-]{1,128}$/.test(id);
const cellOk = (room, cell) => ROOMS.has(room) && cell &&
  Number.isInteger(cell.i) && Number.isInteger(cell.j) &&
  cell.i >= 0 && cell.i < 16 && cell.j >= 0 && cell.j < 14;
const millis = value => value && typeof value.toMillis === "function" ?
  value.toMillis() : NaN;

export function readPeerPresence(data, {
  partnerUid, now = Date.now(), canOccupy, previous = null, pendingWrites = false,
} = {}) {
  if (pendingWrites || !data || typeof data !== "object" || Array.isArray(data) ||
      !textId(partnerUid) || data.v !== 1 || data.uid !== partnerUid ||
      !SESSION.test(data.sessionId ?? "") ||
      !Number.isSafeInteger(data.seq) || data.seq < 1 || data.seq > 1_000_000_000 ||
      !cellOk(data.room, { i: data.i, j: data.j }) ||
      typeof canOccupy !== "function" ||
      !canOccupy(data.room, { i: data.i, j: data.j })) return null;
  const updated = millis(data.updatedAt), expires = millis(data.expiresAt);
  if (!Number.isFinite(updated) || !Number.isFinite(expires) ||
      updated > now + 2_000 || expires <= now ||
      expires > updated + 15_000 || expires <= updated) return null;
  if (previous && previous.uid === partnerUid) {
    if (previous.sessionId === data.sessionId && data.seq <= previous.seq) return null;
    if (previous.sessionId !== data.sessionId && previous.expiresAt > now) return null;
  }
  return Object.freeze({
    uid: data.uid, sessionId: data.sessionId, seq: data.seq,
    room: data.room, cell: Object.freeze({ i: data.i, j: data.j }),
    updatedAt: updated, expiresAt: expires,
  });
}

export function createEmulatorPresenceClient({
  projectId, emulatorHost, cid, uid, partnerUid, sessionId, transport,
  canOccupy, isOnline = () => true, now = Date.now, onPeer = () => {},
  onError = () => {},
} = {}) {
  // An explicit runtime guard is required even with injected dependencies.
  // This module is NOT a general-purpose cloud transport.
  if (projectId !== TARGET_PROJECT ||
      !/^(localhost|127\.0\.0\.1):[1-9][0-9]*$/.test(emulatorHost ?? "")) {
    throw err("EMULATOR_ONLY");
  }
  if (![cid, uid, partnerUid].every(textId) || uid === partnerUid ||
      !SESSION.test(sessionId ?? "") ||
      [transport?.readOwn, transport?.writeOwn, transport?.subscribePartner,
       transport?.serverTimestamp, transport?.timestamp,
       canOccupy, isOnline, now, onPeer, onError].some(x => typeof x !== "function")) {
    throw err("INVALID_PRESENCE_CLIENT");
  }
  let active = false, closed = false, unsubscribe = null, seq = 0,
    lastWrittenAt = -Infinity, writePromise = null, peer = null;
  let previousRemote = null;
  const safeOccupy = (room, cell) => cellOk(room, cell) && Boolean(canOccupy(room, cell));
  function notify(value) {
    const key = x => x ? [x.uid, x.sessionId, x.seq, x.room, x.cell.i, x.cell.j].join(":") : "";
    if (key(peer) !== key(value)) {
      peer = value;
      onPeer(value);
    } else peer = value;
  }
  function getPeer() {
    if (peer && peer.expiresAt <= now()) notify(null);
    return peer && { ...peer, cell: { ...peer.cell } };
  }
  function receive(snapshot) {
    if (!active) return;
    if (!snapshot?.data) {
      previousRemote = null;
      notify(null);
      return;
    }
    const data = snapshot.data;
    if (snapshot.pendingWrites) return;
    const incoming = readPeerPresence(data, {
      partnerUid, now: now(), canOccupy: safeOccupy, previous: previousRemote,
    });
    // Invalid/stale messages must not clear a still-valid newer state.
    if (!incoming) {
      getPeer(); // expire client-side even when Firestore TTL deletion is delayed
      return;
    }
    previousRemote = incoming;
    notify(incoming);
  }
  async function publish(room, cell) {
    if (!active || closed) throw err("NOT_JOINED");
    if (!safeOccupy(room, cell)) throw err("INVALID_CELL");
    if (!isOnline()) throw err("OFFLINE_BLOCKED");
    if (writePromise) return { status: "busy" };
    if (now() - lastWrittenAt < WRITE_INTERVAL_MS) return { status: "throttled" };
    const candidate = seq + 1;
    const lease = now() + LEASE_MS;
    const payload = {
      v: 1, uid, room, i: cell.i, j: cell.j, sessionId, seq: candidate,
      updatedAt: transport.serverTimestamp(), expiresAt: transport.timestamp(lease),
    };
    // No offline queue, timers or automatic retries at this layer. The caller
    // must never turn on SDK offline persistence for this ephemeral feature.
    // The absolute expiry timestamp also rejects queued stale writes at Rules.
    // The Promise defers dispatch to a microtask. A synchronous disconnect
    // between publish() and dispatch must not send any location afterwards.
    writePromise = Promise.resolve().then(() => {
      if (!active || closed) return false;
      return Promise.resolve(transport.writeOwn(payload)).then(() => true);
    });
    try {
      const dispatched = await writePromise;
      if (!dispatched) return { status: "stopped-before-write" };
      if (!active) return { status: "stopped-after-write" };
      seq = candidate;
      lastWrittenAt = now();
      return { status: "published", seq: candidate };
    } catch (error) {
      // A timed-out/unknown commit may have succeeded. Increment locally,
      // avoiding a replay with the same seq; Rules can still reject duplicates.
      seq = candidate;
      onError(error);
      throw error;
    } finally {
      writePromise = null;
    }
  }
  async function join(room, cell) {
    if (active || closed) throw err("ALREADY_JOINED_OR_CLOSED");
    if (!safeOccupy(room, cell)) throw err("INVALID_CELL");
    if (!isOnline()) throw err("OFFLINE_BLOCKED");
    const existing = await transport.readOwn();
    if (closed) throw err("CLOSED");
    if (existing && millis(existing.expiresAt) > now() &&
        existing.sessionId !== sessionId) throw err("ACTIVE_SESSION");
    if (existing?.sessionId === sessionId &&
        Number.isSafeInteger(existing.seq) && existing.seq >= 1) seq = existing.seq;
    active = true;
    try {
      unsubscribe = transport.subscribePartner(receive, error => {
        if (active) { notify(null); onError(error); }
      });
      if (typeof unsubscribe !== "function") throw err("BAD_SUBSCRIPTION");
      const result = await publish(room, cell);
      if (result.status !== "published") throw err("JOIN_NOT_PUBLISHED");
      return result;
    } catch (error) {
      active = false;
      unsubscribe?.(); unsubscribe = null;
      notify(null);
      throw error;
    }
  }
  function disconnect() {
    // Local-only stop. Intentionally do not delete own Firestore document:
    // an old tab deleting a newer session's document is a known race.
    // Other client hides the stale presence when its short lease expires.
    if (closed) return;
    active = false; closed = true;
    unsubscribe?.(); unsubscribe = null;
    previousRemote = null;
    notify(null);
  }
  return {
    join, publish, disconnect, getPeer,
    tick: () => getPeer(),
    get status() { return active ? "joined" : closed ? "closed" : "idle"; },
    get sequence() { return seq; },
  };
}
