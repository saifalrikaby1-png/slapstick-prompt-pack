import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const page = await readFile(new URL("app/page.tsx", root), "utf8");

const motionRender = page.slice(
  page.indexOf('{productionTab === "motion" && <CameraMotionPanel'),
  page.indexOf('{productionTab === "audio" && <AudioTimingPanel'),
);

test("Motion & Camera renders only its focused component and navigation", () => {
  assert.match(motionRender, /CameraMotionPanel/);
  for (const prop of ["advancedOpen", "onToggleAdvanced", "onBack", "onContinue"]) {
    assert.match(motionRender, new RegExp(`${prop}=`));
  }
  for (const unrelated of ["Publishing platform", "AI video model", "Duration", "Visual style", "Video Ratio", "Generation Summary"]) {
    assert.doesNotMatch(motionRender, new RegExp(unrelated));
  }
});

test("Video Setup, Audio & Timing, Characters, and final controls have one conditional home", () => {
  assert.match(page, /className="studio-ratio-control"[\s\S]*Video Ratio[\s\S]*className="video-setup-controls"[\s\S]*Publishing platform[\s\S]*AI video model[\s\S]*Duration[\s\S]*Visual style[\s\S]*Ultra Retention Mode/);
  assert.match(page, /id="characters"[\s\S]*Include Character-Building Prompt[\s\S]*Character Library import and export/);
  assert.match(page, /productionTab === "audio" && <AudioTimingPanel/);
  assert.match(page, /productionTab === "advanced" && <ProductionSection[\s\S]*title="Generation Summary"/);
  assert.equal((page.match(/Include Character-Building Prompt/g) || []).length, 1);
  assert.equal((page.match(/<h3>Video Ratio<\/h3>/g) || []).length, 1);
});

test("step navigation moves backward to Creative Direction and forward to Audio & Timing", () => {
  assert.match(page, /Back to Creative Direction/);
  assert.match(page, /Continue to Audio &amp; Timing/);
  assert.match(page, /onBack=\{\(\) => setProductionTab\("core"\)\}/);
  assert.match(page, /onContinue=\{\(\) => setProductionTab\("audio"\)\}/);
});
