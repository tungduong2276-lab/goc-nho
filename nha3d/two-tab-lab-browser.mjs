// Browser-only same-origin/same-profile transport for the opt-in two-tab laboratory.
// BroadcastChannel does NOT connect separate phones, and does not authenticate users.
// No Firebase SDK, network requests, cookies, localStorage or persistent writes.
import { createPresenceProtocol } from "./presence-lab.mjs";

const CHANNEL_NAME = "goc-nho-nha3d-two-tabs-lab-v1";

export function createTwoTabPresenceLab({ getLocalState, canOccupy, onRemoteChange }) {
  if (typeof getLocalState !== "function" || typeof canOccupy !== "function" ||
      typeof onRemoteChange !== "function") throw new TypeError("Missing presence lab hooks");
  let channel = null, protocol = null, lastSentAt = 0, lastKey = "", lastHelloAt = 0;
  let lastRemoteKey = "";
  const randomId = () => {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");
  };
  const emit = message => { if (channel) channel.postMessage(message); };
  const remote = () => protocol?.current() ?? null;
  function notify() {
    const state = remote();
    const key = state ? [state.id, state.seq, state.room, state.cell.i, state.cell.j].join(":") : "none";
    if (key !== lastRemoteKey) {
      lastRemoteKey = key;
      onRemoteChange(state);
    }
  }
  function publish(force = false) {
    if (!channel || !protocol) return false;
    const local = getLocalState();
    if (!local || !canOccupy(local.room, local.cell)) return false;
    const key = local.room + ":" + local.cell.i + ":" + local.cell.j;
    const time = Date.now();
    if (!force && key === lastKey && time - lastSentAt < 1_500) return false;
    if (!force && time - lastSentAt < 140) return false;
    lastKey = key; lastSentAt = time;
    emit(protocol.packet("state", local));
    return true;
  }
  function start() {
    if (channel) return true;
    if (typeof BroadcastChannel === "undefined" || !globalThis.crypto?.getRandomValues) return false;
    try {
      protocol = createPresenceProtocol({ selfId: randomId(), canOccupy });
      channel = new BroadcastChannel(CHANNEL_NAME);
      channel.onmessage = ({ data }) => {
        const outcome = protocol.receive(data);
        if (outcome.kind === "hello") publish(true);
        else if (outcome.kind === "updated" || outcome.kind === "left") notify();
      };
      lastRemoteKey = ""; lastSentAt = 0; lastKey = ""; lastHelloAt = Date.now();
      emit(protocol.packet("hello"));
      publish(true);
      notify();
      return true;
    } catch {
      channel?.close(); channel = null; protocol = null;
      return false;
    }
  }
  function stop() {
    if (channel && protocol) emit(protocol.packet("bye"));
    channel?.close(); channel = null; protocol = null;
    lastKey = ""; lastSentAt = 0; lastRemoteKey = ""; lastHelloAt = 0;
    onRemoteChange(null);
  }
  function tick() {
    if (!channel) return;
    publish();
    // Background tabs can pause requestAnimationFrame. A foreground tab
    // periodically asks peers for state via a handshake, which is answered
    // by the BroadcastChannel message event (not dependent on animation).
    if (Date.now() - lastHelloAt >= 2_500) {
      emit(protocol.packet("hello"));
      lastHelloAt = Date.now();
    }
    notify(); // expires truly absent peers
  }
  return { start, stop, tick, publish, remote, get active() { return Boolean(channel); } };
}
