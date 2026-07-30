import type { CharacterProfile, ProductionForm, ProductionPack, ProductionTimeline } from "./production-types";
import { normalizeProductionFormat, validateProductionTimeline } from "./production-format";

export type PromptQualityLevel = "maximum" | "expert" | "production-ready" | "needs-refinement" | "major-issues";
export type PromptQualityStatus = "pass" | "warning" | "fail";
export type PromptPackageSectionId = "characters" | "start-frame" | "end-frame" | "video-lock" | "video-prompt" | "music" | "sound-effects" | "video-rules" | "timeline" | "negative-prompt";
export type RepetitionClassification = "required-definition" | "required-reference" | "independent-context" | "exact-redundancy" | "semantic-redundancy" | "large-block-duplication";
export type PromptRepetitionType = "exact-duplicate" | "near-duplicate" | "necessary-reinforcement" | "structural-label" | "entity-reference" | "harmful-repetition";
export type PromptRepetitionFinding = {
  id: string; type: PromptRepetitionType; text: string; normalizedText: string;
  occurrenceCount: number; sections: PromptPackageSectionId[];
  severity: "none" | "minor" | "moderate" | "major" | "critical";
  harmfulOccurrenceCount: number; explanation: string;
  classification: RepetitionClassification; penalty: number;
};
export type RepetitionOccurrence = { section: PromptPackageSectionId; text: string };
export type RepetitionGroup = {
  id: string; canonicalInstruction: string; occurrences: RepetitionOccurrence[];
  classification: RepetitionClassification; severity: "minor" | "moderate" | "major" | "critical";
  penalty: number;
};
export type PromptBalanceBreakdown = {
  repetitionControl: number; lengthBalance: number; sectionResponsibility: number;
  contradictionControl: number; formattingHierarchy: number;
};
export type PromptBalanceResult = {
  score: number; status: PromptQualityStatus; breakdown: PromptBalanceBreakdown;
  findings: PromptRepetitionFinding[]; harmfulRepetitionCount: number;
  extremeDuplication: boolean; message: string;
};
export type PromptQualityCategoryId = "character-consistency" | "video-lock" | "action-flow" | "frame-continuity" | "camera-motion" | "physical-continuity" | "audio-synchronization" | "model-compatibility" | "video-rules" | "prompt-balance";

export type PromptQualityCheck = {
  id: string; categoryId: PromptQualityCategoryId; label: string; status: PromptQualityStatus;
  score: number; maxScore: number; message: string; affectedSections: PromptPackageSectionId[];
  repairable: boolean; severity: "critical" | "major" | "minor";
};
export type PromptQualityCategory = { id: PromptQualityCategoryId; label: string; weight: number; earnedScore: number; maxScore: number; checks: PromptQualityCheck[] };
export type PromptQualityCap = {
  id: string; label: string; reason: string; maximumScore: number; isActive: boolean;
  evidenceCheckIds: string[]; affectedSections: PromptPackageSectionId[];
};
export type PromptQualityScoreResult = { baseScore: number; cappedScore: number; finalScore: number; appliedCaps: PromptQualityCap[] };
export type PromptQualityAnalysis = {
  score: number; baseScore: number; cappedScore: number; finalScore: number; level: PromptQualityLevel; label: string; categories: PromptQualityCategory[];
  passedChecks: PromptQualityCheck[]; warnings: PromptQualityCheck[]; failedChecks: PromptQualityCheck[];
  hardCapsApplied: PromptQualityCap[]; appliedCaps: PromptQualityCap[]; repairableIssueCount: number; criticalIssueCount: number;
  promptBalance: PromptBalanceResult;
  analyzedAt: string; analysisVersion: string; mode: "demo" | "ai";
};
export type PromptQualityContext = {
  mode: "demo" | "ai"; selectedCharacters: CharacterProfile[]; durationSeconds: number;
  videoRatio: string; videoModel: string; videoType: string; voiceMode: string;
  musicEnabled: boolean; selectedOutputTypes: string[];
  timingStructureMode: "automatic" | "custom"; timeline: ProductionTimeline;
};
export type PromptQualityRepairResult = {
  previousScore: number; newScore: number; previousAnalysis: PromptQualityAnalysis; newAnalysis: PromptQualityAnalysis;
  changedSections: PromptPackageSectionId[]; improvements: string[]; pack: ProductionPack;
};
export type PromptRepairAction = {
  id: string; issueIds: string[]; targetSections: PromptPackageSectionId[];
  protectedSections: PromptPackageSectionId[]; instruction: string; priority: number;
};
export type PromptSectionHashes = Record<PromptPackageSectionId, string>;

