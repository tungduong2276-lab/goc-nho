# M7 — Chơi cùng: multi-theme expansion (design only)

**Status:** proposed product scope; no game engine, Firestore schema, UI or live data has been changed. M0–M6 retain their approved priority before M7 release.

## Design principle

The Chơi cùng tab should contain **several themed collections**, with meaningful variety rather than many reskins. Keep relaxed, opt-in, playful couple interactions without daily streak punishments, awkward forced confessions or involuntary public sharing. Each theme can include quick rounds (2–5 min) and longer sessions (10–15 min), accessible on mobile.

| Theme | Example game mode | Distinct core interaction |
|---|---|---|
| Hiểu nhau | Đoán ý người ấy | Both privately choose answers; synchronized reveal and optional discussion |
| Hợp tác giải đố | Hai nửa bí mật | One sees the map, one sees rules/keys; communication required |
| Thám hiểm | Bản đồ hai người | Each gets asymmetric clues to move along a shared map |
| Trinh thám | Hồ sơ bí ẩn | Build an evidence chain together without spoiling each other's clues |
| Sáng tạo | Viết truyện tiếp sức | Alternate short turns, optional branching endings |
| Vẽ và đoán | Nét vẽ bí mật | One sketches, the other guesses, with accessible non-drawing fallback |
| Trí nhớ | Khoảnh khắc biến mất | Both recall a changing set of objects; compare perspectives |
| Chiến thuật nhẹ | Bảo vệ ngôi nhà | Shared limited resources and different roles to solve an encounter |
| Hẹn hò vui | Vòng quay ý tưởng | Cooperative choice of activities with opt-out and mutual consent |
| Câu hỏi vui | Thật hay tưởng tượng | Exchange playful prompts and check answers after both lock choices |
| Phiêu lưu theo mùa | Lễ hội bốn mùa | Rotating storyboards and shared seasonal challenges, no FOMO |
| Âm nhạc/nhịp điệu | Đoán nhịp của nhau | Reproduce short **original** rhythmic patterns without copyrighted music |

## Release plan (future M7)

1. Build one reusable multiplayer session protocol: `lobby → ready → active → reveal/results → complete/abandoned`, server timestamps and bounded expiration, deterministic game versions and resume behavior. Add stable session IDs and revisions; no client-only victory authority.
2. First release: `Hai nửa bí mật` with two role-specific views; add `Đoán ý người ấy` as a small second mode only after framework tests pass.
3. Add theme carousel/category selector, accessibility modes, text-size controls and brief tutorials; preserve existing mini-games/data.
4. Introduce next modes in self-contained PRs, prioritized by validated playtest: detective, drawing, story, map exploration and light strategy.
5. Do not store private answers in records readable by the partner before reveal. Choose secure server-side reveal or an explicit non-secret design; check Rules via Emulator before release.

## Acceptance tests

Two simultaneous clients; outsider access denial; no early reveal by direct Firestore read; stable turn ordering; no duplicate score on retry; reconnect; timeout/abandonment; stale revision rejected; mobile 360/390/430px; keyboard operation; no production reads/writes in tests. All changes require CI and review before merge.
