export type GeneratorMode = "demo" | "ai";
export type TimingStructureMode = "automatic" | "custom";
export type ProductionTimelineBeat = {
  id: string; startSeconds: number; endSeconds: number; label: string; visualAction: string;
  characterAction?: string; cameraDirection?: string; musicDirection?: string;
  soundEffectsDirection?: string; continuityNote?: string;
};
export type ProductionTimeline = { mode: TimingStructureMode; durationSeconds: number; beats: ProductionTimelineBeat[] };

export type ProductionCharacterFunction = "initiator" | "target" | "obstacle" | "assistant" | "witness" | "victim" | "rescuer" | "payoff-recipient";
export type ResolvedCharacterAction = { characterId: string; characterName: string; role: string; function: ProductionCharacterFunction; openingState: string; initiatingAction?: string; mainAction: string; reaction: string; endingState: string };
export type ResolvedObjectTrajectory = { objectName: string; visualIdentity: string; initialPosition: string; ownerOrController?: string; forceOrTrigger: string; movementPath: string; interactions: string[]; finalPosition: string };
export type ResolvedProductionConcept = {
  version: string; workingTitle?: string; oneSentenceStory: string;
  location: { name: string; visualDescription: string; fixedEnvironmentFacts: string[] };
  primaryObject: ResolvedObjectTrajectory; characters: ResolvedCharacterAction[];
  openingHook: string; initiatingCause: string; actionProgression: string[]; escalation: string;
  reversalOrBackfire?: string; payoff: string; finalComposition: string; continuityFacts: string[];
  durationSeconds: number; videoRatio: string; videoModel: string;
  source: "user-defined" | "demo-resolved" | "ai-resolved" | "migrated"; confidence: number;
};

export type SceneZoneId = string;
export type SceneZone = { id: SceneZoneId; label: string; description: string; relativePosition: "foreground" | "midground" | "background" | "left" | "center" | "right" | "upper" | "lower" | "near" | "far"; connectedZoneIds: SceneZoneId[] };
export type CharacterSpatialState = { characterId: string; characterName: string; zoneId: SceneZoneId; posture: string; facing: string; movementState: "stationary" | "preparing" | "moving" | "falling" | "settling"; nearbyCharacterIds: string[]; nearbyObjectIds: string[] };
export type ObjectSpatialState = { objectId: string; objectName: string; zoneId: SceneZoneId; supportSurface: string; movementState: "stationary" | "rolling" | "sliding" | "falling" | "launched" | "redirecting" | "settling"; direction?: string; speed?: "slow" | "medium" | "fast" };
export type SpatialAction = { actorId: string; actorName: string; actionType: "push" | "pull" | "step" | "sidestep" | "jump" | "tap" | "kick" | "block" | "dodge" | "collide" | "fall" | "catch" | "stop" | "react" | "settle"; sourceZoneId: SceneZoneId; targetZoneId?: SceneZoneId; targetCharacterId?: string; targetObjectId?: string; bodyPartOrContactPoint?: string; forceDescription?: string; resultingDirection?: string; resultingState?: string };
export type SpatialBeatState = { startSeconds: number; endSeconds: number; characterStatesBefore: CharacterSpatialState[]; objectStatesBefore: ObjectSpatialState[]; actions: SpatialAction[]; characterStatesAfter: CharacterSpatialState[]; objectStatesAfter: ObjectSpatialState[] };
export type ObjectDirectionVector = { fromZoneId: SceneZoneId; toZoneId: SceneZoneId; directionLabel: string };
export type ObjectMotionSegment = { startSeconds: number; endSeconds: number; fromZoneId: SceneZoneId; toZoneId: SceneZoneId; triggerActorId: string; triggerAction: string; movementType: "roll" | "slide" | "launch" | "bounce" | "redirect" | "slow" | "stop"; direction: ObjectDirectionVector; speedBefore: string; speedAfter: string; contactDescription?: string; physicalReason: string };
export type ResolvedObjectPath = { objectId: string; objectName: string; segments: ObjectMotionSegment[]; finalZoneId: SceneZoneId };
export type CharacterMovementSegment = { characterId: string; startSeconds: number; endSeconds: number; fromZoneId: SceneZoneId; toZoneId: SceneZoneId; movementType: "step" | "walk" | "run" | "sidestep" | "jump" | "fall" | "settle"; physicalReason: string };
export type LocationVocabulary = { primaryLocationName: string; allowedTerms: string[]; disallowedInheritedTerms: string[] };
export type ResolvedSpatialActionPlan = { environmentName: string; zones: SceneZone[]; initialCharacterStates: CharacterSpatialState[]; initialObjectStates: ObjectSpatialState[]; beats: SpatialBeatState[]; finalCharacterStates: CharacterSpatialState[]; finalObjectStates: ObjectSpatialState[]; objectPath: ResolvedObjectPath; characterPaths: CharacterMovementSegment[]; locationVocabulary: LocationVocabulary };

