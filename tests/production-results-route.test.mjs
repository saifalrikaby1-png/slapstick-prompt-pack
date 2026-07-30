import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const page = fs.readFileSync("app/page.tsx", "utf8");
const records = fs.readFileSync("app/production-records.ts", "utf8");
const results = fs.readFileSync("app/production/[productionId]/results/results-workspace.tsx", "utf8");
const library = fs.readFileSync("app/library/page.tsx", "utf8");

test("production workflow no longer renders its embedded results workspace", () => {
  assert.doesNotMatch(page, />Generated Production Outputs</);
  assert.match(page, /Review & Generate/);
  assert.match(page, /review-production-summary/);
});

test("generation persists lifecycle state and navigates to the dedicated route", () => {
  assert.match(page, /status: "generating"/);
  assert.match(page, /status: "completed"/);
  assert.match(page, /markProductionFailed/);
  assert.match(page, /router\.push\(`\/production\/\$\{generatingRecord\.id\}\/results`\)/);
  assert.match(records, /PRODUCTION_RECORDS_KEY = "slapstick-saved-packs"/);
});

test("results workspace supports loading, generating, failure, success, and not found", () => {
  assert.match(results, /Loading production pack/);
  assert.match(results, /production\.status === "generating"/);
  assert.match(results, /production\.status === "failed"/);
  assert.match(results, /Production pack not found/);
  assert.match(results, /results-workspace/);
});

test("results tabs show generated outputs and one active output viewer", () => {
  assert.match(results, /availableOutputs\.map/);
  assert.match(results, /aria-selected=\{activeType === type\}/);
  assert.equal((results.match(/className="results-output-viewer"/g) || []).length, 1);
  assert.match(results, /navigator\.clipboard\.writeText\(activeContent\)/);
});

test("save is idempotent, Word export is retained, edit restores, and saved packs open results", () => {
  assert.match(records, /filter\(\(entry\) => entry\.id !== record\.id\)/);
  assert.match(results, /Packer\.toBlob/);
  assert.match(results, /\/production\/\$\{production\.id\}\/edit/);
  assert.match(page, /findProductionRecord\(productionId\)/);
  assert.match(library, /\/production\/\$\{project\.id\}\/results/);
});
