import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync("app/prompt-quality.ts", "utf8");
const results = fs.readFileSync("app/production/[productionId]/results/results-workspace.tsx", "utf8");
const page = fs.readFileSync("app/page.tsx", "utf8");
const records = fs.readFileSync("app/production-records.ts", "utf8");

test("quality weights total 100 and maximum score is 98", () => {
  const weightsBlock = source.slice(source.indexOf("PROMPT_QUALITY_WEIGHTS"), source.indexOf("PROMPT_QUALITY_CAPS"));
  const weights = [...weightsBlock.matchAll(/"[^"]+": (\d+),?/g)].map((match) => Number(match[1]));
  assert.equal(weights.reduce((sum, value) => sum + value, 0), 100);
  assert.equal(weights.length, 14);
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
  assert.match(source, /appliedCaps\.reduce\(\(score, cap\) => Math\.min\(score, cap\.maximumScore\)/);
});

test("deterministic analyzer checks order, repetition, density, names, ratio, and duration", () => {
  for (const helper of ["normalizePromptText", "estimateWordCount", "detectRepeatedInstructions", "calculateActionDensity"]) assert.match(source, new RegExp(`function ${helper}`));
  assert.match(source, /allNames/);
  assert.match(source, /ratioPresent/);
  assert.match(source, /durationPresent/);
  assert.doesNotMatch(source, /Math\.random/);
});

test("automatic repair runs below 90 for no more than two passes and retains only improvements", () => {
  assert.match(source, /pass < Math\.min\(2, maxPasses\) && \(bestAnalysis\.score < 90 \|\| bestAnalysis\.promptBalance\.score < 5\.5\)/);
  assert.match(source, /if \(!repaired\.changedSections\.length \|\| !isRepairImprovement\(bestAnalysis, next\)\) break/);
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
  assert.match(results, /record && \(!record\.promptQuality \|\| record\.promptQuality\.analysisVersion !== "2\.0\.0"\) && record\.status === "completed"/);
  assert.match(results, /analyzePromptPackage\(record\.pack/);
  assert.doesNotMatch(results.slice(results.indexOf("record && (!record.promptQuality"), results.indexOf("setProduction(record)")), /repairPromptPackage|maximizePromptQuality/);
});

test("Prompt Balance uses semantic repetition classifications and a five-part eight-point score", () => {
  for (const type of ["exact-duplicate", "near-duplicate", "necessary-reinforcement", "structural-label", "entity-reference", "harmful-repetition"]) assert.match(source, new RegExp(type));
  for (const part of ["repetitionControl", "lengthBalance", "sectionResponsibility", "contradictionControl", "formattingHierarchy"]) assert.match(source, new RegExp(part));
  assert.match(source, /score >= 7\.2 \? "pass" : score >= 5\.5 \? "warning" : "fail"/);
  assert.match(source, /Math\.min\(8,/);
});

test("normalization, layered similarity, and section-aware exemptions are present", () => {
  assert.match(source, /normalizeInstructionForComparison/);
  assert.match(source, /replace\(\/\[\^\\p\{L\}\\p\{N\}\\s\]\/gu/);
  assert.match(source, /similarity >= \.88/);
  assert.match(source, /STRUCTURAL_LABELS/);
  assert.match(source, /METADATA_ONLY/);
  assert.match(source, /CONTINUITY_REFERENCE/);
});

test("canonical analysis excludes assembled presentation aliases", () => {
  const canonical = source.slice(source.indexOf("function canonicalPromptSections"), source.indexOf("function splitCanonicalInstructions"));
  for (const field of ["videoLock", "videoTimeline", "musicPath", "soundEffects", "finalGenerationRule"]) assert.match(canonical, new RegExp(field));
  for (const field of ["characterBuildingPrompt", "startFramePrompt", "endFramePrompt"]) assert.doesNotMatch(canonical, new RegExp(field));
  assert.doesNotMatch(canonical, /completeProductionPrompt|buildCompleteProductionPrompt/);
});

test("ordinary repetition is progressive and zero is reserved for extreme large blocks", () => {
  assert.match(source, /const minor = Math\.min\(\.5,/);
  assert.match(source, /const moderate = Math\.min\(1\.2,/);
  assert.match(source, /const major = .* \* \.6/);
  assert.match(source, /const critical = .* \* 1\.2/);
  assert.match(source, /Math\.max\(0, roundToOneDecimal\(3 - minor - moderate - major - critical\)\)/);
  assert.match(source, /item\.normalized\.split\(" "\)\.length >= 45/);
});

test("safe deduplication preserves Video Lock and rejects worse repairs", () => {
  const dedupe = source.slice(source.indexOf("function safelyDeduplicatePrompt"), source.indexOf("export function repairPromptPackage"));
  assert.match(dedupe, /Video Lock is authoritative and is never shortened/);
  assert.doesNotMatch(dedupe, /\["videoLock", "video-lock"\]/);
  assert.match(dedupe, /Preserve every locked character identity and follow the Video Lock/);
  assert.match(source, /isRepairImprovement/);
});

test("Prompt Balance details show only harmful findings and expose the breakdown", () => {
  assert.match(results, /prompt-balance-details/);
  assert.match(results, /analysis\.promptBalance\.breakdown/);
  assert.match(results, /finding\.penalty > 0/);
  assert.match(results, /Redundant instruction groups/);
});

test("category totals are the canonical base score and 95.5 rounds to 96", () => {
  assert.match(source, /calculatePromptQualityBaseScore/);
  assert.match(source, /categories\.reduce\(\(total, category\) => total \+ category\.earnedScore, 0\)/);
  assert.match(source, /roundPromptQualityScore\(score: number\).*Math\.round\(score\)/);
  assert.equal(Math.round(95.5), 96);
});

test("hard caps are rebuilt from active failed checks with visible evidence", () => {
  assert.match(source, /const caps: PromptQualityCap\[\] = \[\]/);
  assert.match(source, /detectedCaps\.filter\(\(cap\) => cap\.isActive\)/);
  assert.match(source, /currentIdentityConflicts.*check\.status === "fail".*check\.severity === "critical".*character-identity-conflict/s);
  assert.match(source, /evidenceCheckIds: evidence\.map/);
  assert.match(results, /Score limits applied/);
  assert.match(results, /Maximum possible score/);
  assert.match(results, /Supporting failed checks/);
});

test("score consistency assertion validates base and uncapped final scores", () => {
  assert.match(source, /assertPromptQualityScoreConsistency/);
  assert.match(source, /Prompt Quality base score does not match category totals/);
  assert.match(source, /Prompt Quality final score is inconsistent without an active cap/);
  assert.match(source, /process\.env\.NODE_ENV !== "production"/);
});

test("repetition scope is five model-ready sections with minimum comparison length", () => {
  const canonical = source.slice(source.indexOf("function canonicalPromptSections"), source.indexOf("function splitCanonicalInstructions"));
  assert.match(canonical, /\["video-lock", pack\.videoLock\]/);
  assert.match(canonical, /\["video-prompt", pack\.videoTimeline\]/);
  assert.match(canonical, /\["music", pack\.musicPath\]/);
  assert.match(canonical, /\["sound-effects", pack\.soundEffects\]/);
  assert.match(canonical, /\["video-rules", pack\.finalGenerationRule\]/);
  assert.doesNotMatch(canonical, /characterBuildingPrompt|startFramePrompt|endFramePrompt/);
  assert.match(source, /meaningfulTokens\(normalizeInstructionForComparison\(sentence\)\)\.length >= 8/);
});

test("duplicate matches are pair-keyed and grouped by concept", () => {
  assert.match(source, /createComparisonPairKey/);
  assert.match(source, /\.sort\(\)\.join\("::"\)/);
  assert.match(source, /const consumed = new Set<number>\(\)/);
  assert.match(source, /harmfulRepetitionCount = harmful\.length/);
  assert.match(source, /RepetitionGroup/);
});

test("repair plans target canonical fields, verify hashes, and accept capped improvements", () => {
  assert.match(source, /buildDeduplicationRepairActions/);
  assert.match(source, /protectedSections: \["video-lock"\]/);
  assert.match(source, /promptSectionHashes/);
  assert.match(source, /changedPromptSections/);
  assert.match(source, /after\.finalScore > before\.finalScore/);
  assert.match(source, /after\.finalScore === before\.finalScore && after\.baseScore > before\.baseScore/);
  assert.match(results, /changedPromptSections\(repair\.pack, candidatePack\)/);
  assert.match(results, /No prompt changes were produced\. Please try the optimization again\./);
});

test("results labels use category counts and never hide active caps", () => {
  assert.match(results, /of \{analysis\.categories\.length\} categories passed/);
  assert.match(results, /analysis\.finalScore/);
  assert.match(results, /analysis\.baseScore/);
  assert.match(results, /analysis\.appliedCaps/);
  assert.doesNotMatch(results, /checks passed/);
});

test("Demo Mode and AI Mode share the corrected analyzer and persistence path", () => {
  assert.match(source, /mode: "demo" \| "ai"/);
  assert.match(page, /optimizePromptPackage\(rawNextPack, persistedForm, productionCharacters, mode/);
  assert.match(results, /maximizePromptQuality\(production\.pack as ProductionPack, production\.form, production\.characterProfiles, production\.generationMode/);
  assert.match(results, /production\.generationMode === "ai"/);
  assert.match(results, /promptQuality: repair\.newAnalysis/);
});
