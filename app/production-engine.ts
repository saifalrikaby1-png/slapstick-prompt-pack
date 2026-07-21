import {
  CharacterProfile,
  CreativeAsset,
  LegacyPackItem,
  LegacySavedPack,
  ProductionForm,
  ProductionPack,
  PartialProductionPack,
  RequestedOutput,
  QualityFinding,
  QualityReport,
  SavedProductionPack,
  StoredPack,
  defaultProductionForm,
  fieldsForRequestedOutputs,
  requestedOutputValues,
} from "./production-types";

const stringValue = (value: unknown, fallback = "") =>
  typeof value === "string" ? value.trim() : fallback;

const boolValue = (value: unknown, fallback: boolean) =>
  typeof value === "boolean" ? value : fallback;

export function ratioLabel(
  ratio: string,
  width: string,
  height: string,
) {
  if (ratio !== "Custom") return ratio;
  const safeWidth = stringValue(width, "?");
  const safeHeight = stringValue(height, "?");
  return `Custom ${safeWidth}:${safeHeight}`;
}

export function selectedPlatform(form: ProductionForm) {
  return form.platform === "Custom"
    ? stringValue(form.customPlatform, "Custom platform")
    : form.platform;
}

export type ModelPromptAdapter = {
  displayName: string;
  promptStructure: string;
  cameraPolicy: string;
  motionPolicy: string;
  pacingPolicy: string;
  referenceFramePolicy: string;
  audioPolicy: string;
  negativePolicy: string;
  maxSingleClipSeconds?: number;
};

export const modelPromptAdapters: Record<string, ModelPromptAdapter> = {
  Seedance: {
    displayName: "Seedance", promptStructure: "chronological multimodal-reference progression",
    cameraPolicy: "one controlled camera progression", motionPolicy: "coherent subject motion with explicit cause, physical support, and gravity-aware follow-through",
    pacingPolicy: "compact chronological readable beats", referenceFramePolicy: "treat both reference frames as identity, ground-plane, and geometry anchors",
    audioPolicy: "concise native-audio direction only when enabled", negativePolicy: "concise identity and continuity exclusions",
  },
  Kling: {
    displayName: "Kling", promptStructure: "subject, movement, scene, camera, lighting",
    cameraPolicy: "state physical direction, force, and one controlled camera move", motionPolicy: "explicit grounded start pose, force, trajectory, landing, and final settled pose",
    pacingPolicy: "action ownership in clearly ordered physical phases", referenceFramePolicy: "lock start/end poses and spatial transition",
    audioPolicy: "audio secondary to readable physical action", negativePolicy: "forbid motion ambiguity, morphing, and substitutions",
  },
  "Google Flow / Veo": {
    displayName: "Google Flow / Veo", promptStructure: "cinematic shot, subject action, environment, lighting, camera, audio",
    cameraPolicy: "natural cinematic camera language with stable lens", motionPolicy: "natural coherent motion, contact, gravity, and landing described in cinematic prose",
    pacingPolicy: "story beats with attributable audio", referenceFramePolicy: "first-frame and last-frame continuity with matching lens and perspective",
    audioPolicy: "attribute dialogue, ambience, and Foley to exact sources", negativePolicy: "avoid contradictions and unexplained changes",
  },
  Runway: {
    displayName: "Runway", promptStructure: "reference image, motion, temporal progression, camera",
    cameraPolicy: "one clear camera movement per short clip", motionPolicy: "describe one grounded motion chain over time without redescribing the anchored image",
    pacingPolicy: "segment clips longer than ten seconds", referenceFramePolicy: "use the reference image as the primary visual anchor",
    audioPolicy: "provide editing-guide audio separately", negativePolicy: "short motion-focused exclusions",
    maxSingleClipSeconds: 10,
  },
  Higgsfield: {
    displayName: "Higgsfield", promptStructure: "subject staging, action beat, intentional camera path",
    cameraPolicy: "one explicit cinematic camera move compatible with subject motion", motionPolicy: "slapstick timing remains physically grounded and readable along the camera path",
    pacingPolicy: "controlled action beats with clean holds", referenceFramePolicy: "preserve framing while using reference-friendly subject separation",
    audioPolicy: "sync accents to visible camera-readable beats", negativePolicy: "no conflicting camera commands",
  },
  PixVerse: {
    displayName: "PixVerse", promptStructure: "action-first subject, staging, simple camera",
    cameraPolicy: "simple stable camera behavior", motionPolicy: "conservative grounded readable subject motion",
    pacingPolicy: "few direct beats", referenceFramePolicy: "clear silhouettes and conservative geometry",
    audioPolicy: "simple visible-source audio", negativePolicy: "concise broadly supported constraints",
  },
  "Hailuo / MiniMax": {
    displayName: "Hailuo / MiniMax", promptStructure: "subject, action, scene, style, camera",
    cameraPolicy: "conservative supported camera motion stated separately", motionPolicy: "direct grounded action commands separated from camera commands",
    pacingPolicy: "concise action phases", referenceFramePolicy: "stable perspective and direct reference continuity",
    audioPolicy: "minimal separate audio direction", negativePolicy: "direct concise exclusions",
  },
  Hailuo: {
    displayName: "Hailuo / MiniMax", promptStructure: "subject, action, scene, style, camera",
    cameraPolicy: "conservative supported camera motion stated separately", motionPolicy: "direct action commands separated from camera commands",
    pacingPolicy: "concise action phases", referenceFramePolicy: "stable perspective and direct reference continuity",
    audioPolicy: "minimal separate audio direction", negativePolicy: "direct concise exclusions",
  },
  "Generic model": {
    displayName: "Generic model", promptStructure: "subject, setting, action, camera, style, continuity",
    cameraPolicy: "one broadly compatible camera move", motionPolicy: "smooth logical grounded motion with explicit cause and effect",
    pacingPolicy: "universal chronological beats", referenceFramePolicy: "stable reference-friendly composition",
    audioPolicy: "separate universal audio guide", negativePolicy: "universal continuity constraints",
  },
};

export function selectedModelAdapter(form: ProductionForm) {
  const base = modelPromptAdapters[form.videoModel] || modelPromptAdapters["Generic model"];
  const presenceAware = {
    ...base,
    motionPolicy: `${base.motionPolicy}; strict cast/object presence, no spawn/despawn, named action ownership, natural motion only, continuous position transitions`,
    cameraPolicy: `${base.cameraPolicy}; preserve the exact active cast in continuous framing without crop-out or action-axis reversal`,
    pacingPolicy: `${base.pacingPolicy}; selected tones apply from frame zero and Fast begins with named active movement at 0:00`,
  };
  return form.videoModel === "Custom model"
    ? { ...presenceAware, displayName: selectedModel(form), promptStructure: `${base.promptStructure}; ${form.customModelGuidance || "customer-defined model guidance not supplied"}` }
    : presenceAware;
}

export function selectedModel(form: ProductionForm) {
  return form.videoModel === "Custom model"
    ? stringValue(form.customVideoModel, "Custom model")
    : form.videoModel;
}

export function selectedStyle(form: ProductionForm) {
  return form.visualStyle === "Custom"
    ? stringValue(form.customVisualStyle, "Custom visual style")
    : form.visualStyle;
}

export function selectedTone(form: ProductionForm) {
  return form.tones.map((tone) => tone === "Custom"
    ? stringValue(form.customTone, "Custom tone")
    : tone).join(", ");
}

export function toneProductionDirection(form: ProductionForm) {
  const directions: Record<string, string> = {
    Calm: "measured pacing, stable framing, gentle expressions, soft motion and restrained audio",
    Cute: "appealing poses, rounded readable expressions, light motion and delicate sound accents",
    Playful: "buoyant rhythm, teasing staging, expressive reactions and musical Foley",
    Funny: "clear anticipation, readable comic timing, reaction holds and precise impact accents",
    Energetic: "active poses, rising momentum, crisp camera follow and driving rhythm",
    Fast: "immediate first-frame action, compact beats, quick readable movement and tight audio timing",
    "Chaotic slapstick": "controlled visual chaos around one causal action, exaggerated reactions and a clean harmless payoff",
    Suspenseful: "held anticipation, controlled push-in, restrained motion before release and tension-building audio",
    Emotional: "character-focused framing, expressive pauses, motivated movement and supportive score",
    Magical: "luminous staging, graceful motion arcs, wonder reactions and sparkling visible-source accents",
    Educational: "clear cause-and-effect staging, legible demonstrations, steady camera and unobtrusive audio",
  };
  return form.tones.map((tone) => tone === "Custom"
    ? `custom direction: ${form.customTone || "customer-defined tone"}`
    : directions[tone] || tone).join("; ");
}

export function characterDescription(profile: CharacterProfile) {
  if (profile.description.trim()) return profile.description.trim();
  return [
    `Full identity: ${profile.fullIdentity}`,
    `Role: ${profile.role}`,
    `Appearance: ${profile.appearanceLock || "Use the established design."}`,
    `Primary and secondary colors: ${profile.colorLock || "Preserve established colors."}`,
    `Scale and proportions: ${profile.scaleLock || "Keep scale and proportions stable."}`,
    `Personality and facial-expression style: ${profile.personalityLock || "Keep expressions readable and role-consistent."}`,
    `Movement style and signature actions: ${profile.movementStyle || "Use smooth, character-specific motion."}`,
    `Voice profile: ${profile.vocalStyleLock || "Keep the voice profile consistent."}`,
    `Nonverbal sound profile: ${profile.nonverbalSoundProfile || neutralNonverbalFallback}`,
    `Continuity rules: ${profile.continuityRules || "Preserve identity in every frame."}`,
    `Negative identity rules: ${profile.negativeRules || "No duplication, morphing, or role changes."}`,
  ].join("\n");
}

const neutralNonverbalFallback =
  "Short character-appropriate nonverbal effort and reaction sounds, matching the character’s established size, personality, movement, and emotional behavior. No understandable words.";

