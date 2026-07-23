import Link from "next/link";
import type { CSSProperties } from "react";
import compact from "./marketing-compact.module.css";
import { VideoStyleId, videoStyleIds, videoStyles } from "./video-styles";

export const videoTypeCardCopy: Record<VideoStyleId, { badge: string; description: string }> = {
  slapstick: { badge: "Comedy", description: "Fast visual comedy with clear action and harmless payoffs." },
  cinematic: { badge: "Film", description: "Film-style storytelling with deliberate framing and atmosphere." },
  "family-3d": { badge: "3D Animation", description: "Polished 3D storytelling with expressive characters and smooth motion." },
  anime: { badge: "Anime", description: "Dynamic anime storytelling with dramatic poses and energetic action." },
  "live-action": { badge: "Live Action", description: "Photorealistic scenes with natural acting and cinematic direction." },
  "cgi-fantasy": { badge: "Fantasy", description: "Epic fantasy scenes with magical worlds and controlled effects." },
  "stylized-3d": { badge: "Stylized 3D", description: "Stylized animation for humorous, educational, and commercial content." },
};

const signatureAccents: Record<VideoStyleId, { accent: string; tint: string; surface: string }> = {
  slapstick: { accent: "#FF7043", tint: "rgb(255 112 67 / 14%)", surface: "#11182d" },
  cinematic: { accent: "#D6A33D", tint: "rgb(214 163 61 / 14%)", surface: "#11182d" },
  "family-3d": { accent: "#F47C6B", tint: "rgb(244 124 107 / 13%)", surface: "#11182d" },
  anime: { accent: "#E84D8A", tint: "rgb(232 77 138 / 14%)", surface: "#11182d" },
  "live-action": { accent: "#B98A4A", tint: "rgb(185 138 74 / 14%)", surface: "#11182d" },
  "cgi-fantasy": { accent: "#7A63F6", tint: "rgb(122 99 246 / 15%)", surface: "#11182d" },
  "stylized-3d": { accent: "#A66BE8", tint: "rgb(166 107 232 / 14%)", surface: "#11182d" },
};

export function VideoTypeCards({ hrefFor = (id) => `/create/${id}`, appearance = "default" }: { hrefFor?: (id: VideoStyleId) => string; appearance?: "default" | "signature" }) {
  return <div className={compact.styleGrid}>{videoStyleIds.map((id) => { const style = videoStyles[id]; const copy = videoTypeCardCopy[id]; const signature = signatureAccents[id]; return <Link key={id} href={hrefFor(id)} className={`${compact.styleCard} ${appearance === "signature" ? compact.signatureCard : ""}`} style={{ "--style-accent": appearance === "signature" ? signature.accent : style.accent, "--style-tint": signature.tint, "--style-surface": signature.surface } as CSSProperties} aria-label={`${style.name}: ${copy.description}`}><div className={compact.cardTopRow}><span className={compact.styleIcon} aria-hidden="true">{style.icon}</span><span className={compact.styleBadge}>{copy.badge}</span></div><h3>{style.name}</h3><p>{copy.description}</p><span className={compact.styleArrow} aria-hidden="true">→</span></Link>; })}</div>;
}
