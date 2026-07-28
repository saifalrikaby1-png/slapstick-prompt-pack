import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const page = await readFile(new URL("app/page.tsx", root), "utf8");
const audio = await readFile(new URL("app/audio-timing.ts", root), "utf8");
const types = await readFile(new URL("app/production-types.ts", root), "utf8");
const engine = await readFile(new URL("app/production-engine.ts", root), "utf8");
const panel = page.slice(page.indexOf("function AudioTimingPanel"), page.indexOf("const builtInCharacters"));

test("compact Audio & Timing controls replace the old default controls", () => {
  assert.match(panel, /id="voice-mode"/);
  assert.match(panel, /Character Cartoon Sounds/);
  assert.match(panel, /id="music-style"/);
  assert.match(panel, /aria-label="Music Intensity"/);
  assert.match(panel, /id="sound-effects-style"/);
  assert.match(panel, /aria-label="SFX Intensity"/);
  assert.doesNotMatch(panel, /Music mood|Music Mood/);
  assert.doesNotMatch(panel, /No music<\/span>|No Spoken Dialogue<\/span>/);
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

test("music and SFX controls expose three intensity choices and No Music disables intensity", () => {
  for (const value of ["soft", "balanced", "strong", "light"]) assert.match(audio, new RegExp(`value: "${value}"`));
  const musicIntensities = audio.slice(audio.indexOf("MUSIC_INTENSITY_OPTIONS"), audio.indexOf("SOUND_EFFECTS_STYLE_OPTIONS"));
  const sfxIntensities = audio.slice(audio.indexOf("SFX_INTENSITY_OPTIONS"), audio.indexOf("export function resolveAudioOption"));
  assert.equal((musicIntensities.match(/\{ value:/g) || []).length, 3);
  assert.equal((sfxIntensities.match(/\{ value:/g) || []).length, 3);
  assert.match(panel, /disabled=\{form\.musicStyle === "no-music"\}/);
  assert.match(audio, /intensity: form\.musicStyle === "no-music" \? null/);
});

test("custom values validate and Audio settings remain collapsed until requested", () => {
  for (const field of ["voiceModeCustom", "musicStyleCustom", "soundEffectsStyleCustom"]) {
    assert.match(audio, new RegExp(field));
  }
  assert.match(page, /useState\(false\).*audioAdvancedOpen|audioAdvancedOpen, setAudioAdvancedOpen\] = useState\(false\)/);
  assert.match(panel, /Advanced Audio Settings/);
  assert.match(panel, /Audio Workflow/);
  assert.match(panel, /Individual Voice Assignments/);
  assert.match(panel, /advancedOpen && <div className="advanced-audio-content"/);
});

test("new defaults, persistence migration, payload, and prompt are wired", () => {
  assert.match(types, /voiceMode: "no-spoken-dialogue"/);
  assert.match(types, /characterCartoonSounds: true/);
  assert.match(types, /musicStyle: "playful-orchestral-comedy"/);
  assert.match(types, /simplifiedMusicIntensity: "balanced"/);
  assert.match(types, /soundEffectsStylePreset: "clean-cartoon-foley"/);
  assert.match(audio, /export function resolveAudioTiming/);
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
