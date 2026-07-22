import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const page = fs.readFileSync("app/page.tsx", "utf8");
const css = fs.readFileSync("app/globals.css", "utf8");

test("output selector is the single first workflow step", () => {
  assert.ok(page.indexOf("Choose What to Generate") < page.indexOf(">Complete Video Idea<"));
  assert.match(page, /<span>01<\/span>[\s\S]{0,160}Choose What to Generate/);
  assert.match(page, /<span>02<\/span>[\s\S]{0,120}Complete Video Idea/);
  assert.match(page, /<span>03<\/span>[\s\S]{0,100}Characters/);
  assert.match(page, /<span>04<\/span>[\s\S]{0,100}Production Setup/);
  assert.doesNotMatch(page, /Voice, Music, and Saved Settings/);
  assert.match(page, /Advanced Settings.*narration, voices, music, and sound/);
  assert.match(page, /Project Presets and Saved Packs/);
  assert.match(page, /workflow-tab-setup/);
  assert.match(page, /Generation Summary[\s\S]{0,600}Generate \$\{requestedOutputs\.length\} Selected Outputs/);
  assert.equal((page.match(/id="choose-outputs"/g) || []).length, 1);
});

test("custom and full-pack modes remain mutually exclusive presets", () => {
  assert.match(page, /type OutputSelectionMode = "custom" \| "fullPack"/);
  assert.match(page, /useState<OutputSelectionMode>\("custom"\)/);
  assert.match(page, /useState<RequestedOutput\[]>\(\["videoPrompt"\]\)/);
  assert.match(page, /selectionMode === "custom" \? <>/);
  assert.match(page, /selectionMode === "fullPack"/);
  assert.match(page, /setRequestedOutputs\(\[\.\.\.requestedOutputValues\]\)/);
  assert.match(page, /independentSelectionsRef\.current = requestedOutputs/);
  assert.match(page, /Customize Outputs/);
  assert.doesNotMatch(page, /fullPackSelected|toggleFullPack/);
});

test("compact toolbar, summary, persistence, and accessible controls exist", () => {
  for (const value of ["Select All", "Clear Selection", "Recommended Setup", "Continue to Production Setup", "aria-live=\"polite\"", "aria-pressed", "prefers-reduced-motion", "slapstick-output-selection"]) {
    assert.match(page, new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.match(page, /tabIndex=\{0\}/);
  assert.match(page, /event\.key === "Enter"/);
  assert.match(page, /id="episode-idea"/);
});

test("responsive professional grid is compact on desktop and one column on mobile", () => {
  assert.match(css, /repeat\(auto-fit, minmax\(220px, 1fr\)\)/);
  assert.match(css, /min-height: 96px/);
  assert.match(css, /@media \(max-width: 720px\)[\s\S]*\.selection-grid \{ grid-template-columns: 1fr; \}/);
  assert.match(css, /\.selection-card:focus-within/);
  assert.match(css, /\.check-indicator/);
});

test("no credit or duplicate full-pack checkbox language is introduced", () => {
  assert.doesNotMatch(`${page}\n${css}`, /\bcredits?\b|discount/i);
  assert.equal((page.match(/<h2 id="output-selector-title">Choose What to Generate<\/h2>/g) || []).length, 1);
  assert.doesNotMatch(page, /className=\{`selection-card full-pack/);
});
