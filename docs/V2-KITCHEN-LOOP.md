# V2 S3 — Bếp hỗn loạn: real-object interaction loop

**Status:** opt-in experimental prototype, 2026-11-07. Based on the current PR #79 V2 branch, not `main`.

## What is actually playable

Under `?world2=1#bep`, selecting the **stove** or the old "Bật bếp nấu" shortcut opens a kitchen close-up in the same room, rather than writing `cookAt` or redirecting to a legacy tab. Two people may play **pass-and-play on one device**:

1. A reads a concealed recipe with three ingredients and heat levels. B cannot see it after the handoff.
2. B uses the physical stove controls and ingredient cards while listening to A. The engine checks order and heat, applies gentle mistakes, and makes a meal or an amusing failure after three errors.
3. Roles swap in round two. The ending reports both scores; replay deals new recipes and combinations.
4. The cooked dish appears **on the kitchen dining table** in the visible scene. Tapping the plate reopens the item close-up; no tab navigation.

Includes twelve dish templates, four real ordering/heating modifiers, seven ingredient options per round including decoys, two distinct roles/rounds, no timer pressure, replay, a reduced-motion setting, and accessible 44px+ touch targets for major controls.

**Important:** The 2.5D food plate is a temporary visual overlay anchored to the existing dining table sprite at approximately x=512,y=625 on the existing 1170-unit kitchen scene. Check actual fit on all mobile widths, daytime variants, and the source render before approving final placement.

## Privacy and data safety

- Pure engine: `src/living-world-kitchen-engine.mjs`, tested in staging Node suite. UI: `src/living-world-kitchen.mjs` and scoped CSS.
- The prototype uses **zero** Firebase writes/reads, does not touch existing `cookAt`, fridge documents, garden or dating history and does not change any Firestore Rules or collections.
- Game session and dish overlay remain in JavaScript memory only, disappear on refresh, and are **not synchronized to another device**. The UI explicitly says this. Do not misrepresent it as two-device multiplayer.
- The original app remains unchanged unless `?world2=1` is specified. Original kitchen shortcut remains functional when V2 is off.

## Tests and acceptance

- Staging: deterministic seed/replay, two distinct recipes, modifier semantics, two successful rounds, three wrong inputs, invalid actions, no state mutations.
- Playwright: start via real stove, handoff hides recipe, correct heat/ingredient actions, cooked plate on actual room scene, tap plate, second swapped-role round, replay, mistakes, 360/390/430px, legacy fridge interaction, opt-out.
- CI must pass at latest HEAD. A successful browser test is not a substitute for independent visual inspection of the table position and both avatars.
- **Release gates:** staging Cloud M0 export/restore, Rules/Auth/IAM audit and 2-client actual multiplayer protocol before enabling shared persistence. No `main` merge or production deploy here.

## Next iteration

Add a **secure session document** under a staging-only rules-approved path for two connected devices, server-sourced move order, reconnect/resume and rate limiting. Keep recipe secrecy server-enforced (not just hidden CSS). Then add in-world kitchen ingredient animations, food sticker atlas and permanent dinner memory linked to a shared source record after M0.
