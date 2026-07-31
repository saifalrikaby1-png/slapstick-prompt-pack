import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

function compile(source) { const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText; const compiledModule = { exports: {} }; vm.runInNewContext(`(function(exports,module,require){${output}})(exports,module,require)`, { exports: compiledModule.exports, module: compiledModule, require: () => ({}), Date }); return compiledModule.exports; }
const finalization = compile(fs.readFileSync("app/prompt-finalization.ts", "utf8"));
const choreography = compile(fs.readFileSync("app/prompt-choreography.ts", "utf8"));
const repairEngine = compile(fs.readFileSync("app/prompt-repair-engine.ts", "utf8"));
const resultsSource = fs.readFileSync("app/production/[productionId]/results/results-workspace.tsx", "utf8");
const qualitySource = fs.readFileSync("app/prompt-quality.ts", "utf8");

const inventory = { characterIds: ["hero"], characterNames: ["Biscuit"], objects: [{ id: "primary-object", name: "seashell", aliases: ["seashell", "shell", "large seashell"], attributes: ["bright leaf-shaped mark", "rounded spiral shape"] }], environment: { locationName: "forest workshop", surfaces: ["stone path"], zones: ["upper route", "lower route"], allowedVocabulary: [] }, location: { name: "forest workshop", description: "outdoor workshop beside a path" } };

test("inventory classifies zones and attributes separately from movable objects", () => {
  assert.equal(choreography.classifyPromptEntity("upper route", "video-prompt", inventory).kind, "scene-zone");
  assert.equal(choreography.classifyPromptEntity("leaf-shaped mark", "video-prompt", inventory).kind, "object-attribute");
  assert.equal(choreography.classifyPromptEntity("folding screen", "video-prompt", inventory).kind, "unauthorized-movable-object");
  const sections = { "video-prompt": "The shell crosses the upper route with its leaf-shaped mark visible." };
  assert.equal(choreography.detectUnauthorizedObjects({ sections, authorizedInventory: inventory }).length, 0);
  const rejected = choreography.detectUnauthorizedObjects({ sections: { "video-prompt": "A folding screen appears at 0:05–0:07." }, authorizedInventory: inventory });
  assert.equal(rejected[0].objectName, "folding screen");
  assert.match(rejected[0].evidence[0], /folding screen/);
});

test("screen direction is protected while a physical hiding screen remains unauthorized", () => {
  const protectedSections = { "video-lock": "Preserve cast count, lighting, screen direction, and the same seashell." };
  assert.equal(choreography.classifyScreenUsage(protectedSections["video-lock"]), "filmmaking-term");
  assert.equal(choreography.detectUnauthorizedObjects({ sections: protectedSections, authorizedInventory: inventory }).length, 0);
  const physical = choreography.detectUnauthorizedObjects({ sections: { "video-prompt": "The returning seashell knocks a hiding screen flat." }, authorizedInventory: inventory });
  assert.ok(physical.some((finding) => /screen/i.test(finding.objectName)));
});

