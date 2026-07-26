import {
  CharacterProfile,
  CreativeDirectionState,
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
  defaultCreativeDirection,
  fieldsForRequestedOutputs,
  motionQualityRuleIds,
  requestedOutputValues,
  ruleChipIds,
} from "./production-types";

const previewStyleQuality = (id?: ProductionForm["videoStyleId"]) => {
  const checks: Record<string, { name: string; qualityChecks: string[] }> = {
    slapstick: { name: "Slapstick", qualityChecks: ["Immediate hook", "Physical cause and effect", "Readable reaction", "Harmless payoff"] },
    cinematic: { name: "Cinematic", qualityChecks: ["Lens consistency", "Lighting direction", "Shot composition", "Emotional pacing"] },
    "family-3d": { name: "Family 3D Animation", qualityChecks: ["Appealing proportions", "Readable expressions", "Smooth motion", "Family-friendly tone"] },
    anime: { name: "Anime", qualityChecks: ["Pose clarity", "Expression intensity", "Effect control", "Action readability"] },
    "live-action": { name: "Realistic Live Action", qualityChecks: ["Anatomy realism", "Wardrobe continuity", "Natural acting", "Believable light"] },
    "cgi-fantasy": { name: "CGI Fantasy", qualityChecks: ["Magical logic", "Creature continuity", "Environment scale", "Effect traceability"] },
    "stylized-3d": { name: "Stylized 3D Cartoon", qualityChecks: ["Shape consistency", "Stylized proportions", "Palette continuity", "Controlled exaggeration"] },
  };
  return checks[id || "slapstick"] || checks.slapstick;
};

const stringValue = (value: unknown, fallback = "") =>
  typeof value === "string" ? value.trim() : fallback;

const boolValue = (value: unknown, fallback: boolean) =>
  typeof value === "boolean" ? value : fallback;

