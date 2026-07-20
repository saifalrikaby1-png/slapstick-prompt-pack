import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

function compile(source) {
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const compiledModule = { exports: {} };
  vm.runInNewContext(`(function(exports,module,require){${output}})(exports,module,require)`, { exports: compiledModule.exports, module: compiledModule, require: () => ({}) });
  return compiledModule.exports;
}

const typesSource = fs.readFileSync("app/production-types.ts", "utf8");
const page = fs.readFileSync("app/page.tsx", "utf8");
const route = fs.readFileSync("app/api/generate/route.ts", "utf8");
const engine = fs.readFileSync("app/production-engine.ts", "utf8");
const types = compile(typesSource);

test("stable selectable-output contract expands video prompt without duplicates", () => {
  assert.deepEqual(Array.from(types.requestedOutputValues), [
    "videoTitle", "characterBuildingPrompt", "startFramePrompt", "endFramePrompt",
    "videoPrompt", "musicPath", "soundEffects",
  ]);
  assert.deepEqual(Array.from(types.fieldsForRequestedOutputs(["videoPrompt", "musicPath", "videoPrompt"])), [
    "videoLock", "videoTimeline", "finalGenerationRule", "musicPath",
  ]);
});

test("interface contains selection, partial generation, regeneration, and no credit system", () => {
  for (const text of ["Choose What to Generate", "Full Production Pack", "Generate More Outputs", "Select at least one output to generate.", "Already generated · select to regenerate", "Download Selected Outputs as Word"]) {
    assert.match(page, new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  for (const source of [page, route, engine, typesSource]) {
    assert.doesNotMatch(source, /\b(?:CreditBalance|CreditTransaction|GenerationCreditCost|OUTPUT_CREDIT_COSTS|calculateCreditCost|estimatedCredits|actualCredits|reservedCredits|availableCredits)\b/);
  }
});

test("AI route validates identifiers and builds a requested-field-only schema", () => {
  assert.match(route, /requestedOutputs\?: RequestedOutput\[\]/);
  assert.match(route, /responseSchema\(requestedOutputs/);
  assert.match(route, /fieldsForRequestedOutputs\(requestedOutputs\)/);
  assert.match(route, /unknown output identifier/);
  assert.match(route, /Never generate or return an unrequested field/);
  assert.match(route, /generatedOutputs: requestedOutputs/);
  assert.doesNotMatch(route, /estimatedCredits|actualCredits|creditBalance|creditTransaction|generationCost/);
});

test("partial output display and Word export are generated-output aware", () => {
  assert.match(page, /generatedOutputs\.includes\("startFramePrompt"\)/);
  assert.match(page, /generatedOutputs\.includes\("endFramePrompt"\)/);
  assert.match(page, /generatedOutputs\.includes\("videoPrompt"\)/);
  assert.match(page, /generatedOutputs\.includes\("musicPath"\)/);
  assert.match(page, /generatedOutputs\.includes\("soundEffects"\)/);
  assert.match(page, /packStatus: generatedOutputs\.length/);
  assert.match(page, /Generated-output summary/);
});

test("legacy migration recognizes partial and complete saved packs", () => {
  assert.match(engine, /packStatus: generatedOutputs\.length/);
  assert.match(engine, /fieldsForRequestedOutputs\(generatedOutputs\)/);
});
