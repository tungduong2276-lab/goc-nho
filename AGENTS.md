# Instructions for AI coding agents — Góc Nhỏ

**Read [docs/GOC-NHO-MASTER-ROADMAP.md](docs/GOC-NHO-MASTER-ROADMAP.md) in full before planning or implementing a new feature.** It is the durable product specification and handoff for future conversations.

## Project identity
- Private two-person Firebase web application; real user data exists.
- Vietnamese language, mobile-first, cute 3D/isometric world.
- Do not rebuild the app, erase collections, change live data schema or leak secrets without explicit review.
- Prioritized roadmap: **(0) Firebase safety foundation → (1) 3D house customization → (2) time/memory traces → (3) secret gifts → (4) expanded garden → (5) seasons/weather → (6) 3D museum → (7) cooperative mini-games → (8) memory book**.

## Before editing
1. Inspect latest `main`, open PRs and Actions. Do not assume a prior chat's state is current.
2. Read `index.html`, `assets/3d/scene.json`, rendering scripts, tests and relevant Firebase configuration.
3. Check PR #9 for unfinished house 3D/weather work and geometry stability. PR #10 has been merged as of 2026-11-03.
4. Plan data compatibility, Firestore Rules, offline/concurrent updates, backups and rollback.

## Definition of done
- Feature branch + PR, narrow reviewable changes, no unrequested production data mutations.
- `npm test` passes; add Firebase Emulator and two-client tests for shared data.
- 3D assets rendered and visually checked; touch targets validated on mobile.
- Security rules prevent unauthorized reads/writes; secret gift payload cannot be read early via direct API.
- Merge only after all checks; verify deployment separately.
- Update the roadmap's session handoff with verified changes and next action.

For new chats: user can say **“Đọc AGENTS.md và docs/GOC-NHO-MASTER-ROADMAP.md trong repo tungduong2276-lab/goc-nho; kiểm tra PR/CI mới nhất rồi tiếp tục milestone chưa hoàn thành.”**
