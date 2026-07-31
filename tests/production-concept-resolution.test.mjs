import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const concept = fs.readFileSync("app/production-concept.ts", "utf8");
const engine = fs.readFileSync("app/production-engine.ts", "utf8");
const page = fs.readFileSync("app/page.tsx", "utf8");
const route = fs.readFileSync("app/api/generate/route.ts", "utf8");
const quality = fs.readFileSync("app/prompt-quality.ts", "utf8");
const records = fs.readFileSync("app/production-records.ts", "utf8");
const results = fs.readFileSync("app/production/[productionId]/results/results-workspace.tsx", "utf8");

test("optional title is metadata and concept resolution precedes generation", () => {
  assert.match(concept, /optionalTitle\?: string/);
  assert.match(concept, /workingTitle: clean\(input\.optionalTitle\) \|\| undefined/);
  assert.match(page, /await resolveProductionConcept/);
  assert.match(page, /resolvedProductionConcept/);
  assert.match(engine, /generateWorkingTitleFromResolvedConcept/);
  assert.doesNotMatch(engine.slice(engine.indexOf("export function generateDemoPack")), /the selected video concept/);
});

test("Demo and AI resolvers produce and validate structured concrete concepts", () => {
  assert.match(concept, /DEMO_STORY_PATTERNS/);
  assert.match(concept, /enemy-trap-backfire/);
  assert.match(concept, /resolveDemoProductionConcept/);
  assert.match(concept, /resolveAiProductionConcept/);
  for (const field of ["location", "primaryObject", "characters", "initiatingCause", "actionProgression", "escalation", "payoff", "finalComposition"]) assert.match(concept, new RegExp(field));
  assert.match(concept, /validateResolvedProductionConcept/);
});

test("placeholder, causal chain, object trajectory, participation, and duration checks are enforced", () => {
  for (const phrase of ["selected video concept", "supporting story object", "complete the payoff", "model-aware framing", "the main event"]) assert.match(concept, new RegExp(phrase));
  assert.match(concept, /validateCausalStory/);
  assert.match(concept, /validateObjectTrajectory/);
  assert.match(concept, /validateCharacterParticipation/);
  assert.match(concept, /The action progression cannot fit the selected duration/);
  assert.match(route, /detectUnresolvedPromptLanguage\(Object\.values\(pack\)\.join/);
});

test("all downstream generation uses the resolved concept", () => {
  assert.match(engine, /resolvedConcept\.location/);
  assert.match(engine, /resolvedConcept\.primaryObject\.initialPosition/);
  assert.match(engine, /resolvedConcept\.primaryObject\.finalPosition/);
  assert.match(engine, /resolvedConcept\.payoff/);
  assert.match(engine, /buildTimelineFromResolvedConcept\(resolvedConcept\)/);
  assert.match(route, /single story source/);
  assert.match(route, /resolvedProductionConcept: body\.resolvedProductionConcept/);
});

test("Concept Specificity weights and hard caps are integrated", () => {
  assert.match(quality, /"concept-specificity": 15/);
  assert.match(quality, /"unresolvedPlaceholder"[\s\S]*74/);
  assert.match(quality, /"genericTimeline"[\s\S]*78/);
  assert.match(quality, /GENERIC_ACTION_PHRASES/);
  const block = quality.slice(quality.indexOf("PROMPT_QUALITY_WEIGHTS"), quality.indexOf("PROMPT_QUALITY_CAPS"));
  const weights = [...block.matchAll(/"[^"]+": (\d+)/g)].map((match) => Number(match[1]));
  assert.equal(weights.reduce((sum, value) => sum + value, 0), 100);
});

test("resolved concepts persist and appear in result and Word metadata", () => {
  assert.match(records, /resolvedProductionConcept/);
  assert.match(results, /Resolved Production Concept/);
  assert.match(results, /resolvedStory/);
  assert.match(engine, /item\.resolvedProductionConcept/);
});
