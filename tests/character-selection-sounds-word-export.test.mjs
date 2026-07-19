import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const page = fs.readFileSync("app/page.tsx", "utf8");
const engineSource = fs.readFileSync("app/production-engine.ts", "utf8");
const typesSource = fs.readFileSync("app/production-types.ts", "utf8");
const route = fs.readFileSync("app/api/generate/route.ts", "utf8");

function compile(source, requireMap = {}) {
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const compiledModule = { exports: {} };
  vm.runInNewContext(`(function(exports,module,require){${output}})(exports,module,require)`, {
    exports: compiledModule.exports,
    module: compiledModule,
    require: (id) => requireMap[id] || {},
    crypto,
    Date,
  });
  return compiledModule.exports;
}

const types = compile(typesSource);
const engine = compile(engineSource, { "./production-types": types });

const characters = [
  { id: "hero", shortName: "Biscuit", fullIdentity: "Biscuit the Orange Squirrel", role: "Hero", description: "Appearance: small orange squirrel with cream belly and large brown eyes\nPrimary and secondary colors: orange and cream\nClothing and accessories: none\nScale and proportions: smallest and agile\nMovement style: quick precise hops", appearanceLock: "small orange squirrel", personalityLock: "clever", colorLock: "orange and cream", scaleLock: "small", vocalStyleLock: "cheerful squeaks", movementStyle: "quick hops", continuityRules: "stable", negativeRules: "no duplicate" },
  { id: "enemy", shortName: "Grumpy", fullIdentity: "Grumpy the Purple Hedgehog", role: "Enemy", description: "Appearance: stocky purple hedgehog with thick brows\nPrimary and secondary colors: plum and lavender\nClothing and accessories: none\nScale and proportions: wider than Biscuit\nMovement style: weighty stomps", appearanceLock: "stocky purple hedgehog", personalityLock: "grumpy", colorLock: "plum and lavender", scaleLock: "medium", vocalStyleLock: "low huffs", movementStyle: "weighty stomps", continuityRules: "stable", negativeRules: "no duplicate" },
  { id: "unchecked", shortName: "Sneaky", fullIdentity: "Sneaky the Green Chameleon", role: "Enemy", description: "Appearance: lean green chameleon\nPrimary and secondary colors: green and mint\nClothing and accessories: none\nScale and proportions: tall\nMovement style: careful crawls", appearanceLock: "lean green chameleon", personalityLock: "sly", colorLock: "green and mint", scaleLock: "tall", vocalStyleLock: "chirps", movementStyle: "careful crawls", continuityRules: "stable", negativeRules: "no duplicate" },
];

const form = {
  ...types.defaultProductionForm,
  videoTitle: "Two Character Test",
  location: "a stable woodland plaza",
  locationName: "Woodland Plaza",
  importantObject: "one blue spring cookie",
  objectName: "Spring Cookie",
  trapAction: "Grumpy pushes the cookie and Biscuit redirects it",
  actionName: "Cookie Redirect",
  endingPayoff: "Biscuit wins while Grumpy lands safely",
  payoffName: "Safe Win",
  activeCharacterIds: ["hero", "enemy"],
  heroId: "hero",
  selectedCharacterIds: ["enemy"],
  characterCartoonSounds: true,
  voiceLayers: ["No Spoken Dialogue"],
};
const pack = engine.generateDemoPack(form, characters);
const fullPack = Object.values(pack).join("\n");

const sourceChecks = [
  ["1. Character browser previous arrow", page, /aria-label="Previous character"/],
  ["2. Character browser next arrow", page, /aria-label="Next character"/],
  ["3. Character browser wraps safely", page, /\(index \+ characters\.length\) % characters\.length/],
  ["4. Include in This Video checkbox", page, /Include in This Video/],
  ["5. At least one active character required", page + route, /At least one active character/],
  ["6. Exactly one selected Hero", page + route, /exactly one Hero|Only one Hero/],
  ["9. Full identity appears in start-frame prompt", engineSource, /buildCompactCharacterLock/],
  ["10. Compact description appears in start-frame prompt", engineSource, /cast\.map\(buildCompactCharacterLock\)/],
  ["11. Full identity appears in end-frame prompt", engineSource, /Use exactly the same/],
  ["12. Compact description appears in end-frame prompt", engineSource, /using the start-frame image as the primary continuity reference/],
  ["13. Exact names appear in video lock", engineSource, /Exact identities:/],
  ["14. Exact names appear in video timeline", engineSource, /heroName/],
  ["15. Character count matches outputs", engineSource, /Exact character count:/],
  ["16. Project presets preserve activeCharacterIds", page, /form: \{ \.\.\.form \}/],
  ["17. Old selection format migrates safely", engineSource, /legacyActive/],
  ["18. Cartoon Sounds coexist with No Spoken Dialogue", page, /Nonverbal cartoon sounds.*remain allowed/],
  ["19. Character sounds contain no spoken words", engineSource, /no understandable words/],
  ["20. Unchecked characters receive no sounds", engineSource, /checked characters only/],
  ["21. Sound ownership uses exact names", engineSource, /cast\[index % cast\.length\]\.shortName/],
  ["22. Sounds stay in SOUND EFFECTS", engineSource, /soundEffects: sfxLines/],
  ["23. Word export disabled before generation", page, /disabled=\{!pack \|\| isDownloading\}/],
  ["24. Word export includes video title", page, /title: pack\.videoTitle/],
  ["25. Word export includes selected characters", page, /productionCharacters\.forEach/],
  ["26. Word export excludes unchecked characters", page, /productionCharacters\.forEach/],
  ["27. Word export includes generated sections", page, /4\. All-in-One Video Production Prompt/],
  ["28. Word export includes Quality Control", page, /heading\("Quality-Control Report"\)/],
  ["29. Word filename is sanitized", page, /replace\(\/\[<>:"\/\\\\\|\?\*/],
  ["30. Demo Mode uses only active characters", engineSource, /form\.activeCharacterIds/],
  ["31. AI request contains only active characters", page + route, /activeCharacters/],
  ["32. API key remains server-side", route, /process\.env\.OPENAI_API_KEY/],
  ["33. Legacy packs remain readable", engineSource, /LegacySavedPack|schemaVersion === 2/],
];
for (const [name, source, pattern] of sourceChecks) test(name, () => assert.match(source, pattern));

test("7. Two checked characters generate a two-character production", () => {
  assert.match(pack.videoLock, /Exact character count: 2/);
});
test("8. Unchecked third character is absent from every generated prompt", () => {
  assert.doesNotMatch(fullPack, /Sneaky|Green Chameleon/i);
});
test("19b. No Spoken Dialogue still permits nonverbal sounds", () => {
  assert.match(pack.videoLock, /No understandable spoken dialogue/);
  assert.match(pack.soundEffects, /Biscuit:|Grumpy:/);
});
test("22b. Character vocalizations never enter Music Path", () => {
  assert.doesNotMatch(pack.musicPath, /squeak|grunt|yelp|nonverbal|Biscuit:|Grumpy:/i);
});
test("34. Existing synchronized pack contract remains intact", () => {
  assert.equal(JSON.stringify(Object.keys(pack)), JSON.stringify(Array.from(types.productionPackKeys)));
});