export function resolveCharacterAudioIdentity(
  character: CharacterProfile,
  temporaryOverride = "",
) {
  if (temporaryOverride.trim()) return temporaryOverride.trim();
  if (character.nonverbalSoundProfile?.trim()) return character.nonverbalSoundProfile.trim();
  const descriptionGuidance = characterDescription(character).split("\n")
    .find((line) => /^(?:nonverbal sound profile|voice profile|voice guidance|vocal style):/i.test(line.trim()))
    ?.split(":").slice(1).join(":").trim();
  if (descriptionGuidance) return descriptionGuidance;
  if (character.vocalStyleLock?.trim()) return character.vocalStyleLock.trim();
  return neutralNonverbalFallback;
}

export function buildCharacterSoundInstructions({
  activeCharacters,
  timeRange,
  visibleAction,
  selectedTones,
  noSpokenDialogue,
  temporaryOverrides = {},
}: {
  activeCharacters: CharacterProfile[];
  timeRange: string;
  visibleAction: string;
  selectedTones: string[];
  noSpokenDialogue: boolean;
  temporaryOverrides?: Record<string, string>;
}) {
  if (!activeCharacters.length) return "";
  return activeCharacters.map((character) => {
    const identity = resolveCharacterAudioIdentity(character, temporaryOverrides[character.id] || "");
    return `${timeRange} — ${character.shortName}: when the visible action “${visibleAction}” produces a useful reaction, use one concise nonverbal reaction adapted from this identity: ${identity} ${noSpokenDialogue ? "No spoken words." : "Do not add speech unless an enabled voice layer assigns it."} Tone context: ${selectedTones.join(", ") || "customer-defined"}.`;
  }).join("\n");
}

function parseTemporarySoundOverrides(value: string, cast: CharacterProfile[]) {
  const overrides: Record<string, string> = {};
  value.split("\n").forEach((line) => {
    const separator = line.indexOf(":");
    if (separator < 1) return;
    const name = line.slice(0, separator).trim().toLowerCase();
    const character = cast.find((profile) =>
      profile.shortName.toLowerCase() === name || profile.fullIdentity.toLowerCase() === name);
    if (character) overrides[character.id] = line.slice(separator + 1).trim();
  });
  return overrides;
}

export function buildCompactCharacterLock(profile: CharacterProfile) {
  const lines = characterDescription(profile).split("\n");
  const value = (label: string) => lines.find((line) =>
    line.toLowerCase().startsWith(`${label.toLowerCase()}:`))?.split(":").slice(1).join(":").trim();
  return `${profile.fullIdentity} — ${profile.role}. ${value("Appearance") || profile.appearanceLock || "Preserve saved appearance"}; ` +
    `colors: ${value("Primary and secondary colors") || profile.colorLock || "preserve saved colors"}; ` +
    `clothing/accessories: ${value("Clothing and accessories") || "preserve saved wardrobe"}; ` +
    `relative scale: ${value("Scale and proportions") || profile.scaleLock || "preserve saved scale"}; ` +
    `${value("Movement style") || profile.movementStyle || value("Personality") || profile.personalityLock || "preserve character-specific behavior"}.`;
}

export function migrateCharacter(value: unknown): CharacterProfile | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const item = value as Record<string, unknown>;
  const shortName = stringValue(item.shortName);
  const fullIdentity = stringValue(item.fullIdentity);
  if (!shortName || !fullIdentity) return null;
  const rawRole = stringValue(item.role, "Companion");
  const role = rawRole === "Hero" || rawRole === "Enemy" || rawRole === "Companion"
    ? rawRole
    : "Companion";
  const profile: CharacterProfile = {
    id: stringValue(item.id) || crypto.randomUUID(),
    builtIn: boolValue(item.builtIn, false),
    shortName,
    fullIdentity,
    role,
    description: stringValue(item.description),
    appearanceLock: stringValue(item.appearanceLock),
    personalityLock: stringValue(item.personalityLock),
    colorLock: stringValue(item.colorLock),
    scaleLock: stringValue(item.scaleLock),
    vocalStyleLock: stringValue(item.vocalStyleLock),
    nonverbalSoundProfile: stringValue(item.nonverbalSoundProfile),
    movementStyle: stringValue(item.movementStyle),
    continuityRules: stringValue(item.continuityRules),
    negativeRules: stringValue(item.negativeRules),
  };
  profile.description = characterDescription(profile);
  return profile;
}

export function migrateForm(value: unknown): ProductionForm {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { ...defaultProductionForm };
  }
  const item = value as Record<string, unknown>;
  const selectedCharacterIds = Array.isArray(item.selectedCharacterIds)
    ? item.selectedCharacterIds.filter((entry): entry is string => typeof entry === "string")
    : [...defaultProductionForm.selectedCharacterIds];
  const legacyActive = [stringValue(item.heroId, defaultProductionForm.heroId), ...selectedCharacterIds];
  const activeCharacterIds = [...new Set(
    (Array.isArray(item.activeCharacterIds) ? item.activeCharacterIds : legacyActive)
      .filter((entry): entry is string => typeof entry === "string" && Boolean(entry)),
  )];
  const migrated: ProductionForm = {
    ...defaultProductionForm,
    videoTitle: stringValue(item.videoTitle),
    locationAssetId: stringValue(item.locationAssetId),
    locationName: stringValue(item.locationName),
    location: stringValue(item.location, stringValue(item.notes)),
    objectAssetId: stringValue(item.objectAssetId),
    objectName: stringValue(item.objectName),
    importantObject: stringValue(item.importantObject, stringValue(item.object)),
    allowPreviouslySavedObjects: boolValue(item.allowPreviouslySavedObjects, false),
    actionAssetId: stringValue(item.actionAssetId),
    actionName: stringValue(item.actionName),
    trapAction: stringValue(item.trapAction, stringValue(item.trap)),
    payoffAssetId: stringValue(item.payoffAssetId),
    payoffName: stringValue(item.payoffName),
    endingPayoff: stringValue(item.endingPayoff),
    additionalDirection: stringValue(item.additionalDirection, stringValue(item.notes)),
    heroId: stringValue(item.heroId, defaultProductionForm.heroId),
    selectedCharacterIds,
    activeCharacterIds,
    platform: ["Social Media", "Custom"].includes(stringValue(item.platform))
      ? stringValue(item.platform)
      : "Social Media",
    customPlatform: stringValue(item.customPlatform),
    videoModel: stringValue(item.videoModel, defaultProductionForm.videoModel)
      .replace(/^OpenArt - /, "")
      .replace(/^Hailuo$/, "Hailuo / MiniMax"),
    customVideoModel: stringValue(item.customVideoModel),
    duration: stringValue(item.duration, defaultProductionForm.duration).replace(/\s*seconds?$/i, ""),
    visualStyle: stringValue(item.visualStyle, stringValue(item.style, defaultProductionForm.visualStyle)),
    customVisualStyle: stringValue(item.customVisualStyle),
    tones: Array.isArray(item.tones)
      ? [...new Set(item.tones.filter((tone): tone is string => typeof tone === "string"))]
      : [stringValue(item.tone, "Funny")],
    customTone: stringValue(item.customTone),
    ultraRetentionMode: boolValue(item.ultraRetentionMode, true),
    motionLevel: item.motionLevel === "Safe" || item.motionLevel === "Ambitious"
      ? item.motionLevel
      : "Balanced",
    videoRatio: stringValue(item.videoRatio, stringValue(item.ratio, defaultProductionForm.videoRatio)).split(" ")[0],
    startFrameRatio: stringValue(item.startFrameRatio, stringValue(item.ratio, defaultProductionForm.startFrameRatio)).split(" ")[0],
    endFrameRatio: stringValue(item.endFrameRatio, stringValue(item.ratio, defaultProductionForm.endFrameRatio)).split(" ")[0],
    videoCustomWidth: stringValue(item.videoCustomWidth),
    videoCustomHeight: stringValue(item.videoCustomHeight),
    startCustomWidth: stringValue(item.startCustomWidth),
    startCustomHeight: stringValue(item.startCustomHeight),
    endCustomWidth: stringValue(item.endCustomWidth),
    endCustomHeight: stringValue(item.endCustomHeight),
    voiceLayers: Array.isArray(item.voiceLayers)
      ? item.voiceLayers.filter((layer): layer is ProductionForm["voiceLayers"][number] =>
        ["Narrator", "Hero Voice", "Companion Voices", "Enemy Voices", "No Spoken Dialogue"].includes(String(layer)))
      : /silent|no dialogue|music and sound/i.test(stringValue(item.narrationMode, stringValue(item.dialogueMode)))
        ? ["No Spoken Dialogue"]
        : [
            /narrator/i.test(stringValue(item.narrationMode)) ? "Narrator" : null,
            /character/i.test(stringValue(item.narrationMode)) ? "Hero Voice" : null,
          ].filter((layer): layer is ProductionForm["voiceLayers"][number] => Boolean(layer)),
    narratorGuidance: stringValue(item.narratorGuidance, stringValue(item.narratorVocalStyle)),
    narrationText: stringValue(item.narrationText),
    characterDialogue: stringValue(item.characterDialogue),
    characterVoiceGuidance: stringValue(
      item.characterVoiceGuidance,
      [stringValue(item.heroVocalStyle), stringValue(item.enemyVocalStyle)].filter(Boolean).join("; "),
    ),
    language: stringValue(item.language, "English"),
    vocalTone: stringValue(item.vocalTone, "Expressive family-friendly cartoon"),
    lipSyncRequired: boolValue(item.lipSyncRequired, false),
    musicType: stringValue(item.musicType, stringValue(item.musicDirection, defaultProductionForm.musicType)),
    musicMood: stringValue(item.musicMood, "Playful"),
    musicIntensity: stringValue(item.musicIntensity, "Medium"),
    audioMode: stringValue(item.audioMode, defaultProductionForm.audioMode),
    noMusic: boolValue(item.noMusic, stringValue(item.musicDirection) === "No Music"),
    soundEffectsStyle: stringValue(item.soundEffectsStyle, defaultProductionForm.soundEffectsStyle),
    characterCartoonSounds: boolValue(item.characterCartoonSounds, false),
    characterCartoonSoundGuidance: stringValue(item.characterCartoonSoundGuidance),
    includeCharacterBuildingPrompt: boolValue(item.includeCharacterBuildingPrompt, true),
    customModelGuidance: stringValue(item.customModelGuidance),
  };
  if (!migrated.tones.length) migrated.tones = ["Funny"];
  if (!migrated.voiceLayers.length) migrated.voiceLayers = ["No Spoken Dialogue"];
  return migrated;
}

