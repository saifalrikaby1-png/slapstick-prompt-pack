import {
  CharacterProfile,
  CreativeAsset,
  LegacyPackItem,
  LegacySavedPack,
  ProductionForm,
  ProductionPack,
  QualityFinding,
  QualityReport,
  SavedProductionPack,
  StoredPack,
  defaultProductionForm,
  productionPackKeys,
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
    cameraPolicy: "one controlled camera progression", motionPolicy: "coherent subject motion with explicit cause and effect",
    pacingPolicy: "compact chronological beats", referenceFramePolicy: "treat both reference frames as identity and geometry anchors",
    audioPolicy: "concise native-audio direction only when enabled", negativePolicy: "concise identity and continuity exclusions",
  },
  Kling: {
    displayName: "Kling", promptStructure: "subject, movement, scene, camera, lighting",
    cameraPolicy: "state physical direction, force, and one controlled camera move", motionPolicy: "explicit start pose, force, trajectory, and final pose",
    pacingPolicy: "action ownership in clearly ordered physical phases", referenceFramePolicy: "lock start/end poses and spatial transition",
    audioPolicy: "audio secondary to readable physical action", negativePolicy: "forbid motion ambiguity, morphing, and substitutions",
  },
  "Google Flow / Veo": {
    displayName: "Google Flow / Veo", promptStructure: "cinematic shot, subject action, environment, lighting, camera, audio",
    cameraPolicy: "natural cinematic camera language with stable lens", motionPolicy: "natural coherent motion described in cinematic prose",
    pacingPolicy: "story beats with attributable audio", referenceFramePolicy: "first-frame and last-frame continuity with matching lens and perspective",
    audioPolicy: "attribute dialogue, ambience, and Foley to exact sources", negativePolicy: "avoid contradictions and unexplained changes",
  },
  Runway: {
    displayName: "Runway", promptStructure: "reference image, motion, temporal progression, camera",
    cameraPolicy: "one clear camera movement per short clip", motionPolicy: "describe what changes over time without redescribing the anchored image",
    pacingPolicy: "segment clips longer than ten seconds", referenceFramePolicy: "use the reference image as the primary visual anchor",
    audioPolicy: "provide editing-guide audio separately", negativePolicy: "short motion-focused exclusions",
    maxSingleClipSeconds: 10,
  },
  Higgsfield: {
    displayName: "Higgsfield", promptStructure: "subject staging, action beat, intentional camera path",
    cameraPolicy: "one explicit cinematic camera move compatible with subject motion", motionPolicy: "slapstick timing remains readable along the camera path",
    pacingPolicy: "controlled action beats with clean holds", referenceFramePolicy: "preserve framing while using reference-friendly subject separation",
    audioPolicy: "sync accents to visible camera-readable beats", negativePolicy: "no conflicting camera commands",
  },
  PixVerse: {
    displayName: "PixVerse", promptStructure: "action-first subject, staging, simple camera",
    cameraPolicy: "simple stable camera behavior", motionPolicy: "conservative readable subject motion",
    pacingPolicy: "few direct beats", referenceFramePolicy: "clear silhouettes and conservative geometry",
    audioPolicy: "simple visible-source audio", negativePolicy: "concise broadly supported constraints",
  },
  "Hailuo / MiniMax": {
    displayName: "Hailuo / MiniMax", promptStructure: "subject, action, scene, style, camera",
    cameraPolicy: "conservative supported camera motion stated separately", motionPolicy: "direct action commands separated from camera commands",
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
    cameraPolicy: "one broadly compatible camera move", motionPolicy: "smooth logical motion",
    pacingPolicy: "universal chronological beats", referenceFramePolicy: "stable reference-friendly composition",
    audioPolicy: "separate universal audio guide", negativePolicy: "universal continuity constraints",
  },
};

