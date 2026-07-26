export type GeneratorMode = "demo" | "ai";

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

export type CreativeDirectionState = {
  visualMood: string;
  visualMoodCustom: string;
  cameraStyle: string;
  cameraStyleCustom: string;
  pacingStyle: string;
  pacingStyleCustom: string;
  creativeRulesManual: string;
  selectedRuleChipIds: RuleChipId[];
};

export const defaultCreativeDirection: CreativeDirectionState = {
  visualMood: "bright-colorful",
  visualMoodCustom: "",
  cameraStyle: "smooth-cinematic",
  cameraStyleCustom: "",
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
  visualStyle: string;
  customVisualStyle: string;
  tones: string[];
  customTone: string;
  ultraRetentionMode: boolean;
  motionLevel: "Safe" | "Balanced" | "Ambitious";
  videoRatio: string;
  videoCustomWidth: string;
  videoCustomHeight: string;
  voiceLayers: VoiceLayer[];
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
  audioMode: string;
  noMusic: boolean;
  soundEffectsStyle: string;
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
  visualStyle: "Cinematic 3D family animation",
  customVisualStyle: "",
  tones: ["Funny", "Fast"],
  customTone: "",
  ultraRetentionMode: true,
  motionLevel: "Balanced",
  videoRatio: "9:16",
  videoCustomWidth: "",
  videoCustomHeight: "",
  voiceLayers: ["No Spoken Dialogue"],
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
  audioMode: "Native-audio mode",
  noMusic: false,
  soundEffectsStyle: "Clean synchronized cartoon Foley",
  characterCartoonSounds: false,
  characterCartoonSoundGuidance: "",
  includeCharacterBuildingPrompt: true,
  customModelGuidance: "",
};
