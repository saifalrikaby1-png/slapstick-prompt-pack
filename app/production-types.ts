export type GeneratorMode = "demo" | "ai";

export type CharacterRole = "Hero" | "Enemy" | "Companion" | "Supporting character";

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
  location: string;
  importantObject: string;
  trapAction: string;
  endingPayoff: string;
  additionalDirection: string;
  heroId: string;
  selectedCharacterIds: string[];
  platform: string;
  customPlatform: string;
  videoModel: string;
  customVideoModel: string;
  duration: string;
  visualStyle: string;
  customVisualStyle: string;
  tone: string;
  customTone: string;
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
  narrationMode: string;
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
  includeCharacterBuildingPrompt: boolean;
  characterBuildingCharacterId: string;
};

export type ProductionPack = {
  characterBuildingPrompt: string;
  startFramePrompt: string;
  endFramePrompt: string;
  videoLock: string;
  videoTimeline: string;
  musicPath: string;
  soundEffects: string;
  finalGenerationRule: string;
};

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
  pack: ProductionPack;
  qualityReport: QualityReport;
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
  location: "",
  importantObject: "",
  trapAction: "",
  endingPayoff: "",
  additionalDirection: "",
  heroId: "builtin-biscuit",
  selectedCharacterIds: ["builtin-grumpy", "builtin-sneaky"],
  platform: "YouTube Shorts",
  customPlatform: "",
  videoModel: "Seedance",
  customVideoModel: "",
  duration: "15",
  visualStyle: "Cinematic 3D family animation",
  customVisualStyle: "",
  tone: "Funny",
  customTone: "",
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
  narrationMode: "Silent non-dialogue",
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
  includeCharacterBuildingPrompt: true,
  characterBuildingCharacterId: "builtin-biscuit",
};
