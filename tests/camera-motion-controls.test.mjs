import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const [page, types, helpers, engine, route] = await Promise.all([
  readFile(new URL("app/page.tsx", root), "utf8"),
  readFile(new URL("app/production-types.ts", root), "utf8"),
  readFile(new URL("app/creative-direction.ts", root), "utf8"),
  readFile(new URL("app/production-engine.ts", root), "utf8"),
  readFile(new URL("app/api/generate/route.ts", root), "utf8"),
]);

test("Motion & Camera default view renders exactly four focused primary controls", () => {
  for (const id of ["camera-style", "camera-framing", "subject-motion"]) {
    assert.match(page, new RegExp(`(?:htmlFor|id)="${id}"`));
  }
  assert.match(page, /className="motion-camera-primary-grid"/);
  assert.match(page, /aria-label="Motion Energy"/);
  assert.match(page, /className="motion-safeguards-status"/);
  assert.match(page, /className="motion-camera-advanced-header" aria-expanded=\{advancedOpen\}/);
  assert.match(page, /aria-pressed=\{selected\}/);
  assert.doesNotMatch(page, /<CameraMotionPanel[\s\S]{0,300}rulesExpanded=/);
});

test("custom camera and subject motion fields validate independently while instructions stay optional", () => {
  assert.match(page, /value\.cameraStyle === "custom"[\s\S]*id="camera-style-custom"/);
  assert.match(page, /value\.subjectMotion === "custom"[\s\S]*id="subject-motion-custom"/);
  assert.match(page, /Describe your custom camera style\./);
  assert.match(page, /Describe your custom subject motion\./);
  assert.doesNotMatch(page, /cameraCustomInstructions\.trim\(\)[^;\n]*directionErrors|directionErrors\.[A-Za-z]+\s*=.*cameraCustomInstructions/);
});

test("defaults, persistence migration, and advanced rules use one nested cameraMotion state", () => {
  assert.match(types, /export const DEFAULT_CAMERA_MOTION[\s\S]*cameraStyle: "smooth-cinematic"[\s\S]*framing: "automatic"[\s\S]*motionEnergy: "balanced"[\s\S]*cameraStabilityOverride: "auto"[\s\S]*movementIntensity: "balanced"[\s\S]*cameraStability: "stable"[\s\S]*subjectMotion: "natural-controlled"/);
  assert.match(types, /cameraMotion: CameraMotionState/);
  assert.match(helpers, /const cameraItem = item\.cameraMotion[\s\S]*: item;/);
  assert.match(page, /motionQualityRuleIds: selected \? value\.motionQualityRuleIds\.filter/);
  assert.match(page, /localStorage\.setItem\(STORAGE\.form, JSON\.stringify\(form\)\)/);
  assert.match(page, /const isRestoringExistingProject = Boolean\(localStorage\.getItem\(STORAGE\.form\)\)/);
  assert.match(page, /cameraMotion: \{ \.\.\.current\.creativeDirection\.cameraMotion, \.\.\.cameraMotionStyleDefaults\[activeVideoStyle\.id\] \}/);
});

test("Motion Energy resolves into the compatible payload and prompt", () => {
  assert.match(helpers, /cameraMotion: resolveCameraMotion\(state\.cameraMotion\)/);
  assert.match(helpers, /function resolveMotionEnergy\(/);
  assert.match(route, /cameraMotion: \{[\s\S]*qualityRules: string\[\]/);
  for (const label of ["MOTION & CAMERA", "Camera Style:", "Framing:", "Motion Energy:", "Resolved Movement Intensity:", "Resolved Camera Stability:", "Subject Motion:", "Additional Camera Instructions:", "Professional Motion Safeguards:"]) {
    assert.match(engine, new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.match(engine, /Camera Style controls how the scene is filmed\. Subject Motion controls how characters and objects move\./);
});

test("Quality Control consumes selected rules and frame ratios remain global", () => {
  assert.match(engine, /motionQualityRuleIds\.map\(\(id\) =>[\s\S]*motionRuleChecks\[id\]\.pattern\.test\(all\)/);
  assert.match(engine, /const startRatio = videoRatio;\s*const endRatio = videoRatio;/);
  assert.doesNotMatch(page, />Start Frame Ratio<|>End Frame Ratio<|id="start-frame-ratio"|id="end-frame-ratio"/);
});
