import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const engine = fs.readFileSync("app/production-engine.ts", "utf8");
const library = fs.readFileSync("app/creative-library.ts", "utf8");
const page = fs.readFileSync("app/page.tsx", "utf8");
const generateRoute = fs.readFileSync("app/api/generate/route.ts", "utf8");
const creativeRoute = fs.readFileSync("app/api/creative-suggest/route.ts", "utf8");

test("visual-only copy strips voice and audio policies", () => {
  assert.match(engine, /filter\(\(line\) => !\/\^\(Audio\\\/voice rule\|Adapter audio policy\)/);
});

test("audio-only copy contains only music and sound headings", () => {
  const audioFunction = engine.slice(engine.indexOf("export function audioVideoPrompt"));
  assert.match(audioFunction, /MUSIC PATH/);
  assert.match(audioFunction, /SOUND EFFECTS/);
  assert.doesNotMatch(audioFunction, /VIDEO LOCK/);
});

test("complete copy contains all five production headings", () => {
  const complete = engine.slice(engine.indexOf("export function completeVideoPrompt"), engine.indexOf("export function visualVideoPrompt"));
  for (const heading of ["VIDEO LOCK", "SECOND-BY-SECOND VIDEO ACTION", "MUSIC PATH", "SOUND EFFECTS", "FINAL GENERATION RULE"]) {
    assert.match(complete, new RegExp(heading));
  }
});

test("duplicate matching tolerates small spelling differences and capitalization", () => {
  assert.match(library, /editDistance/);
  assert.match(library, /toLowerCase/);
  assert.match(library, /nearIdentity/);
});

test("actual creative matcher catches case and one-character spelling variants", () => {
  const compiled = ts.transpileModule(library, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const compiledModule = { exports: {} };
  vm.runInNewContext(`(function(exports,module,require){${compiled}})(exports,module,require)`, {
    exports: compiledModule.exports,
    module: compiledModule,
    require: () => ({}),
    crypto,
  });
  const { creativeCollision } = compiledModule.exports;
  const saved = [{
    id: "object-1",
    kind: "object",
    name: "Moon-Spring Cookie",
    description: "A golden crescent cookie with one blue spring hinge and a predictable rebound.",
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
  }];
  assert.equal(creativeCollision({ name: "moon spring cookie", description: "different description" }, saved), true);
  assert.equal(creativeCollision({ name: "Moon-Spring Cooki", description: "different description" }, saved), true);
  assert.equal(creativeCollision({ name: "Copperberry Popper", description: "different description" }, saved), false);
});

test("actual creative parser recovers safely from malformed storage", () => {
  const compiled = ts.transpileModule(library, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const compiledModule = { exports: {} };
  vm.runInNewContext(`(function(exports,module,require){${compiled}})(exports,module,require)`, {
    exports: compiledModule.exports,
    module: compiledModule,
    require: () => ({}),
    crypto,
  });
  assert.deepEqual(Array.from(compiledModule.exports.parseCreativeLibrary("{malformed")), []);
});

test("demo suggestions exclude saved assets and titles unless reuse is enabled", () => {
  assert.match(page, /candidates\.find\(\(candidate\) => !creativeCollision\(candidate, saved\)\)/);
  assert.match(page, /usedTitles/);
  assert.match(page, /allowPreviouslySavedObjects/);
});

test("suggestions are inserted for editing and are not automatically saved", () => {
  assert.match(page, /AI suggestion inserted for editing\. It has not been saved\./);
  assert.doesNotMatch(creativeRoute, /localStorage/);
});

test("API keys remain confined to server routes", () => {
  assert.match(generateRoute, /process\.env\.OPENAI_API_KEY/);
  assert.match(creativeRoute, /process\.env\.OPENAI_API_KEY/);
  assert.doesNotMatch(page, /OPENAI_API_KEY/);
});
