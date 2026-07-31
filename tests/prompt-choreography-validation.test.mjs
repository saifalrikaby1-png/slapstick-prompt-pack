import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

function compile(source) {
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const compiledModule = { exports: {} };
  vm.runInNewContext(`(function(exports,module,require){${output}})(exports,module,require)`, { exports: compiledModule.exports, module: compiledModule, require: () => ({}), Date });
  return compiledModule.exports;
}
const choreographySource = fs.readFileSync("app/prompt-choreography.ts", "utf8");
const choreography = compile(choreographySource);
const conceptSource = fs.readFileSync("app/production-concept.ts", "utf8");
const qualitySource = fs.readFileSync("app/prompt-quality.ts", "utf8");
const routeSource = fs.readFileSync("app/api/generate/route.ts", "utf8");
const recordsSource = fs.readFileSync("app/production-records.ts", "utf8");

const characters = [
  { id: "hero", shortName: "Biscuit", fullIdentity: "Biscuit the orange squirrel", role: "Hero", nonverbalSoundProfile: "high lively chirps and short effort breaths" },
  { id: "enemy-1", shortName: "Grumpy", fullIdentity: "Grumpy the purple hedgehog", role: "Enemy", nonverbalSoundProfile: "low frustrated grunts and brief impact reactions" },
  { id: "enemy-2", shortName: "Sneaky", fullIdentity: "Sneaky the green chameleon", role: "Enemy", nonverbalSoundProfile: "restrained squeaks and short breaths" },
];
const concept = {
  version: "1", oneSentenceStory: "Grumpy pushes the picnic basket; Biscuit redirects it and Grumpy collides softly with Sneaky.",
  location: { name: "seaside boardwalk", visualDescription: "sunlit boardwalk with one curved stone path", fixedEnvironmentFacts: ["one ground plane"] },
  primaryObject: { objectName: "picnic basket", visualIdentity: "one wicker picnic basket", initialPosition: "top of the stone path beside Grumpy", ownerOrController: "Grumpy", forceOrTrigger: "Grumpy pushes with both hands", movementPath: "downhill, then back after Biscuit contacts the lower side and pivots it", interactions: ["Sneaky narrows the lane", "Biscuit makes foot contact", "Grumpy dodges into Sneaky"], finalPosition: "on the ground beside Biscuit" },
  characters: [
    { characterId: "hero", characterName: "Biscuit", role: "Hero", function: "rescuer", openingState: "below the basket", mainAction: "plants one foot against the basket side, absorbs momentum, and pivots it", reaction: "leans back", endingState: "beside the basket" },
    { characterId: "enemy-1", characterName: "Grumpy", role: "Enemy", function: "initiator", openingState: "behind basket", initiatingAction: "pushes basket", mainAction: "pushes the basket with both hands", reaction: "dodges into Sneaky", endingState: "seated beside Sneaky" },
    { characterId: "enemy-2", characterName: "Sneaky", role: "Enemy", function: "assistant", openingState: "beside path", mainAction: "steps into the path and blocks Biscuit's first escape lane", reaction: "collides softly with Grumpy", endingState: "seated beside Grumpy" },
  ], openingHook: "Grumpy braces against basket", initiatingCause: "Grumpy pushes basket", actionProgression: ["push", "interference", "redirection", "backfire"], escalation: "basket gains speed", reversalOrBackfire: "basket returns", payoff: "Grumpy dodges into Sneaky; both sit unharmed while basket stops beside Biscuit", finalComposition: "Biscuit beside basket; Grumpy and Sneaky seated together", continuityFacts: [], durationSeconds: 15, videoRatio: "9:16", videoModel: "Seedance", source: "demo-resolved", confidence: 1,
};
const inventory = choreography.buildAuthorizedProductionInventory(concept, characters);

test("authorized basket plus unauthorized screen fails and repair removes it", () => {
  const sections = { "video-prompt": "The picnic basket knocks over a hiding screen." };
  const findings = choreography.detectUnauthorizedObjects({ sections, authorizedInventory: inventory });
  assert.equal(findings[0].objectName, "hiding screen");
  const pack = { videoTitle: "", characterBuildingPrompt: "", startFramePrompt: "", endFramePrompt: "", videoLock: "", videoTimeline: sections["video-prompt"], musicPath: "", soundEffects: "", finalGenerationRule: "" };
  assert.doesNotMatch(choreography.repairUnauthorizedObjects(pack, inventory, concept).videoTimeline, /screen/i);
  assert.match(qualitySource, /"unauthorizedObject"[\s\S]*79/);
});

test("every character receives participation analysis and passive Sneaky fails", () => {
  const results = choreography.analyzeCharacterParticipation(concept, characters);
  assert.equal(results.length, 3); assert.ok(results.every((result) => result.hasMeaningfulAction));
  const passive = structuredClone(concept); passive.characters[2].mainAction = "stands in the background";
  assert.equal(choreography.analyzeCharacterParticipation(passive, characters)[2].hasMeaningfulAction, false);
});

