import type { CharacterProfile, CharacterSpatialState, LocationVocabulary, ObjectMotionSegment, ObjectSpatialState, ResolvedObjectPath, ResolvedProductionConcept, ResolvedSpatialActionPlan, SceneZone, SceneZoneId, SpatialAction, SpatialBeatState } from "./production-types";
import type { ProductionConceptValidationIssue } from "./production-concept";
import { choosePhysicalContactMethod, inferObjectMotionProfile, renderPhysicalRedirection } from "./prompt-finalization";

const issue = (id: string, message: string, severity: "critical" | "major" = "major"): ProductionConceptValidationIssue => ({ id, severity, field: "resolvedSpatialActionPlan", message, repairable: true });
const cloneCharacters = (states: CharacterSpatialState[]) => states.map((state) => ({ ...state, nearbyCharacterIds: [...state.nearbyCharacterIds], nearbyObjectIds: [...state.nearbyObjectIds] }));
const cloneObjects = (states: ObjectSpatialState[]) => states.map((state) => ({ ...state }));

export function buildSceneZones(location: ResolvedProductionConcept["location"]): SceneZone[] {
  const place = location.name.toLowerCase();
  const sloped = /slope|hill|incline|ramp|upper|lower/.test(`${place} ${location.visualDescription}`);
  const surface = /boardwalk|seaside|pier/.test(`${place} ${location.visualDescription}`) ? "boardwalk path" : /forest|woodland/.test(place) ? "forest path" : /cave/.test(place) ? "cave passage" : /courtyard/.test(place) ? "courtyard path" : "scene path";
  const ids = sloped ? ["slope-top", "slope-middle", "slope-lower", "side-edge", "payoff-zone"] : ["route-start", "route-middle", "route-end", "side-edge", "payoff-zone"];
  const positions: SceneZone["relativePosition"][] = ["upper", "center", "lower", "right", "near"];
  return ids.map((id, index) => ({ id, label: id.split("-").map((part) => part[0].toUpperCase() + part.slice(1)).join(" "), description: `${positions[index]} area of the ${surface} in ${location.name}`, relativePosition: positions[index], connectedZoneIds: index === 0 ? [ids[1], ids[4]] : index === 1 ? [ids[0], ids[2], ids[3]] : index === 2 ? [ids[1], ids[3]] : index === 3 ? [ids[1], ids[2], ids[4]] : [ids[0], ids[3]] }));
}

export function buildLocationVocabulary(location: ResolvedProductionConcept["location"]): LocationVocabulary {
  const text = `${location.name} ${location.visualDescription} ${location.fixedEnvironmentFacts.join(" ")}`.toLowerCase();
  const candidates = text.match(/[a-z]+(?:\s+[a-z]+)?/g) || [];
  const base = [location.name.toLowerCase(), ...candidates, "path", "upper path", "lower path", "side edge", "daylight"];
  if (/boardwalk|seaside|pier/.test(text)) base.push("boardwalk", "stone path", "sloped path", "boardwalk edge", "seaside", "railing", "warm daylight");
  const inherited = ["clearing", "forest floor", "meadow", "jungle path", "woodland", "cave", "courtyard"];
  return { primaryLocationName: location.name, allowedTerms: [...new Set(base)], disallowedInheritedTerms: inherited.filter((term) => !text.includes(term)) };
}

export function validateLocationVocabulary(text: string, vocabulary: LocationVocabulary): ProductionConceptValidationIssue[] {
  return vocabulary.disallowedInheritedTerms.filter((term) => new RegExp(`\\b${term.replace(/ /g, "\\s+")}\\b`, "i").test(text)).map((term) => issue("location-vocabulary-contamination", `Location vocabulary conflict: '${term}' does not belong to the selected ${vocabulary.primaryLocationName} scene.`));
}

export function canCharacterReachTarget(character: CharacterSpatialState, targetZoneId: SceneZoneId, zones: SceneZone[]): boolean {
  if (character.zoneId === targetZoneId) return true;
  return Boolean(zones.find((zone) => zone.id === character.zoneId)?.connectedZoneIds.includes(targetZoneId));
}

