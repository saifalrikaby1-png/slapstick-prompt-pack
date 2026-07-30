import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const page = await readFile(new URL("app/page.tsx", root), "utf8");
const css = await readFile(new URL("app/globals.css", root), "utf8");
const charactersStep = page.slice(page.indexOf('className="production-section form-section characters-step"'), page.indexOf('id="production-setup"'));

test("Characters step uses compact three-column selectable cards", () => {
  assert.match(charactersStep, /className="characters-grid"/);
  assert.match(css, /\.production-page \.characters-grid \{[^}]*grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/);
  assert.match(charactersStep, /className=\{`production-character-card \$\{included \? "is-included" : ""\}`\}/);
  assert.match(charactersStep, /className="character-included-toggle" aria-pressed=\{included\} onClick=\{\(\) => toggleActiveCharacter\(profile\.id\)\}/);
  assert.match(charactersStep, /\{included \? "Included" : "Include"\}/);
  assert.doesNotMatch(charactersStep, /character-summary-grid|Edit Character<\/button>/);
});

test("Edit and Add Character open the existing editor without changing selection", () => {
  assert.match(charactersStep, /aria-label=\{`Edit \$\{profile\.shortName\}`\}/);
  assert.match(charactersStep, /editCharacter\(profile\); setCharacterEditorOpen\(true\)/);
  assert.match(charactersStep, /newCharacter\(\); setCharacterEditorOpen\(true\)/);
  assert.match(charactersStep, /\{characterEditorOpen && <section className="character-utility-panel character-editor-drawer"/);
  assert.match(charactersStep, /saveCharacter\(false\)/);
  assert.match(charactersStep, /deleteCharacter/);
});

test("Manage Library gates existing import and export controls", () => {
  assert.match(charactersStep, />Manage Library<\/button>/);
  assert.match(charactersStep, /\{characterLibraryOpen && <section className="character-utility-panel"/);
  assert.match(charactersStep, /Export Character Library/);
  assert.match(charactersStep, /Import and Merge Library/);
  assert.match(charactersStep, /libraryImportRef/);
  assert.doesNotMatch(charactersStep, /Character Library import and export/);
});

test("Character-Building Prompt is a compact functional strip", () => {
  assert.match(charactersStep, /className="character-building-prompt-row"/);
  assert.match(charactersStep, /checked=\{form\.includeCharacterBuildingPrompt\}/);
  assert.match(charactersStep, /update\("includeCharacterBuildingPrompt", event\.target\.checked\)/);
});

test("Characters navigation preserves Concept and Creative Direction adjacency", () => {
  assert.match(charactersStep, /Back to Concept/);
  assert.match(charactersStep, /Continue to Creative Direction/);
  assert.match(charactersStep, /setActiveWorkflowTab\("videoIdea"\)/);
  assert.match(charactersStep, /setActiveWorkflowTab\("setup"\); setProductionTab\("core"\)/);
});