export type CharacterRole = "Hero" | "Enemy" | "Companion";

export type CreativeAssetKind = "location" | "object" | "action" | "payoff";

export const ruleChipIds = [
  "no-dialogue",
  "no-sudden-cuts",
  "characters-visible",
  "maintain-identity",
  "family-friendly",
  "seamless-loop",
] as const;

export type RuleChipId = (typeof ruleChipIds)[number];

export type CameraStyleValue =
  | "smooth-cinematic"
  | "dynamic-action"
  | "locked-stable"
  | "character-follow"
  | "handheld-realistic"
  | "custom";

export type CameraFramingValue = "automatic" | "wide" | "medium" | "close-up" | "full-body" | "over-the-shoulder";
export type MovementIntensityValue = "subtle" | "balanced" | "dynamic";
export type CameraStabilityValue = "stable" | "natural" | "expressive";
export type MotionEnergyValue = "controlled" | "balanced" | "expressive";
export type CameraStabilityOverride = "auto" | CameraStabilityValue;
export type SubjectMotionValue = "natural-controlled" | "smooth-cinematic" | "fast-energetic" | "exaggerated-comedic" | "realistic-physical" | "custom";
export type MotionQualityRuleId =
  | "smooth-continuous-movement"
  | "no-sudden-camera-jumps"
  | "no-unrequested-cuts"
  | "preserve-screen-direction"
  | "keep-characters-visible"
  | "realistic-ground-contact"
  | "avoid-floating-sliding"
  | "objects-physically-connected"
  | "match-motion-to-pacing";

export type CameraMotionState = {
  cameraStyle: CameraStyleValue;
  cameraStyleCustom: string;
  cameraCustomInstructions: string;
  framing: CameraFramingValue;
  motionEnergy: MotionEnergyValue;
  cameraStabilityOverride: CameraStabilityOverride;
  movementIntensity: MovementIntensityValue;
  cameraStability: CameraStabilityValue;
  subjectMotion: SubjectMotionValue;
  subjectMotionCustom: string;
  motionQualityRuleIds: MotionQualityRuleId[];
};

export const motionQualityRuleIds: MotionQualityRuleId[] = [
  "smooth-continuous-movement",
  "no-sudden-camera-jumps",
  "no-unrequested-cuts",
  "preserve-screen-direction",
  "keep-characters-visible",
  "realistic-ground-contact",
  "avoid-floating-sliding",
  "objects-physically-connected",
  "match-motion-to-pacing",
];

export const DEFAULT_CAMERA_MOTION: CameraMotionState = {
  cameraStyle: "smooth-cinematic",
  cameraStyleCustom: "",
  cameraCustomInstructions: "",
  framing: "automatic",
  motionEnergy: "balanced",
  cameraStabilityOverride: "auto",
  movementIntensity: "balanced",
  cameraStability: "stable",
  subjectMotion: "natural-controlled",
  subjectMotionCustom: "",
  motionQualityRuleIds: [...motionQualityRuleIds],
};

export type CreativeDirectionState = {
  visualMood: string;
  visualMoodCustom: string;
  cameraMotion: CameraMotionState;
  pacingStyle: string;
  pacingStyleCustom: string;
  creativeRulesManual: string;
  selectedRuleChipIds: RuleChipId[];
};

export const defaultCreativeDirection: CreativeDirectionState = {
  visualMood: "bright-colorful",
  visualMoodCustom: "",
  cameraMotion: { ...DEFAULT_CAMERA_MOTION, motionQualityRuleIds: [...DEFAULT_CAMERA_MOTION.motionQualityRuleIds] },
  pacingStyle: "fast-energetic",
  pacingStyleCustom: "",
  creativeRulesManual: "",
  selectedRuleChipIds: [],
};

export type CreativeAsset = {
  id: string;
  kind: CreativeAssetKind;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  isSignature?: boolean;
  builtIn?: boolean;
};

export type VoiceLayer =
  | "Narrator"
  | "Hero Voice"
  | "Companion Voices"
  | "Enemy Voices"
  | "No Spoken Dialogue";

export type VoiceModeValue = "no-spoken-dialogue" | "narrator-only" | "character-voices" | "narrator-and-characters" | "custom";
export type MusicStyleValue = "playful-comedy" | "warm-magical" | "cinematic" | "emotional" | "suspenseful" | "no-music" | "custom";
export type MusicIntensityValue = "soft" | "balanced" | "strong";
export type SoundEffectsStyleValue = "cartoon-foley" | "slapstick" | "cinematic" | "soft-animation" | "minimal" | "custom";
export type SfxIntensityValue = "light" | "balanced" | "strong";

