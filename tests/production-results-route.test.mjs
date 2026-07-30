import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const results = fs.readFileSync("app/production/[productionId]/results/results-workspace.tsx", "utf8");
const records = fs.readFileSync("app/production-records.ts", "utf8");
const page = fs.readFileSync("app/page.tsx", "utf8");

test("primary results use three grouped categories and omit Video Title navigation", () => {
  assert.match(results, /"character", "frames", "complete-production-prompt"/);
  assert.match(results, /character: "Character"/);
  assert.match(results, /frames: "Start & End Frames"/);
  assert.match(results, /"complete-production-prompt": "Complete Production Prompt"/);
  assert.doesNotMatch(results, /videoTitle: "Video Title"/);
  assert.match(results, /<h1>\{production\.title\}<\/h1>/);
  assert.match(results, /label="Title" value=\{production\.title\}/);
});

test("Character category starts collapsed and supports individual and all-character copy", () => {
  assert.match(results, /production\.characterProfiles\.map/);
  assert.match(results, /expandedCharacterIds\.includes\(character\.id\)/);
  assert.match(results, /aria-expanded=\{expandedCharacterIds\.includes\(character\.id\)\}/);
  assert.match(results, /Expand Details/);
  assert.match(results, /Copy All Character Details/);
  assert.match(results, /buildAllCharacterDetails\(production\.characterProfiles\)/);
});

test("Frames category groups both prompts and copies them in start-to-end order", () => {
  assert.match(results, /buildBothFrames/);
  const builder = results.slice(results.indexOf("export function buildBothFrames"), results.indexOf("function characterDetails"));
  assert.ok(builder.indexOf("START FRAME") < builder.indexOf("END FRAME"));
  assert.match(results, /Copy Both Frames/);
  assert.match(results, /title="Start Frame"/);
  assert.match(results, /title="End Frame"/);
});

test("complete prompt defaults active and combines five sections in exact order", () => {
  assert.match(results, /useState<ResultTabId>\("complete-production-prompt"\)/);
  const builder = results.slice(results.indexOf("export function buildCompleteProductionPrompt"), results.indexOf("export function buildBothFrames"));
  const labels = ["VIDEO LOCK", "VIDEO PROMPT", "MUSIC DIRECTION", "SOUND EFFECTS DIRECTION", "VIDEO RULES"];
  labels.reduce((position, label) => {
    const next = builder.indexOf(label);
    assert.ok(next > position, `${label} must follow the previous section`);
    return next;
  }, -1);
  assert.match(results, /Copy Complete Production Prompt/);
  assert.match(results, /filter\(\(entry\).*Boolean\(entry\[1\]\?\.trim\(\)\)/s);
});

test("individual copy actions, no-music omission, and optional tabs are safe", () => {
  for (const label of ["Copy Video Lock", "Copy Video Prompt", "Copy Music", "Copy Sound Effects", "Copy Video Rules"]) {
    assert.match(results, new RegExp(label));
  }
  assert.match(results, /if \(!content\?\.trim\(\)\) return null/);
  assert.match(results, /if \(pack\.videoTimeline\) tabs\.push\("timeline"\)/);
  assert.match(results, /tabs\.push\("prompt-quality"\)/);
});

test("older saved fields map into grouped categories without changing stored production data", () => {
  assert.match(results, /pack\.characterBuildingPrompt/);
  assert.match(results, /pack\.startFramePrompt \|\| pack\.endFramePrompt/);
  assert.match(results, /buildCompleteProductionPrompt\(pack\)/);
  assert.match(records, /slapstick-saved-packs/);
  assert.match(page, /generatedOutputs: nextGeneratedOutputs/);
});

test("Word export uses grouped order and keeps the title as metadata", () => {
  const exportBlock = results.slice(results.indexOf("async function downloadWord"), results.indexOf("if (production === undefined)"));
  const labels = ["Production Summary", "Production Title:", "Character Details", "Start Frame", "End Frame", "Complete Production Prompt", "Timeline", "Prompt Quality Control"];
  labels.reduce((position, label) => {
    const next = exportBlock.indexOf(label);
    assert.ok(next > position, `${label} must follow the previous export section`);
    return next;
  }, -1);
  assert.doesNotMatch(exportBlock, /HEADING_2, text: "Video Title"/);
  assert.match(exportBlock, /Packer\.toBlob/);
});