test("issue-specific repair changes actual prompt content and aligned audio", () => {
  const pack = { characterBuildingPrompt: "", startFramePrompt: "Biscuit, Grumpy, Sneaky outside the workshop.", endFramePrompt: "A hiding screen remains. Grumpy settles.", videoLock: "Preserve screen direction and the same single seashell.", videoTimeline: "0:00–0:03 — Grumpy pushes the seashell downhill.\n0:03–0:05 — Biscuit makes contact using a foot or tail.\n0:05–0:07 — The seashell knocks a hiding screen flat.\n0:07–0:10 — Grumpy settles in a defeated pose.", musicPath: "0:00–0:03 ... 0:03–0:05 ... 0:05–0:08 ... 0:08–0:10 ...", soundEffects: "0:00–0:03 ... 0:03–0:05 ... 0:05–0:08 ... 0:08–0:10 ... hiding screen crash", finalGenerationRule: "" };
  const issue = (id, code, affectedSections) => ({ id, code, affectedSections, active: true, repairable: true });
  const issues = [issue("inventory", "unauthorized-movable-object", ["video-prompt", "end-frame", "sound-effects"]), issue("physical", "multiple-contact-methods", ["video-prompt"]), issue("characters", "missing-character-final-state", ["video-prompt", "end-frame"]), issue("object", "missing-object-final-state", ["video-prompt", "end-frame", "sound-effects"]), issue("audio", "audio-timing-mismatch", ["music", "sound-effects", "video-prompt"])];
  const repaired = repairEngine.applyIssueSpecificPromptRepairs(pack, issues, { characterNames: ["Biscuit", "Grumpy", "Sneaky"], objectName: "seashell", locationName: "mossy forest workshop" });
  assert.doesNotMatch(repaired.videoTimeline, /hiding screen|foot or tail/i);
  assert.doesNotMatch(repaired.endFramePrompt, /hiding screen/i);
  assert.doesNotMatch(repaired.soundEffects, /hiding screen/i);
  assert.match(repaired.videoTimeline, /Grumpy and Sneaky.*settle/i);
  assert.match(repaired.videoTimeline, /seashell.*wobbles once.*stops upright/i);
  assert.deepEqual([...repaired.musicPath.matchAll(/0:\d{2}[–—-]0:\d{2}/g)].map((match) => match[0]), ["0:00–0:03", "0:03–0:05", "0:05–0:07", "0:07–0:10"]);
  assert.deepEqual([...repaired.soundEffects.matchAll(/0:\d{2}[–—-]0:\d{2}/g)].map((match) => match[0]), ["0:00–0:03", "0:03–0:05", "0:05–0:07", "0:07–0:10"]);
});

const beats = [{ id: "a", startSeconds: 0, endSeconds: 3, label: "Hook", visualAction: "push" }, { id: "b", startSeconds: 3, endSeconds: 5, label: "Redirect", visualAction: "tap" }, { id: "c", startSeconds: 5, endSeconds: 7, label: "Backfire", visualAction: "collision" }, { id: "d", startSeconds: 7, endSeconds: 10, label: "Payoff", visualAction: "settle" }];
const concept = { primaryObject: { objectName: "seashell" } };
const form = { noMusic: false, musicStyle: "playful-comedy" };

test("music and SFX use finalized visual boundaries exactly", () => {
  const music = finalization.buildMusicFromFinalizedBeats({ beats, concept, form });
  const sfx = finalization.buildSfxFromFinalizedBeats({ beats, concept, characterVocalLocks: [], form });
  assert.deepEqual(music.map((beat) => [beat.startSeconds, beat.endSeconds]), [[0,3],[3,5],[5,7],[7,10]]);
  assert.deepEqual(sfx.map((beat) => [beat.startSeconds, beat.endSeconds]), [[0,3],[3,5],[5,7],[7,10]]);
  const repaired = finalization.repairAudioTiming({ videoBeats: beats, musicBeats: music.map((beat, index) => index === 2 ? { ...beat, endSeconds: 8 } : beat), sfxBeats: sfx });
  assert.equal(repaired.repaired, true); assert.equal(repaired.musicBeats[2].endSeconds, 7);
});

test("all selected characters require explicit payoff final states", () => {
  const selectedCharacters = [{ id: "hero", shortName: "Biscuit" }, { id: "enemy-1", shortName: "Grumpy" }, { id: "enemy-2", shortName: "Sneaky" }];
  const complete = selectedCharacters.map((character) => ({ characterId: character.id, characterName: character.shortName, finalZoneId: "payoff", finalPosture: "seated", finalFacing: "camera", finalExpression: "surprised", supported: true, visible: true, settled: true }));
  assert.equal(finalization.validateAllCharacterFinalStates({ selectedCharacters, finalStates: complete, payoffText: "Biscuit smiles while Grumpy and Sneaky settle." }).length, 0);
  assert.match(finalization.validateAllCharacterFinalStates({ selectedCharacters, finalStates: complete.slice(0, 2), payoffText: "Biscuit smiles while Grumpy settles." })[0].evidence, /Sneaky/);
});

