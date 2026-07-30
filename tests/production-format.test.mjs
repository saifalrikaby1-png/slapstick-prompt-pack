import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const page = fs.readFileSync("app/page.tsx", "utf8");
const types = fs.readFileSync("app/production-types.ts", "utf8");
const format = fs.readFileSync("app/production-format.ts", "utf8");
const engine = fs.readFileSync("app/production-engine.ts", "utf8");
const results = fs.readFileSync("app/production/[productionId]/results/results-workspace.tsx", "utf8");
const quality = fs.readFileSync("app/prompt-quality.ts", "utf8");

test("Production Format is second and workflow numbering is one through seven", () => {
  const workflow = page.slice(page.indexOf("const workflowSteps"), page.indexOf("const completedWorkflowSteps"));
  const labels = ["Complete Video Idea", "Production Format", "Characters", "Creative Direction", "Motion & Camera", "Audio & Timing", "Review & Generate"];
  let previous = -1;
  labels.forEach((label) => { const index = workflow.indexOf(label); assert.ok(index > previous, `${label} is out of order`); previous = index; });
  assert.match(page, /String\(index \+ 1\)\.padStart\(2, "0"\)/);
  assert.match(page, /<h2>Production Format<\/h2>/);
});

test("Production Format contains the five persisted primary controls", () => {
  for (const label of ["Video Model", "Video Duration", "Video Ratio", "Generation Mode", "Timing Structure"]) assert.match(page, new RegExp(label));
  for (const field of ["videoModel", "duration", "videoRatio", "timingStructureMode", "productionTimeline"]) assert.match(types, new RegExp(field));
  assert.match(types, /timingStructureMode: "automatic"/);
});

test("automatic timeline covers duration with contiguous proportional beats", () => {
  assert.match(format, /startSeconds = Number\(\(durationSeconds \* index \/ count\)\.toFixed\(1\)\)/);
  assert.match(format, /index === count - 1 \? durationSeconds/);
  assert.match(format, /The first beat must start at zero/);
  assert.match(format, /A gap exists before beat/);
  assert.match(format, /overlaps the previous beat/);
  assert.match(format, /The final beat must end at the selected duration/);
});

test("automatic beat count adapts to duration, complexity, and cast", () => {
  assert.match(format, /beatRanges/);
  assert.match(format, /complexity === "complex"/);
  assert.match(format, /characterCount > 3/);
  assert.match(page, /Regenerate Timing/);
});

test("custom timeline supports editing, add, remove, reorder, and validation blocking", () => {
  for (const handler of ["addTimelineBeat", "removeTimelineBeat", "moveTimelineBeat", "updateTimelineBeat"]) assert.match(page, new RegExp(handler));
  assert.match(page, /Advanced Timing Details/);
  assert.match(page, /form\.timingStructureMode === "custom" && !timelineValidation\.valid/);
  assert.match(page, /Fix the custom timeline before generation/);
});

test("generation payload and demo engine consume Production Format", () => {
  assert.match(page, /productionFormat: \{/);
  for (const field of ["videoModel", "durationSeconds", "videoRatio", "generationMode", "timingStructureMode", "timeline", "resolution"]) assert.match(page, new RegExp(field));
  assert.match(engine, /form\.productionTimeline\?\.beats\?\.length/);
  assert.match(engine, /const finalTimeline = configuredTimeline \|\| adaptedTimeline/);
});

test("review and results render Production Specifications", () => {
  assert.match(page, /Timing structure/);
  assert.match(page, /Timeline beats/);
  assert.match(results, /Production Specifications/);
  for (const label of ["Video Model", "Duration", "Video Ratio", "Generation Mode", "Timing Structure", "Timeline beats", "Resolution"]) assert.match(results, new RegExp(label));
});

test("Prompt Quality validates timeline coverage and global format", () => {
  assert.match(quality, /validateProductionTimeline\(context\.timeline, context\.durationSeconds\)/);
  assert.match(quality, /timelineValidation\.valid/);
  assert.match(quality, /ratioPresent/);
  assert.match(quality, /durationPresent/);
});

test("legacy format normalization preserves stored values and defaults timing only when missing", () => {
  assert.match(format, /value\.videoModel \|\| value\.model/);
  assert.match(format, /value\.videoRatio \|\| value\.ratio/);
  assert.match(format, /value\.timingStructureMode === "custom" \? "custom" : "automatic"/);
  assert.match(format, /value\.productionTimeline\?\.beats\?\.length/);
  assert.match(engine, /normalizeProductionFormat/);
});

test("model options remain repository-defined and no capabilities are invented", () => {
  assert.match(page, /videoModels\.map/);
  assert.match(page, /Model-specific capabilities are preserved by the existing/);
  assert.match(page, /No unsupported capability is added by this screen/);
  assert.doesNotMatch(format, /supportsAudio|supportsStartFrame|supportsEndFrame/);
});
