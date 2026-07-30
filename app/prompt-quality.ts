import { CharacterProfile, ProductionForm, ProductionPack } from "./production-types";

export type PromptQualityLevel = "maximum" | "expert" | "production-ready" | "needs-refinement" | "major-issues";
export type PromptQualityStatus = "pass" | "warning" | "fail";
export type PromptPackageSectionId = "characters" | "start-frame" | "end-frame" | "video-lock" | "video-prompt" | "music" | "sound-effects" | "video-rules" | "timeline" | "negative-prompt";
export type PromptQualityCategoryId = "character-consistency" | "video-lock" | "action-flow" | "frame-continuity" | "camera-motion" | "physical-continuity" | "audio-synchronization" | "model-compatibility" | "video-rules" | "prompt-balance";

export type PromptQualityCheck = {
  id: string; categoryId: PromptQualityCategoryId; label: string; status: PromptQualityStatus;
  score: number; maxScore: number; message: string; affectedSections: PromptPackageSectionId[];
  repairable: boolean; severity: "critical" | "major" | "minor";
};
export type PromptQualityCategory = { id: PromptQualityCategoryId; label: string; weight: number; earnedScore: number; maxScore: number; checks: PromptQualityCheck[] };
export type PromptQualityCap = { id: string; reason: string; maximumScore: number };
export type PromptQualityAnalysis = {
  score: number; level: PromptQualityLevel; label: string; categories: PromptQualityCategory[];
  passedChecks: PromptQualityCheck[]; warnings: PromptQualityCheck[]; failedChecks: PromptQualityCheck[];
  hardCapsApplied: PromptQualityCap[]; repairableIssueCount: number; criticalIssueCount: number;
  analyzedAt: string; analysisVersion: string; mode: "demo" | "ai";
};
export type PromptQualityContext = {
  mode: "demo" | "ai"; selectedCharacters: CharacterProfile[]; durationSeconds: number;
  videoRatio: string; videoModel: string; videoType: string; voiceMode: string;
  musicEnabled: boolean; selectedOutputTypes: string[];
};
export type PromptQualityRepairResult = {
  previousScore: number; newScore: number; previousAnalysis: PromptQualityAnalysis; newAnalysis: PromptQualityAnalysis;
  changedSections: PromptPackageSectionId[]; improvements: string[]; pack: ProductionPack;
};

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

export function normalizePromptText(value = "") { return value.toLowerCase().replace(/\s+/g, " ").trim(); }
export function estimateWordCount(value = "") { return value.trim() ? value.trim().split(/\s+/).length : 0; }
export function detectRepeatedInstructions(value = "") {
  const sentences = value.split(/[.!?\n]+/).map(normalizePromptText).filter((sentence) => sentence.length > 24);
  return sentences.length - new Set(sentences).size;
}
export function calculateActionDensity(value: string, durationSeconds: number) {
  const beats = (value.match(/\b(?:then|next|after|finally|0:\d{2}|\d+\s*-\s*\d+\s*seconds?)\b/gi) || []).length;
  return beats / Math.max(1, durationSeconds / 5);
}
function contains(text: string, values: string[]) { const normalized = normalizePromptText(text); return values.some((value) => normalized.includes(normalizePromptText(value))); }
function allNames(text: string, characters: CharacterProfile[]) { return characters.every((character) => contains(text, [character.shortName])); }
function makeCheck(categoryId: PromptQualityCategoryId, ok: boolean, partial: boolean, message: string, sections: PromptPackageSectionId[], severity: PromptQualityCheck["severity"] = "major"): PromptQualityCheck {
  const maxScore = PROMPT_QUALITY_WEIGHTS[categoryId];
  const status: PromptQualityStatus = ok ? "pass" : partial ? "warning" : "fail";
  return { id: `${categoryId}-core`, categoryId, label: CATEGORY_LABELS[categoryId], status, score: ok ? maxScore : partial ? Math.round(maxScore * .65) : 0, maxScore, message, affectedSections: sections, repairable: !ok, severity };
}

