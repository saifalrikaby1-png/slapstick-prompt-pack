import type { CharacterProfile, ProductionForm, ProductionPack, ResolvedProductionConcept } from "./production-types";

export type PromptPackageSectionId = "start-frame" | "end-frame" | "video-lock" | "video-prompt" | "music" | "sound-effects" | "video-rules" | "timeline";
export type PromptPackageSections = Partial<Record<PromptPackageSectionId, string>>;
export type InventoryEntityKind = "character" | "authorized-movable-object" | "unauthorized-movable-object" | "filmmaking-term" | "environment-term" | "scene-zone" | "object-attribute" | "visual-effect" | "unknown";
export type ClassifiedPromptEntity = { text: string; normalizedText: string; kind: InventoryEntityKind; sectionId: PromptPackageSectionId; evidence: string };
export type InventoryCandidate = { rawText: string; normalizedText: string; kind: InventoryEntityKind; sectionId: PromptPackageSectionId; evidence: string; startIndex: number; endIndex: number };
export type ProtectedInventorySpan = { startIndex: number; endIndex: number; kind: InventoryEntityKind; phrase: string };
export type AuthorizedObjectDescriptor = { id: string; name: string; aliases: string[]; attributes: string[] };
export type AuthorizedEnvironmentDescriptor = { locationName: string; surfaces: string[]; zones: string[]; allowedVocabulary: string[] };
export type AuthorizedProductionInventory = { characterIds: string[]; characterNames: string[]; objects: AuthorizedObjectDescriptor[]; environment: AuthorizedEnvironmentDescriptor; location: { name: string; description: string } };
export type UnauthorizedObjectFinding = { objectName: string; sections: PromptPackageSectionId[]; evidence: string[] };
export type CharacterParticipationResult = { characterId: string; characterName: string; appearsInOpening: boolean; hasMeaningfulAction: boolean; causesOrAffectsEvent: boolean; reactsToEvent: boolean; appearsInPayoff: boolean; participationScore: number };
export type ObjectTrajectorySegment = { startTime: number; endTime: number; initialPosition: string; forceOrTrigger: string; direction: string; movementType: "roll" | "slide" | "fall" | "launch" | "swing" | "bounce" | "carry" | "redirect" | "stop"; characterInteraction?: string; resultingPosition: string };
export type CompleteObjectTrajectory = { objectName: string; initialPosition: string; segments: ObjectTrajectorySegment[]; finalPosition: string };
export type ChoreographyIssue = { id: string; severity: "critical" | "major" | "minor"; message: string; repairable: boolean };
export type ExecutableVideoBeat = { startSeconds: number; endSeconds: number; label: string; actionOwnerIds: string[]; concreteAction: string; objectMovement?: string; physicalCause: string; visibleReaction: string; cameraDirection: string; continuityToNextBeat: string };
export type MusicDirectionBeat = { startSeconds: number; endSeconds: number; direction: string; intentionalOverlap?: boolean };
export type SoundEffectBeat = { startSeconds: number; endSeconds: number; direction: string };
export type CharacterVocalLock = { characterId: string; characterName: string; conciseVocalIdentity: string };

export function normalizeGeneratedTextEncoding(value: string): string {
  return value.replace(/Ã¢â‚¬â€/g, "—").replace(/Ã¢â‚¬â€œ/g, "–").replace(/Ã¢â‚¬Å“/g, "“").replace(/Ã¢â‚¬Â/g, "”").replace(/Ã¢â‚¬â„¢/g, "’").replace(/â€”/g, "—").replace(/â€“/g, "–").replace(/â€™/g, "’").normalize("NFC");
}
export function normalizeProductionPackEncoding(pack: ProductionPack): ProductionPack { return Object.fromEntries(Object.entries(pack).map(([key, value]) => [key, normalizeGeneratedTextEncoding(value)])) as ProductionPack; }

