export const videoStyleIds = [
  "slapstick", "cinematic", "family-3d", "anime", "live-action", "cgi-fantasy", "stylized-3d",
] as const;

export type VideoStyleId = (typeof videoStyleIds)[number];

export type VideoStylePromptRules = {
  visualLanguage: string;
  camera: string;
  lighting: string;
  pacing: string;
  motion: string;
  performance: string;
  audio: string;
  negative: string;
};

export type VideoStyleDefinition = {
  id: VideoStyleId;
  slug: VideoStyleId;
  name: string;
  description: string;
  action: string;
  accent: string;
  icon: string;
  characteristics: string[];
  defaults: { visualStyle: string; tones: string[]; duration: string; ratio: string };
  rules: VideoStylePromptRules;
  qualityChecks: string[];
  characterOptions: string[];
};

const define = (definition: VideoStyleDefinition) => definition;

export const videoStyles: Record<VideoStyleId, VideoStyleDefinition> = {
  slapstick: define({ id: "slapstick", slug: "slapstick", name: "Slapstick", action: "Create a Slapstick Video", accent: "#FF7A3D", icon: "✦", description: "Fast visual comedy with readable action, escalating harmless mistakes, and memorable payoffs.", characteristics: ["Immediate hook", "Physical cause and effect", "Reaction timing"], defaults: { visualStyle: "Stylized 3D cartoon", tones: ["Funny", "Fast", "Chaotic slapstick"], duration: "15", ratio: "9:16" }, rules: { visualLanguage: "clear visual comedy and object tracking", camera: "medium-wide framing that keeps the full gag readable", lighting: "bright, cheerful, high-visibility light", pacing: "immediate hook and compact escalation", motion: "grounded exaggerated motion with clean contact", performance: "large readable reactions and harmless failure", audio: "nonverbal cartoon Foley synchronized to impacts", negative: "no cruelty, no unreadable chaos, no random objects" }, qualityChecks: ["Immediate hook", "Physical cause and effect", "Readable reaction", "Harmless payoff"], characterOptions: ["Comedy reaction intensity", "Squash-and-stretch preference", "Harmless-failure behavior"] }),
  cinematic: define({ id: "cinematic", slug: "cinematic", name: "Cinematic", action: "Create a Cinematic Video", accent: "#D5A447", icon: "◐", description: "Film-style storytelling with deliberate composition, atmosphere, controlled movement, and emotional impact.", characteristics: ["Lens and framing", "Lighting direction", "Emotional beats"], defaults: { visualStyle: "Realistic cinematic", tones: ["Emotional", "Suspenseful"], duration: "30", ratio: "16:9" }, rules: { visualLanguage: "intentional film composition, depth, and color guidance", camera: "stable lens choice with one motivated camera move", lighting: "directional practical or motivated cinematic lighting", pacing: "controlled emotional beats and readable pauses", motion: "natural, economical, character-motivated movement", performance: "restrained performance and clear blocking", audio: "atmospheric score and precise environmental sound", negative: "no arbitrary camera moves, no lighting shifts without cause" }, qualityChecks: ["Lens consistency", "Lighting direction", "Shot composition", "Emotional pacing"], characterOptions: ["Screen presence", "Blocking", "Performance restraint"] }),
  "family-3d": define({ id: "family-3d", slug: "family-3d", name: "Family 3D Animation", action: "Create a 3D Animated Video", accent: "#68B7FF", icon: "◉", description: "Polished family-friendly 3D storytelling with expressive characters, appealing environments, and smooth cinematic animation.", characteristics: ["Appealing proportions", "Readable emotion", "Soft lighting"], defaults: { visualStyle: "Cinematic 3D family animation", tones: ["Playful", "Cute"], duration: "20", ratio: "16:9" }, rules: { visualLanguage: "polished materials, appealing silhouettes, and clean shape language", camera: "gentle cinematic framing that protects expressive poses", lighting: "soft global illumination and warm key light", pacing: "clear family-friendly story progression", motion: "smooth arcs, believable weight, and readable pose transitions", performance: "expressive face and clear emotion", audio: "warm orchestral or playful audio support", negative: "no harsh realism, no scary imagery, no distorted proportions" }, qualityChecks: ["Appealing proportions", "Readable expressions", "Smooth motion", "Family-friendly tone"], characterOptions: ["Expressive face", "Material style", "Color harmony"] }),
  anime: define({ id: "anime", slug: "anime", name: "Anime", action: "Create an Anime Video", accent: "#A57BFF", icon: "◈", description: "Dynamic stylized storytelling with dramatic poses, intentional framing, energetic action, and anime visual language.", characteristics: ["Pose clarity", "Stylized lighting", "Action readability"], defaults: { visualStyle: "Anime", tones: ["Energetic", "Magical"], duration: "15", ratio: "9:16" }, rules: { visualLanguage: "anime identity, controlled linework, and dramatic graphic composition", camera: "purposeful framing with controlled action camera language", lighting: "stylized contrast and motivated color effects", pacing: "energetic beats with intentional holds", motion: "dynamic but spatially legible pose-to-pose movement", performance: "dramatic expressions and action-pose identity", audio: "rhythmic music and disciplined effect accents", negative: "no uncontrolled effects, no pose ambiguity, no visual clutter" }, qualityChecks: ["Pose clarity", "Expression intensity", "Effect control", "Action readability"], characterOptions: ["Anime eye style", "Stylized hair", "Action pose identity"] }),
  "live-action": define({ id: "live-action", slug: "live-action", name: "Realistic Live Action", action: "Create a Live-Action Video", accent: "#5E7896", icon: "◫", description: "Photorealistic scenes with believable actors, natural motion, practical lighting, and professional camera direction.", characteristics: ["Human realism", "Wardrobe continuity", "Natural performance"], defaults: { visualStyle: "Realistic cinematic", tones: ["Suspenseful"], duration: "30", ratio: "16:9" }, rules: { visualLanguage: "photorealistic human and environmental detail", camera: "professional lens and motivated handheld or dolly behavior", lighting: "practical believable light sources", pacing: "natural scene rhythm and performance timing", motion: "anatomically plausible, grounded human motion", performance: "natural acting with consistent wardrobe and age", audio: "location sound, subtle score, and realistic Foley", negative: "no anatomy errors, no wardrobe swaps, no artificial-looking motion" }, qualityChecks: ["Anatomy realism", "Wardrobe continuity", "Natural acting", "Believable light"], characterOptions: ["Realistic age", "Body type", "Acting style"] }),
  "cgi-fantasy": define({ id: "cgi-fantasy", slug: "cgi-fantasy", name: "CGI Fantasy", action: "Create a CGI Fantasy Video", accent: "#32C6B1", icon: "◇", description: "Fantasy storytelling with creatures, magical worlds, controlled effects, and cinematic spectacle.", characteristics: ["Worldbuilding", "Magical logic", "Effects continuity"], defaults: { visualStyle: "High-quality 3D animation", tones: ["Magical", "Suspenseful"], duration: "30", ratio: "16:9" }, rules: { visualLanguage: "coherent fantasy worldbuilding, materials, and scale", camera: "sweeping but controlled cinematic staging", lighting: "atmospheric magical light with traceable sources", pacing: "awe, escalation, and clear resolution", motion: "creature weight, flight rules, and magic with visible causes", performance: "distinct creature identity and heroic scale", audio: "orchestral fantasy score with source-aware effects", negative: "no unexplained magic, no floating without rules, no scale drift" }, qualityChecks: ["Magical logic", "Creature continuity", "Environment scale", "Effect traceability"], characterOptions: ["Creature anatomy", "Magical markings", "Wings and fantasy materials"] }),
  "stylized-3d": define({ id: "stylized-3d", slug: "stylized-3d", name: "Stylized 3D Cartoon", action: "Create a Stylized 3D Video", accent: "#FF718D", icon: "◆", description: "Flexible stylized 3D animation for humorous, educational, commercial, colorful, or story-driven content.", characteristics: ["Shape consistency", "Clear palettes", "Commercial versatility"], defaults: { visualStyle: "Stylized 3D cartoon", tones: ["Playful"], duration: "15", ratio: "9:16" }, rules: { visualLanguage: "simplified materials, clear palettes, and readable graphic shapes", camera: "simple stable framing suited to character readability", lighting: "clean, colorful, controlled studio or world lighting", pacing: "direct visual storytelling with clean transitions", motion: "expressive controlled exaggeration and clear silhouettes", performance: "friendly character-forward expressions", audio: "bright, flexible music and visible-source Foley", negative: "no palette drift, no over-animation, no clutter" }, qualityChecks: ["Shape consistency", "Stylized proportions", "Palette continuity", "Controlled exaggeration"], characterOptions: ["Simplified shape language", "Expressive face", "Commercial versatility"] }),
};

export function getVideoStyle(id?: string): VideoStyleDefinition {
  return videoStyles[(id && videoStyleIds.includes(id as VideoStyleId) ? id : "slapstick") as VideoStyleId];
}