export type SelectActionOwnerInput = { actionPurpose: "trap-launch" | "avoidance" | "solution" | "redirection" | "blocking" | "interference" | "payoff"; characterStates: CharacterSpatialState[]; characterRoles: Record<string, string>; objectState: ObjectSpatialState };
export function selectActionOwner({ actionPurpose, characterStates, characterRoles, objectState }: SelectActionOwnerInput): CharacterSpatialState {
  const preferredRole = ["trap-launch", "blocking", "interference"].includes(actionPurpose) ? "Enemy" : ["avoidance", "solution", "redirection"].includes(actionPurpose) ? "Hero" : "Enemy";
  return characterStates.find((state) => characterRoles[state.characterId] === preferredRole && (actionPurpose !== "trap-launch" || state.zoneId === objectState.zoneId)) || characterStates.find((state) => state.zoneId === objectState.zoneId) || characterStates[0];
}

export function validateActionOwnership({ action, beforeState, concept }: { action: SpatialAction; beforeState: SpatialBeatState; concept: ResolvedProductionConcept }): ProductionConceptValidationIssue[] {
  const actor = beforeState.characterStatesBefore.find((state) => state.characterId === action.actorId);
  const targetObject = action.targetObjectId ? beforeState.objectStatesBefore.find((state) => state.objectId === action.targetObjectId) : undefined;
  const character = concept.characters.find((entry) => entry.characterId === action.actorId);
  const issues: ProductionConceptValidationIssue[] = [];
  if (!actor || actor.zoneId !== action.sourceZoneId) issues.push(issue("wrong-action-owner", `Action ownership conflict: ${action.actorName} is not present in ${action.sourceZoneId}.`, "critical"));
  if (actor && targetObject && actor.zoneId !== targetObject.zoneId) issues.push(issue("actor-cannot-reach-object", `Action ownership conflict: ${action.actorName} cannot act on ${targetObject.objectName} from ${actor.zoneId} while it is in ${targetObject.zoneId}.`, "critical"));
  if (action.targetCharacterId && !beforeState.characterStatesBefore.some((state) => state.characterId === action.targetCharacterId)) issues.push(issue("missing-action-target", `The target of ${action.actorName}'s action does not exist.`, "critical"));
  const targetCharacter = action.targetCharacterId ? beforeState.characterStatesBefore.find((state) => state.characterId === action.targetCharacterId) : undefined;
  if (actor && targetCharacter && action.actionType !== "collide" && actor.zoneId !== targetCharacter.zoneId && action.targetZoneId !== targetCharacter.zoneId) issues.push(issue("actor-cannot-reach-target", `${action.actorName} cannot affect ${targetCharacter.characterName} without approaching their scene zone.`, "critical"));
  const initiator = concept.characters.find((entry) => entry.function === "initiator");
  if (action.actionType === "push" && action.targetObjectId && initiator && initiator.characterId !== action.actorId) issues.push(issue("wrong-action-owner", `Action ownership conflict: ${action.actorName} is assigned as the trap-launch owner, but ${initiator.characterName} owns the initiating cause.`, "critical"));
  if (character?.role === "Hero" && action.actionType === "push" && /trap|launch/i.test(action.forceDescription || "")) issues.push(issue("wrong-action-owner", `${action.actorName} cannot initiate the enemy trap unless explicitly requested.`, "critical"));
  return issues;
}

export function describeObjectDirection({ fromZone, toZone, priorSegment, characterStates }: { fromZone: SceneZone; toZone: SceneZone; priorSegment?: ObjectMotionSegment; characterStates: CharacterSpatialState[] }): string {
  const namesAtTarget = characterStates.filter((state) => state.zoneId === toZone.id).map((state) => state.characterName);
  const destination = namesAtTarget.length ? ` toward ${namesAtTarget.join(" and ")}` : "";
  if (fromZone.relativePosition === "upper" && toZone.relativePosition === "lower") return `downhill${destination}`;
  if (fromZone.relativePosition === "lower" && toZone.relativePosition === "upper") return `${priorSegment ? "back " : ""}uphill${destination}`;
  if (toZone.id === "side-edge") return `diagonally toward the outer ${toZone.description.includes("boardwalk") ? "boardwalk " : ""}edge`;
  return `from ${fromZone.label.toLowerCase()} to ${toZone.label.toLowerCase()}${destination}`;
}

