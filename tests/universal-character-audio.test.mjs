import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

function compile(source, requireMap = {}) {
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const compiledModule = { exports: {} };
  vm.runInNewContext(`(function(exports,module,require){${output}})(exports,module,require)`, { exports: compiledModule.exports, module: compiledModule, require: (id) => requireMap[id] || {}, crypto, Date });
  return compiledModule.exports;
}

const types = compile(fs.readFileSync("app/production-types.ts", "utf8"));
const engineSource = fs.readFileSync("app/production-engine.ts", "utf8");
const engine = compile(engineSource, { "./production-types": types });
const page = fs.readFileSync("app/page.tsx", "utf8");
const generateRoute = fs.readFileSync("app/api/generate/route.ts", "utf8");
const characterRoute = fs.readFileSync("app/api/character-suggest/route.ts", "utf8");

const profile = (id, name, role, identity, description, sound = "") => ({
  id, shortName: name, role, fullIdentity: identity, description,
  appearanceLock: identity, personalityLock: "customer-defined", colorLock: "customer-defined",
  scaleLock: "customer-defined", vocalStyleLock: "", nonverbalSoundProfile: sound,
  movementStyle: "customer-defined movement", continuityRules: "stable identity", negativeRules: "no duplicate",
});

const cast = [
  profile("hero", "Avery", "Hero", "Avery the Human Inventor", "Human inventor with restrained focus and precise movements.", "Medium-low, restrained breaths and short concentrated effort sounds; prohibit squeaks and growls."),
  profile("companion", "Unit Seven", "Companion", "Unit Seven, a Silver Utility Robot", "Compact robot with measured servo movement.", "Low controlled mechanical hums, brief alarm tones, and short servo-like effort sounds; no animal noise."),
  profile("enemy", "Vesper", "Enemy", "Vesper, a Customer-Defined Fantasy Being", "Breathy magical presence with flowing movement.", "Breathy magical vocalizations, soft effort exhales, and short shimmering reactions; no animal sounds."),
  profile("object", "Mote", "Companion", "Mote, an Animated Teacup", "A personality-driven object with no stated species."),
];

const form = {
  ...types.defaultProductionForm,
  duration: "10",
  location: "a customer-defined workshop",
  importantObject: "one brass wheel",
  trapAction: "Vesper turns the wheel and Avery redirects it",
  endingPayoff: "Avery completes the safe reversal",
  heroId: "hero",
  selectedCharacterIds: ["companion", "enemy", "object"],
  activeCharacterIds: cast.map((item) => item.id),
  tones: ["Fast", "Funny"],
  characterCartoonSounds: true,
  voiceLayers: ["No Spoken Dialogue"],
};

test("temporary override, saved profile, description guidance, and neutral fallback have strict priority", () => {
  assert.equal(engine.resolveCharacterAudioIdentity(cast[1], "Temporary bright pulse"), "Temporary bright pulse");
  assert.match(engine.resolveCharacterAudioIdentity(cast[1]), /mechanical hums/);
  assert.match(engine.resolveCharacterAudioIdentity(cast[3]), /Short character-appropriate nonverbal/);
  assert.doesNotMatch(engine.resolveCharacterAudioIdentity(cast[3]), /squeak|growl|chirp|bark|meow|roar/i);
});

test("arbitrary active names and saved identities control Demo sound ownership", () => {
  const pack = engine.generateDemoPack(form, cast);
  for (const character of cast) assert.match(pack.soundEffects, new RegExp(character.shortName.replace(" ", "\\s")));
  assert.match(pack.soundEffects, /mechanical hums/);
  assert.match(pack.soundEffects, /Breathy magical vocalizations/);
  assert.doesNotMatch(pack.soundEffects, /Biscuit|Grumpy|Sneaky/);
  assert.match(pack.soundEffects, /No spoken words/);
});

test("role never selects a stereotypical sound identity", () => {
  const enemy = profile("e", "Quiet", "Enemy", "Quiet, an unspecified character", "No species or voice defined.");
  const hero = profile("h", "Stone", "Hero", "Stone, an unspecified character", "No species or voice defined.");
  assert.equal(engine.resolveCharacterAudioIdentity(enemy), engine.resolveCharacterAudioIdentity(hero));
  assert.doesNotMatch(engine.resolveCharacterAudioIdentity(enemy), /deep growl|cheerful|cute/i);
});

test("production templates contain no fixed sample-character audio rule", () => {
  for (const source of [engineSource, generateRoute, characterRoute]) {
    assert.doesNotMatch(source, /Biscuit|Grumpy|Sneaky/i);
    assert.doesNotMatch(source, /character\.(?:name|shortName)\s*===/);
  }
  assert.doesNotMatch(engineSource, /species-appropriate nonverbal/);
});

test("UI and Word export persist editable arbitrary sound profiles", () => {
  assert.match(page, /Nonverbal Sound Profile/);
  assert.match(page, /Continue Sound Profile with AI/);
  assert.match(page, /profile\.nonverbalSoundProfile/);
  assert.match(page, /activeCharacters: productionCharacters\.map/);
  assert.match(generateRoute, /nonverbalSoundProfile/);
});

test("character suggestion route is universal and role-independent", () => {
  assert.match(characterRoute, /nonverbalSoundProfile/);
  assert.match(characterRoute, /Role controls story behavior and continuity only/);
  assert.match(characterRoute, /Do not infer a species/);
  assert.doesNotMatch(characterRoute, /For an enemy|For a hero/);
});