// Keep these resolvers local because the engine is also loaded as a standalone
// module by export workers and the deterministic prompt test harness.
const engineDirectionOptions = {
  visualMood: [
    ["bright-colorful", "Bright & Colorful", "Bright lighting, vivid colors, cheerful atmosphere, and clear visual contrast."],
    ["dark-cinematic", "Dark & Cinematic", "Deep shadows, dramatic contrast, controlled highlights, and a serious cinematic tone."],
    ["warm-magical", "Warm & Magical", "Warm lighting, gentle glow, rich color harmony, and an inviting magical atmosphere."],
    ["soft-dreamy", "Soft & Dreamy", "Soft light, delicate colors, gentle contrast, and an ethereal dreamlike feeling."],
    ["cool-moody", "Cool & Moody", "Cool color temperature, atmospheric shadows, restrained highlights, and a reflective mood."],
    ["epic-dramatic", "Epic & Dramatic", "Powerful lighting, bold contrast, heightened scale, and strong dramatic atmosphere."],
    ["futuristic-neon", "Futuristic Neon", "Neon accents, reflective surfaces, bold contrast, and a futuristic high-tech atmosphere."],
    ["natural-realistic", "Natural & Realistic", "Natural lighting, believable colors, realistic atmosphere, and restrained visual styling."],
    ["minimal-clean", "Minimal & Clean", "Simple composition, controlled colors, clean lighting, and minimal visual distraction."],
  ],
  cameraStyle: [
    ["smooth-cinematic", "Smooth Cinematic", "Smooth tracking, stable framing, gentle push-ins, and polished cinematic movement."],
    ["dynamic-energetic", "Dynamic & Energetic", "Active tracking, responsive reframing, and energetic camera movement."],
    ["locked-stable", "Locked & Stable", "Fixed or highly controlled framing with minimal camera movement."],
    ["character-follow", "Character Follow", "The camera follows the main character while preserving visibility and screen direction."],
    ["slow-push-in", "Slow Push-In", "A gradual camera move toward the subject to create emphasis or anticipation."],
    ["orbit-subject", "Orbit Around Subject", "The camera moves smoothly around the focal subject while keeping it clearly framed."],
    ["handheld-realistic", "Handheld Realistic", "Subtle natural camera movement with restrained realistic shake."],
    ["fast-action-camera", "Fast Action Camera", "Responsive tracking and energetic reframing for fast movement and action."],
    ["overhead-top-down", "Overhead / Top-Down", "Elevated framing that clearly presents spatial movement and scene layout."],
  ],
  framing: [
    ["automatic", "Automatic", "Let the AI choose and adjust framing based on the scene and action."],
    ["wide-shot", "Wide Shot", "Show the environment, characters, and full spatial relationship clearly."],
    ["medium-shot", "Medium Shot", "Balance character performance with enough visible environmental context."],
    ["close-up", "Close-Up", "Prioritize facial expressions, reactions, and important visual detail."],
    ["full-body", "Full Body", "Keep the complete character body visible for physical action and movement."],
    ["over-the-shoulder", "Over-the-Shoulder", "Frame interaction from behind or beside one subject toward another."],
  ],
  subjectMotion: [
    ["natural-controlled", "Natural & Controlled", "Believable character and object motion with controlled timing and weight."],
    ["smooth-cinematic", "Smooth & Cinematic", "Polished subject movement with fluid transitions and restrained physical performance."],
    ["fast-energetic", "Fast & Energetic", "Quick, active subject movement with continuous energy and clear direction."],
    ["exaggerated-comedic", "Exaggerated & Comedic", "Amplified poses, reactions, timing, and physical comedy while preserving readability."],
    ["realistic-physical", "Realistic Physical Motion", "Weight, momentum, balance, contact, and object interaction should remain physically believable."],
  ],
  pacingStyle: [
    ["fast-energetic", "Fast & Energetic", "Quick pacing, high character energy, strong reactions, and continuous visual movement."],
    ["calm-emotional", "Calm & Emotional", "Gentle pacing, expressive emotional beats, restrained movement, and clear character focus."],
    ["exaggerated-comedic", "Exaggerated & Comedic", "Bold reactions, amplified timing, expressive performance, and clear comedic escalation."],
    ["slow-suspenseful", "Slow & Suspenseful", "Controlled pacing, delayed reveals, rising tension, and deliberate performance beats."],
    ["natural-realistic", "Natural & Realistic", "Believable timing, restrained acting, natural reactions, and realistic movement."],
    ["epic-dramatic", "Epic & Dramatic", "Strong dramatic beats, powerful movement, heightened performance, and cinematic escalation."],
    ["gentle-family-friendly", "Gentle & Family-Friendly", "Clear pacing, warm expressions, readable actions, and soft family-friendly performance."],
    ["steady-informational", "Steady & Informational", "Clear structured pacing, controlled delivery, and an easy-to-follow visual progression."],
    ["gradual-build", "Gradual Build", "A measured opening that steadily increases energy and intensity toward the final payoff."],
  ],
} as const;

const engineMotionRulePrompts: Record<string, string> = {
  "smooth-continuous-movement": "Keep camera, character, and object motion smooth and continuous.",
  "no-sudden-camera-jumps": "Do not introduce sudden camera jumps or unexplained reframing.",
  "no-unrequested-cuts": "Do not add cuts unless explicitly required by the selected production structure.",
  "preserve-screen-direction": "Preserve consistent screen direction and spatial continuity.",
  "keep-characters-visible": "Keep all selected characters visible whenever required by the scene action.",
  "realistic-ground-contact": "Maintain realistic foot placement, body balance, and ground contact.",
  "avoid-floating-sliding": "Prevent characters and objects from floating, drifting, or sliding unnaturally.",
  "objects-physically-connected": "Keep held, attached, or interacting objects physically connected to the correct character or surface.",
  "match-motion-to-pacing": "Match camera and subject movement speed to the selected pacing and performance style.",
};

const engineRuleChipText: Record<string, string> = {
  "no-dialogue": "No dialogue.",
  "no-sudden-cuts": "No sudden cuts.",
  "characters-visible": "Keep all selected characters visible.",
  "maintain-identity": "Maintain character identity and appearance consistency.",
  "family-friendly": "Keep all content family-friendly.",
  "seamless-loop": "End with a seamless loop.",
};

function resolveEngineDirection(value: string, custom: string, options: readonly (readonly [string, string, string])[]) {
  if (value === "custom") return custom.trim();
  const option = options.find(([id]) => id === value);
  return option ? `${option[1]}: ${option[2]}` : "";
}