export function validateObjectDirectionContinuity(path: ResolvedObjectPath): ProductionConceptValidationIssue[] {
  const issues: ProductionConceptValidationIssue[] = [];
  path.segments.forEach((segment, index) => {
    if (segment.direction.fromZoneId !== segment.fromZoneId || segment.direction.toZoneId !== segment.toZoneId) issues.push(issue("contradictory-object-direction", `Direction conflict: segment ${index + 1} direction does not match its zone transition.`, "critical"));
    if (/top|upper/.test(segment.toZoneId) && /downhill|toward the lower/i.test(segment.direction.directionLabel)) issues.push(issue("contradictory-object-direction", `Direction conflict: the object moves toward ${segment.toZoneId}, but the wording preserves a downhill destination.`, "critical"));
    if (/lower|bottom/.test(segment.toZoneId) && /uphill|toward the upper/i.test(segment.direction.directionLabel)) issues.push(issue("contradictory-object-direction", `Direction conflict: the object moves toward ${segment.toZoneId}, but the wording preserves an uphill destination.`, "critical"));
    if (index && path.segments[index - 1].toZoneId !== segment.fromZoneId) issues.push(issue("object-path-disconnect", `Object path segment ${index + 1} does not begin where the previous segment ends.`, "critical"));
    if (segment.movementType === "redirect" && index && segment.toZoneId === path.segments[index - 1].fromZoneId && !/back|return|reverse|uphill/i.test(segment.direction.directionLabel)) issues.push(issue("contradictory-object-direction", `The redirection changes zones but preserves stale direction wording.`, "critical"));
  });
  if (path.segments.length && path.finalZoneId !== path.segments[path.segments.length - 1].toZoneId) issues.push(issue("unreachable-final-object", `Final-position conflict: ${path.objectName}'s final zone does not follow from its last visible movement segment.`, "critical"));
  return issues;
}

export function validatePhysicalRedirection(action: SpatialAction, objectPath: ResolvedObjectPath): ProductionConceptValidationIssue[] {
  const segment = objectPath.segments.find((entry) => entry.triggerActorId === action.actorId && entry.movementType === "redirect");
  if (!segment || !action.targetObjectId || !action.bodyPartOrContactPoint || !action.resultingDirection || !action.targetZoneId || !segment.contactDescription || segment.fromZoneId === segment.toZoneId) return [issue("incomplete-physical-redirection", `Redirection must show contact, contact point, momentum change, new zone, new direction, and continued motion.`, "critical")];
  return [];
}

export function validateCollision({ actorA, actorB, beat }: { actorA: CharacterSpatialState; actorB: CharacterSpatialState; beat: SpatialBeatState }): ProductionConceptValidationIssue[] {
  const afterA = beat.characterStatesAfter.find((state) => state.characterId === actorA.characterId);
  const afterB = beat.characterStatesAfter.find((state) => state.characterId === actorB.characterId);
  const collision = beat.actions.some((action) => action.actionType === "collide" && [action.actorId, action.targetCharacterId].includes(actorA.characterId) && [action.actorId, action.targetCharacterId].includes(actorB.characterId));
  return collision && (!afterA || !afterB || afterA.zoneId !== afterB.zoneId) ? [issue("impossible-collision", `Collision conflict: ${actorA.characterName} and ${actorB.characterName} do not enter the same scene zone before their collision.`, "critical")] : [];
}

