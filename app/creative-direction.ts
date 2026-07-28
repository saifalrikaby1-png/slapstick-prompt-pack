import {
  CameraMotionState,
  CameraStabilityValue,
  CameraStabilityOverride,
  CameraFramingValue,
  CameraStyleValue,
  CreativeDirectionState,
  DEFAULT_CAMERA_MOTION,
  MotionQualityRuleId,
  MovementIntensityValue,
  MotionEnergyValue,
  RuleChipId,
  SubjectMotionValue,
  defaultCreativeDirection,
  motionQualityRuleIds,
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
  { value: "smooth-cinematic", label: "Smooth Cinematic", description: "Stable tracking, gentle reframing, and polished cinematic movement." },
  { value: "character-follow", label: "Character Follow", description: "The camera follows the main subject while preserving visibility and screen direction." },
  { value: "dynamic-action", label: "Dynamic Action", description: "Responsive tracking and energetic reframing for fast movement and action." },
  { value: "locked-stable", label: "Locked & Stable", description: "Fixed or highly controlled framing with minimal camera movement." },
  { value: "handheld-realistic", label: "Handheld Realistic", description: "Natural handheld motion with restrained realistic shake." },
  { value: "custom", label: "Custom", description: "" },
] as const satisfies readonly CreativeDirectionOption[];

export const CAMERA_FRAMING_OPTIONS = [
  { value: "automatic", label: "Automatic", description: "The AI adjusts framing based on action clarity, character visibility, and continuity." },
  { value: "wide", label: "Wide", description: "Show the environment, characters, and spatial relationships clearly." },
  { value: "medium", label: "Medium", description: "Balance character performance with useful environmental context." },
  { value: "close-up", label: "Close-Up", description: "Prioritize facial expressions, reactions, and important visual detail." },
  { value: "full-body", label: "Full Body", description: "Keep the complete character body visible for physical action and movement." },
  { value: "over-the-shoulder", label: "Over-the-Shoulder", description: "Frame interaction from behind or beside one subject toward another." },
] as const satisfies readonly CreativeDirectionOption[];

export const MOTION_ENERGY_OPTIONS = [
  { value: "controlled", label: "Controlled", description: "Stable, restrained, and precise movement with minimal distraction." },
  { value: "balanced", label: "Balanced", description: "Smooth professional movement with moderate energy and clear readability." },
  { value: "expressive", label: "Expressive", description: "Stronger, more dynamic movement suited to action, comedy, or heightened emotion." },
] as const;

export function resolveMotionEnergy(
  motionEnergy: MotionEnergyValue,
  cameraStabilityOverride: CameraStabilityOverride,
): { movementIntensity: MovementIntensityValue; cameraStability: CameraStabilityValue } {
  const defaults = {
    controlled: { movementIntensity: "subtle" as const, cameraStability: "stable" as const },
    balanced: { movementIntensity: "balanced" as const, cameraStability: "stable" as const },
    expressive: { movementIntensity: "dynamic" as const, cameraStability: "expressive" as const },
  };
  const resolved = defaults[motionEnergy];
  return {
    movementIntensity: resolved.movementIntensity,
    cameraStability: cameraStabilityOverride === "auto" ? resolved.cameraStability : cameraStabilityOverride,
  };
}

export const MOVEMENT_INTENSITY_OPTIONS = [
  { value: "subtle", label: "Subtle", description: "Restrained camera movement that supports the scene without drawing attention." },
  { value: "balanced", label: "Balanced", description: "Professional camera movement with clear energy and controlled readability." },
  { value: "dynamic", label: "Dynamic", description: "Stronger, more energetic movement for action, comedy, or heightened intensity." },
] as const satisfies readonly CreativeDirectionOption[];

export const CAMERA_STABILITY_OPTIONS = [
  { value: "stable", label: "Stable", description: "Smooth and controlled camera behavior with minimal shake." },
  { value: "natural", label: "Natural", description: "Gentle realistic camera variation while maintaining clear framing." },
  { value: "expressive", label: "Expressive", description: "More pronounced camera behavior that responds visibly to action and performance." },
] as const satisfies readonly CreativeDirectionOption[];

