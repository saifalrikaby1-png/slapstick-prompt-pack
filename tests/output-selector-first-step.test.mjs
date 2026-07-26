import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const page = fs.readFileSync("app/page.tsx", "utf8");
const css = fs.readFileSync("app/globals.css", "utf8");

test("configuration studio is the single first workflow step", () => {
  assert.ok(page.indexOf(">Configuration<") < page.indexOf(">Complete Video Idea<"));
  assert.match(page, /studio-config-card[\s\S]{0,180}<span>01<\/span>[\s\S]{0,120}Configuration/);
  assert.match(page, /<span>02<\/span>[\s\S]{0,120}Complete Video Idea/);
  assert.match(page, /<span>03<\/span>[\s\S]{0,100}Characters/);
  assert.match(page, /scene-editor[\s\S]{0,300}Scene Setup/);
  assert.doesNotMatch(page, /Voice, Music, and Saved Settings/);
  assert.match(page, /Narration, Voices, Music &amp; Sound[\s\S]{0,160}Configure spoken audio, cartoon vocals, music, and SFX/);
  assert.match(page, /Project Presets and Saved Packs/);
  assert.match(page, /workflow-tab-setup/);
  assert.match(page, /Generation Summary[\s\S]{0,600}Generate \$\{requestedOutputs\.length\} Selected Outputs/);
  assert.equal((page.match(/id="choose-outputs"/g) || []).length, 1);
  for (const panel of ["Generated Prompt", "Action Timeline", "Start Frame &amp; End Frame", "Camera &amp; Motion", "Visual &amp; Scene Settings"]) {
    assert.match(page, new RegExp(panel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("custom and full-pack modes remain mutually exclusive presets", () => {
  assert.match(page, /type OutputSelectionMode = "custom" \| "fullPack"/);
  assert.match(page, /useState<OutputSelectionMode>\("custom"\)/);
  assert.match(page, /useState<RequestedOutput\[]>\(\["videoPrompt"\]\)/);
  assert.match(page, /selectionMode === "custom" && <div className="studio-quick-actions">/);
  assert.match(page, /selectionMode === "fullPack"/);
  assert.match(page, /setRequestedOutputs\(\[\.\.\.requestedOutputValues\]\)/);
  assert.match(page, /independentSelectionsRef\.current = requestedOutputs/);
  assert.match(page, /Full Production Pack/);
  assert.doesNotMatch(page, /fullPackSelected|toggleFullPack/);
});

test("compact toolbar, summary, persistence, and accessible controls exist", () => {
  for (const value of ["Select all", "Clear", "Recommended", "Edit production setup", "aria-pressed", "slapstick-output-selection", "studio-toolbar-actions"]) {
    assert.match(page, new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.match(page, /studio-toolbar-actions[\s\S]{0,900}onClick=\{saveCurrentPack\}[\s\S]{0,900}onClick=\{downloadWord\}[\s\S]{0,900}onClick=\{generate\}/);
  assert.doesNotMatch(page, /studio-generation-dock/);
  assert.match(page, /id="episode-idea"/);
  assert.match(page, /Frames are generated automatically based on the selected video ratio/);
});

test("responsive professional studio uses three columns and one column on mobile", () => {
  assert.match(css, /\.production-studio-workflow \.production-studio-dashboard\{display:grid;grid-template-columns:minmax\(260px,300px\) minmax\(320px,1fr\) minmax\(300px,340px\)/);
  assert.match(css, /@media\(max-width:760px\)[\s\S]*\.production-studio-workflow \.production-studio-dashboard\{grid-template-columns:1fr/);
  assert.doesNotMatch(css, /studio-generation-dock|studio-dock-summary/);
  assert.match(page, /studio-output-checklist/);
});

test("credit estimate is display-only and full-pack selection stays singular", () => {
  assert.doesNotMatch(`${page}\n${css}`, /discount/i);
  assert.equal((page.match(/<RatioControl[\s\S]{0,80}label="Video ratio"/g) || []).length, 1);
  assert.match(page, /Estimated credits/);
  assert.match(page, /Demo mode · no credits used/);
  assert.doesNotMatch(page, /className=\{`selection-card full-pack/);
});
