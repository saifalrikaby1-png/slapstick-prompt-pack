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

export function VideoTypeCards({ hrefFor = (id) => `/create/${id}` }: { hrefFor?: (id: VideoStyleId) => string }) {
  return <div className={compact.styleGrid}>{videoStyleIds.map((id) => { const style = videoStyles[id]; const copy = videoTypeCardCopy[id]; return <Link key={id} href={hrefFor(id)} className={compact.styleCard} style={{ "--style-accent": style.accent } as CSSProperties} aria-label={`${style.name}: ${copy.description}`}><div className={compact.cardTopRow}><span className={compact.styleIcon} aria-hidden="true">{style.icon}</span><span className={compact.styleBadge}>{copy.badge}</span></div><h3>{style.name}</h3><p>{copy.description}</p><span className={compact.styleArrow} aria-hidden="true">→</span></Link>; })}</div>;
}
