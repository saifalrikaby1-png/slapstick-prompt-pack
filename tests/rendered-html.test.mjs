import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

async function source(path) {
  return readFile(new URL(path, root), "utf8");
}

test("includes the complete creator workflow in Demo and AI modes", async () => {
  const page = await source("app/page.tsx");

  for (const requiredText of [
    "Demo Mode",
    "AI Mode",
    "Biscuit Demo",
    "Character Library / Brand Bible",
    "Prompt Quality Control",
    "Video Timeline by Seconds",
    "Music Path by Seconds",
    "Sound Effects Timeline by Seconds",
    "Download Word Pack",
    "Copy Full Pack",
    "Saved Production Packs",
    "AI-assisted character builder",
    "Generate Full Character Bible",
    "Quality summary",
    "Production safety notes",
  ]) {
    assert.match(page, new RegExp(requiredText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }

  assert.match(page, /style:\s*"colorful 3D cartoon slapstick animation"/);
  assert.match(page, /options:\s*\[\s*"colorful 3D cartoon slapstick animation"/);
  assert.match(page, /const builtInCharacters: CharacterProfile\[\]/);
  assert.match(page, /profilesNotAlreadyIncluded/);
});

test("keeps OpenAI credentials on secure server-side routes", async () => {
  const [page, generateRoute, characterRoute] = await Promise.all([
    source("app/page.tsx"),
    source("app/api/generate/route.ts"),
    source("app/api/character-suggest/route.ts"),
  ]);

  assert.doesNotMatch(page, /process\.env\.OPENAI_API_KEY|sk-[A-Za-z0-9_-]{20,}/);
  assert.doesNotMatch(`${page}\n${generateRoute}\n${characterRoute}`, /NEXT_PUBLIC_.*OPENAI/);

  for (const route of [generateRoute, characterRoute]) {
    assert.match(route, /process\.env\.OPENAI_API_KEY/);
    assert.match(route, /https:\/\/api\.openai\.com\/v1\/responses/);
    assert.match(route, /model:\s*"gpt-5\.6-sol"/);
    assert.match(route, /type:\s*"json_schema"/);
    assert.doesNotMatch(route, /sk-[A-Za-z0-9_-]{20,}/);
  }
});

test("preserves local persistence and export integrations", async () => {
  const page = await source("app/page.tsx");

  for (const storageKey of [
    "slapstick-character-library",
    "slapstick-project-presets",
    "slapstick-saved-packs",
    "slapstick-current-setup",
  ]) {
    assert.match(page, new RegExp(storageKey));
  }

  assert.match(page, /import\("docx"\)/);
  assert.match(page, /import\("file-saver"\)/);
  assert.match(page, /characterBibleText\(form, characters\)/);
  assert.match(page, /launchersForModel\(form\.videoModel\)/);
});