export const PROMPT_QUALITY_WEIGHTS: Record<PromptQualityCategoryId, number> = {
  "character-consistency": 15, "video-lock": 13, "action-flow": 15, "frame-continuity": 10,
  "camera-motion": 10, "physical-continuity": 8, "audio-synchronization": 7,
  "model-compatibility": 7, "video-rules": 7, "prompt-balance": 8,
};
export const PROMPT_QUALITY_CAPS = {
  missingVideoLock: 84, missingVideoRules: 87, characterIdentityConflict: 79,
  frameContinuityConflict: 82, impossibleActionDensity: 85, missingSelectedCharacter: 75,
  conflictingDialogueRules: 86, emptyRequiredSection: 70, unresolvedCriticalContradiction: 89,
  incorrectPromptSectionOrder: 90, missingEndPayoff: 89, missingOpeningHook: 89,
} as const;
const CATEGORY_LABELS: Record<PromptQualityCategoryId, string> = {
  "character-consistency": "Character Consistency", "video-lock": "Video Lock", "action-flow": "Action Flow",
  "frame-continuity": "Frame Continuity", "camera-motion": "Camera & Motion",
  "physical-continuity": "Physical Continuity", "audio-synchronization": "Audio Synchronization",
  "model-compatibility": "Model Compatibility", "video-rules": "Video Rules", "prompt-balance": "Prompt Balance",
};

export function getPromptQualityLevel(score: number) {
  if (score >= 98) return { level: "maximum" as const, label: "Maximum Prompt Quality" };
  if (score >= 95) return { level: "expert" as const, label: "Expert Grade" };
  if (score >= 90) return { level: "production-ready" as const, label: "Production Ready" };
  if (score >= 80) return { level: "needs-refinement" as const, label: "Needs Refinement" };
  return { level: "major-issues" as const, label: "Major Prompt Issues" };
}
export function calculatePromptQualityBaseScore(categories: PromptQualityCategory[]) {
  return categories.reduce((total, category) => total + category.earnedScore, 0);
}
export function roundPromptQualityScore(score: number) { return Math.round(score); }
export function calculateFinalPromptQualityScore(categories: PromptQualityCategory[], detectedCaps: PromptQualityCap[]): PromptQualityScoreResult {
  const baseScore = calculatePromptQualityBaseScore(categories);
  const appliedCaps = detectedCaps.filter((cap) => cap.isActive);
  const cappedScore = appliedCaps.length ? appliedCaps.reduce((score, cap) => Math.min(score, cap.maximumScore), baseScore) : baseScore;
  return { baseScore, cappedScore, finalScore: Math.min(98, Math.max(0, roundPromptQualityScore(cappedScore))), appliedCaps };
}
export function assertPromptQualityScoreConsistency(analysis: PromptQualityAnalysis) {
  const calculatedTotal = calculatePromptQualityBaseScore(analysis.categories);
  const inconsistentBase = Math.abs(calculatedTotal - analysis.baseScore) > .01;
  const inconsistentFinal = analysis.appliedCaps.length === 0 && analysis.finalScore !== roundPromptQualityScore(Math.min(98, calculatedTotal));
  if (!inconsistentBase && !inconsistentFinal) return;
  const error = new Error(inconsistentBase ? "Prompt Quality base score does not match category totals." : "Prompt Quality final score is inconsistent without an active cap.");
  if (process.env.NODE_ENV !== "production") throw error;
  console.error("[prompt-quality-diagnostics]", error);
}

