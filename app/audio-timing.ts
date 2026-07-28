import {
  MusicStyleValue,
  ProductionForm,
  SoundEffectsStyleValue,
  VoiceLayer,
  VoiceModeValue,
} from "./production-types";

export type AudioOption = { value: string; label: string; description: string };

export const VOICE_MODE_OPTIONS = [
  { value: "no-spoken-dialogue", label: "No Spoken Dialogue", description: "Disable narration, understandable words, and lip-sync while keeping nonverbal sounds, music, and SFX." },
  { value: "narrator-only", label: "Narrator Only", description: "Use narration without spoken dialogue from the characters." },
  { value: "character-voices", label: "Character Voices", description: "Use spoken character voices without a narrator." },
  { value: "narrator-and-characters", label: "Narrator + Character Voices", description: "Use both narration and spoken character voices." },
  { value: "custom", label: "Custom", description: "" },
] as const satisfies readonly AudioOption[];

export const MUSIC_STYLE_OPTIONS = [
  { value: "playful-orchestral-comedy", label: "Playful Orchestral Comedy", description: "Light orchestral music with playful timing and comedic accents." },
  { value: "warm-magical-adventure", label: "Warm Magical Adventure", description: "Warm melodic music with a gentle magical and adventurous feeling." },
  { value: "epic-cinematic", label: "Epic Cinematic", description: "Large cinematic instrumentation with dramatic progression and scale." },
  { value: "gentle-emotional", label: "Gentle Emotional", description: "Soft emotional music with restrained instrumentation and warm harmony." },
  { value: "suspenseful", label: "Suspenseful", description: "Controlled tension, rhythmic anticipation, and restrained dramatic texture." },
  { value: "energetic-electronic", label: "Energetic Electronic", description: "Modern electronic rhythm with strong energy and forward momentum." },
  { value: "minimal-ambient", label: "Minimal Ambient", description: "Subtle atmospheric sound with minimal melodic distraction." },
  { value: "no-music", label: "No Music", description: "Generate the production without a music layer." },
  { value: "custom", label: "Custom", description: "" },
] as const satisfies readonly AudioOption[];

export const MUSIC_INTENSITY_OPTIONS = [
  { value: "soft", label: "Soft", description: "Subtle music that supports the scene without dominating it." },
  { value: "balanced", label: "Balanced", description: "Clear musical presence while preserving dialogue and sound-effect readability." },
  { value: "strong", label: "Strong", description: "Prominent music with heightened energy and emotional emphasis." },
] as const;

export const SOUND_EFFECTS_STYLE_OPTIONS = [
  { value: "clean-cartoon-foley", label: "Clean Synchronized Cartoon Foley", description: "Clear, precisely timed cartoon effects that support every important action." },
  { value: "exaggerated-slapstick", label: "Exaggerated Slapstick Foley", description: "Bold comedic impacts, springs, swishes, slips, and exaggerated reactions." },
  { value: "cinematic-realistic", label: "Cinematic Realistic", description: "Natural layered effects with realistic weight, space, and environmental detail." },
  { value: "soft-family-animation", label: "Soft Family Animation", description: "Gentle, clear, family-friendly effects without harsh or aggressive impact." },
  { value: "minimal", label: "Minimal", description: "Use only essential synchronized effects and avoid unnecessary sound clutter." },
  { value: "custom", label: "Custom", description: "" },
] as const satisfies readonly AudioOption[];

export const SFX_INTENSITY_OPTIONS = [
  { value: "light", label: "Light", description: "Use restrained effects only for essential actions." },
  { value: "balanced", label: "Balanced", description: "Use clear synchronized effects without overwhelming the scene." },
  { value: "strong", label: "Strong", description: "Use prominent, energetic effects for action and comedic emphasis." },
] as const;

export function resolveAudioOption(selectedValue: string, customValue: string, options: readonly AudioOption[]): string {
  if (selectedValue === "custom") return customValue.trim();
  const selectedOption = options.find((option) => option.value === selectedValue);
  return selectedOption ? `${selectedOption.label}: ${selectedOption.description}` : "";
}