export type CharacterProfile = {
  id: string;
  builtIn?: boolean;
  shortName: string;
  fullIdentity: string;
  role: CharacterRole;
  description: string;
  appearanceLock: string;
  personalityLock: string;
  colorLock: string;
  scaleLock: string;
  vocalStyleLock: string;
  nonverbalSoundProfile: string;
  movementStyle: string;
  continuityRules: string;
  negativeRules: string;
};

export type ProductionForm = {
  /** Preview style configuration; omitted legacy data safely migrates to Slapstick. */
  videoStyleId?: "slapstick" | "cinematic" | "family-3d" | "anime" | "live-action" | "cgi-fantasy" | "stylized-3d";
  styleWorkflowEnabled?: boolean;
  videoTitle: string;
  resolvedProductionConcept?: ResolvedProductionConcept;
  resolvedSpatialActionPlan?: ResolvedSpatialActionPlan;
  creativeDirection: CreativeDirectionState;
  /** @deprecated Local migration-only values; never rendered or sent for generation. */
  locationAssetId: string;
  /** @deprecated Local migration-only values; never rendered or sent for generation. */
  locationName: string;
  /** @deprecated Local migration-only values; never rendered or sent for generation. */
  location: string;
  /** @deprecated Local migration-only values; never rendered or sent for generation. */
  objectAssetId: string;
  /** @deprecated Local migration-only values; never rendered or sent for generation. */
  objectName: string;
  /** @deprecated Local migration-only values; never rendered or sent for generation. */
  importantObject: string;
  /** @deprecated Local migration-only values; never rendered or sent for generation. */
  allowPreviouslySavedObjects: boolean;
  /** @deprecated Local migration-only values; never rendered or sent for generation. */
  actionAssetId: string;
  /** @deprecated Local migration-only values; never rendered or sent for generation. */
  actionName: string;
  /** @deprecated Local migration-only values; never rendered or sent for generation. */
  trapAction: string;
  /** @deprecated Local migration-only values; never rendered or sent for generation. */
  payoffAssetId: string;
  /** @deprecated Local migration-only values; never rendered or sent for generation. */
  payoffName: string;
  /** @deprecated Local migration-only values; never rendered or sent for generation. */
  endingPayoff: string;
  additionalDirection: string;
  heroId: string;
  selectedCharacterIds: string[];
  activeCharacterIds: string[];
  platform: string;
  customPlatform: string;
  videoModel: string;
  customVideoModel: string;
  duration: string;
  timingStructureMode: TimingStructureMode;
  productionTimeline: ProductionTimeline;
  resolution?: string;
  visualStyle: string;
  customVisualStyle: string;
  ultraRetentionMode: boolean;
  motionLevel: "Safe" | "Balanced" | "Ambitious";
  videoRatio: string;
  videoCustomWidth: string;
  videoCustomHeight: string;
  voiceLayers: VoiceLayer[];
  voiceMode: VoiceModeValue;
  voiceModeCustom: string;
  narratorGuidance: string;
  narrationText: string;
  characterDialogue: string;
  characterVoiceGuidance: string;
  language: string;
  vocalTone: string;
  lipSyncRequired: boolean;
  musicType: string;
  musicMood: string;
  musicIntensity: string;
  musicStyle: MusicStyleValue;
  musicStyleCustom: string;
  simplifiedMusicIntensity: MusicIntensityValue;
  audioMode: string;
  noMusic: boolean;
  soundEffectsStyle: string;
  soundEffectsStylePreset: SoundEffectsStyleValue;
  soundEffectsStyleCustom: string;
  sfxIntensity: SfxIntensityValue;
  customVoiceInstructions: string;
  customMusicInstructions: string;
  customSfxInstructions: string;
  characterCartoonSounds: boolean;
  characterCartoonSoundGuidance: string;
  includeCharacterBuildingPrompt: boolean;
  customModelGuidance: string;
};

export type ProductionPack = {
  videoTitle: string;
  characterBuildingPrompt: string;
  startFramePrompt: string;
  endFramePrompt: string;
  videoLock: string;
  videoTimeline: string;
  musicPath: string;
  soundEffects: string;
  finalGenerationRule: string;
};

export type RequestedOutput =
  | "videoTitle"
  | "characterBuildingPrompt"
  | "startFramePrompt"
  | "endFramePrompt"
  | "videoPrompt"
  | "musicPath"
  | "soundEffects";

export type PartialProductionPack = Partial<ProductionPack>;

export const requestedOutputValues: RequestedOutput[] = [
  "videoTitle",
  "characterBuildingPrompt",
  "startFramePrompt",
  "endFramePrompt",
  "videoPrompt",
  "musicPath",
  "soundEffects",
];

