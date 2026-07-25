import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { videoStyles } from "./video-styles";
import { PublicFooter, PublicHeader } from "./public-site";

const examples = [
  ["Slapstick", "A delivery robot loses control of bouncing packages."],
  ["Cinematic", "A traveler crosses a flooded city at sunrise."],
  ["Family 3D Animation", "A young inventor repairs a tiny flying machine before sunset."],
  ["Anime", "A swordswoman faces a storm-powered guardian on a bridge."],
  ["Realistic Live Action", "A detective enters an abandoned theatre during a power failure."],
  ["CGI Fantasy", "A dragon rider escapes a collapsing crystal fortress."],
  ["Stylized 3D Cartoon", "An office mascot delivers an oversized presentation folder."],
];

function SectionHeading({ eyebrow, title, copy }: { eyebrow: string; title: string; copy?: string }) {
  return <header className="home-section-heading">
    <span className="home-section-eyebrow">{eyebrow}</span>
    <div className="home-heading-divider" aria-hidden="true"><span>◆</span></div>
    <h2>{title}</h2>
    {copy ? <p>{copy}</p> : null}
  </header>;
}

function PremiumSection({ children, className = "", innerClassName = "", dots = false, curves = false, id }: { children: ReactNode; className?: string; innerClassName?: string; dots?: boolean; curves?: boolean; id?: string }) {
  return <div className="home-section-wrap">
    <section id={id} className={`home-premium-section ${className}`}>
      <div className={`home-premium-section-inner ${innerClassName}`}>
        {dots ? <><div className="home-dot-pattern home-dot-pattern-top" aria-hidden="true" /><div className="home-dot-pattern home-dot-pattern-bottom" aria-hidden="true" /></> : null}
        {children}
        {curves ? <div className="home-gold-curves" aria-hidden="true"><span /><span /><span /><span /><span /></div> : null}
      </div>
    </section>
  </div>;
}

