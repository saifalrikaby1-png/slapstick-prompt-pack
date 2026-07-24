import Link from "next/link";
import type { CSSProperties } from "react";
import { PublicFooter, PublicHeader } from "./public-site";
import compact from "./marketing-compact.module.css";

const qualityChecks = [
  { id: "character", icon: "ID", title: "Character Consistency", description: "Keeps identity, proportions, clothing, colors, and behavior stable.", accent: "#FF7043", tint: "rgb(255 112 67 / 14%)" },
  { id: "scene", icon: "◫", title: "Object and Scene Continuity", description: "Preserves important objects, locations, positions, and scene details.", accent: "#F47C6B", tint: "rgb(244 124 107 / 13%)" },
  { id: "physics", icon: "↗", title: "Physical Action Logic", description: "Checks that movements, traps, impacts, and reactions behave logically.", accent: "#D6A33D", tint: "rgb(214 163 61 / 14%)" },
  { id: "camera", icon: "◉", title: "Camera Stability", description: "Reduces unwanted cuts, drifting, framing changes, and camera confusion.", accent: "#D96A8D", tint: "rgb(217 106 141 / 14%)" },
  { id: "motion", icon: "⇄", title: "Motion Clarity", description: "Makes every action clear, readable, continuous, and easy to follow.", accent: "#E84D8A", tint: "rgb(232 77 138 / 14%)" },
  { id: "pacing", icon: "⚡", title: "Hook and Pacing", description: "Strengthens the opening, escalation, timing, and overall action rhythm.", accent: "#FF6B4A", tint: "rgb(255 107 74 / 16%)" },
  { id: "payoff", icon: "◎", title: "Ending Payoff", description: "Checks that the final result clearly completes the idea and action.", accent: "#B98A4A", tint: "rgb(185 138 74 / 14%)" },
  { id: "duplicate", icon: "▣", title: "Duplicate Idea Prevention", description: "Rejects repeated concepts, mechanisms, and renamed versions of old ideas.", accent: "#8A6CF6", tint: "rgb(138 108 246 / 14%)" },
  { id: "contradiction", icon: "⚠", title: "Contradiction Detection", description: "Finds instructions that conflict across characters, objects, timing, or scenes.", accent: "#A66BE8", tint: "rgb(166 107 232 / 14%)" },
  { id: "model", icon: "◌", title: "Model Optimization", description: "Adapts wording, structure, and detail to the selected image or video model.", accent: "#C95F82", tint: "rgb(201 95 130 / 14%)" },
  { id: "negative", icon: "⊘", title: "Negative Prompting", description: "Adds clear restrictions that reduce visual errors and unwanted changes.", accent: "#7A63F6", tint: "rgb(122 99 246 / 14%)" },
  { id: "review", icon: "✓", title: "AI and Manual Review", description: "Combines automated improvement with final human review and correction.", accent: "#B56BE8", tint: "rgb(181 107 232 / 14%)" },
] as const;

const reviewStages = [
  { number: "01", title: "Inspect", description: "Review the idea, characters, scene, motion, camera, pacing, and model setup." },
  { number: "02", title: "Detect", description: "Identify contradictions, repeated concepts, continuity errors, and unclear actions." },
  { number: "03", title: "Improve", description: "Refine weak instructions and apply clearer model-specific prompt language." },
  { number: "04", title: "Approve", description: "Complete a final manual review before saving or exporting the production pack." },
] as const;

function QualityControlFeatureCard({ check }: { check: (typeof qualityChecks)[number] }) {
  return <article className={compact.qualityControlFeatureCard} style={{ "--quality-accent": check.accent, "--quality-tint": check.tint, "--quality-surface": "#11182d" } as CSSProperties}>
    <div className={compact.qualityControlFeatureContent}><span className={compact.qualityControlFeatureIcon} aria-hidden="true">{check.icon}</span><h3>{check.title}</h3><p>{check.description}</p></div>
  </article>;
}

export function QualityControlPublicPage() {
  return <main className={`marketing-shell ${compact.qualityControlPage}`}>
    <PublicHeader />
    <section className={compact.qualityControlHero}><p className="eyebrow">PROMPT QUALITY CONTROL</p><h1>Quality Control for Better Prompts</h1><p className="hero-copy">Review continuity, physical logic, pacing, camera direction, consistency, and model compatibility before moving into production.</p><div className={compact.qualityControlHeroActions}><Link className="marketing-button" href="/create">Create a Quality-Controlled Pack</Link><Link className="marketing-button secondary" href="/how-it-works">See How It Works</Link></div></section>
    <section className={`marketing-section ${compact.qualityControlFeatureSection}`}><h2>Quality Checks Built Into the Workflow</h2><p className="section-copy">Each check helps reduce unclear instructions, visual contradictions, continuity errors, and model-specific prompt problems.</p><div className={compact.qualityControlFeatureGrid}>{qualityChecks.map((check) => <QualityControlFeatureCard key={check.id} check={check} />)}</div></section>
    <section className={`marketing-section ${compact.qualityReviewSection}`}><h2>A Clear Review Process</h2><p className="section-copy">Quality Control combines automated checks with final manual review before the production pack is saved or exported.</p><div className={compact.qualityReviewGrid}>{reviewStages.map((stage) => <article className={compact.qualityReviewCard} key={stage.number}><span>{stage.number}</span><h3>{stage.title}</h3><p>{stage.description}</p></article>)}</div></section>
    <section className={compact.qualityControlCta}><div><p className="eyebrow">CONNECTED CREATION</p><h2>Ready to Create a Better Production Pack?</h2><p>Build your prompts, review the quality checks, and refine the final production instructions.</p></div><div><Link className="marketing-button" href="/create">Start Creating</Link><Link className="marketing-button secondary" href="/production-packs">Explore Production Packs</Link></div></section>
    <PublicFooter />
  </main>;
}