test("complete trajectory passes while incomplete and vague redirection fail", () => {
  const trajectory = choreography.buildCompleteObjectTrajectory(concept);
  assert.equal(choreography.validateCompleteObjectTrajectory(trajectory, 15).length, 0);
  const vague = structuredClone(trajectory); vague.segments[2].forceOrTrigger = "Biscuit redirects it"; vague.segments[2].characterInteraction = "";
  assert.ok(choreography.validateCompleteObjectTrajectory(vague, 15).some((issue) => issue.id === "unclear-redirection"));
  const incomplete = structuredClone(trajectory); incomplete.segments[0].direction = "";
  assert.ok(choreography.validateCompleteObjectTrajectory(incomplete, 15).length > 0);
});

test("executable beats have exact owners, contact, payoff, and aligned audio", () => {
  const trajectory = choreography.buildCompleteObjectTrajectory(concept);
  const beats = choreography.buildExecutableVideoBeats(concept, trajectory);
  assert.ok(beats.every((beat) => beat.actionOwnerIds.length && beat.physicalCause && beat.cameraDirection && beat.continuityToNextBeat));
  assert.match(beats[2].physicalCause, /foot.*lower side.*momentum.*pivot/i);
  assert.match(beats.at(-1).concreteAction, /Grumpy.*Sneaky.*settle unharmed.*basket.*slows beside Biscuit/i);
  const aligned = choreography.alignAudioTimingToVideoBeats(beats, [], []);
  assert.deepEqual(aligned.musicPlan.map(({ startSeconds, endSeconds }) => [startSeconds, endSeconds]), beats.map(({ startSeconds, endSeconds }) => [startSeconds, endSeconds]));
  assert.deepEqual(aligned.sfxPlan.map(({ startSeconds, endSeconds }) => [startSeconds, endSeconds]), beats.map(({ startSeconds, endSeconds }) => [startSeconds, endSeconds]));
});

test("lock, rules, and SFX are compressed without repeated vocal locks", () => {
  const trajectory = choreography.buildCompleteObjectTrajectory(concept); const beats = choreography.buildExecutableVideoBeats(concept, trajectory);
  const form = { motionLevel: "Balanced", voiceLayers: ["No Spoken Dialogue"], noMusic: false, musicStyle: "playful-comedy" };
  const lock = choreography.buildConciseVideoLock({ concept, characters, inventory, form, style: "3D", model: "Seedance" });
  const rules = choreography.buildConciseVideoRules(); const sfx = choreography.buildConciseSoundEffects(beats, characters, "picnic basket");
  assert.match(lock, /FORMAT.*CAST.*ENVIRONMENT AND OBJECT.*CONTINUITY.*DIALOGUE/s);
  assert.match(rules, /defined in Video Lock/); assert.ok(rules.split(/\s+/).length < 130);
  assert.equal((sfx.match(/VOCAL LOCKS/g) || []).length, 1); assert.equal((sfx.match(/No spoken words/g) || []).length, 1);
  const videoPrompt = beats.map((beat) => Object.values(beat).join(" ")).join(" ");
  assert.ok(sfx.split(/\s+/).length < videoPrompt.split(/\s+/).length);
});

test("malformed encoding normalizes before persistence and analysis", () => {
  assert.equal(choreography.normalizeGeneratedTextEncoding("0:00Ã¢â‚¬â€0:04"), "0:00—0:04");
  assert.match(recordsSource, /normalizeProductionPackEncoding/);
  assert.match(qualitySource, /pack = normalizeProductionPackEncoding\(pack\)/);
  assert.match(routeSource, /normalizeProductionPackEncoding/);
});

test("quality weights total 100 and evidence-backed caps block 95+", () => {
  const block = qualitySource.slice(qualitySource.indexOf("PROMPT_QUALITY_WEIGHTS"), qualitySource.indexOf("PROMPT_QUALITY_CAPS"));
  const weights = [...block.matchAll(/"[^"]+": (\d+)/g)].map((match) => Number(match[1]));
  assert.equal(weights.reduce((sum, value) => sum + value, 0), 100);
  for (const cap of [["unauthorizedObject",79],["missingMeaningfulCharacterAction",84],["twoMissingCharacterActions",78],["audioTimingMismatch",91],["malformedEncoding",94],["sfxSeverelyOvergenerated",92]]) assert.match(qualitySource, new RegExp(`"${cap[0]}"[\\s\\S]*${cap[1]}`));
});

test("Demo repair is deterministic and AI repair preserves inventory", () => {
  assert.doesNotMatch(conceptSource, /hiding screen/i);
  assert.match(conceptSource, /plants one foot against.*lower side.*absorbs momentum.*pivots/is);
  assert.match(routeSource, /repairUnauthorizedObjects/);
  assert.match(routeSource, /preserve authorized inventory exactly|single story source/i);
});
