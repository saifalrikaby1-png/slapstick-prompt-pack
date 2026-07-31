import type { CharacterProfile, ProductionForm, ProductionTimeline, ResolvedObjectTrajectory, ResolvedProductionConcept, ProductionCharacterFunction } from "./production-types";

export type ProductionConceptResolutionInput = {
  optionalTitle?: string; userIdea?: string; selectedCharacters: CharacterProfile[];
  location?: string; importantObject?: string; mainAction?: string; trapOrConflict?: string; ending?: string;
  videoType: string; visualStyle: string; pacing: string; durationSeconds: number; videoRatio: string; videoModel: string;
  generationMode: "demo" | "ai";
};
export type ProductionConceptValidationIssue = { id: string; severity: "critical" | "major" | "minor"; field: keyof ResolvedProductionConcept | string; message: string; repairable: boolean };
export type ProductionConceptValidationResult = { valid: boolean; issues: ProductionConceptValidationIssue[] };

export const UNRESOLVED_PROMPT_PATTERNS = [
  /\bselected video concept\b/i, /\bthe selected concept\b/i, /\bsupporting story object\b/i,
  /\bchosen location\b/i, /\bselected location\b/i, /\brelevant ending\b/i, /\bappropriate action\b/i,
  /\bcomplete the payoff\b/i, /\bmain action\b(?!\s*[:=-]\s*\w+)/i, /\bmodel-aware framing\b/i,
  /\bthe selected object\b/i, /\bthe main event\b/i, /\bderived from the concept\b/i,
  /\bderived from ["“]?the selected video concept/i, /\bproduction-ready setting derived from\b/i,
];
export const GENERIC_ACTION_PHRASES = ["establish the immediate visual hook", "advance the main action", "escalation advances the action", "complete the payoff", "resolve the scene", "perform the action", "react appropriately", "use model-aware framing", "inherit the preceding beat", "support a replayable finish"];
export function detectUnresolvedPromptLanguage(text: string): string[] { return UNRESOLVED_PROMPT_PATTERNS.filter((pattern) => pattern.test(text)).map((pattern) => pattern.source); }

const LOCATIONS = ["sunlit woodland picnic clearing", "mossy forest workshop", "bright seaside boardwalk", "flower-lined village square"];
const OBJECTS = ["oversized acorn", "rolling berry", "spring mushroom", "picnic basket", "lantern", "seashell", "cookie box"];
const clean = (value?: string) => value?.trim().replace(/\s+/g, " ") || "";
const concreteChoice = (value: string, catalog: string[], seed: number) => value && !detectUnresolvedPromptLanguage(value).length ? value : catalog[seed % catalog.length];
const roleFunction = (role: string, index: number): ProductionCharacterFunction => role === "Hero" ? "rescuer" : role === "Enemy" ? (index === 0 ? "initiator" : "assistant") : "witness";

export type DemoStoryPattern = { id: string; supportedVideoTypes: string[]; minimumCharacters: number; maximumCharacters: number; supportsRoles: { hero?: number; enemy?: number; companion?: number }; build: (input: ProductionConceptResolutionInput) => ResolvedProductionConcept };

function buildConcreteConcept(input: ProductionConceptResolutionInput, source: ResolvedProductionConcept["source"]): ResolvedProductionConcept {
  const selected = input.selectedCharacters;
  const hero = selected.find((character) => character.role === "Hero") || selected[0];
  const others = selected.filter((character) => character.id !== hero?.id);
  const initiator = others.find((character) => character.role === "Enemy") || others[0] || hero;
  const location = concreteChoice(clean(input.location), LOCATIONS, selected.length + input.durationSeconds);
  const object = concreteChoice(clean(input.importantObject), OBJECTS, input.durationSeconds + input.videoType.length);
  const trigger = clean(input.trapOrConflict || input.mainAction) || `${initiator?.shortName || "The initiator"} shoves the ${object} down the sloped stone path toward ${hero?.shortName || "the hero"}`;
  const response = `${hero?.shortName || "The hero"} sidesteps downhill, makes visible contact with the ${object}'s lower side, absorbs part of its momentum with a brief backward lean, then redirects it onto a curved return route toward the upper path`;
  const assistant = others.find((character) => character.id !== initiator?.id);
  const reversal = `the redirected ${object} rolls back along the same path; ${initiator?.shortName || "the initiator"} dodges sideways and bumps softly into ${assistant?.shortName || hero?.shortName || "the responder"}`;
  const payoff = clean(input.ending) || `${hero?.shortName || "The hero"} remains safely downhill while the stopped ${object} rests near ${initiator?.shortName || "the initiator"} and ${assistant?.shortName || "the second opponent"}, who settle unharmed together with surprised defeated expressions`;
  const characters = selected.map((character, index) => ({
    characterId: character.id, characterName: character.shortName, role: character.role,
    function: character.id === initiator?.id ? "initiator" : character.id === hero?.id ? "rescuer" : roleFunction(character.role, index),
    openingState: character.id === initiator?.id ? `crouched beside the ${object} at the upper end of the action route` : character.id === hero?.id ? `waiting at the lower end of the action route and watching the ${object}` : `waiting beside the lower escape lane, watching ${initiator?.shortName || "the initiator"}`,
    initiatingAction: character.id === initiator?.id ? trigger : undefined,
    mainAction: character.id === hero?.id ? response : character.id === initiator?.id ? trigger : `steps into the ${object}'s path and blocks ${hero?.shortName || "the hero"}'s first escape lane, accidentally forcing the physical redirection`,
    reaction: character.id === hero?.id ? `tracks the ${object}, plants, and redirects it` : `recoils as the ${object} reverses direction`,
    endingState: character.id === hero?.id ? `standing safely at the lower end of the route` : `seated unharmed beside the other opponent near the upper end of the route, facing ${hero?.shortName || "the hero"}`,
  }));
  const progression = [trigger, response, reversal, payoff];
  const finalComposition = `${location}: ${characters.map((character) => `${character.characterName} ${character.endingState}`).join("; ")}; the ${object} rests upright near ${initiator?.shortName || "the initiator"} and ${assistant?.shortName || "the second opponent"} at the upper end of the route`;
  return {
    version: "1.0.0", workingTitle: clean(input.optionalTitle) || undefined,
    oneSentenceStory: `${trigger}; ${response}, causing ${reversal}, and ${payoff}.`,
    location: { name: location, visualDescription: `${location} with a clear sloped stone action path, warm daylight, and unobstructed sightlines`, fixedEnvironmentFacts: ["one continuous ground plane", "sloped stone path runs camera-left to camera-right", "warm daylight remains constant"] },
    primaryObject: { objectName: object, visualIdentity: `one large, unmistakable ${object} with a bright leaf-shaped mark`, initialPosition: `resting at the upper end of the action route beside ${initiator?.shortName || "the initiator"}`, ownerOrController: initiator?.shortName, forceOrTrigger: trigger, movementPath: `from the upper route toward ${hero?.shortName || "the hero"} at the lower route; ${hero?.shortName || "the hero"} makes visible lower-side contact, absorbs momentum, and redirects it onto the curved return route; it travels back toward ${initiator?.shortName || "the initiator"} and ${assistant?.shortName || "the second opponent"} before friction stops it near the upper route`, interactions: [`approaches ${hero?.shortName || "the hero"}`, `${assistant?.shortName || "the assistant"} blocks the lower escape lane`, `${hero?.shortName || "the hero"} makes visible lower-side contact`, `${initiator?.shortName || "the initiator"} dodges into ${assistant?.shortName || "the assistant"}`], finalPosition: `resting upright near ${initiator?.shortName || "the initiator"} and ${assistant?.shortName || "the second opponent"} at the upper end of the route` },
    characters, openingHook: `${initiator?.shortName || "The initiator"} visibly braces both hands against the ${object} at the top of the slope as ${hero?.shortName || "the hero"} enters its path`, initiatingCause: trigger,
    actionProgression: progression, escalation: `${object} gains speed down the slope while every character tracks its continuous path`, reversalOrBackfire: reversal, payoff, finalComposition,
    continuityFacts: [`exactly ${selected.length} selected characters`, `one ${object}`, `same ${location}`, "no added characters or props", `global ratio ${input.videoRatio}`],
    durationSeconds: input.durationSeconds, videoRatio: input.videoRatio, videoModel: input.videoModel, source, confidence: 0.96,
  };
}

export const DEMO_STORY_PATTERNS: DemoStoryPattern[] = [{ id: "enemy-trap-backfire", supportedVideoTypes: ["slapstick", "family-3d", "stylized-3d", "*"], minimumCharacters: 1, maximumCharacters: 12, supportsRoles: { hero: 1, enemy: 1 }, build: (input) => buildConcreteConcept(input, "demo-resolved") }];
export function resolveDemoProductionConcept(input: ProductionConceptResolutionInput): ResolvedProductionConcept { return DEMO_STORY_PATTERNS[0].build(input); }
export async function resolveAiProductionConcept(input: ProductionConceptResolutionInput): Promise<ResolvedProductionConcept> { return buildConcreteConcept(input, "ai-resolved"); }
export async function resolveProductionConcept(input: ProductionConceptResolutionInput): Promise<ResolvedProductionConcept> {
  const concept = input.generationMode === "ai" ? await resolveAiProductionConcept(input) : resolveDemoProductionConcept(input);
  const validation = validateResolvedProductionConcept(concept, input);
  if (!validation.valid) throw new Error("We could not resolve this production into a concrete, physically executable story. Your selections have been preserved.");
  return concept;
}
export function resolveProductionConceptSync(input: ProductionConceptResolutionInput): ResolvedProductionConcept {
  const concept = buildConcreteConcept(input, input.generationMode === "ai" ? "ai-resolved" : "demo-resolved");
  const validation = validateResolvedProductionConcept(concept, input);
  if (!validation.valid) throw new Error("We could not resolve this production into a concrete, physically executable story. Your selections have been preserved.");
  return concept;
}
export function validateCharacterParticipation(concept: ResolvedProductionConcept, selected: CharacterProfile[]): ProductionConceptValidationIssue[] {
  return selected.filter((profile) => !concept.characters.some((character) => character.characterId === profile.id && clean(character.mainAction) && clean(character.endingState))).map((profile) => ({ id: `character-${profile.id}`, severity: "critical", field: "characters", message: `${profile.shortName} needs a visible function and action.`, repairable: true }));
}
export function validateObjectTrajectory(value: ResolvedObjectTrajectory): ProductionConceptValidationIssue[] {
  return [["objectName", value.objectName], ["initialPosition", value.initialPosition], ["forceOrTrigger", value.forceOrTrigger], ["movementPath", value.movementPath], ["finalPosition", value.finalPosition]].filter(([, value]) => !clean(value)).map(([field]) => ({ id: `object-${field}`, severity: "critical", field: `primaryObject.${field}`, message: `Object trajectory requires ${field}.`, repairable: true } as ProductionConceptValidationIssue));
}
export function validateCausalStory(concept: ResolvedProductionConcept): ProductionConceptValidationIssue[] {
  const fields = [["initiatingCause", concept.initiatingCause], ["actionProgression", concept.actionProgression.join(" ")], ["escalation", concept.escalation], ["payoff", concept.payoff]];
  return fields.filter(([, value]) => !clean(value) || detectUnresolvedPromptLanguage(String(value)).length).map(([field]) => ({ id: `causal-${field}`, severity: "critical", field, message: `Causal story requires concrete ${field}.`, repairable: true } as ProductionConceptValidationIssue));
}
export function validateResolvedProductionConcept(concept: ResolvedProductionConcept, input: ProductionConceptResolutionInput): ProductionConceptValidationResult {
  const issues = [...validateCharacterParticipation(concept, input.selectedCharacters), ...validateObjectTrajectory(concept.primaryObject), ...validateCausalStory(concept)];
  const serialized = JSON.stringify(concept);
  if (detectUnresolvedPromptLanguage(serialized).length) issues.push({ id: "unresolved-language", severity: "critical", field: "oneSentenceStory", message: "Resolved concept contains placeholder language.", repairable: true });
  if (!clean(concept.location.name) || !clean(concept.location.visualDescription)) issues.push({ id: "location", severity: "critical", field: "location", message: "A concrete location is required.", repairable: true });
  if (!clean(concept.finalComposition)) issues.push({ id: "final-composition", severity: "critical", field: "finalComposition", message: "An exact final composition is required.", repairable: true });
  const limits: Record<number, number> = { 5: 3, 10: 5, 15: 6, 20: 7, 30: 10, 45: 14, 60: 18 };
  const max = limits[input.durationSeconds] || Math.max(3, Math.ceil(input.durationSeconds / 3));
  if (concept.actionProgression.length > max) issues.push({ id: "duration", severity: "major", field: "actionProgression", message: "The action progression cannot fit the selected duration.", repairable: true });
  return { valid: issues.length === 0, issues };
}
export function generateWorkingTitleFromResolvedConcept(concept: ResolvedProductionConcept): string { return `${concept.characters.find((character) => character.role === "Hero")?.characterName || "Hero"} and the ${concept.primaryObject.objectName.replace(/^oversized /, "")} Reversal`; }
export function buildTimelineFromResolvedConcept(concept: ResolvedProductionConcept): ProductionTimeline {
  const count = concept.actionProgression.length; const duration = concept.durationSeconds;
  return { mode: "automatic", durationSeconds: duration, beats: concept.actionProgression.map((visualAction, index) => ({ id: `resolved-${index + 1}`, startSeconds: Math.round(index * duration / count), endSeconds: index === count - 1 ? duration : Math.round((index + 1) * duration / count), label: index === 0 ? "Cause" : index === count - 1 ? "Payoff" : `Action ${index + 1}`, visualAction })) };
}
export function conceptInputFromForm(form: ProductionForm, selectedCharacters: CharacterProfile[], generationMode: "demo" | "ai"): ProductionConceptResolutionInput {
  return { optionalTitle: form.videoTitle, userIdea: form.additionalDirection, selectedCharacters, location: form.location || form.locationName, importantObject: form.importantObject || form.objectName, mainAction: form.trapAction || form.actionName, trapOrConflict: form.trapAction, ending: form.endingPayoff || form.payoffName, videoType: form.videoStyleId || form.visualStyle, visualStyle: form.visualStyle, pacing: form.creativeDirection.pacingStyle, durationSeconds: Number(form.duration) || 15, videoRatio: form.videoRatio, videoModel: form.videoModel, generationMode };
}
