"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { videoStyleIds, videoStyles } from "./video-styles";
import styles from "./public-site.module.css";

export const publicNavigation = [
  ["Video Types", "/video-types"], ["How It Works", "/how-it-works"], ["Character Builder", "/character-builder"],
  ["Production Packs", "/production-packs"], ["Quality Control", "/quality-control"], ["Models", "/models"], ["Pricing", "/pricing"],
] as const;

export function PublicHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => { document.body.style.overflow = open ? "hidden" : ""; return () => { document.body.style.overflow = ""; }; }, [open]);
  return <header className={styles.header}>
    <Link href="/" className={styles.brand} aria-label="Slapstick Prompt Pack home"><span>SP</span> Slapstick Prompt Pack</Link>
    <button className={styles.menuButton} type="button" aria-label="Toggle navigation menu" aria-expanded={open} onClick={() => setOpen((value) => !value)}><i /><i /><i /></button>
    <nav className={`${styles.nav} ${open ? styles.open : ""}`} aria-label="Main navigation">
      {publicNavigation.map(([label, href]) => <Link key={href} href={href} onClick={() => setOpen(false)} className={pathname === href ? styles.active : ""}>{label}</Link>)}
      <Link href="/sign-in" onClick={() => setOpen(false)} className={pathname === "/sign-in" ? styles.active : ""}>Sign In</Link>
      <Link href="/create" onClick={() => setOpen(false)} className={styles.start}>Start Creating</Link>
    </nav>
  </header>;
}

export function PublicFooter() {
  return <footer className={styles.footer}>
    <div><b>Slapstick Prompt Pack</b><p>Style-aware AI-video pre-production for creators.</p></div>
    <div><b>Explore</b>{publicNavigation.slice(0, 5).map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}</div>
    <div><b>Create</b><Link href="/create">Open the studio</Link><Link href="/character-builder">Build a character</Link><Link href="/pricing">Pricing</Link></div>
    <div><b>Video styles</b>{videoStyleIds.slice(0, 4).map((id) => <Link key={id} href={`/create?type=${id}`}>{videoStyles[id].name}</Link>)}</div>
  </footer>;
}