export function fieldsForRequestedOutputs(outputs: RequestedOutput[]): (keyof ProductionPack)[] {
  const fields: (keyof ProductionPack)[] = [];
  const add = (...keys: (keyof ProductionPack)[]) => keys.forEach((key) => {
    if (!fields.includes(key)) fields.push(key);
  });
  outputs.forEach((output) => {
    if (output === "videoPrompt") add("videoLock", "videoTimeline", "finalGenerationRule");
    else add(output);
  });
  return fields;
}

export type QualityStatus = "Passed" | "Warning" | "Failed";

export type QualityFinding = {
  label: string;
  status: QualityStatus;
  detail: string;
};

export type QualityReport = {
  score: number;
  findings: QualityFinding[];
};

export type ProjectPreset = {
  id: string;
  name: string;
  form: ProductionForm;
  builtIn?: boolean;
};

export type SavedProductionPack = {
  id: string;
  schemaVersion: 2;
  title: string;
  createdAt: string;
  platform: string;
  videoModel: string;
  duration: string;
  form: ProductionForm;
  characterProfiles: CharacterProfile[];
  pack: PartialProductionPack;
  qualityReport: QualityReport;
  outputSelectionMode?: "custom" | "fullPack";
  customRequestedOutputs?: RequestedOutput[];
  requestedOutputs?: RequestedOutput[];
  generatedOutputs?: RequestedOutput[];
  packStatus?: "Partial Pack" | "Complete Pack" | "Legacy Pack";
  resolvedProductionConcept?: ResolvedProductionConcept;
  resolvedSpatialActionPlan?: ResolvedSpatialActionPlan;
};

export type LegacyPackItem = {
  title: string;
  value: string;
  eyebrow?: string;
};

export type LegacySavedPack = {
  id: string;
  schemaVersion: 1;
  title: string;
  createdAt: string;
  platform: string;
  videoModel: string;
  duration: string;
  items: LegacyPackItem[];
};

export type StoredPack = SavedProductionPack | LegacySavedPack;

export const productionPackKeys: (keyof ProductionPack)[] = [
  "videoTitle",
  "characterBuildingPrompt",
  "startFramePrompt",
  "endFramePrompt",
  "videoLock",
  "videoTimeline",
  "musicPath",
  "soundEffects",
  "finalGenerationRule",
];

export const defaultProductionForm: ProductionForm = {
  videoStyleId: "slapstick",
  videoTitle: "",
  creativeDirection: { ...defaultCreativeDirection, selectedRuleChipIds: [] },
  locationAssetId: "",
  locationName: "",
  location: "",
  objectAssetId: "",
  objectName: "",
  importantObject: "",
  allowPreviouslySavedObjects: false,
  actionAssetId: "",
  actionName: "",
  trapAction: "",
  payoffAssetId: "",
  payoffName: "",
  endingPayoff: "",
  additionalDirection: "",
  heroId: "builtin-biscuit",
  selectedCharacterIds: ["builtin-grumpy", "builtin-sneaky"],
  activeCharacterIds: ["builtin-biscuit", "builtin-grumpy", "builtin-sneaky"],
  platform: "Social Media",
  customPlatform: "",
  videoModel: "Seedance",
  customVideoModel: "",
  duration: "15",
  timingStructureMode: "automatic",
  productionTimeline: { mode: "automatic", durationSeconds: 15, beats: [] },
  visualStyle: "Cinematic 3D family animation",
  customVisualStyle: "",
  ultraRetentionMode: true,
  motionLevel: "Balanced",
  videoRatio: "9:16",
  videoCustomWidth: "",
  videoCustomHeight: "",
  voiceLayers: ["No Spoken Dialogue"],
  voiceMode: "no-spoken-dialogue",
  voiceModeCustom: "",
  narratorGuidance: "",
  narrationText: "",
  characterDialogue: "",
  characterVoiceGuidance: "",
  language: "English",
  vocalTone: "Expressive family-friendly cartoon",
  lipSyncRequired: false,
  musicType: "Playful orchestral comedy",
  musicMood: "Playful",
  musicIntensity: "Medium",
  musicStyle: "playful-comedy",
  musicStyleCustom: "",
  simplifiedMusicIntensity: "balanced",
  audioMode: "Native-audio mode",
  noMusic: false,
  soundEffectsStyle: "Clean synchronized cartoon Foley",
  soundEffectsStylePreset: "cartoon-foley",
  soundEffectsStyleCustom: "",
  sfxIntensity: "balanced",
  customVoiceInstructions: "",
  customMusicInstructions: "",
  customSfxInstructions: "",
  characterCartoonSounds: true,
  characterCartoonSoundGuidance: "",
  includeCharacterBuildingPrompt: true,
  customModelGuidance: "",
};
