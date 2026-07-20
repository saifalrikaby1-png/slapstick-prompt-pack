import assert from "node:assert/strict";
import { createRequire } from "node:module";
import fs from "node:fs";
import test from "node:test";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const registrySource = fs.readFileSync("app/complete-idea-registry.ts", "utf8");
const registryJs = ts.transpileModule(registrySource, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const registry = await import(`data:text/javascript;base64,${Buffer.from(registryJs).toString("base64")}`);

function entry({ title = "Biscuit’s Rolling Surprise", location = "Sunwheel Plaza", object = "Moon-Spring Tart", action = "The tart rolls into a catch", payoff = "Biscuit catches the tart", fingerprint = {} } = {}) {
  const creativeFingerprint = {
    settingCategory: "outdoor action lane",
    objectCategory: "physics prop",
    actionMechanic: "spring compression launch",
    initiatingCharacter: "active enemy trigger",
    escalationPattern: "visible cause and effect",
    movementPath: "grounded curved lane",
    payoffPattern: "clear catch victory",
    ...fingerprint,
  };
  const normalizedTitle = registry.normalizeIdeaValue(title);
  const normalizedLocation = registry.normalizeIdeaValue(location);
  const normalizedObject = registry.normalizeIdeaValue(object);
  const normalizedAction = registry.normalizeIdeaValue(action);
  const normalizedPayoff = registry.normalizeIdeaValue(payoff);
  const base = { normalizedTitle, normalizedLocation, normalizedObject, normalizedAction, normalizedPayoff, significantTitleTerms: registry.significantTerms(title), creativeFingerprint, actionSignatureHash: "", createdAt: "2026-07-20" };
  return { ...base, actionSignatureHash: registry.actionSignatureHash(base), conceptHash: `${normalizedTitle}|${normalizedLocation}|${normalizedObject}|${normalizedAction}|${normalizedPayoff}` };
}

test("semantic signatures reject renamed versions of the same physical premise", () => {
  const first = entry({ title: "Moon-Spring Tart Tilt Return", action: "Moon-Spring Tart tilts and returns", payoff: "The tart returns to Biscuit" });
  const renamed = entry({ title: "Copperberry Popper Tilt Return", location: "Copperleaf Terrace", object: "Copperberry Popper", action: "Copperberry Popper ricochets back", payoff: "Copperberry Popper settles beside Biscuit" });
  assert.equal(first.actionSignatureHash, renamed.actionSignatureHash);
  assert.equal(registry.isCompleteIdeaTooSimilar(renamed, first), true);
});

test("semantic signatures are independent of generation counter, title, seed, and cosmetic wording", () => {
  const first = entry({ title: "Biscuit’s Spring Lane", action: "The object follows a curved lane", payoff: "A catch completes the scene" });
  const cosmetic = entry({ title: "Biscuit’s Bright Rolling Day", location: "A totally renamed place", object: "A renamed prop", action: "A shiny object travels through the very same curved lane", payoff: "A cheerful catch ends the story" });
  assert.equal(first.actionSignatureHash, cosmetic.actionSignatureHash);
  assert.equal(registry.isCompleteIdeaTooSimilar(cosmetic, first), true);
});

test("one hundred distinct semantic mechanism, route, and payoff combinations have unique signatures", () => {
  const mechanisms = ["spring launch", "lever reversal", "spiral descent", "elastic snapback", "magnetic release", "wind redirect", "rolling redirection", "pendulum interception", "air pressure propulsion", "chain tipping"];
  const paths = ["curved lane", "rising arc", "spiral track", "zigzag ramp", "seesaw route", "conveyor run", "descending slide", "circular track", "swing path", "platform edge"];
  const signatures = new Set();
  for (const mechanism of mechanisms) for (const path of paths) signatures.add(registry.actionSignatureHash(entry({ fingerprint: { actionMechanic: mechanism, movementPath: path } })));
  assert.equal(signatures.size, 100);
});

test("a genuinely different mechanism is accepted", () => {
  const first = entry();
  const different = entry({ title: "Biscuit’s Spiral Slide", action: "The object descends a spiral slide", payoff: "A balanced landing resolves the scene", fingerprint: { actionMechanic: "spiral descent", movementPath: "descending slide", escalationPattern: "controlled tipping sequence", payoffPattern: "balanced landing" } });
  assert.equal(registry.isCompleteIdeaTooSimilar(different, first), false);
});
