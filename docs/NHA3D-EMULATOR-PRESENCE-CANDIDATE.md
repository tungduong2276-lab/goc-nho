# Nhà 3D M1 — candidate authenticated two-person presence, **Emulator only**

**Status: prototype protocol + Firestore Rules security fixture, NOT deployed, NOT authorized for real users.**

This work continues PR #97 after the user reported **6/6 PASS** for the *same-browser* `BroadcastChannel` two-tab experiment on 2026-11-11. The new contract is a **separate** forward-looking Firestore candidate. It does not connect real phones.

## Scope and isolated files

- `tests/firebase/fixtures/m1-nha3d-presence.rules` is a candidate only; root `firestore.rules` and `firebase.json` remain unchanged.
- `tests/firebase/nha3d-presence-rules.test.mjs` uses loopback Firestore Emulator and synthetic identities Alice, Bob, Eve. The test refuses to run without `FIRESTORE_EMULATOR_HOST`.
- No Firebase SDK is added to `nha3d/multiroom-preview.*`, `nha3d/two-tab-lab-browser.mjs` or the static Hosting artifact. Current staging `nha3d-review` remains a 16-file, same-browser-only demo.
- **No authenticated two-phone UI/transport has been implemented or deployed yet.**

## Proposed data model (a dedicated ephemeral collection)

`couples/{cid}/nha3dPresence/{uid}`: exactly one small document per current member. Proposed fields:

| Field | Type | Rules boundary |
|---|---|---|
| `v` | integer | literal `1` |
| `uid` | string | matches authenticated UID and document ID |
| `room` | string | `khach` / `bep` / `ngu` |
| `i`, `j` | integers | `0 <= i < 16`, `0 <= j < 14` based on the *currently approved static preview dimensions only* |
| `sessionId` | string | 16–64 ASCII URL-safe characters; **not authentication** |
| `seq` | integer | 1..1e9, must increase within a session |
| `updatedAt` | server timestamp | **must equal `request.time`** |
| `expiresAt` | timestamp | later than `request.time`, no more than 15 s later |

The Rules fixture allows read/list only to members of this couple, create/update/delete only to the **owner UID**, rejects forged actor and malformed payload, enforces 1-second minimum delay between updates, enforces monotonic sequence numbers in one session, and only permits a different session ID to replace an **expired** one. Revoking membership blocks an old member's reads/writes.

**Important security limitation:** Rules can enforce room bounds but not the current furniture collision map. A malicious authenticated member can claim any in-bounds coordinate, so a future rendered peer must verify local walkability. The other member's UI must treat stale/expired data as offline, and should reject invalid, out-of-order or pending-write snapshots. Firestore document TTL is **not automatic**; using `expiresAt` in a field does not itself delete records. Server-side TTL cleanup, cost/abuse limits and explicit leave cleanup still need design.

### Mandatory overlapping-rules exclusion

Legacy `firestore.rules` grants members broad recursive write access to nested collections. A narrow `match /nha3dPresence/{uid}` **cannot** override that grant because Rules combine matching `allow` clauses with OR. The candidate explicitly excludes `nha3dPresence` from the legacy grant while preserving prior exclusions for `roomObjects` and `writeOps`. **Do not deploy only the narrow block without the exclusion.**

### Threat-model and product decisions not settled

1. **Presence vs tracking:** make joining a shared room opt-in, display an explicit exit/visibility control, do not retain movement history, keep only coarse cell/room and 15-second presence leases.
2. **Cost:** server-enforced 1-second minimum between accepted updates still allows 3,600 writes per hour per person; a production design needs lower frequency, quotas, backoff and budget alerts. Firebase Security Rules do not provide per-IP abuse throttling.
3. **Reconnect:** if an app restarts while its previous session is live, a new session cannot take over until lease expiry (up to 15 seconds), unless the owner performs a valid authenticated delete; this is intentional for now. Offline queued Firestore writes should not be blindly replayed.
4. **Identity:** only Auth UID is a security identity. Never trust `sessionId`, room ID, query string, BroadcastChannel peer ID or a user-supplied `uid` as proof of membership.
5. **Actual deployed Rules:** none verified on the cloud in this step. Existing live root rules are **not safe for this new collection**, so wiring a Firebase client is forbidden before reviewed rules and M0 sign-off.
6. **Geometry:** the 16×14 bounds are from the static three-room preview; room dimensions and furniture layout approval on PR #9 are still outstanding.