export function validateCharacterPathContinuity(beats: SpatialBeatState[]): ProductionConceptValidationIssue[] {
  const issues: ProductionConceptValidationIssue[] = [];
  beats.forEach((beat, beatIndex) => beat.characterStatesAfter.forEach((after) => {
    const before = beat.characterStatesBefore.find((state) => state.characterId === after.characterId);
    const hasMovement = beat.actions.some((action) => action.actorId === after.characterId && ["step", "sidestep", "jump", "dodge", "fall", "settle", "block"].includes(action.actionType));
    if (before && before.zoneId !== after.zoneId && !hasMovement) issues.push(issue("character-teleportation", `${after.characterName} changes zones in beat ${beatIndex + 1} without visible movement.`, "critical"));
  }));
  for (let index = 1; index < beats.length; index += 1) {
    beats[index].characterStatesBefore.forEach((state) => { const prior = beats[index - 1].characterStatesAfter.find((entry) => entry.characterId === state.characterId); if (prior && prior.zoneId !== state.zoneId) issues.push(issue("character-path-disconnect", `${state.characterName}'s before-state does not continue from the previous beat.`, "critical")); });
  }
  return issues;
}

export function validateMeaningfulParticipation(plan: ResolvedSpatialActionPlan, characters: CharacterProfile[]): ProductionConceptValidationIssue[] {
  const meaningful = new Set(["push", "pull", "block", "dodge", "collide", "catch", "stop", "tap", "kick"]);
  return characters.filter((character) => !plan.beats.some((beat) => beat.actions.some((action) => action.actorId === character.id && (meaningful.has(action.actionType) || Boolean(action.targetCharacterId || action.targetObjectId))))).map((character) => issue("missing-character-participation", `${character.shortName} appears in the production but does not causally affect the action.`));
}

export function validateFinalStateReachability({ plan, concept }: { plan: ResolvedSpatialActionPlan; concept: ResolvedProductionConcept }): ProductionConceptValidationIssue[] {
  const issues: ProductionConceptValidationIssue[] = [];
  const last = plan.beats[plan.beats.length - 1];
  plan.finalCharacterStates.forEach((state) => { const reached = last?.characterStatesAfter.find((entry) => entry.characterId === state.characterId); if (!reached || reached.zoneId !== state.zoneId) issues.push(issue("unreachable-final-state", `Final-position conflict: ${state.characterName} does not visibly reach ${state.zoneId}.`, "critical")); });
  plan.finalObjectStates.forEach((state) => { if (state.zoneId !== plan.objectPath.finalZoneId) issues.push(issue("unreachable-final-state", `Final-position conflict: ${state.objectName} ends in ${state.zoneId} without a visible segment from ${plan.objectPath.finalZoneId}.`, "critical")); });
  if (!concept.payoff || !concept.finalComposition) issues.push(issue("unreachable-final-state", "The payoff and final composition must describe the reachable final state."));
  return issues;
}

export function validateSpatialActionPlan(plan: ResolvedSpatialActionPlan, concept: ResolvedProductionConcept, characters: CharacterProfile[]): ProductionConceptValidationIssue[] {
  return [...plan.beats.flatMap((beat) => beat.actions.flatMap((action) => validateActionOwnership({ action, beforeState: beat, concept }))), ...validateObjectDirectionContinuity(plan.objectPath), ...validateCharacterPathContinuity(plan.beats), ...plan.beats.flatMap((beat) => { const collision = beat.actions.find((action) => action.actionType === "collide" && action.targetCharacterId); if (!collision) return []; const a = beat.characterStatesBefore.find((state) => state.characterId === collision.actorId); const b = beat.characterStatesBefore.find((state) => state.characterId === collision.targetCharacterId); return a && b ? validateCollision({ actorA: a, actorB: b, beat }) : []; }), ...validateMeaningfulParticipation(plan, characters), ...validateFinalStateReachability({ plan, concept })];
}