function resolveCreativeDirection(state: CreativeDirectionState) {
  const camera = state.cameraMotion;
  return {
    visualMood: resolveEngineDirection(state.visualMood, state.visualMoodCustom, engineDirectionOptions.visualMood),
    cameraMotion: {
      cameraStyle: resolveEngineDirection(camera.cameraStyle, camera.cameraStyleCustom, engineDirectionOptions.cameraStyle),
      customInstructions: camera.cameraCustomInstructions.trim(),
      framing: resolveEngineDirection(camera.framing, "", engineDirectionOptions.framing),
      movementIntensity: camera.movementIntensity,
      cameraStability: camera.cameraStability,
      subjectMotion: resolveEngineDirection(camera.subjectMotion, camera.subjectMotionCustom, engineDirectionOptions.subjectMotion),
      qualityRules: camera.motionQualityRuleIds.flatMap((id) => engineMotionRulePrompts[id] ? [engineMotionRulePrompts[id]] : []),
    },
    pacingStyle: resolveEngineDirection(state.pacingStyle, state.pacingStyleCustom, engineDirectionOptions.pacingStyle),
    creativeRules: [state.creativeRulesManual.trim(), ...state.selectedRuleChipIds.map((id) => engineRuleChipText[id]).filter(Boolean)].filter(Boolean).join(" "),
  };
}

