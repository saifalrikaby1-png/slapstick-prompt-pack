import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const [page, css] = await Promise.all([
  readFile(new URL("app/page.tsx", root), "utf8"),
  readFile(new URL("app/globals.css", root), "utf8"),
]);

test("major Production Page headings share one semantic structure", () => {
  for (const title of [
    "Configuration",
    "Generated Prompt",
    "Action Timeline",
    "Start Frame &amp; End Frame",
    "Camera &amp; Motion",
    "Visual &amp; Scene Settings",
    "Complete Video Idea",
    "Characters",
    "Creative Direction",
    "Generated Production Outputs",
  ]) {
    const escaped = title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    assert.match(page, new RegExp(`production-section-heading-copy[^]*?<h2>${escaped}</h2>`));
  }
  assert.doesNotMatch(page, /creative-direction-title-row[^]*?<h1>Creative Direction<\/h1>/);
});

test("heading badges are two-digit, decorative, and consistently styled", () => {
  const headers = [...page.matchAll(/<span className="production-section-number" aria-hidden="true">(\d+)<\/span>/g)];
  assert.ok(headers.length >= 10);
  assert.ok(headers.every((match) => /^\d{2}$/.test(match[1])));
  assert.match(css, /\.production-page \.production-section-number\s*\{[^}]*min-width:\s*34px;[^}]*height:\s*34px;/s);
});

test("desktop and mobile typography follow the compact production hierarchy", () => {
  assert.match(css, /\.production-page \.production-section-heading-copy h2\s*\{[^}]*font-family:\s*var\(--font-fraunces\)[^}]*font-size:\s*clamp\(1\.75rem,\s*2\.4vw,\s*2\.35rem\);[^}]*font-weight:\s*500;/s);
  assert.match(css, /\.production-page \.production-section-heading-copy p\s*\{[^}]*color:\s*#9fb4d8;[^}]*font-size:\s*\.82rem;/s);
  assert.match(css, /@media \(max-width: 640px\)[^]*?\.production-page \.production-section-heading-copy h2\s*\{[^}]*font-size:\s*clamp\(1\.55rem,\s*8vw,\s*2rem\);/);
});
