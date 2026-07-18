"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";

type FormState = {
  hero: string;
  enemies: string;
  object: string;
  trap: string;
  duration: string;
  ratio: string;
  platform: string;
  videoModel: string;
  style: string;
  tone: string;
  musicDirection: string;
  customMusic: string;
  dialogueMode: string;
  heroVocalStyle: string;
  enemyVocalStyle: string;
  narratorVocalStyle: string;
  vocalLockNotes: string;
  characterBible: string;
  qualityControlEnabled: boolean;
  qcPreventDuplication: boolean;
  qcPreserveIdentity: boolean;
  qcPreventObjectChanges: boolean;
  qcPreventSuddenCuts: boolean;
  qcEnforceRatio: boolean;
  qcEnforceDuration: boolean;
  qcStrongHook: boolean;
  qcStrongPayoff: boolean;
  qcVocalConsistency: boolean;
  qcFamilyFriendly: boolean;
  additionalQualityNotes: string;
  notes: string;
};

type PackItem = { title: string; value: string; eyebrow: string };
type GeneratorMode = "demo" | "ai";
type CharacterProfile = {
  id: string;
  builtIn?: boolean;
  shortName: string;
  fullIdentity: string;
  role: string;
  appearanceLock: string;
  personalityLock: string;
  colorLock: string;
  scaleLock: string;
  vocalStyleLock: string;
  movementStyle: string;
  continuityRules: string;
  negativeRules: string;
};
type CharacterSuggestionField = keyof Pick<CharacterProfile,
  "appearanceLock" | "personalityLock" | "colorLock" | "scaleLock" |
  "vocalStyleLock" | "movementStyle" | "continuityRules" | "negativeRules"
>;
type CharacterSuggestionMode = "replace" | "append";
type ProjectPreset = { id: string; name: string; form: FormState; builtIn?: boolean };
type SavedProductionPack = {
  id: string;
  episodeTitle: string;
  createdAt: string;
  platform: string;
  videoModel: string;
  ratio: string;
  duration: string;
  form: FormState;
  pack: PackItem[];
  qualityScore?: number;
};
type ProductionVariant = {
  id: "safeVersion" | "viralVersion" | "cinematicVersion";
  name: string;
  purpose: string;
  items: PackItem[];
};

const variantSectionMap = [
  { key: "episodeTitle", title: "Episode title", eyebrow: "Story" },
  { key: "startFrameImagePrompt", title: "Start-frame image prompt", eyebrow: "Image" },
  { key: "endFrameImagePrompt", title: "End-frame image prompt", eyebrow: "Image" },
  { key: "mainVideoPrompt", title: "Main video prompt", eyebrow: "Video" },
  { key: "selectedModelPrompt", title: "Selected Model Prompt", eyebrow: "AI Model" },
  { key: "videoTimelineBySeconds", title: "Video Timeline by Seconds", eyebrow: "Timeline" },
  { key: "musicPathBySeconds", title: "Music Path by Seconds", eyebrow: "Timeline" },
  { key: "soundEffectsTimelineBySeconds", title: "Sound Effects Timeline by Seconds", eyebrow: "Timeline" },
  { key: "captions", title: "Captions", eyebrow: "Social" },
  { key: "hashtags", title: "Hashtags", eyebrow: "Social" },
  { key: "pinnedComment", title: "Pinned comment", eyebrow: "Engagement" },
  { key: "retentionChecklist", title: "Retention checklist", eyebrow: "Performance" },
] as const;

const aiSectionMap: { key: string; title: string; eyebrow: string }[] = [
  { key: "episodeTitle", title: "Episode title", eyebrow: "Story" },
  { key: "startFrameImagePrompt", title: "Start-frame image prompt", eyebrow: "Image" },
  { key: "endFrameImagePrompt", title: "End-frame image prompt", eyebrow: "Image" },
  { key: "mainVideoPrompt", title: "Main video prompt", eyebrow: "Video" },
  { key: "selectedModelPrompt", title: "Selected Model Prompt", eyebrow: "AI Model" },
  { key: "alternativeModelPrompt", title: "Alternative Model Prompt", eyebrow: "Alternative" },
  { key: "videoTimelineBySeconds", title: "Video Timeline by Seconds", eyebrow: "Timeline" },
  { key: "soundEffectsPlan", title: "Sound effects plan", eyebrow: "Audio" },
  { key: "musicPlan", title: "Music Plan", eyebrow: "Music" },
  { key: "musicPathBySeconds", title: "Music Path by Seconds", eyebrow: "Timeline" },
  { key: "soundEffectsTimelineBySeconds", title: "Sound Effects Timeline by Seconds", eyebrow: "Timeline" },
  { key: "characterVocalLock", title: "Character Vocal Lock", eyebrow: "Voice" },
  { key: "characterBibleUsed", title: "Character Bible Used", eyebrow: "Brand Bible" },
  { key: "qualitySummary", title: "Quality summary", eyebrow: "Quality Control" },
  { key: "productionSafetyNotes", title: "Production safety notes", eyebrow: "Safety" },
  { key: "facebookCaption", title: "Facebook caption", eyebrow: "Facebook" },
  { key: "instagramCaption", title: "Instagram caption", eyebrow: "Instagram" },
  { key: "tiktokCaption", title: "TikTok caption", eyebrow: "TikTok" },
  { key: "youtubeTitle", title: "YouTube title", eyebrow: "YouTube" },
  { key: "youtubeDescription", title: "YouTube description", eyebrow: "YouTube" },
  { key: "youtubeHashtags", title: "YouTube hashtags", eyebrow: "YouTube" },
  { key: "pinnedComment", title: "Pinned comment", eyebrow: "Engagement" },
  { key: "retentionChecklist", title: "Retention checklist", eyebrow: "Performance" },
];

const emptyForm: FormState = {
  hero: "",
  enemies: "",
  object: "",
  trap: "",
  duration: "15 seconds",
  ratio: "9:16 vertical",
  platform: "Facebook Reels",
  videoModel: "OpenArt - Seedance",
  style: "colorful 3D cartoon animation",
  tone: "funny, fast, family-friendly",
  musicDirection: "Slapstick Comedy",
  customMusic: "",
  dialogueMode: "No dialogue",
  heroVocalStyle: "expressive family-friendly cartoon energy",
  enemyVocalStyle: "funny exaggerated cartoon mischief",
  narratorVocalStyle: "warm clear family-friendly storyteller",
  vocalLockNotes: "keep voices consistent throughout, no random voice changes",
  characterBible: "",
  qualityControlEnabled: true,
  qcPreventDuplication: true,
  qcPreserveIdentity: true,
  qcPreventObjectChanges: true,
  qcPreventSuddenCuts: true,
  qcEnforceRatio: true,
  qcEnforceDuration: true,
  qcStrongHook: true,
  qcStrongPayoff: true,
  qcVocalConsistency: true,
  qcFamilyFriendly: true,
  additionalQualityNotes: "",
  notes: "",
};

const biscuitDemo: FormState = {
  hero: "Biscuit the Orange Squirrel",
  enemies: "Grumpy the Purple Hedgehog and Sneaky the Green Chameleon",
  object: "glowing cookie",
  trap: "rolling log backfire",
  duration: "15 seconds",
  ratio: "9:16 vertical",
  platform: "Facebook Reels",
  videoModel: "OpenArt - Seedance",
  style: "colorful 3D cartoon slapstick animation",
  tone: "funny, fast, family-friendly",
  musicDirection: "Slapstick Comedy",
  customMusic: "",
  dialogueMode: "No dialogue",
  heroVocalStyle: "expressive family-friendly cartoon energy",
  enemyVocalStyle: "funny exaggerated cartoon mischief",
  narratorVocalStyle: "warm clear family-friendly storyteller",
  vocalLockNotes: "keep voices consistent throughout, no random voice changes",
  characterBible: "",
  qualityControlEnabled: true,
  qcPreventDuplication: true,
  qcPreserveIdentity: true,
  qcPreventObjectChanges: true,
  qcPreventSuddenCuts: true,
  qcEnforceRatio: true,
  qcEnforceDuration: true,
  qcStrongHook: true,
  qcStrongPayoff: true,
  qcVocalConsistency: true,
  qcFamilyFriendly: true,
  additionalQualityNotes: "",
  notes: "",
};

const emptyCharacter: CharacterProfile = {
  id: "",
  shortName: "",
  fullIdentity: "",
  role: "Hero",
  appearanceLock: "",
  personalityLock: "",
  colorLock: "",
  scaleLock: "",
  vocalStyleLock: "",
  movementStyle: "",
  continuityRules: "",
  negativeRules: "Do not duplicate this character. Do not change species. Do not change color. Do not morph face. Do not add extra copies.",
};

const builtInCharacters: CharacterProfile[] = [
  {
    id: "builtin-biscuit",
    builtIn: true,
    shortName: "Biscuit",
    fullIdentity: "Biscuit the Orange Squirrel",
    role: "Hero",
    appearanceLock: "Small, agile orange cartoon squirrel with a clean teardrop silhouette, large warm brown eyes, rounded cream muzzle and belly, compact paws, and one oversized expressive orange tail with a cream tip. Keep the face friendly and readable, proportions softly stylized, fur polished and plush, and the silhouette instantly recognizable in colorful 3D cartoon animation.",
    personalityLock: "Clever, upbeat, curious, and quietly heroic. Biscuit solves danger through quick observation and playful improvisation, protects the prize without cruelty, reacts with expressive family-friendly confidence, and always remains the clear hero who wins the final slapstick payoff.",
    colorLock: "Primary fur is vivid warm orange; muzzle, belly, and tail tip are soft cream; eyes are warm brown; nose is dark cocoa. Preserve the same hues, saturation, material response, and markings in every frame with no color drift or palette swaps.",
    scaleLock: "Keep Biscuit small and nimble, slightly shorter than Grumpy and clearly smaller than Sneaky when Sneaky is fully extended. Preserve head-to-body ratio, tail volume, paw size, and relative character scale across wide shots, close shots, start frames, and end frames.",
    vocalStyleLock: "No spoken dialogue by default. Use only bright, non-verbal family-friendly squirrel reactions such as tiny gasps, delighted squeaks, playful chuckles, and effort sounds when needed; keep pitch, energy, and vocal identity consistent.",
    movementStyle: "Quick spring-loaded hops, agile tail-balanced jumps, light scampering steps, precise midair turns, and readable anticipation poses. Every move begins from a visible planted position and resolves cleanly; the tail supports balance and emotion without changing size or shape.",
    continuityRules: "Preserve Biscuit’s exact species, orange-and-cream markings, facial design, body proportions, tail shape, scale, hero role, and movement language across start frame, continuous video action, end frame, and future episodes. Biscuit remains the hero, clearly avoids the trap, and visibly wins the final payoff.",
    negativeRules: "Do not duplicate Biscuit. Do not add accidental extra squirrels. Do not change species, orange-and-cream colors, scale, face, tail, proportions, or hero role. Do not add random outfits. No morphing face, extra limbs, distorted anatomy, merged body, missing tail, sudden age change, or role reversal.",
  },
  {
    id: "builtin-grumpy",
    builtIn: true,
    shortName: "Grumpy",
    fullIdentity: "Grumpy the Purple Hedgehog",
    role: "Enemy",
    appearanceLock: "Stocky purple cartoon hedgehog with a low sturdy silhouette, rounded lavender muzzle, thick expressive brows, small dark eyes, short legs, compact paws, and a tidy crown of blunt plum-purple quills. Keep the design plush, readable, family-friendly, and visually distinct from Biscuit and Sneaky.",
    personalityLock: "Stubborn, theatrical, impatient, and mischievously competitive rather than dangerous. Grumpy overcommits to elaborate traps, reacts with exaggerated disbelief when plans fail, remains an enemy in the story, and receives the harmless slapstick backfire without becoming the hero.",
    colorLock: "Quills and body remain rich plum purple; muzzle and belly remain soft lavender; brows and nose remain deep aubergine. Keep exact markings and material finish stable with no purple-to-blue drift or random accent colors.",
    scaleLock: "Keep Grumpy compact and stocky, wider and slightly taller than Biscuit but much shorter than Sneaky at full extension. Preserve quill volume, limb length, head size, and relative scale in every composition.",
    vocalStyleLock: "No spoken dialogue by default. Use only low, funny non-verbal grumbles, effort huffs, surprised squeaks, and harmless tumble sounds when needed; keep the same exaggerated cartoon vocal identity throughout.",
    movementStyle: "Stompy waddles, stubborn forward charges, short heavy hops, braced pushes, and controlled rolling tumbles with clear anticipation and recovery. Motion should feel weighty but soft, readable, and family-friendly.",
    continuityRules: "Preserve Grumpy’s purple hedgehog identity, stocky proportions, quill pattern, colors, scale, enemy role, and weighty movement in all prompts and frames. Grumpy remains part of the enemy team and visibly receives the trap backfire at the ending.",
    negativeRules: "Do not duplicate Grumpy. Do not add extra hedgehogs. Do not change species, purple palette, quills, scale, anatomy, enemy role, or relationship to Biscuit. Do not make Grumpy the hero or Biscuit’s friend. No random outfits, morphing face, extra limbs, distorted anatomy, merged bodies, or role changes.",
  },
  {
    id: "builtin-sneaky",
    builtIn: true,
    shortName: "Sneaky",
    fullIdentity: "Sneaky the Green Chameleon",
    role: "Enemy",
    appearanceLock: "Lean green cartoon chameleon with a long curved silhouette, lime-green skin, pale mint belly, large independently expressive amber eyes, curled tail, mitten-like feet, subtle soft scales, and a quick elastic tongue. Keep the design polished, charmingly suspicious, and clearly distinct from Biscuit and Grumpy.",
    personalityLock: "Patient, crafty, observant, and comically overconfident. Sneaky prefers stealthy trap setup and smug pauses, remains a family-friendly enemy, coordinates with Grumpy, and clearly receives the harmless backfire instead of switching sides or becoming the hero.",
    colorLock: "Body remains bright leaf green with a pale mint belly, darker forest-green accents, amber eyes, and a soft pink tongue. Do not use camouflage to change the locked base palette unless a visible, intentional story beat requests it; always return to the exact colors.",
    scaleLock: "Keep Sneaky lean and the tallest character when fully extended, with a consistent curled-tail diameter, limb length, eye size, and body thickness. Preserve the same scale relationship to Biscuit and Grumpy across every shot and frame.",
    vocalStyleLock: "No spoken dialogue by default. Use only sly non-verbal chuckles, tiny tongue snaps, startled chirps, and elastic reaction sounds when needed; preserve the same light, mischievous vocal identity.",
    movementStyle: "Sneaky slow crawls, careful tiptoe steps, deliberate camouflage pauses, precise tongue snaps, curled-tail balancing, and elastic but controlled recoil. Keep contact points visible and motion smooth, logical, and anatomically readable.",
    continuityRules: "Preserve Sneaky’s exact green chameleon identity, amber eyes, curled tail, proportions, scale, enemy role, and stealthy movement across start frame, video action, end frame, and future episodes. Sneaky stays allied with Grumpy and receives the final harmless trap backfire.",
    negativeRules: "Do not duplicate Sneaky. Do not add extra chameleons. Do not change species, locked green palette, eye design, curled tail, scale, anatomy, enemy role, or alliance with Grumpy. Do not make Sneaky the hero or Biscuit’s friend. No random outfits, morphing face, extra limbs, distorted anatomy, merged bodies, or uncontrolled color changes.",
  },
];

