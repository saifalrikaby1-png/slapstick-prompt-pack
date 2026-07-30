import {
  MusicStyleValue,
  ProductionForm,
  SoundEffectsStyleValue,
  VoiceLayer,
  VoiceModeValue,
} from "./production-types";

export type AudioOption = { value: string; label: string; description: string };

export const VOICE_MODE_OPTIONS = [
  { value: "no-spoken-dialogue", label: "No Spoken Dialogue", description: "No spoken words. Keep nonverbal character sounds, music, and synchronized effects." },
  { value: "narrator-only", label: "Narrator", description: "Use narration without spoken character dialogue." },
  { value: "character-voices", label: "Character Voices", description: "Use spoken character voices without narration." },
  { value: "narrator-and-characters", label: "Narrator + Characters", description: "Use both narration and spoken character voices." },
  { value: "custom", label: "Custom", description: "" },
] as const satisfies readonly AudioOption[];

export const MUSIC_STYLE_OPTIONS = [
  { value: "playful-comedy", label: "Playful Comedy", description: "Light, fun music with playful timing and upbeat personality." },
  { value: "warm-magical", label: "Magical", description: "Warm, imaginative music with a soft magical atmosphere." },
  { value: "cinematic", label: "Cinematic", description: "Polished cinematic music with scale and emotional direction." },
  { value: "emotional", label: "Emotional", description: "Gentle emotional scoring with soft expressive support." },
  { value: "suspenseful", label: "Suspenseful", description: "Controlled tension and anticipation without overwhelming the scene." },
  { value: "no-music", label: "No Music", description: "Do not generate a music layer." },
  { value: "custom", label: "Custom", description: "" },
] as const satisfies readonly AudioOption[];

export const MUSIC_INTENSITY_OPTIONS = [
  { value: "soft", label: "Soft", description: "Subtle music that stays in the background." },
  { value: "balanced", label: "Balanced", description: "Clear musical presence without overpowering dialogue or effects." },
  { value: "strong", label: "Strong", description: "Prominent music with higher emotional or rhythmic presence." },
] as const;

export const SOUND_EFFECTS_STYLE_OPTIONS = [
  { value: "cartoon-foley", label: "Cartoon Foley", description: "Clear synchronized cartoon effects that support important action." },
  { value: "slapstick", label: "Slapstick", description: "Exaggerated comedic effects with stronger playful impact." },
  { value: "cinematic", label: "Cinematic", description: "Natural, polished, scene-supporting effects with realistic presence." },
  { value: "soft-animation", label: "Soft Animation", description: "Gentle family-friendly effects with lighter impact and warmth." },
  { value: "minimal", label: "Minimal", description: "Use only essential effects to keep the soundscape clean." },
  { value: "custom", label: "Custom", description: "" },
] as const satisfies readonly AudioOption[];

export const SFX_INTENSITY_OPTIONS = [
  { value: "light", label: "Light", description: "Use restrained effects only where needed." },
  { value: "balanced", label: "Balanced", description: "Use clear synchronized effects without overwhelming the scene." },
  { value: "strong", label: "Strong", description: "Use more prominent effects for energetic action or comedy." },
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
      presence: form.musicStyle === "no-music" ? null : form.simplifiedMusicIntensity,
      customInstructions: "",
    },
    soundEffects: {
      style: resolveAudioOption(form.soundEffectsStylePreset, form.soundEffectsStyleCustom, SOUND_EFFECTS_STYLE_OPTIONS),
      presence: form.sfxIntensity,
      customInstructions: "",
    },
    workflow: "Native-audio mode",
    voiceAssignments: {
      narrator: assignments.includes("Narrator"),
      hero: assignments.includes("Hero Voice"),
      companions: assignments.includes("Companion Voices"),
      enemies: assignments.includes("Enemy Voices"),
    },
    customVoiceInstructions: "",
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
  return normalized.includes("playful") || normalized.includes("comedy") ? "playful-comedy"
    : normalized.includes("magical") ? "warm-magical"
      : normalized.includes("epic") || normalized.includes("cinematic") ? "cinematic"
        : normalized.includes("emotional") ? "emotional"
        : "custom";
}

export function inferSoundEffectsStyle(style: string): SoundEffectsStyleValue {
  const normalized = style.toLowerCase();
  return normalized.includes("cartoon") ? "cartoon-foley"
    : normalized.includes("slapstick") ? "slapstick"
      : normalized.includes("cinematic") || normalized.includes("realistic") ? "cinematic"
        : normalized.includes("family") || normalized.includes("soft") ? "soft-animation"
          : normalized === "minimal" ? "minimal" : "custom";
}
