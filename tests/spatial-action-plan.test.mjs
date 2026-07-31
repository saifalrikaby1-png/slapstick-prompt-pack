import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

function compile(source, dependencies = {}) {
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const compiledModule = { exports: {} };
  vm.runInNewContext(`(function(exports,module,require){${output}})(exports,module,require)`, { exports: compiledModule.exports, module: compiledModule, require: (id) => dependencies[id] || {}, Date });
  return compiledModule.exports;
}

const finalization = compile(fs.readFileSync("app/prompt-finalization.ts", "utf8"));
const spatialSource = fs.readFileSync("app/spatial-action-plan.ts", "utf8");
const spatial = compile(spatialSource, { "./prompt-finalization": finalization });
const engineSource = fs.readFileSync("app/production-engine.ts", "utf8");
const routeSource = fs.readFileSync("app/api/generate/route.ts", "utf8");
const qualitySource = fs.readFileSync("app/prompt-quality.ts", "utf8");
const recordsSource = fs.readFileSync("app/production-records.ts", "utf8");

const characters = [
  { id: "hero", shortName: "Biscuit", role: "Hero", fullIdentity: "Biscuit the orange squirrel" },
  { id: "enemy-1", shortName: "Grumpy", role: "Enemy", fullIdentity: "Grumpy the purple hedgehog" },
  { id: "enemy-2", shortName: "Sneaky", role: "Enemy", fullIdentity: "Sneaky the green chameleon" },
];
const concept = {
  version: "1", oneSentenceStory: "Grumpy launches a basket; Biscuit redirects it and the trap backfires.",
  location: { name: "seaside boardwalk", visualDescription: "warm daylight over a sloped stone boardwalk path with a railing", fixedEnvironmentFacts: ["one continuous boardwalk"] },
  primaryObject: { objectName: "picnic basket", visualIdentity: "one leaf-marked wicker picnic basket", initialPosition: "upper boardwalk beside Grumpy", ownerOrController: "Grumpy", forceOrTrigger: "Grumpy pushes it", movementPath: "downhill then uphill after Biscuit's visible contact", interactions: ["Sneaky blocks the lower escape route", "Biscuit redirects it"], finalPosition: "upright near the upper path beside Grumpy and Sneaky" },
  characters: [
    { characterId: "hero", characterName: "Biscuit", role: "Hero", function: "target", openingState: "downhill", mainAction: "sidesteps and redirects the basket", reaction: "smiles", endingState: "safe downhill" },
    { characterId: "enemy-1", characterName: "Grumpy", role: "Enemy", function: "initiator", openingState: "upper path beside basket", initiatingAction: "pushes basket downhill", mainAction: "dodges returning basket", reaction: "collides softly", endingState: "seated near upper path" },
    { characterId: "enemy-2", characterName: "Sneaky", role: "Enemy", function: "obstacle", openingState: "beside lower escape lane", mainAction: "blocks then attempts to intercept", reaction: "collides softly", endingState: "seated near upper path" },
  ],
  openingHook: "Grumpy braces beside the basket above Biscuit", initiatingCause: "Grumpy pushes the basket downhill", actionProgression: ["launch", "block", "redirect", "backfire"], escalation: "Sneaky blocks the escape lane", reversalOrBackfire: "Biscuit redirects the basket uphill", payoff: "Grumpy and Sneaky settle together near the upper path while Biscuit remains safe downhill", finalComposition: "basket upright near both enemies at the upper path; Biscuit safe downhill", continuityFacts: ["same boardwalk", "same basket"], durationSeconds: 15, videoRatio: "9:16", videoModel: "Seedance", source: "demo-resolved", confidence: 1,
};

const plan = spatial.buildResolvedSpatialActionPlan(concept, characters);
const zones = plan.zones;
const top = zones.find((zone) => zone.id === "slope-top");
const lower = zones.find((zone) => zone.id === "slope-lower");

