import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const page = await readFile(new URL("app/page.tsx", root), "utf8");
const audio = await readFile(new URL("app/audio-timing.ts", root), "utf8");
const types = await readFile(new URL("app/production-types.ts", root), "utf8");
const engine = await readFile(new URL("app/production-engine.ts", root), "utf8");
const panel = page.slice(page.indexOf("function AudioTimingPanel"), page.indexOf("const builtInCharacters"));

test("main Audio & Timing workflow renders only three beginner-friendly decisions", () => {
  assert.match(panel, /audio-simple-grid/);
  assert.match(panel, /audio-sfx-row/);
  assert.match(panel, /<h3>Voice<\/h3>/);
  assert.match(panel, /<h3>Music<\/h3>/);
  assert.match(panel, /<h3>Sound Effects<\/h3>/);
  assert.match(panel, /id="voice-mode"/);
  assert.match(panel, /Nonverbal Character Sounds/);
  assert.match(panel, /id="music-style"/);
  assert.match(panel, /aria-label="Music Presence"/);
  assert.match(panel, /id="sound-effects-style"/);
  assert.match(panel, /aria-label="SFX Presence"/);
  assert.match(panel, /Audio synchronization and voice consistency are automatically protected/);
  assert.doesNotMatch(panel, /Music mood|Music Mood/);
});

test("voice modes map to normalized legacy assignments without contradictions", () => {
  for (const mode of ["no-spoken-dialogue", "narrator-only", "character-voices", "narrator-and-characters", "custom"]) {
    assert.match(audio, new RegExp(mode));
  }
  assert.match(audio, /if \(mode === "no-spoken-dialogue"\) return \["No Spoken Dialogue"\]/);
  assert.match(audio, /narrator \? "Narrator" : null/);
  assert.match(audio, /characters \? "Hero Voice" : null/);
  assert.match(audio, /const noSpokenDialogue = form\.voiceMode === "no-spoken-dialogue"/);
  assert.match(audio, /const assignments = noSpokenDialogue \? \[\]/);
  assert.match(audio, /lipSyncEnabled: noSpokenDialogue \? false/);
});

test("music and SFX controls expose three presence choices and No Music disables presence", () => {
  for (const value of ["soft", "balanced", "strong", "light"]) assert.match(audio, new RegExp(`value: "${value}"`));
  const musicIntensities = audio.slice(audio.indexOf("MUSIC_INTENSITY_OPTIONS"), audio.indexOf("SOUND_EFFECTS_STYLE_OPTIONS"));
  const sfxIntensities = audio.slice(audio.indexOf("SFX_INTENSITY_OPTIONS"), audio.indexOf("export function resolveAudioOption"));
  assert.equal((musicIntensities.match(/\{ value:/g) || []).length, 3);
  assert.equal((sfxIntensities.match(/\{ value:/g) || []).length, 3);
  assert.match(panel, /disabled=\{form\.musicStyle === "no-music"\}/);
  assert.match(audio, /presence: form\.musicStyle === "no-music" \? null/);
});

test("custom values validate without rendering advanced audio options", () => {
  for (const field of ["voiceModeCustom", "musicStyleCustom", "soundEffectsStyleCustom"]) {
    assert.match(audio, new RegExp(field));
  }
  for (const removedControl of ["Advanced audio options", "Audio Workflow", "Individual Voice Assignments", "Lip-Sync Preference", "Custom Voice Instructions", "Custom Music Instructions", "Custom SFX Instructions", "Detailed Audio Safeguards"]) {
    assert.doesNotMatch(panel, new RegExp(removedControl));
  }
  assert.doesNotMatch(page, /audioAdvancedOpen|setAudioAdvancedOpen/);
});

test("new defaults, persistence migration, payload, and prompt are wired", () => {
  assert.match(types, /voiceMode: "no-spoken-dialogue"/);
  assert.match(types, /characterCartoonSounds: true/);
  assert.match(types, /musicStyle: "playful-comedy"/);
  assert.match(types, /simplifiedMusicIntensity: "balanced"/);
  assert.match(types, /soundEffectsStylePreset: "cartoon-foley"/);
  assert.match(audio, /export function resolveAudioTiming/);
  assert.match(audio, /workflow: "Native-audio mode"/);
  assert.equal((audio.match(/customInstructions: ""/g) || []).length, 2);
  assert.match(audio, /customVoiceInstructions: ""/);
  assert.match(page, /audioTiming: resolveAudioTiming\(form\)/);
  assert.match(engine, /AUDIO & TIMING/);
  assert.match(engine, /Do not generate narration, understandable spoken words, dialogue, or lip-sync/);
});

test("audio navigation preserves Motion and Review adjacency", () => {
  assert.match(page, /onBack=\{\(\) => setProductionTab\("motion"\)\}/);
  assert.match(page, /onContinue=\{continueFromAudioTiming\}/);
  assert.match(page, /function continueFromAudioTiming\(\)[\s\S]*setProductionTab\("advanced"\)/);
  assert.match(panel, /Back to Motion &amp; Camera/);
  assert.match(panel, /Continue to Review &amp; Generate/);
});