export function buildAuthorizedProductionInventory(concept: ResolvedProductionConcept, characters: CharacterProfile[]): AuthorizedProductionInventory {
  const objectWords = concept.primaryObject.objectName.toLowerCase().split(/\s+/);
  const attributes = [concept.primaryObject.visualIdentity.replace(new RegExp(`\\b${concept.primaryObject.objectName}\\b`, "i"), "").replace(/^one\s+/i, "").trim(), ...(concept.primaryObject.visualIdentity.match(/(?:leaf-shaped|printed|painted|striped|smooth|rounded|spiral|bright|dark|\w+-colored)\s+(?:mark|symbol|stripe|surface|shape|patch|pattern)/gi) || [])].filter(Boolean);
  return { characterIds: characters.map((character) => character.id), characterNames: characters.map((character) => character.shortName), objects: [{ id: "primary-object", name: concept.primaryObject.objectName, aliases: [...new Set([concept.primaryObject.objectName, objectWords.at(-1) || concept.primaryObject.objectName, concept.primaryObject.visualIdentity])], attributes: [...new Set(attributes)] }], environment: { locationName: concept.location.name, surfaces: ["path", "stone path", "route", "ground", "boardwalk", "forest floor", "slope", "edge"], zones: ["upper route", "lower route", "upper area", "lower area", "payoff area", "action area", "payoff zone", "slope top", "slope lower", "curved edge", "workshop entrance", "boardwalk center"], allowedVocabulary: [concept.location.name, concept.location.visualDescription, ...concept.location.fixedEnvironmentFacts] }, location: { name: concept.location.name, description: concept.location.visualDescription } };
}
export const PROTECTED_FILMMAKING_PHRASES = ["screen direction", "screen axis", "screen-left", "screen-right", "screen left", "screen right", "screen position", "screen space", "screen framing", "screen composition", "on-screen", "off-screen", "on screen", "off screen", "camera direction", "camera axis", "action axis", "frame direction"] as const;
export const PHYSICAL_SCREEN_PHRASES = ["hiding screen", "folding screen", "privacy screen", "projection screen", "wooden screen", "portable screen", "decorative screen", "room divider screen"] as const;
const KNOWN_PROPS = [...PHYSICAL_SCREEN_PHRASES, "screen", "sign", "cart", "barrier", "platform", "table", "chair", "tool", "vehicle", "box", "basket", "lantern", "seashell", "acorn", "berry", "mushroom"];
const LOCATION_SURFACES = ["ground", "sky", "sea", "boardwalk", "path", "slope", "stone path", "clearing", "floor", "wall"];
const normalized = (value: string) => value.toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
const SCENE_ZONE_TERMS = ["path", "stone path", "route", "upper route", "lower route", "upper area", "lower area", "payoff area", "action area", "ground", "boardwalk", "workshop", "forest floor", "clearing", "payoff zone", "slope", "edge"];
const ATTRIBUTE_TERMS = ["leaf-shaped mark", "printed mark", "painted symbol", "stripe", "texture", "pattern", "color patch"];
const EFFECT_TERMS = ["shadow", "light", "dust", "water splash"];
export function normalizeInventoryText(value: string): string { return value.toLowerCase().replace(/[â€œâ€"'`]/g, "").replace(/[^\p{L}\p{N}\s-]/gu, " ").replace(/\s+/g, " ").trim(); }
const phrasePattern = (phrase: string) => phrase.split(/\s+/).map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("[\\s-]+");
export function phraseExists(fullText: string, phrase: string): boolean { return new RegExp(`(?:^|\\b)${phrasePattern(normalizeInventoryText(phrase))}(?:\\b|$)`, "i").test(normalizeInventoryText(fullText)); }
export function classifyScreenUsage(fullText: string): InventoryEntityKind {
  if (PHYSICAL_SCREEN_PHRASES.some((phrase) => phraseExists(fullText, phrase))) return "unauthorized-movable-object";
  if (PROTECTED_FILMMAKING_PHRASES.some((phrase) => phraseExists(fullText, phrase))) return "filmmaking-term";
  return "unknown";
}
export function collectProtectedInventorySpans(text: string): ProtectedInventorySpan[] {
  return PROTECTED_FILMMAKING_PHRASES.flatMap((phrase) => [...text.matchAll(new RegExp(`(?:^|\\b)${phrasePattern(phrase)}(?:\\b|$)`, "gi"))].map((match) => ({ startIndex: match.index || 0, endIndex: (match.index || 0) + match[0].length, kind: "filmmaking-term" as const, phrase })));
}
export function candidateInsideProtectedSpan({ startIndex, endIndex, spans }: { startIndex: number; endIndex: number; spans: ProtectedInventorySpan[] }): boolean { return spans.some((span) => startIndex >= span.startIndex && endIndex <= span.endIndex); }
export function classifyPromptEntity(text: string, sectionId: PromptPackageSectionId, authorizedInventory?: AuthorizedProductionInventory): ClassifiedPromptEntity {
  const value = normalized(text);
  const object = authorizedInventory?.objects.find((entry) => entry.aliases.some((alias) => value === normalized(alias)) || entry.attributes.some((attribute) => value === normalized(attribute)));
  const screenKind = /\bscreen\b/i.test(text) ? classifyScreenUsage(text) : "unknown";
  const kind: InventoryEntityKind = authorizedInventory?.characterNames.some((name) => value === normalized(name)) ? "character" : object?.attributes.some((attribute) => value === normalized(attribute)) ? "object-attribute" : object ? "authorized-movable-object" : screenKind !== "unknown" ? screenKind : ATTRIBUTE_TERMS.includes(value) || /(?:mark|symbol|stripe|texture|pattern|color patch)$/.test(value) ? "object-attribute" : SCENE_ZONE_TERMS.includes(value) || /^(?:upper|lower|payoff|action|slope|boardwalk)\s+(?:path|route|area|zone|edge|center|top|lower)$/.test(value) ? "scene-zone" : EFFECT_TERMS.includes(value) ? "visual-effect" : KNOWN_PROPS.includes(value) ? "unauthorized-movable-object" : authorizedInventory && value.includes(normalized(authorizedInventory.location.name)) ? "environment-term" : "unknown";
  return { text, normalizedText: value, kind, sectionId, evidence: text };
}
export function detectUnauthorizedObjects({ sections, authorizedInventory }: { sections: PromptPackageSections; authorizedInventory: AuthorizedProductionInventory }): UnauthorizedObjectFinding[] {
  const authorized = authorizedInventory.objects.flatMap((object) => object.aliases.map(normalized));
  return KNOWN_PROPS.filter((noun) => !LOCATION_SURFACES.includes(noun) && !authorized.some((name) => normalized(noun) === name || normalized(noun).includes(name) || name.includes(normalized(noun)))).map((noun) => {
    const matches = Object.entries(sections).flatMap(([section, value]) => {
      const source = value || ""; const spans = collectProtectedInventorySpans(source); const regex = new RegExp(`\\b${noun.replace(/ /g, "\\s+")}s?\\b`, "gi");
      return [...source.matchAll(regex)].filter((match) => !candidateInsideProtectedSpan({ startIndex: match.index || 0, endIndex: (match.index || 0) + match[0].length, spans })).map((match) => ({ section: section as PromptPackageSectionId, evidence: source.slice(Math.max(0, (match.index || 0) - 45), Math.min(source.length, (match.index || 0) + match[0].length + 45)) }));
    });
    return matches.length ? { objectName: noun, sections: [...new Set(matches.map((match) => match.section))], evidence: matches.map((match) => match.evidence) } : null;
  }).filter((finding): finding is UnauthorizedObjectFinding => Boolean(finding));
}
export function repairUnauthorizedObjects(pack: ProductionPack, authorizedInventory: AuthorizedProductionInventory, concept: ResolvedProductionConcept): ProductionPack {
  const findings = detectUnauthorizedObjects({ sections: packSections(pack), authorizedInventory });
  if (!findings.length) return pack;
  const replacement = concept.primaryObject.objectName;
  const repaired = { ...pack };
  const keys: (keyof ProductionPack)[] = ["startFramePrompt", "endFramePrompt", "videoLock", "videoTimeline", "musicPath", "soundEffects", "finalGenerationRule"];
  findings.forEach((finding) => keys.forEach((key) => { repaired[key] = repaired[key].replace(new RegExp(`\\b(?:the\\s+)?${finding.objectName.replace(/ /g, "\\s+")}s?\\b`, "gi"), replacement); }));
  return normalizeProductionPackEncoding(repaired);
}

export function analyzeCharacterParticipation(concept: ResolvedProductionConcept, selectedCharacters: CharacterProfile[]): CharacterParticipationResult[] {
  return selectedCharacters.map((profile) => {
    const character = concept.characters.find((entry) => entry.characterId === profile.id);
    const combined = `${character?.initiatingAction || ""} ${character?.mainAction || ""}`;
    const meaningful = /push|pull|redirect|block|interfere|collid|tap|guide|stop|catch|trip|cause|shove|pivot|dodge/i.test(combined);
    const causes = meaningful || character?.function === "initiator" || character?.function === "assistant" || character?.function === "rescuer";
    const flags = [Boolean(character?.openingState), meaningful, causes, Boolean(character?.reaction), Boolean(character?.endingState)];
    return { characterId: profile.id, characterName: profile.shortName, appearsInOpening: flags[0], hasMeaningfulAction: flags[1], causesOrAffectsEvent: flags[2], reactsToEvent: flags[3], appearsInPayoff: flags[4], participationScore: flags.filter(Boolean).length * 20 };
  });
}

export function validateCompleteObjectTrajectory(trajectory: CompleteObjectTrajectory, durationSeconds: number): ChoreographyIssue[] {
  const issues: ChoreographyIssue[] = [];
  const add = (id: string, message: string) => issues.push({ id, severity: "critical", message, repairable: true });
  if (!trajectory.initialPosition.trim()) add("trajectory-start", "The important object needs an exact starting position.");
  if (!trajectory.finalPosition.trim()) add("trajectory-final", "The important object needs an exact final position.");
  if (!trajectory.segments.length) add("trajectory-segments", "The important object needs a timed physical trajectory.");
  trajectory.segments.forEach((segment, index) => {
    if (!segment.forceOrTrigger.trim() || !segment.direction.trim() || !segment.movementType || !segment.resultingPosition.trim()) add(`trajectory-segment-${index}`, `Trajectory segment ${index + 1} is incomplete.`);
    if (index && normalized(segment.initialPosition) !== normalized(trajectory.segments[index - 1].resultingPosition)) add(`trajectory-disconnect-${index}`, `Trajectory segment ${index + 1} does not begin at the previous resulting position.`);
    if (segment.movementType === "redirect" && !/(foot|paw|hand|tail|side|contact|tap|push|pivot|bounce|rebound|momentum)/i.test(`${segment.forceOrTrigger} ${segment.characterInteraction || ""}`)) add("unclear-redirection", "The object reverses direction without a complete physical redirection mechanism.");
    if (segment.endTime > durationSeconds || segment.endTime <= segment.startTime) add(`trajectory-time-${index}`, `Trajectory segment ${index + 1} does not fit the selected duration.`);
  });
  return issues;
}

export function buildCompleteObjectTrajectory(concept: ResolvedProductionConcept): CompleteObjectTrajectory {
  const count = 4; const duration = concept.durationSeconds; const object = concept.primaryObject.objectName;
  const initiator = concept.characters.find((character) => character.function === "initiator") || concept.characters[0];
  const hero = concept.characters.find((character) => character.role === "Hero") || concept.characters[0];
  const assistant = concept.characters.find((character) => character.characterId !== initiator?.characterId && character.characterId !== hero?.characterId);
  const points = Array.from({ length: count + 1 }, (_, index) => Math.round(duration * index / count));
  const p0 = concept.primaryObject.initialPosition; const p1 = `rolling midway down the authorized path toward ${hero.characterName}`; const p2 = `at ${hero.characterName}'s planted foot on the lower side of the path`; const p3 = `rolling back toward ${initiator.characterName} and ${assistant?.characterName || "the initiator"}`; const p4 = concept.primaryObject.finalPosition;
  return { objectName: object, initialPosition: p0, finalPosition: p4, segments: [
    { startTime: points[0], endTime: points[1], initialPosition: p0, forceOrTrigger: `${initiator.characterName} pushes the ${object} with both hands`, direction: `down the authorized path toward ${hero.characterName}`, movementType: "roll", characterInteraction: `${initiator.characterName} releases after the push`, resultingPosition: p1 },
    { startTime: points[1], endTime: points[2], initialPosition: p1, forceOrTrigger: `gravity and the initial push preserve forward momentum`, direction: `downhill toward ${hero.characterName}`, movementType: "roll", characterInteraction: `${assistant?.characterName || initiator.characterName} steps into the path and accidentally narrows ${hero.characterName}'s escape lane`, resultingPosition: p2 },
    { startTime: points[2], endTime: points[3], initialPosition: p2, forceOrTrigger: `${hero.characterName} sidesteps, plants one foot against the ${object}'s lower side, absorbs part of its momentum with a brief backward lean, then pivots it onto the curved return edge`, direction: `back along the same authorized path toward ${initiator.characterName}`, movementType: "redirect", characterInteraction: `${hero.characterName}'s visible foot contact slows and turns the ${object}`, resultingPosition: p3 },
    { startTime: points[3], endTime: points[4], initialPosition: p3, forceOrTrigger: `${initiator.characterName} dodges into ${assistant?.characterName || "the return lane"}; their soft collision removes the ${object}'s remaining path obstruction while ground friction slows it`, direction: `past the harmless collision and toward ${hero.characterName}'s side`, movementType: "stop", characterInteraction: `${initiator.characterName} and ${assistant?.characterName || hero.characterName} react to the return`, resultingPosition: p4 },
  ] };
}

export function buildExecutableVideoBeats(concept: ResolvedProductionConcept, trajectory: CompleteObjectTrajectory): ExecutableVideoBeat[] {
  const characters = concept.characters; const initiator = characters.find((character) => character.function === "initiator") || characters[0]; const hero = characters.find((character) => character.role === "Hero") || characters[0]; const assistant = characters.find((character) => character.characterId !== initiator.characterId && character.characterId !== hero.characterId);
  return trajectory.segments.map((segment, index) => ({ startSeconds: segment.startTime, endSeconds: segment.endTime, label: ["Hook and trap", "Interference", "Physical redirection", "Backfire and payoff"][index], actionOwnerIds: [index === 0 ? initiator.characterId : index === 1 && assistant ? assistant.characterId : index === 2 ? hero.characterId : initiator.characterId], concreteAction: index === 0 ? `${initiator.characterName} visibly pushes the ${trajectory.objectName} with both hands and releases it` : index === 1 ? `${assistant?.characterName || initiator.characterName} steps into the rolling lane, forcing ${hero.characterName} toward the curved path edge` : index === 2 ? segment.forceOrTrigger : `${initiator.characterName} dodges sideways and bumps into ${assistant?.characterName || hero.characterName}; both settle unharmed while the ${trajectory.objectName} slows beside ${hero.characterName}`, objectMovement: `${segment.initialPosition} → ${segment.resultingPosition}; ${segment.direction}`, physicalCause: segment.forceOrTrigger, visibleReaction: index === 0 ? `${hero.characterName} tracks the approaching object; ${assistant?.characterName || "the others"} braces` : index === 1 ? `${hero.characterName} sidesteps and prepares one planted foot` : index === 2 ? `${initiator.characterName} and ${assistant?.characterName || "the others"} recoil as the object returns` : concept.payoff, cameraDirection: "One continuous wide or medium-wide shot follows the object's direction while keeping every selected character visible", continuityToNextBeat: index === trajectory.segments.length - 1 ? `Hold the exact final composition: ${concept.finalComposition}` : `Begin the next beat from ${segment.resultingPosition} with unchanged cast, object, and screen direction` }));
}

export function alignAudioTimingToVideoBeats(videoBeats: ExecutableVideoBeat[], musicPlan: MusicDirectionBeat[], sfxPlan: SoundEffectBeat[]) {
  return { musicPlan: videoBeats.map((beat, index) => ({ startSeconds: beat.startSeconds, endSeconds: beat.endSeconds, direction: musicPlan[index]?.direction || `Follow ${beat.label.toLowerCase()} with one clear musical transition`, intentionalOverlap: false })), sfxPlan: videoBeats.map((beat, index) => ({ startSeconds: beat.startSeconds, endSeconds: beat.endSeconds, direction: sfxPlan[index]?.direction || beat.physicalCause })) };
}
const time = (seconds: number) => `0:${String(seconds).padStart(2, "0")}`;
export function buildConciseVideoLock({ concept, characters, inventory, form, style, model }: { concept: ResolvedProductionConcept; characters: CharacterProfile[]; inventory: AuthorizedProductionInventory; form: ProductionForm; style: string; model: string }): string { return `FORMAT — ${concept.durationSeconds} seconds, ${concept.videoRatio}, ${model}, ${style}. CAST — exactly ${characters.length}: ${characters.map((character) => `${character.shortName} (${character.role}; ${character.fullIdentity})`).join("; ")}. ENVIRONMENT AND OBJECT — ${inventory.location.name}: ${inventory.location.description}. Only one authorized object: ${concept.primaryObject.visualIdentity}; start=${concept.primaryObject.initialPosition}; final=${concept.primaryObject.finalPosition}. CONTINUITY — preserve cast count, identities, roles, location, lighting, screen direction, and the same single object from Start Frame to End Frame; ${form.motionLevel === "Safe" ? "locked camera axis" : "one continuous readable shot"}. DIALOGUE — ${form.voiceLayers.includes("No Spoken Dialogue") ? "no spoken dialogue or narration; concise synchronized nonverbal reactions are allowed" : form.voiceLayers.join(", ")}.`; }
export function buildConciseVideoRules(): string { return `IDENTITY AND CONTINUITY — Preserve every identity, role, object, and environment fact defined in Video Lock. CAMERA AND EDITING — Keep one readable action axis; no unrequested cut or camera jump. MOTION AND PHYSICS — Show anticipation, contact, momentum, gravity, follow-through, and settling. OBJECT INTERACTION — Move only the authorized object through visible force and a continuous path. AUDIO — Synchronize music, impacts, movement, and reactions to visible beats. ERROR PREVENTION — No duplicate or extra character, object, limb, teleportation, morphing, floating, text, logo, or watermark.`; }
export function buildMusicDirection(beats: ExecutableVideoBeat[], form: ProductionForm): string { if (form.noMusic || form.musicStyle === "no-music") return "No Music."; return beats.map((beat, index) => `${time(beat.startSeconds)}–${time(beat.endSeconds)} — ${index === 0 ? "Introduce a light playful pulse under the visible push" : index === 1 ? "Build tension as the rolling lane narrows" : index === 2 ? "Accent the foot contact and directional pivot" : "Land one soft comedic cadence as the collision and object settle"}.`).join("\n"); }
export function buildCharacterVocalLocks(characters: CharacterProfile[]): CharacterVocalLock[] { return characters.map((character) => ({ characterId: character.id, characterName: character.shortName, conciseVocalIdentity: character.nonverbalSoundProfile.trim().split(/[.!?]/)[0] || "brief neutral nonverbal effort breaths and reactions" })); }
export function buildConciseSoundEffects(beats: ExecutableVideoBeat[], characters: CharacterProfile[], objectName: string): string { const locks = buildCharacterVocalLocks(characters); return `VOCAL LOCKS — ${locks.map((lock) => `${lock.characterName}: ${lock.conciseVocalIdentity}`).join("; ")}.\n${beats.map((beat, index) => `${time(beat.startSeconds)}–${time(beat.endSeconds)} — ${index === 0 ? `one effort reaction, ${objectName} contact creak, and directional rolling sound` : index === 1 ? `quick foot movement and one startled reaction as the lane narrows` : index === 2 ? `foot skid, one clean side contact, pivot swish, and return roll` : `one soft character collision, ${objectName} wobble, friction slowdown, and settling sound`}.`).join("\n")}\nNo spoken words. Every sound must match a visible action.`; }
export function packSections(pack: ProductionPack): PromptPackageSections { return { "start-frame": pack.startFramePrompt, "end-frame": pack.endFramePrompt, "video-lock": pack.videoLock, "video-prompt": pack.videoTimeline, music: pack.musicPath, "sound-effects": pack.soundEffects, "video-rules": pack.finalGenerationRule, timeline: pack.videoTimeline }; }
