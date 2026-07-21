import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const source = (path) => readFile(new URL(path, root), "utf8");

test("renders the approved five-output workflow in Demo and AI modes", async () => {
  const page = await source("app/page.tsx");
  for (const text of [
    "Demo Mode",
    "AI Mode",
    "Load Biscuit Demo",
    "Complete Video Idea",
    "Include in This Video",
    "Selected for This Video",
    "Production Setup",
    "Generation Summary",
    "Character-Building Prompt",
    "Start-Frame Image Prompt",
    "End-Frame Image Prompt",
    "All-in-One Video Production Prompt",
    "Quality-Control Report",
    "Copy Complete Production Prompt",
    "Copy Visual Portion Only",
    "Copy Audio Portion Only",
    "Fix Prompts",
  ]) {
    assert.match(page, new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("Fix Prompts is in the Quality Control header before detailed findings", async () => {
  const page = await source("app/page.tsx");
  const qualityCard = page.slice(page.indexOf('className="output-card quality-card"'));
  assert.ok(qualityCard.indexOf("Fix Prompts") < qualityCard.indexOf('className="findings"'));
  assert.match(qualityCard, /isFixingPrompts/);
  assert.match(qualityCard, /Quality Target Reached/);
  assert.match(qualityCard, /remainingFixFindings/);
  assert.match(qualityCard, /qualityTargetReached/);
  assert.match(qualityCard, /Prompt quality improved successfully/);
  assert.match(qualityCard, /Fix Remaining Issues/);
  assert.doesNotMatch(qualityCard, /Quality Target Reached"/);
});

test("uses exactly the new synchronized internal production schema", async () => {
  const [types, page, route] = await Promise.all([
    source("app/production-types.ts"),
    source("app/page.tsx"),
    source("app/api/generate/route.ts"),
  ]);
  const keys = [
    "videoTitle",
    "characterBuildingPrompt",
    "startFramePrompt",
    "endFramePrompt",
    "videoLock",
    "videoTimeline",
    "musicPath",
    "soundEffects",
    "finalGenerationRule",
  ];
  for (const key of keys) {
    assert.match(types, new RegExp(`${key}: string`));
    assert.match(route, new RegExp(key));
  }
  assert.match(page, /completeVideoPrompt\(pack\)/);
  assert.doesNotMatch(page, /selectedModelPrompt|alternativeModelPrompt|facebookCaption/);
});

test("keeps OpenAI credentials exclusively on server-side routes", async () => {
  const [page, engine, generateRoute, characterRoute, creativeRoute] = await Promise.all([
    source("app/page.tsx"),
    source("app/production-engine.ts"),
    source("app/api/generate/route.ts"),
    source("app/api/character-suggest/route.ts"),
    source("app/api/creative-suggest/route.ts"),
  ]);
  assert.doesNotMatch(`${page}\n${engine}`, /process\.env\.OPENAI_API_KEY|sk-[A-Za-z0-9_-]{20,}/);
  assert.doesNotMatch(`${generateRoute}\n${characterRoute}\n${creativeRoute}`, /NEXT_PUBLIC_.*OPENAI|sk-[A-Za-z0-9_-]{20,}/);
  for (const route of [generateRoute, characterRoute, creativeRoute]) {
    assert.match(route, /process\.env\.OPENAI_API_KEY/);
    assert.match(route, /https:\/\/api\.openai\.com\/v1\/responses/);
    assert.match(route, /model:\s*"gpt-5\.6-sol"/);
    assert.match(route, /type:\s*"json_schema"/);
  }
});

test("preserves character safety, storage, migration, and exports", async () => {
  const [page, engine] = await Promise.all([
    source("app/page.tsx"),
    source("app/production-engine.ts"),
  ]);
  for (const storageKey of [
    "slapstick-character-library",
    "slapstick-project-presets",
    "slapstick-saved-packs",
    "slapstick-current-setup",
  ]) assert.match(page, new RegExp(storageKey));

  assert.match(page, /mergeCharacterLibraries/);
  assert.match(page, /Built-in characters are protected and cannot be deleted/);
  assert.match(page, /Import and Merge Library/);
  assert.match(engine, /schemaVersion:\s*1/);
  assert.match(engine, /schemaVersion:\s*2/);
  assert.match(page, /Legacy.*read only/);
  assert.match(page, /import\("docx"\)/);
  assert.match(page, /import\("file-saver"\)/);
});

test("Demo Mode is local and quality control validates the synchronized pack", async () => {
  const [page, engine] = await Promise.all([
    source("app/page.tsx"),
    source("app/production-engine.ts"),
  ]);
  assert.match(page, /mode === "demo"\s*\?\s*generateDemoPack/);
  assert.match(engine, /export function generateDemoPack/);
  assert.match(engine, /export function inspectProductionPack/);
  for (const rule of [
    "Duplicate-character prohibition",
    "Start-frame ratio",
    "End-frame ratio",
    "Video ratio",
    "Full duration covered",
    "No timing gaps",
    "Audio matches visible action",
    "Character identities match",
  ]) assert.match(engine, new RegExp(rule));
});