export function normalizePromptText(value = "") { return value.toLowerCase().replace(/\s+/g, " ").trim(); }
export function estimateWordCount(value = "") { return value.trim() ? value.trim().split(/\s+/).length : 0; }
export function normalizeInstructionForComparison(instruction: string): string {
  return instruction.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim()
    .replace(/^(?:ensure|make sure|always|must|preserve|maintain|keep)\s+/, "");
}
const STRUCTURAL_LABELS = /^(?:video lock|video prompt|music direction|sound effects direction|video rules|camera|motion|music|sound effects)$/i;
const CONTINUITY_REFERENCE = /^(?:follow|preserve|maintain|keep).{0,50}(?:video lock|locked (?:identit|character)|continuity)/i;
const METADATA_ONLY = /^(?:(?:ratio|aspect ratio|duration|model(?: name)?)\s*:?\s*)?(?:\d{1,2}:\d{1,2}|\d+(?:\.\d+)?\s*(?:seconds?|s)|\d{1,2}:\d{1,2}|[a-z0-9 ._-]+ model)$/i;
type CanonicalInstruction = { text: string; normalized: string; section: PromptPackageSectionId };
function canonicalPromptSections(pack: ProductionPack): Array<[PromptPackageSectionId, string]> {
  return [
    ["video-lock", pack.videoLock], ["video-prompt", pack.videoTimeline], ["music", pack.musicPath],
    ["sound-effects", pack.soundEffects], ["video-rules", pack.finalGenerationRule],
  ];
}
function splitCanonicalInstructions(pack: ProductionPack): CanonicalInstruction[] {
  return canonicalPromptSections(pack).flatMap(([section, value]) => value
    .split(/(?<=[.!?])\s+|\n+/)
    .map((text) => text.trim())
    .filter(Boolean)
    .map((text) => ({ text, normalized: normalizeInstructionForComparison(text), section })));
}
function meaningfulTokens(value: string, entityTokens = new Set<string>()) {
  return value.split(" ").filter((token) => token.length > 2 && !entityTokens.has(token) && !/^\d+$/.test(token));
}
export function isRepetitionCandidate(sentence: string) { return meaningfulTokens(normalizeInstructionForComparison(sentence)).length >= 8; }
export function createComparisonPairKey(firstId: string, secondId: string) { return [firstId, secondId].sort().join("::"); }
function tokenSimilarity(a: string, b: string, entityTokens = new Set<string>()) {
  const left = new Set(meaningfulTokens(a, entityTokens));
  const right = new Set(meaningfulTokens(b, entityTokens));
  if (!left.size || !right.size) return 0;
  const shared = [...left].filter((token) => right.has(token)).length;
  return (2 * shared) / (left.size + right.size);
}
function harmlessInstruction(item: CanonicalInstruction, characterNames: string[]) {
  if (STRUCTURAL_LABELS.test(item.normalized) || METADATA_ONLY.test(item.text) || /^(?:ratio|aspect ratio|duration|model(?: name)?)\s*:/i.test(item.text) || /^(?:\d{1,2}:\d{2}|\d+\s*-\s*\d+\s*seconds?)/i.test(item.text)) return true;
  if (characterNames.some((name) => item.normalized === normalizeInstructionForComparison(name))) return true;
  return /^(?:hero|enemy|companion)$/i.test(item.normalized);
}
export function classifyPromptRepetitions(pack: ProductionPack, characterNames: string[] = []): PromptRepetitionFinding[] {
  const entityTokens = new Set(characterNames.flatMap((name) => normalizeInstructionForComparison(name).split(" ")));
  const instructions = splitCanonicalInstructions(pack).filter((item) => isRepetitionCandidate(item.text));
  const findings: PromptRepetitionFinding[] = [];
  const consumed = new Set<number>();
  for (let index = 0; index < instructions.length; index += 1) {
    if (consumed.has(index)) continue;
    const item = instructions[index];
    const pairKeys = new Set<string>();
    const matches = instructions.map((candidate, candidateIndex) => ({ candidate, candidateIndex, similarity: tokenSimilarity(item.normalized, candidate.normalized, entityTokens), pairKey: createComparisonPairKey(`${index}`, `${candidateIndex}`) }))
      .filter(({ candidateIndex, similarity }) => candidateIndex > index && similarity >= .88);
    if (!matches.length) continue;
    const group = [item, ...matches.map(({ candidate }) => candidate)];
    matches.forEach(({ candidateIndex, pairKey }) => { consumed.add(candidateIndex); pairKeys.add(pairKey); });
    const exact = group.every((candidate) => candidate.normalized === item.normalized);
    const sections = [...new Set(group.map((candidate) => candidate.section))];
    const harmless = harmlessInstruction(item, characterNames);
    const reinforcement = !exact && group.every((candidate) => CONTINUITY_REFERENCE.test(candidate.text)) ||
      (!exact && sections.includes("video-lock") && sections.includes("video-rules") && /locked|continuity|identit/i.test(group.map(({ text }) => text).join(" ")));
    const harmfulOccurrenceCount = harmless || reinforcement ? 0 : group.length - 1;
    const largeBlock = item.normalized.split(" ").length >= 45;
    const severity = harmfulOccurrenceCount === 0 ? "none" : largeBlock && group.length >= 3 ? "critical" : harmfulOccurrenceCount >= 5 ? "major" : harmfulOccurrenceCount >= 2 ? "moderate" : "minor";
    const classification: RepetitionClassification = harmless ? "independent-context" : reinforcement ? "required-reference" : largeBlock ? "large-block-duplication" : exact ? "exact-redundancy" : "semantic-redundancy";
    const penalty = classification === "large-block-duplication" ? (severity === "critical" ? 1.2 : .6) : classification === "semantic-redundancy" ? .3 : classification === "exact-redundancy" ? .1 : 0;
    findings.push({
      id: `repetition-${index}`, type: harmless ? (STRUCTURAL_LABELS.test(item.normalized) ? "structural-label" : "entity-reference") : reinforcement ? "necessary-reinforcement" : exact ? "exact-duplicate" : "near-duplicate",
      text: item.text, normalizedText: item.normalized, occurrenceCount: group.length, sections,
      severity, harmfulOccurrenceCount,
      explanation: harmfulOccurrenceCount ? `${exact ? "Identical" : "Near-identical"} instruction adds no new meaning across ${sections.join(" and ")}.` : reinforcement ? "Concise continuity reinforcement is intentional." : "Structural, entity, timestamp, or metadata reference is required.",
      classification, penalty,
    });
  }
  return findings;
}
export function detectRepeatedInstructions(value = "") {
  const sentences = value.split(/[.!?\n]+/).map(normalizeInstructionForComparison).filter((sentence) => sentence.length > 24);
  return sentences.length - new Set(sentences).size;
}
function roundToOneDecimal(value: number) { return Math.round(value * 10) / 10; }
export function calculateRepetitionControlScore(findings: PromptRepetitionFinding[]) {
  const harmful = findings.filter((finding) => finding.penalty > 0);
  const minor = Math.min(.5, harmful.filter((finding) => finding.severity === "minor").length * .1);
  const moderate = Math.min(1.2, harmful.filter((finding) => finding.severity === "moderate").length * .3);
  const major = harmful.filter((finding) => finding.severity === "major").length * .6;
  const critical = harmful.filter((finding) => finding.severity === "critical").length * 1.2;
  return Math.max(0, roundToOneDecimal(3 - minor - moderate - major - critical));
}
export function calculatePromptBalanceScore(pack: ProductionPack, characterNames: string[] = []): PromptBalanceResult {
  const findings = classifyPromptRepetitions(pack, characterNames);
  const harmful = findings.filter((finding) => finding.harmfulOccurrenceCount > 0);
  const harmfulRepetitionCount = harmful.length;
  const repetitionControl = calculateRepetitionControlScore(findings);
  const totalWordCount = canonicalPromptSections(pack).reduce((total, [, value]) => total + estimateWordCount(value), 0);
  const lengthBalance = totalWordCount >= 180 && totalWordCount <= 1800 ? 2 : totalWordCount >= 90 && totalWordCount <= 2400 ? 1.5 : totalWordCount > 0 ? .8 : 0;
  const sectionResponsibility = harmful.some((finding) => finding.sections.length > 1) ? .5 : 1;
  const contradictionControl = 1;
  const formattingHierarchy = canonicalPromptSections(pack).filter(([, value]) => value.trim()).length >= 5 ? 1 : .5;
  const extremeDuplication = repetitionControl === 0;
  const score = Math.max(0, Math.min(8, roundToOneDecimal(repetitionControl + lengthBalance + sectionResponsibility + contradictionControl + formattingHierarchy)));
  const status: PromptQualityStatus = score >= 7.2 ? "pass" : score >= 5.5 ? "warning" : "fail";
  const message = extremeDuplication
    ? "Several large instruction blocks are duplicated across the prompt, significantly reducing clarity and model focus."
    : harmfulRepetitionCount === 0
      ? "Prompt structure is concise, well organized, and free from harmful repetition."
      : `${harmfulRepetitionCount} redundant instruction group${harmfulRepetitionCount === 1 ? "" : "s"} repeat across ${[...new Set(harmful.flatMap((finding) => finding.sections))].join(" and ")}. They can be consolidated without removing safeguards.`;
  return { score, status, breakdown: { repetitionControl, lengthBalance, sectionResponsibility, contradictionControl, formattingHierarchy }, findings, harmfulRepetitionCount, extremeDuplication, message };
}
export function calculateActionDensity(value: string, durationSeconds: number) {
  const beats = (value.match(/\b(?:then|next|after|finally|0:\d{2}|\d+\s*-\s*\d+\s*seconds?)\b/gi) || []).length;
  return beats / Math.max(1, durationSeconds / 5);
}
function contains(text: string, values: string[]) { const normalized = normalizePromptText(text); return values.some((value) => normalized.includes(normalizePromptText(value))); }
function allNames(text: string, characters: CharacterProfile[]) { return characters.every((character) => contains(text, [character.shortName])); }
function makeCheck(categoryId: PromptQualityCategoryId, ok: boolean, partial: boolean, message: string, sections: PromptPackageSectionId[], severity: PromptQualityCheck["severity"] = "major", checkId = `${categoryId}-core`): PromptQualityCheck {
  const maxScore = PROMPT_QUALITY_WEIGHTS[categoryId];
  const status: PromptQualityStatus = ok ? "pass" : partial ? "warning" : "fail";
  return { id: checkId, categoryId, label: CATEGORY_LABELS[categoryId], status, score: ok ? maxScore : partial ? Math.round(maxScore * .65) : 0, maxScore, message, affectedSections: sections, repairable: !ok, severity };
}

