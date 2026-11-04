import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";

// Guard against the Firestore Rules v2 zero-segment recursive wildcard
// accidentally overriding membership constraints on couples/{cid}.
// The Firestore Emulator suite verifies the actual authorization behavior.
test("couple membership rule is not bypassed by a zero-segment nested wildcard", () => {
  const rules = readFileSync("firestore.rules", "utf8");
  expect(rules).toContain("match /couples/{cid}");
  expect(rules).toContain("match /{collection}/{document=**}");
  expect(rules).not.toMatch(/match\s+\/\{document=\*\*\}\s*\{/);
});