export const SUBJECT_MOTION_OPTIONS = [
  { value: "natural-controlled", label: "Natural & Controlled", description: "Believable character and object motion with controlled timing and weight." },
  { value: "smooth-cinematic", label: "Smooth & Cinematic", description: "Polished subject movement with fluid transitions and restrained physical performance." },
  { value: "fast-energetic", label: "Fast & Energetic", description: "Quick, active subject movement with continuous energy and clear direction." },
  { value: "exaggerated-comedic", label: "Exaggerated & Comedic", description: "Amplified poses, reactions, timing, and physical comedy while preserving readability." },
  { value: "realistic-physical", label: "Realistic Physical Motion", description: "Weight, momentum, balance, contact, and object interaction should remain physically believable." },
  { value: "custom", label: "Custom", description: "" },
] as const satisfies readonly CreativeDirectionOption[];

export const MOTION_QUALITY_RULES = [
  { id: "smooth-continuous-movement", label: "Smooth continuous movement", prompt: "Keep camera, character, and object motion smooth and continuous." },
  { id: "no-sudden-camera-jumps", label: "No sudden camera jumps", prompt: "Do not introduce sudden camera jumps or unexplained reframing." },
  { id: "no-unrequested-cuts", label: "No unrequested cuts", prompt: "Do not add cuts unless explicitly required by the selected production structure." },
  { id: "preserve-screen-direction", label: "Preserve screen direction", prompt: "Preserve consistent screen direction and spatial continuity." },
  { id: "keep-characters-visible", label: "Keep selected characters visible", prompt: "Keep all selected characters visible whenever required by the scene action." },
  { id: "realistic-ground-contact", label: "Maintain realistic ground contact", prompt: "Maintain realistic foot placement, body balance, and ground contact." },
  { id: "avoid-floating-sliding", label: "Avoid floating or sliding", prompt: "Prevent characters and objects from floating, drifting, or sliding unnaturally." },
  { id: "objects-physically-connected", label: "Keep objects physically connected", prompt: "Keep held, attached, or interacting objects physically connected to the correct character or surface." },
  { id: "match-motion-to-pacing", label: "Match movement speed to pacing", prompt: "Match camera and subject movement speed to the selected pacing and performance style." },
] as const;

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

export function resolveCameraMotion(cameraMotion: CameraMotionState) {
  const resolvedMotion = resolveMotionEnergy(cameraMotion.motionEnergy, cameraMotion.cameraStabilityOverride);
  return {
    cameraStyle: resolveCreativeDirectionValue(cameraMotion.cameraStyle, cameraMotion.cameraStyleCustom, CAMERA_STYLE_OPTIONS),
    customInstructions: cameraMotion.cameraCustomInstructions.trim(),
    framing: resolveCreativeDirectionValue(cameraMotion.framing, "", CAMERA_FRAMING_OPTIONS),
    motionEnergy: cameraMotion.motionEnergy,
    movementIntensity: resolvedMotion.movementIntensity,
    cameraStability: resolvedMotion.cameraStability,
    subjectMotion: resolveCreativeDirectionValue(cameraMotion.subjectMotion, cameraMotion.subjectMotionCustom, SUBJECT_MOTION_OPTIONS),
    qualityRules: cameraMotion.motionQualityRuleIds.flatMap((id) => {
      const prompt = MOTION_QUALITY_RULES.find((rule) => rule.id === id)?.prompt;
      return prompt ? [prompt] : [];
    }),
  };
}

export function resolveCreativeDirection(state: CreativeDirectionState) {
  return {
    visualMood: resolveCreativeDirectionValue(state.visualMood, state.visualMoodCustom, VISUAL_MOOD_OPTIONS),
    cameraMotion: resolveCameraMotion(state.cameraMotion),
    pacingStyle: resolveCreativeDirectionValue(state.pacingStyle, state.pacingStyleCustom, PACING_STYLE_OPTIONS),
    creativeRules: resolveCreativeRules(state.creativeRulesManual, state.selectedRuleChipIds),
  };
}

