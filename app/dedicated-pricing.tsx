import Link from "next/link";
import { PublicFooter, PublicHeader } from "./public-site";
import { pricingPlans } from "./pricing-plans";
import page from "./public-pages.module.css";
import styles from "./signature-pricing.module.css";

const planDetails = {
  starter: { count: "10", inherits: "", best: "Best for testing the platform and producing a small number of complete videos.", features: ["Complete Video Idea", "Start and End Frame Prompts", "Main Video Prompt", "Action Timeline", "Character Consistency", "Music and Sound Direction", "Prompt Library and Export"] },
  creator: { count: "35", inherits: "Includes all Starter features", best: "Best for individual creators maintaining a consistent publishing schedule.", features: ["Reusable Character Library", "Detailed Motion Direction", "Camera Direction", "Second-by-Second Timelines", "Model-Specific Guidance", "AI Prompt Improvement", "Saved Production Settings"] },
  studio: { count: "60", inherits: "Includes all Creator features", best: "Best for channels producing several times per week or managing recurring series.", features: ["Advanced Character Continuity", "Object and Scene Continuity", "Expanded Camera Direction", "Voice and Sound Paths", "Professional Timelines", "Prompt Refinement Tools", "Advanced Export Options"] },
  pro: { count: "120", inherits: "Includes all Studio features", best: "Best for high-frequency production across multiple active content series.", features: ["Maximum Monthly Capacity", "Large Character Library", "Multiple Recurring Series", "Advanced Model Optimization", "Complete Quality-Control Direction", "Extensive Prompt Refinement", "Complete Production Pack Export"] },
} as const;

export function DedicatedPricingPage() {
  return <main className={styles.page}>
    <PublicHeader />
    <div className={styles.content}>
      <section className={page.hero}><p className={page.eyebrow}>SIMPLE MONTHLY PLANS · CLEAR PRODUCTION CAPACITY</p><h1>Choose the Plan That Fits Your Creative Workflow</h1><p className={page.intro}>Generate structured AI-video ideas, reusable characters, and complete production packs with a plan designed for your production volume.</p></section>
      <section className={styles.plans} aria-label="Pricing plans">
        {pricingPlans.map((plan) => { const details = planDetails[plan.id]; const badge = plan.featured ? "Most Popular" : plan.id === "pro" ? "Highest Capacity" : ""; return <article key={plan.id} className={`${styles.plan} ${styles[plan.id]}`}>
          <span className={`${styles.badge} ${badge ? "" : styles.badgePlaceholder}`}>{badge || "Reserved badge space"}</span>
          <h2>{plan.name}</h2><p className={styles.description}>{plan.description}</p>
          <div className={styles.capacity}><strong>{details.count}</strong><b>Full Production Packs</b><small>{plan.costPerPack.replace("per full pack", "each")}</small></div>
          <div className={styles.price}><span>{plan.monthlyPrice}</span><small>/ month</small></div>
          <Link className={page.button} href={`/sign-in?plan=${plan.id}`}>Choose {plan.name}</Link>
          <p className={styles.inherits}>{details.inherits || " "}</p>
          <ul className={styles.features}>{details.features.map((feature) => <li key={feature}><span aria-hidden="true">✓</span><span>{feature}</span></li>)}</ul>
          <p className={styles.best}>{details.best}</p>
        </article>; })}
      </section>
      <section className={styles.section}><h2>What Is Included in a Full Production Pack?</h2><div className={styles.surface}>A Full Production Pack brings creative and technical instructions for one AI-video concept together in a structured, ready-to-use package.</div></section>
      <section className={styles.section}><h2>Pack usage</h2><div className={styles.surface}>One Full Production Pack represents one complete generated production package. Final credit and usage rules will be confirmed before public launch.</div></section>
      <section className={styles.section}><h2>Pricing FAQ</h2><div className={styles.surface}>Commercial plan policies, including unused-pack handling, will be confirmed before public launch.</div></section>
      <section className={page.videoTypeCta}><div><p className={page.eyebrow}>CREATE WHEN READY</p><h2>Start Building Better AI-Video Prompts</h2><p>Choose a plan or explore the production workflow before launch.</p></div><div><Link className={page.button} href="/create">Start Creating</Link><Link href="/video-types">Explore Video Types</Link></div></section>
    </div>
    <PublicFooter />
  </main>;
}