export function analyzePromptPackage(pack: ProductionPack, context: PromptQualityContext): PromptQualityAnalysis {
  const complete = [pack.characterBuildingPrompt, pack.startFramePrompt, pack.endFramePrompt, pack.videoLock, pack.videoTimeline, pack.musicPath, pack.soundEffects, pack.finalGenerationRule].join("\n");
  const ratioPresent = contains(`${pack.videoLock}\n${pack.startFramePrompt}\n${pack.endFramePrompt}`, [context.videoRatio]);
  const durationPresent = contains(`${pack.videoLock}\n${pack.videoTimeline}`, [`${context.durationSeconds}`]);
  const namesInCharacter = allNames(pack.characterBuildingPrompt, context.selectedCharacters);
  const namesInLock = allNames(pack.videoLock, context.selectedCharacters);
  const frameNames = context.selectedCharacters.length === 0 || context.selectedCharacters.some((character) => contains(`${pack.startFramePrompt}\n${pack.endFramePrompt}`, [character.shortName]));
  const actionDensity = calculateActionDensity(pack.videoTimeline, context.durationSeconds);
  const repeated = detectRepeatedInstructions(complete);
  const noDialogueConflict = /no spoken dialogue/i.test(context.voiceMode) && /\b(?:says|speaks|dialogue:)\b/i.test(`${pack.videoTimeline}\n${pack.soundEffects}`);
  const characterIdentityConflict = context.selectedCharacters.some((character) => {
    const otherRoles = ["Hero", "Enemy", "Companion"].filter((role) => role !== character.role).join("|");
    return new RegExp(`${character.shortName}.{0,60}\\b(?:${otherRoles})\\b`, "i").test(`${pack.characterBuildingPrompt}\n${pack.videoLock}`);
  });
  const checks: PromptQualityCheck[] = [
    makeCheck("character-consistency", namesInCharacter && namesInLock, namesInCharacter || namesInLock, namesInCharacter && namesInLock ? "Every selected character and role is consistently represented." : "One or more selected character identities are missing from Character information or Video Lock.", ["characters", "video-lock"], "critical"),
    makeCheck("video-lock", Boolean(pack.videoLock.trim()) && ratioPresent && durationPresent && /continu|lock|immutable/i.test(pack.videoLock), Boolean(pack.videoLock.trim()), "Video Lock must define immutable identities, ratio, duration, and frame continuity.", ["video-lock"], "critical"),
    makeCheck("action-flow", Boolean(pack.videoTimeline.trim()) && actionDensity <= 4 && /(?:opening|begin|start|0:00)/i.test(pack.videoTimeline) && /(?:payoff|final|end)/i.test(pack.videoTimeline), Boolean(pack.videoTimeline.trim()), "Video Prompt needs a clear opening hook, chronological action, and reachable payoff at duration-appropriate density.", ["video-prompt", "timeline"]),
    makeCheck("frame-continuity", Boolean(pack.startFramePrompt.trim() && pack.endFramePrompt.trim()) && frameNames && ratioPresent, Boolean(pack.startFramePrompt.trim() || pack.endFramePrompt.trim()), "Start and End Frames must preserve the selected cast, scene continuity, and global ratio.", ["start-frame", "end-frame"], "critical"),
    makeCheck("camera-motion", /camera|framing|shot|track|locked/i.test(`${pack.videoLock}\n${pack.videoTimeline}`) && /motion|movement|move/i.test(pack.videoTimeline), /camera|shot/i.test(complete), "Camera direction and subject motion must be concrete, readable, and keep the main action visible.", ["video-lock", "video-prompt"]),
    makeCheck("physical-continuity", /gravity|ground|contact|ownership|no teleport|physical|screen direction/i.test(complete), /impact|collision|holds|grips/i.test(complete), "Add concise safeguards for gravity, ground contact, object ownership, impacts, and position continuity.", ["video-prompt", "video-rules"]),
    makeCheck("audio-synchronization", context.musicEnabled ? Boolean(pack.musicPath.trim() && pack.soundEffects.trim()) : /no music/i.test(pack.musicPath), Boolean(pack.soundEffects.trim()), context.musicEnabled ? "Music and sound effects must exist and synchronize only with visible actions." : "No Music must be explicit while visible-action sound effects remain synchronized.", ["music", "sound-effects"]),
    makeCheck("model-compatibility", contains(complete, [context.videoModel]) && ratioPresent && durationPresent, ratioPresent && durationPresent, "The prompt package must identify the selected model, duration, ratio, and reference-frame structure.", ["video-lock", "start-frame", "end-frame"]),
    makeCheck("video-rules", Boolean(pack.finalGenerationRule.trim()) && /identity|continu|camera|motion|audio|object|error|do not|no /i.test(pack.finalGenerationRule), Boolean(pack.finalGenerationRule.trim()), "Video Rules must end the package with concise identity, continuity, motion, object, audio, and error-prevention safeguards.", ["video-rules"], "critical"),
    makeCheck("prompt-balance", estimateWordCount(complete) >= 180 && repeated <= 3, estimateWordCount(complete) >= 90 && repeated <= 8, repeated ? `${repeated} repeated instructions reduce clarity; consolidate duplicates without removing safeguards.` : "Section hierarchy, semantic balance, readable formatting, and minimal repetition are required.", ["video-lock", "video-prompt", "video-rules"]),
  ];
  const caps: PromptQualityCap[] = [];
  if (!pack.videoLock.trim()) caps.push({ id: "missingVideoLock", reason: "Video Lock is missing.", maximumScore: PROMPT_QUALITY_CAPS.missingVideoLock });
  if (!pack.finalGenerationRule.trim()) caps.push({ id: "missingVideoRules", reason: "Video Rules are missing.", maximumScore: PROMPT_QUALITY_CAPS.missingVideoRules });
  if (!namesInCharacter && !namesInLock) caps.push({ id: "missingSelectedCharacter", reason: "A selected character is missing.", maximumScore: PROMPT_QUALITY_CAPS.missingSelectedCharacter });
  if (characterIdentityConflict) caps.push({ id: "characterIdentityConflict", reason: "A selected character has a conflicting role or identity.", maximumScore: PROMPT_QUALITY_CAPS.characterIdentityConflict });
  if (!pack.startFramePrompt.trim() || !pack.endFramePrompt.trim() || !pack.videoTimeline.trim()) caps.push({ id: "emptyRequiredSection", reason: "A required prompt section is empty.", maximumScore: PROMPT_QUALITY_CAPS.emptyRequiredSection });
  if (!frameNames || !ratioPresent) caps.push({ id: "frameContinuityConflict", reason: "Frame identity or global-ratio continuity conflicts.", maximumScore: PROMPT_QUALITY_CAPS.frameContinuityConflict });
  if (actionDensity > 4) caps.push({ id: "impossibleActionDensity", reason: "Action density exceeds the selected duration.", maximumScore: PROMPT_QUALITY_CAPS.impossibleActionDensity });
  if (noDialogueConflict) caps.push({ id: "conflictingDialogueRules", reason: "Spoken dialogue conflicts with No Spoken Dialogue.", maximumScore: PROMPT_QUALITY_CAPS.conflictingDialogueRules });
  if (!/(?:opening|begin|start|0:00)/i.test(pack.videoTimeline)) caps.push({ id: "missingOpeningHook", reason: "The Video Prompt lacks a clear opening hook.", maximumScore: PROMPT_QUALITY_CAPS.missingOpeningHook });
  if (!/(?:payoff|final|end)/i.test(pack.videoTimeline)) caps.push({ id: "missingEndPayoff", reason: "The Video Prompt lacks a readable final payoff.", maximumScore: PROMPT_QUALITY_CAPS.missingEndPayoff });
  let score = checks.reduce((total, check) => total + check.score, 0);
  score = caps.reduce((current, cap) => Math.min(current, cap.maximumScore), score);
  score = Math.min(98, Math.max(0, Math.round(score)));
  const level = getPromptQualityLevel(score);
  const categories = checks.map((check) => ({ id: check.categoryId, label: CATEGORY_LABELS[check.categoryId], weight: check.maxScore, earnedScore: check.score, maxScore: check.maxScore, checks: [check] }));
  return { score, ...level, categories, passedChecks: checks.filter((check) => check.status === "pass"), warnings: checks.filter((check) => check.status === "warning"), failedChecks: checks.filter((check) => check.status === "fail"), hardCapsApplied: caps, repairableIssueCount: checks.filter((check) => check.repairable).length, criticalIssueCount: checks.filter((check) => check.severity === "critical" && check.status !== "pass").length, analyzedAt: new Date().toISOString(), analysisVersion: "1.0.0", mode: context.mode };
}

