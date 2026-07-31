import type { ProductionPack } from "./production-types";
import type { PromptQualityCheck, PromptQualityIssueCode } from "./prompt-quality";

export type PromptRepairContext = { characterNames: string[]; objectName: string; locationName: string };

const PHYSICAL_SCREEN = /\b(?:hiding|folding|privacy|projection|wooden|portable|decorative|room divider)\s+screen\b/gi;
const INTERNAL_LANGUAGE = /\b(?:authorized ground|authorized path|other opposing character|remaining path obstruction|begin the next beat from|unchanged cast|source zone|target zone)\b/gi;
const timedRanges = (value: string) => [...value.matchAll(/0:\d{2}[–—-]0:\d{2}/g)].map((match) => match[0]);

function replaceTimedRanges(value: string, ranges: string[]) {
  let index = 0;
  return value.replace(/0:\d{2}[–—-]0:\d{2}/g, () => ranges[index++] || ranges.at(-1) || "0:00–0:00");
}

function finalPayoff({ characterNames, objectName }: PromptRepairContext) {
  const hero = characterNames[0] || "The hero";
  const opponents = characterNames.slice(1);
  const opponentText = opponents.length >= 2 ? `${opponents[0]} and ${opponents[1]}` : opponents[0] || "the opponents";
  return `${opponentText} complete their soft collision and settle shoulder-to-shoulder in one readable defeated seated pose near the upper path. The ${objectName} rolls past them, wobbles once, and stops upright beside them with its defining mark visible. ${hero} remains safely downhill, turns toward the camera, and smiles after all movement settles.`;
}

function removeUnauthorizedScreen(value: string, context: PromptRepairContext) {
  if (!PHYSICAL_SCREEN.test(value)) { PHYSICAL_SCREEN.lastIndex = 0; return value; }
  PHYSICAL_SCREEN.lastIndex = 0;
  const opponents = context.characterNames.slice(1);
  const replacement = `the returning ${context.objectName} forces ${opponents[0] || "the first opponent"} to jump sideways into ${opponents[1] || "the other opponent"}; both lose balance while the ${context.objectName} continues toward its final position`;
  return value.replace(/(0:\d{2}[–—-]0:\d{2}\s*[—-]\s*)?(?:The\s+)?[^.!?\n]*\b(?:hiding|folding|privacy|projection|wooden|portable|decorative|room divider)\s+screen\b[^.!?\n]*[.!?]?/gi, (_match, timing = "") => `${timing}${replacement}.`);
}

export function repairPromptQualityIssue(pack: ProductionPack, issue: PromptQualityCheck, context: PromptRepairContext): ProductionPack {
  const next = { ...pack };
  switch (issue.code) {
    case "inventory-false-positive": return next;
    case "unauthorized-movable-object":
      next.videoTimeline = removeUnauthorizedScreen(next.videoTimeline, context);
      next.endFramePrompt = removeUnauthorizedScreen(next.endFramePrompt, context);
      next.soundEffects = removeUnauthorizedScreen(next.soundEffects, context);
      next.videoLock = removeUnauthorizedScreen(next.videoLock, context);
      return next;
    case "missing-character-final-state":
    case "missing-object-final-state":
    case "unreachable-final-state": {
      const payoff = finalPayoff(context);
      if (!next.videoTimeline.includes(payoff)) next.videoTimeline = `${next.videoTimeline.trim()}\n${payoff}`;
      if (!next.endFramePrompt.includes(payoff)) next.endFramePrompt = `${next.endFramePrompt.trim()}\n${payoff}`;
      if (issue.code === "missing-object-final-state" && !/wobble|settling scrape/i.test(next.soundEffects)) next.soundEffects = `${next.soundEffects.trim()}\nFinal cue — ${context.objectName} wobble, friction slowdown, and settling scrape.`;
      return next;
    }
    case "incomplete-object-trajectory":
    case "wrong-action-owner":
    case "contradictory-object-direction":
    case "impossible-collision":
    case "generic-payoff":
    case "generic-video-beat":
    case "unresolved-placeholder":
      next.videoTimeline = `${next.videoTimeline.trim()}\n${finalPayoff(context)}`;
      return next;
    case "malformed-physical-action":
    case "multiple-contact-methods":
      next.videoTimeline = next.videoTimeline
        .replace(/(?:using|with)\s+(?:a\s+)?foot\s+or\s+tail(?:\s+contact)?/gi, `with one visible tail tap against the ${context.objectName}'s lower side`)
        .replace(/(?:paw|hand)\s+or\s+(?:paw|hand)/gi, "one paw")
        .replace(/pushes\s+or\s+taps/gi, "taps")
        .replace(/sidesteps\s+or\s+jumps/gi, "sidesteps");
      return next;
    case "audio-timing-mismatch": {
      const ranges = timedRanges(next.videoTimeline);
      next.musicPath = replaceTimedRanges(next.musicPath, ranges);
      next.soundEffects = replaceTimedRanges(next.soundEffects, ranges);
      return next;
    }
    case "location-vocabulary-conflict":
      next.startFramePrompt = next.startFramePrompt.replace(/(?:center of the )?seaside boardwalk/gi, `upper area beside ${context.locationName}`);
      next.endFramePrompt = next.endFramePrompt.replace(/(?:center of the )?seaside boardwalk/gi, `upper area beside ${context.locationName}`);
      next.videoTimeline = next.videoTimeline.replace(/(?:center of the )?seaside boardwalk/gi, `upper area beside ${context.locationName}`);
      return next;
    case "internal-model-facing-language":
      next.startFramePrompt = next.startFramePrompt.replace(INTERNAL_LANGUAGE, "the visible scene");
      next.endFramePrompt = next.endFramePrompt.replace(INTERNAL_LANGUAGE, "the visible scene");
      next.videoTimeline = next.videoTimeline.replace(INTERNAL_LANGUAGE, "the visible scene");
      return next;
  }
}

export function applyIssueSpecificPromptRepairs(pack: ProductionPack, issues: PromptQualityCheck[], context: PromptRepairContext): ProductionPack {
  return issues.filter((issue) => issue.active && issue.repairable).reduce((candidate, issue) => repairPromptQualityIssue(candidate, issue, context), { ...pack });
}

export const SUPPORTED_PROMPT_REPAIR_CODES: PromptQualityIssueCode[] = ["unauthorized-movable-object", "inventory-false-positive", "missing-character-final-state", "missing-object-final-state", "incomplete-object-trajectory", "wrong-action-owner", "contradictory-object-direction", "malformed-physical-action", "multiple-contact-methods", "impossible-collision", "unreachable-final-state", "audio-timing-mismatch", "location-vocabulary-conflict", "internal-model-facing-language", "generic-payoff", "generic-video-beat", "unresolved-placeholder"];