test("important object requires visible stop, position, and orientation in payoff", () => {
  const objectPath = { objectId: "primary-object", objectName: "seashell", segments: [{ toZoneId: "upper" }], finalZoneId: "upper" };
  const state = { objectId: "primary-object", objectName: "seashell", finalZoneId: "upper", finalPositionDescription: "beside both enemies", finalOrientation: "upright mark facing camera", supported: true, visible: true, settled: true };
  assert.equal(finalization.validateObjectFinalState({ objectPath, finalState: state, videoLock: "seashell ends upper", payoffText: "The seashell wobbles once and stops upright beside Grumpy and Sneaky." }).length, 0);
  assert.equal(finalization.validateObjectFinalState({ objectPath, finalState: undefined, videoLock: "seashell ends upper", payoffText: "Enemies settle." })[0].id, "missing-object-final-state");
});

test("physical renderer chooses one contact method and rejects alternatives", () => {
  const text = finalization.renderPhysicalRedirection({ actorName: "Biscuit", bodyPart: "tail", objectName: "seashell", contactPoint: "lower side", preparation: "sidesteps and braces", contactAction: "tap", momentumResponse: "absorbs momentum", newDirection: "back uphill", resultingPath: "the curved edge" });
  assert.match(text, /one visible tail tap/); assert.doesNotMatch(text, / or /); assert.equal(finalization.validateRenderedPhysicalAction(text).length, 0);
  assert.equal(finalization.validateRenderedPhysicalAction("Biscuit makes visible lower side with a foot or tail contact.")[0].id, "malformed-physical-action");
});

test("object motion follows shape and incompatible movement is detected", () => {
  const shell = finalization.inferObjectMotionProfile(inventory.objects[0]);
  assert.ok(shell.supportedMovementTypes.includes("roll")); assert.ok(shell.supportedMovementTypes.includes("wobble"));
  const basket = finalization.inferObjectMotionProfile({ id: "b", name: "picnic basket", aliases: ["basket"], attributes: ["box-like wicker body"] });
  assert.ok(finalization.validateObjectMotionCompatibility({ objectProfile: basket, trajectory: { segments: [{ movementType: "roll" }] } }).length);
});

test("location coherence preserves and clarifies the selected workshop", () => {
  const location = finalization.resolveLocationPlan({ location: { name: "mossy forest workshop", visualDescription: "forest workshop with a sloped path" } });
  const rendered = finalization.renderCoherentLocation(location);
  assert.match(rendered, /mossy forest workshop/); assert.match(rendered, /outdoor area beside|outside/);
});

test("quality exposes evidence and exact final-state and grammar caps", () => {
  assert.match(qualitySource, /evidence: string; recommendedRepair: string; pointsLost: number/);
  assert.match(qualitySource, /missingCharacterFinalState[\s\S]*84/);
  assert.match(qualitySource, /missingObjectFinalState[\s\S]*82/);
  assert.match(qualitySource, /finalStateOnlyInVideoLock[\s\S]*85/);
  assert.match(qualitySource, /malformedPhysicalAction[\s\S]*82/);
});

test("Maximize has phases, updates state and score, persists, rejects worse repair, and supports undo", () => {
  for (const phase of ["analyzing", "repairing", "validating", "saving", "complete", "error"]) assert.match(resultsSource, new RegExp(`setPromptOptimizationStatus\\(\\"${phase}\\"\\)`));
  assert.match(resultsSource, /onClick=\{onMaximize\}/); assert.match(resultsSource, /disabled=\{active\}/);
  assert.match(resultsSource, /shouldAcceptRepairResult\(\{ before: initialAnalysis, after: repairedAnalysis, verification \}\)/);
  assert.match(resultsSource, /saveProductionRecord\(\{ \.\.\.production, pack: candidatePack, promptQuality: repair\.newAnalysis/);
  assert.match(resultsSource, /setProduction\(updated\)/); assert.match(resultsSource, /setPreviousProductionVersion\(original\)/);
  assert.match(resultsSource, /function handleUndoMaximize/); assert.match(resultsSource, /saveProductionRecord\(previousProductionVersion\)/);
  assert.match(resultsSource, /promptOptimizationError/); assert.match(resultsSource, /Try Again/);
  assert.match(resultsSource, /View Repairs/); assert.match(resultsSource, /change\.before\[section\]/); assert.match(resultsSource, /change\.after\[section\]/);
});
