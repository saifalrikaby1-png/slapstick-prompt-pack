import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const styles = read("app/video-styles.ts");
const home = read("app/marketing-home.tsx");
const workspace = read("app/page.tsx");
const builder = read("app/character-builder.tsx");
const layout = read("app/layout.tsx");

test("all seven preview style cards and routes are defined", () => {
  for (const id of ["slapstick", "cinematic", "family-3d", "anime", "live-action", "cgi-fantasy", "stylized-3d"]) {
    assert.match(styles, new RegExp(`id: "${id}"`));
    assert.match(home, new RegExp("/create/\\$\\{id\\}"));
  }
  assert.match(home, /Choose the Kind of Video You Want to Create/);
});

test("style configuration supplies materially different prompt guidance", () => {
  assert.match(styles, /physical cause and effect/i);
  assert.match(styles, /lens choice with one motivated camera move/);
  assert.match(styles, /anatomically plausible/);
  assert.match(styles, /magic with visible causes/);
  assert.match(workspace, /STYLE WORKFLOW:/);
});

test("character builder is local, live, and connected to the existing library storage", () => {
  assert.match(builder, /slapstick-character-library/);
  assert.match(builder, /Completeness/);
  assert.match(builder, /LIVE CONSISTENCY OUTPUT/);
  assert.match(builder, /Save Character/);
  assert.match(workspace, /activeCharacterIds/);
});

test("preview preserves one root Analytics component", () => {
  assert.equal((layout.match(/<Analytics\s*\/>/g) || []).length, 1);
  assert.equal((home.match(/<Analytics\s*\/>/g) || []).length, 0);
});
