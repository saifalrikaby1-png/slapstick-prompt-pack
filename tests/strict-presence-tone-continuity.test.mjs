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
const engineSource = fs.readFileSync("app/production-engine.ts", "utf8");
const engine = compile(engineSource, { "./production-types": types });
const page = fs.readFileSync("app/page.tsx", "utf8");
const route = fs.readFileSync("app/api/generate/route.ts", "utf8");
const cast = [
  { id: "hero", shortName: "Biscuit", fullIdentity: "Biscuit the Orange Squirrel", role: "Hero", description: "Appearance: orange squirrel\nPrimary and secondary colors: orange and cream\nScale and proportions: small\nMovement style: quick grounded hops", appearanceLock: "orange squirrel", personalityLock: "clever", colorLock: "orange and cream", scaleLock: "small", vocalStyleLock: "cheerful", movementStyle: "grounded hops", continuityRules: "stable", negativeRules: "no duplicate" },
  { id: "enemy", shortName: "Grumpy", fullIdentity: "Grumpy the Purple Hedgehog", role: "Enemy", description: "Appearance: purple hedgehog\nPrimary and secondary colors: plum\nScale and proportions: medium\nMovement style: planted stomps", appearanceLock: "purple hedgehog", personalityLock: "grumpy", colorLock: "plum", scaleLock: "medium", vocalStyleLock: "huffs", movementStyle: "planted stomps", continuityRules: "stable", negativeRules: "no duplicate" },
  { id: "unchecked", shortName: "Sneaky", fullIdentity: "Sneaky the Green Chameleon", role: "Enemy", description: "green chameleon", appearanceLock: "green", personalityLock: "sly", colorLock: "green", scaleLock: "medium", vocalStyleLock: "chirps", movementStyle: "crawls", continuityRules: "stable", negativeRules: "no duplicate" },
];
const form = (overrides = {}) => ({ ...types.defaultProductionForm, location: "a stone woodland plaza", importantObject: "a rolling blue cookie", trapAction: "Grumpy pushes the cookie and Biscuit redirects it", endingPayoff: "Biscuit wins while Grumpy settles beside the stopped cookie", heroId: "hero", selectedCharacterIds: ["enemy"], activeCharacterIds: ["hero", "enemy"], tones: ["Fast", "Funny", "Chaotic slapstick"], ...overrides });

test("strict presence keeps active cast and object traceable from start to end", () => {
  const pack = engine.generateDemoPack(form(), cast);
  const all = Object.values(pack).join("\n");
  for (const name of ["Biscuit", "Grumpy"]) {
    assert.match(pack.startFramePrompt, new RegExp(name));
    assert.match(pack.endFramePrompt, new RegExp(name));
  }
  assert.doesNotMatch(all, /Sneaky|Green Chameleon/);
  assert.match(pack.videoLock, /STRICT PRESENCE LOCK/);
  assert.match(pack.videoLock, /STRICT OBJECT PRESENCE LOCK/);
  assert.match(pack.videoLock, /NO-SPAWN|No selected character may suddenly appear/);
  assert.match(pack.videoTimeline, /At exactly 0:00/);
  assert.match(pack.videoTimeline, /rolling blue cookie/);
});

test("fast tone starts at exactly zero with named ownership and a cast-safe camera", () => {
  const pack = engine.generateDemoPack(form(), cast);
  assert.match(pack.videoLock, /FAST-AT-0:00 LOCK/);
  assert.match(pack.videoTimeline, /At exactly 0:00, Biscuit/);
  assert.match(pack.videoTimeline, /camera holds a wide action view/);
  assert.match(pack.videoLock, /Tone-from-zero lock/);
  assert.match(pack.videoLock, /Action ownership lock/);
  assert.match(pack.videoLock, /Natural-motion lock/);
});

test("quality control detects deliberate spawn, disappearance, slow fast opening, and random movement", () => {
  const original = engine.generateDemoPack(form(), cast);
  const broken = { ...original, videoTimeline: "0:00–0:10 Biscuit waits in a static pose, Sneaky suddenly appears, Grumpy vanishes, and Biscuit randomly spins." };
  const report = engine.inspectProductionPack(broken, form({ duration: "10" }), cast);
  const failed = report.findings.filter((finding) => finding.status !== "Passed").map((finding) => finding.label);
  assert.ok(failed.includes("No spawn or despawn wording"));
  assert.ok(failed.includes("Natural-motion filter"));
  assert.ok(failed.includes("Fast begins at exactly 0:00"));
});

test("AI instructions and Word export include synchronized presence and tone policies", () => {
  assert.match(route, /strict presence and visibility lock/);
  assert.match(route, /tone from frame zero/);
  assert.match(route, /natural-motion and action-ownership lock/);
  assert.match(page, /Strict cast presence policy/);
  assert.match(page, /Tone from zero policy/);
  assert.match(engineSource, /visibilityLedger/);
  assert.match(engine.selectedModelAdapter(form()).motionPolicy, /no spawn\/despawn/);
});
