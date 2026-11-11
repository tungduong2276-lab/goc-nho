# Nhà 3D — Mobile acceptance & release gate (PR #93)

> 2026-11-08. This is a **test protocol**, not evidence that real-device testing has passed. Branch based on PR #93, not production main.

## Scope and invariant
- Prototype remains standalone under `nha3d/`; no Firebase network requests or writes.
- Do not modify legacy `index.html`, `sw.js`, Firestore Rules, production schemas or real couple data.
- Never merge this prototype to main on CI alone; obtain two-person, real-device approval.

## Required real-device matrix
Test on at least two distinct physical phones, one iOS Safari and one Android Chrome when available. Record model, OS, browser version, screen width, orientation, and battery-saving settings. Repeat at 360, 390 and 430 CSS px via browser automation (simulation is not physical-device evidence).

| Scenario | Expected result | Evidence to attach |
| --- | --- | --- |
| Cold load, warm reload, airplane-mode reload | Clear loading/error state; no unhandled exceptions; no unexpected Firebase calls | Console/network capture |
| Joystick, tap-to-walk, obstacle and wall collisions | Avatar never passes through walls/furniture; route is reachable | Screen recording |
| Two-person sofa, bed, fridge and wardrobe actions | Interactions remain reachable and can be dismissed | Screen recording |
| Add, rotate, drag, cancel, store, undo furniture | Validity preview matches actual placement; no overlap/out-of-bounds | Before/after screenshots |
| Reload after layout and outfit changes | Local changes persist on same browser only | Before/after screenshots |
| Touch near safe-area, header, tray, bottom buttons | No hidden or overlapping hit targets; usable one-handed | Annotated screenshots |
| Keyboard and accessibility | Focus visible; buttons labeled; dialog focus and close work | Keyboard test notes |
| Reduced motion and low-power conditions | Effects do not make controls unusable | Test notes |
| Long play session (10 minutes) | No persistent freeze, severe overheating or runaway memory | FPS/memory/temperature notes |
| Two phones simultaneously | No shared synchronization is claimed; each stays local | Network capture |

## Performance measurements
- Record median and 5th-percentile FPS over a 60-second active walking sequence, not only initial scene.
- Record initial scene ready time and WebGL draw calls/triangles on actual hardware where available.
- Capture failures and device/browser metadata. No FPS threshold is asserted without a real-device baseline.
- Evaluate whether object instancing, shadows, pixel ratio caps or geometry simplification are needed before enabling more rooms.

## Security / compatibility gates
- Browser network log must show **zero** Firebase endpoints during prototype use.
- Do not use production credentials or user data in tests.
- Check localStorage corruption/oversize behavior and ability to reset without affecting legacy app.
- Before any future shared placement: M0 authorized staging export/restore, deployed Rules review, member authorization, revision-aware transactions, offline/reconnect and two-client tests.
- Do not conflate the autonomous partner avatar with online presence.

## Next implementation slice after review
1. Build a multi-room doorway/navigation **prototype without Firebase**, with explicit walkable floor polygons, wall collision and door transitions.
2. Add a 2-room test fixture and automated pathfinding/door tests, including blocked door, return path and safe spawn.
3. Preserve the existing one-room layout through an adapter; do not silently migrate it.
4. Only after real-device performance and UX approval consider connecting the PR #79 interactions to the 3D engine.

## Sign-off
- [ ] iOS real-device test
- [ ] Android real-device test
- [ ] Mobile screenshots reviewed by both users
- [ ] No Firebase calls verified
- [ ] Full current-head CI passed
- [ ] M0 production integration gates satisfied (required only before shared-data release)

**Status: all checkboxes pending until independently verified.**