## Tests and release gates

Run the exact full test command using `npm test`. In particular, `npm run test:firebase` invokes only `demo-goc-nho-safety` Firestore Emulator. Expected security cases: Alice/Bob own-write/partner-read, Eve/anonymous denied, third-house isolation, extra fields/bounds/timestamps rejected, stale sequence/duplicate update denied, active-session takeover denied, expired-session replacement, owner-only leave, membership revocation, other M0 roomObjects/writeOps still protected, legacy notes preserved.

**This does not close M0.** Before real two-phone staging connection or merging PR #97: independently verify managed Cloud Firestore **staging-source → separate staging-target** export/restore with real operation records; audit deployed Rules/Auth/App Check/IAM and rollback in the exact staging project; review potential Rules call-budget/Firestore billing/TTL; test authenticated device pair, offline/reconnect and revision conflicts; obtain PR #9 visual room approval. Real data of the two users is never a test fixture. Do not copy production documents.


## Next slice — injectable Emulator client, no cloud release (2026-11-11)

- `nha3d/emulator-presence-client.mjs` is an **unwired** adapter prototype: no Firebase SDK imports, no HTTP calls and **no import in either preview page or production app**. It requires an injected transport, exact project `demo-goc-nho-safety` and loopback `127.0.0.1:PORT` or `localhost:PORT`. This is a defense-in-depth testing guard, not a formal guarantee against malicious dependencies.
- Integration harness `tests/firebase/nha3d-presence-client.test.mjs` supplies Firestore SDK `getDoc`, `setDoc`, `onSnapshot`, `serverTimestamp` and `Timestamp` bound to the Emulator, with two authenticated synthetic clients. `tests/staging/nha3d-emulator-presence-client.test.mjs` supplies a deterministic fake transport to test stale snapshots, TTL/room validation, lifecycle, offline stop and boundary checks.
- Outgoing data is limited to `{v,uid,room,i,j,sessionId,seq,updatedAt,expiresAt}` and authenticated member collection path. Use absolute expiration at approximately 10s and server timestamp for the write time; **the client clock is only an estimate for expiry**, so production must account for clock skew. The Rules fixture keeps a maximum 15s lease and a minimum 1s interval. The adapter adds a 1.25s local write guard and never schedules background retries or maintains a location history.
- Incoming snapshots must match authenticated partner UID, valid room/grid, `canOccupy` cell validation, fresh server-time lease, increasing sequence and compatible session; ignore uncommitted/pending snapshots. A local tick hides expired peers even when Firestore has not deleted the document.
- `disconnect()` only unsubscribes and clears the UI; it intentionally **does not delete** the Firestore document. An older device could otherwise delete a newer session's document under the current owner-only delete rule. The other device may see the last state until its lease expires (up to ~10s). An additional Rules proposal should deny delete by default or use a trusted, session-specific conditional mutation before enabling live clients.
- Offline gate `isOnline()` blocks writes while explicitly offline. **Caveat:** an SDK may still queue a write if the network disappears *after* the preflight check; this cannot be prevented by the pure adapter alone. Its absolute deadline helps reject delayed stale writes at the Rules boundary. Never enable persistent offline cache for this feature without security/reconnect acceptance.
- If a previous active session occupies the same UID, joining with a different session ID fails closed until the lease expires. Backoff/retry scheduling, client/server clock differences, actual reconnect under unstable connectivity and quota management remain future tests.
- The isolated 16-file static review bundle explicitly excludes `nha3d/emulator-presence-client.mjs` and the fixture Rules. **No deploy or update to the already accepted V2.2 Preview Channel is warranted by this increment.**

### Engineering tests for this slice

1. Strict target guard rejects real staging, production and non-loopback hosts.
2. Deterministic snapshots reject forged UID, malformed sessions, blocked cells, stale sequence, future timestamps, pending writes and old leases.
3. Offline guard rejects direct writes, 1.25s throttling and disconnect (without persistent delete).
4. Two independent authenticated Firestore Emulator instances can create and observe presence for each other and see a room transition; Eve cannot forge a write.
5. The build manifest excludes this module; the original simulated-companion and same-browser two-tab demos remain unchanged.

**The exact-head CI result is required before treating these tests as verified.** Emulator success alone cannot satisfy the still-open cloud M0 export/restore, deployed Rules/Auth/App Check/IAM and rollback, PR #9 geometry review, or two-device usability gates.