export function analyzePromptPackage(pack: ProductionPack, context: PromptQualityContext): PromptQualityAnalysis {
  const complete = [pack.characterBuildingPrompt, pack.startFramePrompt, pack.endFramePrompt, pack.videoLock, pack.videoTimeline, pack.musicPath, pack.soundEffects, pack.finalGenerationRule].join("\n");
  const ratioPresent = contains(`${pack.videoLock}\n${pack.startFramePrompt}\n${pack.endFramePrompt}`, [context.videoRatio]);
  const durationPresent = contains(`${pack.videoLock}\n${pack.videoTimeline}`, [`${context.durationSeconds}`]);
  const namesInCharacter = allNames(pack.characterBuildingPrompt, context.selectedCharacters);
  const namesInLock = allNames(pack.videoLock, context.selectedCharacters);
  const frameNames = context.selectedCharacters.length === 0 || context.selectedCharacters.some((character) => contains(`${pack.startFramePrompt}\n${pack.endFramePrompt}`, [character.shortName]));
  const actionDensity = calculateActionDensity(pack.videoTimeline, context.durationSeconds);
  const timelineValidation = validateProductionTimeline(context.timeline, context.durationSeconds);
  const promptBalance = calculatePromptBalanceScore(pack, context.selectedCharacters.map((character) => character.shortName));
  const noDialogueConflict = /no spoken dialogue/i.test(context.voiceMode) && /\b(?:says|speaks|dialogue:)\b/i.test(`${pack.videoTimeline}\n${pack.soundEffects}`);
  const characterIdentityConflict = context.selectedCharacters.some((character) => {
    const otherRoles = ["Hero", "Enemy", "Companion"].filter((role) => role !== character.role).join("|");
    const escapedName = character.shortName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`\\b${escapedName}\\b\\s*(?::|—|-|is\\s+(?:the\\s+)?|as\\s+(?:the\\s+)?|has\\s+role\\s+)\\s*(?:${otherRoles})\\b`, "i").test(`${pack.characterBuildingPrompt}\n${pack.videoLock}`);
  });
  const checks: PromptQualityCheck[] = [
    makeCheck("character-consistency", namesInCharacter && namesInLock && !characterIdentityConflict, (namesInCharacter || namesInLock) && !characterIdentityConflict, namesInCharacter && namesInLock && !characterIdentityConflict ? "Every selected character and role is consistently represented." : characterIdentityConflict ? "One or more character identities conflict across the prompt package." : "One or more selected character identities are missing from Character information or Video Lock.", ["characters", "video-lock"], "critical", characterIdentityConflict ? "character-identity-conflict-core" : "character-consistency-core"),
    makeCheck("video-lock", Boolean(pack.videoLock.trim()) && ratioPresent && durationPresent && /continu|lock|immutable/i.test(pack.videoLock), Boolean(pack.videoLock.trim()), "Video Lock must define immutable identities, ratio, duration, and frame continuity.", ["video-lock"], "critical"),
    makeCheck("action-flow", Boolean(pack.videoTimeline.trim()) && timelineValidation.valid && actionDensity <= 4 && /(?:opening|begin|start|0:00)/i.test(pack.videoTimeline) && /(?:payoff|final|end)/i.test(pack.videoTimeline), Boolean(pack.videoTimeline.trim()) && timelineValidation.errors.length <= 1, timelineValidation.valid ? "Video Prompt needs a clear opening hook, chronological action, and reachable payoff at duration-appropriate density." : `Timeline coverage is invalid: ${timelineValidation.errors.join(" ")}`, ["video-prompt", "timeline"]),
    makeCheck("frame-continuity", Boolean(pack.startFramePrompt.trim() && pack.endFramePrompt.trim()) && frameNames && ratioPresent, Boolean(pack.startFramePrompt.trim() || pack.endFramePrompt.trim()), "Start and End Frames must preserve the selected cast, scene continuity, and global ratio.", ["start-frame", "end-frame"], "critical"),
    makeCheck("camera-motion", /camera|framing|shot|track|locked/i.test(`${pack.videoLock}\n${pack.videoTimeline}`) && /motion|movement|move/i.test(pack.videoTimeline), /camera|shot/i.test(complete), "Camera direction and subject motion must be concrete, readable, and keep the main action visible.", ["video-lock", "video-prompt"]),
    makeCheck("physical-continuity", /gravity|ground|contact|ownership|no teleport|physical|screen direction/i.test(complete), /impact|collision|holds|grips/i.test(complete), "Add concise safeguards for gravity, ground contact, object ownership, impacts, and position continuity.", ["video-prompt", "video-rules"]),
    makeCheck("audio-synchronization", context.musicEnabled ? Boolean(pack.musicPath.trim() && pack.soundEffects.trim()) : /no music/i.test(pack.musicPath), Boolean(pack.soundEffects.trim()), context.musicEnabled ? "Music and sound effects must exist and synchronize only with visible actions." : "No Music must be explicit while visible-action sound effects remain synchronized.", ["music", "sound-effects"]),
    makeCheck("model-compatibility", contains(complete, [context.videoModel]) && ratioPresent && durationPresent, ratioPresent && durationPresent, "The prompt package must identify the selected model, duration, ratio, and reference-frame structure.", ["video-lock", "start-frame", "end-frame"]),
    makeCheck("video-rules", Boolean(pack.finalGenerationRule.trim()) && /identity|continu|camera|motion|audio|object|error|do not|no /i.test(pack.finalGenerationRule), Boolean(pack.finalGenerationRule.trim()), "Video Rules must end the package with concise identity, continuity, motion, object, audio, and error-prevention safeguards.", ["video-rules"], "critical"),
    { id: "prompt-balance-core", categoryId: "prompt-balance", label: "Prompt Balance", status: promptBalance.status, score: promptBalance.score, maxScore: 8, message: promptBalance.message, affectedSections: [...new Set(promptBalance.findings.filter((finding) => finding.harmfulOccurrenceCount).flatMap((finding) => finding.sections))], repairable: promptBalance.harmfulRepetitionCount > 0, severity: promptBalance.extremeDuplication ? "major" : "minor" },
  ];
  const categories = checks.map((check) => ({ id: check.categoryId, label: CATEGORY_LABELS[check.categoryId], weight: check.maxScore, earnedScore: check.score, maxScore: check.maxScore, checks: [check] }));
  const caps: PromptQualityCap[] = [];
  const addCap = (id: string, label: string, reason: string, maximumScore: number, evidence: PromptQualityCheck[], affectedSections: PromptPackageSectionId[]) => {
    if (!evidence.length) return;
    caps.push({ id, label, reason, maximumScore, isActive: true, evidenceCheckIds: evidence.map((check) => check.id), affectedSections: [...new Set(affectedSections)] });
  };
  const byCategory = (id: PromptQualityCategoryId) => checks.filter((check) => check.categoryId === id && check.status === "fail");
  if (!pack.videoLock.trim()) addCap("missingVideoLock", "Missing Video Lock", "Video Lock is missing.", PROMPT_QUALITY_CAPS.missingVideoLock, byCategory("video-lock"), ["video-lock"]);
  if (!pack.finalGenerationRule.trim()) addCap("missingVideoRules", "Missing Video Rules", "Video Rules are missing.", PROMPT_QUALITY_CAPS.missingVideoRules, byCategory("video-rules"), ["video-rules"]);
  if (!namesInCharacter && !namesInLock) addCap("missingSelectedCharacter", "Missing selected character", "A selected character is missing.", PROMPT_QUALITY_CAPS.missingSelectedCharacter, byCategory("character-consistency"), ["characters", "video-lock"]);
  const currentIdentityConflicts = checks.filter((check) => check.status === "fail" && check.severity === "critical" && check.id.startsWith("character-identity-conflict"));
  addCap("characterIdentityConflict", "Character identity conflict", "One or more character identities conflict across the prompt package.", PROMPT_QUALITY_CAPS.characterIdentityConflict, currentIdentityConflicts, currentIdentityConflicts.flatMap((check) => check.affectedSections));
  if (!pack.startFramePrompt.trim() || !pack.endFramePrompt.trim() || !pack.videoTimeline.trim()) addCap("emptyRequiredSection", "Empty required section", "A required prompt section is empty.", PROMPT_QUALITY_CAPS.emptyRequiredSection, checks.filter((check) => check.status === "fail" && ["frame-continuity", "action-flow"].includes(check.categoryId)), ["start-frame", "end-frame", "video-prompt"]);
  if (!frameNames || !ratioPresent) addCap("frameContinuityConflict", "Start and End Frame contradiction", "Frame identity or global-ratio continuity conflicts.", PROMPT_QUALITY_CAPS.frameContinuityConflict, byCategory("frame-continuity"), ["start-frame", "end-frame"]);
  if (actionDensity > 4) addCap("impossibleActionDensity", "Impossible action density", "Action density exceeds the selected duration.", PROMPT_QUALITY_CAPS.impossibleActionDensity, byCategory("action-flow"), ["video-prompt"]);
  if (noDialogueConflict) addCap("conflictingDialogueRules", "Conflicting dialogue rules", "Spoken dialogue conflicts with No Spoken Dialogue.", PROMPT_QUALITY_CAPS.conflictingDialogueRules, byCategory("audio-synchronization"), ["sound-effects", "video-prompt"]);
  if (!/(?:opening|begin|start|0:00)/i.test(pack.videoTimeline)) addCap("missingOpeningHook", "Missing opening hook", "The Video Prompt lacks a clear opening hook.", PROMPT_QUALITY_CAPS.missingOpeningHook, byCategory("action-flow"), ["video-prompt"]);
  if (!/(?:payoff|final|end)/i.test(pack.videoTimeline)) addCap("missingEndPayoff", "Missing end payoff", "The Video Prompt lacks a readable final payoff.", PROMPT_QUALITY_CAPS.missingEndPayoff, byCategory("action-flow"), ["video-prompt"]);
  if (promptBalance.extremeDuplication) addCap("extremePromptDuplication", "Extreme prompt duplication", "Large repeated blocks make the prompt materially unusable.", 89, byCategory("prompt-balance"), ["video-lock", "video-prompt", "video-rules"]);
  const scoreResult = calculateFinalPromptQualityScore(categories, caps);
  const level = getPromptQualityLevel(scoreResult.finalScore);
  const analysis: PromptQualityAnalysis = { score: scoreResult.finalScore, ...scoreResult, ...level, categories, passedChecks: checks.filter((check) => check.status === "pass"), warnings: checks.filter((check) => check.status === "warning" || (check.status === "fail" && check.severity !== "critical")), failedChecks: checks.filter((check) => check.status === "fail" && check.severity === "critical"), hardCapsApplied: scoreResult.appliedCaps, repairableIssueCount: checks.filter((check) => check.repairable).length, criticalIssueCount: checks.filter((check) => check.severity === "critical" && check.status !== "pass").length, promptBalance, analyzedAt: new Date().toISOString(), analysisVersion: "2.0.0", mode: context.mode };
  assertPromptQualityScoreConsistency(analysis);
  return analysis;
}

