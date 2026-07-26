import {
  CreativeDirectionState,
  RuleChipId,
  defaultCreativeDirection,
  ruleChipIds,
} from "./production-types";

export type CreativeDirectionOption = {
  value: string;
  label: string;
  description: string;
};

export const VISUAL_MOOD_OPTIONS = [
  { value: "bright-colorful", label: "Bright & Colorful", description: "Bright lighting, vivid colors, cheerful atmosphere, and clear visual contrast." },
  { value: "dark-cinematic", label: "Dark & Cinematic", description: "Deep shadows, dramatic contrast, controlled highlights, and a serious cinematic tone." },
  { value: "warm-magical", label: "Warm & Magical", description: "Warm lighting, gentle glow, rich color harmony, and an inviting magical atmosphere." },
  { value: "soft-dreamy", label: "Soft & Dreamy", description: "Soft light, delicate colors, gentle contrast, and an ethereal dreamlike feeling." },
  { value: "cool-moody", label: "Cool & Moody", description: "Cool color temperature, atmospheric shadows, restrained highlights, and a reflective mood." },
  { value: "epic-dramatic", label: "Epic & Dramatic", description: "Powerful lighting, bold contrast, heightened scale, and strong dramatic atmosphere." },
  { value: "futuristic-neon", label: "Futuristic Neon", description: "Neon accents, reflective surfaces, bold contrast, and a futuristic high-tech atmosphere." },
  { value: "natural-realistic", label: "Natural & Realistic", description: "Natural lighting, believable colors, realistic atmosphere, and restrained visual styling." },
  { value: "minimal-clean", label: "Minimal & Clean", description: "Simple composition, controlled colors, clean lighting, and minimal visual distraction." },
  { value: "custom", label: "Custom", description: "" },
] as const satisfies readonly CreativeDirectionOption[];

export const CAMERA_STYLE_OPTIONS = [
  { value: "smooth-cinematic", label: "Smooth & Cinematic", description: "Smooth tracking movement, stable framing, gentle push-ins, and polished cinematic motion." },
  { value: "dynamic-energetic", label: "Dynamic & Energetic", description: "Active camera movement, dynamic framing, responsive tracking, and energetic visual motion." },
  { value: "locked-stable", label: "Locked & Stable", description: "Stable camera placement, controlled framing, minimal movement, and clear subject visibility." },
  { value: "slow-push-in", label: "Slow Push-In", description: "A gradual camera move toward the subject to build focus, emotion, or anticipation." },
  { value: "orbit-subject", label: "Orbit Around Subject", description: "The camera moves smoothly around the main subject while keeping the subject clearly framed." },
  { value: "fast-action-camera", label: "Fast Action Camera", description: "Quick tracking, responsive reframing, energetic movement, and action-focused composition." },
  { value: "overhead-top-down", label: "Overhead / Top-Down", description: "Elevated or top-down framing that clearly presents movement, layout, and spatial relationships." },
  { value: "handheld-realistic", label: "Handheld & Realistic", description: "Natural handheld movement with restrained shake and realistic documentary-style framing." },
  { value: "character-follow", label: "Character Follow", description: "The camera follows the primary character while preserving clear movement and spatial continuity." },
  { value: "custom", label: "Custom", description: "" },
] as const satisfies readonly CreativeDirectionOption[];

export const PACING_STYLE_OPTIONS = [
  { value: "fast-energetic", label: "Fast & Energetic", description: "Quick pacing, high character energy, strong reactions, and continuous visual movement." },
  { value: "calm-emotional", label: "Calm & Emotional", description: "Gentle pacing, expressive emotional beats, restrained movement, and clear character focus." },
  { value: "exaggerated-comedic", label: "Exaggerated & Comedic", description: "Bold reactions, amplified timing, expressive performance, and clear comedic escalation." },
  { value: "slow-suspenseful", label: "Slow & Suspenseful", description: "Controlled pacing, delayed reveals, rising tension, and deliberate performance beats." },
  { value: "natural-realistic", label: "Natural & Realistic", description: "Believable timing, restrained acting, natural reactions, and realistic movement." },
  { value: "epic-dramatic", label: "Epic & Dramatic", description: "Strong dramatic beats, powerful movement, heightened performance, and cinematic escalation." },
  { value: "gentle-family-friendly", label: "Gentle & Family-Friendly", description: "Clear pacing, warm expressions, readable actions, and soft family-friendly performance." },
  { value: "steady-informational", label: "Steady & Informational", description: "Clear structured pacing, controlled delivery, and an easy-to-follow visual progression." },
  { value: "gradual-build", label: "Gradual Build", description: "A measured opening that steadily increases energy and intensity toward the final payoff." },
  { value: "custom", label: "Custom", description: "" },
] as const satisfies readonly CreativeDirectionOption[];

