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
const source = fs.readFileSync("app/production-engine.ts", "utf8");
const engine = compile(source, { "./production-types": types });
const page = fs.readFileSync("app/page.tsx", "utf8");
const route = fs.readFileSync("app/api/generate/route.ts", "utf8");
const cast = [
  { id: "hero", shortName: "Biscuit", fullIdentity: "Biscuit the Orange Squirrel", role: "Hero", description: "orange squirrel", appearanceLock: "orange", personalityLock: "clever", colorLock: "orange", scaleLock: "small", vocalStyleLock: "cheerful", movementStyle: "hops", continuityRules: "stable", negativeRules: "no duplicate" },
  { id: "enemy", shortName: "Grumpy", fullIdentity: "Grumpy the Purple Hedgehog", role: "Enemy", description: "purple hedgehog", appearanceLock: "purple", personalityLock: "grumpy", colorLock: "purple", scaleLock: "medium", vocalStyleLock: "huffs", movementStyle: "stomps", continuityRules: "stable", negativeRules: "no duplicate" },
  { id: "unchecked", shortName: "Sneaky", fullIdentity: "Sneaky the Green Chameleon", role: "Enemy", description: "green chameleon", appearanceLock: "green", personalityLock: "sly", colorLock: "green", scaleLock: "medium", vocalStyleLock: "chirps", movementStyle: "crawls", continuityRules: "stable", negativeRules: "no duplicate" },
];
const form = (extra = {}) => ({ ...types.defaultProductionForm, location: "stone woodland plaza, central action lane", importantObject: "one blue rolling cookie", trapAction: "Grumpy pushes the cookie and Biscuit redirects it", endingPayoff: "Biscuit wins as Grumpy settles beside the cookie", heroId: "hero", selectedCharacterIds: ["enemy"], activeCharacterIds: ["hero", "enemy"], ...extra });

test("authorized inventory and object state ledger are exact and closed-world", () => {
  const inventory = engine.buildAuthorizedSceneInventory(form(), cast.slice(0, 2));
  const ledger = engine.buildObjectStateLedger(inventory);
  assert.deepEqual(inventory.characters.map((item) => item.name), ["Biscuit", "Grumpy"]);
  assert.equal(inventory.importantObjects[0].name, "one blue rolling cookie");
  assert.equal(ledger[0].presentAtStart, true);
  assert.equal(ledger[0].presentAtEnd, true);
  assert.equal(inventory.allowCuts, false);
  assert.equal(inventory.allowMagicalFloating, false);
});

test("demo pack locks exact inventory without unchecked cast or invented retention props", () => {
  const pack = engine.generateDemoPack(form(), cast);
  const all = Object.values(pack).join("\n");
  assert.match(pack.videoLock, /CLOSED-WORLD CONTINUITY RULE/);
  assert.match(pack.videoLock, /AUTHORIZED CAST: Biscuit \(Hero\), Grumpy \(Enemy\)/);
  assert.match(pack.videoLock, /AUTHORIZED OBJECTS: exactly 1/);
  assert.match(pack.videoLock, /EXACT COUNT LOCK/);
  assert.match(pack.videoLock, /NO-SPAWN \/ NO-DESPAWN LOCK/);
  assert.doesNotMatch(all, /Sneaky|Green Chameleon/);
  assert.match(pack.startFramePrompt, /complete authorized scene inventory/);
  assert.match(pack.endFramePrompt, /exact authorized inventory/);
});

test("quality control catches injected extra object, scene reset, and unauthorized entity", () => {
  const pack = engine.generateDemoPack(form(), cast);
  const broken = { ...pack, videoTimeline: "0:00–0:15 Biscuit receives a mysterious new obstacle and the scene resets with a new prop." };
  const report = engine.inspectProductionPack(broken, form(), cast);
  const failures = report.findings.filter((item) => item.status !== "Passed").map((item) => item.label);
  assert.ok(failures.includes("No unauthorized scene entity"));
  assert.ok(failures.includes("No scene reset between ranges"));
});

test("AI and Word export receive exact inventory policies", () => {
  assert.match(route, /Authorized Scene Inventory/);
  assert.match(route, /objectStateLedger/);
  assert.match(route, /CLOSED-WORLD CONTINUITY RULE/);
  assert.match(page, /Authorized Scene Inventory/);
  assert.match(page, /Exact authorized objects/);
  assert.match(source, /buildAuthorizedSceneInventory/);
});