export function promptQualityContext(form: ProductionForm, characters: CharacterProfile[], mode: "demo" | "ai", selectedOutputTypes: string[]): PromptQualityContext {
  const format = normalizeProductionFormat({ ...form, generationMode: mode });
  return { mode, selectedCharacters: characters, durationSeconds: Number(form.duration) || 15, videoRatio: form.videoRatio, videoModel: form.videoModel === "Custom model" ? form.customVideoModel : form.videoModel, videoType: form.videoStyleId || form.visualStyle, voiceMode: form.voiceLayers.join(", "), musicEnabled: !form.noMusic && form.musicStyle !== "no-music", selectedOutputTypes, timingStructureMode: format.timingStructureMode, timeline: format.timeline };
}

function safelyDeduplicatePrompt(pack: ProductionPack, findings: PromptRepetitionFinding[]) {
  const repaired = { ...pack };
  const keys: Array<[keyof ProductionPack, PromptPackageSectionId]> = [
    ["videoTimeline", "video-prompt"], ["finalGenerationRule", "video-rules"],
    ["soundEffects", "sound-effects"], ["musicPath", "music"],
    ["endFramePrompt", "end-frame"], ["startFramePrompt", "start-frame"],
  ];
  const harmful = findings.filter((finding) => finding.harmfulOccurrenceCount > 0);
  for (const finding of harmful) {
    // Video Lock is authoritative and is never shortened by deterministic repair.
    let kept = finding.sections.includes("video-lock");
    for (const [key, section] of keys) {
      if (!finding.sections.includes(section)) continue;
      const lines = String(repaired[key] || "").split(/(?<=[.!?])\s+|\n+/);
      repaired[key] = lines.filter((line) => {
        const similarity = tokenSimilarity(normalizeInstructionForComparison(line), finding.normalizedText);
        if (similarity < .88) return true;
        if (!kept) { kept = true; return true; }
        return false;
      }).join("\n").trim();
    }
  }
  if (harmful.some((finding) => finding.sections.includes("video-lock") && finding.sections.includes("video-rules")) && !/preserve every locked character identity/i.test(repaired.finalGenerationRule)) {
    repaired.finalGenerationRule = `${repaired.finalGenerationRule.trim()}\nPreserve every locked character identity and follow the Video Lock.`.trim();
  }
  return repaired;
}
export function buildDeduplicationRepairActions(groups: RepetitionGroup[]): PromptRepairAction[] {
  return groups.filter((group) => ["exact-redundancy", "semantic-redundancy", "large-block-duplication"].includes(group.classification)).map((group) => ({
    id: `deduplicate-${group.id}`, issueIds: [group.id],
    targetSections: [...new Set(group.occurrences.map((occurrence) => occurrence.section).filter((section) => section !== "video-lock"))],
    protectedSections: ["video-lock"],
    instruction: `Keep the clearest canonical definition and consolidate redundant wording for: ${group.canonicalInstruction}`,
    priority: group.severity === "critical" ? 4 : group.severity === "major" ? 3 : group.severity === "moderate" ? 2 : 1,
  }));
}
export function promptSectionHashes(pack: ProductionPack): PromptSectionHashes {
  const entries = canonicalPromptSections(pack).map(([section, value]) => [section, normalizeInstructionForComparison(value)]);
  return Object.fromEntries(entries) as PromptSectionHashes;
}
export function changedPromptSections(before: ProductionPack, after: ProductionPack) {
  const previous = promptSectionHashes(before);
  const next = promptSectionHashes(after);
  return canonicalPromptSections(after).map(([section]) => section).filter((section) => previous[section] !== next[section]);
}
export function isRepairImprovement(before: PromptQualityAnalysis, after: PromptQualityAnalysis) {
  if (after.criticalIssueCount > before.criticalIssueCount) return false;
  if (after.finalScore > before.finalScore) return true;
  if (after.finalScore === before.finalScore && after.baseScore > before.baseScore) return true;
  return after.finalScore === before.finalScore && after.baseScore === before.baseScore && after.failedChecks.length < before.failedChecks.length;
}