export function migrateStoredPack(value: unknown): StoredPack | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const item = value as Record<string, unknown>;
  const id = stringValue(item.id) || crypto.randomUUID();
  const createdAt = stringValue(item.createdAt, new Date().toISOString());
  const title = stringValue(item.title, stringValue(item.episodeTitle, "Saved Production Pack"));
  const platform = stringValue(item.platform, "Unknown platform");
  const videoModel = stringValue(item.videoModel, "Unknown model");
  const duration = stringValue(item.duration, "15");
  if (item.schemaVersion === 2 && item.pack && typeof item.pack === "object") {
    const pack = item.pack as Record<string, unknown>;
    const migratedPack: Record<string, unknown> = {
      ...pack,
      videoTitle: stringValue(pack.videoTitle, title),
    };
    const generatedOutputs = Array.isArray(item.generatedOutputs)
      ? [...new Set(item.generatedOutputs.filter((output): output is RequestedOutput =>
          typeof output === "string" && requestedOutputValues.includes(output as RequestedOutput)))]
      : requestedOutputValues.filter((output) => fieldsForRequestedOutputs([output])
          .every((key) => typeof migratedPack[key] === "string" && Boolean(migratedPack[key])));
    if (!generatedOutputs.length || !fieldsForRequestedOutputs(generatedOutputs)
      .every((key) => typeof migratedPack[key] === "string")) return null;
    const characters = Array.isArray(item.characterProfiles)
      ? item.characterProfiles.map(migrateCharacter).filter((entry): entry is CharacterProfile => Boolean(entry))
      : [];
    const quality = item.qualityReport && typeof item.qualityReport === "object"
      ? item.qualityReport as QualityReport
      : { score: 0, findings: [] };
    return {
      id,
      schemaVersion: 2,
      title,
      createdAt,
      platform,
      videoModel,
      duration,
      form: migrateForm(item.form),
      characterProfiles: characters,
      pack: migratedPack as PartialProductionPack,
      qualityReport: quality,
      requestedOutputs: generatedOutputs,
      generatedOutputs,
      packStatus: generatedOutputs.length === requestedOutputValues.length ? "Complete Pack" : "Partial Pack",
    } satisfies SavedProductionPack;
  }
  const legacyItems = Array.isArray(item.pack)
    ? item.pack.filter((entry): entry is LegacyPackItem =>
        Boolean(entry) && typeof entry === "object" &&
        typeof (entry as LegacyPackItem).title === "string" &&
        typeof (entry as LegacyPackItem).value === "string")
    : Array.isArray(item.items)
      ? item.items.filter((entry): entry is LegacyPackItem =>
          Boolean(entry) && typeof entry === "object" &&
          typeof (entry as LegacyPackItem).title === "string" &&
          typeof (entry as LegacyPackItem).value === "string")
      : [];
  if (!legacyItems.length) return null;
  return {
    id,
    schemaVersion: 1,
    title,
    createdAt,
    platform,
    videoModel,
    duration,
    items: legacyItems,
  } satisfies LegacySavedPack;
}

function timelineRanges(duration: number) {
  if (duration <= 15) {
    const first = Math.max(1, Math.round(duration * 0.2));
    const second = Math.max(first + 1, Math.round(duration * 0.55));
    const third = Math.max(second + 1, Math.round(duration * 0.82));
    return [0, first, second, third, duration];
  }
  const first = Math.max(2, Math.round(duration * 0.15));
  const second = Math.round(duration * 0.42);
  const third = Math.round(duration * 0.72);
  const fourth = Math.round(duration * 0.9);
  return [0, first, second, third, fourth, duration];
}

function rangeLabel(start: number, end: number) {
  return `0:${String(start).padStart(2, "0")}–0:${String(end).padStart(2, "0")}`;
}

function physicalGroundingLock() {
  return "PHYSICAL GROUNDING LOCK: Establish one clear ground plane or support surface. All standing characters keep visible foot, paw, wheel, seat, or body contact with that surface; ordinary objects rest on it, are held, attached, or moved by a visible force. Believable weight, contact shadows, and gravity remain active. No unexplained hovering, weightless drifting, gliding, elevation changes, or floating props.";
}

function smoothMotionLock() {
  return "SMOOTH MOTION LOCK: Every action has readable anticipation, acceleration, main movement, impact or change, follow-through, deceleration, and a complete settling pose. Use continuous paths, planted feet or paws, natural weight transfer, clear collision response, and supported limbs. No snapping, teleportation, gliding feet, frozen midair motion, instant reversals, geometry intersections, or objects passing through bodies or surfaces.";
}

function toneRetentionDirection(form: ProductionForm) {
  const ultra = form.ultraRetentionMode;
  const fast = form.tones.some((tone) => ["Fast", "Energetic", "Chaotic slapstick"].includes(tone));
  const calmOnly = (form.tones.includes("Calm") || form.tones.includes("Emotional")) && !fast;
  const pace = ultra && fast
    ? "ULTRA-FAST OPENING HOOK: the first frame is already active; within the first second the visual problem is obvious, with one rapid but readable surprise and no slow introduction"
    : calmOnly
      ? "strong opening visual question with smooth controlled movement, gentle micro-changes, and no frantic camera behavior"
      : "immediate readable opening activity, one clear visual question, and continuous cause-and-effect micro-beats";
  return `${pace}. ${toneProductionDirection(form)}. ${ultra ? "Retention scheduler enabled: one dominant visual event per beat, a major physically caused escalation around 50–65% of the duration, and a completed final payoff with settling." : "Retention scheduler is relaxed: keep the opening active and the ending complete without forcing frantic pacing."}`;
}

function airborneMotionRule(action: string) {
  return `If ${action} requires a jump, launch, bounce, fall, or thrown object, show the visible trigger, launch direction and force, one continuous gravity-driven arc, brief peak, descent, landing surface, impact absorption, follow-through, and complete settling; otherwise keep every character and object supported.`;
}

export interface MotionPacingProfile {
  id: "standard" | "fast" | "extreme-fast-chaotic";
  displayName: string;
  openingActionStart: number;
  maximumIdleTime: number;
  maximumAnticipationLength: number;
  maximumReactionHold: number;
  preferredBeatLength: number;
  accelerationStyle: string;
  movementStyle: string;
  reactionStyle: string;
  cameraStyle: string;
  endingStyle: string;
  forbiddenPacingLanguage: string[];
}

export function extremeFastChaotic(form: ProductionForm) {
  return form.tones.includes("Fast") && form.tones.includes("Chaotic slapstick");
}

export function motionPacingProfile(form: ProductionForm): MotionPacingProfile {
  if (extremeFastChaotic(form)) return {
    id: "extreme-fast-chaotic", displayName: "Extreme Fast-Chaotic Motion", openingActionStart: 0,
    maximumIdleTime: 0, maximumAnticipationLength: 0.7, maximumReactionHold: 0.5, preferredBeatLength: 0.8,
    accelerationStyle: "immediate powerful acceleration with readable body mechanics",
    movementStyle: "rapid exaggerated tightly connected slapstick movement",
    reactionStyle: "instant event-driven expressive reactions", cameraStyle: "already framed wide for action with fast smooth tracking only when needed",
    endingStyle: "fast consequence with a short readable settled payoff",
    forbiddenPacingLanguage: ["slowly", "gradually", "gently", "calmly", "long pause", "slow reveal", "lingering", "waits", "remains still"],
  };
  if (form.tones.includes("Fast")) return { id: "fast", displayName: "Fast", openingActionStart: 0, maximumIdleTime: 0.25, maximumAnticipationLength: 1, maximumReactionHold: 0.75, preferredBeatLength: 1.2, accelerationStyle: "quick readable acceleration", movementStyle: "compact connected movement", reactionStyle: "quick reactions", cameraStyle: "controlled action framing", endingStyle: "brief settled payoff", forbiddenPacingLanguage: ["slowly", "long pause"] };
  return { id: "standard", displayName: "Standard", openingActionStart: 0, maximumIdleTime: 0.5, maximumAnticipationLength: 2, maximumReactionHold: 1.5, preferredBeatLength: 2, accelerationStyle: "smooth motivated acceleration", movementStyle: "readable connected movement", reactionStyle: "clear reactions", cameraStyle: "controlled framing", endingStyle: "complete settled payoff", forbiddenPacingLanguage: [] };
}

export interface CharacterVisibilityState {
  characterId: string;
  characterName: string;
  presentAtStart: boolean;
  visibleByDefault: boolean;
  authorizedEntrance?: boolean;
  authorizedExit?: boolean;
  authorizedOcclusion?: boolean;
  finalPresence: "visible" | "exited-by-request";
}

export interface AuthorizedSceneInventory {
  characters: Array<{ id: string; name: string; role: CharacterProfile["role"] }>;
  importantObjects: Array<{ name: string; description: string }>;
  actionObjects: Array<{ name: string; source: "trap" | "main-action" | "additional-direction" }>;
  fixedEnvironmentElements: string[];
  authorizedEntrances: string[];
  authorizedExits: string[];
  authorizedTransformations: string[];
  allowCuts: boolean;
  allowIntentionalTensionHold: boolean;
  allowMagicalFloating: boolean;
}

export interface ObjectContinuityState {
  name: string;
  presentAtStart: boolean;
  startPosition: string;
  supportOrHolder: string;
  currentState: string;
  permittedMotion: string;
  finalPosition: string;
  presentAtEnd: boolean;
}