export function promptQualityContext(form: ProductionForm, characters: CharacterProfile[], mode: "demo" | "ai", selectedOutputTypes: string[]): PromptQualityContext {
  return { mode, selectedCharacters: characters, durationSeconds: Number(form.duration) || 15, videoRatio: form.videoRatio, videoModel: form.videoModel === "Custom model" ? form.customVideoModel : form.videoModel, videoType: form.videoStyleId || form.visualStyle, voiceMode: form.voiceLayers.join(", "), musicEnabled: !form.noMusic && form.musicStyle !== "no-music", selectedOutputTypes };
}

export function repairPromptPackage(pack: ProductionPack, form: ProductionForm, characters: CharacterProfile[], analysis: PromptQualityAnalysis): { pack: ProductionPack; changedSections: PromptPackageSectionId[]; improvements: string[] } {
  const repaired = { ...pack };
  const changedSections: PromptPackageSectionId[] = [];
  const improvements: string[] = [];
  const names = characters.map((character) => `${character.shortName} (${character.role}: ${character.fullIdentity || character.description})`).join("; ");
  const update = (key: keyof ProductionPack, section: PromptPackageSectionId, addition: string, improvement: string) => {
    if (normalizePromptText(repaired[key]).includes(normalizePromptText(addition))) return;
    repaired[key] = `${repaired[key].trim()}\n${addition}`.trim();
    changedSections.push(section); improvements.push(improvement);
  };
  const issues = new Set([...analysis.warnings, ...analysis.failedChecks].map((check) => check.categoryId));
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
  for (let pass = 0; pass < Math.min(2, maxPasses) && bestAnalysis.score < 90 && bestAnalysis.repairableIssueCount; pass += 1) {
    const repaired = repairPromptPackage(bestPack, form, characters, bestAnalysis);
    const next = analyzePromptPackage(repaired.pack, context);
    if (next.score <= bestAnalysis.score || next.criticalIssueCount > bestAnalysis.criticalIssueCount) break;
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
    if (next.score <= bestAnalysis.score || next.criticalIssueCount > bestAnalysis.criticalIssueCount) break;
    bestPack = repaired.pack; bestAnalysis = next; changedSections = [...new Set([...changedSections, ...repaired.changedSections])]; improvements = [...new Set([...improvements, ...repaired.improvements])];
  }
  return { previousScore: previousAnalysis.score, newScore: bestAnalysis.score, previousAnalysis, newAnalysis: bestAnalysis, changedSections, improvements, pack: bestPack };
}
