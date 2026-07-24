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
const publicSite = read("app/public-site.tsx");
const sharedCards = read("app/video-type-cards.tsx");
const publicPages = read("app/public-page-content.tsx");
const characterBuilder = read("app/character-builder.tsx");
const signIn = read("app/sign-in/sign-in-public.tsx");
const signInPage = read("app/sign-in/page.tsx");
const pricingPlans = read("app/pricing-plans.ts");

test("all seven preview style cards and routes are defined", () => {
  for (const id of ["slapstick", "cinematic", "family-3d", "anime", "live-action", "cgi-fantasy", "stylized-3d"]) {
    assert.match(styles, new RegExp(`id: "${id}"`));
    assert.match(sharedCards, /videoStyleIds\.map/);
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
  assert.match(builder, /LIVE CHARACTER PROFILE/);
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

test("homepage no longer renders the extra gradient CTA before its footer", () => {
  assert.doesNotMatch(home, /Choose the Style\. Build the Character\. Plan the Production\./);
  assert.doesNotMatch(home, /Create complete AI-video production packs/);
  assert.doesNotMatch(home, /Choose a Video Type/);
  assert.doesNotMatch(home, /Build Your First Character/);
  assert.doesNotMatch(home, /className="final-cta"/);
  assert.match(home, /marketing-section faq[\s\S]*<PublicFooter \/>/);
});

test("style cards remain route-linked and use compact natural-height layout", () => {
  assert.match(compactCss, /\.styleCard \{ position: relative; min-height: 156px; height: 156px; max-height: 156px/);
  assert.match(compactCss, /\.styleGrid \{ display: grid; grid-template-columns: repeat\(3, minmax\(0, 1fr\)\); align-items: stretch/);
  assert.match(compactCss, /\.styleCard \{ min-height: 0; height: auto; padding: 18px 20px/);
  assert.doesNotMatch(compactCss, /margin-top:\s*auto/);
  assert.match(compactCss, /@media \(max-width: 640px\)/);
  assert.match(sharedCards, /compact\.styleCard/);
  assert.match(sharedCards, /appearance === "signature" \? compact\.signatureCard/);
  assert.match(sharedCards, /className=\{compact\.styleBadge\}/);
  assert.match(sharedCards, /className=\{compact\.styleArrow\}/);
  assert.match(home, /<VideoTypeCards \/>/);
  assert.match(publicPages, /<VideoTypeCards hrefFor=/);
  assert.doesNotMatch(home, /style\.characteristics\.map/);
});

test("video types page reuses exactly the homepage's seven cards and requested create links", () => {
  assert.match(publicPages, /Explore Video Types/);
  assert.match(publicPages, /Ready to Build Your Production Pack/);
  assert.doesNotMatch(publicPages, /Product Advertising|Educational Videos|Social Media Shorts/);
  for (const href of ["/create?type=slapstick", "/create?type=cinematic", "/create?type=anime", "/create?type=live-action", "/create?type=fantasy", "/create?type=family-animation", "/create?type=stylized-3d"]) assert.match(publicPages, new RegExp(href.replace(/[?]/g, "\\$&")));
});

test("public navigation uses shared accessible internal routes", () => {
  for (const route of ["/video-types", "/how-it-works", "/character-builder", "/production-packs", "/quality-control", "/models", "/pricing", "/sign-in", "/create"]) {
    assert.match(publicSite, new RegExp(`"${route.replace(/[/?]/g, "\\$&")}"`));
  }
  assert.match(publicSite, /aria-label="Toggle navigation menu"/);
  assert.match(publicSite, /export function PublicFooter/);
});

test("character builder opens as a separate focused workspace", () => {
  assert.match(publicPages, /actionHref="\/character-builder\/create"/);
  assert.match(characterBuilder, /Build a Character That Stays Consistent/);
  assert.match(characterBuilder, /slapstick-character-library/);
  assert.match(characterBuilder, /<PublicHeader \/>/);
  assert.match(characterBuilder, /<PublicFooter \/>/);
  assert.match(characterBuilder, /window\.confirm\(`Delete/);
  assert.match(characterBuilder, /\/character-builder\/create\?id=/);
  assert.doesNotMatch(characterBuilder, /Generation Summary|Generated Prompts|Start Frame Prompt|Music and SFX setup/);
});

test("sign in uses the shared public shell with honest account-access controls", () => {
  assert.match(signIn, /<PublicHeader\s*\/>/);
  assert.match(signIn, /<PublicFooter\s*\/>/);
  assert.equal((signIn.match(/<h1[\s>]/g) || []).length, 1);
  assert.match(signIn, /compact\.modelsPage/);
  assert.match(signIn, /Email Address/);
  assert.match(signIn, /autoComplete="email"/);
  assert.match(signIn, /autoComplete="current-password"/);
  assert.match(signIn, /Show password/);
  assert.match(signIn, /Hide password/);
  assert.match(signIn, /Remember me/);
  assert.match(signIn, /Account authentication will be enabled before public launch\./);
  assert.match(signIn, /disabled aria-describedby="authentication-notice"/);
  assert.doesNotMatch(signIn, /localStorage|sessionStorage|console\.log|href="#"|Google Sign In/);
});

test("sign in validates plan slugs from the central pricing configuration", () => {
  assert.match(signIn, /pricingPlans\.find/);
  assert.match(signInPage, /searchParams/);
  assert.match(pricingPlans, /id: "starter"/);
  assert.match(pricingPlans, /id: "creator"/);
  assert.match(pricingPlans, /id: "studio"/);
  assert.match(pricingPlans, /id: "pro"/);
});