export function MarketingHome() {
  return <main className="marketing-shell marketing-home">
    <PublicHeader />

    <section className="home-hero" aria-labelledby="hero-title">
      <div className="home-hero-content">
        <p className="home-section-eyebrow">AI VIDEO PRE-PRODUCTION PLATFORM</p>
        <h1 id="hero-title">Build Better AI Videos Before You Generate Them</h1>
        <p className="home-hero-description">Choose your creative style, build original characters from scratch, and generate complete model-ready production packs with frames, timelines, camera direction, audio guidance, continuity rules, and built-in Quality Control.</p>
        <div className="home-hero-actions">
          <Link href="/video-types" className="home-primary-button">Choose a Video Style</Link>
          <Link href="/character-builder/create" className="home-secondary-button">Build a Character</Link>
          <Link href="/how-it-works" className="home-text-button">▷ Watch the Demo</Link>
        </div>
        <p className="home-muted-text home-free-note">Free Demo Mode available. No API key required.</p>
      </div>
      <div className="home-hero-glow" aria-hidden="true" />
    </section>

    <PremiumSection className="creator-benefits-section" dots curves>
      <SectionHeading eyebrow="BUILT FOR SERIOUS CREATORS" title="Built for creators who need reliable workflows across multiple visual styles" copy="Create structured, reusable and model-ready production packs through one consistent professional workflow." />
      <div className="home-card-grid home-card-grid-five">
        {[
          ["Dedicated workflows", "Dedicated workflows for seven video types."],
          ["Original characters", "Build original characters without complex prompting."],
          ["Reusable identities", "Reuse identities across multiple productions."],
          ["Fewer generation failures", "Reduce avoidable generation failures."],
          ["Model-ready output", "Generate structured model-ready packs."],
        ].map(([title, copy]) => <article key={title} className="home-premium-card home-icon-card"><span className="home-icon" aria-hidden="true">✓</span><div><h3>{title}</h3><p>{copy}</p></div></article>)}
      </div>
    </PremiumSection>

    <PremiumSection className="home-split-section" innerClassName="home-split-inner" dots>
      <div className="home-split-copy"><SectionHeading eyebrow="WHY STYLE-SPECIFIC?" title="Stop Using One Generic Prompt for Every Kind of Video" copy="Generic prompts lose camera intent, pacing, character consistency, and model adaptation. This platform adapts production logic before a prompt is generated." /></div>
      <div className="home-comparison-grid">
        <article className="home-premium-card"><span className="home-icon" aria-hidden="true">01</span><div><h3>Generic workflow</h3><p>One prompt structure · weak camera instructions · incorrect pacing · higher retry risk</p></div></article>
        <article className="home-premium-card"><span className="home-icon" aria-hidden="true">02</span><div><h3>Dedicated workflow</h3><p>Style-specific structure · reusable profiles · camera and lighting guidance · connected timelines</p></div></article>
      </div>
    </PremiumSection>

    <PremiumSection id="how-it-works" dots>
      <SectionHeading eyebrow="CONNECTED PROCESS" title="How It Works" />
      <div className="home-card-grid home-process-grid">{[["01", "Choose a video type", "Select one visual language with its own production rules."], ["02", "Define the concept", "Set the title, location, object, action, ending, and tone."], ["03", "Build or select characters", "Create original identities or reuse a saved profile."], ["04", "Generate the complete production pack", "Receive frames, lock, timeline, camera, and audio guidance."], ["05", "Review with Quality Control", "Catch continuity risks and repair weak sections before generation."]].map(([number, title, copy]) => <article key={number} className="home-premium-card home-process-card"><span className="home-icon" aria-hidden="true">{number}</span><h3>{title}</h3><p>{copy}</p></article>)}</div>
    </PremiumSection>

    <PremiumSection className="home-character-section" innerClassName="home-split-inner home-character-inner" curves>
      <div><SectionHeading eyebrow="CHARACTER-FIRST" title="Every Character Detail Travels Into the Selected Video Workflow" copy="When a character is selected, its appearance, role, proportions, wardrobe, personality, movement, and sound profile are automatically connected to every relevant production output." /><Link href="/character-builder/create" className="home-primary-button">Open Character Builder</Link></div>
      <div className="home-premium-card home-connection-card"><span className="home-section-eyebrow">CHARACTER PROFILE</span><b>Identity lock</b><p>Appearance · colors · wardrobe · movement · sound</p><div><span>↘ Frames</span><span>↘ Timeline</span><span>↘ Audio</span><span>↘ Quality Control</span></div></div>
    </PremiumSection>

    <PremiumSection id="quality-control" className="home-centered-section home-tag-section" dots curves>
      <SectionHeading eyebrow="QUALITY CONTROL" title="Protect continuity before you send a prompt to a video model" copy="Checks adapt to the selected style while preserving identity, roles, wardrobe, accessories, object traceability, duration, camera clarity, audio synchronization, reference frames, and model compatibility." />
      <div className="home-pill-list home-tag-list">{["Identity consistency", "Object traceability", "Camera clarity", "Audio synchronization", "Style-specific checks"].map((item) => <span className="home-tag" key={item}>{item}</span>)}</div>
    </PremiumSection>

    <PremiumSection id="models" className="home-centered-section home-tag-section">
      <SectionHeading eyebrow="MODEL COMPATIBILITY" title="Built Around the Video Models Creators Already Use" copy="Adapters can influence duration, reference-frame strategy, camera behavior, motion density, audio, aspect ratio, and segmentation." />
      <div className="home-pill-list home-tag-list">{["OpenArt", "Kling", "Seedance", "Veo", "Runway", "PixVerse", "Higgsfield", "Custom workflow"].map((model) => <span className="home-tag" key={model}>{model}</span>)}</div>
    </PremiumSection>

    <PremiumSection className="home-mode-section" dots>
      <SectionHeading eyebrow="DEMO OR AI" title="Choose the right generation mode" />
      <div className="home-card-grid home-mode-grid"><article className="home-premium-card home-mode-card"><span className="home-section-eyebrow">DEMO MODE</span><h3>Instant structured output</h3><p>No API request. All styles, local character creation, and reliable workflow testing.</p><a href="#video-types">Try Demo Mode →</a></article><article className="home-premium-card home-mode-card"><span className="home-section-eyebrow">AI MODE</span><h3>Personalized refinement</h3><p>OpenAI-powered generation for original content and targeted corrections, using your secure server-side key.</p><a href="#video-types">Explore AI Mode →</a></article></div>
    </PremiumSection>

    <PremiumSection className="home-examples-section" dots curves>
      <SectionHeading eyebrow="PRODUCT DEMONSTRATIONS" title="See each workflow in motion" />
      <div className="home-card-grid home-example-grid home-demo-grid">{examples.map(([style, idea]) => { const item = Object.values(videoStyles).find((entry) => entry.name === style)!; return <article key={style} className="home-premium-card home-example-card home-demo-card" style={{ "--style-accent": item.accent } as CSSProperties}><span>{style}</span><p>{idea}</p><small className="demo-score">Demo quality score · 92/100</small><Link className="demo-link" href={`/create/${item.slug}`}>View Example →</Link></article>; })}</div>
    </PremiumSection>

    <PublicFooter />
  </main>;
}