export function migrateCreativeDirection(value: unknown): CreativeDirectionState {
  const item = value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
  const cameraItem = item.cameraMotion && typeof item.cameraMotion === "object" && !Array.isArray(item.cameraMotion)
    ? item.cameraMotion as Record<string, unknown>
    : item;
  const validRuleIds = Array.isArray(item.selectedRuleChipIds)
    ? item.selectedRuleChipIds.filter((id): id is RuleChipId => typeof id === "string" && ruleChipIds.includes(id as RuleChipId))
    : [];
  const legacyMovementIntensity = typeof cameraItem.movementIntensity === "string" && MOVEMENT_INTENSITY_OPTIONS.some((option) => option.value === cameraItem.movementIntensity)
    ? cameraItem.movementIntensity as MovementIntensityValue
    : DEFAULT_CAMERA_MOTION.movementIntensity;
  const legacyCameraStability = typeof cameraItem.cameraStability === "string" && CAMERA_STABILITY_OPTIONS.some((option) => option.value === cameraItem.cameraStability)
    ? cameraItem.cameraStability as CameraStabilityValue
    : DEFAULT_CAMERA_MOTION.cameraStability;
  const migratedMotionEnergy: MotionEnergyValue = typeof cameraItem.motionEnergy === "string" && MOTION_ENERGY_OPTIONS.some((option) => option.value === cameraItem.motionEnergy)
    ? cameraItem.motionEnergy as MotionEnergyValue
    : legacyMovementIntensity === "subtle" ? "controlled" : legacyMovementIntensity === "dynamic" ? "expressive" : "balanced";
  const migratedStabilityOverride: CameraStabilityOverride = typeof cameraItem.cameraStabilityOverride === "string" && ["auto", "stable", "natural", "expressive"].includes(cameraItem.cameraStabilityOverride)
    ? cameraItem.cameraStabilityOverride as CameraStabilityOverride
    : legacyCameraStability === resolveMotionEnergy(migratedMotionEnergy, "auto").cameraStability ? "auto" : legacyCameraStability;
  return {
    visualMood: typeof item.visualMood === "string" && VISUAL_MOOD_OPTIONS.some((option) => option.value === item.visualMood) ? item.visualMood : defaultCreativeDirection.visualMood,
    visualMoodCustom: typeof item.visualMoodCustom === "string" ? item.visualMoodCustom.slice(0, 200) : "",
    cameraMotion: {
      cameraStyle: typeof cameraItem.cameraStyle === "string" && CAMERA_STYLE_OPTIONS.some((option) => option.value === cameraItem.cameraStyle)
        ? cameraItem.cameraStyle as CameraStyleValue
        : ["dynamic-energetic", "fast-action-camera"].includes(String(cameraItem.cameraStyle))
          ? "dynamic-action"
        : DEFAULT_CAMERA_MOTION.cameraStyle,
      cameraStyleCustom: typeof cameraItem.cameraStyleCustom === "string" ? cameraItem.cameraStyleCustom.slice(0, 200) : "",
      cameraCustomInstructions: typeof cameraItem.cameraCustomInstructions === "string" ? cameraItem.cameraCustomInstructions.slice(0, 300) : "",
      framing: typeof cameraItem.framing === "string" && CAMERA_FRAMING_OPTIONS.some((option) => option.value === cameraItem.framing)
        ? cameraItem.framing as CameraFramingValue
        : cameraItem.framing === "wide-shot" ? "wide"
          : cameraItem.framing === "medium-shot" ? "medium"
        : DEFAULT_CAMERA_MOTION.framing,
      motionEnergy: migratedMotionEnergy,
      cameraStabilityOverride: migratedStabilityOverride,
      movementIntensity: resolveMotionEnergy(migratedMotionEnergy, migratedStabilityOverride).movementIntensity,
      cameraStability: resolveMotionEnergy(migratedMotionEnergy, migratedStabilityOverride).cameraStability,
      subjectMotion: typeof cameraItem.subjectMotion === "string" && SUBJECT_MOTION_OPTIONS.some((option) => option.value === cameraItem.subjectMotion)
        ? cameraItem.subjectMotion as SubjectMotionValue
        : DEFAULT_CAMERA_MOTION.subjectMotion,
      subjectMotionCustom: typeof cameraItem.subjectMotionCustom === "string" ? cameraItem.subjectMotionCustom.slice(0, 200) : "",
      motionQualityRuleIds: Array.isArray(cameraItem.motionQualityRuleIds)
        ? cameraItem.motionQualityRuleIds.filter((id): id is MotionQualityRuleId => typeof id === "string" && motionQualityRuleIds.includes(id as MotionQualityRuleId))
        : [...DEFAULT_CAMERA_MOTION.motionQualityRuleIds],
    },
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
