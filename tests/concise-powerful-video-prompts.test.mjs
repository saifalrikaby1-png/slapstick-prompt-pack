import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

function compile(source, requireMap = {}) {
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const compiledModule = { exports: {} };
  vm.runInNewContext(`(function(exports,module,require){${output}})(exports,module,require)`, { exports: compiledModule.exports, module: compiledModule, require: (id) => requireMap[id] || {}, crypto, Date });
  return compiledModule.exports;
}
const types = compile(fs.readFileSync("app/production-types.ts", "utf8"));
const engine = compile(fs.readFileSync("app/production-engine.ts", "utf8"), { "./production-types": types });
const cast = [
  { id: "hero", shortName: "Biscuit", fullIdentity: "Biscuit the Orange Squirrel", role: "Hero", description: "Appearance: orange squirrel", appearanceLock: "orange squirrel", personalityLock: "clever", colorLock: "orange cream", scaleLock: "small", vocalStyleLock: "cheerful", movementStyle: "grounded hops", continuityRules: "stable", negativeRules: "no duplicate" },
  { id: "enemy", shortName: "Grumpy", fullIdentity: "Grumpy the Purple Hedgehog", role: "Enemy", description: "Appearance: purple hedgehog", appearanceLock: "purple hedgehog", personalityLock: "grumpy", colorLock: "purple", scaleLock: "medium", vocalStyleLock: "huffs", movementStyle: "planted stomps", continuityRules: "stable", negativeRules: "no duplicate" },
];
const form = { ...types.defaultProductionForm, duration: "10", location: "a stone woodland plaza", importantObject: "one blue rolling cookie", trapAction: "Grumpy pushes the cookie and Biscuit redirects it", endingPayoff: "Biscuit wins while Grumpy settles beside the cookie", heroId: "hero", selectedCharacterIds: ["enemy"], activeCharacterIds: ["hero", "enemy"], tones: ["Fast", "Funny"] };
const pack = engine.generateDemoPack(form, cast);
const words = (value) => value.trim().split(/\s+/).filter(Boolean).length;

test("visible prompt is concise while final rule centralizes protections", () => {
  assert.ok(words(pack.videoLock) <= 260);
  assert.ok(words(pack.startFramePrompt) <= 200);
  assert.ok(words(pack.endFramePrompt) <= 200);
  assert.match(pack.finalGenerationRule, /NO duplicate characters/);
  assert.match(pack.finalGenerationRule, /NO duplicate objects/);
  assert.match(pack.finalGenerationRule, /NO additional characters or objects/);
  assert.match(pack.finalGenerationRule, /NO sudden cut/);
  assert.match(pack.finalGenerationRule, /NO floating/);
  assert.match(pack.finalGenerationRule, /exactly 2 characters/);
  assert.match(pack.finalGenerationRule, /Biscuit, Grumpy/);
});

test("timeline is chronological visible action and copy modes remain correctly separated", () => {
  assert.match(pack.videoTimeline, /At exactly 0:00/);
  assert.doesNotMatch(pack.videoTimeline, /NO duplicate|NO additional|NO sudden cut/);
  const visual = engine.visualVideoPrompt(pack);
  const audio = engine.audioVideoPrompt(pack);
  const complete = engine.completeVideoPrompt(pack);
  assert.match(visual, /FINAL GENERATION RULE/);
  assert.doesNotMatch(visual, /MUSIC PATH|SOUND EFFECTS/);
  assert.match(audio, /MUSIC PATH/);
  assert.doesNotMatch(audio, /VIDEO LOCK/);
  for (const heading of ["VIDEO LOCK", "SECOND-BY-SECOND VIDEO ACTION", "MUSIC PATH", "SOUND EFFECTS", "FINAL GENERATION RULE"]) assert.match(complete, new RegExp(heading));
});
