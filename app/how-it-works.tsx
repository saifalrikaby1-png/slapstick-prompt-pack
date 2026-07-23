import Link from "next/link";
import type { CSSProperties } from "react";
import { PublicFooter, PublicHeader } from "./public-site";
import compact from "./marketing-compact.module.css";

const workflowStages = [
  { number: "01", title: "Choose a Video Type", description: "Select the visual style that fits your story and audience.", accent: "#FF7043", tint: "rgb(255 112 67 / 14%)" },
  { number: "02", title: "Build or Select Characters", description: "Create a character or choose one from your saved library.", accent: "#F47C6B", tint: "rgb(244 124 107 / 13%)" },
  { number: "03", title: "Define the Creative Idea", description: "Set the location, key object, main action, and payoff.", accent: "#D6A33D", tint: "rgb(214 163 61 / 14%)" },
  { number: "04", title: "Select an AI Model", description: "Choose the model that will generate the image or video.", accent: "#8A6CF6", tint: "rgb(138 108 246 / 14%)" },
  { number: "05", title: "Choose Production Outputs", description: "Select the prompts and instructions needed for this project.", accent: "#E84D8A", tint: "rgb(232 77 138 / 14%)" },
  { number: "06", title: "Generate the Production Pack", description: "Create the prompts, timeline, camera, audio, and consistency rules.", accent: "#FF6B4A", tint: "rgb(255 107 74 / 14%)" },
  { number: "07", title: "Review and Improve", description: "Check continuity, pacing, physical logic, and model compatibility.", accent: "#A66BE8", tint: "rgb(166 107 232 / 14%)" },
  { number: "08", title: "Save or Export", description: "Save the final pack or export it to your chosen platform.", accent: "#D96A8D", tint: "rgb(217 106 141 / 14%)" },
] as const;

function WorkflowStepCard({ stage }: { stage: (typeof workflowStages)[number] }) {
  return <article className={compact.workflowCard} style={{ "--step-accent": stage.accent, "--step-tint": stage.tint, "--step-surface": "#11182d" } as CSSProperties}>
    <span className={compact.workflowNumber}>{stage.number}</span>
    <h3>{stage.title}</h3>
    <p>{stage.description}</p>
  </article>;
}

export function HowItWorksSignaturePage() {
  return <main className={`marketing-shell ${compact.howItWorksPage}`}>
    <PublicHeader />
    <section className={compact.howItWorksHero}>
      <p className="eyebrow">CONNECTED WORKFLOW</p>
      <h1>How It Works</h1>
      <p className="hero-copy">Move from your first creative decision to a complete, refined AI-video production pack through eight clear stages.</p>
    </section>
    <section className={`marketing-section ${compact.workflowSection}`}>
      <h2>Eight Clear Stages</h2>
      <div className={compact.workflowGrid}>{workflowStages.map((stage) => <WorkflowStepCard key={stage.number} stage={stage} />)}</div>
      <div className={compact.workflowAction}><Link className="marketing-button" href="/create">Start Creating</Link></div>
    </section>
    <PublicFooter />
  </main>;
}
