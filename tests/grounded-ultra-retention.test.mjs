import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

function compile(source, requireMap = {}) {
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const compiledModule = { exports: {} };
  vm.runInNewContext(`(function(exports,module,require){${output}})(exports,module,require)`, {
    exports: compiledModule.exports, module: compiledModule,
    require: (id) => requireMap[id] || {}, crypto, Date,
  });
  return compiledModule.exports;
}

const types = compile(fs.readFileSync("app/production-types.ts", "utf8"));
const source = fs.readFileSync("app/production-engine.ts", "utf8");
const page = fs.readFileSync("app/page.tsx", "utf8");
const route = fs.readFileSync("app/api/generate/route.ts", "utf8");
const engine = compile(source, { "./production-types": types });
const characters = [
  { id: "hero", shortName: "Biscuit", fullIdentity: "Biscuit the Orange Squirrel", role: "Hero", description: "Appearance: orange squirrel\nPrimary and secondary colors: orange and cream\nScale and proportions: small\nMovement style: quick grounded hops", appearanceLock: "orange squirrel", personalityLock: "clever", colorLock: "orange cream", scaleLock: "small", vocalStyleLock: "cheerful", movementStyle: "quick grounded hops", continuityRules: "stable", negativeRules: "no duplicate" },
  { id: "enemy", shortName: "Grumpy", fullIdentity: "Grumpy the Purple Hedgehog", role: "Enemy", description: "Appearance: purple hedgehog\nPrimary and secondary colors: plum\nScale and proportions: medium\nMovement style: planted stomps", appearanceLock: "purple hedgehog", personalityLock: "grumpy", colorLock: "plum", scaleLock: "medium", vocalStyleLock: "huffs", movementStyle: "planted stomps", continuityRules: "stable", negativeRules: "no duplicate" },
];
function form(overrides = {}) {
  return { ...types.defaultProductionForm, location: "a sunlit plaza with a stone floor", importantObject: "a rolling cookie on the stone floor", trapAction: "Grumpy pushes the rolling cookie and Biscuit redirects it", endingPayoff: "Biscuit wins while Grumpy lands safely beside the stopped cookie", heroId: "hero", selectedCharacterIds: ["enemy"], activeCharacterIds: ["hero", "enemy"], ...overrides };
}
function full(pack) { return Object.values(pack).join("\n"); }

test("grounded lock, gravity, smooth motion, and settled frames are generated", () => {
  const pack = engine.generateDemoPack(form(), characters);
  const report = engine.inspectProductionPack(pack, form(), characters);
  assert.ok(report.score >= 90, `Expected genuine first-pass score of at least 90, received ${report.score}`);
  const text = full(pack).toLowerCase();
  assert.match(text, /physical grounding lock/);
  assert.match(text, /object support lock/);
  assert.match(text, /gravity lock/);
  assert.match(text, /no unexplained hovering/);
  assert.match(text, /anticipation/);
  assert.match(text, /follow-through/);
  assert.match(text, /settling/);
  assert.match(pack.startFramePrompt.toLowerCase(), /contact with supporting surfaces/);
  assert.match(pack.endFramePrompt.toLowerCase(), /stable completed pose/);
});

test("Demo Mode repairs only failed sections and the inspector measures the real improvement", () => {
  const original = engine.generateDemoPack(form(), characters);
  const broken = { ...original, videoTimeline: "0:00â€“0:10 Biscuit floats without cause.", endFramePrompt: "unfinished jump" };
  const before = engine.inspectProductionPack(broken, form({ duration: "10" }), characters);
  const repaired = engine.repairDemoPack(broken, form({ duration: "10" }), characters, before.findings);
  const after = engine.inspectProductionPack(repaired, form({ duration: "10" }), characters);
  assert.ok(after.score > before.score);
  assert.equal(repaired.videoTitle, broken.videoTitle);
  assert.equal(repaired.characterBuildingPrompt, broken.characterBuildingPrompt);
});

test("retention starts immediately, escalates in the middle, and covers ten seconds", () => {
  const pack = engine.generateDemoPack(form({ duration: "10", tones: ["Fast", "Chaotic slapstick"] }), characters);
  assert.match(pack.videoTimeline, /0:00/);
  assert.match(pack.videoTimeline.toLowerCase(), /first second/);
  assert.match(pack.videoTimeline.toLowerCase(), /major middle escalation/);
  assert.match(pack.videoTimeline, /0:10/);
  assert.match(pack.videoLock, /Ultra Retention Mode: Enabled/);
  assert.match(pack.videoLock, /ULTRA-FAST OPENING HOOK/);
});

test("calm tone keeps controlled pacing while multiple tones materially appear", () => {
  const pack = engine.generateDemoPack(form({ tones: ["Calm", "Emotional"] }), characters);
  assert.match(pack.videoLock, /smooth controlled movement/);
  assert.match(pack.videoLock, /Calm/);
  assert.match(pack.videoLock, /Emotional/);
  assert.doesNotMatch(pack.videoLock, /ULTRA-FAST OPENING HOOK/);
});

test("quality control catches a deliberately floating and weak unfinished pack", () => {
  const pack = engine.generateDemoPack(form(), characters);
  const broken = { ...pack, videoTimeline: "0:00–0:10 Biscuit floats without cause.", endFramePrompt: "unfinished jump" };
  const report = engine.inspectProductionPack(broken, form({ duration: "10" }), characters);
  assert.ok(report.findings.some((item) => item.label === "No unexplained floating" && item.status !== "Passed"));
  assert.ok(report.findings.some((item) => item.label === "Completed grounded ending" && item.status !== "Passed"));
});

test("ultra retention defaults on and model adapters remain distinct", () => {
  assert.equal(types.defaultProductionForm.ultraRetentionMode, true);
  assert.notEqual(engine.modelPromptAdapters.Seedance.motionPolicy, engine.modelPromptAdapters.Kling.motionPolicy);
  assert.notEqual(engine.modelPromptAdapters.Kling.motionPolicy, engine.modelPromptAdapters["Google Flow / Veo"].motionPolicy);
});

test("AI schema guidance and Word export retain grounding and retention metadata", () => {
  assert.match(route, /PHYSICAL GROUNDING LOCK/);
  assert.match(route, /SMOOTH MOTION LOCK/);
  assert.match(route, /Ultra Retention Mode/);
  assert.match(page, /Ultra Retention Mode/);
  assert.match(page, /Grounding and motion safeguards/);
});