test("scene zones and vocabulary are derived from the selected seaside location", () => {
  assert.ok(top && lower);
  assert.match(top.description, /boardwalk/i);
  assert.ok(plan.locationVocabulary.allowedTerms.includes("boardwalk"));
  assert.equal(spatial.validateLocationVocabulary("Lower center of the boardwalk path", plan.locationVocabulary).length, 0);
  assert.equal(spatial.validateLocationVocabulary("Center of the clearing", plan.locationVocabulary)[0].id, "location-vocabulary-contamination");
});

test("Grumpy is selected as trap initiator and Biscuit cannot launch the remote basket", () => {
  assert.equal(plan.beats[0].actions[0].actorName, "Grumpy");
  const wrong = { ...plan.beats[0].actions[0], actorId: "hero", actorName: "Biscuit", sourceZoneId: "slope-lower" };
  const finding = spatial.validateActionOwnership({ action: wrong, beforeState: plan.beats[0], concept });
  assert.ok(finding.some((entry) => entry.id === "actor-cannot-reach-object"));
  assert.ok(finding.some((entry) => entry.id === "wrong-action-owner"));
});

test("actor access rejects disconnected zones", () => {
  const isolated = [...zones, { id: "isolated", label: "Isolated", description: "remote", relativePosition: "far", connectedZoneIds: [] }];
  assert.equal(spatial.canCharacterReachTarget({ ...plan.initialCharacterStates[0], zoneId: "isolated" }, "slope-lower", isolated), false);
});

test("direction wording is generated from zone transitions and current characters", () => {
  assert.equal(spatial.describeObjectDirection({ fromZone: top, toZone: lower, characterStates: plan.initialCharacterStates }), "downhill toward Biscuit");
  const returnStates = plan.initialCharacterStates.map((state) => ["enemy-1", "enemy-2"].includes(state.characterId) ? { ...state, zoneId: "slope-top" } : state);
  assert.equal(spatial.describeObjectDirection({ fromZone: lower, toZone: top, priorSegment: plan.objectPath.segments[0], characterStates: returnStates }), "back uphill toward Grumpy and Sneaky");
});

test("object path connects, redirects, and ends at its last destination", () => {
  assert.equal(spatial.validateObjectDirectionContinuity(plan.objectPath).length, 0);
  assert.equal(plan.objectPath.finalZoneId, plan.objectPath.segments.at(-1).toZoneId);
  const stale = structuredClone(plan.objectPath); stale.segments[1].direction.directionLabel = "downhill toward Biscuit";
  assert.ok(spatial.validateObjectDirectionContinuity(stale).some((entry) => entry.id === "contradictory-object-direction"));
  const wrongFinal = structuredClone(plan.objectPath); wrongFinal.finalZoneId = "slope-lower";
  assert.ok(spatial.validateObjectDirectionContinuity(wrongFinal).some((entry) => entry.id === "unreachable-final-object"));
});

test("physical redirection requires contact, new zone, and new direction", () => {
  const redirect = plan.beats[1].actions.find((action) => action.actionType === "tap");
  assert.equal(spatial.validatePhysicalRedirection(redirect, plan.objectPath).length, 0);
  assert.equal(spatial.validatePhysicalRedirection({ ...redirect, bodyPartOrContactPoint: undefined }, plan.objectPath)[0].id, "incomplete-physical-redirection");
});

test("collision fails without convergence and passes in the payoff zone", () => {
  const beat = plan.beats[2]; const grumpy = beat.characterStatesBefore.find((state) => state.characterId === "enemy-1"); const sneaky = beat.characterStatesBefore.find((state) => state.characterId === "enemy-2");
  assert.equal(spatial.validateCollision({ actorA: grumpy, actorB: sneaky, beat }).length, 0);
  const bad = structuredClone(beat); bad.characterStatesAfter.find((state) => state.characterId === "enemy-2").zoneId = "slope-lower";
  assert.equal(spatial.validateCollision({ actorA: grumpy, actorB: sneaky, beat: bad })[0].id, "impossible-collision");
});

