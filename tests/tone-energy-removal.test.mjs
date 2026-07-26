import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const [page, types, engine, route] = await Promise.all([
  readFile(new URL("app/page.tsx", root), "utf8"),
  readFile(new URL("app/production-types.ts", root), "utf8"),
  readFile(new URL("app/production-engine.ts", root), "utf8"),
  readFile(new URL("app/api/generate/route.ts", root), "utf8"),
]);

test("Tone & Energy UI and every legacy chip are removed", () => {
  assert.doesNotMatch(page, /Tone &amp; Energy|Tone & Energy|Video Tones/);
  assert.doesNotMatch(page, /scene-tone-panel|scene-tone-chip|production-tone-chip|toggleTone/);
  for (const chip of ["Calm", "Cute", "Playful", "Funny", "Energetic", "Fast", "Chaotic slapstick", "Suspenseful", "Emotional", "Magical", "Educational"]) {
    assert.doesNotMatch(page, new RegExp(`"${chip.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`));
  }
});

test("legacy tone state and generation payload fields are removed", () => {
  assert.doesNotMatch(types, /^\s*tones:|^\s*customTone:/m);
  assert.doesNotMatch(`${page}\n${engine}`, /form\.tones|customTone|selectedTone|toneProductionDirection|Tone-from-zero/);
  assert.doesNotMatch(route, /selected tones|Chaotic slapstick|FAST-AT-0:00/i);
});

test("Creative Direction remains the sole creative guidance block", () => {
  for (const label of ["Creative Direction", "Visual Mood & Atmosphere", "Camera & Motion Style", "Pacing & Performance", "Creative Rules &amp; Restrictions"]) {
    assert.match(page, new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.match(route, /top-level creativeDirection object/);
  assert.match(engine, /resolveCreativeDirection\(form\.creativeDirection\)/);
});
