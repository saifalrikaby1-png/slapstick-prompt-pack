"use client";

import { FormEvent, useId, useState } from "react";
import { PublicFooter, PublicHeader } from "../public-site";
import { pricingPlans } from "../pricing-plans";
import compact from "../marketing-compact.module.css";
import styles from "./sign-in.module.css";

type SignInPublicPageProps = { plan?: string };

const selectedPlan = (plan?: string) => pricingPlans.find((item) => item.id === plan);

export function SignInPublicPage({ plan }: SignInPublicPageProps) {
  const [showPassword, setShowPassword] = useState(false);
  const emailId = useId();
  const passwordId = useId();
  const planDetails = selectedPlan(plan);

  function keepAuthenticationHonest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
  }

  return <main className={`marketing-shell ${compact.modelsPage} ${styles.page}`}>
    <PublicHeader />
    <section className={styles.content} aria-labelledby="sign-in-heading">
      <aside className={styles.introduction} aria-labelledby="welcome-heading">
        <p className="eyebrow">ACCOUNT ACCESS</p>
        <h2 id="welcome-heading">Welcome Back</h2>
        <p>Sign in to continue building characters, production packs, and model-ready prompts from your saved workspace.</p>
        <div className={styles.benefits}>
          <article><span aria-hidden="true">↗</span><div><h2>Continue Saved Projects</h2><p>Access saved characters, prompts, and production settings.</p></div></article>
          <article><span aria-hidden="true">◎</span><div><h2>Reuse Character Profiles</h2><p>Bring consistent characters into future production packs.</p></div></article>
          <article><span aria-hidden="true">✓</span><div><h2>Keep Your Workflow Organized</h2><p>Store and review prompts from one connected workspace.</p></div></article>
        </div>
      </aside>

      <div className={styles.formArea}>
        <form className={styles.card} onSubmit={keepAuthenticationHonest} noValidate aria-describedby="authentication-notice">
          <header className={styles.cardHeader}>
            <h1 id="sign-in-heading">Sign In</h1>
            <p>Access your saved characters, prompts, and production workspace.</p>
          </header>
          {planDetails && <p className={styles.planNotice}><span aria-hidden="true">✦</span>Selected plan: <strong>{planDetails.name}</strong></p>}

          <div className={styles.field}>
            <label htmlFor={emailId}>Email Address</label>
            <input id={emailId} name="email" type="email" autoComplete="email" placeholder="name@example.com" />
          </div>
          <div className={styles.field}>
            <label htmlFor={passwordId}>Password</label>
            <div className={styles.passwordField}>
              <input id={passwordId} name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="Enter your password" />
              <button type="button" className={styles.passwordToggle} aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} onClick={() => setShowPassword((value) => !value)}>{showPassword ? "Hide" : "Show"}</button>
            </div>
          </div>
          <div className={styles.options}>
            <label className={styles.remember}><input type="checkbox" name="remember" /> <span>Remember me</span></label>
            <span className={styles.launchOnly}>Forgot password? Available at launch</span>
          </div>
          <button className="marketing-button" type="submit" disabled aria-describedby="authentication-notice">Sign In</button>
          <p id="authentication-notice" className={styles.authenticationNotice} role="status">Account authentication will be enabled before public launch.</p>
          <p className={styles.createAccount}>New here? <span>Create an account at launch.</span></p>
        </form>
      </div>
    </section>
    <PublicFooter />
  </main>;
}