export type PromptQualityCheckResult = { passed: boolean; issues: ProductionConceptValidationIssue[]; message: string };
const checkResult = (issues: ProductionConceptValidationIssue[], success: string): PromptQualityCheckResult => ({ passed: issues.length === 0, issues, message: issues[0]?.message || success });
export function analyzeSpatialConsistency(plan: ResolvedSpatialActionPlan): PromptQualityCheckResult { return checkResult([...validateObjectDirectionContinuity(plan.objectPath), ...validateCharacterPathContinuity(plan.beats)], "Initial placement, zone transitions, collisions, and final positions are spatially consistent."); }
export function analyzeActionOwnership(plan: ResolvedSpatialActionPlan, concept: ResolvedProductionConcept): PromptQualityCheckResult { return checkResult(plan.beats.flatMap((beat) => beat.actions.flatMap((action) => validateActionOwnership({ action, beforeState: beat, concept }))), "Every action owner has physical access and matches the causal role."); }
export function analyzeDirectionContinuity(path: ResolvedObjectPath, plan: ResolvedSpatialActionPlan): PromptQualityCheckResult { void plan; return checkResult(validateObjectDirectionContinuity(path), "Every object segment uses direction wording derived from its zone transition."); }
export function analyzeFinalStateReachability(plan: ResolvedSpatialActionPlan, concept?: ResolvedProductionConcept): PromptQualityCheckResult { const issues = concept ? validateFinalStateReachability({ plan, concept }) : plan.finalObjectStates[0]?.zoneId === plan.objectPath.finalZoneId ? [] : [issue("unreachable-final-state", "The final object zone is not reached by the last motion segment.", "critical")]; return checkResult(issues, "Every final position is reachable from the preceding beat."); }
export function analyzeEnvironmentVocabulary(sections: Record<string, string | undefined>, vocabulary: LocationVocabulary): PromptQualityCheckResult { return checkResult(validateLocationVocabulary(Object.values(sections).filter(Boolean).join("\n"), vocabulary), "Every model-facing section preserves the selected environment vocabulary."); }

