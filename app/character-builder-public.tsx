import Link from "next/link";
import type { CSSProperties } from "react";
import { PublicFooter, PublicHeader } from "./public-site";
import compact from "./marketing-compact.module.css";

const characterFeatures = [
  { id: "identity", icon: "ID", title: "Character Identity", description: "Define the character’s name, type, apparent age, role, and essential identity.", accent: "#FF7043", tint: "rgb(255 112 67 / 14%)" },
  { id: "appearance", icon: "◉", title: "Visual Appearance", description: "Set body proportions, facial details, colors, hair, fur, skin, or surface style.", accent: "#F47C6B", tint: "rgb(244 124 107 / 13%)" },
  { id: "personality", icon: "✦", title: "Personality and Role", description: "Choose personality traits, emotional range, story role, and default expression.", accent: "#D6A33D", tint: "rgb(214 163 61 / 14%)" },
  { id: "clothing", icon: "◇", title: "Clothing and Accessories", description: "Lock the outfit, footwear, accessories, and signature props used in production.", accent: "#D96A8D", tint: "rgb(217 106 141 / 14%)" },
  { id: "voice", icon: "≈", title: "Voice and Vocal Lock", description: "Define tone, pitch, rhythm, vocal age, and consistent nonverbal sounds.", accent: "#E84D8A", tint: "rgb(232 77 138 / 14%)" },
  { id: "movement", icon: "↗", title: "Movement Style", description: "Set the character’s energy, posture, gestures, reactions, and performance style.", accent: "#8A6CF6", tint: "rgb(138 108 246 / 14%)" },
  { id: "locks", icon: "◆", title: "Consistency Locks", description: "Protect proportions, colors, clothing, movement, identity, and forbidden changes.", accent: "#A66BE8", tint: "rgb(166 107 232 / 14%)" },
  { id: "library", icon: "▤", title: "Saved Character Library", description: "Save, edit, duplicate, and reuse character profiles across future production packs.", accent: "#FF6B4A", tint: "rgb(255 107 74 / 14%)" },
] as const;

function CharacterFeatureCard({ feature }: { feature: (typeof characterFeatures)[number] }) {
  return <article className={compact.characterFeatureCard} style={{ "--feature-accent": feature.accent, "--feature-tint": feature.tint, "--feature-surface": "#11182d" } as CSSProperties}>
    <span className={compact.characterFeatureIcon} aria-hidden="true">{feature.icon}</span>
    <h3>{feature.title}</h3>
    <p>{feature.description}</p>
  </article>;
}

export function CharacterBuilderPublicPage() {
  return <main className={`marketing-shell ${compact.characterBuilderPage}`}>
    <PublicHeader />
    <section className={compact.characterBuilderHero}>
      <p className="eyebrow">CHARACTER-FIRST CREATION</p>
      <h1>Build Characters That Stay Consistent</h1>
      <p className="hero-copy">Create reusable character profiles with a clear identity, appearance, personality, movement style, voice direction, and production consistency.</p>
      <div className={compact.characterBuilderHeroAction}><Link className="marketing-button" href="/character-builder/create">Build a Character</Link></div>
    </section>
    <section className={`marketing-section ${compact.characterFeatureSection}`}>
      <h2>Everything Your Character Profile Needs</h2>
      <p className="section-copy">Build each part of your character once, save it, and reuse it across future productions.</p>
      <div className={compact.characterFeatureGrid}>{characterFeatures.map((feature) => <CharacterFeatureCard key={feature.id} feature={feature} />)}</div>
    </section>
    <section className={compact.characterBuilderCta}>
      <div><p className="eyebrow">REUSABLE CHARACTER SYSTEM</p><h2>Ready to Build Your Character?</h2><p>Create a reusable character profile and carry it into future production packs.</p></div>
      <div><Link className="marketing-button" href="/character-builder/create">Build a Character</Link><Link className="marketing-button secondary" href="/create">Start Creating</Link></div>
    </section>
    <PublicFooter />
  </main>;
}