const builtInCharacterBible = builtInCharacters.map((profile) => [
  `${profile.fullIdentity} — role: ${profile.role}`,
  `Appearance lock: ${profile.appearanceLock}`,
  `Personality lock: ${profile.personalityLock}`,
  `Color lock: ${profile.colorLock}`,
  `Scale lock: ${profile.scaleLock}`,
  `Vocal lock: ${profile.vocalStyleLock}`,
  `Movement style: ${profile.movementStyle}`,
  `Continuity rules: ${profile.continuityRules}`,
  `Negative rules: ${profile.negativeRules}`,
].join("\n")).join("\n\n");

const builtInPreset: ProjectPreset = {
  id: "builtin-biscuit-trouble-crew",
  name: "Biscuit & the Trouble Crew",
  builtIn: true,
  form: {
    ...biscuitDemo,
    tone: "funny, fast, cute, family-friendly",
    characterBible: builtInCharacterBible,
  },
};

const fields: {
  key: keyof FormState;
  label: string;
  placeholder?: string;
  options?: string[];
}[] = [
  { key: "hero", label: "Hero character", placeholder: "e.g. Biscuit the Orange Squirrel" },
  { key: "enemies", label: "Enemy character or enemies", placeholder: "Who causes the chaos?" },
  { key: "object", label: "Object or food", placeholder: "e.g. a glowing cookie" },
  { key: "trap", label: "Trap type", placeholder: "e.g. rolling log backfire" },
  {
    key: "duration",
    label: "Video duration",
    options: ["10 seconds", "15 seconds", "20 seconds", "30 seconds", "45 seconds", "60 seconds"],
  },
  {
    key: "ratio",
    label: "Video ratio",
    options: ["9:16 vertical", "16:9 horizontal", "1:1 square", "4:5 portrait"],
  },
  {
    key: "platform",
    label: "Target Platform",
    options: [
      "Facebook Reels",
      "Instagram Reels",
      "TikTok",
      "YouTube Shorts",
      "YouTube 16:9 Video",
      "Facebook 16:9 Video",
      "Generic Social Video",
    ],
  },
  {
    key: "videoModel",
    label: "AI Video Model",
    options: [
      "OpenArt - Seedance",
      "OpenArt - Kling",
      "OpenArt - Veo",
      "Higgsfield",
      "Runway",
      "Google Flow / Veo",
      "PixVerse",
      "Generic AI Video Model",
    ],
  },
  {
    key: "style",
    label: "Visual style",
    options: [
      "colorful 3D cartoon slapstick animation",
      "colorful 3D cartoon animation",
      "hand-drawn 2D animation",
      "claymation comedy",
      "cinematic comic-book style",
      "retro Saturday-morning cartoon",
    ],
  },
  {
    key: "tone",
    label: "Tone",
    options: [
      "funny, fast, family-friendly",
      "chaotic and over-the-top",
      "cute and mischievous",
      "dry, clever comedy",
      "wholesome with a surprise",
    ],
  },
  {
    key: "musicDirection",
    label: "Music Direction",
    options: [
      "Playful",
      "Slapstick Comedy",
      "Calm",
      "Cinematic Adventure",
      "Emotional",
      "Exciting",
      "Suspenseful",
      "No Music",
      "Custom",
    ],
  },
];

function makePack(form: FormState): PackItem[] {
  const hero = form.hero.trim() || "A quick-witted cartoon hero";
  const enemies = form.enemies.trim() || "a pair of bumbling rivals";
  const object = form.object.trim() || "a mysterious snack";
  const trap = form.trap.trim() || "an elaborate trap that backfires";
  const notes = form.notes.trim() ? ` Extra direction: ${form.notes.trim()}` : "";
  const base = `${form.style}; vertical 9:16 composition; ${form.tone}; crisp character silhouettes, expressive faces, readable action, vibrant lighting, no text, no logos`;
  const titleObject = object.replace(/^(a|an|the)\s+/i, "");
  return [
    {
      eyebrow: "Story",
      title: "Episode title",
      value: `${hero} & The ${titleObject.replace(/\b\w/g, (m) => m.toUpperCase())} Backfire`,
    },
    {
      eyebrow: "Image",
      title: "Start-frame image prompt",
      value: `${hero} spots ${object} sitting temptingly in the foreground while ${enemies} hide nearby, visibly holding back laughter. The setup for ${trap} is subtly visible. ${base}. Establishing frame with instant curiosity and a strong visual hook.${notes}`,
    },
    {
      eyebrow: "Image",
      title: "End-frame image prompt",
      value: `${hero} stands triumphantly holding ${object}, giving the camera a cheeky grin, while ${enemies} are tangled in the spectacular aftermath of their own ${trap}. ${base}. Freeze on the funniest expression, clean payoff, satisfying visual symmetry.${notes}`,
    },
    {
      eyebrow: "Video",
      title: "Main video prompt",
      value: `Create a ${form.duration} vertical short. Open immediately on ${hero} noticing ${object}. ${enemies} activate ${trap}, expecting an easy win. ${hero} reacts at the last possible moment with a clever physical-comedy dodge. The trap reverses direction and catches ${enemies} instead. End with ${hero} calmly claiming ${object} and looking into camera as the defeated rivals wobble in the background. Use three clear beats: hook, escalating chaos, satisfying backfire. ${base}. Fast cuts, squash-and-stretch motion, strong anticipation, one-frame reaction holds, no dialogue.${notes}`,
    },
    {
      eyebrow: "OpenArt",
      title: "OpenArt-optimized prompt",
      value: `Masterpiece ${form.style}, vertical 9:16 animated short featuring consistent character design for ${hero} and ${enemies}. Plot: ${object} bait, ${trap}, clever dodge, trap backfires on villains, hero wins. Dynamic wide-angle camera, vibrant color separation, clean materials, cinematic rim light, exaggerated facial animation, high-detail environment, fluid slapstick motion, stable anatomy, consistent costumes and colors. ${form.tone}. Negative: text, subtitles, watermark, duplicate characters, extra limbs, morphing faces, flicker, muddy colors, cropped heads.${notes}`,
    },
    {
      eyebrow: "Higgsfield",
      title: "Higgsfield-optimized prompt",
      value: `${form.duration}, 9:16. CAMERA: fast push-in on ${object}, whip-pan to ${enemies}, low tracking shot following the ${trap}, snap zoom on ${hero}'s reaction, then locked hero shot for the payoff. ACTION: ${hero} notices bait → enemies trigger trap → micro-pause → agile dodge → trap reverses and hits enemies → hero claims prize. MOTION: punchy acceleration, elastic impacts, controlled camera shake only on collision, clean subject tracking. LOOK: ${base}. Preserve character identity and scene continuity.${notes}`,
    },
    {
      eyebrow: "Audio",
      title: "Sound effects plan",
      value: `0:00–0:02 — bright “ting!” reveal for ${object}, tiny curious footsteps\n0:02–0:05 — sneaky pizzicato, quiet villain snickers, trap creak\n0:05–0:08 — accelerating wooden rattle and rising slide whistle\n0:08–0:11 — record scratch, quick whoosh, comedic reversal boing\n0:11–0:13 — layered crash, soft tumble, rubber squeaks (never harsh)\n0:13–end — victory chime, tiny bite/crunch, defeated wobble whistle\nMix note: keep the first sound in frame one; sync every impact tightly to motion.`,
    },
    {
      eyebrow: "Facebook",
      title: "Facebook caption",
      value: `They built the perfect trap… but forgot who they were dealing with. 🐿️🍪 Wait for the backfire, then follow for more cartoon chaos!`,
    },
    {
      eyebrow: "Instagram",
      title: "Instagram caption",
      value: `${hero} saw the trap. ${hero} wanted the ${titleObject}. The rest is cartoon history. 🍪💥\n\nSave this for the payoff, tag the friend whose plans always backfire, and follow for more cartoon adventures.\n\n#SlapstickComedy #CartoonShorts #AnimationReels #FunnyAnimation #FamilyFriendly`,
    },
    {
      eyebrow: "TikTok",
      title: "TikTok caption",
      value: `POV: your “foolproof” trap meets ${hero} 💀🍪 Wait for it… then follow for the next backfire! #CartoonTok #Slapstick #Animation #FunnyVideos`,
    },
    {
      eyebrow: "YouTube",
      title: "YouTube title",
      value: `The ${titleObject} Trap Backfired! 🍪💥 | ${hero} Cartoon Short`,
    },
    {
      eyebrow: "YouTube",
      title: "YouTube description",
      value: `${enemies} set a sneaky ${trap} to keep ${hero} away from ${object}. There’s just one problem: cartoon traps never follow the plan.\n\nWatch to the end for the full backfire, then subscribe for more fast, family-friendly animated chaos!`,
    },
    {
      eyebrow: "YouTube",
      title: "YouTube hashtags",
      value: `#Shorts #CartoonShorts #SlapstickComedy #FunnyAnimation #Animation #FamilyFriendly #ComedyShorts`,
    },
    {
      eyebrow: "Engagement",
      title: "Pinned comment",
      value: `Be honest: would you risk the trap for ${object}? 🍪👇`,
    },
    {
      eyebrow: "Performance",
      title: "Retention checklist",
      value: `✓ Show ${object} and the threat in the first 1 second\n✓ Make the story readable with sound off\n✓ Change shot size or camera angle every 2–3 seconds\n✓ Hold the hero’s “uh-oh” reaction for 3–5 frames\n✓ Add one escalation before the main backfire\n✓ Reserve the biggest sound and motion for the payoff\n✓ End on a clean, expressive freeze frame\n✓ Keep the final frame loop-friendly with the opening\n✓ No intro card, dialogue setup, or dead air\n✓ Place captions away from platform UI zones`,
    },
  ];
}

