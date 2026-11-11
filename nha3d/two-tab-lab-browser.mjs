// Opt-in same-origin two-tab LAB. No Firebase, network calls or persistent storage.
// NOTE: tabs must use the same Chrome profile and top-level storage partition.
import { createPresenceProtocol } from "./presence-lab.mjs?rev=20261111b";

const CHANNEL_NAME = "goc-nho-nha3d-two-tabs-lab-v1";
const HEARTBEAT_MS = 1_700;

export function createTwoTabPresenceLab({
  getLocalState, canOccupy, onRemoteChange, onStatusChange = () => {},
  getPairKey = () => "default"
}) {
  if ([getLocalState, canOccupy, onRemoteChange, onStatusChange, getPairKey].some(f => typeof f !== "function")) {
    throw new TypeError("Missing two-tab lab callback");
  }
  let channel = null, protocol = null, timer = null;
  let lastSentAt = 0, lastKey = "", lastHelloAt = 0, lastTickAt = 0, lastRemoteKey = "";
  let sent = 0, received = 0, ignored = 0, lastStatusKey = "", lastFailure = "";
  const randomId = () => {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");
  };
  const remote = () => protocol?.current() ?? null;
  function snapshot() {
    const peer = remote();
    const local = getLocalState();
    return {
      active: Boolean(channel),
      phase: channel ? (peer ? (peer.room === local?.room ? "connected" : "other-room") : "waiting") :
        (lastFailure ? "unsupported" : "off"),
      remoteRoom: peer?.room ?? null,
      sent, received, ignored, lastFailure,
      supported: typeof BroadcastChannel !== "undefined" && Boolean(globalThis.crypto?.getRandomValues)
    };
  }
  function report(force = false) {
    const state = snapshot();
    const key = [state.phase, state.remoteRoom, state.lastFailure, state.sent, state.received, state.ignored].join(":");
    if (force || key !== lastStatusKey) {
      lastStatusKey = key;
      onStatusChange(state);
    }
  }
  const emit = packet => {
    if (!channel) return;
    channel.postMessage(packet);
    sent++;
  };
  function notify() {
    const peer = remote();
    const key = peer ? [peer.id, peer.seq, peer.room, peer.cell.i, peer.cell.j].join(":") : "none";
    if (key !== lastRemoteKey) {
      lastRemoteKey = key;
      onRemoteChange(peer);
    }
    report();
  }
  function publish(force = false) {
    if (!channel || !protocol) return false;
    const local = getLocalState();
    if (!local || !canOccupy(local.room, local.cell)) return false;
    const key = local.room + ":" + local.cell.i + ":" + local.cell.j;
    const now = Date.now();
    if (!force && key === lastKey && now - lastSentAt < HEARTBEAT_MS) return false;
    if (!force && now - lastSentAt < 140) return false;
    lastSentAt = now; lastKey = key;
    emit(protocol.packet("state", local));
    return true;
  }
  function tick(force = false) {
    if (!channel || !protocol) return;
    const now = Date.now();
    if (!force && now - lastTickAt < 300) return;
    lastTickAt = now;
    publish();
    // Background requestAnimationFrame is frequently paused by browsers.
    // Respond to incoming "hello" in onmessage; setInterval is a backup
    // heartbeat while either tab is obscured.
    if (now - lastHelloAt > 2_700) {
      emit(protocol.packet("hello"));
      lastHelloAt = now;
    }
    notify(); // also expires silent/stale remote tabs
  }
  function start() {
    if (channel) return true;
    lastFailure = "";
    if (typeof BroadcastChannel === "undefined" || !globalThis.crypto?.getRandomValues) {
      lastFailure = "api-unavailable"; report(true); return false;
    }
    try {
      protocol = createPresenceProtocol({ selfId: randomId(), canOccupy });
      const requestedKey = getPairKey();
      const pairKey = typeof requestedKey === "string" && /^[a-zA-Z0-9_-]{8,40}$/.test(requestedKey)
        ? requestedKey : "default";
      // An explicit pair code isolates this test from forgotten older lab tabs.
      // It is ONLY a local channel name; it is NOT an authentication secret.
      channel = new BroadcastChannel(CHANNEL_NAME + ":" + pairKey);
      channel.onmessage = ({ data }) => {
        received++;
        const outcome = protocol.receive(data);
        if (outcome.kind === "hello") publish(true);
        else if (outcome.kind === "updated" || outcome.kind === "left") notify();
        else ignored++;
        report();
      };
      channel.onmessageerror = () => {
        ignored++; lastFailure = "message-unreadable"; report(true);
      };
      lastRemoteKey = ""; lastSentAt = 0; lastKey = "";
      lastHelloAt = Date.now(); lastTickAt = 0;
      emit(protocol.packet("hello"));
      publish(true);
      timer = setInterval(() => tick(true), HEARTBEAT_MS);
      notify();
      report(true);
      return true;
    } catch {
      channel?.close(); channel = null; protocol = null;
      if (timer !== null) clearInterval(timer);
      timer = null;
      lastFailure = "channel-init-failed"; report(true);
      return false;
    }
  }
  function stop() {
    if (channel && protocol) {
      try { emit(protocol.packet("bye")); } catch { /* page unloading */ }
    }
    if (timer !== null) clearInterval(timer);
    timer = null;
    channel?.close(); channel = null; protocol = null;
    lastKey = ""; lastSentAt = 0; lastRemoteKey = ""; lastHelloAt = 0;
    lastFailure = ""; lastTickAt = 0;
    onRemoteChange(null);
    report(true);
  }
  return { start, stop, tick, publish, remote, snapshot, get active() { return Boolean(channel); } };
}
