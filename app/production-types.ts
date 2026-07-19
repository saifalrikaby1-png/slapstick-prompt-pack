export type GeneratorMode = "demo" | "ai";

export type CharacterRole = "Hero" | "Enemy" | "Companion";

export type CreativeAssetKind = "location" | "object" | "action" | "payoff";

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
  movementStyle: string;
  continuityRules: string;
  negativeRules: string;
};

export type ProductionForm = {
  videoTitle: string;
  locationAssetId: string;
  locationName: string;
  location: string;
  objectAssetId: string;
  objectName: string;
  importantObject: string;
  allowPreviouslySavedObjects: boolean;
  actionAssetId: string;
  actionName: string;
  trapAction: string;
  payoffAssetId: string;
  payoffName: string;
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
  startFrameRatio: string;
  endFrameRatio: string;
  videoCustomWidth: string;
  videoCustomHeight: string;
  startCustomWidth: string;
  startCustomHeight: string;
  endCustomWidth: string;
  endCustomHeight: string;
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
  videoTitle: "",
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
  startFrameRatio: "9:16",
  endFrameRatio: "9:16",
  videoCustomWidth: "",
  videoCustomHeight: "",
  startCustomWidth: "",
  startCustomHeight: "",
  endCustomWidth: "",
  endCustomHeight: "",
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