export function repairPromptPackage(pack: ProductionPack, form: ProductionForm, characters: CharacterProfile[], analysis: PromptQualityAnalysis): { pack: ProductionPack; changedSections: PromptPackageSectionId[]; improvements: string[] } {
  let repaired = { ...pack };
  const changedSections: PromptPackageSectionId[] = [];
  const improvements: string[] = [];
  const names = characters.map((character) => `${character.shortName} (${character.role}: ${character.fullIdentity || character.description})`).join("; ");
  const update = (key: keyof ProductionPack, section: PromptPackageSectionId, addition: string, improvement: string) => {
    if (normalizePromptText(repaired[key]).includes(normalizePromptText(addition))) return;
    repaired[key] = `${repaired[key].trim()}\n${addition}`.trim();
    changedSections.push(section); improvements.push(improvement);
  };
  const issues = new Set([...analysis.warnings, ...analysis.failedChecks].map((check) => check.categoryId));
  if (issues.has("prompt-balance") && analysis.promptBalance.harmfulRepetitionCount > 0) {
    const groups: RepetitionGroup[] = analysis.promptBalance.findings.map((finding) => ({ id: finding.id, canonicalInstruction: finding.text, occurrences: finding.sections.map((section) => ({ section, text: finding.text })), classification: finding.classification, severity: finding.severity === "none" ? "minor" : finding.severity, penalty: finding.penalty }));
    const repairActions = buildDeduplicationRepairActions(groups);
    const before = repaired;
    repaired = safelyDeduplicatePrompt(repaired, analysis.promptBalance.findings);
    changedSections.push(...changedPromptSections(before, repaired));
    if (changedSections.length && repairActions.length) improvements.push(`Consolidated ${repairActions.length} redundant safeguard group${repairActions.length === 1 ? "" : "s"} while preserving Video Lock, character identities, format metadata, and unique safeguards.`);
  }
  if (issues.has("character-consistency")) update("characterBuildingPrompt", "characters", `Selected cast and fixed roles: ${names}.`, "Restored selected character identities and fixed roles.");
  if (issues.has("character-consistency") || issues.has("video-lock")) update("videoLock", "video-lock", `Immutable cast: ${names}. Global format: ${form.videoRatio}, ${form.duration} seconds, ${form.videoModel}. Preserve Start Frame to End Frame continuity.`, "Strengthened immutable identity, format, and frame-continuity locks.");
  if (issues.has("action-flow")) update("videoTimeline", "video-prompt", "Opening hook begins immediately; actions proceed in chronological cause-and-effect order; the final beat resolves in a readable payoff and settled end composition.", "Clarified the opening hook, action progression, and final payoff.");
  if (issues.has("frame-continuity")) {
    update("startFramePrompt", "start-frame", `Global ratio ${form.videoRatio}. Preserve the selected cast, wardrobe, objects, location, and visual style through the final frame.`, "Aligned the Start Frame with global format and continuity.");
    update("endFramePrompt", "end-frame", `Global ratio ${form.videoRatio}. Show only the physically reachable final state of the same cast, wardrobe, objects, location, and visual style.`, "Aligned the End Frame with the reachable payoff.");
  }
  if (issues.has("camera-motion")) update("videoTimeline", "video-prompt", "Camera direction remains concrete and continuous, keeps the main action visible, preserves screen direction, and avoids unrequested jumps.", "Clarified camera and subject motion continuity.");
  if (issues.has("physical-continuity")) update("finalGenerationRule", "video-rules", "Preserve gravity, ground contact, object ownership, physical contact, screen direction, and connected impacts; no floating, sliding, teleportation, duplication, mutation, or position resets.", "Strengthened physical and object continuity safeguards.");
  if (issues.has("audio-synchronization")) {
    if (form.noMusic || form.musicStyle === "no-music") repaired.musicPath = "No Music. Preserve only synchronized visible-action sound effects.";
    update("soundEffects", "sound-effects", "Every sound must correspond to a visible or logically caused action and align with its exact impact or reaction.", "Synchronized audio direction with visible actions.");
  }
  if (issues.has("model-compatibility")) update("videoLock", "video-lock", `Model-ready format for ${form.videoModel}: ${form.duration} seconds at ${form.videoRatio}; Start and End Frames inherit this global ratio.`, "Added the selected model, duration, and ratio contract.");
  if (issues.has("video-rules")) update("finalGenerationRule", "video-rules", "Preserve locked identities, continuity, camera readability, motion physics, object interaction, audio synchronization, and error prevention. Video Rules are the final safeguards.", "Completed and positioned the execution safeguards.");
  return { pack: repaired, changedSections: [...new Set(changedSections)], improvements: [...new Set(improvements)] };
}