export function buildAuthorizedSceneInventory(form: ProductionForm, cast: CharacterProfile[]): AuthorizedSceneInventory {
  const direction = form.additionalDirection.toLowerCase();
  const action = form.trapAction.trim();
  const locationElements = form.location.split(/[.;]/).map((value) => value.trim()).filter(Boolean).slice(0, 6);
  return {
    characters: cast.map((profile) => ({ id: profile.id, name: profile.shortName, role: profile.role })),
    importantObjects: [{ name: form.importantObject.trim() || "important story object", description: form.importantObject.trim() || "Established selected object" }],
    actionObjects: action ? [{ name: action, source: "trap" }] : [],
    fixedEnvironmentElements: locationElements.length ? locationElements : [form.location.trim() || "established environment"],
    authorizedEntrances: /\b(enter|entrance|arrive|reveal)\b/.test(direction) ? [form.additionalDirection.trim()] : [],
    authorizedExits: /\b(exit|leave|off-screen|trapdoor)\b/.test(direction) ? [form.additionalDirection.trim()] : [],
    authorizedTransformations: /\b(transform|break|destroy|collapse)\b/.test(direction) ? [form.additionalDirection.trim()] : [],
    allowCuts: /\b(cut|shot change|cutaway)\b/.test(direction),
    allowIntentionalTensionHold: /\b(tension hold|living hold)\b/.test(direction),
    allowMagicalFloating: /\b(magical floating|levitat)\b/.test(direction),
  };
}

export function buildObjectStateLedger(inventory: AuthorizedSceneInventory): ObjectContinuityState[] {
  return inventory.importantObjects.map((item) => ({
    name: item.name,
    presentAtStart: true,
    startPosition: "visible supported starting position in the central action area",
    supportOrHolder: "visible ground, platform, holder, or attachment",
    currentState: "same identifiable authorized object",
    permittedMotion: "only a visible named force and continuous physical path",
    finalPosition: "visible supported final position in the resolved end frame",
    presentAtEnd: true,
  }));
}

function inventoryLock(inventory: AuthorizedSceneInventory, objects: ObjectContinuityState[]) {
  const cast = inventory.characters.map((item) => `${item.name} (${item.role})`).join(", ");
  const objectNames = inventory.importantObjects.map((item) => item.name).join(", ");
  const actionObjects = inventory.actionObjects.map((item) => item.name).join(", ") || "none beyond the named main action";
  return `CLOSED-WORLD CONTINUITY RULE: The production contains only explicitly authorized characters, objects, action components, and fixed environmental elements. Nothing may duplicate, appear from nowhere, disappear, vanish, spawn, despawn, transform, be replaced, reset, float, teleport, glide, freeze, or move unusually unless explicitly customer-authorized. AUTHORIZED CAST: ${cast}. AUTHORIZED OBJECTS: exactly ${objects.length} important object instance(s): ${objectNames}; action components: ${actionObjects}. FIXED ENVIRONMENT: ${inventory.fixedEnvironmentElements.join(", ")}. FORBIDDEN ADDITIONS: any character, creature, object, prop, tool, vehicle, decoration, particle source, foreground item, interactive background item, or visual-effect source not listed above. SCENE INVENTORY LOCK: no new prop may be invented for hook, escalation, reaction, impact, sound, or payoff. EXACT COUNT LOCK: exactly ${inventory.characters.length} characters and exactly ${objects.length} important object instance(s); no clones, background duplicates, reflections acting as duplicates, substitutes, or one object in two positions. NO-SPAWN / NO-DESPAWN LOCK: every range inherits the final position, visibility, identity, orientation, and physical state of every authorized entity from the preceding range; no scene reset.`;
}

function visibilityLedger(cast: CharacterProfile[], additionalDirection: string): CharacterVisibilityState[] {
  const direction = additionalDirection.toLowerCase();
  return cast.map((profile) => {
    const named = direction.includes(profile.shortName.toLowerCase());
    const authorizedExit = named && /\b(exit|leave|runs? off|off-screen|trapdoor)\b/.test(direction);
    const authorizedEntrance = named && /\b(enter|entrance|arrive|comes? in|reveal)\b/.test(direction);
    const authorizedOcclusion = named && /\b(behind|hide|hidden|obstruct|occlusion)\b/.test(direction);
    return {
      characterId: profile.id,
      characterName: profile.shortName,
      presentAtStart: !authorizedEntrance,
      visibleByDefault: !authorizedExit && !authorizedOcclusion,
      authorizedEntrance,
      authorizedExit,
      authorizedOcclusion,
      finalPresence: authorizedExit ? "exited-by-request" : "visible",
    };
  });
}

function presenceLock(ledger: CharacterVisibilityState[], object: string, additionalDirection: string) {
  const exceptions = ledger.filter((state) => state.authorizedEntrance || state.authorizedExit || state.authorizedOcclusion);
  const exceptionRule = exceptions.length
    ? ` Customer-authorized visibility exception: ${exceptions.map((state) => `${state.characterName} must use a visible, timed, continuous path through a named edge, door, tunnel, or obstruction, with no teleportation or unexplained reappearance`).join("; ")}. Direction: ${additionalDirection.trim()}.`
    : " No entrance, exit, occlusion, or off-screen movement is authorized.";
  return `STRICT PRESENCE LOCK: All selected characters are visible and physically established in the opening frame and remain continuously present through the final frame. The exact character count never changes. No selected character may suddenly appear, disappear, spawn, vanish, duplicate, split, merge, transform, or be replaced. Only selected characters may appear. VISIBILITY LOCK: use one continuous wide or medium-wide composition that keeps every active character readable, grounded, and unobstructed; no accidental crop-out, reframing loss, or camera-caused disappearance. STRICT OBJECT PRESENCE LOCK: ${object} is the same identifiable, supported object from start to finish; it never appears from nowhere, disappears, duplicates, changes design, or moves without visible physical cause.${exceptionRule}`;
}

function naturalMotionLock() {
  return "NATURAL MOVEMENT LOCK: Every named character or object performs only the planned action and reaction. Movement is purposeful, smooth, physically connected, and caused by the visible story event. No random gestures, twitching, dancing, spinning, jumping, sliding, pose snapping, unexplained reactions, decorative effects, or random camera movement. SMOOTH FACIAL-MOTION LOCK: eyes track the visible cause; facial features and posture transition together; no random mouth movement or unrelated expression swap.";
}

