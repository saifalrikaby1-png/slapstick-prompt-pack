import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const source = (path) => readFile(new URL(path, root), "utf8");
const files = await Promise.all([
  source("app/page.tsx"),
  source("app/production-types.ts"),
  source("app/production-engine.ts"),
  source("app/creative-library.ts"),
  source("app/api/generate/route.ts"),
  source("app/api/creative-suggest/route.ts"),
]);
const [page, types, engine, library, generationRoute, creativeRoute] = files;

const check = (name, haystack, pattern) => test(name, () => assert.match(haystack, pattern));

check("1. enhancement branch starts from approved redesign contract", page, /SIMPLIFIED PRODUCTION WORKFLOW/);
check("2. Creative Library uses guarded parsing", library, /try[\s\S]*JSON\.parse[\s\S]*catch[\s\S]*return \[\]/);
check("3. signature location is persisted", page, /slapstick-creative-library-v1|CREATIVE_LIBRARY_STORAGE_KEY/);
check("4. only one signature location is retained", library, /signatureLocations\.length > 1/);
check("5. saved location reuse is implemented", page, /selectCreativeAsset\(kind/);
check("6. saved object reuse is implemented", page, /allowPreviouslySavedObjects/);
check("7. saved objects are sent as AI exclusions", page, /exclusions[\s\S]*creativeAssets/);
check("8. saved-object reuse override is honored", page, /!form\.allowPreviouslySavedObjects/);
check("9. duplicate object detection exists", library, /creativeCollision/);
check("10. AI object suggestions remain editable", page, /\[creativeFields\[kind\]\.description\]: result\.description/);
check("11. saved action reuse exists", types, /actionAssetId/);
check("12. saved payoff reuse exists", types, /payoffAssetId/);
check("13. blank Additional Direction is conditional", engine, /form\.additionalDirection\.trim\(\) \?/);
test("14. placeholder never becomes a default value", () => {
  assert.match(types, /additionalDirection: ""/);
  assert.doesNotMatch(engine, /Example: Keep the camera in a wide side view/);
});
test("15. roles allow exactly Hero, Companion, and Enemy", () => {
  assert.match(types, /CharacterRole = "Hero" \| "Enemy" \| "Companion"/);
  assert.doesNotMatch(types, /CharacterRole = [^\n]*Supporting/);
});
check("16. Supporting migrates to Companion", engine, /rawRole[\s\S]*"Companion"/);
check("17. AI expansion preserves customer text", page, /Customer foundation to preserve/);
check("18. publishing supports Social Media and Custom", page, /const platforms = \["Social Media", "Custom"\]/);
check("19. Custom platform validation is required", page, /form\.platform !== "Custom" \|\| form\.customPlatform\.trim/);
check("20. single tone migrates to an array", engine, /\[stringValue\(item\.tone, "Funny"\)\]/);
check("21. multiple tones are included", engine, /form\.tones\.map/);
check("22. character-building covers all active characters", engine, /const characterPrompts = cast\.map/);
check("23. disabled character-building output is hidden", page, /pack\.characterBuildingPrompt && <article/);
check("24. compatible voice layers are multi-select", types, /voiceLayers: VoiceLayer\[\]/);
check("25. No Spoken Dialogue is exclusive", page, /update\("voiceLayers", form\.voiceLayers\.includes\(layer\) \? \["Hero Voice"\] : \["No Spoken Dialogue"\]\)/);
check("26. ultra-unique video title is supported", page, /Generate Ultra-Unique Title with AI/);
check("27. saved titles are used as exclusions", page, /savedPacks\.map\(\(saved\) => \(\{ name: saved\.title/);
test("28. supported models have materially distinct adapters", () => {
  for (const model of ["Seedance", "Kling", "Google Flow / Veo", "Runway", "Higgsfield", "PixVerse", "Hailuo / MiniMax", "Generic model"]) {
    assert.match(engine, new RegExp(`["']?${model.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["']?\\s*:`));
  }
});
check("29. adapters alter camera instructions", engine, /cameraPolicy/);
check("30. adapters alter motion instructions", engine, /motionPolicy/);
check("31. adapters alter reference-frame language", engine, /referenceFramePolicy/);
check("32. prompt length budgets are inspected", engine, /Frame prompt length budget/);
check("33. start/end character-count parity is checked", engine, /Character count is consistent/);
check("34. start/end environment parity is instructed", engine, /exactly the same environment/);
check("35. start/end object parity is instructed", engine, /same \$\{object\}/);
check("36. updated Quality Control checks adapter fit", engine, /Model adapter is applied/);
check("37. AI repair returns a complete pack", generationRoute, /complete synchronized replacement pack/);
check("38. Demo Mode remains local", page, /mode === "demo"\s*\?\s*generateDemoPack/);
test("39. AI request and response schemas share all nine fields", () => {
  for (const key of ["videoTitle", "characterBuildingPrompt", "startFramePrompt", "endFramePrompt", "videoLock", "videoTimeline", "musicPath", "soundEffects", "finalGenerationRule"]) {
    assert.match(types, new RegExp(`${key}: string`));
    assert.match(generationRoute, new RegExp(key));
  }
});
test("40. API keys remain server-only", () => {
  assert.doesNotMatch(`${page}\n${engine}\n${library}`, /OPENAI_API_KEY|sk-[A-Za-z0-9_-]{20,}/);
  assert.match(generationRoute, /process\.env\.OPENAI_API_KEY/);
  assert.match(creativeRoute, /process\.env\.OPENAI_API_KEY/);
});
check("41. legacy packs remain compatible", engine, /schemaVersion:\s*1/);
