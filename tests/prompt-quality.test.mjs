import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync("app/prompt-quality.ts", "utf8");
const results = fs.readFileSync("app/production/[productionId]/results/results-workspace.tsx", "utf8");
const page = fs.readFileSync("app/page.tsx", "utf8");
const records = fs.readFileSync("app/production-records.ts", "utf8");

test("quality weights total 100 and maximum score is 98", () => {
  const weights = [...source.matchAll(/"[^"]+": (\d+),?/g)].slice(0, 10).map((match) => Number(match[1]));
  assert.equal(weights.reduce((sum, value) => sum + value, 0), 100);
  assert.match(source, /Math\.min\(98,/);
});

test("quality levels map to the required labels", () => {
  for (const [threshold, label] of [[98, "Maximum Prompt Quality"], [95, "Expert Grade"], [90, "Production Ready"], [80, "Needs Refinement"]]) {
    assert.match(source, new RegExp(`score >= ${threshold}`));
    assert.match(source, new RegExp(label));
  }
  assert.match(source, /Major Prompt Issues/);
});

test("critical score caps are exact", () => {
  for (const [name, cap] of [["missingVideoLock", 84], ["missingVideoRules", 87], ["characterIdentityConflict", 79], ["missingSelectedCharacter", 75], ["emptyRequiredSection", 70]]) {
    assert.match(source, new RegExp(`${name}: ${cap}`));
  }
  assert.match(source, /caps\.reduce\(\(current, cap\) => Math\.min\(current, cap\.maximumScore\)/);
});

test("deterministic analyzer checks order, repetition, density, names, ratio, and duration", () => {
  for (const helper of ["normalizePromptText", "estimateWordCount", "detectRepeatedInstructions", "calculateActionDensity"]) assert.match(source, new RegExp(`function ${helper}`));
  assert.match(source, /allNames/);
  assert.match(source, /ratioPresent/);
  assert.match(source, /durationPresent/);
  assert.doesNotMatch(source, /Math\.random/);
});

test("automatic repair runs below 90 for no more than two passes and retains only improvements", () => {
  assert.match(source, /pass < Math\.min\(2, maxPasses\) && bestAnalysis\.score < 90/);
  assert.match(source, /if \(next\.score <= bestAnalysis\.score \|\| next\.criticalIssueCount > bestAnalysis\.criticalIssueCount\) break/);
  assert.match(page, /optimizePromptPackage\(rawNextPack/);
  assert.match(page, /promptQualityReason:.*"automatic-repair"/s);
});

test("manual maximize stops at 98 or three passes and preserves form choices", () => {
  assert.match(source, /pass < 3 && bestAnalysis\.score < 98/);
  assert.match(source, /const repaired = \{ \.\.\.pack \}/);
  for (const value of ["form.videoRatio", "form.duration", "form.videoModel"]) assert.match(source, new RegExp(value.replace(".", "\\.")));
  assert.doesNotMatch(source, /form\.(videoRatio|duration|videoModel)\s*=(?!=)/);
});

test("Prompt Quality panel, summary, persistence, and Word export use prompt-only language", () => {
  assert.match(results, /Prompt Quality Score/);
  assert.match(results, /aria-label="Prompt Quality Score"/);
  assert.match(results, /Maximize Prompt Quality/);
  assert.match(results, /results-quality-summary-link/);
  assert.match(results, /Prompt Quality Control/);
  assert.match(results, /Prompt Quality Score: \$\{production\.promptQuality\.score\}%/);
  assert.match(records, /promptQualityHistory/);
  assert.doesNotMatch(results, /(Video Quality|Render Quality|Guaranteed Video Quality|Video Success Percentage)/);
});

test("older saved packs are analyzed without automatic rewrite", () => {
  assert.match(results, /record && !record\.promptQuality && record\.status === "completed"/);
  assert.match(results, /analyzePromptPackage\(record\.pack/);
  assert.doesNotMatch(results.slice(results.indexOf("record && !record.promptQuality"), results.indexOf("setProduction(record)")), /repairPromptPackage|maximizePromptQuality/);
});
