import Link from "next/link";
import type { CSSProperties } from "react";
import compact from "./marketing-compact.module.css";
import { videoStyleIds, videoStyles } from "./video-styles";
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

const plans = [["Starter", "$4.99", "10 AI full packs"], ["Creator", "$11.99", "30 AI full packs"], ["Pro", "$19.99", "60 AI full packs"], ["Studio", "$32.99", "120 AI full packs"]];
const cardCopy = {
  slapstick: { badge: "Comedy", description: "Fast visual comedy with clear action and harmless payoffs." },
  cinematic: { badge: "Film", description: "Film-style storytelling with deliberate framing and atmosphere." },
  "family-3d": { badge: "3D Animation", description: "Polished 3D storytelling with expressive characters and smooth motion." },
  anime: { badge: "Anime", description: "Dynamic anime storytelling with dramatic poses and energetic action." },
  "live-action": { badge: "Live Action", description: "Photorealistic scenes with natural acting and cinematic direction." },
  "cgi-fantasy": { badge: "Fantasy", description: "Epic fantasy scenes with magical worlds and controlled effects." },
  "stylized-3d": { badge: "Stylized 3D", description: "Stylized animation for humorous, educational, and commercial content." },
} as const;

export function MarketingHome() {
  return <main className="marketing-shell">
    <PublicHeader />

    <section className={`marketing-hero ${compact.hero}`} aria-labelledby="hero-title">
      <div><p className="eyebrow">AI VIDEO PRE-PRODUCTION PLATFORM</p><h1 id="hero-title">Build Better AI Videos Before You Generate Them</h1><p className="hero-copy">Choose your creative style, build original characters from scratch, and generate complete model-ready production packs with frames, timelines, camera direction, audio guidance, continuity rules, and built-in Quality Control.</p><div className="hero-actions"><Link href="/video-types" className="marketing-button">Choose a Video Style</Link><Link href="/character-builder" className="marketing-button secondary">Build a Character</Link><Link href="/how-it-works" className="watch-link">▷ Watch the Demo</Link></div><p className="free-note">Free Demo Mode available. No API key required.</p></div>
      {/*
        <div className="visual-top"><span>Family 3D Animation</span><b>Production Pack</b><i>Quality 94</i></div><div className="visual-grid"><article><small>CHARACTER PROFILE</small><strong>Identity Lock</strong><p>Appearance · wardrobe · movement</p></article><article><small>CAMERA DIRECTION</small><strong>Continuous arc</strong><p>16:9 · soft key light</p></article><article><small>TIMELINE</small><strong>0:00 → 0:20</strong><div className="visual-timeline"><i /><i /><i /></div></article><article className="visual-quality"><small>QUALITY CONTROL</small><strong>94 / 100</strong><button type="button">Fix Prompts</button></article></div><div className="visual-flow">Video Style <b>→</b> Characters <b>→</b> Production Setup <b>→</b> Production Pack <b>→</b> Quality Control <b>→</b> Video Generator</div>
      */}
    </section>

    <section id="video-types" className={`marketing-section ${compact.styleSection}`}><p className="eyebrow">DEDICATED WORKFLOWS</p><h2>Choose the Kind of Video You Want to Create</h2><p className="section-copy">Every video type uses its own production structure, camera language, pacing rules, character behavior, visual guidance, and Quality Control checks.</p><div className={compact.styleGrid}>{videoStyleIds.map((id) => { const style = videoStyles[id]; const copy = cardCopy[id]; return <Link key={id} href={`/create/${id}`} className={compact.styleCard} style={{ "--style-accent": style.accent } as CSSProperties} aria-label={`${style.name}: ${copy.description}`}><div className={compact.cardTopRow}><span className={compact.styleIcon}>{style.icon}</span><span className={compact.styleBadge}>{copy.badge}</span></div><h3>{style.name}</h3><p>{copy.description}</p><span className={compact.styleArrow} aria-hidden="true">→</span></Link>; })}</div></section>

    <section className="value-strip"><h2>Built for creators who need reliable workflows across multiple visual styles</h2><div>{["Dedicated workflows for seven video types", "Build original characters without complex prompting", "Reuse identities across multiple productions", "Reduce avoidable generation failures", "Generate structured model-ready packs"].map((benefit) => <p key={benefit}>✓ {benefit}</p>)}</div></section>

    <section className="marketing-section split-section"><div><p className="eyebrow">WHY STYLE-SPECIFIC?</p><h2>Stop Using One Generic Prompt for Every Kind of Video</h2><p className="section-copy">Generic prompts lose camera intent, pacing, character consistency, and model adaptation. This platform adapts production logic before a prompt is generated.</p></div><div className="comparison"><article><b>Generic workflow</b><p>One prompt structure · weak camera instructions · incorrect pacing · higher retry risk</p></article><article><b>Dedicated workflow</b><p>Style-specific structure · reusable profiles · camera and lighting guidance · connected timelines</p></article></div></section>

    <section id="how-it-works" className="marketing-section"><p className="eyebrow">CONNECTED PROCESS</p><h2>How It Works</h2><div className="steps">{[["01","Choose a video type","Select one visual language with its own production rules."],["02","Define the concept","Set the title, location, object, action, ending, and tone."],["03","Build or select characters","Create original identities or reuse a saved profile."],["04","Generate the complete production pack","Receive frames, lock, timeline, camera, and audio guidance."],["05","Review with Quality Control","Catch continuity risks and repair weak sections before generation."]].map(([number, title, copy]) => <article key={number}><span>{number}</span><h3>{title}</h3><p>{copy}</p></article>)}</div></section>

    <section className="marketing-section character-connection"><div><p className="eyebrow">CHARACTER-FIRST</p><h2>Every Character Detail Travels Into the Selected Video Workflow</h2><p className="section-copy">When a character is selected, its appearance, role, proportions, wardrobe, personality, movement, and sound profile are automatically connected to every relevant production output.</p><Link href="/characters" className="marketing-button">Open Character Builder</Link></div><div className="connection-card"><span>Character profile</span><b>Identity lock</b><p>Appearance · colors · wardrobe · movement · sound</p><div>↘ Frames <span>↘ Timeline</span><span>↘ Audio</span><span>↘ Quality Control</span></div></div></section>

    <section id="production-packs" className="marketing-section"><p className="eyebrow">ONE CONNECTED PACK</p><h2>Everything Your Selected Video Style Needs, in One Connected Pack</h2><div className="pack-showcase">{[["Creative foundation", "Title, concept, video type, location, object, action, ending, tone"],["Character system", "Full profile, identity lock, role, wardrobe, proportions, movement, sound"],["Visual generation", "Character-sheet prompt, start frame, end frame, camera, lighting, ratio"],["Video production", "Complete video lock, timeline, style pacing, continuity, final rule"],["Audio", "Music, environment, sound effects, named reactions, timing"],["Export and reuse", "Copy, Word export, save, reuse, adapt to another style"]].map(([title, copy]) => <article key={title}><h3>{title}</h3><p>{copy}</p></article>)}</div></section>

    <section id="quality-control" className="marketing-section dark-feature"><p className="eyebrow">QUALITY CONTROL</p><h2>Protect continuity before you send a prompt to a video model</h2><p>Checks adapt to the selected style while preserving identity, roles, wardrobe, accessories, object traceability, duration, camera clarity, audio synchronization, reference frames, and model compatibility.</p><div className="quality-pills"><span>Identity consistency</span><span>Object traceability</span><span>Camera clarity</span><span>Audio synchronization</span><span>Style-specific checks</span></div></section>

    <section id="models" className="marketing-section"><p className="eyebrow">MODEL COMPATIBILITY</p><h2>Built Around the Video Models Creators Already Use</h2><p className="section-copy">Adapters can influence duration, reference-frame strategy, camera behavior, motion density, audio, aspect ratio, and segmentation.</p><div className="model-badges">{["OpenArt", "Kling", "Seedance", "Veo", "Runway", "PixVerse", "Higgsfield", "Custom workflow"].map((model) => <span key={model}>{model}</span>)}</div></section>

    <section className="marketing-section"><p className="eyebrow">DEMO OR AI</p><h2>Choose the right generation mode</h2><div className="mode-cards"><article><b>Demo Mode</b><h3>Instant structured output</h3><p>No API request. All styles, local character creation, and reliable workflow testing.</p><a href="#video-types">Try Demo Mode →</a></article><article><b>AI Mode</b><h3>Personalized refinement</h3><p>OpenAI-powered generation for original content and targeted corrections, using your secure server-side key.</p><a href="#video-types">Explore AI Mode →</a></article></div></section>

    <section className="marketing-section"><p className="eyebrow">PRODUCT DEMONSTRATIONS</p><h2>See each workflow in motion</h2><div className="example-grid">{examples.map(([style, idea]) => { const item = Object.values(videoStyles).find((entry) => entry.name === style)!; return <article key={style} style={{ "--style-accent": item.accent } as CSSProperties}><span>{style}</span><p>{idea}</p><small>Demo quality score · 92/100</small><Link href={`/create/${item.slug}`}>View Example →</Link></article>; })}</div></section>

    <section id="pricing" className="marketing-section"><p className="eyebrow">PRICING PREVIEW</p><h2>Simple plans for launch</h2><p className="section-copy">Preview only—payments are not connected in this phase.</p><div className="pricing-grid">{plans.map(([name, price, quantity]) => <article key={name} className={name === "Creator" ? "popular" : ""}>{name === "Creator" && <span>Most Popular</span>}<h3>{name}</h3><b>{price}</b><p>{quantity}</p><small>All seven styles · Character Builder · Identity locks · Quality Control · export</small><button type="button">Coming Soon</button></article>)}</div></section>

    <section className="marketing-section faq"><p className="eyebrow">FAQ</p><h2>Questions creators ask</h2>{["Which video styles are supported?", "Does each style have its own workflow?", "Can I build a character from scratch?", "Can one character be reused in multiple styles?", "How are characters connected to prompts?", "Does Demo Mode consume credits?", "Does Quality Control adapt to the style?", "Which video-generation models are supported?", "Can production packs be exported?", "Is an API key required?", "Can the platform create realistic projects?"].map((question) => <details key={question}><summary>{question}</summary><p>Yes. This preview uses a connected, style-aware workflow and keeps Demo Mode available without an API key.</p></details>)}</section>

    <PublicFooter />
  </main>;
}