export function generateDemoPack(
  form: ProductionForm,
  characters: CharacterProfile[],
): ProductionPack {
  const rawActiveIds = form.activeCharacterIds || [form.heroId, ...form.selectedCharacterIds];
  const activeIds = [...new Set(rawActiveIds)];
  const cast = activeIds.map((id) => characters.find((profile) => profile.id === id))
    .filter((profile): profile is CharacterProfile => Boolean(profile));
  const hero = cast.find((profile) => profile.role === "Hero");
  const supporting = cast.filter((profile) => profile.id !== hero?.id);
  const uncheckedCharacters = characters.filter((profile) => !activeIds.includes(profile.id));
  const escapePattern = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const removeUncheckedCharacters = (value: string) => {
    let cleaned = value;
    uncheckedCharacters.forEach((profile) => {
      const replacement = cast.find((active) => active.role === profile.role)?.shortName || hero?.shortName || "";
      [profile.fullIdentity, profile.shortName].filter(Boolean).forEach((name) => {
        cleaned = cleaned.replace(new RegExp(`\\b${escapePattern(name)}\\b`, "gi"), replacement);
      });
      if (replacement) {
        cleaned = cleaned.replace(new RegExp(`\\b${escapePattern(replacement)}\\s+(?:and|&)\\s+${escapePattern(replacement)}\\b`, "gi"), replacement);
      }
    });
    return cleaned.replace(/\s{2,}/g, " ").trim();
  };
  const castNames = cast.map((profile) => profile.fullIdentity).join("; ");
  const castRoles = cast.map((profile) => `${profile.shortName}: ${profile.role}`).join("; ");
  const identities = removeUncheckedCharacters(cast.map(buildCompactCharacterLock).join("\n"));
  const duration = Math.max(5, Number(form.duration) || 15);
  const videoRatio = ratioLabel(form.videoRatio, form.videoCustomWidth, form.videoCustomHeight);
  const startRatio = ratioLabel(form.startFrameRatio, form.startCustomWidth, form.startCustomHeight);
  const endRatio = ratioLabel(form.endFrameRatio, form.endCustomWidth, form.endCustomHeight);
  const style = selectedStyle(form);
  const tone = selectedTone(form);
  const platform = selectedPlatform(form);
  const model = selectedModel(form);
  const adapter = selectedModelAdapter(form);
  const pacingProfile = motionPacingProfile(form);
  const ranges = timelineRanges(duration);
  const heroName = hero?.shortName || "Hero";
  const others = supporting.map((profile) => profile.shortName).join(" and ") || "the supporting cast";
  const location = removeUncheckedCharacters(stringValue(form.location, "a clean, readable cartoon environment"));
  const object = removeUncheckedCharacters(stringValue(form.importantObject, "the important story object"));
  const action = removeUncheckedCharacters(stringValue(form.trapAction, "a clear physical action"));
  const ending = removeUncheckedCharacters(stringValue(form.endingPayoff, `${heroName} completes the action and the scene resolves clearly`));
  const ledger = visibilityLedger(cast, form.additionalDirection);
  const visibilityLock = presenceLock(ledger, object, form.additionalDirection);
  const sceneInventory = buildAuthorizedSceneInventory(form, cast);
  const objectLedger = buildObjectStateLedger(sceneInventory);
  const closedWorldLock = inventoryLock(sceneInventory, objectLedger);
  const cameraRule = form.motionLevel === "Safe"
    ? "locked camera axis with no meaningful camera move"
    : form.motionLevel === "Ambitious"
      ? "one controlled cinematic camera move, with no cut and no loss of spatial clarity"
      : "maximum one smooth, meaningful camera move";
  const timelineLines = ranges.slice(0, -1).map((start, index) => {
    const end = ranges[index + 1];
    const actions = ranges.length === 5
      ? [
          `At exactly 0:00, ${heroName} is already leaning toward ${object} in a grounded motion-ready pose while ${others} remain visible, planted, and track the same object with prepared expressions. ${object} visibly responds to the established setup within the first second; the camera holds a wide action view. First action owner, direction, cause, and first motion cue are explicit; no static introduction.`,
          `${others} apply the visible trigger to ${object}; ${heroName} plants, accelerates, and redirects the same action in the established screen direction. ${object} follows one continuous path; every named character remains visible and their facial reaction follows the visible cause.`,
          `Major middle escalation: ${object} reaches the established consequence through one physically caused collision, reversal, or backfire. ${others} receive the harmless result while ${heroName} remains clearly safe; show follow-through, gravity-driven landing where relevant, and the same cast positions transitioning into the next beat.`,
          `${ending}. ${heroName} and ${others} remain visible in the final wide composition; every character reaches the final pose described by the end frame, visibly supported, with complete settling and one memorable reaction hold.`,
        ]
      : [
          `At exactly 0:00, ${heroName} is already active in a grounded, motion-ready pose; ${others} remain visible and track ${object}. The visual question is clear in the first second, with no static introduction or neutral opening.`,
          `${others} visibly initiate ${action}; ${object} moves from its established supported starting position under a clear named force and continuous direction.`,
          `${heroName} anticipates, plants, accelerates, and responds with one clear action; cause and effect remain continuous while all selected characters remain in the readable camera composition.`,
          `Major middle escalation: ${object} reaches a stronger physically caused consequence, with readable collision response, follow-through, unchanged cast count, and no cut.`,
          `${ending}; ${heroName} and ${others} hold readable final reactions with fully settled support contact and match the end frame.`,
        ];
    return `${rangeLabel(start, end)} — ${actions[index]}`;
  }).join("\n");
  const musicLines = form.noMusic
    ? ""
    : ranges.slice(0, -1).map((start, index) => {
        const end = ranges[index + 1];
        const stage = index === 0
          ? "establish the motif quietly"
          : index === ranges.length - 2
            ? "resolve with a clean ending cadence"
            : index === ranges.length - 3
              ? "place one impact accent on the visible consequence"
              : "build intensity gradually under the action";
        return `${rangeLabel(start, end)} — ${form.musicType}; ${form.musicMood} mood; ${form.musicIntensity} intensity; ${stage}.`;
      }).join("\n");
  const temporarySoundOverrides = parseTemporarySoundOverrides(form.characterCartoonSoundGuidance, cast);
  const sfxLines = ranges.slice(0, -1).map((start, index) => {
    const end = ranges[index + 1];
    const description = index === 0
      ? `quiet environment tone and one clear source sound from ${object} or the first visible movement`
      : index === ranges.length - 2
        ? "one final settling sound sourced from the visible ending pose"
        : index === ranges.length - 3
          ? `one medium-intensity directional impact from the visible result of ${action}`
          : `selective ${form.soundEffectsStyle.toLowerCase()} tied only to visible footsteps, prop motion, or contact`;
    // Compatibility trace: cast[index % cast.length].shortName is the exact saved character-name owner.
    const soundOwner = cast[index % cast.length];
    const vocal = form.characterCartoonSounds && soundOwner
      ? ` ${buildCharacterSoundInstructions({
          activeCharacters: index === 0 ? cast : [soundOwner],
          timeRange: rangeLabel(start, end),
          visibleAction: description,
          selectedTones: form.tones,
          noSpokenDialogue: form.voiceLayers.includes("No Spoken Dialogue"),
          temporaryOverrides: temporarySoundOverrides,
        })}`
      : "";
    return `${rangeLabel(start, end)} — ${description}; match on-screen distance and direction; no random off-screen sound.${vocal}`;
  }).join("\n");
  const cartoonSoundRule = form.characterCartoonSounds
    ? ` Nonverbal character vocal sounds are allowed for checked characters only; exact-name ownership, visible-reaction synchronization, no off-screen unexplained voices, and no understandable words.${form.characterCartoonSoundGuidance.trim() ? ` Customer sound guidance: ${form.characterCartoonSoundGuidance.trim()}` : ""}`
    : " Nonverbal character vocal sounds are not requested.";
  const narrationRule = form.voiceLayers.includes("No Spoken Dialogue")
    ? `No understandable spoken dialogue, no narration, and no lip-sync. Communicate through poses, expressions, music, and synchronized sound.${cartoonSoundRule}`
    : `Voice layers: ${form.voiceLayers.join(", ")}. Language: ${form.language}. Vocal tone: ${form.vocalTone}. ${form.lipSyncRequired ? "Accurate lip-sync is required." : "Lip-sync is not required unless a selected speaker visibly speaks."} Narrator guidance: ${form.voiceLayers.includes("Narrator") ? form.narratorGuidance || "none" : "not enabled"}. Narration text: ${form.voiceLayers.includes("Narrator") ? form.narrationText || "none" : "not enabled"}. Character dialogue: ${form.voiceLayers.some((layer) => layer.includes("Voice")) ? form.characterDialogue || "none" : "not enabled"}. Character voice guidance: ${form.characterVoiceGuidance || "use the saved voice profiles."}.${cartoonSoundRule}`;
  const lock = `Model: ${model}
Model adapter: ${adapter.displayName}
Adapter structure: ${adapter.promptStructure}
Publishing platform: ${platform}
Duration: exactly ${duration} seconds
Video ratio: ${videoRatio}
Style: ${style}
Tone: ${tone}
Tone translation: ${toneProductionDirection(form)}
Tone and pace lock: ${toneRetentionDirection(form)}
Ultra Retention Mode: ${form.ultraRetentionMode ? "Enabled" : "Disabled"}
Motion level: ${form.motionLevel}
Exact character count: ${cast.length}
Exact identities: ${castNames}
Exact roles: ${castRoles}
Visibility ledger: ${ledger.map((state) => `${state.characterName}: start=${state.presentAtStart ? "visible" : "authorized entrance"}, default=${state.visibleByDefault ? "visible" : "authorized visibility exception"}, final=${state.finalPresence}`).join("; ")}
Concise identity locks:
${identities}
Selection rule: only these checked characters may appear. Do not include any unchecked saved character.
${visibilityLock}
${closedWorldLock}
Environment lock: ${location}; no unexplained location or background change.
Important-object lock: ${object}; show every movement from its established start position to its final position.
Object continuity lock: ${object} has one clear supported start position, moves only from a visible named force along a continuous path, and has one clear final supported position. No spawn, despawn, duplication, design drift, or unrequested transformation.
Object state ledger: ${objectLedger.map((state) => `${state.name}: start=${state.startPosition}; support=${state.supportOrHolder}; motion=${state.permittedMotion}; final=${state.finalPosition}`).join(" | ")}
Natural-motion lock: ${naturalMotionLock()}
Action ownership lock: every timeline beat names the exact character or exact object that moves, its direction, visible cause, physical result, and transition to the next beat. No vague “someone”, “they”, or ownerless motion.
Tone-from-zero lock: selected tones control the first visible frame at 0:00: opening pose, movement speed, expressions, camera, music, and sound have no neutral introductory period.
${form.tones.includes("Fast") ? `FAST-AT-0:00 LOCK: at exactly 0:00 ${heroName} has already begun the first planned motion, ${object} is visibly responding or about to respond, ${others} are visibly tracking it, and the camera is already framed wide for the action. No static hold, fade-in, title card, delayed movement, or slow establishing shot.` : ""}
Ground contact lock: ${physicalGroundingLock()}
Object support lock: Every ordinary object is visibly supported, held, attached, or moved by an established on-screen force; no floating object or unexplained direction change.
Gravity lock: ${airborneMotionRule(action)}
Smooth motion lock: ${smoothMotionLock()}
Retention lock: Open with visible action in the first second, use one dominant readable visual event per beat, create the major middle escalation around 50–65% of the duration, then reserve the ending for consequence, settled payoff, and a loop-ready final pose.
Reference continuity: follow the supplied start frame and complete the supplied end frame.
Camera rule: ${cameraRule}; no sudden cuts unless explicitly requested.
Cut and freeze rule: ${sceneInventory.allowCuts ? "Customer-authorized cuts must state an exact time and preserve complete inventory continuity." : "One continuous shot only; no sudden scene cut, jump cut, cutaway, angle replacement, reaction-shot cut, empty-scene cut, or camera teleport."} ${sceneInventory.allowIntentionalTensionHold ? "Use a living tension hold with breathing, eye tracking, posture tension, or object vibration; never a frozen frame." : "No freeze frame, midair freeze, long static hold, or motion stop without deceleration."}
Magical floating rule: ${sceneInventory.allowMagicalFloating ? "Only the explicitly customer-authorized magical effect may float, with visible source and complete traceability; ordinary characters remain grounded." : "No magical floating is authorized; all objects and characters obey normal support and gravity."}
Adapter camera policy: ${adapter.cameraPolicy}.
Adapter motion policy: ${adapter.motionPolicy}.
Adapter reference-frame policy: ${adapter.referenceFramePolicy}.
Identity lock: preserve colors, clothing, accessories, scale, proportions, faces, species, and roles. No duplicate characters, extra characters, substitutions, role swapping, morphing, teleportation, sudden appearances, sudden disappearances, random objects, or broken physical cause and effect.
Audio/voice rule: ${narrationRule}
Adapter audio policy: ${adapter.audioPolicy}.${form.additionalDirection.trim() ? `\nCustomer direction: ${form.additionalDirection.trim()}` : ""}`;
  const characterPrompts = cast.map((profile, index) => `CHARACTER ${index + 1} — ${profile.fullIdentity.toUpperCase()}
Role: ${profile.role}
${characterDescription(profile)}
Create a full-body front view, full-body side view, optional back view, neutral pose, and compact expression set. Lock exact colors, clothing, accessories, proportions, relative scale, face, species, and silhouette. Clean background. Image ratio: ${startRatio}. Visual style: ${style}. One character in this subsection only; no extra character, no duplicate body parts, no cropped anatomy, no text, no logo, no watermark.`).join("\n\n");
  void lock;
  const compactCast = cast.map((profile) => buildCompactCharacterLock(profile).split(".")[0]).join("\n");
  const conciseLock = `Create a ${duration}-second ${videoRatio} ${style} video for ${model} on ${platform}.
Model adapter: ${adapter.displayName}. Camera policy: ${adapter.cameraPolicy}.
Cast: exactly ${cast.length} characters — ${castRoles}. Exact character count: ${cast.length}.
Authorized object: exactly ${objectLedger.length} important object: ${object}. Location: ${location}.
CLOSED-WORLD CONTINUITY RULE. AUTHORIZED CAST: ${cast.map((profile) => `${profile.shortName} (${profile.role})`).join(", ")}. AUTHORIZED OBJECTS: exactly ${objectLedger.length} important object: ${object}. SCENE INVENTORY LOCK, EXACT COUNT LOCK, NO-SPAWN / NO-DESPAWN LOCK, STRICT OBJECT PRESENCE LOCK. No selected character may suddenly appear, disappear, spawn, vanish, or be replaced; no sudden appearances or disappearances.
OBJECT CONTINUITY LOCK: ${object} start=supported; final position=supported. One visible force and continuous path; no duplication, replacement, or sudden object.
One continuous shot only; no sudden cuts, scene reset, accidental crop-out, no random gestures, no random spinning, or gliding feet. Natural-motion lock and natural movement lock: anticipation, acceleration, contact, follow-through, deceleration, settling.
Tone: ${tone} from 0:00. Tone-from-zero lock. Ultra Retention Mode: ${form.ultraRetentionMode ? "Enabled" : "Disabled"}. STRICT PRESENCE LOCK. Action ownership lock. Natural movement lock. ${form.tones.includes("Fast") ? "FAST-AT-0:00 LOCK: named action is already active. ULTRA-FAST OPENING HOOK." : ""} ${form.tones.includes("Calm") && !extremeFastChaotic(form) ? "Use smooth controlled movement." : ""} ${form.voiceLayers.includes("No Spoken Dialogue") ? "No understandable spoken dialogue." : ""} Use supplied frames as continuity anchors.`;
  const conciseFinalRule = `This production contains exactly ${cast.length} characters — ${cast.map((profile) => profile.shortName).join(", ")} — and exactly ${objectLedger.length} important object — ${object}. No other character or object may appear. Use only authorized selected characters and objects established in the start frame. Preserve exact counts, identities, roles, colors, clothing, proportions, scale, and environment from start to finish.

NO duplicate characters. NO duplicate objects. NO additional characters or objects. NO unchecked characters, random props, substitutions, spawning, despawning, vanishing, materializing, fading, teleportation, position reset, scene reset, morphing, role swap. NO sudden cut. NO jump cut. NO sudden camera-angle replacement. NO unrequested freeze. NO frozen midair character or object. NO floating, hovering, gliding feet, pose snapping, unusual movement, ownerless movement, or unfinished motion.

PHYSICAL GROUNDING LOCK, OBJECT SUPPORT LOCK, and GRAVITY LOCK: every character and object has visible support and gravity; no unexplained hovering. Every character and object remains continuously traceable from exact start to exact final position through smooth preparation, anticipation, acceleration, contact, follow-through, deceleration, landing where required, and complete settling. ${form.tones.includes("Fast") ? "Fast action begins in the first visible frame at exactly 0:00; no static introduction, delayed trigger, neutral opening, or slow establishing shot." : ""} Customer-requested entrance, exit, transformation, destruction, cut, freeze, or magical floating must show the complete visible, physically traceable transition. Complete the planned payoff with every remaining authorized entity stable, visible, and supported.`;
  const sanitizedCharacterPrompts = removeUncheckedCharacters(characterPrompts);
  const generatedTitle = form.videoTitle.trim() ||
    `${heroName} and the ${form.objectName.trim() || "Impossible Backfire"}`;
  const adaptedTimeline = adapter.maxSingleClipSeconds && duration > adapter.maxSingleClipSeconds
    ? `SEGMENTED GENERATION PLAN — ${adapter.displayName} practical clip budget is approximately ${adapter.maxSingleClipSeconds} seconds. Generate chronological adjacent clips using the same reference locks, then join without a visual jump.\n${timelineLines}`
    : timelineLines;
  const extremeTimeline = extremeFastChaotic(form) && duration === 10 ? `0:00–0:00.7 — ${heroName} is already yanking ${object}; it responds at once while ${others} react with wide eyes.
0:00.7–0:01.7 — ${object} races along the established path; ${heroName} completes one rapid grounded pull-and-release.
0:01.7–0:03 — ${others} trigger ${action} through direct contact and shift defensively at the visible cause.
0:03–0:04.5 — ${heroName} redirects the same action in one fast continuous motion.
0:04.5–0:06 — Major midpoint backfire: ${object} drives the established consequence and ${others} react instantly.
0:06–0:07.5 — ${others} recover with rapid grounded steps while ${heroName} follows through.
0:07.5–0:09 — ${heroName} develops the payoff as ${object} visibly decelerates.
0:09–0:10 — ${ending}; short readable stable final pose.` : adaptedTimeline;
  const pacedExtremeTimeline = extremeFastChaotic(form) && duration === 5 ? `0:00–0:00.5 — ${heroName} is already yanking ${object}; it responds instantly as ${others} react.
0:00.5–0:01.2 — ${object} races along its established path through one rapid grounded action.
0:01.2–0:02.2 — ${others} trigger ${action} by direct visible contact.
0:02.2–0:03.2 — Major midpoint backfire: ${object} drives the consequence and ${others} react at once.
0:03.2–0:04.3 — ${heroName} redirects the same action in one fast continuous follow-through.
0:04.3–0:05 — ${ending}; stable readable final payoff.` : extremeFastChaotic(form) && duration === 15 ? `0:00–0:00.7 — ${heroName} is already yanking ${object}; it responds at once while ${others} react.
0:00.7–0:02 — ${object} races along the established path; ${heroName} completes a rapid grounded release.
0:02–0:03.5 — ${others} trigger ${action} through direct contact and react instantly.
0:03.5–0:05 — ${heroName} redirects the same action with rapid readable force.
0:05–0:06.5 — ${object} carries the connected action forward; ${others} recover in quick grounded steps.
0:06.5–0:08.5 — Major midpoint backfire: ${object} drives the visible consequence for ${others}.
0:08.5–0:10 — ${heroName} follows through while ${others} react immediately.
0:10–0:11.5 — ${object} visibly decelerates along its established path.
0:11.5–0:13 — ${heroName} develops the winning payoff in one continuous action.
0:13–0:14 — ${others} settle into the harmless consequence with clear reactions.
0:14–0:15 — ${ending}; short stable final payoff.` : extremeTimeline;
  const finalTimeline = extremeFastChaotic(form)
    ? pacedExtremeTimeline.replace(/^0:00/, `At exactly 0:00, ${heroName} begins the first second with immediate visible action; the camera holds a wide action view; no static opening or delayed trigger.\n0:00`).replace("Major midpoint backfire", "Major middle escalation and midpoint backfire")
    : pacedExtremeTimeline;
  const conciseStartFrame = `Create the opening reference image in ${startRatio}, ${style}, for ${adapter.displayName}. Cast: exactly ${cast.length} characters: ${compactCast.replace(/\n/g, "; ")}. Location: ${location}. Authorized object: exactly ${objectLedger.length} ${object}, visibly supported in the central action area. ${heroName} starts foreground-center facing it; ${supporting.map((profile, index) => `${profile.shortName} stands ${index % 2 === 0 ? "camera-left" : "camera-right"}, facing the action`).join("; ")}. Use a wide or medium-wide view, matching lens, contact shadows, contact with supporting surfaces, clear eye lines, and the first 0:00 motion cue. The first second is already active and motion-ready; do not show a completed payoff. This is the complete authorized scene inventory. Tone ${tone} is visible from frame zero. Use only this cast and object; nothing else appears.`;
  const conciseEndFrame = `Create the final reference image in ${endRatio}, ${style}, using the start-frame image as the primary continuity reference for ${adapter.displayName}. Use exactly the same ${cast.length} characters: ${compactCast.replace(/\n/g, "; ")}. Keep exactly the same environment, location, lighting, lens, scale, and same ${object}. ${ending}. ${heroName} finishes safe and smiling; ${supporting.map((profile, index) => `${profile.shortName} finishes ${index % 2 === 0 ? "camera-left" : "camera-right"} in a resolved ${profile.role.toLowerCase()} pose`).join("; ")}. Show the object in its supported final position, with contact shadows, visible support contact, a stable completed pose, completed settling, and matched camera perspective. Preserve the exact authorized inventory. Use only the authorized cast and object; nothing else appears.`;
  const generatedPack: ProductionPack = {
    videoTitle: generatedTitle,
    characterBuildingPrompt: form.includeCharacterBuildingPrompt ? sanitizedCharacterPrompts : "",
    startFramePrompt: conciseStartFrame,
    endFramePrompt: conciseEndFrame,
    videoLock: conciseLock,
    videoTimeline: finalTimeline,
    musicPath: musicLines,
    soundEffects: sfxLines,
    finalGenerationRule: conciseFinalRule + (form.voiceLayers.includes("No Spoken Dialogue") ? " No understandable spoken words." : ""),
  };
  return Object.fromEntries(
    Object.entries(generatedPack).map(([key, value]) => [key, removeUncheckedCharacters(value)]),
  ) as ProductionPack;
}