function migrateCreativeDirection(value: unknown): CreativeDirectionState {
  const item = value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
  const camera = item.cameraMotion && typeof item.cameraMotion === "object" && !Array.isArray(item.cameraMotion)
    ? item.cameraMotion as Record<string, unknown>
    : item;
  const defaults = defaultCreativeDirection;
  const valid = (candidate: unknown, options: readonly (readonly [string, string, string])[], fallback: string) =>
    typeof candidate === "string" && (candidate === "custom" || options.some(([id]) => id === candidate)) ? candidate : fallback;
  return {
    visualMood: valid(item.visualMood, engineDirectionOptions.visualMood, defaults.visualMood) as CreativeDirectionState["visualMood"],
    visualMoodCustom: stringValue(item.visualMoodCustom).slice(0, 200),
    cameraMotion: {
      cameraStyle: valid(camera.cameraStyle, engineDirectionOptions.cameraStyle, defaults.cameraMotion.cameraStyle) as CreativeDirectionState["cameraMotion"]["cameraStyle"],
      cameraStyleCustom: stringValue(camera.cameraStyleCustom).slice(0, 200),
      cameraCustomInstructions: stringValue(camera.cameraCustomInstructions).slice(0, 300),
      framing: valid(camera.framing, engineDirectionOptions.framing, defaults.cameraMotion.framing) as CreativeDirectionState["cameraMotion"]["framing"],
      movementIntensity: ["subtle", "balanced", "dynamic"].includes(String(camera.movementIntensity)) ? camera.movementIntensity as CreativeDirectionState["cameraMotion"]["movementIntensity"] : defaults.cameraMotion.movementIntensity,
      cameraStability: ["stable", "natural", "expressive"].includes(String(camera.cameraStability)) ? camera.cameraStability as CreativeDirectionState["cameraMotion"]["cameraStability"] : defaults.cameraMotion.cameraStability,
      subjectMotion: valid(camera.subjectMotion, engineDirectionOptions.subjectMotion, defaults.cameraMotion.subjectMotion) as CreativeDirectionState["cameraMotion"]["subjectMotion"],
      subjectMotionCustom: stringValue(camera.subjectMotionCustom).slice(0, 200),
      motionQualityRuleIds: Array.isArray(camera.motionQualityRuleIds)
        ? camera.motionQualityRuleIds.filter((id): id is CreativeDirectionState["cameraMotion"]["motionQualityRuleIds"][number] =>
            typeof id === "string" && motionQualityRuleIds.includes(id as CreativeDirectionState["cameraMotion"]["motionQualityRuleIds"][number]))
        : [...defaults.cameraMotion.motionQualityRuleIds],
    },
    pacingStyle: valid(item.pacingStyle, engineDirectionOptions.pacingStyle, defaults.pacingStyle) as CreativeDirectionState["pacingStyle"],
    pacingStyleCustom: stringValue(item.pacingStyleCustom).slice(0, 200),
    creativeRulesManual: stringValue(item.creativeRulesManual, stringValue(item.creativeRules)).slice(0, 300),
    selectedRuleChipIds: Array.isArray(item.selectedRuleChipIds)
      ? item.selectedRuleChipIds.filter((id): id is CreativeDirectionState["selectedRuleChipIds"][number] =>
          typeof id === "string" && ruleChipIds.includes(id as CreativeDirectionState["selectedRuleChipIds"][number]))
      : [],
  };
}

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
    pacingPolicy: `${base.pacingPolicy}; apply the selected Creative Direction pacing and performance from frame zero`,
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
  creativeDirection,
  noSpokenDialogue,
  temporaryOverrides = {},
}: {
  activeCharacters: CharacterProfile[];
  timeRange: string;
  visibleAction: string;
  creativeDirection: string;
  noSpokenDialogue: boolean;
  temporaryOverrides?: Record<string, string>;
}) {
  if (!activeCharacters.length) return "";
  return activeCharacters.map((character) => {
    const identity = resolveCharacterAudioIdentity(character, temporaryOverrides[character.id] || "");
    return `${timeRange} — ${character.shortName}: when the visible action “${visibleAction}” produces a useful reaction, use one concise nonverbal reaction adapted from this identity: ${identity} ${noSpokenDialogue ? "No spoken words." : "Do not add speech unless an enabled voice layer assigns it."} Creative Direction context: ${creativeDirection}.`;
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
    creativeDirection: migrateCreativeDirection(item.creativeDirection),
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
    ultraRetentionMode: boolValue(item.ultraRetentionMode, true),
    motionLevel: item.motionLevel === "Safe" || item.motionLevel === "Ambitious"
      ? item.motionLevel
      : "Balanced",
    videoRatio: stringValue(item.videoRatio, stringValue(item.ratio, defaultProductionForm.videoRatio)).split(" ")[0],
    videoCustomWidth: stringValue(item.videoCustomWidth),
    videoCustomHeight: stringValue(item.videoCustomHeight),
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
    const requestedOutputs = Array.isArray(item.requestedOutputs)
      ? [...new Set(item.requestedOutputs.filter((output): output is RequestedOutput =>
          typeof output === "string" && requestedOutputValues.includes(output as RequestedOutput)))]
      : generatedOutputs;
    const customRequestedOutputs = Array.isArray(item.customRequestedOutputs)
      ? [...new Set(item.customRequestedOutputs.filter((output): output is RequestedOutput =>
          typeof output === "string" && requestedOutputValues.includes(output as RequestedOutput)))]
      : requestedOutputs;
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
      outputSelectionMode: item.outputSelectionMode === "fullPack"
        ? "fullPack"
        : item.outputSelectionMode === "custom"
          ? "custom"
          : generatedOutputs.length === requestedOutputValues.length
            ? "fullPack"
            : "custom",
      customRequestedOutputs,
      requestedOutputs,
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

function creativePacingDirection(form: ProductionForm) {
  const creative = resolveCreativeDirection(form.creativeDirection);
  const opening = form.ultraRetentionMode
    ? "Retention scheduler enabled: begin with a readable first-frame visual hook, use one dominant visual event per beat, create a physically caused escalation around 50–65% of the duration, and complete the final payoff with settling"
    : "Retention scheduler is relaxed: keep the opening active and the ending complete";
  return `${creative.pacingStyle}. ${opening}. Apply this pacing and performance direction to movement, expressions, camera timing, music, and sound from the first frame.`;
}

function airborneMotionRule(action: string) {
  return `If ${action} requires a jump, launch, bounce, fall, or thrown object, show the visible trigger, launch direction and force, one continuous gravity-driven arc, brief peak, descent, landing surface, impact absorption, follow-through, and complete settling; otherwise keep every character and object supported.`;
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

export function deriveScenePlan(form: ProductionForm, heroName = "The Hero") {
  const creative = resolveCreativeDirection(form.creativeDirection);
  const concept = form.videoTitle.trim() || "the selected video concept";
  return {
    location: `a coherent, production-ready setting derived from “${concept},” with ${creative.visualMood}`,
    importantObject: `one clearly identifiable supporting story object derived from “${concept}”`,
    mainAction: `${heroName} leads a clear cause-and-effect action progression derived from the concept, cast, and ${creative.pacingStyle}`,
    endingPayoff: `${heroName} completes a relevant, safe ending/payoff that resolves “${concept}” and supports a replayable finish`,
    creative,
  };
}

export function buildAuthorizedSceneInventory(form: ProductionForm, cast: CharacterProfile[]): AuthorizedSceneInventory {
  const resolved = deriveScenePlan(form, cast.find((profile) => profile.role === "Hero")?.shortName);
  const direction = `${form.additionalDirection} ${resolved.creative.creativeRules}`.toLowerCase();
  const locationElements = resolved.location.split(/[.;]/).map((value) => value.trim()).filter(Boolean).slice(0, 6);
  return {
    characters: cast.map((profile) => ({ id: profile.id, name: profile.shortName, role: profile.role })),
    importantObjects: [{ name: resolved.importantObject, description: resolved.importantObject }],
    actionObjects: [{ name: resolved.mainAction, source: "main-action" }],
    fixedEnvironmentElements: locationElements.length ? locationElements : [resolved.location],
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
  const startRatio = videoRatio;
  const endRatio = videoRatio;
  const style = selectedStyle(form);
  const platform = selectedPlatform(form);
  const model = selectedModel(form);
  const adapter = selectedModelAdapter(form);
  const ranges = timelineRanges(duration);
  const heroName = hero?.shortName || "Hero";
  const others = supporting.map((profile) => profile.shortName).join(" and ") || "the supporting cast";
  const derivedScene = deriveScenePlan(form, heroName);
  const location = removeUncheckedCharacters(derivedScene.location);
  const object = removeUncheckedCharacters(derivedScene.importantObject);
  const action = removeUncheckedCharacters(derivedScene.mainAction);
  const ending = removeUncheckedCharacters(derivedScene.endingPayoff);
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
          creativeDirection: derivedScene.creative.pacingStyle,
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
  const cameraMotion = derivedScene.creative.cameraMotion;
  const cameraMotionDirection = `CAMERA & MOTION DIRECTION
Camera Style: ${cameraMotion.cameraStyle}
Additional Camera Instructions: ${cameraMotion.customInstructions || "No additional camera instructions provided."}
Framing: ${cameraMotion.framing}
Movement Intensity: ${cameraMotion.movementIntensity}
Camera Stability: ${cameraMotion.cameraStability}
Subject Motion: ${cameraMotion.subjectMotion}
Motion Quality Rules:
${cameraMotion.qualityRules.length ? cameraMotion.qualityRules.map((rule) => `- ${rule}`).join("\n") : "- No additional motion quality rules selected."}
Camera Style controls how the scene is filmed. Subject Motion controls how characters and objects move. Keep both systems coordinated but distinct.
Use the selected framing as a primary preference. When framing is Automatic, choose and adjust framing according to action clarity, character visibility, and continuity.`;
  const lock = `Model: ${model}
Model adapter: ${adapter.displayName}
Adapter structure: ${adapter.promptStructure}
Publishing platform: ${platform}
Duration: exactly ${duration} seconds
Video ratio: ${videoRatio}
Style: ${style}
  Creative pacing direction: ${creativePacingDirection(form)}
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
  Creative Direction from-zero lock: the selected mood, camera, pacing, and performance guide the first visible frame at 0:00 with no neutral introductory period.
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
CREATIVE DIRECTION
Visual Mood & Atmosphere: ${derivedScene.creative.visualMood}
${cameraMotionDirection}
Pacing & Performance: ${derivedScene.creative.pacingStyle}
Creative Rules & Restrictions: ${derivedScene.creative.creativeRules || "No additional creative restrictions provided."}
Derivation rule: Determine the location, supporting objects, action progression, and ending/payoff from the concept, selected cast, video type, video model, prompt model, duration, global video ratio, and Creative Direction. Keep every derived element relevant to the concept; introduce no unrelated objects, characters, locations, cuts, or events.
Global-ratio rule: The selected global Video Ratio applies to the complete video and automatically governs the Start Frame and End Frame. Never request or generate separate frame-ratio settings.
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
Creative direction: mood=${form.creativeDirection.visualMood}; filming=${form.creativeDirection.cameraMotion.cameraStyle}; framing=${form.creativeDirection.cameraMotion.framing}; movement=${cameraMotion.movementIntensity}; stability=${cameraMotion.cameraStability}; subject motion=${form.creativeDirection.cameraMotion.subjectMotion}; selected motion rules=${form.creativeDirection.cameraMotion.motionQualityRuleIds.length}; pacing=${derivedScene.creative.pacingStyle}; restrictions=${derivedScene.creative.creativeRules || "none"}.
Cast: exactly ${cast.length} characters — ${castRoles}. Exact character count: ${cast.length}.
Authorized object: exactly ${objectLedger.length} important object: ${object}. Location: ${location}.
CLOSED-WORLD CONTINUITY RULE. AUTHORIZED CAST: ${cast.map((profile) => `${profile.shortName} (${profile.role})`).join(", ")}. AUTHORIZED OBJECTS: exactly ${objectLedger.length} important object: ${object}. SCENE INVENTORY LOCK, EXACT COUNT LOCK, NO-SPAWN / NO-DESPAWN LOCK, STRICT OBJECT PRESENCE LOCK. No selected character may suddenly appear, disappear, spawn, vanish, or be replaced; no sudden appearances or disappearances.
OBJECT CONTINUITY LOCK: ${object} start=supported; final position=supported. One visible force and continuous path; no duplication, replacement, or sudden object.
One continuous shot only; no sudden cuts, scene reset, accidental crop-out, no random gestures, no random spinning, or gliding feet. Natural-motion lock and natural movement lock: anticipation, acceleration, contact, follow-through, deceleration, settling.
No sudden camera jumps or unexplained reframing. Maintain realistic ground contact. Match movement speed to the selected pacing.
  Creative Direction applies from 0:00. Ultra Retention Mode: ${form.ultraRetentionMode ? "Enabled" : "Disabled"}. STRICT PRESENCE LOCK. Action ownership lock. Natural movement lock. ${form.voiceLayers.includes("No Spoken Dialogue") ? "No understandable spoken dialogue." : ""} Use supplied frames as continuity anchors.`;
  const conciseFinalRule = `This production contains exactly ${cast.length} characters — ${cast.map((profile) => profile.shortName).join(", ")} — and exactly ${objectLedger.length} important object — ${object}. No other character or object may appear. Use only authorized selected characters and objects established in the start frame. Preserve exact counts, identities, roles, colors, clothing, proportions, scale, and environment from start to finish.

NO duplicate characters. NO duplicate objects. NO additional characters or objects. NO unchecked characters, random props, substitutions, spawning, despawning, vanishing, materializing, fading, teleportation, position reset, scene reset, morphing, role swap. NO sudden cut. NO jump cut. NO sudden camera-angle replacement. NO unrequested freeze. NO frozen midair character or object. NO floating, hovering, gliding feet, pose snapping, unusual movement, ownerless movement, or unfinished motion.

  PHYSICAL GROUNDING LOCK, OBJECT SUPPORT LOCK, and GRAVITY LOCK: every character and object has visible support and gravity; no unexplained hovering. Every character and object remains continuously traceable from exact start to exact final position through smooth preparation, anticipation, acceleration, contact, follow-through, deceleration, landing where required, and complete settling. Customer-requested entrance, exit, transformation, destruction, cut, freeze, or magical floating must show the complete visible, physically traceable transition. Complete the planned payoff with every remaining authorized entity stable, visible, and supported.`;
  const sanitizedCharacterPrompts = removeUncheckedCharacters(characterPrompts);
  const generatedTitle = form.videoTitle.trim() || `${heroName} and the Impossible Backfire`;
  const adaptedTimeline = adapter.maxSingleClipSeconds && duration > adapter.maxSingleClipSeconds
    ? `SEGMENTED GENERATION PLAN — ${adapter.displayName} practical clip budget is approximately ${adapter.maxSingleClipSeconds} seconds. Generate chronological adjacent clips using the same reference locks, then join without a visual jump.\n${timelineLines}`
    : timelineLines;
  const finalTimeline = adaptedTimeline;
  const conciseStartFrame = `Create the opening reference image in the global Video Ratio ${startRatio}, ${style}, for ${adapter.displayName}. Creative Direction: mood=${form.creativeDirection.visualMood}; camera=${form.creativeDirection.cameraMotion.cameraStyle}; framing=${form.creativeDirection.cameraMotion.framing}; pacing=${form.creativeDirection.pacingStyle}. Cast: exactly ${cast.length} characters: ${compactCast.replace(/\n/g, "; ")}. Location: ${location}. Authorized object: exactly ${objectLedger.length} ${object}, visibly supported in the central action area. ${heroName} starts foreground-center facing it; ${supporting.map((profile, index) => `${profile.shortName} stands ${index % 2 === 0 ? "camera-left" : "camera-right"}, facing the action`).join("; ")}. Use wide or medium-wide visibility, matching lens, contact shadows, contact with supporting surfaces, clear eye lines, and the first 0:00 motion cue. Start active; do not show the payoff. This is the complete authorized scene inventory. Apply Creative Direction from frame zero.`;
  const conciseEndFrame = `Create the final reference image in the same global Video Ratio ${endRatio}, ${style}, using the start-frame image as the primary continuity reference for ${adapter.displayName}. Preserve Creative Direction: mood=${form.creativeDirection.visualMood}; camera=${form.creativeDirection.cameraMotion.cameraStyle}; framing=${form.creativeDirection.cameraMotion.framing}; pacing=${form.creativeDirection.pacingStyle}. Use exactly the same ${cast.length} characters: ${compactCast.replace(/\n/g, "; ")}. Keep exactly the same environment, location, lighting, lens, scale, and same ${object}. ${ending}. ${heroName} finishes safe and smiling; ${supporting.map((profile, index) => `${profile.shortName} finishes ${index % 2 === 0 ? "camera-left" : "camera-right"} in a resolved ${profile.role.toLowerCase()} pose`).join("; ")}. Show the object supported at its final position in a stable completed pose, with contact shadows, completed settling, and matched perspective. Preserve the exact authorized inventory; nothing else appears.`;
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
  const failed = findings.filter((finding) => finding.status !== "Passed").map((finding) => finding.label);
  if (!failed.length) return pack;
  const repaired = { ...pack };
  const append = (field: keyof ProductionPack, text: string) => {
    if (!repaired[field].toLowerCase().includes(text.toLowerCase())) repaired[field] = `${repaired[field]}\n${text}`.trim();
  };
  const strategies: Record<string, () => void> = {
    "Extreme Fast-Chaotic motion pacing": () => { append("videoLock", "EXTREME SPEED LOCK: at exactly 0:00 named action is already active; compressed anticipation, immediate acceleration, rapid connected beats, and midpoint backfire."); append("videoTimeline", "0:00–0:00.7 — immediate visible action and object response; no static opening."); },
    "Camera keeps active cast visible": () => append("videoLock", "CAMERA VISIBILITY LOCK: continuous wide or medium-wide framing; no accidental crop-out or camera-caused disappearance."),
    "No scene reset between ranges": () => append("videoTimeline", "Transition rule: every range inherits the exact cast, object, location, and screen-direction state from the prior range; no scene reset."),
    "Completed grounded ending": () => { append("endFramePrompt", "Final support contact, stable completed pose, complete settling, and unchanged ground plane; no unresolved motion."); append("videoTimeline", "Final beat ends with supported contact, visible settling, and a stable completed payoff."); },
    "Major middle escalation": () => append("videoTimeline", "Major middle escalation: a physically caused consequence occurs at mid-duration, followed by readable follow-through and recovery."),
    "Immediate active opening hook": () => append("videoTimeline", "At exactly 0:00 the first second contains already active visible action; no static introduction."),
    "No sudden cuts or freezes": () => append("videoLock", "One continuous shot only; no sudden cuts, jump cuts, freeze frame, or frozen midair motion."),
    "No gliding rule": () => append("finalGenerationRule", "No snapping, no gliding feet, and no pose reset; use visible contact, deceleration, and settling."),
    "Sudden-disappearance prohibition": () => append("finalGenerationRule", "No sudden disappearances, vanishing, despawning, or removed selected character or object."),
  };
  failed.forEach((label) => strategies[label]?.());
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
  _creativeAssets: CreativeAsset[] = [],
): QualityReport {
  void _creativeAssets;
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
  const workflowStyle = previewStyleQuality(form.videoStyleId);
  const inventory = buildAuthorizedSceneInventory(form, cast);
  const objectStates = buildObjectStateLedger(inventory);
  const motionRuleChecks: Record<ProductionForm["creativeDirection"]["cameraMotion"]["motionQualityRuleIds"][number], { label: string; pattern: RegExp }> = {
    "smooth-continuous-movement": { label: "Smooth continuous movement", pattern: /smooth and continuous|continuous paths?|smooth motion/i },
    "no-sudden-camera-jumps": { label: "No sudden camera jumps", pattern: /no sudden camera jumps?|no unexplained reframing/i },
    "no-unrequested-cuts": { label: "No unrequested cuts", pattern: /no unrequested cuts?|one continuous shot|no sudden cuts/i },
    "preserve-screen-direction": { label: "Preserve screen direction", pattern: /screen direction|spatial continuity/i },
    "keep-characters-visible": { label: "Keep selected characters visible", pattern: /keep all selected characters visible|strict presence lock|continuously present/i },
    "realistic-ground-contact": { label: "Maintain realistic ground contact", pattern: /ground contact|foot placement|visible support contact/i },
    "avoid-floating-sliding": { label: "Avoid floating or sliding", pattern: /no floating|avoid floating|no .*sliding|prevent .*sliding/i },
    "objects-physically-connected": { label: "Keep objects physically connected", pattern: /physically connected|visibly supported|held, attached/i },
    "match-motion-to-pacing": { label: "Match movement speed to pacing", pattern: /match .*movement speed.*pacing|creative pacing direction/i },
  };
  const findings: QualityFinding[] = [
    finding("Video title exists", pack.videoTitle.trim().length >= 3, "Add a clear original video title."),
    finding("Video title is original in saved history", !savedTitles.some((title) =>
      title.trim().toLowerCase() === pack.videoTitle.trim().toLowerCase()), "Choose a title not already used by a saved production.", true),
    finding("Creative Direction is complete", Boolean(
      resolveCreativeDirection(form.creativeDirection).visualMood &&
      resolveCreativeDirection(form.creativeDirection).cameraMotion.cameraStyle &&
      resolveCreativeDirection(form.creativeDirection).cameraMotion.subjectMotion &&
      resolveCreativeDirection(form.creativeDirection).pacingStyle
    ), "Choose presets or describe each selected Custom creative direction."),
    ...form.creativeDirection.cameraMotion.motionQualityRuleIds.map((id) =>
      finding(
        `Motion quality: ${motionRuleChecks[id].label}`,
        motionRuleChecks[id].pattern.test(all),
        `Apply the selected motion quality rule: ${motionRuleChecks[id].label}.`,
      )),
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
    finding("Important object continuity", objectStates.every((state) =>
      pack.startFramePrompt.toLowerCase().includes(state.name.toLowerCase()) &&
      pack.endFramePrompt.toLowerCase().includes(state.name.toLowerCase())) &&
      /object continuity lock/.test(pack.videoLock.toLowerCase()), "The derived important object needs visible start and final positions with a continuous path."),
    finding("Action ownership and traceability", /action ownership lock/.test(pack.videoLock.toLowerCase()) && ranges.every((range) => range.start >= 0 && range.end > range.start) && /at exactly 0:00|0:00/.test(pack.videoTimeline.toLowerCase()), "Every beat must name an owner, cause, result, and transition from 0:00."),
    finding("Natural-motion filter", /natural movement lock/.test(all) && /no random gestures/.test(all) && /no random.*spin/.test(all) && !/\brandomly\s+(?:spins?|jumps?|waves?|dances?|gestures?)\b/.test(pack.videoTimeline.toLowerCase()), "Explicitly prohibit random gestures, spinning, jumping, and unrelated movement."),
    finding("Creative Direction applies from frame zero", /creative direction applies from 0:00/.test(pack.videoLock.toLowerCase()) && /creative direction/.test(pack.startFramePrompt.toLowerCase()), "Creative Direction must guide the start frame and first action."),
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
    finding("Start-frame ratio", pack.startFramePrompt.includes(ratioLabel(form.videoRatio, form.videoCustomWidth, form.videoCustomHeight)), "Start Frame must inherit the global Video Ratio."),
    finding("End-frame ratio", pack.endFramePrompt.includes(ratioLabel(form.videoRatio, form.videoCustomWidth, form.videoCustomHeight)), "End Frame must inherit the global Video Ratio."),
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
    ...(form.styleWorkflowEnabled ? [
      finding(`${workflowStyle.name} style workflow is applied`, all.includes(`style workflow: ${workflowStyle.name.toLowerCase()}`), `${workflowStyle.name} must contribute its own camera, visual, pacing, and safety guidance.`),
      ...workflowStyle.qualityChecks.map((check) => finding(`${workflowStyle.name}: ${check}`,
        all.includes(check.toLowerCase()),
        `${workflowStyle.name} Quality Control checks ${check.toLowerCase()} in the generated pack.`, true)),
    ] : []),
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