export const RULE_CHIPS = [
  { id: "no-dialogue", label: "No Dialogue", text: "No dialogue." },
  { id: "no-sudden-cuts", label: "No Sudden Cuts", text: "No sudden cuts." },
  { id: "characters-visible", label: "Keep Characters Visible", text: "Keep all selected characters visible." },
  { id: "maintain-identity", label: "Maintain Identity", text: "Maintain character identity and appearance consistency." },
  { id: "family-friendly", label: "Family Friendly", text: "Keep all content family-friendly." },
  { id: "seamless-loop", label: "Seamless Loop Ending", text: "End with a seamless loop." },
] as const;

export function resolveCreativeDirectionValue(
  selectedValue: string,
  customValue: string,
  options: readonly CreativeDirectionOption[],
): string {
  if (selectedValue === "custom") return customValue.trim();
  const selectedOption = options.find((option) => option.value === selectedValue);
  return selectedOption ? `${selectedOption.label}: ${selectedOption.description}` : "";
}

export function resolveCreativeRules(manualRules: string, selectedChipIds: readonly RuleChipId[]): string {
  const chipRules = selectedChipIds
    .map((id) => RULE_CHIPS.find((chip) => chip.id === id)?.text)
    .filter(Boolean);
  return [manualRules.trim(), ...chipRules].filter(Boolean).join(" ").trim();
}

export function resolveCreativeDirection(state: CreativeDirectionState) {
  return {
    visualMood: resolveCreativeDirectionValue(state.visualMood, state.visualMoodCustom, VISUAL_MOOD_OPTIONS),
    cameraStyle: resolveCreativeDirectionValue(state.cameraStyle, state.cameraStyleCustom, CAMERA_STYLE_OPTIONS),
    pacingStyle: resolveCreativeDirectionValue(state.pacingStyle, state.pacingStyleCustom, PACING_STYLE_OPTIONS),
    creativeRules: resolveCreativeRules(state.creativeRulesManual, state.selectedRuleChipIds),
  };
}

export function migrateCreativeDirection(value: unknown): CreativeDirectionState {
  const item = value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
  const validRuleIds = Array.isArray(item.selectedRuleChipIds)
    ? item.selectedRuleChipIds.filter((id): id is RuleChipId => typeof id === "string" && ruleChipIds.includes(id as RuleChipId))
    : [];
  return {
    visualMood: typeof item.visualMood === "string" && VISUAL_MOOD_OPTIONS.some((option) => option.value === item.visualMood) ? item.visualMood : defaultCreativeDirection.visualMood,
    visualMoodCustom: typeof item.visualMoodCustom === "string" ? item.visualMoodCustom.slice(0, 200) : "",
    cameraStyle: typeof item.cameraStyle === "string" && CAMERA_STYLE_OPTIONS.some((option) => option.value === item.cameraStyle) ? item.cameraStyle : defaultCreativeDirection.cameraStyle,
    cameraStyleCustom: typeof item.cameraStyleCustom === "string" ? item.cameraStyleCustom.slice(0, 200) : "",
    pacingStyle: typeof item.pacingStyle === "string" && PACING_STYLE_OPTIONS.some((option) => option.value === item.pacingStyle) ? item.pacingStyle : defaultCreativeDirection.pacingStyle,
    pacingStyleCustom: typeof item.pacingStyleCustom === "string" ? item.pacingStyleCustom.slice(0, 200) : "",
    creativeRulesManual: typeof item.creativeRulesManual === "string"
      ? item.creativeRulesManual.slice(0, 300)
      : typeof item.creativeRules === "string"
        ? item.creativeRules.slice(0, 300)
        : "",
    selectedRuleChipIds: validRuleIds,
  };
}