test("character paths and final states are reachable", () => {
  assert.equal(spatial.validateCharacterPathContinuity(plan.beats).length, 0);
  assert.equal(spatial.validateFinalStateReachability({ plan, concept }).length, 0);
  const bad = structuredClone(plan); bad.finalObjectStates[0].zoneId = "slope-lower";
  assert.equal(spatial.validateFinalStateReachability({ plan: bad, concept })[0].id, "unreachable-final-state");
});

test("second enemy must participate before the final pose", () => {
  assert.equal(spatial.validateMeaningfulParticipation(plan, characters).length, 0);
  const passive = structuredClone(plan); passive.beats.forEach((beat) => { beat.actions = beat.actions.filter((action) => action.actorId !== "enemy-2" && action.targetCharacterId !== "enemy-2"); });
  assert.match(spatial.validateMeaningfulParticipation(passive, characters)[0].message, /Sneaky/);
});

test("model-facing renderer is natural and removes internal validation language", () => {
  const rendered = spatial.renderSpatialVideoPrompt(plan, concept);
  assert.match(rendered, /Grumpy gives the picnic basket one forceful/i);
  assert.match(rendered, /back uphill toward Grumpy and Sneaky/i);
  assert.doesNotMatch(rendered, /Owner:|source zone|target zone|authorized path|unchanged cast|begin the next beat/i);
  assert.equal(spatial.removeInternalValidationLanguage("Move on authorized ground; begin the next beat from there."), "Move on ; there.");
});

test("Demo and AI generation validate structured spatial data before prose", () => {
  assert.match(engineSource, /buildResolvedSpatialActionPlan[\s\S]*validateSpatialActionPlan[\s\S]*renderSpatialVideoPrompt/);
  assert.match(routeSource, /Before writing prose, build and obey the supplied resolvedSpatialActionPlan/);
  assert.match(routeSource, /correct only the invalid structured beat and its neighboring transitions/);
  assert.match(routeSource, /renderSpatialVideoPrompt\(resolvedSpatialActionPlan/);
});

test("Maximize repairs spatial contradictions from the canonical plan", () => {
  assert.match(qualitySource, /spatialCategories[\s\S]*buildResolvedSpatialActionPlan[\s\S]*renderSpatialVideoPrompt/);
  assert.match(qualitySource, /wrongActionOwner[\s\S]*79/);
  assert.match(qualitySource, /actorCannotReachObject[\s\S]*78/);
  assert.match(qualitySource, /contradictoryObjectDirection[\s\S]*77/);
  assert.match(qualitySource, /impossibleCollision[\s\S]*76/);
  assert.match(qualitySource, /unreachableFinalState[\s\S]*79/);
  assert.match(qualitySource, /locationVocabularyContamination[\s\S]*88/);
  assert.match(qualitySource, /internalValidationLanguageInPrompt[\s\S]*91/);
});

test("quality weights total 100 and persistence is backward compatible", () => {
  const weights = [...qualitySource.matchAll(/"(?:character-consistency|character-participation|concept-specificity|authorized-inventory|spatial-consistency|action-ownership|object-trajectory|direction-continuity|action-flow|final-state-reachability|camera-motion|audio-synchronization|model-compatibility|model-facing-clarity)":\s*(\d+)/g)].map((match) => Number(match[1]));
  assert.equal(weights.reduce((sum, value) => sum + value, 0), 100);
  assert.match(recordsSource, /resolvedSpatialActionPlan: input\.form\.resolvedSpatialActionPlan \|\| existing\?\.resolvedSpatialActionPlan/);
  assert.equal(spatial.deriveSpatialPlanFromLegacyProduction({}), null);
  assert.ok(spatial.deriveSpatialPlanFromLegacyProduction({ resolvedProductionConcept: concept, characterProfiles: characters }));
});
