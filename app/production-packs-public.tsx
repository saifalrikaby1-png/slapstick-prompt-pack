import Link from "next/link";
import type { CSSProperties } from "react";
import { PublicFooter, PublicHeader } from "./public-site";
import compact from "./marketing-compact.module.css";

const productionPackFeatures = [
  { id: "idea", icon: "✦", title: "Complete Video Idea", description: "Defines the location, key object, main action, escalation, and final payoff.", accent: "#FF7043", tint: "rgb(255 112 67 / 14%)" },
  { id: "brief", icon: "▤", title: "Title and Creative Brief", description: "Provides a concise title and clear summary of the complete production concept.", accent: "#F47C6B", tint: "rgb(244 124 107 / 13%)" },
  { id: "characters", icon: "ID", title: "Character Instructions", description: "Locks each character’s identity, appearance, role, proportions, and behavior.", accent: "#D6A33D", tint: "rgb(214 163 61 / 14%)" },
  { id: "start-frame", icon: "◫", title: "Start Frame Prompt", description: "Describes the precise opening image, composition, characters, and scene state.", accent: "#D96A8D", tint: "rgb(217 106 141 / 14%)" },
  { id: "end-frame", icon: "◧", title: "End Frame Prompt", description: "Defines the final visual state, character positions, result, and closing payoff.", accent: "#E84D8A", tint: "rgb(232 77 138 / 14%)" },
  { id: "video", icon: "▶", title: "Main Video Prompt", description: "Combines the complete action, visual direction, timing, and continuity rules.", accent: "#FF6B4A", tint: "rgb(255 107 74 / 16%)" },
  { id: "timeline", icon: "◷", title: "Action Timeline", description: "Organizes movements, reactions, events, and transitions across the video duration.", accent: "#B98A4A", tint: "rgb(185 138 74 / 14%)" },
  { id: "camera", icon: "◉", title: "Camera and Motion", description: "Sets framing, camera movement, subject focus, action clarity, and pacing.", accent: "#8A6CF6", tint: "rgb(138 108 246 / 14%)" },
  { id: "music", icon: "♪", title: "Music Direction", description: "Defines mood, tempo, rhythm, intensity, and musical changes across the scene.", accent: "#A66BE8", tint: "rgb(166 107 232 / 14%)" },
  { id: "sound", icon: "≋", title: "Sound and Vocal Direction", description: "Maps sound effects, impacts, reactions, vocal sounds, and audio timing.", accent: "#C95F82", tint: "rgb(201 95 130 / 14%)" },
  { id: "rules", icon: "◆", title: "Consistency and Model Rules", description: "Prevents visual errors and adapts the instructions to the selected AI model.", accent: "#7A63F6", tint: "rgb(122 99 246 / 14%)" },
  { id: "export", icon: "⇩", title: "Exportable Final Pack", description: "Organizes the completed outputs into one reusable, saveable production package.", accent: "#B56BE8", tint: "rgb(181 107 232 / 14%)" },
] as const;

const generationMethods = [
  { title: "Single Output", description: "Generate one specific prompt or production instruction for a focused task.", examples: ["Start Frame Prompt", "Main Video Prompt", "Sound Direction", "Camera Instructions"], cta: "Start with One Output", accent: "#F47C6B", tint: "rgb(244 124 107 / 12%)", featured: false },
  { title: "Selected Outputs", description: "Choose several outputs and generate only the parts needed for the current project.", examples: ["Start and End Frames", "Main Prompt", "Timeline", "Audio Direction"], cta: "Choose Outputs", accent: "#8A6CF6", tint: "rgb(138 108 246 / 12%)", featured: false },
  { title: "Complete Production Pack", description: "Generate the full creative and technical package for one complete AI-video concept.", examples: ["Complete Idea", "Frames", "Timeline", "Camera", "Audio", "Export"], cta: "Generate Full Pack", accent: "#FF7043", tint: "rgb(255 112 67 / 14%)", featured: true },
] as const;

function ProductionPackFeatureCard({ feature }: { feature: (typeof productionPackFeatures)[number] }) {
  return <article className={compact.productionPackFeatureCard} style={{ "--pack-accent": feature.accent, "--pack-tint": feature.tint, "--pack-surface": "#11182d" } as CSSProperties}>
    <div className={compact.productionPackFeatureContent}>
      <span className={compact.productionPackFeatureIcon} aria-hidden="true">{feature.icon}</span>
      <h3>{feature.title}</h3>
      <p>{feature.description}</p>
    </div>
  </article>;
}

export function ProductionPacksPublicPage() {
  return <main className={`marketing-shell ${compact.productionPacksPage}`}>
    <PublicHeader />
    <section className={compact.productionPacksHero}>
      <p className="eyebrow">ONE CONNECTED PACK</p>
      <h1>Everything You Need for Production</h1>
      <p className="hero-copy">Turn one creative idea into a structured set of prompts, timing instructions, consistency rules, camera direction, and audio guidance for your AI-video workflow.</p>
      <div className={compact.productionPacksHeroActions}><Link className="marketing-button" href="/create">Generate a Production Pack</Link><Link className="marketing-button secondary" href="/how-it-works">See How It Works</Link></div>
    </section>

    <section className={`marketing-section ${compact.productionPackFeatureSection}`}>
      <h2>Inside Every Production Pack</h2>
      <p className="section-copy">Choose the outputs you need or generate a complete pack containing the core creative and technical instructions for one AI-video concept.</p>
      <div className={compact.productionPackFeatureGrid}>{productionPackFeatures.map((feature) => <ProductionPackFeatureCard key={feature.id} feature={feature} />)}</div>
    </section>

    <section className={`marketing-section ${compact.productionPackMethodsSection}`}>
      <h2>Choose What You Need</h2>
      <p className="section-copy">Generate one output, select several production elements, or create the complete pack.</p>
      <div className={compact.productionPackMethodGrid}>{generationMethods.map((method) => <article key={method.title} className={`${compact.productionPackMethodCard} ${method.featured ? compact.productionPackMethodFeatured : ""}`} style={{ "--method-accent": method.accent, "--method-tint": method.tint } as CSSProperties}>
        {method.featured && <span className={compact.productionPackMethodBadge}>Complete workflow</span>}
        <h3>{method.title}</h3><p>{method.description}</p><ul>{method.examples.map((example) => <li key={example}>{example}</li>)}</ul><Link className="marketing-button" href="/create">{method.cta}</Link>
      </article>)}</div>
    </section>

    <section className={compact.productionPacksCta}>
      <div><p className="eyebrow">CONNECTED CREATION</p><h2>Ready to Build Your Production Pack?</h2><p>Choose your outputs, define your idea, and generate the structured prompts needed for production.</p></div>
      <div><Link className="marketing-button" href="/create">Start Creating</Link><Link className="marketing-button secondary" href="/video-types">Explore Video Types</Link></div>
    </section>
    <PublicFooter />
  </main>;
}