export function voiceLayersForMode(mode: VoiceModeValue, existing: VoiceLayer[]): VoiceLayer[] {
  if (mode === "custom") return existing.filter((layer) => layer !== "No Spoken Dialogue");
  if (mode === "no-spoken-dialogue") return ["No Spoken Dialogue"];
  const narrator = mode === "narrator-only" || mode === "narrator-and-characters";
  const characters = mode === "character-voices" || mode === "narrator-and-characters";
  return [
    narrator ? "Narrator" : null,
    characters ? "Hero Voice" : null,
    characters ? "Companion Voices" : null,
    characters ? "Enemy Voices" : null,
  ].filter((layer): layer is VoiceLayer => Boolean(layer));
}

export function validateAudioTiming(form: ProductionForm) {
  return {
    voiceMode: form.voiceMode === "custom" && !form.voiceModeCustom.trim() ? "Describe your custom voice mode." : "",
    musicStyle: form.musicStyle === "custom" && !form.musicStyleCustom.trim() ? "Describe your custom music style." : "",
    soundEffectsStyle: form.soundEffectsStylePreset === "custom" && !form.soundEffectsStyleCustom.trim() ? "Describe your custom sound-effects style." : "",
  };
}

export function audioTimingIsValid(form: ProductionForm) {
  return Object.values(validateAudioTiming(form)).every((message) => !message);
}

export function resolveAudioTiming(form: ProductionForm) {
  const noSpokenDialogue = form.voiceMode === "no-spoken-dialogue";
  const assignments = noSpokenDialogue ? [] : form.voiceLayers.filter((layer) => layer !== "No Spoken Dialogue");
  return {
    voiceMode: resolveAudioOption(form.voiceMode, form.voiceModeCustom, VOICE_MODE_OPTIONS),
    characterCartoonSounds: form.characterCartoonSounds,
    music: {
      style: resolveAudioOption(form.musicStyle, form.musicStyleCustom, MUSIC_STYLE_OPTIONS),
      intensity: form.musicStyle === "no-music" ? null : form.simplifiedMusicIntensity,
      customInstructions: form.customMusicInstructions.trim(),
    },
    soundEffects: {
      style: resolveAudioOption(form.soundEffectsStylePreset, form.soundEffectsStyleCustom, SOUND_EFFECTS_STYLE_OPTIONS),
      intensity: form.sfxIntensity,
      customInstructions: form.customSfxInstructions.trim(),
    },
    workflow: form.audioMode,
    voiceAssignments: {
      narrator: assignments.includes("Narrator"),
      hero: assignments.includes("Hero Voice"),
      companions: assignments.includes("Companion Voices"),
      enemies: assignments.includes("Enemy Voices"),
    },
    customVoiceInstructions: form.customVoiceInstructions.trim(),
    lipSyncEnabled: noSpokenDialogue ? false : form.lipSyncRequired,
  };
}

export function inferVoiceMode(layers: VoiceLayer[]): VoiceModeValue {
  if (layers.includes("No Spoken Dialogue")) return "no-spoken-dialogue";
  const narrator = layers.includes("Narrator");
  const characters = layers.some((layer) => layer.includes("Voice"));
  if (narrator && characters) return "narrator-and-characters";
  if (narrator) return "narrator-only";
  if (characters) return "character-voices";
  return "custom";
}

export function inferMusicStyle(type: string, noMusic: boolean): MusicStyleValue {
  if (noMusic) return "no-music";
  const normalized = type.toLowerCase();
  return normalized.includes("playful") && normalized.includes("orchestral") ? "playful-orchestral-comedy"
    : normalized.includes("magical") ? "warm-magical-adventure"
      : normalized.includes("epic") || normalized.includes("cinematic") ? "epic-cinematic"
        : "custom";
}

export function inferSoundEffectsStyle(style: string): SoundEffectsStyleValue {
  const normalized = style.toLowerCase();
  return normalized.includes("clean") && normalized.includes("cartoon") ? "clean-cartoon-foley"
    : normalized.includes("slapstick") ? "exaggerated-slapstick"
      : normalized.includes("cinematic") || normalized.includes("realistic") ? "cinematic-realistic"
        : normalized.includes("family") ? "soft-family-animation"
          : normalized === "minimal" ? "minimal" : "custom";
}