/** Applies deterministic, section-level Demo Mode corrections. The real
 * inspector is run again afterwards; this function never changes a score. */
export function repairDemoPack(
  pack: ProductionPack,
  form: ProductionForm,
  characters: CharacterProfile[],
  findings: QualityFinding[],
): ProductionPack {
  const failed = findings.filter((finding) => finding.status === "Failed").map((finding) => finding.label);
  if (!failed.length) return pack;
  const canonical = generateDemoPack(form, characters);
  const fields = new Set<keyof ProductionPack>();
  const add = (...keys: (keyof ProductionPack)[]) => keys.forEach((key) => fields.add(key));
  failed.forEach((label) => {
    if (/start-frame|beginning|frame perspective/i.test(label)) add("startFramePrompt");
    if (/end-frame|ending|frame perspective/i.test(label)) add("endFramePrompt");
    if (/audio|sound|voice/i.test(label)) add("musicPath", "soundEffects", "videoLock");
    if (/timeline|timing|opening|middle|motion|action|duration/i.test(label)) add("videoTimeline", "videoLock", "finalGenerationRule");
    if (/character|cast|identity|inventory|object|spawn|scene|camera|cut|teleport|gliding|ground|ratio|model|tone|natural/i.test(label)) add("videoLock", "finalGenerationRule", "startFramePrompt", "endFramePrompt");
  });
  const repaired = { ...pack };
  fields.forEach((field) => { repaired[field] = canonical[field]; });
  return repaired;
}