export function buildResolvedSpatialActionPlan(concept: ResolvedProductionConcept, characters: CharacterProfile[]): ResolvedSpatialActionPlan {
  const zones = buildSceneZones(concept.location); const top = zones[0]; const lower = zones[2]; const side = zones[3]; const payoff = zones[4];
  const hero = characters.find((character) => character.role === "Hero") || characters[0]; const enemies = characters.filter((character) => character.role === "Enemy"); const initiator = enemies.find((character) => concept.characters.find((entry) => entry.characterId === character.id)?.function === "initiator") || enemies[0] || characters.find((character) => character.id !== hero.id) || hero; const assistant = enemies.find((character) => character.id !== initiator.id) || characters.find((character) => character.id !== initiator.id && character.id !== hero.id);
  const makeCharacter = (character: CharacterProfile, zoneId: string, posture: string): CharacterSpatialState => ({ characterId: character.id, characterName: character.shortName, zoneId, posture, facing: zoneId === top.id ? "down the route" : "up the route", movementState: "stationary", nearbyCharacterIds: [], nearbyObjectIds: zoneId === top.id ? ["primary-object"] : [] });
  const initialCharacters = [makeCharacter(initiator, top.id, "standing beside the object"), makeCharacter(hero, lower.id, "waiting downhill")]; if (assistant) initialCharacters.push(makeCharacter(assistant, side.id, "waiting beside the escape route")); characters.filter((character) => !initialCharacters.some((state) => state.characterId === character.id)).forEach((character) => initialCharacters.push(makeCharacter(character, lower.id, "watching the route")));
  const initialObject: ObjectSpatialState = { objectId: "primary-object", objectName: concept.primaryObject.objectName, zoneId: top.id, supportSurface: top.description, movementState: "stationary", speed: "slow" };
  const points = [0, Math.round(concept.durationSeconds * .27), Math.round(concept.durationSeconds * .53), Math.round(concept.durationSeconds * .73), concept.durationSeconds];
  const roles = Object.fromEntries(characters.map((character) => [character.id, character.role])); const trapOwner = selectActionOwner({ actionPurpose: "trap-launch", characterStates: initialCharacters, characterRoles: roles, objectState: initialObject });
  const objectDescriptor = { id: "primary-object", name: concept.primaryObject.objectName, aliases: [concept.primaryObject.objectName], attributes: [concept.primaryObject.visualIdentity] };
  const motionProfile = inferObjectMotionProfile(objectDescriptor);
  const initialMovement = motionProfile.supportedMovementTypes.includes("roll") ? "roll" as const : "slide" as const;
  const contactMethod = choosePhysicalContactMethod({ character: hero, object: objectDescriptor, movementType: "redirect", pacing: "concise", modelCapabilities: [] });
  const direction1 = describeObjectDirection({ fromZone: top, toZone: lower, characterStates: initialCharacters });
  const returnTargets = initialCharacters.map((state) => state.characterId === initiator.id || state.characterId === assistant?.id ? { ...state, zoneId: top.id } : state);
  const direction2 = describeObjectDirection({ fromZone: lower, toZone: top, priorSegment: {} as ObjectMotionSegment, characterStates: returnTargets });
  const objectPath: ResolvedObjectPath = { objectId: "primary-object", objectName: initialObject.objectName, finalZoneId: top.id, segments: [
    { startSeconds: points[0], endSeconds: points[1], fromZoneId: top.id, toZoneId: lower.id, triggerActorId: trapOwner.characterId, triggerAction: "forceful two-hand push", movementType: initialMovement, direction: { fromZoneId: top.id, toZoneId: lower.id, directionLabel: direction1 }, speedBefore: "stationary", speedAfter: "fast", physicalReason: `${trapOwner.characterName}'s visible push and gravity start the motion; ${motionProfile.preferredMotionDescription}` },
    { startSeconds: points[1], endSeconds: points[2], fromZoneId: lower.id, toZoneId: top.id, triggerActorId: hero.id, triggerAction: "sidestep and side contact", movementType: "redirect", direction: { fromZoneId: lower.id, toZoneId: top.id, directionLabel: direction2 }, speedBefore: "fast", speedAfter: "medium", contactDescription: `${hero.shortName} taps the object's lower side with a planted foot or tail, absorbs momentum, and turns it onto the return curve`, physicalReason: "visible side contact converts downhill momentum into an uphill return" },
    { startSeconds: points[2], endSeconds: points[4], fromZoneId: top.id, toZoneId: top.id, triggerActorId: initiator.id, triggerAction: "dodge during return", movementType: "stop", direction: { fromZoneId: top.id, toZoneId: top.id, directionLabel: "past the converging enemies and to a stop near the upper path" }, speedBefore: "medium", speedAfter: "stationary", physicalReason: "ground friction slows the object after it passes the backfire" },
  ] };
  let beforeChars = cloneCharacters(initialCharacters); let beforeObjects = [cloneObjects([initialObject])[0]]; const beats: SpatialBeatState[] = [];
  const addBeat = (startSeconds: number, endSeconds: number, actions: SpatialAction[], mutate: (chars: CharacterSpatialState[], objects: ObjectSpatialState[]) => void) => { const afterChars = cloneCharacters(beforeChars); const afterObjects = cloneObjects(beforeObjects); mutate(afterChars, afterObjects); beats.push({ startSeconds, endSeconds, characterStatesBefore: cloneCharacters(beforeChars), objectStatesBefore: cloneObjects(beforeObjects), actions, characterStatesAfter: afterChars, objectStatesAfter: afterObjects }); beforeChars = cloneCharacters(afterChars); beforeObjects = cloneObjects(afterObjects); };
  addBeat(points[0], points[1], [{ actorId: initiator.id, actorName: initiator.shortName, actionType: "push", sourceZoneId: top.id, targetZoneId: lower.id, targetObjectId: "primary-object", bodyPartOrContactPoint: "both hands or paws", forceDescription: "one forceful trap-launch push", resultingDirection: direction1, resultingState: "rolling fast" }], (_chars, objects) => Object.assign(objects[0], { zoneId: lower.id, movementState: "rolling", direction: direction1, speed: "fast" }));
  const interference: SpatialAction[] = assistant ? [{ actorId: assistant.id, actorName: assistant.shortName, actionType: "block", sourceZoneId: side.id, targetZoneId: lower.id, targetCharacterId: hero.id, forceDescription: "steps into the escape lane", resultingState: "narrows the hero's route" }] : [];
  addBeat(points[1], points[2], [...interference, { actorId: hero.id, actorName: hero.shortName, actionType: "sidestep", sourceZoneId: lower.id, targetZoneId: lower.id, forceDescription: "moves clear at the final moment" }, { actorId: hero.id, actorName: hero.shortName, actionType: "tap", sourceZoneId: lower.id, targetZoneId: top.id, targetObjectId: "primary-object", bodyPartOrContactPoint: contactMethod, forceDescription: "absorbs part of the momentum and pivots the object onto the curved return edge", resultingDirection: direction2, resultingState: "moving uphill" }], (chars, objects) => { if (assistant) Object.assign(chars.find((state) => state.characterId === assistant.id)!, { zoneId: lower.id, movementState: "moving" }); Object.assign(objects[0], { zoneId: top.id, movementState: "redirecting", direction: direction2, speed: "medium" }); });
  const collisionActions: SpatialAction[] = assistant ? [{ actorId: initiator.id, actorName: initiator.shortName, actionType: "dodge", sourceZoneId: top.id, targetZoneId: payoff.id, forceDescription: "jumps sideways from the returning object" }, { actorId: assistant.id, actorName: assistant.shortName, actionType: "step", sourceZoneId: lower.id, targetZoneId: payoff.id, forceDescription: "moves uphill to intercept the returning object" }, { actorId: initiator.id, actorName: initiator.shortName, actionType: "collide", sourceZoneId: top.id, targetZoneId: payoff.id, targetCharacterId: assistant.id, forceDescription: "their converging paths meet in one soft collision" }] : [];
  addBeat(points[2], points[3], collisionActions, (chars) => { [initiator.id, assistant?.id].filter(Boolean).forEach((id) => Object.assign(chars.find((state) => state.characterId === id)!, { zoneId: payoff.id, movementState: "falling", posture: "losing balance" })); });
  addBeat(points[3], points[4], [{ actorId: initiator.id, actorName: initiator.shortName, actionType: "settle", sourceZoneId: payoff.id, targetZoneId: payoff.id, forceDescription: "settles unharmed after the backfire" }, ...(assistant ? [{ actorId: assistant.id, actorName: assistant.shortName, actionType: "settle" as const, sourceZoneId: payoff.id, targetZoneId: payoff.id, forceDescription: "settles visibly beside the first opponent" }] : []), { actorId: hero.id, actorName: hero.shortName, actionType: "react", sourceZoneId: lower.id, targetZoneId: lower.id, forceDescription: "remains safe downhill and smiles" }], (chars, objects) => { [initiator.id, assistant?.id].filter(Boolean).forEach((id) => Object.assign(chars.find((state) => state.characterId === id)!, { zoneId: payoff.id, movementState: "settling", posture: "seated in a defeated pose" })); Object.assign(objects[0], { zoneId: top.id, movementState: "settling", direction: undefined, speed: "slow" }); });
  return { environmentName: concept.location.name, zones, initialCharacterStates: cloneCharacters(initialCharacters), initialObjectStates: [initialObject], beats, finalCharacterStates: cloneCharacters(beforeChars), finalObjectStates: cloneObjects(beforeObjects), objectPath, characterPaths: beats.flatMap((beat) => beat.actions.filter((action) => action.targetZoneId && action.sourceZoneId !== action.targetZoneId && action.targetObjectId == null).map((action) => ({ characterId: action.actorId, startSeconds: beat.startSeconds, endSeconds: beat.endSeconds, fromZoneId: action.sourceZoneId, toZoneId: action.targetZoneId!, movementType: action.actionType === "dodge" ? "sidestep" as const : action.actionType === "step" ? "step" as const : action.actionType === "settle" ? "settle" as const : "walk" as const, physicalReason: action.forceDescription || action.actionType }))), locationVocabulary: buildLocationVocabulary(concept.location) };
}