export function optimizePromptPackage(pack: ProductionPack, form: ProductionForm, characters: CharacterProfile[], mode: "demo" | "ai", selectedOutputTypes: string[], maxPasses = 2): PromptQualityRepairResult {
  const context = promptQualityContext(form, characters, mode, selectedOutputTypes);
  const previousAnalysis = analyzePromptPackage(pack, context);
  let bestPack = pack;
  let bestAnalysis = previousAnalysis;
  let changedSections: PromptPackageSectionId[] = [];
  let improvements: string[] = [];
  for (let pass = 0; pass < Math.min(2, maxPasses) && (bestAnalysis.score < 90 || bestAnalysis.promptBalance.score < 5.5) && bestAnalysis.repairableIssueCount; pass += 1) {
    const repaired = repairPromptPackage(bestPack, form, characters, bestAnalysis);
    const next = analyzePromptPackage(repaired.pack, context);
    if (!repaired.changedSections.length || !isRepairImprovement(bestAnalysis, next)) break;
    bestPack = repaired.pack; bestAnalysis = next;
    changedSections = [...new Set([...changedSections, ...repaired.changedSections])];
    improvements = [...new Set([...improvements, ...repaired.improvements])];
  }
  return { previousScore: previousAnalysis.score, newScore: bestAnalysis.score, previousAnalysis, newAnalysis: bestAnalysis, changedSections, improvements, pack: bestPack };
}

export function maximizePromptQuality(pack: ProductionPack, form: ProductionForm, characters: CharacterProfile[], mode: "demo" | "ai", selectedOutputTypes: string[]): PromptQualityRepairResult {
  const context = promptQualityContext(form, characters, mode, selectedOutputTypes);
  const previousAnalysis = analyzePromptPackage(pack, context);
  let bestPack = pack; let bestAnalysis = previousAnalysis; let changedSections: PromptPackageSectionId[] = []; let improvements: string[] = [];
  for (let pass = 0; pass < 3 && bestAnalysis.score < 98 && bestAnalysis.repairableIssueCount; pass += 1) {
    const repaired = repairPromptPackage(bestPack, form, characters, bestAnalysis);
    const next = analyzePromptPackage(repaired.pack, context);
    if (!repaired.changedSections.length || !isRepairImprovement(bestAnalysis, next)) break;
    bestPack = repaired.pack; bestAnalysis = next; changedSections = [...new Set([...changedSections, ...repaired.changedSections])]; improvements = [...new Set([...improvements, ...repaired.improvements])];
  }
  return { previousScore: previousAnalysis.score, newScore: bestAnalysis.score, previousAnalysis, newAnalysis: bestAnalysis, changedSections, improvements, pack: bestPack };
}
