import type { ProductionForm, ProductionTimeline, ProductionTimelineBeat, TimingStructureMode } from "./production-types";

export type AutomaticTimelineInput = {
  durationSeconds: number; videoModel: string; characterCount: number; pacing: string;
  actionComplexity: "simple" | "moderate" | "complex"; endingType?: string; variation?: number;
};
export type TimelineValidationResult = { valid: boolean; errors: string[] };

const beatRanges: Array<[number, number, number]> = [[5, 3, 2], [10, 4, 3], [15, 5, 4], [20, 6, 5], [30, 8, 7], [45, 12, 10], [60, 15, 12]];
const labels = ["Hook", "Action setup", "Development", "Escalation", "Peak or reversal", "Payoff"];

function targetBeatCount(duration: number, complexity: AutomaticTimelineInput["actionComplexity"], characterCount: number, variation = 0) {
  const range = beatRanges.find(([limit]) => duration <= limit) || beatRanges[beatRanges.length - 1];
  const base = range[2];
  const adjustment = complexity === "complex" ? 1 : complexity === "simple" ? -1 : 0;
  return Math.max(2, Math.min(range[1], base + adjustment + (characterCount > 3 ? 1 : 0) + (variation % 2)));
}

export function buildAutomaticTimeline(input: AutomaticTimelineInput): ProductionTimeline {
  const durationSeconds = Math.max(1, Number(input.durationSeconds) || 15);
  const count = targetBeatCount(durationSeconds, input.actionComplexity, input.characterCount, input.variation);
  const beats: ProductionTimelineBeat[] = Array.from({ length: count }, (_, index) => {
    const startSeconds = Number((durationSeconds * index / count).toFixed(1));
    const endSeconds = index === count - 1 ? durationSeconds : Number((durationSeconds * (index + 1) / count).toFixed(1));
    const stageIndex = count <= 3 ? [0, 3, 5][index] : Math.round(index * (labels.length - 1) / (count - 1));
    const label = labels[stageIndex];
    return {
      id: `auto-${index}-${startSeconds}-${endSeconds}`, startSeconds, endSeconds, label,
      visualAction: label === "Hook" ? "Establish the immediate visual hook and readable starting state."
        : label === "Payoff" ? `Complete the ${input.endingType || "ending"} and settle every character and object.`
          : `${label} advances the main action with ${input.pacing || "balanced"} pacing.`,
      cameraDirection: `Use model-aware framing for ${input.videoModel}.`,
      continuityNote: "Inherit every character, object, and screen position from the preceding beat.",
    };
  });
  return { mode: "automatic", durationSeconds, beats };
}

export function validateProductionTimeline(timeline: ProductionTimeline, durationSeconds: number): TimelineValidationResult {
  const errors: string[] = [];
  const beats = timeline.beats;
  if (!beats.length) errors.push("Add at least one timeline beat.");
  if (beats.length && beats[0].startSeconds !== 0) errors.push("The first beat must start at zero.");
  beats.forEach((beat, index) => {
    if (beat.startSeconds < 0 || beat.endSeconds < 0) errors.push(`Beat ${index + 1} cannot use negative time.`);
    if (beat.endSeconds <= beat.startSeconds) errors.push(`Beat ${index + 1} must end after it starts.`);
    if (beat.endSeconds > durationSeconds) errors.push(`Beat ${index + 1} exceeds the selected duration.`);
    if (!beat.visualAction.trim()) errors.push(`Beat ${index + 1} needs a visual action.`);
    if (index > 0 && beat.startSeconds !== beats[index - 1].endSeconds) errors.push(beat.startSeconds < beats[index - 1].endSeconds ? `Beat ${index + 1} overlaps the previous beat.` : `A gap exists before beat ${index + 1}.`);
  });
  if (beats.length && beats[beats.length - 1].endSeconds !== durationSeconds) errors.push("The final beat must end at the selected duration.");
  if (beats.length > Math.max(3, Math.ceil(durationSeconds / 2))) errors.push("The timeline contains too many beats for the selected duration.");
  return { valid: errors.length === 0, errors: [...new Set(errors)] };
}

export function normalizeProductionFormat(value: Partial<ProductionForm> & { model?: string; ratio?: string; generationMode?: string } = {}): {
  videoModel: string; durationSeconds: number; videoRatio: string; generationMode: "ai" | "demo";
  timingStructureMode: TimingStructureMode; timeline: ProductionTimeline; resolution?: string;
} {
  const durationSeconds = Number(value.duration) || 15;
  const timingStructureMode: TimingStructureMode = value.timingStructureMode === "custom" ? "custom" : "automatic";
  const savedTimeline = value.productionTimeline?.beats?.length ? value.productionTimeline : null;
  const timeline = savedTimeline || buildAutomaticTimeline({ durationSeconds, videoModel: value.videoModel || value.model || "Seedance", characterCount: 1, pacing: "balanced", actionComplexity: "moderate" });
  return {
    videoModel: value.videoModel || value.model || "Seedance", durationSeconds,
    videoRatio: value.videoRatio || value.ratio || "9:16",
    generationMode: value.generationMode === "ai" ? "ai" : "demo", timingStructureMode,
    timeline: { ...timeline, mode: timingStructureMode, durationSeconds }, resolution: value.resolution,
  };
}

export function formatTimelineTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainder = Number((seconds % 60).toFixed(1));
  return `${minutes}:${String(remainder).padStart(4, "0")}`;
}