export type RenderBeatContext = { plan: ResolvedSpatialActionPlan; concept: ResolvedProductionConcept };
export function renderModelFacingBeat(beat: SpatialBeatState, context: RenderBeatContext): string {
  const object = context.plan.objectPath.objectName; const actionText = beat.actions.map((action) => {
    if (action.actionType === "push") { const profile = inferObjectMotionProfile({ id: "primary-object", name: object, aliases: [object], attributes: [context.concept.primaryObject.visualIdentity] }); return `${action.actorName} gives the ${object} one forceful two-paw push. The ${object} ${profile.preferredMotionDescription}, moving ${action.resultingDirection}.`; }
    if (action.actionType === "block") return `${action.actorName} steps toward the lower route to block the hero's escape.`;
    if (action.actionType === "sidestep") return `${action.actorName} sidesteps at the final moment.`;
    if (action.actionType === "tap") return renderPhysicalRedirection({ actorName: action.actorName, bodyPart: (action.bodyPartOrContactPoint || "foot") as "foot" | "tail" | "hand" | "paw" | "shoulder", objectName: object, contactPoint: "lower side", preparation: "sidesteps and braces", contactAction: "tap", momentumResponse: "absorbs part of its momentum", newDirection: action.resultingDirection || "back along the route", resultingPath: "the curved return edge" });
    if (action.actionType === "dodge") return `${action.actorName} jumps sideways to avoid the returning ${object}.`;
    if (action.actionType === "step") return `${action.actorName} moves into the same payoff area to intercept it.`;
    if (action.actionType === "collide") { const target = beat.characterStatesAfter.find((state) => state.characterId === action.targetCharacterId)?.characterName || "the other character"; return `${action.actorName} collides softly with ${target} where their paths converge.`; }
    if (action.actionType === "settle") return `${action.actorName} settles unharmed in one clear defeated pose near the upper route.`;
    if (action.actionType === "react") return `${action.actorName} remains safely downhill, turns toward the camera, and smiles as all motion settles.`;
    return `${action.actorName} ${action.forceDescription || action.actionType}.`;
  }).join(" ");
  if (beat === context.plan.beats[context.plan.beats.length - 1]) {
    const finalCharacters = context.plan.finalCharacterStates.map((state) => `${state.characterName} ${state.posture} in the ${context.plan.zones.find((zone) => zone.id === state.zoneId)?.label.toLowerCase() || state.zoneId}`).join("; ");
    const finalObject = context.plan.finalObjectStates[0];
    return `${finalCharacters}. The ${object} continues past the collision, slows through surface friction, wobbles once, and stops upright in the ${context.plan.zones.find((zone) => zone.id === finalObject.zoneId)?.label.toLowerCase() || finalObject.zoneId} with its defining mark visible. Every character and the ${object} remains visible, supported, and completely settled.`;
  }
  const camera = beat === context.plan.beats[0] ? "In one continuous medium-wide shot, " : "";
  return `${camera}${actionText}`.replace(/\b(?:authorized path|authorized ground|other opposing character|remaining path obstruction|unchanged cast|begin the next beat from|exact authorized entity|source zone|target zone|validation state|ownership lock)\b/gi, "").replace(/\s+/g, " ").trim();
}