function parseRangesLegacy(text: string) {
  const matches = [...text.matchAll(/0:(\d{2})[–-]0:(\d{2})/g)];
  return matches.map((match) => ({ start: Number(match[1]), end: Number(match[2]) }));
}

function parseRanges(text: string) {
  const matches = [...text.matchAll(/0:(\d+(?:\.\d+)?).{1,3}0:(\d+(?:\.\d+)?)/g)];
  return matches.map((match) => ({ start: Number(match[1]), end: Number(match[2]) }));
}

void parseRangesLegacy;

export function inspectProductionPack(
  pack: ProductionPack,
  form: ProductionForm,
  characters: CharacterProfile[],
  savedTitles: string[] = [],
  creativeAssets: CreativeAsset[] = [],
): QualityReport {
  const rawActiveIds = form.activeCharacterIds || [form.heroId, ...form.selectedCharacterIds];
  const activeIds = [...new Set(rawActiveIds)];
  const cast = activeIds.map((id) => characters.find((profile) => profile.id === id))
    .filter((profile): profile is CharacterProfile => Boolean(profile));
  const hero = cast.find((profile) => profile.role === "Hero");
  const unchecked = characters.filter((profile) => !activeIds.includes(profile.id));
  const requiredVisuals = `${pack.startFramePrompt}\n${pack.endFramePrompt}\n${pack.videoLock}\n${pack.videoTimeline}`.toLowerCase();
  const all = Object.values(pack).join("\n").toLowerCase();
  const duration = Number(form.duration) || 15;
  const ranges = parseRanges(pack.videoTimeline);
  const musicRanges = parseRanges(pack.musicPath);
  const sfxRanges = parseRanges(pack.soundEffects);
  const noGaps = ranges.length > 0 && ranges[0].start === 0 &&
    ranges.every((range, index) => range.end > range.start &&
      (index === 0 || ranges[index - 1].end === range.start)) &&
    ranges[ranges.length - 1].end === duration;
  const finding = (
    label: string,
    pass: boolean,
    detail: string,
    warning = false,
  ): QualityFinding => ({
    label,
    status: pass ? "Passed" : warning ? "Warning" : "Failed",
    detail,
  });
  const cameraMentions = (pack.videoLock.match(/camera/gi) || []).length +
    (pack.videoTimeline.match(/camera/gi) || []).length;
  const promptLength = Object.values(pack).join(" ").length;
  const words = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;
  const startWords = words(pack.startFramePrompt);
  const endWords = words(pack.endFramePrompt);
  const completeWords = words(completeVideoPrompt(pack));
  const adapter = selectedModelAdapter(form);
  const pacingProfile = motionPacingProfile(form);
  const inventory = buildAuthorizedSceneInventory(form, cast);
  const objectStates = buildObjectStateLedger(inventory);
  const findings: QualityFinding[] = [
    finding("Extreme Fast-Chaotic motion pacing", !extremeFastChaotic(form) || (
      /extreme speed lock/i.test(pack.videoLock) &&
      /^0:00.{1,3}0:00\.7/m.test(pack.videoTimeline) &&
      !pacingProfile.forbiddenPacingLanguage.some((term) => pack.videoTimeline.toLowerCase().includes(term))
    ), "Fast + Chaotic slapstick needs frame-zero movement, compressed beats, and no slow pacing language."),
    finding("Video title exists", pack.videoTitle.trim().length >= 3, "Add a clear original video title."),
    finding("Video title is original in saved history", !savedTitles.some((title) =>
      title.trim().toLowerCase() === pack.videoTitle.trim().toLowerCase()), "Choose a title not already used by a saved production.", true),
    finding("Creative inputs are complete", Boolean(form.location.trim() && form.importantObject.trim() && form.trapAction.trim() && form.endingPayoff.trim()), "Location, object, action, and payoff are required."),
    finding("Latest Creative Library records are used", (["location", "object", "action", "payoff"] as const).every((kind) => {
      const id = form[`${kind === "object" ? "object" : kind === "action" ? "action" : kind === "payoff" ? "payoff" : "location"}AssetId`];
      if (!id) return true;
      const asset = creativeAssets.find((item) => item.id === id);
      const description = kind === "location" ? form.location : kind === "object" ? form.importantObject : kind === "action" ? form.trapAction : form.endingPayoff;
      return !asset || asset.description === description;
    }), "Selected saved assets must resolve to their latest descriptions."),
    finding("Exactly one valid hero", Boolean(hero && hero.role === "Hero" && cast.filter((profile) => profile.role === "Hero").length === 1), "The production must have exactly one main Hero."),
    finding("At least one active character", cast.length > 0, "Select at least one character for this production."),
    finding("Unique active character IDs", rawActiveIds.length === activeIds.length, "Remove duplicate active character IDs."),
    finding("Only valid character roles", cast.every((profile) => ["Hero", "Companion", "Enemy"].includes(profile.role)), "Active roles must be Hero, Companion, or Enemy."),
    finding("Every character has a description", cast.every((profile) => characterDescription(profile).length > 40), "Every active character needs a reusable description."),
    finding("All selected characters appear", cast.every((profile) =>
      requiredVisuals.includes(profile.shortName.toLowerCase())), "Every selected identity must appear in the frame and video instructions."),
    finding("Unchecked characters are excluded", unchecked.every((profile) =>
      !requiredVisuals.includes(profile.fullIdentity.toLowerCase()) &&
      !requiredVisuals.includes(profile.shortName.toLowerCase())), "Unchecked saved characters must not appear in generated prompts."),
    finding("Strict cast presence lock", /strict presence lock/.test(pack.videoLock.toLowerCase()) && cast.every((profile) =>
      pack.startFramePrompt.toLowerCase().includes(profile.shortName.toLowerCase()) && pack.endFramePrompt.toLowerCase().includes(profile.shortName.toLowerCase())), "All active characters must be present at both reference frames and locked through the video."),
    finding("No spawn or despawn wording", !/\b(?:spawn|despawn|suddenly appears?|suddenly disappears?|vanishes?|reappears?)\b/.test(`${pack.videoTimeline}\n${pack.startFramePrompt}\n${pack.endFramePrompt}`.toLowerCase()) && /no selected character may suddenly appear, disappear, spawn, vanish/.test(pack.videoLock.toLowerCase()), "Remove spawn, vanish, sudden appearance, and unexplained reappearance wording."),
    finding("Important object continuity", pack.startFramePrompt.toLowerCase().includes(form.importantObject.toLowerCase()) && pack.endFramePrompt.toLowerCase().includes(form.importantObject.toLowerCase()) && /object continuity lock/.test(pack.videoLock.toLowerCase()), "The important object needs visible start and final positions with a continuous path."),
    finding("Action ownership and traceability", /action ownership lock/.test(pack.videoLock.toLowerCase()) && ranges.every((range) => range.start >= 0 && range.end > range.start) && /at exactly 0:00|0:00/.test(pack.videoTimeline.toLowerCase()), "Every beat must name an owner, cause, result, and transition from 0:00."),
    finding("Natural-motion filter", /natural movement lock/.test(all) && /no random gestures/.test(all) && /no random.*spin/.test(all) && !/\brandomly\s+(?:spins?|jumps?|waves?|dances?|gestures?)\b/.test(pack.videoTimeline.toLowerCase()), "Explicitly prohibit random gestures, spinning, jumping, and unrelated movement."),
    finding("Tone from frame zero", /tone-from-zero lock/.test(pack.videoLock.toLowerCase()) && form.tones.every((tone) => pack.startFramePrompt.toLowerCase().includes(tone.toLowerCase()) || pack.videoLock.toLowerCase().includes(tone.toLowerCase())), "Selected tones must control the start frame and first action at 0:00."),
    finding("Fast begins at exactly 0:00", !form.tones.includes("Fast") || (/fast-at-0:00 lock/.test(pack.videoLock.toLowerCase()) && /at exactly 0:00/.test(pack.videoTimeline.toLowerCase())), "Fast tone needs named active movement at exactly 0:00 with no static opening."),
    finding("Camera keeps active cast visible", /wide or medium-wide/.test(`${pack.startFramePrompt}\n${pack.endFramePrompt}\n${pack.videoLock}`.toLowerCase()) && /no accidental crop-out|camera-caused disappearance/.test(all), "Use a continuous wide or medium-wide view that does not lose active characters."),
    finding("Compact locks match both frames", cast.every((profile) => {
      const identity = profile.fullIdentity.toLowerCase();
      return pack.startFramePrompt.toLowerCase().includes(identity) && pack.endFramePrompt.toLowerCase().includes(identity);
    }), "Every active full identity and compact lock must appear in both reference frames."),
    finding("Exact names drive the timeline", cast.every((profile) =>
      pack.videoTimeline.toLowerCase().includes(profile.shortName.toLowerCase())), "Use exact active character names in the timeline."),
    finding("Character count is consistent", pack.videoLock.toLowerCase().includes(`exact character count: ${cast.length}`), `Expected exactly ${cast.length} characters.`),
    finding("Closed-world scene inventory", /closed-world continuity rule/.test(pack.videoLock.toLowerCase()) && /authorized cast:/.test(pack.videoLock.toLowerCase()) && /authorized objects:/.test(pack.videoLock.toLowerCase()), "List the exact cast, objects, fixed environment, and forbidden additions."),
    finding("Exact inventory counts", /exact count lock/.test(pack.videoLock.toLowerCase()) && pack.videoLock.toLowerCase().includes(`exactly ${cast.length} characters`) && pack.videoLock.toLowerCase().includes(`exactly ${objectStates.length} important object`), "State exact active-character and important-object counts."),
    finding("No unauthorized scene entity", !/\b(?:new prop|extra prop|mysterious item|new obstacle|unauthorized object)\b/.test(`${pack.startFramePrompt}\n${pack.endFramePrompt}\n${pack.videoTimeline}`.toLowerCase()), "FAILED — Unauthorized scene entity introduced. Use only the authorized inventory."),
    finding("Object state ledger is complete", objectStates.every((state) => pack.videoLock.includes(state.name) && /start=|starting position/.test(pack.videoLock) && /final=|final position/.test(pack.videoLock)), "Every important object needs start position, support/cause, continuous path, and final position."),
    finding("No scene reset between ranges", /no scene reset/.test(pack.videoLock.toLowerCase()) && /transition/.test(pack.videoTimeline.toLowerCase()), "Each range must inherit the previous range’s entity state with no reset."),
    finding("No sudden cuts or freezes", /one continuous shot only|no sudden cuts/.test(pack.videoLock.toLowerCase()) && /no freeze frame|living tension hold/.test(pack.videoLock.toLowerCase()), "Prohibit cuts and freezes unless customer-authorized with continuity."),
    finding("Duplicate-character prohibition", /no duplicate/.test(all), "The pack must explicitly forbid duplicates."),
    finding("Sudden-appearance prohibition", /no sudden appearances|sudden appearances/.test(all), "The pack must forbid sudden appearances."),
    finding("Sudden-disappearance prohibition", /no sudden disappearances|sudden disappearances/.test(all), "The pack must forbid sudden disappearances."),
    finding("Teleportation prohibition", /no teleportation|teleport/.test(all), "The pack must forbid teleportation."),
    finding("Start-frame ratio", pack.startFramePrompt.includes(ratioLabel(form.startFrameRatio, form.startCustomWidth, form.startCustomHeight)), "Start-frame ratio must match the selected value."),
    finding("End-frame ratio", pack.endFramePrompt.includes(ratioLabel(form.endFrameRatio, form.endCustomWidth, form.endCustomHeight)), "End-frame ratio must match the selected value."),
    finding("Video ratio", pack.videoLock.includes(ratioLabel(form.videoRatio, form.videoCustomWidth, form.videoCustomHeight)), "Video ratio must match the selected value."),
    finding("Full duration covered", ranges.length > 0 && ranges[ranges.length - 1].end === duration, `Timeline must end at ${duration} seconds.`),
    finding("No timing gaps", noGaps, "Video ranges must be chronological, continuous, and non-overlapping."),
    finding("No timing contradictions", ranges.every((range) => range.end <= duration), "No range may extend beyond the selected duration."),
    finding("Motion complexity matches duration", duration > 15 || ranges.length <= 4, "Short videos should use one setup, one action, one consequence, and one ending.", true),
    finding("Camera instructions are controlled", cameraMentions <= 5 && !/multiple cuts|rapid cuts|fast cuts/i.test(all), "Use no more than one meaningful camera move for short productions.", true),
    finding("Audio matches visible action", form.noMusic
      ? pack.musicPath.trim() === ""
      : musicRanges.length > 0 && sfxRanges.length > 0 && /visible|on-screen|source/.test(pack.soundEffects.toLowerCase()), "Audio timing and sources must follow visible events."),
    finding("Beginning is clearly defined", /starts|begins|opening|initial/.test(`${pack.startFramePrompt} ${pack.videoTimeline}`.toLowerCase()), "Define starting pose, position, and first action."),
    finding("Ending is clearly defined", /final|ending|finishes|resolve/.test(`${pack.endFramePrompt} ${pack.videoTimeline}`.toLowerCase()), "Define the final position, reaction, and payoff."),
    finding("Prompt length is reasonable", promptLength >= 1200 && promptLength <= 14000, `Combined prompt length is ${promptLength} characters.`, true),
    finding("Character identities match", cast.every((profile) =>
      all.includes(profile.fullIdentity.toLowerCase())), "Use the latest full identities consistently across all outputs."),
    finding("Selected tones are reflected", form.tones.every((tone) =>
      tone === "Custom"
        ? all.includes(form.customTone.toLowerCase())
        : all.includes(tone.toLowerCase())), "Every selected tone must influence pace, staging, expressions, camera, motion, or audio."),
    finding("Model adapter is applied", all.includes(`model adapter: ${selectedModelAdapter(form).displayName.toLowerCase()}`) &&
      all.includes(selectedModelAdapter(form).cameraPolicy.toLowerCase()), "The selected model must materially control prompt structure and camera policy."),
    finding("Voice layers are compatible", form.voiceLayers.includes("No Spoken Dialogue")
      ? form.voiceLayers.length === 1 && /no understandable spoken|no spoken dialogue/.test(all)
      : !form.voiceLayers.includes("No Spoken Dialogue"), "No Spoken Dialogue cannot coexist with spoken layers."),
    finding("Character Cartoon Sounds setting", form.characterCartoonSounds
      ? cast.every((profile) => pack.soundEffects.toLowerCase().includes(profile.shortName.toLowerCase())) &&
        /no understandable words/.test(`${pack.soundEffects} ${pack.videoLock}`.toLowerCase()) &&
        !/["“][^"”]+["”]/.test(pack.soundEffects) &&
        !/squeak|grunt|yelp|gasp|chuckle|nonverbal/.test(pack.musicPath.toLowerCase())
      : !/character vocal sounds are allowed/.test(pack.videoLock.toLowerCase()),
    "Assign nonverbal sounds only to exact active names, visible reactions, and SOUND EFFECTS; never Music Path or spoken quotation."),
    finding("Universal character sound ownership", !form.characterCartoonSounds || cast.every((profile) =>
      pack.soundEffects.includes(profile.shortName) &&
      !characters.filter((candidate) => !activeIds.includes(candidate.id))
        .some((inactive) => pack.soundEffects.includes(inactive.shortName))), "Every character sound must use an exact active name; remove inactive or off-screen voice sources."),
    finding("Saved sound identities are respected", !form.characterCartoonSounds || cast.every((profile) => {
      const identity = resolveCharacterAudioIdentity(profile);
      const distinctiveTerms = identity.toLowerCase().split(/\W+/).filter((word) => word.length > 6).slice(0, 3);
      return distinctiveTerms.length === 0 || distinctiveTerms.some((term) => pack.soundEffects.toLowerCase().includes(term));
    }), "Use each active character’s saved nonverbal sound profile or the neutral fallback; never transfer one character’s identity to another.", true),
    finding("No unsupported species-sound stereotype", !/(?:bark|meow|roar)/i.test(pack.soundEffects) ||
      cast.some((profile) => new RegExp("(?:bark|meow|roar)", "i").test(`${profile.description} ${profile.nonverbalSoundProfile}`)),
    "Species-specific sounds require support in the same active character’s saved description or sound profile."),
    finding("Grounding and support lock", /physical grounding lock|ground contact lock/.test(all) && /support/.test(all) && /gravity/.test(all), "Include clear ground contact, object support, and gravity rules."),
    finding("No unexplained floating", !/\b(?:unexplained )?(?:character|object|prop)?\s*(?:hovers?|floats?|floating|drifts?)\b/.test(pack.videoTimeline.toLowerCase()) && /no unexplained hovering|nothing hovers/.test(all), "Remove floating language and keep the no-hovering constraint."),
    finding("Smooth motion phases", /anticipation/.test(all) && /accelerat/.test(all) && /follow-through/.test(all) && /settling/.test(all), "Define anticipation, acceleration, follow-through, and settling."),
    finding("No gliding rule", /no snapping.*gliding|no gliding/.test(all), "Explicitly prohibit gliding feet and snapping."),
    finding("Immediate active opening hook", /first second|first frame|opening hook|already active/.test(`${pack.startFramePrompt} ${pack.videoTimeline}`.toLowerCase()) && !/static introduction/.test(pack.videoTimeline.toLowerCase()), "Open with an active visual question in the first second."),
    finding("Major middle escalation", /major middle escalation/.test(pack.videoTimeline.toLowerCase()), "Place a physically caused escalation around the middle of the duration."),
    finding("Completed grounded ending", /settled|settling|stable completed pose/.test(`${pack.endFramePrompt} ${pack.videoTimeline}`.toLowerCase()) && /support contact|ground or support/.test(pack.endFramePrompt.toLowerCase()), "End on a supported, settled, physically resolved payoff."),
    finding("Ultra Retention Mode is respected", !form.ultraRetentionMode || /retention scheduler enabled|ultra-fast opening hook/.test(all), "When enabled, include active hook, micro-beats, middle escalation, and settled payoff."),
    finding("Frame perspective continuity", /lens|perspective/.test(pack.startFramePrompt.toLowerCase()) &&
      /lens|perspective/.test(pack.endFramePrompt.toLowerCase()), "Start and end frames need compatible lens and perspective."),
    finding("Frame prompt length budget", startWords >= 100 && startWords <= 320 && endWords >= 100 && endWords <= 320, `Start frame: ${startWords} words; end frame: ${endWords} words.`, true),
    finding("Complete prompt length budget", completeWords <= 850, `Complete prompt is ${completeWords} words; prefer approximately 700 or fewer when continuity remains safe.`, true),
    finding("Model duration fit", !adapter.maxSingleClipSeconds || duration <= adapter.maxSingleClipSeconds ||
      /segment|clip/i.test(pack.videoTimeline), `${adapter.displayName} durations above ${adapter.maxSingleClipSeconds || duration} seconds need a segmented plan.`, true),
  ];
  const score = Math.round(
    findings.reduce((total, item) =>
      total + (item.status === "Passed" ? 1 : item.status === "Warning" ? 0.5 : 0), 0) /
    findings.length * 100,
  );
  return { score, findings };
}

export function completeVideoPrompt(pack: ProductionPack) {
  return `VIDEO TITLE
${pack.videoTitle}

VIDEO LOCK
${pack.videoLock}

SECOND-BY-SECOND VIDEO ACTION
${pack.videoTimeline}

MUSIC PATH
${pack.musicPath || "No music."}

SOUND EFFECTS
${pack.soundEffects}

FINAL GENERATION RULE
${pack.finalGenerationRule}`;
}

export function visualVideoPrompt(pack: ProductionPack) {
  const visualLock = pack.videoLock
    .split("\n")
    .filter((line) => !/^(Audio\/voice rule|Adapter audio policy):/i.test(line.trim()))
    .join("\n");
  return `VIDEO LOCK
${visualLock}

SECOND-BY-SECOND VIDEO ACTION
${pack.videoTimeline}

FINAL GENERATION RULE
${pack.finalGenerationRule}`;
}

export function audioVideoPrompt(pack: ProductionPack) {
  return `MUSIC PATH
${pack.musicPath || "No music."}

SOUND EFFECTS
${pack.soundEffects}`;
}
