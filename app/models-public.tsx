import Link from "next/link";
import type { CSSProperties } from "react";
import { PublicFooter, PublicHeader } from "./public-site";
import compact from "./marketing-compact.module.css";

const models = [
  { id: "openai-video", icon: "◉", title: "OpenAI Video", description: "Structured prompts for cinematic scenes, clear motion, continuity, and detailed production direction.", accent: "#FF7043", tint: "rgb(255 112 67 / 14%)" },
  { id: "seedance", icon: "↗", title: "Seedance", description: "Prompt guidance for expressive motion, short-form action, timing, and visual consistency.", accent: "#F47C6B", tint: "rgb(244 124 107 / 13%)" },
  { id: "kling", icon: "◌", title: "Kling", description: "Detailed scene, character, camera, movement, and physical-action instructions.", accent: "#D6A33D", tint: "rgb(214 163 61 / 14%)" },
  { id: "veo", icon: "◇", title: "Veo", description: "Cinematic prompt structure with scene logic, camera direction, pacing, and audio guidance.", accent: "#8A6CF6", tint: "rgb(138 108 246 / 14%)" },
  { id: "openart", icon: "▣", title: "OpenArt Workflows", description: "Production prompts designed for compatible image and video workflows inside OpenArt.", accent: "#E84D8A", tint: "rgb(232 77 138 / 14%)" },
  { id: "image", icon: "◫", title: "Image Generation", description: "Start and end frame prompts with composition, character, lighting, and identity control.", accent: "#A66BE8", tint: "rgb(166 107 232 / 14%)" },
  { id: "other", icon: "✦", title: "Other Compatible Models", description: "Flexible prompt structures for additional platforms and future supported workflows.", accent: "#FF6B4A", tint: "rgb(255 107 74 / 16%)" },
] as const;

const guidance = [
  { title: "Motion and Action", description: "Choose a video model suited to the speed, complexity, and physical movement in the scene." },
  { title: "Cinematic Direction", description: "Consider camera control, lighting, realism, pacing, and scene composition." },
  { title: "Character Consistency", description: "Use clear identity locks, appearance rules, and reusable character profiles." },
  { title: "Image and Frame Creation", description: "Use image-oriented workflows for start frames, end frames, references, and visual planning." },
] as const;

function ModelFeatureCard({ model }: { model: (typeof models)[number] }) {
  return <Link href="/create?section=setup" className={compact.modelFeatureCard} style={{ "--model-accent": model.accent, "--model-tint": model.tint, "--model-surface": "#11182d" } as CSSProperties} aria-label={`Choose ${model.title} in production setup`}>
    <div className={compact.modelFeatureContent}><span className={compact.modelFeatureIcon} aria-hidden="true">{model.icon}</span><h3>{model.title}</h3><p>{model.description}</p><span className={compact.modelFeatureArrow} aria-hidden="true">→</span></div>
  </Link>;
}

export function ModelsPublicPage() {
  return <main className={`marketing-shell ${compact.modelsPage}`}>
    <PublicHeader />
    <section className={compact.modelsHero}><p className="eyebrow">MODEL COMPATIBILITY</p><h1>Choose the Right Model for Your Production</h1><p className="hero-copy">Prepare prompts for different image and video-generation workflows while keeping character identity, motion, camera direction, timing, and consistency clear.</p><div className={compact.modelsHeroActions}><Link className="marketing-button" href="/create?section=setup">Choose a Model and Create</Link><Link className="marketing-button secondary" href="/video-types">Explore Video Types</Link></div></section>
    <section className={`marketing-section ${compact.modelFeatureSection}`}><h2>Models and Compatible Workflows</h2><p className="section-copy">Choose a target model or platform so the production prompts can follow the appropriate structure, level of detail, and creative direction.</p><div className={compact.modelFeatureGrid}>{models.map((model) => <ModelFeatureCard key={model.id} model={model} />)}</div><p className={compact.modelDisclaimer}>Model features and availability may change. Always confirm the current options on the selected generation platform.</p></section>
    <section className={`marketing-section ${compact.modelGuidanceSection}`}><h2>How to Choose a Model</h2><p className="section-copy">Select the model based on the type of scene, motion, visual style, and production control required for the project.</p><div className={compact.modelGuidanceGrid}>{guidance.map((item) => <article className={compact.modelGuidanceCard} key={item.title}><h3>{item.title}</h3><p>{item.description}</p></article>)}</div><article className={compact.modelLimitations}><h3>Model-Specific Results May Differ</h3><p>Each model interprets prompts differently. The platform can adapt prompt structure and detail, but final image or video quality also depends on the selected model, its current features, and the generation settings used.</p></article></section>
    <section className={compact.modelsCta}><div><p className="eyebrow">CONNECTED CREATION</p><h2>Ready to Choose Your Model?</h2><p>Select a workflow, prepare your production settings, and generate the prompts required for your project.</p></div><div><Link className="marketing-button" href="/create?section=setup">Choose a Model and Create</Link><Link className="marketing-button secondary" href="/production-packs">Explore Production Packs</Link></div></section>
    <PublicFooter />
  </main>;
}