function shortName(fullName: string) {
  return fullName
    .trim()
    .replace(/^(a|an|the)\s+/i, "")
    .split(/\s+/)[0]
    .replace(/[^\p{L}\p{N}'-]/gu, "");
}

function safeText(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function ratioDirection(ratio: string) {
  switch (ratio) {
    case "16:9 horizontal":
      return "SELECTED RATIO: horizontal 16:9 cinematic composition; use a wider left-to-right composition with clear spatial staging and readable action across the frame";
    case "1:1 square":
      return "SELECTED RATIO: square 1:1 composition; keep the important action, hero, enemies, and story focal point centered";
    case "4:5 portrait":
      return "SELECTED RATIO: portrait 4:5 composition; keep characters centered with safe framing near the top and bottom";
    default:
      return "SELECTED RATIO: vertical 9:16 composition; keep characters and action centered for Reels, Shorts, and TikTok with safe top and bottom framing";
  }
}

function platformDirection(platform: string) {
  const directions: Record<string, string> = {
    "Facebook Reels": "fast hook, clear slapstick, replayable ending, and a comment/follow call-to-action",
    "Instagram Reels": "clean visual style, expressive characters, and a bright shareable payoff",
    TikTok: "instant chaos, fast comedy, and an exceptionally strong first second",
    "YouTube Shorts": "clear story, strong title potential, high retention, and a loopable ending",
    "YouTube 16:9 Video": "wider cinematic staging with slightly more story structure",
    "Facebook 16:9 Video": "wider framing with clear family-friendly comedy",
    "Generic Social Video": "universal, platform-neutral pacing and composition",
  };
  return directions[platform] || directions["Generic Social Video"];
}

function modelDirection(model: string) {
  const directions: Record<string, string> = {
    "OpenArt - Seedance": "direct, clear, motion-focused, image-to-video-friendly instructions",
    "OpenArt - Kling": "strong physical motion, purposeful camera movement, and clear action continuity",
    "OpenArt - Veo": "cinematic, natural, descriptive staging with coherent motion",
    Higgsfield: "cinematic camera motion, explicit action beats, subject consistency, and precise slapstick timing",
    Runway: "concise, cinematic, shot-focused direction",
    "Google Flow / Veo": "descriptive, cinematic, family-friendly direction with clear scene continuity",
    PixVerse: "simple, direct, visually clear instructions",
    "Generic AI Video Model": "universal, platform-neutral instructions",
  };
  return directions[model] || directions["Generic AI Video Model"];
}

function alternativeModel(model: string) {
  const alternatives: Record<string, string> = {
    "OpenArt - Seedance": "Higgsfield",
    "OpenArt - Kling": "Google Flow / Veo",
    "OpenArt - Veo": "OpenArt - Kling",
    Higgsfield: "OpenArt - Kling",
    Runway: "Google Flow / Veo",
    "Google Flow / Veo": "Higgsfield",
    PixVerse: "OpenArt - Seedance",
    "Generic AI Video Model": "OpenArt - Seedance",
  };
  return alternatives[model] || "Generic AI Video Model";
}

function durationInSeconds(duration: string) {
  const normalized = safeText(duration, "15 seconds") || "15 seconds";
  if (/\b1\s*minute\b/i.test(normalized)) return 60;
  const match = normalized.match(/\d+/);
  const seconds = match ? Number(match[0]) : 15;
  return Number.isFinite(seconds) && seconds > 0 ? seconds : 15;
}

function timecode(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

function timelineRanges(duration: string) {
  const total = durationInSeconds(duration);
  if (total >= 45) {
    const hookEnd = Math.max(5, Math.round(total * 0.17));
    const buildEnd = Math.round(total * 0.7);
    return [
      { label: `${timecode(0)}–${timecode(hookEnd)}`, beat: "Hook" },
      { label: `${timecode(hookEnd)}–${timecode(buildEnd)}`, beat: "Build-up" },
      { label: `${timecode(buildEnd)}–${timecode(total)}`, beat: "Payoff" },
    ];
  }
  const points = total <= 15
    ? [0, Math.max(1, Math.round(total * 0.13)), Math.round(total * 0.33), Math.round(total * 0.6), Math.round(total * 0.87), total]
    : [0, Math.round(total * 0.16), Math.round(total * 0.36), Math.round(total * 0.62), Math.round(total * 0.84), total];
  const beats = ["Hook", "Trap setup", "Chase or mistake", "Backfire moment", "Loopable ending"];
  return beats.map((beat, index) => ({
    label: `${timecode(points[index])}–${timecode(points[index + 1])}`,
    beat,
  }));
}

function profilesUsedByForm(form: FormState, characters: CharacterProfile[]) {
  const hero = safeText(form.hero).toLowerCase();
  const enemies = safeText(form.enemies).toLowerCase();
  return characters.filter((profile) => {
    const short = profile.shortName.trim().toLowerCase();
    const full = profile.fullIdentity.trim().toLowerCase();
    return Boolean(
      short && (hero.includes(short) || enemies.includes(short)) ||
      full && (hero.includes(full) || enemies.includes(full)),
    );
  });
}

function characterBibleText(form: FormState, characters: CharacterProfile[]) {
  const used = profilesUsedByForm(form, characters);
  const existingBible = safeText(form.characterBible);
  const profilesNotAlreadyIncluded = used.filter((profile) => {
    const identity = (profile.fullIdentity || profile.shortName).trim();
    return identity && !existingBible.includes(`${identity} — role:`);
  });
  const savedProfiles = profilesNotAlreadyIncluded.map((profile) => [
    `${profile.fullIdentity || profile.shortName} — role: ${profile.role}`,
    `Appearance lock: ${profile.appearanceLock || "Not supplied"}`,
    `Personality lock: ${profile.personalityLock || "Not supplied"}`,
    `Color lock: ${profile.colorLock || "Not supplied"}`,
    `Scale lock: ${profile.scaleLock || "Not supplied"}`,
    `Vocal lock: ${profile.vocalStyleLock || "Not supplied"}`,
    `Movement style: ${profile.movementStyle || "Not supplied"}`,
    `Continuity rules: ${profile.continuityRules || "Use global continuity rules"}`,
    `Negative rules: ${profile.negativeRules || "No duplication, morphing, or identity changes"}`,
  ].join("\n")).join("\n\n");
  return [existingBible, savedProfiles].filter(Boolean).join("\n\n").trim();
}

const characterSuggestionFields: { key: CharacterSuggestionField; label: string }[] = [
  { key: "appearanceLock", label: "Appearance lock" },
  { key: "personalityLock", label: "Personality lock" },
  { key: "colorLock", label: "Color lock" },
  { key: "scaleLock", label: "Scale / size lock" },
  { key: "vocalStyleLock", label: "Vocal style lock" },
  { key: "movementStyle", label: "Movement style" },
  { key: "continuityRules", label: "Continuity rules" },
  { key: "negativeRules", label: "Negative rules" },
];

function characterSpecies(identity: string) {
  const known = ["squirrel", "hedgehog", "chameleon", "rabbit", "fox", "cat", "dog", "mouse", "bear", "bird"];
  return known.find((species) => identity.toLowerCase().includes(species)) || "cartoon character";
}

function localCharacterSuggestions(profile: CharacterProfile, form: FormState): Record<CharacterSuggestionField, string> {
  const name = profile.shortName.trim() || "This character";
  const identity = profile.fullIdentity.trim() || `${name}, a distinctive family-friendly cartoon character`;
  const role = profile.role || "Supporting character";
  const species = characterSpecies(identity);
  const isHero = role === "Hero";
  const isEnemy = role === "Enemy";
  const roleBehavior = isHero
    ? "clever, charming, brave, and clearly heroic; solves problems through readable action and earns the final positive payoff"
    : isEnemy
      ? "mischievous, visually expressive, and comically overconfident rather than frightening; remains an enemy and receives a harmless backfire when the story calls for it"
      : `consistent with the ${role.toLowerCase()} role, emotionally readable, cooperative with the established story, and family-friendly`;
  const movement = species === "squirrel"
    ? "quick hops, agile tail-balanced jumps, light scampering, and precise spring-loaded landings"
    : species === "hedgehog"
      ? "stompy waddles, stubborn charges, short heavy hops, and controlled rolling tumbles"
      : species === "chameleon"
        ? "sneaky slow crawls, careful tiptoe steps, curled-tail balancing, tongue snaps, and deliberate camouflage pauses"
        : "distinctive character-led poses, smooth readable locomotion, clear anticipation, controlled follow-through, and stable anatomical contact";
  const dialogue = form.dialogueMode === "No dialogue"
    ? "No spoken dialogue. Use only non-verbal expressive cartoon reactions such as gasps, squeaks, chuckles, or playful sounds if needed."
    : `Dialogue is permitted by “${form.dialogueMode}.” Keep one stable, clearly recognizable ${role.toLowerCase()} voice with consistent pitch character, energy, accent, delivery rhythm, and recording quality; never swap voices between characters.`;

  return {
    appearanceLock: `${identity}: create a memorable, clean silhouette appropriate to ${form.style}. Preserve the exact species/type (${species}), head and body shapes, facial structure, eye design, body proportions, signature features, surface texture, and any established accessories in every frame. Keep the face readable, anatomy polished, and the design visually distinct from every other character on ${form.platform}.`,
    personalityLock: `${name} is ${roleBehavior}. Maintain the same motivation, emotional range, relationships, decision-making style, reaction timing, and role in every scene. Reactions should remain expressive and suitable for the ${form.tone} tone without sudden personality or allegiance changes.`,
    colorLock: `Lock ${name} to the colors and markings established by “${identity}.” Preserve identical primary, secondary, accent, eye, facial-feature, and accessory colors under every lighting condition. Maintain hue, saturation, value relationships, material response, and marking placement; no color drift, palette swaps, random camouflage, or unexplained recoloring.`,
    scaleLock: `Keep ${name} at one stable relative size against the other cast members, props, and environment. Preserve head-to-body ratio, limb length, silhouette width, signature-feature volume, and camera-relative proportions from start frame through end frame. Perspective may change naturally, but the character must never grow, shrink, stretch, or change age between shots.`,
    vocalStyleLock: `${dialogue} Base vocal direction: ${profile.vocalStyleLock.trim() || (isHero ? form.heroVocalStyle : isEnemy ? form.enemyVocalStyle : form.narratorVocalStyle)} Keep vocal identity consistent throughout, with no random voice, pitch, accent, age, or speaker-role changes.`,
    movementStyle: `${name} moves with ${movement}. Use visible anticipation, smooth acceleration, logical weight transfer, readable arcs, controlled impacts, and clean recovery poses. Preserve this movement signature throughout; avoid sliding feet, teleporting, broken joints, erratic speed changes, or motion that contradicts the ${species} anatomy.`,
    continuityRules: `Use the exact same ${identity} design across the start-frame prompt, continuous video action, end-frame prompt, and future episodes. Lock species, face, colors, markings, scale, proportions, wardrobe, accessories, movement language, vocal identity, and ${role} role. Keep screen direction and prop interaction traceable, and show every intentional appearance change on screen rather than changing it suddenly.`,
    negativeRules: `Do not duplicate ${name}. Do not add accidental extra copies or background versions of this character. Do not change species, color palette, markings, scale, proportions, face, wardrobe, accessories, movement style, vocal identity, or ${role} role. Do not add random outfit changes. No morphing face, distorted anatomy, extra limbs, missing limbs, merged bodies, broken joints, sudden age changes, unexplained transformations, or role reversals.`,
  };
}

const qualityControlOptions: { key: keyof FormState; label: string; summary: string }[] = [
  { key: "qcPreventDuplication", label: "Prevent character duplication", summary: "Character duplication prevention" },
  { key: "qcPreserveIdentity", label: "Preserve character identity", summary: "Character identity consistency" },
  { key: "qcPreventObjectChanges", label: "Prevent sudden object appearance/disappearance", summary: "Object continuity" },
  { key: "qcPreventSuddenCuts", label: "Prevent sudden cuts", summary: "Continuous camera flow" },
  { key: "qcEnforceRatio", label: "Enforce ratio consistency", summary: "Ratio consistency" },
  { key: "qcEnforceDuration", label: "Enforce duration consistency", summary: "Duration and timeline consistency" },
  { key: "qcStrongHook", label: "Strong opening hook", summary: "First-second hook" },
  { key: "qcStrongPayoff", label: "Strong ending payoff", summary: "Ending payoff" },
  { key: "qcVocalConsistency", label: "Maintain dialogue/vocal consistency", summary: "Dialogue and vocal consistency" },
  { key: "qcFamilyFriendly", label: "Enforce family-friendly output", summary: "Family-friendly production safety" },
];

function enabledQualityRules(form: FormState) {
  if (form.qualityControlEnabled === false) return [];
  return qualityControlOptions.filter((option) => form[option.key] !== false);
}

function qualityControlPrompt(form: FormState) {
  if (form.qualityControlEnabled === false) return "Prompt Quality Control is disabled; retain only the global baseline safety and continuity rules.";
  const ruleMap: Record<string, string> = {
    qcPreventDuplication: "no duplicate characters, no extra limbs, no accidental extra background characters",
    qcPreserveIdentity: "preserve character identity, species, colors, scale, wardrobe, anatomy, and role throughout",
    qcPreventObjectChanges: "no sudden objects appearing or disappearing; show every prop arrival, movement, and removal",
    qcPreventSuddenCuts: "single readable action flow with no sudden cuts or random camera jumps unless explicitly requested",
    qcEnforceRatio: `preserve the selected ${safeText(form.ratio, "video")} ratio across start frame, end frame, and all video prompts`,
    qcEnforceDuration: `preserve the selected ${safeText(form.duration, "duration")} across the video, music, sound, and timing sections`,
    qcStrongHook: "make visible, readable action begin in the first second with a clear focal point",
    qcStrongPayoff: "end with an unambiguous visual payoff, resolved character positions, and loop-friendly final frame",
    qcVocalConsistency: `follow dialogue mode “${safeText(form.dialogueMode, "No dialogue")}” exactly and keep every permitted voice identity stable`,
    qcFamilyFriendly: "keep every action, impact, caption, sound, and visual result clean, family-friendly, and production-ready",
  };
  const active = enabledQualityRules(form).map((option) => ruleMap[String(option.key)]);
  const additional = safeText(form.additionalQualityNotes);
  return `PROMPT QUALITY CONTROL — ACTIVE\n${active.map((rule) => `- ${rule}`).join("\n")}${additional ? `\n- Additional quality notes: ${additional}` : ""}\n- Keep instructions clear, non-contradictory, readable, and free of unnecessary overload.`;
}

type QualityReport = {
  score: number;
  label: string;
  passed: string[];
  warnings: string[];
  suggestions: string[];
};

function inspectPack(pack: PackItem[], form: FormState): QualityReport {
  const get = (title: string) => pack.find((item) => item.title === title)?.value || "";
  const start = get("Start-frame image prompt");
  const end = get("End-frame image prompt");
  const main = get("Main video prompt");
  const selected = get("Selected Model Prompt");
  const videoTimeline = get("Video Timeline by Seconds");
  const musicTimeline = get("Music Path by Seconds");
  const sfxTimeline = get("Sound Effects Timeline by Seconds");
  const vocal = get("Character Vocal Lock");
  const all = pack.map((item) => item.value).join("\n").toLowerCase();
  const visualPrompts = `${start}\n${end}\n${main}\n${selected}`.toLowerCase();
  const endTime = timecode(durationInSeconds(form.duration));
  const heroShort = shortName(form.hero).toLowerCase();
  const enemyNames = form.enemies.split(/\s+(?:and|&)\s+|,\s*/i).map(shortName).filter(Boolean);
  const captions = ["Facebook caption", "Instagram caption", "TikTok caption"].map(get);
  const notesRequestBranding = /\btext\b|\blogo\b|\bwatermark\b/i.test(form.notes);
  const checks: { label: string; pass: boolean; fix: string }[] = [
    { label: "Selected ratio appears in all four primary visual/video prompts", pass: [start, end, main, selected].every((value) => value.toLowerCase().includes(form.ratio.toLowerCase())), fix: `Add “${form.ratio}” clearly to every primary prompt.` },
    { label: "Selected platform appears in the Main Video Prompt", pass: main.toLowerCase().includes(form.platform.toLowerCase()), fix: `Name ${form.platform} in the Main Video Prompt.` },
    { label: "Selected AI video model appears in the Main Video Prompt", pass: main.toLowerCase().includes(form.videoModel.toLowerCase()), fix: `Name ${form.videoModel} in the Main Video Prompt.` },
    { label: "Selected duration is respected", pass: main.toLowerCase().includes(form.duration.toLowerCase()), fix: `State and pace the prompt for exactly ${form.duration}.` },
    { label: "Video timeline reaches the selected duration", pass: videoTimeline.includes(endTime), fix: `Make the Video Timeline end exactly at ${endTime}.` },
    { label: "Music timeline reaches the selected duration", pass: musicTimeline.includes(endTime), fix: `Make the Music Path end exactly at ${endTime}.` },
    { label: "Sound-effects timeline reaches the selected duration", pass: sfxTimeline.includes(endTime), fix: `Make the Sound Effects Timeline end exactly at ${endTime}.` },
    { label: "Character names stay consistent", pass: Boolean(heroShort) && visualPrompts.includes(heroShort) && enemyNames.every((name) => visualPrompts.includes(name.toLowerCase())), fix: "Use the same hero and enemy short names throughout every visual prompt." },
    { label: "Hero role and victory are clear", pass: /\bhero\b|\bwinning\b|\bvictorious\b/.test(`${main} ${end}`.toLowerCase()), fix: "State clearly that the hero wins and remains safe." },
    { label: "Enemy roles and backfire are clear", pass: /\benem/.test(all) && /\bbackfire\b/.test(`${main} ${end}`.toLowerCase()), fix: "State clearly that the enemies receive their own harmless backfire." },
    { label: "No duplicated characters rule is present", pass: /no duplicated characters|do not duplicate/.test(all), fix: "Add “no duplicated characters” to continuity rules." },
    { label: "No extra unrequested characters rule is present", pass: /no extra characters|no extra unrequested characters/.test(all), fix: "Add “no extra unrequested characters.”" },
    { label: "No sudden object appearances or disappearances", pass: /no sudden objects|no unexplained appearances or disappearances|every object visible/.test(all), fix: "Require every object arrival, movement, and removal to be shown on screen." },
    { label: "No sudden cuts rule is present", pass: /no sudden cuts/.test(all), fix: "Add “single continuous shot, no sudden cuts.”" },
    { label: "No morphing faces rule is present", pass: /no morphing faces|do not morph face/.test(all), fix: "Add “no morphing faces.”" },
    { label: "No distorted limbs rule is present", pass: /no distorted limbs/.test(all), fix: "Add “no distorted limbs or broken anatomy.”" },
    { label: "No random props rule is present", pass: /no random props/.test(all), fix: "Add “no random props.”" },
    { label: "Start and end frames share visual continuity", pass: start.toLowerCase().includes("continuity") && end.toLowerCase().includes("continuity"), fix: "Lock environment, camera axis, lighting, scale, colors, and prop history across both frames." },
    { label: "Music and sound effects match story action", pass: /synchron|match/.test(musicTimeline.toLowerCase()) && /synchron|visible source|match/.test(sfxTimeline.toLowerCase()), fix: "Synchronize music and every sound effect to the same visible timeline action." },
    { label: "Character Vocal Lock is respected", pass: Boolean(vocal) && main.toLowerCase().includes(form.dialogueMode.toLowerCase()), fix: "Repeat dialogue mode and locked vocal styles in the Main Video Prompt." },
    { label: "No-dialogue mode explicitly forbids spoken dialogue", pass: form.dialogueMode !== "No dialogue" || /no spoken dialogue/.test(main.toLowerCase()), fix: "State “no spoken dialogue and no narrator” in every video prompt." },
    { label: "Social captions include a follow call-to-action", pass: captions.every((caption) => /\bfollow\b|\bsubscribe\b/.test(caption.toLowerCase())), fix: "Add a short, natural follow call-to-action to Facebook, Instagram, and TikTok captions." },
    { label: "YouTube hashtags are strong and searchable", pass: (get("YouTube hashtags").match(/#/g) || []).length >= 6 && /#shorts|#animation|#cartoon/i.test(get("YouTube hashtags")), fix: "Use at least six focused tags including Shorts, cartoon, and animation keywords." },
    { label: "No famous or copyrighted character warning signs", pass: !/\b(mickey|minnie|sonic|mario|pikachu|spongebob|disney|pixar|marvel|batman|superman)\b/i.test(`${form.hero} ${form.enemies} ${form.notes}`), fix: "Replace famous or copyrighted identities with original characters before production." },
    { label: "No text, logo, or watermark unless requested", pass: notesRequestBranding || /no text, no subtitles, no logo, no watermark/.test(visualPrompts), fix: "Add “no text, no subtitles, no logo, no watermark” to every video prompt." },
  ];
  const passed = checks.filter((check) => check.pass).map((check) => check.label);
  const failed = checks.filter((check) => !check.pass);
  const score = Math.round((passed.length / checks.length) * 100);
  const label = score >= 90
    ? "Excellent / Production Ready"
    : score >= 75
      ? "Good / Minor Improvements Suggested"
      : score >= 50
        ? "Needs Review"
        : "High Risk / Fix Before Use";
  return {
    score,
    label,
    passed,
    warnings: failed.map((check) => check.label),
    suggestions: failed.map((check) => check.fix),
  };
}

function qualityReportText(report: QualityReport) {
  return `PROMPT QUALITY INSPECTOR\nScore: ${report.score}/100 — ${report.label}\n\nPASSED CHECKS\n${report.passed.map((item) => `✓ ${item}`).join("\n") || "None"}\n\nWARNINGS\n${report.warnings.map((item) => `! ${item}`).join("\n") || "None"}\n\nFIX SUGGESTIONS\n${report.suggestions.map((item) => `→ ${item}`).join("\n") || "No fixes needed."}`;
}

function createDemoVariants(pack: PackItem[]): ProductionVariant[] {
  const get = (title: string) => pack.find((item) => item.title === title)?.value || "";
  const baseValues: Record<string, string> = {
    episodeTitle: get("Episode title"),
    startFrameImagePrompt: get("Start-frame image prompt"),
    endFrameImagePrompt: get("End-frame image prompt"),
    mainVideoPrompt: get("Main video prompt"),
    selectedModelPrompt: get("Selected Model Prompt"),
    videoTimelineBySeconds: get("Video Timeline by Seconds"),
    musicPathBySeconds: get("Music Path by Seconds"),
    soundEffectsTimelineBySeconds: get("Sound Effects Timeline by Seconds"),
    captions: `Facebook\n${get("Facebook caption")}\n\nInstagram\n${get("Instagram caption")}\n\nTikTok\n${get("TikTok caption")}`,
    hashtags: get("YouTube hashtags"),
    pinnedComment: get("Pinned comment"),
    retentionChecklist: get("Retention checklist"),
  };
  const definitions: Omit<ProductionVariant, "items">[] = [
    {
      id: "safeVersion",
      name: "Safe Version",
      purpose: "Lowest AI generation error risk, simple motion, strongest continuity.",
    },
    {
      id: "viralVersion",
      name: "Viral Version",
      purpose: "Stronger first second, funnier slapstick, replayable ending, better social engagement.",
    },
    {
      id: "cinematicVersion",
      name: "Cinematic Version",
      purpose: "Richer visuals, stronger camera language, polished animated-film feeling.",
    },
  ];
  const directives: Record<ProductionVariant["id"], string> = {
    safeVersion: "SAFE VERSION DIRECTION: minimize motion complexity; use one simple, readable action at a time; locked camera axis; strongest identity, prop, anatomy, and environment continuity; lowest generation-error risk.",
    viralVersion: "VIRAL VERSION DIRECTION: action is unmistakable in frame one; heighten expressions and harmless slapstick timing; create a satisfying replayable final beat; keep the same stable cast, props, and continuous shot.",
    cinematicVersion: "CINEMATIC VERSION DIRECTION: enrich composition, lighting, depth, controlled camera movement, atmosphere, and animated-film polish without increasing character count or breaking continuity.",
  };
  const directiveFields = new Set([
    "startFrameImagePrompt", "endFrameImagePrompt", "mainVideoPrompt", "selectedModelPrompt",
    "videoTimelineBySeconds", "musicPathBySeconds", "soundEffectsTimelineBySeconds", "retentionChecklist",
  ]);
  return definitions.map((definition) => ({
    ...definition,
    items: variantSectionMap.map((section) => ({
      title: section.title,
      eyebrow: section.eyebrow,
      value: directiveFields.has(section.key)
        ? `${directives[definition.id]}\n\n${baseValues[section.key]}`
        : section.key === "episodeTitle"
          ? `${baseValues[section.key]} — ${definition.name.replace(" Version", "")}`
          : baseValues[section.key],
    })),
  }));
}

function variantText(variant: ProductionVariant) {
  return `${variant.name.toUpperCase()}\nPurpose: ${variant.purpose}\n\n${variant.items.map((item, index) => `${index + 1}. ${item.title.toUpperCase()}\n${item.value}`).join("\n\n")}`;
}

function makePackV2(form: FormState): PackItem[] {
  const hero = safeText(form.hero, "A quick-witted cartoon hero") || "A quick-witted cartoon hero";
  const enemies = safeText(form.enemies, "a pair of bumbling rivals") || "a pair of bumbling rivals";
  const object = safeText(form.object, "a mysterious snack") || "a mysterious snack";
  const trap = safeText(form.trap, "an elaborate trap that backfires") || "an elaborate trap that backfires";
  const heroShort = shortName(hero);
  const enemyFullNames = enemies.split(/\s+(?:and|&)\s+|,\s*/i).filter(Boolean);
  const enemyNames = enemyFullNames.map(shortName);
  const enemyShort =
    enemyNames.length > 1
      ? `${enemyNames.slice(0, -1).join(", ")} and ${enemyNames.at(-1)}`
      : enemyNames[0] || "the rivals";
  const cast = `Characters: ${hero}; ${enemies}.`;
  const notesText = safeText(form.notes);
  const notes = notesText ? ` Extra direction: ${notesText}` : "";
  const visualStyle = safeText(form.style, "colorful polished cartoon animation") || "colorful polished cartoon animation";
  const tone = safeText(form.tone, "funny, family-friendly") || "funny, family-friendly";
  const look = `${visualStyle}; ${tone}; premium cinematic composition, crisp silhouettes, expressive faces, readable action, rich colors, controlled depth of field, volumetric atmosphere, polished lighting and materials`;
  const music = form.musicDirection === "Custom"
    ? safeText(form.customMusic, "custom music direction to be supplied") || "custom music direction to be supplied"
    : safeText(form.musicDirection, "Slapstick Comedy") || "Slapstick Comedy";
  const musicRule = music === "No Music"
    ? "No background music; use precisely timed sound effects and expressive physical performance only"
    : `Music direction: ${music}; score the action without masking important sound effects`;
  const vocalStyles = `Hero vocal style: ${safeText(form.heroVocalStyle, "expressive family-friendly cartoon energy")}. Enemy vocal style: ${safeText(form.enemyVocalStyle, "funny exaggerated cartoon mischief")}. Narrator vocal style: ${safeText(form.narratorVocalStyle, "warm clear family-friendly storyteller")}. Vocal lock: ${safeText(form.vocalLockNotes, "keep voices consistent throughout, no random voice changes")}.`;
  const dialogueRules: Record<string, string> = {
    "Character dialogue": `Character dialogue is allowed; only ${heroShort} and ${enemyShort} speak. Keep each voice distinct and locked to its assigned vocal style. ${vocalStyles}`,
    "Narrator only": `Only the narrator speaks; ${heroShort} and ${enemyShort} have no spoken dialogue. ${vocalStyles}`,
    "Narrator + character dialogue": `Narrator and character dialogue are allowed; keep narrator, hero, and enemy voices clearly separated and consistent. ${vocalStyles}`,
    "No dialogue": "No spoken dialogue and no narrator; tell the story only through action, expressions, sound effects, and music",
  };
  const dialogueRule = dialogueRules[form.dialogueMode] || dialogueRules["No dialogue"];
  const selectedShotRule = form.videoModel === "Runway"
    ? "concise shot-focused output; use only minimal clean cuts if the model requires them, otherwise preserve continuous action"
    : "single continuous shot, smooth motion, no sudden cuts";
  const videoRules = `${selectedShotRule}; ${dialogueRule}; no text, no subtitles, no logo, no watermark`;
  const identityRules = "stable character identity, consistent colors, stable character scale, consistent wardrobe and appearance, no extra characters, no duplicated characters, no morphing faces, no distorted limbs, no merged bodies, no broken anatomy";
  const ratio = ratioDirection(form.ratio);
  const continuity = "Zero-error continuity: match the same environment, background, lighting direction, character identity, colors, scale, wardrobe, appearance, props, screen direction, and story geography across the start frame, video action, and end frame. Keep every object visible until its movement or removal is clearly shown on screen; no sudden objects, random props, extra characters, unusual events, disappearances, background changes, or unexplained environment changes";
  const quality = "High quality output, polished, coherent, stable, production-ready, zero-error continuity";
  const platformPlan = platformDirection(form.platform);
  const selectedModelPlan = modelDirection(form.videoModel);
  const altModel = alternativeModel(form.videoModel);
  const altModelPlan = modelDirection(altModel);
  const altShotRule = altModel === "Runway"
    ? "allow a concise shot-based sequence only if required"
    : "single continuous shot, smooth motion, no sudden cuts";
  const imageMetadata = `Target platform: ${form.platform}\nSelected AI video model: ${form.videoModel}\nVideo ratio: ${form.ratio}\nVisual style: ${form.style}`;
  const videoMetadata = `Target platform: ${form.platform}\nSelected AI video model: ${form.videoModel}\nVideo ratio: ${form.ratio}\nVideo duration: ${form.duration}\nVisual style: ${form.style}`;
  const titleObject = object.replace(/^(a|an|the)\s+/i, "");
  const bible = safeText(form.characterBible);
  const imageBible = bible
    ? ` Character library appearance and identity locks:\n${bible}`
    : " Character library appearance and identity locks: use the supplied full character identities only; no additional library overrides.";
  const videoBible = bible
    ? `\n\nCHARACTER LIBRARY / BRAND BIBLE\n${bible}\n`
    : "\n\nCHARACTER LIBRARY / BRAND BIBLE\nNo optional Brand Bible was supplied; preserve the stated character identities, colors, roles, and global continuity rules.\n";
  const qcPrompt = qualityControlPrompt(form);
  const qcBlock = `\n\n${qcPrompt}`;
  const qualitySummary = form.qualityControlEnabled === false
    ? "Prompt Quality Control was disabled for this pack. Global baseline family-safety and continuity rules remain in place."
    : `${enabledQualityRules(form).map((option) => `${option.summary}: enabled`).join("\n")}${safeText(form.additionalQualityNotes) ? `\nAdditional quality notes: ${safeText(form.additionalQualityNotes)}` : ""}`;
  const productionSafetyNotes = [
    `Confirm ${form.ratio} matches the ${form.platform} export settings.`,
    "Keep the same character identities, descriptions, colors, scale, and roles across every generated scene.",
    form.qcPreventObjectChanges !== false ? "Do not add or remove props mid-scene unless the change is intentionally shown on screen." : "Review any intentional prop appearances or disappearances for clear on-screen motivation.",
    form.qcStrongHook !== false ? "Keep first-second action visible, centered, and immediately readable." : "Confirm the opening remains clear even without an enforced first-second hook.",
    form.qcStrongPayoff !== false ? "Ensure the final frame visibly resolves the action and hero/enemy outcome." : "Review the ending manually for a clear visual resolution.",
    `Keep ${form.musicDirection === "Custom" ? safeText(form.customMusic, "custom music") : form.musicDirection} music and sound effects synchronized to the ${form.duration} timeline.`,
    form.dialogueMode === "No dialogue" ? "Use no spoken dialogue or narrator; rely on action, expressions, music, and sound effects." : `Keep speaker roles fixed in ${form.dialogueMode} mode and preserve every vocal lock.`,
    `For ${form.videoModel}, prioritize the Main Video Prompt plus Selected Model Prompt if the platform struggles with long instructions.`,
  ].map((item) => `✓ ${item}`).join("\n");
  const ranges = timelineRanges(form.duration);
  const videoActions = ranges.map((range, index) => {
    const shortActions = [
      `${heroShort} enters in active motion toward ${object}; ${enemyShort} visibly prepare the trap`,
      `${enemyShort} activate ${trap}; all characters, props, and screen direction remain traceable`,
      `${heroShort} notices the danger and makes one smooth, logical dodge as the same trap continues moving`,
      `${trap} reverses and delivers a harmless, clearly shown backfire to ${enemyShort}`,
      `${heroShort} claims ${object}, wins clearly, and settles into a loopable final pose`,
    ];
    const longActions = [
      `${heroShort} enters in immediate active motion toward ${object} while ${enemyShort} reveal the trap`,
      `${enemyShort} build and trigger ${trap}; ${heroShort} discovers the danger, the physical-comedy chase escalates smoothly, and every prop remains visible and accounted for`,
      `${heroShort} redirects the same trap, ${enemyShort} receive the harmless backfire, and ${heroShort} wins with ${object} in a clean loopable finish`,
    ];
    return `${range.label} — ${ranges.length === 3 ? longActions[index] : shortActions[index]}`;
  }).join("\n");
  const musicActions = ranges.map((range, index) => {
    if (music === "No Music") return `${range.label} — no background music; action is carried by synchronized production sound only`;
    const shortMusic = [
      `${music} motif starts immediately with a crisp rhythmic hook`,
      "light comedy rhythm builds under the visible trap setup",
      "tempo and intensity rise smoothly with the chase or mistake",
      "brief anticipation dip followed by a precise comedic hit",
      "bright victory sting resolves into a soft loop point",
    ];
    const longMusic = [
      `${music} theme begins immediately at low-to-medium intensity with a memorable hook`,
      "rhythm, harmony, and intensity build in stages with the visible escalation, leaving space for key effects",
      "music dips before the backfire, lands a clean comedy accent, then resolves with a victory sting and loopable cadence",
    ];
    return `${range.label} — ${ranges.length === 3 ? longMusic[index] : shortMusic[index]}`;
  }).join("\n");
  const sfxActions = ranges.map((range, index) => {
    const shortSfx = [
      `quick whoosh and sparkle as ${heroShort} enters and ${object} catches the eye`,
      `trap click, squeak, and rolling rumble sourced from ${trap}`,
      "footstep patter, controlled whoosh, pop, and rising mechanical rattle matched to visible motion",
      `boing, bounce, soft impact, and family-friendly comedy hit as ${enemyShort} receive the backfire`,
      `tiny victory sparkle chime and final settling squeak`,
    ];
    const longSfx = [
      `entry whoosh, object sparkle, and trap-reveal squeak, each tied to a visible source`,
      "staged footsteps, pops, rolling rumbles, controlled boings, and movement whooshes synchronized to the continuous build-up",
      `brief anticipation hush, soft crash and bounce as ${enemyShort} receive the backfire, followed by a small victory chime`,
    ];
    return `${range.label} — ${ranges.length === 3 ? longSfx[index] : shortSfx[index]}`;
  }).join("\n");

  return [
    {
      eyebrow: "Story",
      title: "Episode title",
      value: `${heroShort} & The ${titleObject.replace(/\b\w/g, (m) => m.toUpperCase())} Backfire`,
    },
    {
      eyebrow: "Image",
      title: "Start-frame image prompt",
      value: `${imageMetadata}\n\n${cast}${imageBible} ${ratio}. Premium cinematic opening frame already caught in active motion during the first second: ${heroShort} lunges toward ${object} while ${enemyShort} visibly activate ${trap} from a clearly staged position. Use a purposeful lens, strong foreground-to-background depth, dynamic but readable composition, directional motion cues, subtle airborne dust, dramatic rim light, controlled volumetric atmosphere, rich environmental detail, sharply readable expressions, and unambiguous screen direction. Establish exact character and prop placement, color palette, lighting, camera height, lens perspective, and environment geography as the continuity anchor for every following frame. ${continuity}. ${identityRules}. ${look}. ${quality}; no text, no subtitles, no logo, no watermark.${qcBlock}${notes}`,
    },
    {
      eyebrow: "Image",
      title: "End-frame image prompt",
      value: `${imageMetadata}\n\n${cast}${imageBible} ${ratio}. Premium cinematic final victory frame that resolves the exact opening setup: ${heroShort} stands clearly unharmed and triumphant in the hero-lit foreground, holding ${object} with a confident grin. Behind ${heroShort}, ${enemyShort} have unmistakably received the full harmless ${trap} backfire and remain safely caught in its comic aftermath. Preserve the established camera axis, lens language, environment, prop history, colors, character scale, wardrobe, and lighting direction while evolving only what the continuous action logically changed. Use layered depth, warm key light on the winner, cooler contrast on the defeated rivals, controlled settling dust, polished textures, expressive faces, clean anatomy, and a decisive loop-friendly payoff. ${continuity}. ${identityRules}. ${look}. ${quality}; no text, no subtitles, no logo, no watermark.${qcBlock}${notes}`,
    },
    {
      eyebrow: "Video",
      title: "Main video prompt",
      value: `${videoMetadata}\nMusic direction: ${music}\nDialogue mode: ${form.dialogueMode}\n\nTIMING BLOCK\n${videoActions}\n\n${cast}${videoBible} Create a premium ${form.duration} short for ${form.platform}, generated with ${form.videoModel}. Platform direction: ${platformPlan}. Model direction: ${selectedModelPlan}. ${ratio}. FIRST SECOND: begin already in smooth, readable motion as ${heroShort} dives toward ${object} and ${enemyShort} activate ${trap}. Continue in one logically connected camera move: ${heroShort} recognizes the danger, performs a clever physical-comedy dodge, and redirects the same visible trap without any unexplained change. The complete harmless backfire lands clearly on ${enemyShort}, never on ${heroShort}. End with ${heroShort} visibly winning—safe, confident, and holding the same ${object}—while ${enemyShort} remain caught behind the winner. Match every action precisely to the timing block. ${musicRule}. ${continuity}. ${identityRules}. Smooth logical motion, clean cause and effect, restrained squash-and-stretch, strong anticipation, readable reaction holds, no sudden cuts, no sudden unusual events. ${look}. ${quality}. ${videoRules}.${qcBlock}${notes}`,
    },
    {
      eyebrow: "AI Model",
      title: "Selected Model Prompt",
      value: `${videoMetadata}\nOptimization target: ${form.videoModel}\nMusic direction: ${music}\nDialogue mode: ${form.dialogueMode}\n\n${cast} Optimize specifically for ${form.videoModel}: ${selectedModelPlan}. ${ratio}. Start with visible action in frame one. Keep one traceable chain of cause and effect as ${heroShort} dodges and redirects the same ${trap} fully onto ${enemyShort}; finish with ${heroShort} safe, holding the same ${object}, and clearly victorious. Pace every motion for ${form.duration} and apply this ${form.platform} behavior: ${platformPlan}. ${musicRule}. ${continuity}. ${identityRules}. Smooth logical motion, stable environment, no random props, no unexplained appearances or disappearances, and no sudden background changes. ${look}. ${quality}. ${videoRules}.${qcBlock}${notes}`,
    },
    {
      eyebrow: "Alternative",
      title: "Alternative Model Prompt",
      value: `Target platform: ${form.platform}\nAlternative AI video model: ${altModel}\nVideo ratio: ${form.ratio}\nVideo duration: ${form.duration}\nVisual style: ${form.style}\nMusic direction: ${music}\nDialogue mode: ${form.dialogueMode}\n\n${cast} Alternative version optimized for ${altModel}: ${altModelPlan}. ${ratio}. Start mid-action in the first second as ${heroShort} rushes toward ${object} while ${enemyShort} activate ${trap}. Preserve one traceable action chain: readable dodge, logical reversal, full harmless backfire catching ${enemyShort}, and ${heroShort} decisively winning with the same prize. Pace for ${form.duration}; apply ${platformPlan}. ${musicRule}. ${continuity}. ${identityRules}. ${quality}. ${altShotRule}; ${dialogueRule}; no text, no subtitles, no logo, no watermark.${qcBlock}${notes}`,
    },
    {
      eyebrow: "Timeline",
      title: "Video Timeline by Seconds",
      value: `${videoActions}\n\nContinuity lock: use the exact ${form.duration} duration, keep one continuous cause-and-effect chain, and match the start frame, moving action, and end frame without sudden cuts, duplicated characters, random props, or unexplained changes.`,
    },
    {
      eyebrow: "Audio",
      title: "Sound effects plan",
      value: `Music coordination: ${musicRule}.\n0:00–0:01 — immediate bait whoosh and trap-trigger snap; establish action on frame one\n0:01–0:04 — quick footsteps and a clearly located rolling trap rattle\n0:04–0:08 — rising slide whistle and accelerating mechanical creaks\n0:08–0:11 — dodge whoosh, reversal boing, brief anticipation vacuum\n0:11–0:13 — layered comic crash as the trap catches ${enemyShort}\n0:13–end — ${heroShort}'s victory chime, tiny bite/crunch, defeated wobble whistle\nMix note: sync every sound to a visible source, keep music under the effects, avoid random off-screen sounds, preserve the same acoustic environment throughout, and fit the complete sound arc to ${form.duration}.${qcBlock}`,
    },
    {
      eyebrow: "Music",
      title: "Music Plan",
      value: music === "No Music"
        ? "No background music. Let precisely synchronized footsteps, trap mechanics, whooshes, comic impact sounds, reaction breaths, and the final victory chime carry the full rhythm. Keep the soundscape clean, family-friendly, continuous, and free of unexplained audio events."
        : `Direction: ${music}.\nDuration: compose and resolve the complete cue within ${form.duration}.\nStructure: open with an immediate rhythmic accent in frame one; build a light motif under the trap setup; raise tempo and tension during the near miss; leave a brief musical pocket before the backfire impact; resolve with a bright victory button for ${heroShort}.\nMix: coordinate every musical accent with the Sound Effects Plan, duck under impacts and vocal content, avoid overpowering character reactions, keep instrumentation and tempo coherent, and end on a clean loop-friendly cadence.${qcBlock}`,
    },
    {
      eyebrow: "Timeline",
      title: "Music Path by Seconds",
      value: `${musicActions}\n\nSynchronization note: every intensity and rhythm change follows the Video Timeline by Seconds exactly.${music === "No Music" ? " No background music at any point." : ""}`,
    },
    {
      eyebrow: "Timeline",
      title: "Sound Effects Timeline by Seconds",
      value: `${sfxActions}\n\nSynchronization note: every whoosh, boing, pop, crash, bounce, squeak, sparkle, soft impact, and comedy hit must have a visible source and align with the same timed action; no random effects.`,
    },
    {
      eyebrow: "Voice",
      title: "Character Vocal Lock",
      value: `Dialogue mode: ${form.dialogueMode}\nHero — ${heroShort}: ${form.heroVocalStyle}\nEnemies — ${enemyShort}: ${form.enemyVocalStyle}\nNarrator: ${form.narratorVocalStyle}\nLock notes: ${form.vocalLockNotes}\n\nProduction rule: ${dialogueRule}. Keep vocal identity, tone, energy, pitch character, and recording quality consistent throughout.`,
    },
    {
      eyebrow: "Brand Bible",
      title: "Character Bible Used",
      value: bible || `Hero identity: ${hero}\nEnemy identities: ${enemies}\nRole locks: ${heroShort} is the hero and wins; ${enemyShort} are the enemies and receive the harmless trap backfire.\nAppearance locks: use the identities and colors stated in the full names.\nVocal locks: ${form.heroVocalStyle}; ${form.enemyVocalStyle}.\nNegative rules: no duplicated characters, no extra characters, no species or color changes, no morphing faces, no distorted limbs, and no role changes.`,
    },
    {
      eyebrow: "Facebook",
      title: "Facebook caption",
      value: `${enemyShort} built the “perfect” trap for ${heroShort}… then ${heroShort} turned it into the perfect backfire. 🐿️🍪 Watch to the end for the win—and follow for more family-friendly cartoon chaos!`,
    },
    {
      eyebrow: "Instagram",
      title: "Instagram caption",
      value: `${heroShort} wanted the ${titleObject}. ${enemyShort} had a trap. Only one side was walking away with the prize. 🍪💥\n\nSave this for ${heroShort}'s victory, tag the friend whose plans always backfire, and follow for more cartoon adventures.\n\n#BiscuitTheSquirrel #BiscuitAndTheTroubleCrew #SlapstickComedy #CartoonShorts #AnimationReels`,
    },
    {
      eyebrow: "TikTok",
      title: "TikTok caption",
      value: `${enemyShort}: “This trap is foolproof.” ${heroShort}: wins anyway. 💀🍪 Follow for the next backfire! #BiscuitTheSquirrel #CartoonTok #Slapstick #FunnyAnimation`,
    },
    {
      eyebrow: "YouTube",
      title: "YouTube title",
      value: `${heroShort} Wins! The ${titleObject} Trap Backfired on ${enemyShort} 🍪💥`,
    },
    {
      eyebrow: "YouTube",
      title: "YouTube description",
      value: `${enemyShort} set a sneaky ${trap} to keep ${heroShort} away from ${object}. There’s just one problem: ${heroShort} is always one move ahead.\n\nWatch ${heroShort} dodge the danger, send the trap back to ${enemyShort}, and claim the win. Subscribe for more family-friendly cartoon chaos with Biscuit and the Trouble Crew!`,
    },
    {
      eyebrow: "YouTube",
      title: "YouTube hashtags",
      value: "#BiscuitTheSquirrel #BiscuitAndTheTroubleCrew #YouTubeShorts #Shorts #CartoonShorts #SlapstickComedy #FunnyAnimation #3DAnimation #FamilyFriendly #ComedyShorts",
    },
    {
      eyebrow: "Engagement",
      title: "Pinned comment",
      value: `Be honest: would you help ${heroShort} grab ${object}, or join ${enemyShort} and build another trap? 🍪👇`,
    },
    {
      eyebrow: "Performance",
      title: "Retention checklist",
      value: `✓ Begin with visible character and trap motion in frame one\n✓ Make the ${form.ratio} story readable with sound off\n✓ Use a single continuous shot with smooth camera flow\n✓ Keep every instruction clear, non-contradictory, and easy for the selected model to follow\n✓ Hold ${heroShort}'s “uh-oh” reaction for 3–5 frames\n✓ Add one readable escalation before the main backfire\n✓ Show the trap landing clearly on ${enemyShort}, never ${heroShort}\n✓ End with ${heroShort} visibly safe, victorious, and holding the prize\n✓ Keep the final frame loop-friendly with the opening\n✓ Keep music and SFX synchronized to the ${form.duration} action timeline\n✓ Follow ${form.dialogueMode} and all vocal locks exactly\n✓ No intro card, text, logo, watermark, random props, or dead air\n✓ Keep faces, colors, scale, roles, and character count consistent`,
    },
    {
      eyebrow: "Quality Control",
      title: "Quality summary",
      value: qualitySummary,
    },
    {
      eyebrow: "Safety",
      title: "Production safety notes",
      value: productionSafetyNotes,
    },
  ];
}

function CopyButton({ value, fullPack = false, label }: { value: string; fullPack?: boolean; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button className={`copy-button ${copied ? "copied" : ""}`} onClick={copy} type="button">
      <span aria-hidden="true">{copied ? "✓" : "⧉"}</span>
      {copied ? "Copied" : label || (fullPack ? "Copy Full Pack" : "Copy")}
    </button>
  );
}

const platformLinks = {
  openart: { label: "Open OpenArt", url: "https://openart.ai/" },
  higgsfield: { label: "Open Higgsfield", url: "https://higgsfield.ai/" },
  runway: { label: "Open Runway", url: "https://runwayml.com/" },
  flow: { label: "Open Google Flow", url: "https://labs.google/fx/tools/flow" },
  pixverse: { label: "Open PixVerse", url: "https://pixverse.ai/" },
};

function launchersForModel(model: string) {
  if (model.startsWith("OpenArt")) return [platformLinks.openart];
  if (model === "Higgsfield") return [platformLinks.higgsfield];
  if (model === "Runway") return [platformLinks.runway];
  if (model === "Google Flow / Veo") return [platformLinks.flow];
  if (model === "PixVerse") return [platformLinks.pixverse];
  return Object.values(platformLinks);
}

export default function Home() {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [characters, setCharacters] = useState<CharacterProfile[]>(builtInCharacters);
  const [characterDraft, setCharacterDraft] = useState<CharacterProfile>(emptyCharacter);
  const [characterSuggestionMode, setCharacterSuggestionMode] = useState<CharacterSuggestionMode>("replace");
  const [suggestingCharacterField, setSuggestingCharacterField] = useState<CharacterSuggestionField | "all" | null>(null);
  const [characterSuggestionStatus, setCharacterSuggestionStatus] = useState("");
  const [characterSuggestionError, setCharacterSuggestionError] = useState("");
  const [projectPresets, setProjectPresets] = useState<ProjectPreset[]>([builtInPreset]);
  const [projectName, setProjectName] = useState("");
  const [selectedPresetId, setSelectedPresetId] = useState(builtInPreset.id);
  const [savedPacks, setSavedPacks] = useState<SavedProductionPack[]>([]);
  const [selectedSavedPackId, setSelectedSavedPackId] = useState("");
  const [packSearch, setPackSearch] = useState("");
  const [platformFilter, setPlatformFilter] = useState("All platforms");
  const [modelFilter, setModelFilter] = useState("All models");
  const [variants, setVariants] = useState<ProductionVariant[]>([]);
  const [pack, setPack] = useState<PackItem[] | null>(null);
  const [mode, setMode] = useState<GeneratorMode>("demo");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isInspecting, setIsInspecting] = useState(false);
  const [isGeneratingVariants, setIsGeneratingVariants] = useState(false);
  const [selectedRepairSection, setSelectedRepairSection] = useState("start-frame");
  const [error, setError] = useState("");
  const [generatedAt, setGeneratedAt] = useState("");
  const outputRef = useRef<HTMLDivElement>(null);
  const characterImportRef = useRef<HTMLInputElement>(null);
  const projectImportRef = useRef<HTMLInputElement>(null);
  const isReady = form.hero.trim() && form.enemies.trim() && form.object.trim() && form.trap.trim();
  const progress = useMemo(
    () => [
      form.hero, form.enemies, form.object, form.trap, form.duration, form.ratio, form.platform,
      form.videoModel, form.style, form.tone, form.musicDirection, form.dialogueMode,
      form.heroVocalStyle, form.enemyVocalStyle, form.narratorVocalStyle, form.vocalLockNotes,
    ].filter(Boolean).length,
    [form],
  );
  const qualityReport = useMemo(() => pack ? inspectPack(pack, form) : null, [pack, form]);
  const fullPackText = useMemo(() => {
    if (!pack) return "";
    const productionPack = pack.map((item, index) => `${index + 1}. ${item.title.toUpperCase()}\n${item.value}`).join("\n\n");
    return qualityReport ? `${productionPack}\n\n${qualityReportText(qualityReport)}` : productionPack;
  }, [pack, qualityReport]);
  const filteredSavedPacks = useMemo(() => savedPacks.filter((saved) => (
    saved.episodeTitle.toLowerCase().includes(packSearch.toLowerCase()) &&
    (platformFilter === "All platforms" || saved.platform === platformFilter) &&
    (modelFilter === "All models" || saved.videoModel === modelFilter)
  )), [savedPacks, packSearch, platformFilter, modelFilter]);

  useEffect(() => {
    try {
      const savedCharacters = JSON.parse(localStorage.getItem("slapstick-character-library") || "[]") as CharacterProfile[];
      const savedProjects = JSON.parse(localStorage.getItem("slapstick-project-presets") || "[]") as ProjectPreset[];
      const savedProductionPacks = JSON.parse(localStorage.getItem("slapstick-saved-packs") || "[]") as SavedProductionPack[];
      const savedCurrentSetup = JSON.parse(localStorage.getItem("slapstick-current-setup") || "null") as Partial<FormState> | null;
      if (Array.isArray(savedCharacters)) {
        const savedIds = new Set(savedCharacters.map((profile) => profile.id));
        setCharacters([...savedCharacters, ...builtInCharacters.filter((profile) => !savedIds.has(profile.id))]);
      }
      if (Array.isArray(savedProjects)) setProjectPresets([builtInPreset, ...savedProjects.filter((preset) => preset.id !== builtInPreset.id)]);
      if (Array.isArray(savedProductionPacks)) setSavedPacks(savedProductionPacks);
      if (savedCurrentSetup && typeof savedCurrentSetup === "object") setForm({ ...emptyForm, ...savedCurrentSetup });
    } catch {
      // Keep the built-in defaults if older browser data cannot be read.
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("slapstick-character-library", JSON.stringify(characters));
  }, [characters]);

  useEffect(() => {
    localStorage.setItem("slapstick-project-presets", JSON.stringify(projectPresets.filter((preset) => !preset.builtIn)));
  }, [projectPresets]);

  useEffect(() => {
    localStorage.setItem("slapstick-saved-packs", JSON.stringify(savedPacks));
  }, [savedPacks]);

  useEffect(() => {
    localStorage.setItem("slapstick-current-setup", JSON.stringify(form));
  }, [form]);

  function update(key: keyof FormState, value: string) {
    setForm((current) => {
      if (key === "platform") {
        const prefersWide = value === "YouTube 16:9 Video" || value === "Facebook 16:9 Video";
        const prefersVertical = ["Facebook Reels", "Instagram Reels", "TikTok", "YouTube Shorts"].includes(value);
        return {
          ...current,
          platform: value,
          ratio: prefersWide ? "16:9 horizontal" : prefersVertical ? "9:16 vertical" : current.ratio,
        };
      }
      return { ...current, [key]: value };
    });
  }

  function updateBoolean(key: keyof FormState, value: boolean) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function generate() {
    setError("");
    const generationForm = { ...form, characterBible: characterBibleText(form, characters) };

    if (mode === "demo") {
      setPack(makePackV2(generationForm));
      setGeneratedAt(new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" }).format(new Date()));
      window.setTimeout(() => outputRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(generationForm),
      });
      const data = await response.json() as Record<string, string>;
      if (!response.ok) throw new Error(data.error || "AI Mode could not generate the production pack.");

      setPack(aiSectionMap.map((section) => ({
        title: section.title,
        eyebrow: section.eyebrow,
        value: data[section.key],
      })));
      setGeneratedAt(new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" }).format(new Date()));
      window.setTimeout(() => outputRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "AI Mode could not generate the production pack.");
    } finally {
      setIsGenerating(false);
    }
  }

  function loadDemo() {
    setForm(biscuitDemo);
    setCharacters((current) => {
      const ids = new Set(current.map((profile) => profile.id));
      return [...current, ...builtInCharacters.filter((profile) => !ids.has(profile.id))];
    });
    setPack(null);
  }

  function mergeCharacterSuggestion(field: CharacterSuggestionField, suggestion: string) {
    setCharacterDraft((current) => ({
      ...current,
      [field]: characterSuggestionMode === "append" && current[field].trim()
        ? `${current[field].trim()}\n\n${suggestion.trim()}`
        : suggestion.trim(),
    }));
  }

  async function suggestCharacter(field?: CharacterSuggestionField) {
    if (!characterDraft.shortName.trim() || !characterDraft.fullIdentity.trim()) {
      setCharacterSuggestionError("Add a short name and full identity before generating suggestions.");
      return;
    }
    setCharacterSuggestionError("");
    setCharacterSuggestionStatus("");
    setSuggestingCharacterField(field || "all");
    try {
      if (mode === "demo") {
        const suggestions = localCharacterSuggestions(characterDraft, form);
        if (field) mergeCharacterSuggestion(field, suggestions[field]);
        else setCharacterDraft((current) => {
          const next = { ...current };
          characterSuggestionFields.forEach(({ key }) => {
            next[key] = characterSuggestionMode === "append" && current[key].trim()
              ? `${current[key].trim()}\n\n${suggestions[key]}`
              : suggestions[key];
          });
          return next;
        });
      } else {
        const response = await fetch("/api/character-suggest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: field ? "suggestSingleField" : "generateFullCharacterBible",
            requestedField: field,
            character: characterDraft,
            context: {
              visualStyle: form.style,
              tone: form.tone,
              platform: form.platform,
              model: form.videoModel,
              dialogueMode: form.dialogueMode,
              characterNotes: form.notes,
            },
          }),
        });
        const data = await response.json() as Record<string, string>;
        if (!response.ok) throw new Error(data.error || "The character suggestion could not be generated.");
        if (field) mergeCharacterSuggestion(field, data.suggestion);
        else setCharacterDraft((current) => {
          const next = { ...current };
          characterSuggestionFields.forEach(({ key }) => {
            const suggestion = key === "scaleLock" ? data.scaleSizeLock : data[key];
            if (typeof suggestion === "string" && suggestion.trim()) {
              next[key] = characterSuggestionMode === "append" && current[key].trim()
                ? `${current[key].trim()}\n\n${suggestion.trim()}`
                : suggestion.trim();
            }
          });
          return next;
        });
      }
      setCharacterSuggestionStatus(field
        ? `${characterSuggestionFields.find((item) => item.key === field)?.label} suggestion inserted.`
        : "Full professional character bible generated.");
    } catch (caught) {
      setCharacterSuggestionError(caught instanceof Error ? caught.message : "The character suggestion could not be generated.");
    } finally {
      setSuggestingCharacterField(null);
    }
  }

  function saveCharacter() {
    if (!characterDraft.shortName.trim() || !characterDraft.fullIdentity.trim()) return;
    const profile = { ...characterDraft, id: characterDraft.id || crypto.randomUUID() };
    setCharacters((current) => characterDraft.id
      ? current.map((item) => item.id === characterDraft.id ? profile : item)
      : [...current, profile]);
    setCharacterDraft(profile);
  }

  function deleteCharacter() {
    if (!characterDraft.id) return;
    setCharacters((current) => current.filter((item) => item.id !== characterDraft.id));
    setCharacterDraft(emptyCharacter);
  }

  function loadCharacter(target: "hero" | "enemies") {
    const identity = characterDraft.fullIdentity.trim();
    if (!identity) return;
    if (target === "hero") update("hero", identity);
    else update("enemies", form.enemies.trim() ? `${form.enemies.trim()} and ${identity}` : identity);
  }

  function saveProjectPreset() {
    if (!projectName.trim()) return;
    const preset: ProjectPreset = {
      id: crypto.randomUUID(),
      name: projectName.trim(),
      form: { ...form, characterBible: characterBibleText(form, characters) },
    };
    setProjectPresets((current) => [...current, preset]);
    setSelectedPresetId(preset.id);
  }

  function loadProjectPreset() {
    const preset = projectPresets.find((item) => item.id === selectedPresetId);
    if (!preset) return;
    setForm({ ...emptyForm, ...preset.form });
    setPack(null);
  }

  function deleteProjectPreset() {
    const preset = projectPresets.find((item) => item.id === selectedPresetId);
    if (!preset || preset.builtIn) return;
    setProjectPresets((current) => current.filter((item) => item.id !== selectedPresetId));
    setSelectedPresetId(builtInPreset.id);
  }

  function downloadJson(data: unknown, filename: string) {
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function importJson(event: ChangeEvent<HTMLInputElement>, kind: "characters" | "projects") {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      const list = Array.isArray(parsed) ? parsed : kind === "characters" ? parsed.characters : parsed.projectPresets;
      if (!Array.isArray(list)) throw new Error("Invalid library file");
      if (kind === "characters") setCharacters(list);
      else setProjectPresets([builtInPreset, ...list.filter((preset: ProjectPreset) => preset.id !== builtInPreset.id)]);
    } catch {
      setError("That JSON file could not be imported. Please choose a valid Slapstick Prompt Pack export.");
    } finally {
      event.target.value = "";
    }
  }

  async function downloadWordPack() {
    if (!pack) return;
    setIsDownloading(true);
    try {
      const {
        BorderStyle, Document, HeadingLevel, Packer, Paragraph, Table, TableCell,
        TableRow, TextRun, WidthType,
      } = await import("docx");
      const { saveAs } = await import("file-saver");
      const valueFor = (title: string) => pack.find((item) => item.title === title)?.value || "Not provided";
      const episodeTitle = valueFor("Episode title");
      const metadata = [
        ["Episode title", episodeTitle],
        ["Target platform", form.platform],
        ["AI video model", form.videoModel],
        ["Video ratio", form.ratio],
        ["Video duration", form.duration],
        ["Visual style", form.style],
        ["Tone", form.tone],
        ["Music direction", form.musicDirection === "Custom" ? form.customMusic || "Custom" : form.musicDirection],
        ["Dialogue mode", form.dialogueMode],
      ];
      const borders = {
        top: { style: BorderStyle.SINGLE, size: 1, color: "D9D7E4" },
        bottom: { style: BorderStyle.SINGLE, size: 1, color: "D9D7E4" },
        left: { style: BorderStyle.SINGLE, size: 1, color: "D9D7E4" },
        right: { style: BorderStyle.SINGLE, size: 1, color: "D9D7E4" },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "D9D7E4" },
        insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "D9D7E4" },
      };
      const timelineTitles = new Set([
        "Video Timeline by Seconds",
        "Music Path by Seconds",
        "Sound Effects Timeline by Seconds",
      ]);
      const children = [
        new Paragraph({
          heading: HeadingLevel.TITLE,
          children: [new TextRun({ text: "Slapstick Prompt Pack Production Pack", bold: true, color: "1F2440" })],
        }),
        new Paragraph({
          children: [new TextRun({ text: "Generated production guide for AI cartoon short-video creation", italics: true, color: "6F7187" })],
          spacing: { after: 360 },
        }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders,
          rows: metadata.map(([key, value]) => new TableRow({
            children: [
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: key, bold: true })] })] }),
              new TableCell({ children: [new Paragraph(value)] }),
            ],
          })),
        }),
        new Paragraph({ text: "", spacing: { after: 180 } }),
      ];

      pack.forEach((item, index) => {
        children.push(new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun({ text: `${index + 1}. ${item.title}`, bold: true, color: "DF481A" })],
          spacing: { before: 280, after: 120 },
        }));
        if (timelineTitles.has(item.title)) {
          const rows = item.value.split("\n").filter((line) => line.includes("—")).map((line) => {
            const [timing, ...detail] = line.split("—");
            return new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: timing.trim(), bold: true })] })] }),
                new TableCell({ children: [new Paragraph(detail.join("—").trim())] }),
              ],
            });
          });
          children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, borders, rows }));
        } else {
          item.value.split("\n").forEach((line) => children.push(new Paragraph({
            text: line,
            bullet: /^[✓•-]\s/.test(line) ? { level: 0 } : undefined,
            spacing: { after: line ? 80 : 40 },
          })));
        }
      });
      if (qualityReport) {
        children.push(new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun({ text: "Prompt Quality Inspector", bold: true, color: "6852D8" })],
          spacing: { before: 320, after: 120 },
        }));
        qualityReportText(qualityReport).split("\n").forEach((line) => children.push(new Paragraph({
          text: line,
          bullet: /^[✓!→]\s/.test(line) ? { level: 0 } : undefined,
          spacing: { after: line ? 70 : 35 },
        })));
      }

      const document = new Document({
        creator: "Slapstick Prompt Pack",
        title: episodeTitle,
        description: "AI cartoon short-video production pack",
        sections: [{ properties: {}, children }],
      });
      const blob = await Packer.toBlob(document);
      const safeTitle = episodeTitle.replace(/[^a-z0-9]+/gi, "_").replace(/^_+|_+$/g, "") || "Slapstick_Prompt_Pack";
      saveAs(blob, `${safeTitle}_Production_Pack.docx`);
    } finally {
      setIsDownloading(false);
    }
  }

  async function downloadCollectionWord(items: PackItem[], title: string, metadata: [string, string][]) {
    setIsDownloading(true);
    try {
      const { Document, HeadingLevel, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType } = await import("docx");
      const { saveAs } = await import("file-saver");
      const children = [
        new Paragraph({
          heading: HeadingLevel.TITLE,
          children: [new TextRun({ text: title, bold: true, color: "1F2440" })],
        }),
        new Paragraph({
          children: [new TextRun({ text: "Slapstick Prompt Pack production guide", italics: true, color: "70728A" })],
          spacing: { after: 260 },
        }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: metadata.map(([label, value]) => new TableRow({
            children: [
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: label, bold: true })] })] }),
              new TableCell({ children: [new Paragraph(value)] }),
            ],
          })),
        }),
      ];
      items.forEach((item, index) => {
        children.push(new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun({ text: `${index + 1}. ${item.title}`, bold: true, color: "DF481A" })],
          spacing: { before: 260, after: 100 },
        }));
        item.value.split("\n").forEach((line) => children.push(new Paragraph({ text: line, spacing: { after: 70 } })));
      });
      const document = new Document({ creator: "Slapstick Prompt Pack", sections: [{ properties: {}, children }] });
      const blob = await Packer.toBlob(document);
      const safeTitle = title.replace(/[^a-z0-9]+/gi, "_").replace(/^_+|_+$/g, "") || "Production_Pack";
      saveAs(blob, `${safeTitle}.docx`);
    } finally {
      setIsDownloading(false);
    }
  }

  function saveCurrentPack() {
    if (!pack) return;
    const episodeTitle = pack.find((item) => item.title === "Episode title")?.value || "Untitled Production Pack";
    const saved: SavedProductionPack = {
      id: crypto.randomUUID(),
      episodeTitle,
      createdAt: new Date().toISOString(),
      platform: form.platform,
      videoModel: form.videoModel,
      ratio: form.ratio,
      duration: form.duration,
      form: { ...form, characterBible: characterBibleText(form, characters) },
      pack,
      qualityScore: qualityReport?.score,
    };
    setSavedPacks((current) => [saved, ...current]);
    setSelectedSavedPackId(saved.id);
  }

  function saveVariant(variant: ProductionVariant) {
    const episodeTitle = variant.items.find((item) => item.title === "Episode title")?.value || variant.name;
    const saved: SavedProductionPack = {
      id: crypto.randomUUID(),
      episodeTitle,
      createdAt: new Date().toISOString(),
      platform: form.platform,
      videoModel: form.videoModel,
      ratio: form.ratio,
      duration: form.duration,
      form: { ...form, characterBible: characterBibleText(form, characters) },
      pack: variant.items,
    };
    setSavedPacks((current) => [saved, ...current]);
    setSelectedSavedPackId(saved.id);
  }

  function loadSavedPack(saved: SavedProductionPack) {
    setForm({ ...emptyForm, ...saved.form });
    setPack(saved.pack);
    setGeneratedAt(new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" }).format(new Date(saved.createdAt)));
    setSelectedSavedPackId(saved.id);
  }

  async function generateVariants() {
    if (!pack) return;
    setError("");
    setIsGeneratingVariants(true);
    try {
      if (mode === "demo") {
        setVariants(createDemoVariants(pack));
        return;
      }
      const generationForm = { ...form, characterBible: characterBibleText(form, characters) };
      const currentPack = Object.fromEntries(aiSectionMap.map((section) => [
        section.key,
        pack.find((item) => item.title === section.title)?.value || "",
      ]));
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generateVariants", form: generationForm, pack: currentPack }),
      });
      const data = await response.json() as { error?: string; variants?: Record<string, Record<string, string>> };
      if (!response.ok || !data.variants) throw new Error(data.error || "AI Mode could not generate variants.");
      const definitions: Omit<ProductionVariant, "items">[] = [
        { id: "safeVersion", name: "Safe Version", purpose: "Lowest AI generation error risk, simple motion, strongest continuity." },
        { id: "viralVersion", name: "Viral Version", purpose: "Stronger first second, funnier slapstick, more replayable ending, better social engagement." },
        { id: "cinematicVersion", name: "Cinematic Version", purpose: "Richer visuals, stronger camera language, more polished animated-film feeling." },
      ];
      setVariants(definitions.map((definition) => ({
        ...definition,
        items: variantSectionMap.map((section) => ({
          title: section.title,
          eyebrow: section.eyebrow,
          value: data.variants?.[definition.id]?.[section.key] || "",
        })),
      })));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not generate variants.");
    } finally {
      setIsGeneratingVariants(false);
    }
  }

  async function runAiRepair(action: "fix" | "regenerateSection") {
    if (!pack || mode !== "ai") return;
    setError("");
    setIsInspecting(true);
    try {
      const generationForm = { ...form, characterBible: characterBibleText(form, characters) };
      const currentPack = Object.fromEntries(aiSectionMap.map((section) => [
        section.key,
        pack.find((item) => item.title === section.title)?.value || "",
      ]));
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          form: generationForm,
          pack: currentPack,
          selectedSection: selectedRepairSection,
          qualityReport,
        }),
      });
      const data = await response.json() as {
        error?: string;
        pack?: Record<string, string>;
        updates?: Record<string, string>;
      };
      if (!response.ok) throw new Error(data.error || "AI Mode could not improve the production pack.");
      const changes = action === "fix" ? data.pack : data.updates;
      if (!changes) throw new Error("AI Mode returned no improvements.");
      setPack((current) => current?.map((item) => {
        const section = aiSectionMap.find((candidate) => candidate.title === item.title);
        return section && changes[section.key] ? { ...item, value: changes[section.key] } : item;
      }) || null);
      setGeneratedAt(new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" }).format(new Date()));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "AI Mode could not improve the production pack.");
    } finally {
      setIsInspecting(false);
    }
  }

  const apiKeyMissing = mode === "ai" && /OPENAI_API_KEY|API key missing/i.test(error);
  const engineLabel = mode === "demo"
    ? "Local template engine"
    : apiKeyMissing
      ? "API key missing"
      : error
        ? "AI Mode needs attention"
        : "AI Mode active";
  const engineNote = mode === "demo"
    ? "Demo mode: generated from local templates."
    : apiKeyMissing
      ? "Add OPENAI_API_KEY to .env.local. Demo Mode is still available."
      : error
        ? "Review the message in the setup panel."
        : "AI generation is ready through the secure server route.";

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Slapstick Prompt Pack home">
          <span className="brand-mark" aria-hidden="true">S</span>
          <span>
            <strong>Slapstick</strong>
            <small>PROMPT PACK</small>
          </span>
        </a>
        <div className="engine-status">
          <div className={`local-pill ${mode === "ai" ? "ai-active" : ""} ${apiKeyMissing || error && mode === "ai" ? "needs-attention" : ""}`}><span /> {engineLabel}</div>
          <small>{engineNote}</small>
        </div>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <div className="kicker"><span>✦</span> FROM IDEA TO UPLOAD</div>
          <h1>One tiny idea.<br /><em>A complete cartoon pack.</em></h1>
          <p>Build production-ready prompts, sound cues, captions, titles, and retention beats for your next short—without the blank-page stare.</p>
        </div>
        <div className="hero-stamp" aria-hidden="true">
          <span>23</span>
          <small>assets<br />in one click</small>
        </div>
      </section>

      <div className="workspace">
        <aside className="setup-panel">
          <div className="panel-heading">
            <div>
              <span className="step-label">01 / SET THE SCENE</span>
              <h2>Build your episode</h2>
            </div>
            <button className="demo-button" type="button" onClick={loadDemo}>🍪 Biscuit Demo</button>
          </div>

          <div className="mode-picker" aria-label="Generator mode">
            <button
              className={mode === "demo" ? "active" : ""}
              type="button"
              aria-pressed={mode === "demo"}
              onClick={() => { setMode("demo"); setError(""); }}
            >
              <span>✦</span><strong>Demo Mode</strong><small>Local templates</small>
            </button>
            <button
              className={mode === "ai" ? "active" : ""}
              type="button"
              aria-pressed={mode === "ai"}
              onClick={() => { setMode("ai"); setError(""); }}
            >
              <span>AI</span><strong>AI Mode</strong><small>OpenAI powered</small>
            </button>
          </div>

          <div className="progress-row">
            <span>Setup</span>
            <div className="progress-track"><i style={{ width: `${(progress / 16) * 100}%` }} /></div>
            <b>{progress}/16</b>
          </div>

          <details className="setup-group" open>
            <summary><span><b>Basic Episode Setup</b><small>Characters, prop, trap, and story notes</small></span><i>+</i></summary>
            <div className="setup-group-content form-grid">
              {fields.filter((field) => ["hero", "enemies", "object", "trap"].includes(field.key)).map((field) => (
                <label className="field" key={field.key}>
                  <span>{field.label}</span>
                  <input value={String(form[field.key] ?? "")} onChange={(e) => update(field.key, e.target.value)} placeholder={field.placeholder} />
                </label>
              ))}
              <label className="field field-wide">
                <span>Extra notes <i>optional</i></span>
                <textarea value={form.notes} onChange={(e) => update("notes", e.target.value)} placeholder="Add a location, signature gag, camera idea, or anything the template should know…" />
              </label>
            </div>
          </details>

          <details className="setup-group" open>
            <summary><span><b>Platform &amp; Model Settings</b><small>Format, destination, model, and visual direction</small></span><i>+</i></summary>
            <div className="setup-group-content form-grid">
              {fields.filter((field) => ["duration", "ratio", "platform", "videoModel", "style", "tone"].includes(field.key)).map((field) => (
                <label className="field" key={field.key}>
                  <span>{field.label}</span>
                  <select value={String(form[field.key] ?? "")} onChange={(e) => update(field.key, e.target.value)}>
                    {field.options?.map((option) => <option key={option}>{option}</option>)}
                  </select>
                </label>
              ))}
            </div>
          </details>

          <details className="setup-group">
            <summary><span><b>Music &amp; Sound</b><small>Background score and musical direction</small></span><i>+</i></summary>
            <div className="setup-group-content form-grid">
              <label className="field field-wide">
                <span>Music Direction</span>
                <select value={form.musicDirection} onChange={(e) => update("musicDirection", e.target.value)}>
                  {fields.find((field) => field.key === "musicDirection")?.options?.map((option) => <option key={option}>{option}</option>)}
                </select>
              </label>
              {form.musicDirection === "Custom" && (
                <label className="field field-wide">
                  <span>Describe the music style</span>
                  <input value={form.customMusic} onChange={(e) => update("customMusic", e.target.value)} placeholder="e.g. bouncy pizzicato strings with playful woodwinds" />
                </label>
              )}
            </div>
          </details>

          <details className="setup-group">
            <summary><span><b>Character Vocal Lock</b><small>Dialogue permissions and consistent voice direction</small></span><i>+</i></summary>
            <div className="setup-group-content form-grid">
              <label className="field field-wide">
                <span>Dialogue mode</span>
                <select value={form.dialogueMode} onChange={(e) => update("dialogueMode", e.target.value)}>
                  {["No dialogue", "Character dialogue", "Narrator only", "Narrator + character dialogue"].map((option) => <option key={option}>{option}</option>)}
                </select>
              </label>
              <label className="field field-wide"><span>Hero vocal style</span><input value={form.heroVocalStyle} onChange={(e) => update("heroVocalStyle", e.target.value)} /></label>
              <label className="field field-wide"><span>Enemy vocal style</span><input value={form.enemyVocalStyle} onChange={(e) => update("enemyVocalStyle", e.target.value)} /></label>
              <label className="field field-wide"><span>Narrator vocal style</span><input value={form.narratorVocalStyle} onChange={(e) => update("narratorVocalStyle", e.target.value)} /></label>
              <label className="field field-wide"><span>Vocal lock notes</span><textarea value={form.vocalLockNotes} onChange={(e) => update("vocalLockNotes", e.target.value)} /></label>
            </div>
          </details>

          <details className="setup-group quality-control-panel">
            <summary><span><b>Prompt Quality Control</b><small>Automatic production safeguards and output polish</small></span><i>+</i></summary>
            <div className="setup-group-content">
              <label className="master-toggle">
                <span><b>Enable quality control</b><small>Automatically apply selected safeguards to Demo and AI generation.</small></span>
                <input type="checkbox" checked={form.qualityControlEnabled !== false} onChange={(event) => updateBoolean("qualityControlEnabled", event.target.checked)} />
              </label>
              <div className={`quality-toggle-grid ${form.qualityControlEnabled === false ? "disabled" : ""}`}>
                {qualityControlOptions.map((option) => (
                  <label key={option.key}>
                    <input
                      type="checkbox"
                      disabled={form.qualityControlEnabled === false}
                      checked={form[option.key] !== false}
                      onChange={(event) => updateBoolean(option.key, event.target.checked)}
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
              <label className="field quality-notes">
                <span>Additional quality notes <i>optional</i></span>
                <textarea
                  disabled={form.qualityControlEnabled === false}
                  value={form.additionalQualityNotes}
                  onChange={(event) => update("additionalQualityNotes", event.target.value)}
                  placeholder="e.g. always keep action readable, no chaos in background, no random camera jumps"
                />
              </label>
            </div>
          </details>

          <details className="library-panel">
            <summary>
              <span><b>Character Library / Brand Bible</b><small>{characters.length} saved character{characters.length === 1 ? "" : "s"}</small></span>
              <i>+</i>
            </summary>
            <div className="library-content">
              <p className="library-note">Build production-ready recurring characters with stable identities, voices, colors, movement, and continuity rules. Demo Mode uses professional local templates; AI Mode uses the secure server route.</p>
              {characters.length > 0 && (
                <div className="saved-list">
                  {characters.map((profile) => (
                    <button
                      className={characterDraft.id === profile.id ? "selected" : ""}
                      key={profile.id}
                      type="button"
                      onClick={() => setCharacterDraft(profile)}
                    >
                      <b>{profile.shortName}</b><small>{profile.role} · {profile.fullIdentity}</small>
                    </button>
                  ))}
                  <button type="button" onClick={() => setCharacterDraft(emptyCharacter)}><b>+ New character</b><small>Start a blank profile</small></button>
                </div>
              )}
              <div className="library-grid">
                <label className="field"><span>Short name</span><input value={characterDraft.shortName} onChange={(e) => setCharacterDraft((current) => ({ ...current, shortName: e.target.value }))} placeholder="Biscuit" /></label>
                <label className="field"><span>Role</span><select value={characterDraft.role} onChange={(e) => setCharacterDraft((current) => ({ ...current, role: e.target.value }))}>{["Hero", "Enemy", "Friend", "Narrator", "Supporting character", "Custom"].map((role) => <option key={role}>{role}</option>)}</select></label>
                <label className="field field-wide"><span>Full identity</span><input value={characterDraft.fullIdentity} onChange={(e) => setCharacterDraft((current) => ({ ...current, fullIdentity: e.target.value }))} placeholder="Biscuit the Orange Squirrel" /></label>
                <div className="character-ai-controls field-wide">
                  <div>
                    <b>AI-assisted character builder</b>
                    <small>Choose how suggestions are inserted, then generate one field or the full bible.</small>
                  </div>
                  <div className="suggestion-mode" role="group" aria-label="Character suggestion insertion mode">
                    {(["replace", "append"] as CharacterSuggestionMode[]).map((option) => (
                      <button
                        className={characterSuggestionMode === option ? "selected" : ""}
                        key={option}
                        type="button"
                        onClick={() => setCharacterSuggestionMode(option)}
                      >
                        {option === "replace" ? "Replace current text" : "Append to current text"}
                      </button>
                    ))}
                  </div>
                  <button
                    className="generate-bible-button"
                    type="button"
                    disabled={suggestingCharacterField !== null}
                    onClick={() => suggestCharacter()}
                  >
                    {suggestingCharacterField === "all" ? "Generating Full Bible…" : "✦ Generate Full Character Bible"}
                  </button>
                </div>
                {characterSuggestionFields.map(({ key, label }) => (
                  <div className="field field-wide character-lock-field" key={key}>
                    <span>
                      {label}
                      <button
                        type="button"
                        disabled={suggestingCharacterField !== null}
                        onClick={() => suggestCharacter(key)}
                      >
                        {suggestingCharacterField === key ? "Suggesting…" : "✦ AI Suggest"}
                      </button>
                    </span>
                    <textarea
                      value={characterDraft[key]}
                      onChange={(e) => setCharacterDraft((current) => ({ ...current, [key]: e.target.value }))}
                      placeholder={`Generate or describe the ${label.toLowerCase()} for this character…`}
                    />
                  </div>
                ))}
              </div>
              {characterSuggestionStatus && <p className="character-suggestion-success" role="status">✓ {characterSuggestionStatus}</p>}
              {characterSuggestionError && <p className="character-suggestion-error" role="alert">! {characterSuggestionError}</p>}
              <div className="library-actions">
                <button type="button" onClick={saveCharacter}>{characterDraft.id ? "Update Character" : "Save Character"}</button>
                <button type="button" disabled={!characterDraft.id} onClick={deleteCharacter}>Delete Character</button>
                <button type="button" onClick={() => loadCharacter("hero")}>Load into Hero</button>
                <button type="button" onClick={() => loadCharacter("enemies")}>Load into Enemies</button>
              </div>
              <div className="import-actions">
                <button type="button" onClick={() => downloadJson({ characters, projectPresets: projectPresets.filter((preset) => !preset.builtIn) }, "slapstick_prompt_pack_character_library.json")}>Export Character Library</button>
                <button type="button" onClick={() => characterImportRef.current?.click()}>Import Character Library</button>
                <input ref={characterImportRef} hidden type="file" accept="application/json,.json" onChange={(event) => importJson(event, "characters")} />
              </div>
            </div>
          </details>

          <details className="library-panel">
            <summary>
              <span><b>Project Presets</b><small>{projectPresets.length} available setup{projectPresets.length === 1 ? "" : "s"}</small></span>
              <i>+</i>
            </summary>
            <div className="library-content">
              <label className="field">
                <span>Project name</span>
                <input value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="My next cartoon short" />
              </label>
              <button className="primary-library-button" type="button" onClick={saveProjectPreset}>Save Current Setup as Project Preset</button>
              <label className="field">
                <span>Saved project preset</span>
                <select value={selectedPresetId} onChange={(e) => setSelectedPresetId(e.target.value)}>
                  {projectPresets.map((preset) => <option key={preset.id} value={preset.id}>{preset.name}{preset.builtIn ? " · Built in" : ""}</option>)}
                </select>
              </label>
              <div className="library-actions">
                <button type="button" onClick={loadProjectPreset}>Load Project Preset</button>
                <button type="button" disabled={projectPresets.find((preset) => preset.id === selectedPresetId)?.builtIn} onClick={deleteProjectPreset}>Delete Project Preset</button>
              </div>
              <div className="import-actions">
                <button type="button" onClick={() => downloadJson({ characters, projectPresets: projectPresets.filter((preset) => !preset.builtIn) }, "slapstick_prompt_pack_project_presets.json")}>Export Project Presets</button>
                <button type="button" onClick={() => projectImportRef.current?.click()}>Import Project Presets</button>
                <input ref={projectImportRef} hidden type="file" accept="application/json,.json" onChange={(event) => importJson(event, "projects")} />
              </div>
            </div>
          </details>

          <details className="library-panel">
            <summary>
              <span><b>Saved Production Packs</b><small>{savedPacks.length} stored locally in this browser</small></span>
              <i>+</i>
            </summary>
            <div className="library-content">
              <p className="library-note">Saved packs are stored locally in this browser.</p>
              <div className="compact-pack-filters">
                <input value={packSearch} onChange={(event) => setPackSearch(event.target.value)} placeholder="Search by title…" />
                <select value={platformFilter} onChange={(event) => setPlatformFilter(event.target.value)}>
                  <option>All platforms</option>
                  {[...new Set(savedPacks.map((saved) => saved.platform))].map((platform) => <option key={platform}>{platform}</option>)}
                </select>
                <select value={modelFilter} onChange={(event) => setModelFilter(event.target.value)}>
                  <option>All models</option>
                  {[...new Set(savedPacks.map((saved) => saved.videoModel))].map((model) => <option key={model}>{model}</option>)}
                </select>
              </div>
              <div className="compact-saved-list">
                {filteredSavedPacks.map((saved) => (
                  <article key={saved.id}>
                    <b>{saved.episodeTitle}</b>
                    <small>{saved.platform} · {saved.ratio}{saved.qualityScore !== undefined ? ` · ${saved.qualityScore}/100` : ""}</small>
                    <div>
                      <button type="button" onClick={() => loadSavedPack(saved)}>Load Pack</button>
                      <button type="button" onClick={() => setSavedPacks((current) => current.filter((item) => item.id !== saved.id))}>Delete</button>
                      <CopyButton label="Copy" value={saved.pack.map((item) => `${item.title}\n${item.value}`).join("\n\n")} />
                    </div>
                  </article>
                ))}
                {!filteredSavedPacks.length && <p className="library-note">No saved packs match these filters.</p>}
              </div>
            </div>
          </details>

          <button className="generate-button" disabled={!isReady || isGenerating} onClick={generate} type="button">
            <span>{isGenerating ? "Creating with AI…" : "Generate Production Pack"}</span>
            <b className={isGenerating ? "spinner" : ""} aria-hidden="true">{isGenerating ? "" : "→"}</b>
          </button>
          {!isReady && <p className="form-hint">Add the four story ingredients above to generate.</p>}
          {error && <div className="error-message" role="alert"><span>!</span><p>{error}</p></div>}
        </aside>

        <section className={`output-panel ${pack ? "has-pack" : ""}`} ref={outputRef}>
          {!pack ? (
            <div className="empty-state">
              <div className="empty-orbit">
                <span>✦</span><i /><i /><i />
              </div>
              <span className="step-label">02 / CREATE THE CHAOS</span>
              <h2>Your production pack<br />will land here.</h2>
              <p>Fill the scene, choose your style, and press generate. You’ll get 23 ready-to-copy creative assets.</p>
              <div className="empty-tags">
                <span>Visual prompts</span><span>Audio plan</span><span>Social copy</span>
              </div>
            </div>
          ) : (
            <>
              <div className="results-heading">
                <div>
                  <span className="step-label">02 / READY FOR PRODUCTION</span>
                  <h2>Your production pack</h2>
                  <div className="quality-badge">✦ Premium Prompt Mode: continuity-safe, detailed, and production-ready.</div>
                  <p>23 assets generated at {generatedAt} · {form.duration} · {form.ratio} · {form.platform} · {form.videoModel}</p>
                </div>
                <div className="results-actions">
                  <CopyButton
                    fullPack
                    value={fullPackText}
                  />
                  <button className="save-pack-button" type="button" onClick={saveCurrentPack}>Save Pack</button>
                  <button className="variant-button" disabled={isGeneratingVariants} type="button" onClick={generateVariants}>
                    {isGeneratingVariants ? "Generating variants…" : "Generate 3 Variants"}
                  </button>
                  <button className="download-button" disabled={isDownloading} type="button" onClick={downloadWordPack}>
                    {isDownloading ? "Preparing Word Pack…" : "Download Word Pack"}
                  </button>
                  <button className="regenerate-button" disabled={isGenerating} type="button" onClick={generate}>
                    {isGenerating ? "Generating…" : "↻ Regenerate"}
                  </button>
                </div>
              </div>
              <div className="platform-launcher">
                <div>
                  <span className="step-label">SEND TO AI PLATFORM</span>
                  <h3>Move from prompt to generation</h3>
                  <p>Copy the prompt, open your selected AI platform, paste it into the generator, then upload your start/end frames if the platform supports frame-based generation.</p>
                </div>
                <div className="launcher-links">
                  {launchersForModel(form.videoModel).map((launcher) => (
                    <a key={launcher.url} href={launcher.url} target="_blank" rel="noreferrer">{launcher.label} ↗</a>
                  ))}
                </div>
                <div className="prompt-helpers">
                  <CopyButton label="Copy Start-frame Prompt" value={pack.find((item) => item.title === "Start-frame image prompt")?.value || ""} />
                  <CopyButton label="Copy End-frame Prompt" value={pack.find((item) => item.title === "End-frame image prompt")?.value || ""} />
                  <CopyButton label="Copy Selected Model Prompt" value={pack.find((item) => item.title === "Selected Model Prompt")?.value || ""} />
                  <CopyButton label="Copy Main Video Prompt" value={pack.find((item) => item.title === "Main video prompt")?.value || ""} />
                  <CopyButton label="Copy Full Pack" value={fullPackText} />
                </div>
              </div>
              <div className="cards">
                {pack.map((item, index) => (
                  <article className="result-card" key={item.title}>
                    <div className="card-top">
                      <div>
                        <span className="card-index">{String(index + 1).padStart(2, "0")}</span>
                        <span className="card-eyebrow">{item.eyebrow}</span>
                      </div>
                      <CopyButton value={item.value} />
                    </div>
                    <h3>{item.title}</h3>
                    <p>{item.value}</p>
                  </article>
                ))}
              </div>
              {variants.length > 0 && (
                <section className="variants-section">
                  <div className="variants-heading">
                    <div>
                      <span className="step-label">THREE CREATIVE DIRECTIONS</span>
                      <h2>Production Pack Variants</h2>
                    </div>
                    <button type="button" disabled={isGeneratingVariants} onClick={generateVariants}>↻ Regenerate all three</button>
                  </div>
                  <div className="variant-grid">
                    {variants.map((variant) => (
                      <article className={`variant-card ${variant.id}`} key={variant.id}>
                        <span>{variant.name.replace(" Version", "").toUpperCase()}</span>
                        <h3>{variant.name}</h3>
                        <p>{variant.purpose}</p>
                        <div className="variant-actions">
                          <CopyButton label="Copy Variant" value={variantText(variant)} />
                          <button type="button" onClick={() => saveVariant(variant)}>Save Variant</button>
                          <button
                            type="button"
                            disabled={isDownloading}
                            onClick={() => downloadCollectionWord(variant.items, `${variant.items[0]?.value || variant.name} — ${variant.name}`, [
                              ["Variant", variant.name],
                              ["Purpose", variant.purpose],
                              ["Platform", form.platform],
                              ["AI video model", form.videoModel],
                              ["Ratio", form.ratio],
                              ["Duration", form.duration],
                            ])}
                          >
                            Download Variant as Word
                          </button>
                        </div>
                        <details>
                          <summary>View variant production pack <i>+</i></summary>
                          <div>
                            {variant.items.map((item) => (
                              <section key={item.title}><b>{item.title}</b><p>{item.value}</p></section>
                            ))}
                          </div>
                        </details>
                      </article>
                    ))}
                  </div>
                </section>
              )}
              {qualityReport && (
                <section className="quality-inspector">
                  <div className="inspector-heading">
                    <div>
                      <span className="step-label">ERROR PREVENTION ENGINE</span>
                      <h2>Prompt Quality Inspector</h2>
                      <p>Use the Prompt Quality Inspector before sending prompts to OpenArt, Higgsfield, Runway, Google Flow, or PixVerse.</p>
                    </div>
                    <CopyButton label="Copy Inspector Result" value={qualityReportText(qualityReport)} />
                  </div>
                  <div className="score-card">
                    <div className={`score-ring score-${qualityReport.score >= 90 ? "excellent" : qualityReport.score >= 75 ? "good" : qualityReport.score >= 50 ? "review" : "risk"}`}>
                      <strong>{qualityReport.score}</strong><small>/ 100</small>
                    </div>
                    <div>
                      <span>QUALITY STATUS</span>
                      <h3>{qualityReport.label}</h3>
                      <div className="score-track"><i style={{ width: `${qualityReport.score}%` }} /></div>
                    </div>
                  </div>
                  <div className="inspection-columns">
                    <div className="inspection-list passed">
                      <h3>Passed checks <span>{qualityReport.passed.length}</span></h3>
                      {qualityReport.passed.map((item) => <p key={item}><b>✓</b>{item}</p>)}
                    </div>
                    <div className="inspection-list warnings">
                      <h3>Warnings <span>{qualityReport.warnings.length}</span></h3>
                      {qualityReport.warnings.length
                        ? qualityReport.warnings.map((item) => <p key={item}><b>!</b>{item}</p>)
                        : <p><b>✓</b>No warnings detected.</p>}
                    </div>
                    <div className="inspection-list fixes">
                      <h3>Fix suggestions <span>{qualityReport.suggestions.length}</span></h3>
                      {qualityReport.suggestions.length
                        ? qualityReport.suggestions.map((item) => <p key={item}><b>→</b>{item}</p>)
                        : <p><b>✓</b>No fixes needed.</p>}
                    </div>
                  </div>
                  <div className="repair-controls">
                    <button
                      className="ai-fix-button"
                      type="button"
                      disabled={mode !== "ai" || isInspecting}
                      onClick={() => runAiRepair("fix")}
                    >
                      {isInspecting ? "Improving pack…" : "Fix Issues with AI"}
                    </button>
                    <div className="section-repair">
                      <select value={selectedRepairSection} onChange={(event) => setSelectedRepairSection(event.target.value)}>
                        <option value="start-frame">Start-frame prompt</option>
                        <option value="end-frame">End-frame prompt</option>
                        <option value="main-video">Main video prompt</option>
                        <option value="selected-model">Selected Model Prompt</option>
                        <option value="music-path">Music Path by Seconds</option>
                        <option value="sfx-timeline">Sound Effects Timeline by Seconds</option>
                        <option value="captions">Captions</option>
                        <option value="youtube-metadata">YouTube metadata</option>
                      </select>
                      <button type="button" disabled={mode !== "ai" || isInspecting} onClick={() => runAiRepair("regenerateSection")}>
                        Regenerate Selected Section
                      </button>
                    </div>
                    {mode !== "ai" && <small>Switch to AI Mode to repair weak sections. Demo Mode inspection remains fully local.</small>}
                  </div>
                </section>
              )}
              <section className="saved-packs-section">
                <div className="saved-packs-heading">
                  <div>
                    <span className="step-label">LOCAL PRODUCTION ARCHIVE</span>
                    <h2>Saved Production Packs</h2>
                    <p>Saved packs are stored locally in this browser.</p>
                  </div>
                  {pack && <button type="button" onClick={saveCurrentPack}>+ Save Current Pack</button>}
                </div>
                <div className="pack-filters">
                  <input value={packSearch} onChange={(event) => setPackSearch(event.target.value)} placeholder="Search by title…" />
                  <select value={platformFilter} onChange={(event) => setPlatformFilter(event.target.value)}>
                    <option>All platforms</option>
                    {[...new Set(savedPacks.map((saved) => saved.platform))].map((platform) => <option key={platform}>{platform}</option>)}
                  </select>
                  <select value={modelFilter} onChange={(event) => setModelFilter(event.target.value)}>
                    <option>All models</option>
                    {[...new Set(savedPacks.map((saved) => saved.videoModel))].map((model) => <option key={model}>{model}</option>)}
                  </select>
                </div>
                {filteredSavedPacks.length ? (
                  <div className="saved-pack-list">
                    {filteredSavedPacks.map((saved) => (
                      <article className={selectedSavedPackId === saved.id ? "selected" : ""} key={saved.id}>
                        <div className="saved-pack-info">
                          <span>{new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(saved.createdAt))}</span>
                          <h3>{saved.episodeTitle}</h3>
                          <p>{saved.platform} · {saved.videoModel} · {saved.ratio} · {saved.duration}{saved.qualityScore !== undefined ? ` · Quality ${saved.qualityScore}/100` : ""}</p>
                        </div>
                        <div className="saved-pack-actions">
                          <button type="button" onClick={() => loadSavedPack(saved)}>Load Pack</button>
                          <button type="button" onClick={() => setSavedPacks((current) => current.filter((item) => item.id !== saved.id))}>Delete Pack</button>
                          <button
                            type="button"
                            disabled={isDownloading}
                            onClick={() => downloadCollectionWord(saved.pack, `${saved.episodeTitle} Production Pack`, [
                              ["Date created", new Date(saved.createdAt).toLocaleString()],
                              ["Target platform", saved.platform],
                              ["AI video model", saved.videoModel],
                              ["Video ratio", saved.ratio],
                              ["Video duration", saved.duration],
                              ["Quality score", saved.qualityScore !== undefined ? `${saved.qualityScore}/100` : "Not available"],
                            ])}
                          >
                            Export Saved Pack as Word
                          </button>
                          <CopyButton label="Copy Saved Pack" value={saved.pack.map((item, index) => `${index + 1}. ${item.title.toUpperCase()}\n${item.value}`).join("\n\n")} />
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="saved-empty">No saved packs match these filters yet.</div>
                )}
              </section>
              <div className="pack-footer">
                <span>That’s a wrap.</span>
                <p>Copy, customize, create—and let the chaos begin.</p>
                <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>Back to setup ↑</button>
              </div>
            </>
          )}
        </section>
      </div>
      <footer>SLAPSTICK PROMPT PACK <span>•</span> MADE FOR CARTOON CREATORS</footer>
    </main>
  );
}
