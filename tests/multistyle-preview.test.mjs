import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const styles = read("app/video-styles.ts");
const home = read("app/marketing-home.tsx");
const workspace = read("app/page.tsx");
const builder = read("app/character-builder.tsx");
const layout = read("app/layout.tsx");
const compactCss = read("app/marketing-compact.module.css");
const css = read("app/globals.css");

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

test("homepage hero is compact, text-focused, and excludes the production mockup from rendered JSX", () => {
  assert.match(home, /Build Better AI Videos Before You Generate Them/);
  assert.match(home, /Choose your creative style, build original characters from scratch/);
  assert.match(home, /Choose a Video Style/);
  assert.match(home, /Build a Character/);
  assert.match(home, /Watch the Demo/);
  assert.match(home, /Free Demo Mode available\. No API key required\./);
  assert.match(home, /\{\/\*[\s\S]*Family 3D Animation[\s\S]*\*\/\}/);
  assert.match(compactCss, /display: block/);
  assert.match(compactCss, /max-width: 1240px/);
});

test("style cards remain route-linked and use compact natural-height layout", () => {
  assert.match(compactCss, /\.styleCard \{ position: relative; min-height: 156px; height: 156px; max-height: 156px/);
  assert.match(compactCss, /\.styleGrid \{ display: grid; grid-template-columns: repeat\(3, minmax\(0, 1fr\)\); align-items: stretch/);
  assert.match(compactCss, /\.styleCard \{ min-height: 0; height: auto; padding: 18px 20px/);
  assert.doesNotMatch(compactCss, /margin-top:\s*auto/);
  assert.match(compactCss, /@media \(max-width: 640px\)/);
  assert.match(home, /className=\{compact\.styleCard\}/);
  assert.match(home, /className=\{compact\.styleBadge\}/);
  assert.match(home, /className=\{compact\.styleArrow\}/);
  assert.doesNotMatch(home, /style\.characteristics\.map/);
});
