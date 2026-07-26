import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const [page, css] = await Promise.all([
  readFile(new URL("app/page.tsx", root), "utf8"),
  readFile(new URL("app/globals.css", root), "utf8"),
]);

test("Production Page exposes the approved Characters color tokens", () => {
  for (const token of [
    "--prod-bg: #101518",
    "--prod-surface: #12191d",
    "--prod-surface-2: #0c1d32",
    "--prod-card: #10243f",
    "--prod-card-deep: #0d2038",
    "--prod-gold-border: #e0ab31",
    "--prod-text: #f7faf8",
    "--prod-emerald: #163c35",
  ]) {
    assert.ok(css.includes(token), `Missing ${token}`);
  }
});

test("character cards and edit actions use dedicated dark production classes", () => {
  assert.match(page, /production-character-card character-summary-card/);
  assert.match(page, /className="production-edit-button"/);
  assert.match(page, />Edit Character<\/button>/);
  assert.match(css, /\.production-page \.production-character-card\s*\{[^}]*var\(--prod-gold-border\)[^}]*linear-gradient/s);
  assert.match(css, /\.production-page \.production-edit-button\s*\{[^}]*var\(--prod-emerald\)[^}]*var\(--prod-emerald-deeper\)/s);
});

test("editor and import-export rows use scoped dark accordion treatments", () => {
  assert.match(page, /character-editor-drawer production-accordion/);
  assert.match(page, /advanced-panel wide production-accordion production-accordion-secondary/);
  assert.match(page, /advanced-panel production-accordion production-accordion-secondary/);
  assert.match(css, /\.production-page \.production-accordion\s*\{[^}]*rgba\(11, 25, 44, \.96\)/s);
  assert.match(css, /\.production-page \.production-accordion-secondary\s*\{[^}]*var\(--prod-border-strong\)/s);
});

test("legacy secondary controls are dark only inside the Production Page", () => {
  assert.match(css, /\.production-page \.production-secondary-button,/);
  assert.match(css, /\.production-page :is\([^)]*\.button-row button:not\(\.primary-small\)/s);
  assert.doesNotMatch(css, /(^|\n)\.production-secondary-button\s*\{/);
});
