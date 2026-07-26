import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const page = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
const helpers = readFileSync(new URL("../app/creative-direction.ts", import.meta.url), "utf8");
const engine = readFileSync(new URL("../app/production-engine.ts", import.meta.url), "utf8");
const route = readFileSync(new URL("../app/api/generate/route.ts", import.meta.url), "utf8");
const types = readFileSync(new URL("../app/production-types.ts", import.meta.url), "utf8");

test("Creative Direction replaces the rendered Scene Setup inputs", () => {
  assert.doesNotMatch(page, /<h1>Scene Setup<\/h1>|<h2>Scene Elements<\/h2>/);
  for (const removed of [
    'placeholder="Choose or describe a location"',
    'placeholder="Choose or describe an object"',
    'placeholder="Describe the action or trap"',
    'placeholder="Describe the clear final payoff"',
  ]) assert.doesNotMatch(page, new RegExp(removed));
  for (const visible of ["Creative Direction", "Visual Mood & Atmosphere", "Camera & Motion Style", "Pacing & Performance", "Creative Rules &amp; Restrictions"]) {
    assert.match(page, new RegExp(visible.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("all three reusable preset controls end with Custom and reveal only their own field", () => {
  for (const arrayName of ["VISUAL_MOOD_OPTIONS", "CAMERA_STYLE_OPTIONS", "PACING_STYLE_OPTIONS"]) {
    assert.match(helpers, new RegExp(`${arrayName}[\\s\\S]*\\{ value: "custom", label: "Custom", description: "" \\},\\n\\] as const`));
  }
  assert.match(page, /function CreativeDirectionSelectCard[\s\S]*const isCustom = value === "custom"/);
  assert.match(page, /\{isCustom \? <div className="creative-direction-custom-field">/);
  assert.match(page, /!isCustom && selectedOption\?\.description/);
  assert.match(page, /maxLength=\{200\}/);
});

test("rules keep manual text separate from exact aria-pressed chips", () => {
  assert.match(types, /creativeRulesManual: string;[\s\S]*selectedRuleChipIds: RuleChipId\[\]/);
  assert.match(page, /aria-pressed=\{isActive\}/);
  assert.match(page, /toggleCreativeRuleChip\(chip\.id\)/);
  assert.match(helpers, /return \[manualRules\.trim\(\), \.\.\.chipRules\]\.filter\(Boolean\)\.join\(" "\)\.trim\(\)/);
  for (const sentence of ["No dialogue.", "No sudden cuts.", "Keep all selected characters visible.", "Maintain character identity and appearance consistency.", "Keep all content family-friendly.", "End with a seamless loop."]) {
    assert.match(helpers, new RegExp(sentence.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("custom validation is field-local and generation payload is resolved", () => {
  for (const message of ["Describe your custom visual mood.", "Describe your custom camera style.", "Describe your custom pacing style."]) assert.match(page, new RegExp(message));
  assert.match(page, /creativeDirection: resolveCreativeDirection\(form\.creativeDirection\)/);
  assert.match(route, /Legacy Scene Setup inputs are not accepted/);
  assert.match(route, /creativeDirection\?: \{[\s\S]*visualMood: string;[\s\S]*cameraStyle: string;[\s\S]*pacingStyle: string;[\s\S]*creativeRules: string/);
});

test("prompt generation derives scene facts and applies the one global ratio", () => {
  assert.match(engine, /export function deriveScenePlan/);
  assert.match(engine, /Determine the location, supporting objects, action progression, and ending\/payoff/);
  assert.match(engine, /const startRatio = videoRatio;\s*const endRatio = videoRatio;/);
  assert.doesNotMatch(page, />Start Frame Ratio<|>End Frame Ratio<|>Image Ratio</);
  assert.doesNotMatch(types, /^\s*startFrameRatio:|^\s*endFrameRatio:|^\s*startCustomWidth:|^\s*endCustomWidth:/m);
});

test("migration, persistence, and export include Creative Direction", () => {
  assert.match(engine, /creativeDirection: migrateCreativeDirection\(item\.creativeDirection\)/);
  assert.match(page, /form: \{ \.\.\.form \}/);
  assert.match(page, /heading\("CREATIVE DIRECTION"\)/);
  for (const label of ["Visual Mood & Atmosphere", "Camera & Motion Style", "Pacing & Performance", "Creative Rules & Restrictions"]) assert.match(page, new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
});