export function renderSpatialVideoPrompt(plan: ResolvedSpatialActionPlan, concept: ResolvedProductionConcept): string {
  const labels = ["Hook and trap launch", "Dodge and interference", "Backfire", "Payoff"];
  return plan.beats.map((beat, index) => `0:${String(beat.startSeconds).padStart(2, "0")}–0:${String(beat.endSeconds).padStart(2, "0")} — ${labels[index] || `Beat ${index + 1}`}\n${renderModelFacingBeat(beat, { plan, concept })}`).join("\n\n");
}

export function deriveSpatialPlanFromLegacyProduction(production: { resolvedProductionConcept?: ResolvedProductionConcept; characterProfiles?: CharacterProfile[] }): ResolvedSpatialActionPlan | null {
  if (!production.resolvedProductionConcept || !production.characterProfiles?.length) return null;
  try { return buildResolvedSpatialActionPlan(production.resolvedProductionConcept, production.characterProfiles); } catch { return null; }
}

export function removeInternalValidationLanguage(text: string): string { return text.replace(/\b(?:authorized path|authorized ground|other opposing character|remaining path obstruction|unchanged cast|begin the next beat from|exact authorized entity|source zone|target zone|validation state|ownership lock)\b/gi, "").replace(/\s+/g, " ").trim(); }
export function analyzeInternalValidationLanguage(text: string): ProductionConceptValidationIssue[] { const match = text.match(/authorized path|authorized ground|other opposing character|remaining path obstruction|unchanged cast|begin the next beat from|exact authorized entity|source zone|target zone|validation state|ownership lock/i); return match ? [issue("internal-validation-language", `Model-facing clarity conflict: '${match[0]}' is internal validation language.`)] : []; }