export function selectedModelAdapter(form: ProductionForm) {
  const base = modelPromptAdapters[form.videoModel] || modelPromptAdapters["Generic model"];
  return form.videoModel === "Custom model"
    ? { ...base, displayName: selectedModel(form), promptStructure: `${base.promptStructure}; ${form.customModelGuidance || "customer-defined model guidance not supplied"}` }
    : base;
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
    `Continuity rules: ${profile.continuityRules || "Preserve identity in every frame."}`,
    `Negative identity rules: ${profile.negativeRules || "No duplication, morphing, or role changes."}`,
  ].join("\n");
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
    if (!productionPackKeys.every((key) => typeof migratedPack[key] === "string")) return null;
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
      pack: migratedPack as ProductionPack,
      qualityReport: quality,
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

export function generateDemoPack(
  form: ProductionForm,
  characters: CharacterProfile[],
): ProductionPack {
  const hero = characters.find((profile) => profile.id === form.heroId);
  const supporting = form.selectedCharacterIds
    .map((id) => characters.find((profile) => profile.id === id))
    .filter((profile): profile is CharacterProfile => Boolean(profile) && profile?.id !== hero?.id);
  const cast = [hero, ...supporting].filter((profile): profile is CharacterProfile => Boolean(profile));
  const castNames = cast.map((profile) => profile.fullIdentity).join("; ");
  const castRoles = cast.map((profile) => `${profile.shortName}: ${profile.role}`).join("; ");
  const identities = cast.map((profile) =>
    `${profile.fullIdentity} (${profile.role}) — ${profile.appearanceLock || "use the saved identity"} Colors: ${profile.colorLock || "preserve saved colors"} Scale: ${profile.scaleLock || "preserve saved scale"}`).join("\n");
  const duration = Math.max(5, Number(form.duration) || 15);
  const videoRatio = ratioLabel(form.videoRatio, form.videoCustomWidth, form.videoCustomHeight);
  const startRatio = ratioLabel(form.startFrameRatio, form.startCustomWidth, form.startCustomHeight);
  const endRatio = ratioLabel(form.endFrameRatio, form.endCustomWidth, form.endCustomHeight);
  const style = selectedStyle(form);
  const tone = selectedTone(form);
  const platform = selectedPlatform(form);
  const model = selectedModel(form);
  const adapter = selectedModelAdapter(form);
  const ranges = timelineRanges(duration);
  const heroName = hero?.shortName || "Hero";
  const others = supporting.map((profile) => profile.shortName).join(" and ") || "the supporting cast";
  const location = stringValue(form.location, "a clean, readable cartoon environment");
  const object = stringValue(form.importantObject, "the important story object");
  const action = stringValue(form.trapAction, "a clear physical action");
  const ending = stringValue(form.endingPayoff, `${heroName} completes the action and the scene resolves clearly`);
  const cameraRule = form.motionLevel === "Safe"
    ? "locked camera axis with no meaningful camera move"
    : form.motionLevel === "Ambitious"
      ? "one controlled cinematic camera move, with no cut and no loss of spatial clarity"
      : "maximum one smooth, meaningful camera move";
  const timelineLines = ranges.slice(0, -1).map((start, index) => {
    const end = ranges[index + 1];
    const actions = ranges.length === 5
      ? [
          `${heroName} begins in the stated start pose; ${others} visibly initiate ${action} around ${object}.`,
          `${heroName} reacts and redirects the same action; object direction remains readable and every character owns one clear movement.`,
          `The physical consequence develops continuously; ${others} receive the harmless result while ${heroName} remains clearly safe.`,
          `${ending}. Every character reaches the final pose described by the end frame.`,
        ]
      : [
          `${heroName} begins in the stated start pose and the setup becomes immediately readable.`,
          `${others} visibly initiate ${action}; ${object} moves from its established starting position.`,
          `${heroName} responds with one clear action; cause and effect remain continuous.`,
          `The action reaches its main consequence without teleportation, substitution, or a cut.`,
          `${ending}; hold a readable final reaction and match the end frame.`,
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
  const sfxLines = ranges.slice(0, -1).map((start, index) => {
    const end = ranges[index + 1];
    const description = index === 0
      ? `quiet environment tone and one clear source sound from ${object} or the first visible movement`
      : index === ranges.length - 2
        ? "one final settling sound sourced from the visible ending pose"
        : index === ranges.length - 3
          ? `one medium-intensity directional impact from the visible result of ${action}`
          : `selective ${form.soundEffectsStyle.toLowerCase()} tied only to visible footsteps, prop motion, or contact`;
    return `${rangeLabel(start, end)} — ${description}; match on-screen distance and direction; no random off-screen sound.`;
  }).join("\n");
  const narrationRule = form.voiceLayers.includes("No Spoken Dialogue")
    ? "No spoken dialogue, no narration, and no lip-sync. Communicate through poses, expressions, music, and synchronized sound."
    : `Voice layers: ${form.voiceLayers.join(", ")}. Language: ${form.language}. Vocal tone: ${form.vocalTone}. ${form.lipSyncRequired ? "Accurate lip-sync is required." : "Lip-sync is not required unless a selected speaker visibly speaks."} Narrator guidance: ${form.voiceLayers.includes("Narrator") ? form.narratorGuidance || "none" : "not enabled"}. Narration text: ${form.voiceLayers.includes("Narrator") ? form.narrationText || "none" : "not enabled"}. Character dialogue: ${form.voiceLayers.some((layer) => layer.includes("Voice")) ? form.characterDialogue || "none" : "not enabled"}. Character voice guidance: ${form.characterVoiceGuidance || "use the saved voice profiles."}`;
  const lock = `Model: ${model}
Model adapter: ${adapter.displayName}
Adapter structure: ${adapter.promptStructure}
Publishing platform: ${platform}
Duration: exactly ${duration} seconds
Video ratio: ${videoRatio}
Style: ${style}
Tone: ${tone}
Tone translation: ${toneProductionDirection(form)}
Motion level: ${form.motionLevel}
Exact character count: ${cast.length}
Exact identities: ${castNames}
Exact roles: ${castRoles}
Environment lock: ${location}; no unexplained location or background change.
Important-object lock: ${object}; show every movement from its established start position to its final position.
Reference continuity: follow the supplied start frame and complete the supplied end frame.
Camera rule: ${cameraRule}; no sudden cuts unless explicitly requested.
Adapter camera policy: ${adapter.cameraPolicy}.
Adapter motion policy: ${adapter.motionPolicy}.
Adapter reference-frame policy: ${adapter.referenceFramePolicy}.
Identity lock: preserve colors, clothing, accessories, scale, proportions, faces, species, and roles. No duplicate characters, extra characters, substitutions, role swapping, morphing, teleportation, sudden appearances, sudden disappearances, random objects, or broken physical cause and effect.
Audio/voice rule: ${narrationRule}
Adapter audio policy: ${adapter.audioPolicy}.${form.additionalDirection.trim() ? `\nCustomer direction: ${form.additionalDirection.trim()}` : ""}`;
  const characterPrompts = cast.map((profile) => `### ${profile.shortName} — ${profile.role}
${characterDescription(profile)}
Create a full-body front view, full-body side view, optional back view, neutral pose, and compact expression set. Lock exact colors, clothing, accessories, proportions, relative scale, face, species, and silhouette. Clean background. Image ratio: ${startRatio}. Visual style: ${style}. One character in this subsection only; no extra character, no duplicate body parts, no cropped anatomy, no text, no logo, no watermark.`).join("\n\n");
  const generatedTitle = form.videoTitle.trim() ||
    `${heroName} and the ${form.objectName.trim() || "Impossible Backfire"}`;
  const adaptedTimeline = adapter.maxSingleClipSeconds && duration > adapter.maxSingleClipSeconds
    ? `SEGMENTED GENERATION PLAN — ${adapter.displayName} practical clip budget is approximately ${adapter.maxSingleClipSeconds} seconds. Generate chronological adjacent clips using the same reference locks, then join without a visual jump.\n${timelineLines}`
    : timelineLines;
  return {
    videoTitle: generatedTitle,
    characterBuildingPrompt: form.includeCharacterBuildingPrompt ? characterPrompts : "",
    startFramePrompt: `Create the opening reference image in ${startRatio}, ${style}.

EXACT CAST (${cast.length})
${identities}

Scene: ${location}. Important object: ${object}, clearly visible in its starting position near the central action area. ${heroName} starts foreground-center facing toward the object, in an alert ready pose with a focused, curious expression. ${supporting.map((profile, index) => `${profile.shortName} starts ${index % 2 === 0 ? "camera-left" : "camera-right"}, facing ${heroName}, in a role-appropriate preparation pose with a readable expression.`).join(" ")}

Lighting and camera: clean cinematic key light, stable color response, readable depth, matching lens and perspective, and a composition suited to ${platform}. Model-aware frame strategy for ${adapter.displayName}: ${adapter.referenceFramePolicy}. Keep silhouettes separated and ${object} unobstructed. Establish exact screen direction, relative scale, spatial distance, initial poses, facial expressions, and object position. Identity, color, clothing, accessory, scale, and proportion locks are mandatory. Exactly these characters only; no duplicates, no extra characters, no future action, no newly appearing props, no text, no logo, no watermark.`,
    endFramePrompt: `Create the final reference image in ${endRatio}, ${style}, using the start-frame image as the primary continuity reference.

Use exactly the same ${cast.length} characters and exactly the same environment, lighting direction, lens, perspective, camera height, colors, clothing, accessories, scale, proportions, camera axis, and object history. Model-aware frame strategy for ${adapter.displayName}: ${adapter.referenceFramePolicy}. Final result: ${ending}. ${heroName} finishes clearly safe in the resolved hero position with a readable final expression. ${supporting.map((profile, index) => `${profile.shortName} finishes ${index % 2 === 0 ? "camera-left" : "camera-right"} in a distinct resolved ${profile.role.toLowerCase()} pose and remains fully visible.`).join(" ")} The same ${object} is visible in its logical final position after ${action}. The positional change from the opening frame must be physically feasible.

No missing characters, extra characters, duplicate characters, newly appearing props, substitutions, role changes, color drift, clothing changes, scale changes, morphing, text, logo, or watermark.`,
    videoLock: lock,
    videoTimeline: adaptedTimeline,
    musicPath: musicLines,
    soundEffects: sfxLines,
    finalGenerationRule: `Follow the reference frames. Preserve exact character identities, roles, colors, clothing, proportions, scale, and exact character count. Preserve the chronological cause-and-effect order and complete the stated ending. Do not add, remove, duplicate, replace, transform, or teleport characters. Do not introduce random props, unexplained changes, sudden cuts, sudden appearances, or sudden disappearances.`,
  };
}

function parseRanges(text: string) {
  const matches = [...text.matchAll(/0:(\d{2})[–-]0:(\d{2})/g)];
  return matches.map((match) => ({ start: Number(match[1]), end: Number(match[2]) }));
}

export function inspectProductionPack(
  pack: ProductionPack,
  form: ProductionForm,
  characters: CharacterProfile[],
  savedTitles: string[] = [],
  creativeAssets: CreativeAsset[] = [],
): QualityReport {
  const hero = characters.find((profile) => profile.id === form.heroId);
  const supporting = form.selectedCharacterIds
    .map((id) => characters.find((profile) => profile.id === id))
    .filter((profile): profile is CharacterProfile => Boolean(profile) && profile?.id !== hero?.id);
  const cast = [hero, ...supporting].filter((profile): profile is CharacterProfile => Boolean(profile));
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
  const findings: QualityFinding[] = [
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
    finding("Only valid character roles", cast.every((profile) => ["Hero", "Companion", "Enemy"].includes(profile.role)), "Active roles must be Hero, Companion, or Enemy."),
    finding("Every character has a description", cast.every((profile) => characterDescription(profile).length > 40), "Every active character needs a reusable description."),
    finding("All selected characters appear", cast.every((profile) =>
      requiredVisuals.includes(profile.shortName.toLowerCase())), "Every selected identity must appear in the frame and video instructions."),
    finding("Character count is consistent", pack.videoLock.toLowerCase().includes(`exact character count: ${cast.length}`), `Expected exactly ${cast.length} characters.`),
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
      ? form.voiceLayers.length === 1 && /no spoken dialogue/.test(all)
      : !form.voiceLayers.includes("No Spoken Dialogue"), "No Spoken Dialogue cannot coexist with spoken layers."),
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
  return `VIDEO LOCK
${pack.videoLock}

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
