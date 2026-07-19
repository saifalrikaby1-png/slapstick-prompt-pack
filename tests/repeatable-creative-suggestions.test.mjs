import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const page = fs.readFileSync("app/page.tsx", "utf8");
const route = fs.readFileSync("app/api/creative-suggest/route.ts", "utf8");
const library = fs.readFileSync("app/creative-library.ts", "utf8");

test("all five creative suggestion types retain a ten-item session history", () => {
  assert.match(page, /creativeSuggestionKinds.*"title".*"location".*"object".*"action".*"payoff"/);
  assert.match(page, /sessionStorage\.getItem\(STORAGE\.recentCreativeSuggestions\)/);
  assert.match(page, /sessionStorage\.setItem\(STORAGE\.recentCreativeSuggestions/);
  assert.match(page, /\[\.\.\.current\[kind\], suggestion\]\.slice\(-10\)/);
});

test("each creative control has independent loading and duplicate-request protection", () => {
  assert.match(page, /suggestingFields[\s\S]*title: false, location: false, object: false, action: false, payoff: false/);
  assert.match(page, /activeCreativeRequests\.current\.has\(kind\)/);
  assert.match(page, /activeCreativeRequests\.current\.add\(kind\)/);
  assert.match(page, /activeCreativeRequests\.current\.delete\(kind\)/);
  assert.match(page, /disabled=\{suggestingFields\[kind\]\}/);
  assert.match(page, /disabled=\{suggestingFields\.title\}/);
});

test("new title, location, object, action, and payoff suggestions are repeatable and editable", () => {
  for (const kind of ["title", "location", "object", "action", "payoff"]) assert.match(page, new RegExp(`demoCandidates[\\s\\S]*${kind}:`));
  assert.match(page, /Generate Ultra-Unique Title with AI/);
  assert.match(page, /Generate \$\{label\} with AI/);
  for (const kind of ["location", "object", "action", "payoff"]) assert.match(page, new RegExp(`creativeEditor\\("${kind}"`));
  assert.match(page, /\[creativeFields\[kind\]\.description\]: result\.description!\.trim\(\)/);
  assert.match(page, /update\("videoTitle", result\.title!\.trim\(\)\)/);
  assert.match(page, /AI suggestion inserted for editing\. It has not been saved\./);
  assert.doesNotMatch(page.slice(page.indexOf("async function suggestCreative"), page.indexOf("function loadDemo")), /saveCreativeAsset\(/);
});

test("recent and saved suggestions are sent as exclusions and duplicates retry once", () => {
  assert.match(page, /const recent = recentSuggestions\[kind\]/);
  assert.match(page, /savedPacks\.map\(\(saved\) => \(\{ name: saved\.title/);
  assert.match(page, /creativeAssets\.filter\(\(asset\) => asset\.kind === kind\)/);
  assert.match(page, /kind !== "object" \|\| !form\.allowPreviouslySavedObjects/);
  assert.match(page, /for \(let attempt = 0; attempt < 2; attempt \+= 1\)/);
  assert.match(page, /collisionRetry: attempt === 1/);
  assert.match(page, /Duplicate Warning: this suggestion resembles a saved or recent item/);
  assert.match(library, /creativeCollision/);
});

test("creative suggestion route validates, times out, cools down, and keeps the key server-side", () => {
  assert.match(route, /MAX_IDEA_LENGTH/);
  assert.match(route, /MAX_CONTEXT_LENGTH/);
  assert.match(route, /MAX_EXCLUSIONS/);
  assert.match(route, /requestCooldowns/);
  assert.match(route, /Please wait a moment before requesting another suggestion/);
  assert.match(route, /AbortSignal\.timeout\(REQUEST_TIMEOUT_MS\)/);
  assert.match(route, /validSuggestion/);
  assert.match(route, /process\.env\.OPENAI_API_KEY/);
  assert.doesNotMatch(page, /OPENAI_API_KEY|sk-[A-Za-z0-9_-]{20,}/);
});

test("no customer-facing credits, pricing, counters, or usage limits are added", () => {
  assert.doesNotMatch(`${page}\n${route}`, /\bcredits?\b|pricing|\busage limit\b|generation count/i);
});
