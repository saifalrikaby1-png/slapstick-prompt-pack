import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const page = fs.readFileSync("app/page.tsx", "utf8");
const route = fs.readFileSync("app/api/creative-suggest/route.ts", "utf8");
const actions = fs.readFileSync("app/ai-actions.ts", "utf8");
const library = fs.readFileSync("app/library/page.tsx", "utf8");

test("complete idea generation is structured, replaces without a popup, and is undoable", () => {
  for (const key of ["generateCompleteIdea", "videoTitle", "importantObject", "actionOrTrap", "endingOrPayoff", "creativeFingerprint", "initiatingCharacter", "movementPath"]) assert.match(route, new RegExp(key));
  assert.match(page, /Generate Complete Video Idea/);
  assert.match(page, /Generate Another Complete Idea/);
  const handler = page.slice(page.indexOf("async function generateCompleteIdea"), page.indexOf("function undoIdeaReplacement"));
  assert.doesNotMatch(handler, /window\.confirm/);
  assert.match(handler, /const snapshot = currentIdeaSnapshot\(\)/);
  assert.match(handler, /setIsGeneratingCompleteIdea\(false\)/);
  assert.match(page, /Undo Idea Replacement/);
  assert.match(page, /slice\(-20\)/);
});

test("credit-ready action map and local prompt library are explicit", () => {
  assert.match(actions, /type AiActionType/);
  assert.match(actions, /CREDITS_ENABLED = false/);
  assert.match(actions, /reserveAiAction/);
  assert.match(library, /LOCAL PROMPT LIBRARY/);
  assert.match(library, /localStorage/);
  assert.match(library, /Open and Continue Editing/);
});

test("complete idea generation remains available beyond five requests", () => {
  assert.match(page, /function endlessDemoCompleteIdea\(index: number\)/);
  assert.match(page, /demoCompleteIdeaIndex/);
  assert.match(page, /setDemoCompleteIdeaIndex\(\(current\) => current \+ attempt \+ 1\)/);
  assert.match(page, /for \(let attempt = 0; attempt < \(creativeMode === "demo" \? 2000 : 10\); attempt \+= 1\)/);
  assert.match(page, /isCompleteIdeaTooSimilar/);
  assert.match(page, /completeIdeaRegistryAi/);
  assert.match(page, /completeIdeaRegistryDemo/);
  assert.match(page, /savedProjectRegistryEntries/);
  assert.doesNotMatch(page, /maxGenerations|generationCount|remainingGenerations|attempts >= 5/);
});

test("AI mode never falls back to the five demo complete ideas", () => {
  assert.match(page, /const creativeMode: CreativeGenerationMode = mode === "ai" \? "ai" : "demo"/);
  assert.match(page, /if \(creativeMode === "demo"\)[\s\S]*endlessDemoCompleteIdea/);
  assert.match(page, /cache: "no-store"/);
  assert.match(page, /generationNonce: crypto\.randomUUID\(\)/);
  assert.match(route, /AI_CONFIGURATION_ERROR/);
  assert.match(route, /AI_GENERATION_FAILED/);
  assert.match(route, /Cache-Control": "no-store/);
});
